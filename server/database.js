const Database = require("better-sqlite3");
const path = require("path");

// Use environment variable for database file location, fallback to local "data/database.db"
const dbPath =
  process.env.DB_PATH || path.join(__dirname, "data", "database.db");

// Initialize the SQLite database
const db = new Database(dbPath);

// Create the `scripts` table if it doesn't exist
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
