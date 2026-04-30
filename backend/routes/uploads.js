const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { verifyToken } = require("../middleware/authMiddleware");

const router = express.Router();
const uploadDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP, and GIF images are allowed"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post("/image", verifyToken, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

res.status(201).json({
  message: "Image uploaded successfully",
  image_url: imageUrl
});
});

module.exports = router;
