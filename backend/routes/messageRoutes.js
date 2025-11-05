// routes/messageRoutes.js
const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const Chat = require("../models/Chat");

function requireUser(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

// Get all messages for a chat
router.get("/:chatId", requireUser, async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load messages" });
  }
});

// Add message to a chat
router.post("/:chatId", requireUser, async (req, res) => {
  try {
    const { text, sender } = req.body;
    const msg = await Message.create({
      chatId: req.params.chatId,
      sender,
      text,
    });
    await Chat.findByIdAndUpdate(req.params.chatId, { lastMessage: text, updatedAt: new Date() });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: "Failed to save message" });
  }
});

module.exports = router;
