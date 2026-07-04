const express = require('express');
const router = express.Router();
const { pool } = require('../database');

// GET all records and columns for a sheet
router.get('/:sheetName', async (req, res) => {
  const { sheetName } = req.params;

  try {
    const colResult = await pool.query("SELECT columns FROM sheet_columns WHERE sheet_name = $1", [sheetName]);
    let columns = [];
    if (colResult.rows.length > 0 && colResult.rows[0].columns) {
      columns = colResult.rows[0].columns; // JSONB is already parsed by pg
    }

    const recordsResult = await pool.query("SELECT * FROM records WHERE sheet_name = $1 ORDER BY id ASC", [sheetName]);
    const parsedData = recordsResult.rows.map(r => ({
      id: r.id,
      ...r.data
    }));

    res.json({ columns, data: parsedData });
  } catch (error) {
    console.error("GET records error:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST new record
router.post('/:sheetName', async (req, res) => {
  const { sheetName } = req.params;
  const data = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO records (sheet_name, data) VALUES ($1, $2) RETURNING id",
      [sheetName, data]
    );
    res.json({ id: result.rows[0].id, ...data });
  } catch (error) {
    console.error("POST record error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update record
router.put('/:sheetName/:id', async (req, res) => {
  const { id } = req.params;
  const payload = { ...req.body };
  delete payload.id; // Don't save id in data JSON

  try {
    const result = await pool.query(
      "UPDATE records SET data = $1 WHERE id = $2 RETURNING id",
      [payload, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json({ id: parseInt(id), ...payload });
  } catch (error) {
    console.error("PUT record error:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE record
router.delete('/:sheetName/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM records WHERE id = $1 RETURNING id", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    console.error("DELETE record error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
