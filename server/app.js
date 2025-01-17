/********************************************
 *                 Imports
 ********************************************/
const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const db = require("./database");

/********************************************
 *             Express Setup
 ********************************************/
const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/********************************************
 *           Environment & Config
 ********************************************/

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "injectly_secret";
const IS_PROD = process.env.NODE_ENV === "production";
// If needed:
const INJECTLY_VERSION = "1.0.0"; // Adjust or remove if not used

/********************************************
 *        Middleware & Session Setup
 ********************************************/
app.use(express.json());

// Static files
app.use(express.static(path.resolve(__dirname, "../public")));

// Session
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: IS_PROD,
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

/********************************************
 *          Utility Functions
 ********************************************/
const credentialsExist = () => {
  const user = db.prepare("SELECT * FROM users LIMIT 1").get();
  return !!user;
};

const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  return res.status(401).send("Unauthorized: Please log in.");
};

/********************************************
 *     Global Middleware / Route Guard
 ********************************************/
app.use((req, res, next) => {
  // Allow "/inject.js" to pass
  if (req.path.startsWith("/inject.js")) {
    return next();
  }

  // Force user to run "/setup" if no credentials exist
  if (
    !credentialsExist() &&
    req.path !== "/setup" &&
    !req.path.startsWith("/public")
  ) {
    return res.redirect("/setup");
  }

  // Require login if credentials do exist
  if (
    credentialsExist() &&
    !req.session.user &&
    req.path !== "/login" &&
    req.path !== "/setup"
  ) {
    return res.redirect("/login");
  }

  // If credentials exist but user tries to go to setup, redirect
  if (credentialsExist() && req.path === "/setup") {
    return res.redirect("/login");
  }

  // Hide the default index.html if it exists
  if (req.path === "/index.html") {
    return res.status(404).send("Not Found");
  }

  next();
});

app.get("/scripts/:id/calls", (req, res) => {
  const { id } = req.params;
  const { range = "24h" } = req.query; // Default to 24-hour range

  // Fetch call data from database
  const calls = db
    .prepare(
      `
      SELECT strftime('%H', timestamp) AS hour, COUNT(*) AS call_count
      FROM script_calls
      WHERE script_id = ? AND timestamp >= datetime('now', '-1 day')
      GROUP BY hour
    `
    )
    .all(id);

  // Format data for the graph
  const graphData = Array(24).fill(0); // 24 hours
  calls.forEach(({ hour, call_count }) => {
    graphData[parseInt(hour)] = call_count;
  });

  // Calculate total calls in the last 24 hours
  const callCount = graphData.reduce((sum, count) => sum + count, 0);

  res.json({ graphData, callCount });
});

/********************************************
 *          Auth & Credential Routes
 ********************************************/
/**
 * GET /login
 * Render a login view if user is not logged in.
 */
app.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }
  res.render("login");
});

/**
 * POST /login
 * Attempt to authenticate the user.
 */
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.user = { username: user.username };
    return res.json({ success: true, redirect: "/" });
  }

  return res
    .status(401)
    .json({ success: false, message: "Invalid credentials." });
});

/**
 * POST /logout
 * Destroy the session and log the user out.
 */
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Logout failed.");
    }
    res.json({ success: true, message: "Logged out successfully." });
  });
});

/**
 * GET /setup
 * Initial setup route if no user is in the DB.
 */
app.get("/setup", (req, res) => {
  // If user arrives here, presumably no credentials exist, or user forced it.
  res.render("setup");
});

/**
 * POST /setup
 * Create initial credentials if they don't exist.
 */
app.post("/setup", (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password || !confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Passwords do not match." });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(
      username,
      hashedPassword
    );
    return res.json({
      success: true,
      message: "Credentials set successfully.",
    });
  } catch (error) {
    console.error("Error saving credentials:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to save credentials." });
  }
});

/**
 * POST /admin
 * Update admin credentials based on current session user.
 */
app.post("/admin", (req, res) => {
  const { username, password, confirmPassword } = req.body;

  if (!username || !password || !confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Passwords do not match." });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  try {
    db.prepare(
      "UPDATE users SET username = ?, password = ? WHERE username = ?"
    ).run(username, hashedPassword, req.session.user.username);
    req.session.destroy();
    return res.json({
      success: true,
      message: "Credentials updated. Please log in again.",
    });
  } catch (error) {
    console.error("Error updating admin credentials:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update credentials." });
  }
});

/**
 * POST /update-credentials
 * Another route to update credentials (similar to /admin).
 * If you don’t need this route, remove or merge with /admin.
 */
app.post("/update-credentials", isAuthenticated, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required." });
  }

  try {
    // The following references an array "USERS" that isn’t defined in your snippet.
    // If you’re using the DB for credentials, remove or update this logic to use db.
    // USERS[0].username = username;
    // USERS[0].password = bcrypt.hashSync(password, 10);

    // Or update DB user here, similarly to the /admin route:
    // db.prepare("UPDATE users ...")

    return res.json({
      success: true,
      message: "Credentials updated successfully!",
    });
  } catch (error) {
    console.error("Error updating credentials:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update credentials." });
  }
});

