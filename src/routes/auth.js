const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'ulip-super-secret-key';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    // Admin bypass for testing
    if (email === 'admin@ulip.com' && password === 'password') {
      const token = jwt.sign({ id: 1, email: 'admin@ulip.com' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, message: "Login successful" });
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = bcrypt.compareSync(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: "Login successful" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
