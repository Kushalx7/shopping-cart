const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

// Admin: view all users
router.get("/users", verifyToken, checkRole(["admin"]), (req, res) => {
  db.query(
    "SELECT id, full_name, email, phone, role, profile_photo, created_at FROM users ORDER BY created_at DESC",
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      res.json(results);
    }
  );
});

// Admin: view all products
router.get("/products", verifyToken, checkRole(["admin"]), (req, res) => {
  db.query(
    `SELECT 
        products.id,
        products.name,
        products.description,
        products.price,
        products.stock,
        products.discount_percent,
        products.image_url,
        products.created_at,
        users.full_name AS shop_owner_name,
        users.email AS shop_owner_email
     FROM products
     LEFT JOIN users ON products.shop_owner_id = users.id
     ORDER BY products.created_at DESC`,
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      res.json(results);
    }
  );
});

// Admin: update product price, stock, discount
router.put("/products/:productId", verifyToken, checkRole(["admin"]), (req, res) => {
  const { productId } = req.params;
  const { name, price, stock, discount_percent } = req.body;

  const discount = Number(discount_percent || 0);

  if (!name || price === "" || stock === "") {
    return res.status(400).json({
      message: "Product name, price, and stock are required",
    });
  }

  if (Number(price) < 0) {
    return res.status(400).json({ message: "Price cannot be negative" });
  }

  if (Number(stock) < 0) {
    return res.status(400).json({ message: "Stock cannot be negative" });
  }

  if (discount < 0 || discount > 100) {
    return res.status(400).json({
      message: "Discount must be between 0 and 100",
    });
  }

  db.query(
    `UPDATE products
     SET name = ?, price = ?, stock = ?, discount_percent = ?
     WHERE id = ?`,
    [name, price, stock, discount, productId],
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Product update failed",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ message: "Product updated successfully" });
    }
  );
});

// Admin: view all orders
router.get("/orders", verifyToken, checkRole(["admin"]), (req, res) => {
  db.query(
    `SELECT 
        orders.id AS order_id,
        users.full_name AS customer_name,
        users.email AS customer_email,
        orders.total_amount,
        orders.payment_method,
        orders.status,
        orders.created_at
     FROM orders
     JOIN users ON orders.user_id = users.id
     ORDER BY orders.created_at DESC`,
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      res.json(results);
    }
  );
});

// Admin: update order status
router.put("/orders/:orderId/status", verifyToken, checkRole(["admin"]), (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const allowedStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid order status" });
  }

  db.query("SELECT id, status FROM orders WHERE id = ?", [orderId], (findErr, orders) => {
    if (findErr) {
      return res.status(500).json({
        message: "Database error",
        error: findErr.message,
      });
    }

    if (orders.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, orderId],
      (updateErr) => {
        if (updateErr) {
          return res.status(500).json({
            message: "Order status update failed",
            error: updateErr.message,
          });
        }

        res.json({ message: "Order status updated successfully" });
      }
    );
  });
});

// Admin: view one user's order history
router.get("/users/:userId/orders", verifyToken, checkRole(["admin"]), (req, res) => {
  const { userId } = req.params;

  db.query(
    `SELECT 
        orders.id AS order_id,
        orders.total_amount,
        orders.payment_method,
        orders.status,
        orders.created_at
     FROM orders
     WHERE orders.user_id = ?
     ORDER BY orders.created_at DESC`,
    [userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          message: "Database error",
          error: err.message,
        });
      }

      res.json(results);
    }
  );
});

// Admin: update user details and role
router.put("/users/:userId", verifyToken, checkRole(["admin"]), (req, res) => {
  const { userId } = req.params;
  const { full_name, email, phone, role, profile_photo } = req.body;
  const allowedRoles = ["user", "admin", "shop_owner"];

  if (!full_name || !email || !phone || !role) {
    return res.status(400).json({
      message: "Full name, email, phone, and role are required",
    });
  }

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  db.query(
    "SELECT id FROM users WHERE (email = ? OR phone = ?) AND id <> ?",
    [email, phone, userId],
    (duplicateErr, duplicates) => {
      if (duplicateErr) {
        return res.status(500).json({
          message: "Database error",
          error: duplicateErr.message,
        });
      }

      if (duplicates.length > 0) {
        return res.status(400).json({
          message: "Email or phone already exists",
        });
      }

      db.query(
        `UPDATE users
         SET full_name = ?, email = ?, phone = ?, role = ?, profile_photo = ?
         WHERE id = ?`,
        [full_name, email, phone, role, profile_photo || null, userId],
        (err) => {
          if (err) {
            return res.status(500).json({
              message: "User update failed",
              error: err.message,
            });
          }

          res.json({ message: "User updated successfully" });
        }
      );
    }
  );
});

// Admin: delete a user
router.delete("/users/:userId", verifyToken, checkRole(["admin"]), (req, res) => {
  const { userId } = req.params;

  if (Number(req.user.id) === Number(userId)) {
    return res.status(400).json({
      message: "You cannot delete your own admin account",
    });
  }

  db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
    if (err) {
      return res.status(500).json({
        message: "User delete failed",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  });
});

module.exports = router;