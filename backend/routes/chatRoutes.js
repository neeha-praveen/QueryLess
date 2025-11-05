// routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const authMiddleware = require("../middleware/auth");

// Middleware to ensure user is logged in (adjust based on your auth)
function requireUser(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

router.use(authMiddleware);

// Create new chat
router.post("/", requireUser, async (req, res) => {
  try {
    const newChat = await Chat.create({
      title: req.body.title || "New Chat",
      userId: req.user.id,
    });
    res.json(newChat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create chat" });
  }
});

// Get all chats for current user
router.get("/", requireUser, async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

module.exports = router;
