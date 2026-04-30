const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT, // ✅ add port
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // ✅ REQUIRED for Aiven MySQL
  ssl: {
    rejectUnauthorized: false
  }
});

db.connect((error) => {
  if (error) {
    console.error("Database connection failed:", error);
    return;
  }

  console.log("MySQL connected successfully");
});

module.exports = db;