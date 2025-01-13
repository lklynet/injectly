const Database = require("better-sqlite3");
const path = require("path");

// Use the environment variable or default to `/data/database.db`
const dbPath = process.env.DB_PATH || path.join("/data", "database.db");
const db = new Database(dbPath);

// Create the `scripts` table
db.exec(`
  CREATE TABLE IF NOT EXISTS scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
