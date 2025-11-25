const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const axios = require('axios');

router.post('/query', auth, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid messages array" });
    }

    // Extract the last user message as the query
    const lastUserMsg = messages.filter(m => m.role === 'user').pop();
    const query = lastUserMsg?.content || '';

    // Step 1: Get RAG context from vector search
    const ragRes = await axios.post('http://localhost:4000/api/vector/search', {
      query: query,
      topK: 5
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.header('Authorization')
      }
    });

    const context = ragRes.data.results
      .map(r => `• ${r.content}`)
      .join('\n');

    // Step 2: Add context to the system message
    const systemMsg = {
      role: 'system',
      content: `You are QueryLess AI assistant. Answer ONLY using the context given below. If the answer is NOT in the context, respond exactly with:
                "I don't have enough information in the database to answer this."

                ${context}
                Do NOT use prior knowledge or training data. ONLY use the context.`
    };

    // Combine system message with user messages
    const messagesWithContext = [systemMsg, lastUserMsg];

    // Step 3: Send to Ollama with context
    const response = await axios.post('http://localhost:11434/api/chat', {
      model: 'llama3',
      messages: messagesWithContext,
      stream: false
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });

    const answer = response.data?.message?.content;

    if (!answer) {
      return res.status(500).json({ error: "No response from LLM" });
    }

    res.json({
      answer,
      usedContext: ragRes.data.results // Include what context was used
    });

  } catch (err) {
    console.error("LLM error:", err.response?.data || err.message);

    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: "Cannot connect to Ollama. Is it running?" });
    }

    res.status(500).json({
      error: "LLM request failed",
      details: err.message
    });
  }
});

module.exports = router;