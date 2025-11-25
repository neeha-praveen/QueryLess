const axios = require('axios');
const Vector = require('../models/Vector'); // mongoose schema you created

// Helper to query llama3
async function callLlama3(prompt) {
    const response = await axios.post(
        "http://localhost:11434/api/generate",
        {
            model: "llama3",
            prompt,
            stream: false,
        },
        { headers: { "Content-Type": "application/json" } }
    );

    console.log("LLM RAW RESPONSE:", response.data);

    // Ollama ALWAYS returns an array of partials if stream=false
    // Guaranteed good parsing:
    if (typeof response.data.response === "string" && response.data.response.trim().length > 0) {
        return response.data.response.trim();
    }

    // Sometimes Ollama nests the text inside `data`
    if (response.data && response.data.data) {
        return response.data.data.trim();
    }

    return "⚠️ Llama gave no answer";
}



exports.runLLM = async (req, res) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ error: "Missing `query`" });

        // embed the query ---
        const embedResp = await axios.post(
            "http://localhost:11434/api/embeddings",
            { model: "nomic-embed-text", input: query },
            { headers: { "Content-Type": "application/json" } }
        );

        const qEmbedding = embedResp.data.embedding;

        // Retrieve similar vectors (RAG) ---
        const all = await Vector.find({});
        function cosineSim(a, b) {
            let dot = 0, na = 0, nb = 0;
            for (let i = 0; i < a.length; i++) {
                dot += a[i] * b[i];
                na += a[i] * a[i];
                nb += b[i] * b[i];
            }
            return dot / (Math.sqrt(na) * Math.sqrt(nb));
        }

        const scored = all
            .map(v => ({ ...v.toObject(), score: cosineSim(qEmbedding, v.embedding) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);

        const contextText = scored.map(s => `• ${s.content}`).join("\n");

        // Compose Llama3 prompt ---
        const finalPrompt = `
You are a helpful AI assistant inside QueryLess.
Use ONLY the following context when answering:

${contextText}

User question: "${query}"

Answer clearly and only based on the context.
`;

        // Call Llama3 ---
        const llmAnswer = await callLlama3(finalPrompt);

        res.json({
            answer: llmAnswer,
            usedContext: scored
        });

    } catch (err) {
        console.error("LLM Error:", err);
        res.status(500).json({ error: "LLM server error" });
    }
};
