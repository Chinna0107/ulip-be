const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// GET setting by key
router.get('/:key', async (req, res) => {
  const { key } = req.params;

  try {
    const result = await pool.query("SELECT value FROM settings WHERE key = $1", [key]);
    if (result.rows.length > 0) {
      res.json({ key, value: result.rows[0].value });
    } else {
      res.json({ key, value: null });
    }
  } catch (error) {
    console.error("GET setting error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT setting by key (Create or Update)
router.put('/:key', async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  try {
    // Upsert (Insert or Update)
    const result = await pool.query(
      `INSERT INTO settings (key, value, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE 
       SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
       RETURNING key, value`,
      [key, value]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("PUT setting error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
