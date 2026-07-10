const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../database');

// Note: In a real app, these endpoints should be protected by an auth middleware
// that verifies the user is an admin. For simplicity, we are assuming
// the frontend guards this or we can add a simple check if needed.

router.get('/', async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, role FROM users ORDER BY id DESC");
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }

  try {
    // Check if user already exists
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const userRole = role || 'user';

    const result = await pool.query(
      "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, hashedPassword, userRole]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;
  try {
    const existing = await pool.query("SELECT * FROM users WHERE email = $1 AND id != $2", [email, id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }
    
    let query = "UPDATE users SET name = $1, email = $2, role = $3";
    let params = [name, email, role || 'user'];
    
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
      query += ", password = $4 WHERE id = $5";
      params.push(hashedPassword, id);
    } else {
      query += " WHERE id = $4";
      params.push(id);
    }
    
    await pool.query(query, params);
    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
