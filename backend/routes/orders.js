const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");

const rollback = (res, message, err, status = 500) => {
  db.rollback(() => {
    res.status(status).json({ message, error: err?.message });
  });
};

// Place Order: stock is reduced immediately after successful purchase.
router.post("/place", verifyToken, (req, res) => {
  const user_id = req.user.id;
  const { payment_method } = req.body;

  if (!payment_method) return res.status(400).json({ message: "Payment method required" });
  if (!["card", "cod"].includes(payment_method)) {
    return res.status(400).json({ message: "Invalid payment method. Use card or cod" });
  }

  db.beginTransaction((txErr) => {
    if (txErr) return res.status(500).json({ message: "Transaction error", error: txErr.message });

    db.query(
      `SELECT cart.product_id, cart.quantity, products.price, products.stock, products.name
       FROM cart
       JOIN products ON cart.product_id = products.id
       WHERE cart.user_id = ?
       FOR UPDATE`,
      [user_id],
      (err, cartItems) => {
        if (err) return rollback(res, "Database error", err);
        if (cartItems.length === 0) return rollback(res, "Cart is empty", null, 400);

        const unavailable = cartItems.find((item) => Number(item.quantity) > Number(item.stock));
        if (unavailable) {
          return rollback(
            res,
            `${unavailable.name} has only ${unavailable.stock} item(s) left`,
            null,
            400
          );
        }

        const total = cartItems.reduce(
          (sum, item) => sum + Number(item.price) * Number(item.quantity),
          0
        );

        db.query(
          "INSERT INTO orders (user_id, total_amount, payment_method, stock_deducted) VALUES (?, ?, ?, 1)",
          [user_id, total, payment_method],
          (orderErr, orderResult) => {
            if (orderErr) return rollback(res, "Order create error", orderErr);

            const order_id = orderResult.insertId;
            const values = cartItems.map((item) => [order_id, item.product_id, item.quantity, item.price]);

            db.query(
              "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ?",
              [values],
              (itemsErr) => {
                if (itemsErr) return rollback(res, "Order items insert error", itemsErr);

                let pendingUpdates = cartItems.length;
                let updateFailed = false;

                cartItems.forEach((item) => {
                  db.query(
                    "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
                    [item.quantity, item.product_id, item.quantity],
                    (stockErr, stockResult) => {
                      if (updateFailed) return;
                      if (stockErr || stockResult.affectedRows === 0) {
                        updateFailed = true;
                        return rollback(res, "Stock update failed", stockErr || new Error("Insufficient stock"));
                      }

                      pendingUpdates -= 1;
                      if (pendingUpdates === 0) {
                        db.query("DELETE FROM cart WHERE user_id = ?", [user_id], (cartErr) => {
                          if (cartErr) return rollback(res, "Cart clear error", cartErr);

                          db.commit((commitErr) => {
                            if (commitErr) return rollback(res, "Commit error", commitErr);
                            res.status(201).json({
                              message: "Order placed successfully. Stock updated.",
                              order_id,
                              total_amount: total,
                              payment_method
                            });
                          });
                        });
                      }
                    }
                  );
                });
              }
            );
          }
        );
      }
    );
  });
});

router.get("/", verifyToken, (req, res) => {
  db.query(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", error: err.message });
      res.json(results);
    }
  );
});

router.get("/shop-owner", verifyToken, (req, res) => {
  if (req.user.role !== "shop_owner") {
    return res.status(403).json({ message: "Access denied. Shop owner only." });
  }

  db.query(
    `SELECT 
        orders.id AS order_id,
        orders.user_id,
        users.full_name AS customer_name,
        users.email AS customer_email,
        products.id AS product_id,
        products.name AS product_name,
        products.image_url AS product_image,
        products.stock AS current_stock,
        order_items.quantity,
        order_items.price,
        orders.total_amount,
        orders.payment_method,
        orders.status,
        orders.stock_deducted,
        orders.created_at
     FROM order_items
     JOIN orders ON order_items.order_id = orders.id
     JOIN products ON order_items.product_id = products.id
     JOIN users ON orders.user_id = users.id
     WHERE products.shop_owner_id = ?
     ORDER BY orders.created_at DESC`,
    [req.user.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error", error: err.message });
      res.json(results);
    }
  );
});

router.put("/status/:orderId", verifyToken, (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (req.user.role !== "shop_owner") {
    return res.status(403).json({ message: "Access denied. Shop owner only." });
  }

  const allowedStatuses = ["pending", "accepted", "packed", "shipped", "delivered", "cancelled"];
  if (!allowedStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });

  db.beginTransaction((txErr) => {
    if (txErr) return res.status(500).json({ message: "Transaction error", error: txErr.message });

    db.query("SELECT status, stock_deducted FROM orders WHERE id = ? FOR UPDATE", [orderId], (err, orders) => {
      if (err) return rollback(res, "Database error", err);
      if (orders.length === 0) return rollback(res, "Order not found", null, 404);

      const previousStatus = orders[0].status;
      const stockDeducted = Number(orders[0].stock_deducted) === 1;

      const finishStatusUpdate = () => {
        db.query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId], (updateErr) => {
          if (updateErr) return rollback(res, "Database error", updateErr);
          db.commit((commitErr) => {
            if (commitErr) return rollback(res, "Commit error", commitErr);
            res.json({ message: "Order status updated successfully" });
          });
        });
      };

      // Stock was already reduced on purchase. If order is cancelled, restore stock once.
      if (status === "cancelled" && previousStatus !== "cancelled" && stockDeducted) {
        db.query(
          `UPDATE products p
           JOIN order_items oi ON oi.product_id = p.id
           SET p.stock = p.stock + oi.quantity
           WHERE oi.order_id = ?`,
          [orderId],
          (restoreErr) => {
            if (restoreErr) return rollback(res, "Stock restore failed", restoreErr);
            db.query("UPDATE orders SET stock_deducted = 0 WHERE id = ?", [orderId], (flagErr) => {
              if (flagErr) return rollback(res, "Stock flag update failed", flagErr);
              finishStatusUpdate();
            });
          }
        );
      } else {
        finishStatusUpdate();
      }
    });
  });
});

module.exports = router;
