const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Add Product (ONLY shop_owner)
router.post("/add", verifyToken, checkRole(["shop_owner"]), (req, res) => {
  const { name, description, price, stock, image_url } = req.body;

  if (!name || price === undefined || price === "") {
    return res.status(400).json({ message: "Name and price are required" });
  }

  const productPrice = toNumber(price);
  const productStock = Math.max(0, Math.floor(toNumber(stock)));

  if (productPrice <= 0) {
    return res.status(400).json({ message: "Price must be greater than 0" });
  }

  db.query(
    `INSERT INTO products (shop_owner_id, name, description, price, stock, image_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, name, description || null, productPrice, productStock, image_url || null],
    (err) => {
      if (err) return res.status(500).json({ message: "Database error", error: err.message });
      res.status(201).json({ message: "Product added successfully" });
    }
  );
});

// Get All Products (public)
router.get("/", (req, res) => {
  db.query("SELECT * FROM products ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    res.json(results);
  });
});

// Get Products by Shop Owner
router.get("/my-products", verifyToken, checkRole(["shop_owner"]), (req, res) => {
  db.query(
    "SELECT * FROM products WHERE shop_owner_id = ? ORDER BY id DESC",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", error: err.message });
      res.json(results);
    }
  );
});

module.exports = router;
