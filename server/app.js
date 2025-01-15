const express = require("express");
const db = require("./database");
const path = require("path");
const child_process = require("child_process");

const app = express();

// Middleware
app.use(express.json());

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

// Function to get version from Git
function getVersionFromGit() {
  try {
    const version = child_process
      .execSync("git describe --tags", { cwd: __dirname })
      .toString()
      .trim();
    return version;
  } catch (error) {
    console.error("Error fetching version:", error.message);
    return "Unknown";
  }
}

// Fetch the version
const INJECTLY_VERSION = getVersionFromGit();

// Endpoint to expose version
app.get("/version", (req, res) => {
  res.json({ version: INJECTLY_VERSION });
});

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
      SELECT s.id, s.name, s.content, s.created_at, s.updated_at,
             GROUP_CONCAT(JSON_OBJECT(
               'id', st.id,
               'domain', st.domain
             )) AS assignedSites
      FROM scripts s
      LEFT JOIN script_sites ss ON s.id = ss.script_id
      LEFT JOIN sites st ON ss.site_id = st.id
      GROUP BY s.id
    `
    )
    .all();

  // Parse the `assignedSites` JSON data for each script
  const parsedScripts = scripts.map((script) => {
    return {
      ...script,
      assignedSites: script.assignedSites
        ? JSON.parse(`[${script.assignedSites}]`)
        : [],
    };
  });

  res.json(parsedScripts);
});

// Fetch a specific script
app.get("/scripts/:id", (req, res) => {
  const { id } = req.params;
  const script = db.prepare("SELECT * FROM scripts WHERE id = ?").get(id);

  if (!script) {
    return res.status(404).json({ error: "Script not found." });
  }

  const assignedSites = db
    .prepare(
      `SELECT sites.id, sites.domain 
         FROM sites 
         JOIN script_sites ON sites.id = script_sites.site_id 
         WHERE script_sites.script_id = ?`
    )
    .all(id);

  res.json({ ...script, assignedSites });
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

// Delete a site
app.delete("/sites/:id", (req, res) => {
  const { id } = req.params;

  try {
    // Remove references to this site in script_sites
    const deleteAssociations = db.prepare(
      "DELETE FROM script_sites WHERE site_id = ?"
    );
    deleteAssociations.run(id);

    // Delete the site from the sites table
    const deleteSite = db.prepare("DELETE FROM sites WHERE id = ?");
    deleteSite.run(id);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting site:", error.message);
    res.status(500).json({ error: "Failed to delete site." });
  }
});

// Serve the dynamic injector script
app.get("/inject.js", (req, res) => {
  const referer = req.headers.referer;
  const siteDomain = req.query.site || (referer && new URL(referer).host);

  if (!siteDomain) {
    return res.status(400).send("Site domain not provided.");
  }

  // Check for exact or wildcard match in the database
  const site = db
    .prepare(
      `
        SELECT * FROM sites 
        WHERE domain = ? 
           OR (domain LIKE '%.%' AND ? LIKE REPLACE(domain, '*.', ''))
      `
    )
    .get(siteDomain, siteDomain);

  if (!site) {
    return res.status(404).send(`Site ${siteDomain} not registered.`);
  }

  // Fetch scripts assigned to the site
  const scripts = db
    .prepare(
      `
        SELECT scripts.content 
        FROM scripts 
        JOIN script_sites ON scripts.id = script_sites.script_id 
        WHERE script_sites.site_id = ?
      `
    )
    .all(site.id);

  // Construct the injector script
  const processedScripts = scripts
    .map((script) => {
      const content = script.content.trim();
      if (content.startsWith("<script")) {
        return `
          (function() {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = \`${content}\`;
            const scriptTag = tempDiv.firstChild;
            document.head.appendChild(scriptTag);
          })();
        `;
      } else if (
        content.startsWith("(function()") &&
        content.endsWith("})();")
      ) {
        return content; // Inline IIFE
      } else {
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
      console.log('Injectly: Loading scripts for ${siteDomain}...');
      document.addEventListener('DOMContentLoaded', function() {
        try {
          ${processedScripts}
        } catch (e) {
          console.error('Injectly Error:', e);
        }
      });
    })();
  `;

  res.type("application/javascript");
  res.send(injectorScript);
});

// Serve index.ejs with dynamic script link and version
app.get("/", (req, res) => {
  const host = req.headers.host; // Detect the hostname
  const protocol = req.protocol; // Detect the protocol (http or https)
  const injectScriptURL = `${protocol}://${host}/inject.js`; // Construct the script URL

  res.render("index", {
    injectScriptURL,
    version: INJECTLY_VERSION, // Pass the version to the template
  });
});

// Add a new site
app.post("/sites", (req, res) => {
  const { domain } = req.body;

  try {
    const result = db
      .prepare("INSERT INTO sites (domain) VALUES (?)")
      .run(domain);
    res.json({ id: result.lastInsertRowid, domain });
  } catch (error) {
    res.status(400).json({ error: "Domain already exists or invalid." });
  }
});

// Fetch all sites
app.get("/sites", (req, res) => {
  const sites = db.prepare("SELECT * FROM sites").all();
  res.json(sites);
});

// Assign a script to sites
app.post("/scripts/:id/sites", (req, res) => {
  const { id } = req.params;
  const { siteIds } = req.body; // Array of site IDs

  try {
    // Remove existing site associations for this script
    const deleteStmt = db.prepare(
      "DELETE FROM script_sites WHERE script_id = ?"
    );
    deleteStmt.run(id);

    // Add the new site associations
    const insertStmt = db.prepare(
      "INSERT INTO script_sites (script_id, site_id) VALUES (?, ?)"
    );
    for (const siteId of siteIds) {
      insertStmt.run(id, siteId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating sites:", error.message);
    res.status(500).json({ error: "Failed to update sites." });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
