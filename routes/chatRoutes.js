const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const Chat = require("../models/chatModel");

/* ================= SEND MESSAGE ================= */
router.post("/", protect, async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    // ❌ worker cannot initiate chat
    if (req.user.role === "worker") {
      const existingChat = await Chat.findOne({
        sender: receiverId,
        receiver: req.user._id
      });

      if (!existingChat) {
        return res.status(403).json({
          message: "Worker cannot initiate chat"
        });
      }
    }

    if (req.user.role === "worker" && !req.user.isApproved) {
      return res.status(403).json({ message: "Worker not approved" });
    }

    const chat = await Chat.create({
      sender: req.user._id,
      receiver: receiverId,
      message,
      deletedBy: [] // reset delete flags
    });

    res.status(201).json(chat);
  } catch {
    res.status(500).json({ message: "Failed to send message" });
  }
});

/* ================= GET CHAT HISTORY ================= */
router.get("/history/:userId", protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ],
      deletedBy: { $ne: req.user._id }
    })
      .populate("sender", "name role")
      .populate("receiver", "name role")
      .sort({ createdAt: 1 });

    // mark messages as read
    await Chat.updateMany(
      {
        sender: req.params.userId,
        receiver: req.user._id,
        isRead: false
      },
      { isRead: true }
    );

    res.json(chats);
  } catch {
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
});

/* ================= WORKER USER LIST ================= */
router.get("/worker/list", protect, async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).json({ message: "Access denied" });
    }

    const workerId = req.user._id;

    const users = await Chat.aggregate([
      {
        $match: {
          receiver: workerId,
          deletedBy: { $ne: workerId }
        }
      },
      {
        // ✅ ensure sender is NOT the worker himself
        $match: {
          sender: { $ne: workerId }
        }
      },
      {
        $group: {
          _id: "$sender",
          unreadCount: {
            $sum: {
              $cond: [{ $eq: ["$isRead", false] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          unreadCount: 1,
          user: {
            name: "$user.name",
            profileImage: "$user.profileImage"
          }
        }
      }
    ]);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/* ================= DELETE CHAT (DELETE FOR ME) ================= */
router.delete("/:userId", protect, async (req, res) => {
  try {
    await Chat.updateMany(
      {
        $or: [
          { sender: req.user._id, receiver: req.params.userId },
          { sender: req.params.userId, receiver: req.user._id }
        ]
      },
      {
        $addToSet: { deletedBy: req.user._id }
      }
    );

    res.json({ message: "Chat deleted for you" });
  } catch {
    res.status(500).json({ message: "Failed to delete chat" });
  }
});

// TOTAL UNREAD COUNT FOR WORKER
router.get("/worker/unread/count", protect, async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).json({ message: "Access denied" });
    }

    const count = await Chat.countDocuments({
      receiver: req.user._id,
      isRead: false,
      deletedBy: { $ne: req.user._id }
    });

    res.json({ unreadCount: count });
  } catch {
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});

// USER UNREAD COUNT (messages from worker)
router.get("/user/unread/count/:workerId", protect, async (req, res) => {
  try {
    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Access denied" });
    }

    const count = await Chat.countDocuments({
      sender: req.params.workerId,
      receiver: req.user._id,
      isRead: false,
      deletedBy: { $ne: req.user._id }
    });

    res.json({ unreadCount: count });
  } catch {
    res.status(500).json({ message: "Failed to fetch unread count" });
  }
});


module.exports = router;
