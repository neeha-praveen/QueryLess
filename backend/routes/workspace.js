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

module.exports = router;
