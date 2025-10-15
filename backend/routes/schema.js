const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/schema/propose
 * body: { prompt: "I want a database for students and their grades" }
 * returns: { schemaDef: {...}, textSummary: "Proposed schema ..." }
 */
router.post('/propose', auth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    const lower = prompt.toLowerCase();
    let schemaDef;

    // --- simple keyword-based templates ---
    if (lower.includes('student') && lower.includes('grade')) {
      schemaDef = {
        tables: [
          {
            name: 'students',
            columns: [
              { name: 'id', type: 'serial', pk: true },
              { name: 'name', type: 'varchar(100)' },
              { name: 'grade', type: 'varchar(5)' },
            ],
          },
        ]
      };
    } else if (lower.includes('employee') || lower.includes('staff')) {
      schemaDef = {
        tables: [
          {
            name: 'employees',
            columns: [
              { name: 'id', type: 'serial', pk: true },
              { name: 'first_name', type: 'varchar(100)', notNull: true },
              { name: 'last_name', type: 'varchar(100)' },
              { name: 'department', type: 'varchar(100)' },
              { name: 'salary', type: 'numeric' }
            ]
          }
        ]
      };
    } else {
      // fallback minimal table
      schemaDef = {
        tables: [
          {
            name: 'items',
            columns: [
              { name: 'id', type: 'serial', pk: true },
              { name: 'name', type: 'varchar(200)' },
              { name: 'description', type: 'text' }
            ]
          }
        ]
      };
    }

    const textSummary = `Proposed ${schemaDef.tables.length} tables: ${schemaDef.tables
      .map(t => t.name)
      .join(', ')}`;

    res.json({ schemaDef, textSummary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
