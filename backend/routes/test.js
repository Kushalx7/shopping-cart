const express = require("express");
const router = express.Router();
const { verifyToken, checkRole } = require("../middleware/authMiddleware");

// Any logged-in user
router.get("/profile", verifyToken, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});

// Only admin
router.get("/admin", verifyToken, checkRole(["admin"]), (req, res) => {
  res.json({
    message: "Welcome Admin"
  });
});

// Only shop owner
router.get("/shop", verifyToken, checkRole(["shop_owner"]), (req, res) => {
  res.json({
    message: "Welcome Shop Owner"
  });
});

module.exports = router;