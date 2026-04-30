const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);
const isValidPassword = (password) => /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/.test(password);

// SIGNUP API - supports normal users and shop owners.
router.post("/signup", async (req, res) => {
  try {
    const { full_name, email, phone, password, role } = req.body;

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!isValidEmail(email)) return res.status(400).json({ message: "Invalid email format" });
    if (!isValidPhone(phone)) return res.status(400).json({ message: "Invalid phone number" });
    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters, 1 uppercase letter, 1 number, and 1 special character"
      });
    }

    const userRole = role === "shop_owner" ? "shop_owner" : "user";

    db.query(
      "SELECT * FROM users WHERE email = ? OR phone = ?",
      [email, phone],
      async (err, results) => {
        if (err) return res.status(500).json({ message: "Database error", error: err.message });
        if (results.length > 0) return res.status(400).json({ message: "Email or phone already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);

        db.query(
          "INSERT INTO users (full_name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)",
          [full_name, email, phone, hashedPassword, userRole],
          (insertErr) => {
            if (insertErr) return res.status(500).json({ message: "Database insert error", error: insertErr.message });

            return res.status(201).json({
              message: userRole === "shop_owner" ? "Shop owner account registered successfully" : "User registered successfully"
            });
          }
        );
      }
    );
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// LOGIN API
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    if (results.length === 0) return res.status(400).json({ message: "Invalid email or password" });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_photo: user.profile_photo
      }
    });
  });
});

module.exports = router;
