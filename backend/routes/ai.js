const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Vector = require("../models/Vector");

// LLM + RAG answer endpoint
router.post("/query", auth, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question)
      return res.status(400).json({ error: "Missing question" });

    // run rag search
    const ragRes = await fetch("http://localhost:4000/api/vector/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": req.header("Authorization")
      },
      body: JSON.stringify({
        query: question,
        topK: 5
      })
    });

    const ragData = await ragRes.json();
    const context = ragData.results
      .map(r => `Content: ${r.content}`)
      .join("\n\n");

    // build prompt 
    const prompt = `You are QueryLess AI. Use ONLY the context below to answer the user's question. CONTEXT: ${context} QUESTION: ${question} Provide a helpful, accurate answer. If context is missing, say "I don't have enough information."`;

    // call ollama
    const llmRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral", // or llama3, or any model you installed
        prompt: prompt
      })
    });

    const llmJson = await llmRes.json();

    res.json({
      answer: llmJson.response,
      used_context: ragData.results
    });

  } catch (err) {
    console.error("AI query error", err);
    res.status(500).json({ error: "AI failed" });
  }
});

module.exports = router;
