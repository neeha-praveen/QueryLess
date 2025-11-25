const express = require("express");
const auth = require("../middleware/auth");
const Vector = require("../models/Vector");

const router = express.Router();

// POST /api/vector/add
router.post("/add", auth, async (req, res) => {
  try {
    const { content, embedding, metadata } = req.body;

    if (!content || !embedding) {
      return res.status(400).json({ error: "Missing content or embedding" });
    }

    const doc = await Vector.create({
      content,
      embedding,
      metadata: metadata || {}
    });

    res.json({ success: true, vector: doc });

  } catch (err) {
    console.error("Vector add error", err);
    res.status(500).json({ error: "Failed to save vector" });
  }
});

// POST /api/vector/search
router.post("/search", auth, async (req, res) => {
  try {
    const { query, topK = 5 } = req.body;
    if (!query) return res.status(400).json({ error: "Missing query" });

    // Generate embedding for the query
    const embedRes = await fetch("http://localhost:11434/api/embeddings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nomic-embed-text",
        prompt: query
      })
    });

    const embedData = await embedRes.json();
    if (!embedData.embedding) {
      return res.status(500).json({ error: "Failed to embed query" });
    }

    const queryEmbedding = embedData.embedding;

    // Load ALL stored vectors (later we optimize this)
    const allVectors = await Vector.find({});

    // Compute cosine similarity
    function cosineSim(a, b) {
      const dot = a.reduce((sum, x, i) => sum + x * b[i], 0);
      const magA = Math.sqrt(a.reduce((sum, x) => sum + x * x, 0));
      const magB = Math.sqrt(b.reduce((sum, x) => sum + x * x, 0));
      return dot / (magA * magB);
    }

    const scored = allVectors.map(v => ({
      vector: v,
      score: cosineSim(queryEmbedding, v.embedding)
    }));

    // Sort by score
    scored.sort((a, b) => b.score - a.score);

    // Return top K
    const topMatch = scored.slice(0, topK).map(s => ({
      content: s.vector.content,
      metadata: s.vector.metadata,
      score: s.score
    }));

    res.json({
      results: topMatch
    });

  } catch (err) {
    console.error("Vector search error", err);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
