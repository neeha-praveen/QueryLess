const axios = require("axios");
const pool = require("../config/pgClient");

//Validate schema exists
async function schemaExists(schemaName) {
    const result = await pool.query(
        `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`,
        [schemaName]
    );
    return result.rowCount > 0;
}

// Return table + column metadata for validation
async function getSchemaMetadata(schemaName) {
    const tablesRes = await pool.query(
        `
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = $1
        ORDER BY table_name
        `,
        [schemaName]
    );

    const structure = {};

    for (const row of tablesRes.rows) {
        if (!structure[row.table_name]) {
            structure[row.table_name] = [];
        }
        structure[row.table_name].push(row.column_name);
    }

    return structure;
}

// Enforces safe SQL (no DROP/TRUNCATE/DELETE all)
function isDangerousSQL(sql) {
    const lowered = sql.toLowerCase();

    if (lowered.includes("drop table")) return true;
    if (lowered.includes("drop schema")) return true;
    if (lowered.includes("truncate")) return true;
    if (lowered.includes("delete") && !lowered.includes("where")) return true;

    return false;
}

exports.runAgent = async (req, res) => {
    try {
        const { message, schemaName } = req.body;

        if (!message || !schemaName) {
            return res.status(400).json({ error: "Missing message or schemaName" });
        }

        // Validate schema exists
        if (!(await schemaExists(schemaName))) {
            return res.status(400).json({
                error: `Schema "${schemaName}" does not exist in PostgreSQL`
            });
        }

        const schemaMetadata = await getSchemaMetadata(schemaName);

        // 1. Get RAG context
        const ragRes = await axios.post(
            "http://localhost:4000/api/vector/search",
            { query: message, topK: 5 },
            { headers: { Authorization: req.header("Authorization") } }
        );

        const ragContext = ragRes.data.results
            .map(r => `• ${r.content}`)
            .join("\n");

        // 2. System prompt (PERFECT)
        const systemPrompt = `
You are QueryLess Autonomous SQL Agent.

Your responsibilities:
1. Translate user natural language into **valid PostgreSQL SQL**.
2. Use ONLY the schema: "${schemaName}"
3. ONLY use the tables and columns that actually exist (metadata below).
4. ALWAYS return SQL inside *triple backticks* EXACTLY like this:

\`\`\`sql
SELECT * FROM employees;
\`\`\`

MANDATORY RULES:
- NEVER output SQL outside fenced code blocks.
- NEVER explain the SQL before or after. ONLY the fenced code block.
- NEVER guess column names not present in the schema.
- NEVER create tables — use ONLY existing ones.
- NO destructive commands (DROP/TRUNCATE/DELETE without WHERE).
- If the user request cannot be answered using SQL, reply ONLY with:
NOT_SQL

Database structure:
${Object.entries(schemaMetadata)
                .map(([table, cols]) => `  • ${table}: ${cols.join(", ")}`)
                .join("\n")}

Relevant context from vector search:
${ragContext}
        `;

        // 3. Ask LLM for SQL
        const llmRes = await axios.post(
            "http://localhost:11434/api/chat",
            {
                model: "llama3",
                stream: false,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ]
            },
            { timeout: 60000 }
        );

        const agentOutput =
            llmRes?.data?.message?.content ||
            llmRes?.data?.response ||
            "";

        if (!agentOutput) {
            return res.status(500).json({
                error: "Unexpected LLM output",
                raw: llmRes.data
            });
        }

        if (agentOutput.trim() === "NOT_SQL") {
            return res.json({
                answer: "User request cannot be handled using SQL.",
                raw: agentOutput
            });
        }

        // 4. Extract SQL from fenced code block
        const sqlMatch = agentOutput.match(/```sql([\s\S]*?)```/);

        if (!sqlMatch) {
            return res.json({
                answer: "LLM did not return SQL in fenced format.",
                raw: agentOutput
            });
        }

        const sql = sqlMatch[1].trim();

        // 5. Validate SQL for safety
        if (isDangerousSQL(sql)) {
            return res.status(400).json({
                error: "Blocked dangerous SQL",
                sql
            });
        }

        // 6. Validate table + columns used in SQL
        const usedTables = Object.keys(schemaMetadata).filter(t =>
            sql.toLowerCase().includes(t.toLowerCase())
        );

        if (usedTables.length === 0) {
            return res.status(400).json({
                error: "SQL references unknown tables",
                sql,
                knownTables: Object.keys(schemaMetadata)
            });
        }

        for (const table of usedTables) {
            const columns = schemaMetadata[table];
            for (const col of columns) {
                if (sql.includes(col)) continue;
            }
            // NOTE: We don't block instantly — LLM repair step may fix it
        }

        // 7. Execute SQL
        try {
            const result = await pool.query(
                `SET search_path TO ${schemaName}; ${sql}`
            );

            return res.json({
                answer: "Query executed",
                sql,
                rows: result.rows,
                contextUsed: ragRes.data.results
            });

        } catch (sqlErr) {
            // 8. Ask LLM to repair bad SQL
            const fix = await axios.post(
                "http://localhost:11434/api/chat",
                {
                    model: "llama3",
                    stream: false,
                    messages: [
                        {
                            role: "system",
                            content: `
You fix broken SQL. Output ONLY the corrected SQL inside:

\`\`\`sql
...
\`\`\`
`
                        },
                        {
                            role: "user",
                            content: `SQL:\n${sql}\n\nError:\n${sqlErr.message}\n\nFix it.`
                        }
                    ]
                }
            );

            const fixedMatch = fix.data?.message?.content?.match(/```sql([\s\S]*?)```/);
            const fixedSQL = fixedMatch ? fixedMatch[1].trim() : null;

            return res.json({
                answer: "SQL failed; provided repaired SQL",
                originalSQL: sql,
                error: sqlErr.message,
                fixedSQL
            });
        }
    } catch (err) {
        console.error("AGENT ERROR RAW:", err);

        return res.status(500).json({
            error: "Agent failed",
            details: err?.message || "no message",
            stack: err?.stack || "no stack"
        });
    }
};