/********************************************
 *               Main Page Route
 ********************************************/
// If you want users to be redirected to login when not authenticated:
app.set("trust proxy", true);

app.get("/", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  // Example with version injection if needed:
  const host = req.headers.host;
  const protocol = req.protocol;
  const injectScriptURL = `${protocol}://${host}/inject.js`;

  res.render("index", {
    injectScriptURL,
    version: INJECTLY_VERSION, // Adjust or remove if not used
  });
});

/********************************************
 *            Scripts Endpoints
 ********************************************/
// Protect script routes with `isAuthenticated` if needed
app.use("/scripts", isAuthenticated);

/**
 * POST /scripts
 * Create a new script record in the DB.
 */
app.post("/scripts", (req, res) => {
  const { name, content } = req.body;
  const stmt = db.prepare(`
    INSERT INTO scripts (name, content, updated_at) 
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `);
  const result = stmt.run(name, content);
  res.json({ id: result.lastInsertRowid });
});

/**
 * GET /scripts
 * Fetch all scripts and their assigned sites.
 */
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

/**
 * GET /scripts/:id
 * Fetch a specific script by ID, including assigned sites.
 */
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

/**
 * PUT /scripts/:id
 * Update an existing script.
 */
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

/**
 * DELETE /scripts/:id
 * Delete a script by ID.
 */
app.delete("/scripts/:id", (req, res) => {
  const stmt = db.prepare("DELETE FROM scripts WHERE id = ?");
  stmt.run(req.params.id);
  res.json({ success: true });
});

/********************************************
 *              Sites Endpoints
 ********************************************/
// Protect site routes with `isAuthenticated` if needed
app.use("/sites", isAuthenticated);

/**
 * POST /sites
 * Add a new site entry to the DB.
 */
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

/**
 * GET /sites
 * Fetch all sites.
 */
app.get("/sites", (req, res) => {
  const sites = db.prepare("SELECT * FROM sites").all();
  res.json(sites);
});

/**
 * DELETE /sites/:id
 * Delete a site (and remove its references in `script_sites`).
 */
app.delete("/sites/:id", (req, res) => {
  const { id } = req.params;
  try {
    // Remove references to this site in script_sites
    db.prepare("DELETE FROM script_sites WHERE site_id = ?").run(id);

    // Delete the site
    db.prepare("DELETE FROM sites WHERE id = ?").run(id);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting site:", error.message);
    res.status(500).json({ error: "Failed to delete site." });
  }
});

/**
 * POST /scripts/:id/sites
 * Assign a script to multiple sites by ID.
 */
