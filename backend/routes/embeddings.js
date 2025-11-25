const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Generate embedding using Ollama
router.post("/", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });

    const response = await fetch("http://localhost:11434/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nomic-embed-text",
        prompt: text
      })
    });

    const data = await response.json();

    if (!data.embedding) {
      return res.status(500).json({ error: "Failed to generate embedding" });
    }

    res.json({ embedding: data.embedding });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
