const express = require('express');
const auth = require('../middleware/auth');
const pool = require('../config/pgClient');
const format = require('pg-format');
const { createSchemaAndTables } = require('../utils/sqlBuilder');

const router = express.Router();

// GET my workspaces
router.get('/', auth, async (req, res) => {
  // user is loaded on req.user by auth middleware
  res.json({ workspaces: req.user.workspaces || [] });
});

/*
  POST /api/workspace/create
  body: {
    name: "students-db",
    schemaDef: { tables: [...] }   // for now assume client sends validated schema JSON
  }
  This endpoint will:
   - create a postgresql schema (namespace) unique to this workspace
   - create tables inside it using sqlBuilder
   - save metadata into user's workspaces array in Mongo
*/
router.post('/create', auth, async (req, res) => {
  try {
    const { name, schemaDef } = req.body;
    if (!name || !schemaDef) return res.status(400).json({ error: 'Missing name or schemaDef' });

    // generate a safe schema name (simple)
    const short = req.user._id.toString().slice(-6);
    const timestamp = Date.now();
    const schemaName = `w_${short}_${timestamp}`; // keep it ASCII, safe

    // create schema and tables (SQL)
    await createSchemaAndTables(pool, schemaName, schemaDef);

    // save metadata in Mongo user doc
    req.user.workspaces.push({
      name,
      schemaName,
      schemaDef
    });
    await req.user.save();

    return res.json({ success: true, schemaName, workspace: req.user.workspaces[req.user.workspaces.length - 1] });
  } catch (err) {
    console.error('create workspace err', err);
    return res.status(500).json({ error: 'Failed to create workspace', details: err.message });
  }
});

// Get all rows of a table
router.get('/:schema/:table', auth, async (req, res) => {
  const { schema, table } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM ${schema}.${table} LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch rows error', err);
    res.status(500).json({ error: err.message });
  }
});

// Insert one row
router.post('/:schema/:table', auth, async (req, res) => {
  const { schema, table } = req.params;
  const body = req.body; // object of column:value
  try {
    const cols = Object.keys(body);
    const vals = Object.values(body);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
      INSERT INTO ${schema}.${table}(${cols.join(', ')})
      VALUES (${placeholders})
      RETURNING *`;
    const result = await pool.query(query, vals);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Insert error', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a row by id
router.put('/:schema/:table/:id', auth, async (req, res) => {
  const { schema, table, id } = req.params;
  const body = req.body;
  try {
    const cols = Object.keys(body);
    const vals = Object.values(body);
    const sets = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const query = `
      UPDATE ${schema}.${table}
      SET ${sets}
      WHERE id = $${cols.length + 1}
      RETURNING *`;
    const result = await pool.query(query, [...vals, id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update error', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete row by id
router.delete('/:schema/:table/:id', auth, async (req, res) => {
  const { schema, table, id } = req.params;
  try {
    await pool.query(`DELETE FROM ${schema}.${table} WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error', err);
    res.status(500).json({ error: err.message });
  }
});

// Get table column names
router.get('/:schema/:table/columns', auth, async (req, res) => {
  const { schema, table } = req.params;
  try {
    const result = await pool.query(
      `SELECT column_name
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [schema, table]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Column fetch error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
