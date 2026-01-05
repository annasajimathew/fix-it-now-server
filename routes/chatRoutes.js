const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const Chat = require("../models/chatModel");

// SEND MESSAGE
router.post("/", protect, async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    const chat = await Chat.create({
      sender: req.user._id,
      receiver: receiverId,
      message
    });

    res.status(201).json(chat);
  } catch {
    res.status(500).json({ message: "Failed to send message" });
  }
});

// GET CHAT HISTORY BETWEEN TWO USERS
router.get("/:userId", protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id }
      ]
    }).sort({ createdAt: 1 });

    res.json(chats);
  } catch {
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
});

module.exports = router;
