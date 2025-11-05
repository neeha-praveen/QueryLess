const express = require('express');
const auth = require('../middleware/auth');
const pool = require('../config/pgClient');
const router = express.Router();

router.post('/run', auth, async (req, res) => {
  const { schema, prompt } = req.body;
  if (!schema || !prompt)
    return res.status(400).json({ error: 'Missing schema or prompt' });

  try {
    // ⚠️ Simple keyword-based demo — replace with LLM later
    let sql = '';
    if (/select/i.test(prompt)) {
      sql = `SET search_path TO ${schema}; ${prompt}`;
    }
    else if (/show all employees/i.test(prompt)) {
        await pool.query(`SET search_path TO ${schema}`);
        const result = await pool.query('SELECT * FROM employees');
        return res.json({ rows: result.rows, rowCount: result.rowCount });
    } 
    else if (/add/i.test(prompt) && /employee/i.test(prompt)) {
        const match = prompt.match(/named (\w+) .*salary (\d+)/i);
        if (match)
          sql = `INSERT INTO ${schema}.employees(first_name, salary) VALUES ('${match[1]}', ${match[2]}) RETURNING *;`;
      }

      if (!sql) return res.json({ text: "Sorry, I couldn't understand that." });

      const result = await pool.query(sql);
      res.json({ rows: result.rows, rowCount: result.rowCount });
    } catch (err) {
      console.error('Query run error', err);
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router;
