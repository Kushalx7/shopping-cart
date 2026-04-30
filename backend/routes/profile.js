const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);
const isValidPassword = (password) => /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/.test(password);

const canAccessProfile = (req, userId) => req.user.role === "admin" || Number(req.user.id) === Number(userId);

router.get("/:id", verifyToken, (req, res) => {
  const { id } = req.params;

  if (!canAccessProfile(req, id)) {
    return res.status(403).json({ message: "Access denied" });
  }

  db.query(
    "SELECT id, full_name, email, phone, role, profile_photo, created_at FROM users WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", error: err.message });
      if (results.length === 0) return res.status(404).json({ message: "User not found" });
      res.json(results[0]);
    }
  );
});

router.put("/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, profile_photo, currentPassword, newPassword } = req.body;

  if (!canAccessProfile(req, id)) {
    return res.status(403).json({ message: "Access denied" });
  }

  if (!full_name || !email || !phone) {
    return res.status(400).json({ message: "Full name, email, and phone are required" });
  }

  if (!isValidEmail(email)) return res.status(400).json({ message: "Invalid email format" });
  if (!isValidPhone(phone)) return res.status(400).json({ message: "Invalid phone number" });

  db.query("SELECT * FROM users WHERE id = ?", [id], async (err, users) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    if (users.length === 0) return res.status(404).json({ message: "User not found" });

    db.query(
      "SELECT id FROM users WHERE (email = ? OR phone = ?) AND id <> ?",
      [email, phone, id],
      async (duplicateErr, duplicates) => {
        if (duplicateErr) return res.status(500).json({ message: "Database error", error: duplicateErr.message });
        if (duplicates.length > 0) return res.status(400).json({ message: "Email or phone already exists" });

        let password = users[0].password;

        if (newPassword) {
          if (!currentPassword) return res.status(400).json({ message: "Current password is required" });
          if (!isValidPassword(newPassword)) {
            return res.status(400).json({
              message: "New password must contain at least 6 characters, 1 uppercase letter, 1 number, and 1 special character"
            });
          }

          const isMatch = await bcrypt.compare(currentPassword, users[0].password);
          if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

          password = await bcrypt.hash(newPassword, 10);
        }

        db.query(
          `UPDATE users
           SET full_name = ?, email = ?, phone = ?, profile_photo = ?, password = ?
           WHERE id = ?`,
          [full_name, email, phone, profile_photo || null, password, id],
          (updateErr) => {
            if (updateErr) return res.status(500).json({ message: "Update failed", error: updateErr.message });

            db.query(
              "SELECT id, full_name, email, phone, role, profile_photo FROM users WHERE id = ?",
              [id],
              (selectErr, updated) => {
                if (selectErr) return res.status(500).json({ message: "Profile updated, but reload failed", error: selectErr.message });
                res.json({ message: "Profile updated successfully", user: updated[0] });
              }
            );
          }
        );
      }
    );
  });
});

module.exports = router;
