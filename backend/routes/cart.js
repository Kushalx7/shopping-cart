const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/add", verifyToken, (req, res) => {
  const product_id = Number(req.body.product_id);
  const quantity = Math.max(1, Number(req.body.quantity || 1));
  const user_id = req.user.id;

  if (!product_id) {
    return res.status(400).json({ message: "Product ID is required" });
  }

  db.query("SELECT id, stock FROM products WHERE id = ?", [product_id], (productErr, products) => {
    if (productErr) return res.status(500).json({ message: "Database error", error: productErr.message });
    if (products.length === 0) return res.status(404).json({ message: "Product not found" });

    const stock = Number(products[0].stock || 0);
    if (stock <= 0) return res.status(400).json({ message: "Product is out of stock" });

    db.query(
      "SELECT * FROM cart WHERE user_id = ? AND product_id = ?",
      [user_id, product_id],
      (cartErr, results) => {
        if (cartErr) return res.status(500).json({ message: "Database error", error: cartErr.message });

        const currentQty = results.length > 0 ? Number(results[0].quantity || 0) : 0;
        const nextQty = currentQty + quantity;

        if (nextQty > stock) {
          return res.status(400).json({ message: `Only ${stock} item(s) available in stock` });
        }

        if (results.length > 0) {
          db.query(
            "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?",
            [nextQty, user_id, product_id],
            (err) => {
              if (err) return res.status(500).json({ message: "Update error", error: err.message });
              res.json({ message: "Cart updated" });
            }
          );
        } else {
          db.query(
            "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
            [user_id, product_id, quantity],
            (err) => {
              if (err) return res.status(500).json({ message: "Insert error", error: err.message });
              res.json({ message: "Added to cart" });
            }
          );
        }
      }
    );
  });
});

router.get("/", verifyToken, (req, res) => {
  db.query(
    `SELECT cart.id, cart.product_id, products.name, products.price, products.stock, products.image_url, cart.quantity
     FROM cart
     JOIN products ON cart.product_id = products.id
     WHERE cart.user_id = ?`,
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", error: err.message });
      res.json(results);
    }
  );
});

router.delete("/remove/:id", verifyToken, (req, res) => {
  db.query("DELETE FROM cart WHERE id = ? AND user_id = ?", [req.params.id, req.user.id], (err) => {
    if (err) return res.status(500).json({ message: "Delete error", error: err.message });
    res.json({ message: "Item removed from cart" });
  });
});

module.exports = router;
