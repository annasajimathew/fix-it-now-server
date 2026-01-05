const Chat = require("../models/chatModel");

// SEND MESSAGE
exports.sendMessage = async (req, res) => {
  const { receiverId, message } = req.body;

  if (!receiverId || !message) {
    return res.status(400).json({ message: "All fields required" });
  }

  const chat = await Chat.create({
    sender: req.user._id,
    receiver: receiverId,
    message
  });

  res.status(201).json(chat);
};

// GET CHAT BETWEEN TWO USERS
exports.getChats = async (req, res) => {
  const { userId } = req.params;

  const chats = await Chat.find({
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id }
    ]
  }).sort({ createdAt: 1 });

  res.json(chats);
};
