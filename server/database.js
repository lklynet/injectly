const Database = require("better-sqlite3");
const path = require("path");
const dbPath = process.env.DB_PATH || path.join("/data", "database.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
    CREATE TABLE IF NOT EXISTS sites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      domain TEXT NOT NULL UNIQUE
    )
  `);

db.exec(`
    CREATE TABLE IF NOT EXISTS script_sites (
      script_id INTEGER NOT NULL,
      site_id INTEGER NOT NULL,
      FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE,
      FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
    )
  `);

module.exports = db;
