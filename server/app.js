const express = require("express");
const db = require("./database");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
// Serve all static files except index.html
app.use((req, res, next) => {
  if (req.path === "/" && req.accepts("html")) {
    next(); // Skip static middleware for "/"
  } else {
    express.static("public")(req, res, next);
  }
});

// Set up EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Add a new script
app.post("/scripts", (req, res) => {
  const { name, content } = req.body;
  const stmt = db.prepare(`
    INSERT INTO scripts (name, content, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  const result = stmt.run(name, content);
  res.json({ id: result.lastInsertRowid });
});

// Fetch all scripts
app.get("/scripts", (req, res) => {
  const scripts = db
    .prepare(
      `
    SELECT id, name, created_at, updated_at 
    FROM scripts
  `
    )
    .all();
  res.json(scripts);
});

// Fetch a specific script
app.get("/scripts/:id", (req, res) => {
  const stmt = db.prepare("SELECT * FROM scripts WHERE id = ?");
  const script = stmt.get(req.params.id);
  res.json(script);
});

// Update a script
app.put("/scripts/:id", (req, res) => {
  const { name, content } = req.body;
  const stmt = db.prepare(`
    UPDATE scripts 
    SET name = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  stmt.run(name, content, req.params.id);
  res.json({ success: true });
});

// Delete a script
app.delete("/scripts/:id", (req, res) => {
  const stmt = db.prepare("DELETE FROM scripts WHERE id = ?");
  stmt.run(req.params.id);
  res.json({ success: true });
});

app.get("/inject.js", (req, res) => {
  const scripts = db.prepare("SELECT content FROM scripts").all();

  const processedScripts = scripts
    .map((script) => {
      const content = script.content.trim();
      if (content.startsWith("<script")) {
        // Handle <script> tags
        return `
            (function() {
              var tempDiv = document.createElement('div');
              tempDiv.innerHTML = \`${content}\`;
              var scriptTag = tempDiv.firstChild;
              document.head.appendChild(scriptTag);
            })();
          `;
      } else if (
        content.startsWith("(function()") &&
        content.endsWith("})();")
      ) {
        // Script is already an IIFE, include as-is
        return content;
      } else {
        // Wrap non-IIFE plain JavaScript
        return `
            (function() {
              ${content}
            })();
          `;
      }
    })
    .join("\n");

  const injectorScript = `
      (function() {
        console.log('Injectly: Loading scripts...');
        try {
          ${processedScripts}
        } catch (e) {
          console.error('Injectly Error:', e);
        }
      })();
    `;

  res.type("application/javascript");
  res.send(injectorScript);
});

// Serve index.ejs with dynamic script link
app.get("/", (req, res) => {
  const host = req.headers.host; // Detect the hostname
  const protocol = req.protocol; // Detect the protocol (http or https)
  const injectScriptURL = `${protocol}://${host}/inject.js`; // Construct the script URL

  res.render("index", { injectScriptURL }); // Pass the script URL to the template
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