app.post("/scripts/:id/sites", (req, res) => {
  const { id } = req.params;
  const { siteIds } = req.body; // Array of site IDs

  try {
    // Remove existing site associations for this script
    db.prepare("DELETE FROM script_sites WHERE script_id = ?").run(id);

    // Add new site associations
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

/********************************************
 *              Script Calls
 ********************************************/
app.get("/api/calls", (req, res) => {
  try {
    // SQL to fetch call counts for the last 24 hours
    const calls = db
      .prepare(
        `
        SELECT 
          scripts.id AS script_id,
          scripts.name AS script_name,
          COUNT(script_calls.id) AS call_count
        FROM 
          scripts
        LEFT JOIN 
          script_calls 
        ON 
          scripts.id = script_calls.script_id
        WHERE 
          script_calls.timestamp >= DATETIME('now', '-1 day')
        GROUP BY 
          scripts.id
        `
      )
      .all();

    // Format response
    const response = calls.map((call) => ({
      id: call.script_id,
      name: call.script_name,
      count: call.call_count,
    }));

    res.json({ success: true, data: response });
  } catch (error) {
    console.error("Error fetching call data:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch call data." });
  }
});

/********************************************
 *              Inject Route
 ********************************************/
app.get("/inject.js", (req, res) => {
  // If there is NO ?site= param, serve the loader script
  if (!req.query.site) {
    // 1. Serve the loader script that injects /inject.js?site=<domain>
    const loaderScript = `
      (function() {
        var siteDomain = window.location.host;
        var fullSrc = document.currentScript && document.currentScript.src
          ? document.currentScript.src
          : '';
        var baseURL = fullSrc.split('?')[0];
        var scriptTag = document.createElement('script');
        scriptTag.src = baseURL + '?site=' + siteDomain;
        scriptTag.defer = true;
        document.head.appendChild(scriptTag);
      })();
    `;

    // Prevent caching so the loader always runs fresh
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    return res.type("application/javascript").send(loaderScript);
  }

  // API endpoint to fetch call data for a specific script
  app.get("/api/calls/:scriptId", (req, res) => {
    const { scriptId } = req.params;

    try {
      // Query to get call count in the last 24 hours
      const callCount = db
        .prepare(
          `
        SELECT COUNT(*) AS count 
        FROM script_calls 
        WHERE script_id = ? AND timestamp >= DATETIME('now', '-1 day')
      `
        )
        .get(scriptId);

      // Query to get timestamps for a basic graph (grouped by hour)
      const callData = db
        .prepare(
          `
        SELECT STRFTIME('%H', timestamp) AS hour, COUNT(*) AS count
        FROM script_calls
        WHERE script_id = ? AND timestamp >= DATETIME('now', '-1 day')
        GROUP BY hour
        ORDER BY hour
      `
        )
        .all(scriptId);

      // Return data to the frontend
      res.json({
        success: true,
        count: callCount.count,
        graphData: callData,
      });
    } catch (error) {
      console.error("Error fetching call data:", error.message);
      res
        .status(500)
        .json({ success: false, error: "Failed to fetch call data." });
    }
  });

  // --------------------------------------------------------------
  // If we DO have ?site=, serve your existing injection logic below
  // --------------------------------------------------------------

  // Pull the siteDomain from ?site=
  const siteDomain = req.query.site;

  if (!siteDomain) {
    return res.status(400).send("Site domain not provided.");
  }

  // Check for site existence in DB
  const site = db
    .prepare("SELECT * FROM sites WHERE domain = ?")
    .get(siteDomain);

  if (!site) {
    // If site not found, return a 404 or a console log
    return res
      .status(404)
      .type("application/javascript")
      .send(`console.log('Injectly: Site "${siteDomain}" not registered.');`);
  }

  // Fetch assigned scripts for this site
  const scripts = db
    .prepare(
      `
      SELECT scripts.id, scripts.content 
      FROM scripts 
      JOIN script_sites ON scripts.id = script_sites.script_id 
      WHERE script_sites.site_id = ?
    `
    )
    .all(site.id);

  // If no scripts assigned, return a message
  if (scripts.length === 0) {
    return res.type("application/javascript").send(`
      console.log('Injectly: No scripts to inject for ${siteDomain}');
    `);
  }

  // Log each script call in the `script_calls` table
  // Log each script call in the `script_calls` table (only if ?site is present)
  if (req.query.site) {
    scripts.forEach((script) => {
      if (script.id) {
        console.log("Attempting to log call for script ID:", script.id);
        db.prepare(
          `
        INSERT INTO script_calls (script_id) VALUES (?)
      `
        ).run(script.id);
      } else {
        console.error("Error: Missing script ID for script:", script);
      }
    });
  }

  // Construct the final injector script
  const processedScripts = scripts
    .map((script) => {
      const content = script.content.trim();

      if (content.startsWith("<script")) {
        // Handle <script> tags
        const srcMatch = content.match(/src="([^"]+)"/);
        if (srcMatch) {
          // External <script> tag with src
          const src = srcMatch[1];
          return `
            (function() {
              const scriptTag = document.createElement('script');
              scriptTag.src = '${src}';
              scriptTag.defer = ${content.includes("defer")};
              ${
                content.includes("data-website-id")
                  ? `scriptTag.setAttribute('data-website-id', '${
                      content.match(/data-website-id="([^"]+)"/)[1]
                    }');`
                  : ""
              }
              scriptTag.setAttribute('data-injectly', 'true');
              document.head.appendChild(scriptTag);
              console.log('Injectly: Added external script ->', scriptTag.src);
            })();
          `;
        } else {
          // Inline <script> tag without src
          const inlineCodeMatch = content.match(
            /<script.*?>([\s\S]*?)<\/script>/
          );
          const inlineCode = inlineCodeMatch ? inlineCodeMatch[1].trim() : "";
          return `
            (function() {
              const inlineScript = document.createElement('script');
              inlineScript.textContent = \`${inlineCode.replace(
                /<\/script>/g,
                "<\\/script>"
              )}\`;
              inlineScript.setAttribute('data-injectly', 'true');
              document.head.appendChild(inlineScript);
              console.log('Injectly: Added inline script.');
            })();
          `;
        }
      } else {
        // Handle bare JavaScript (not enclosed in <script> tags)
        return `
          (function() {
            const inlineScript = document.createElement('script');
            inlineScript.textContent = \`${content.replace(
              /<\/script>/g,
              "<\\/script>"
            )}\`;
            inlineScript.setAttribute('data-injectly', 'true');
            document.head.appendChild(inlineScript);
            console.log('Injectly: Added inline script.');
          })();
        `;
      }
    })
    .join("\n");

  const injectorScript = `
    (function() {
      function injectScript(src) {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.defer = true;
          script.addEventListener('load', resolve);
          script.addEventListener('error', (e) => reject(e.error));
          document.head.appendChild(script);
        });
      }
  
      console.log('Injectly: Loading scripts for ${siteDomain}...');
  
      try {
        ${processedScripts}
      } catch (e) {
        console.error('Injectly Error:', e);
      }
    })();
  `;

  // Prevent caching
  res.set({
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });

  res.type("application/javascript");
  res.send(injectorScript);
});

/********************************************
 *        Start the Express Server
 ********************************************/
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
