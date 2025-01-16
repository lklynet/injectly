document.addEventListener("DOMContentLoaded", () => {
  const COLORS = {
    1: "bg-red-500",
    2: "bg-blue-500",
    3: "bg-green-500",
    4: "bg-yellow-500",
    5: "bg-purple-500",
    6: "bg-pink-500",
    7: "bg-orange-500",
    8: "bg-teal-500",
    9: "bg-cyan-500",
    10: "bg-amber-500",
    11: "bg-red-300",     // Lighter red
    12: "bg-blue-300",    // Lighter blue
    13: "bg-green-300",   // Lighter green
    14: "bg-yellow-300",  // Lighter yellow
    15: "bg-purple-300",  // Lighter purple
    16: "bg-pink-300",    // Lighter pink
    17: "bg-orange-300",  // Lighter orange
    18: "bg-teal-300",    // Lighter teal
    19: "bg-cyan-300",    // Lighter cyan
    20: "bg-amber-300",   // Lighter amber
  };

  const scriptCards = document.getElementById("scriptCards");
  const siteGrid = document.getElementById("siteGrid");
  const addScriptBtn = document.getElementById("addScript");
  const scriptModal = document.getElementById("scriptModal");
  const scriptForm = document.getElementById("scriptForm");
  const formTitle = document.getElementById("formTitle");
  const cancelBtn = document.getElementById("cancel");
  const copyButton = document.getElementById("copyButton");
  const scriptCode = document.getElementById("scriptCode");
  const siteCheckboxes = document.getElementById("siteCheckboxes");

  // Copy Button
  copyButton.addEventListener("click", () => {
    const textToCopy = scriptCode.textContent;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        alert("Script copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  });

  // Show Modal
  const showModal = (title = "Add Script", script = {}) => {
    formTitle.textContent = title;
    document.getElementById("name").value = script.name || "";
    document.getElementById("content").value = script.content || "";
    scriptForm.dataset.id = script.id || ""; // Empty if adding
    scriptModal.classList.remove("hidden");

    // Populate site checkboxes for the selected script
    const assignedSites = script.assignedSites || []; // Ensure it's an array
    const selectedSites = new Set(assignedSites.map((site) => site.id));
    document.querySelectorAll("#siteCheckboxes input").forEach((checkbox) => {
      checkbox.checked = selectedSites.has(parseInt(checkbox.value));
    });
  };

  // Hide Modal
  const hideModal = () => {
    scriptModal.classList.add("hidden");
  };

  // Fetch and render sites
  const fetchAndRenderSites = async () => {
    const res = await fetch("/sites");
    const sites = await res.json();

    siteGrid.innerHTML = sites
      .map((site) => {
        const colorClass =
          COLORS[site.id % Object.keys(COLORS).length] || "bg-gray-500";
        return `
          <div class="relative p-4 bg-gray-800 rounded shadow flex items-center gap-4">
            <button
              class="absolute top-2 right-2 text-gray-500 hover:text-red-600 delete-site"
              data-id="${site.id}"
              title="Delete Site"
            >
              &times;
            </button>
            <div class="w-4 h-4 ${colorClass} rounded-full"></div>
            <span class="text-white">${site.domain}</span>
          </div>
        `;
      })
      .join("");

    siteCheckboxes.innerHTML = sites
      .map(
        (site) =>
          `<label class="flex items-center gap-2">
            <input type="checkbox" value="${site.id}" class="form-checkbox">
            <span>${site.domain}</span>
          </label>`
      )
      .join("");

    siteCheckboxes.innerHTML = sites
      .map(
        (site) =>
          `<label class="flex items-center gap-2">
            <input type="checkbox" value="${site.id}" class="form-checkbox">
            <span>${site.domain}</span>
          </label>`
      )
      .join("");
  };

// Function to dynamically inject scripts
const injectDynamicScripts = (scripts) => {
  scripts.forEach((script) => {
    try {
      const scriptElement = document.createElement("script");
      scriptElement.src = script.src;

      // Add custom attributes to the script element
      if (script.attributes) {
        Object.entries(script.attributes).forEach(([key, value]) => {
          scriptElement.setAttribute(key, value);
        });
      }

      // Append the script to the document head
      document.head.appendChild(scriptElement);
      console.log(`Injected script: ${script.src}`);
    } catch (error) {
      console.error("Error injecting script:", error);
    }
  });
};

// Fetch and render scripts
const fetchAndRenderScripts = async () => {
  const res = await fetch("/scripts");
  const scripts = await res.json();

  scriptCards.innerHTML = scripts
    .map((script) => {
      const assignedSites = script.assignedSites || []; // Assigned sites from backend
      const siteFlags = assignedSites
        .map((site) => {
          // Ensure consistent color assignment using site ID
          const colorClass =
            COLORS[site.id % Object.keys(COLORS).length] || "bg-gray-500";
          return `<div class="w-4 h-4 ${colorClass} rounded-full" title="${site.domain}"></div>`;
        })
        .join("");

      return `
        <div class="p-4 bg-gray-800 rounded shadow">
          <h3 class="text-lg font-semibold text-white">${script.name}</h3>
          <p class="text-sm text-gray-400">Added: ${new Date(
            script.created_at
          ).toLocaleDateString()}</p>
          <p class="text-sm text-gray-400">Updated: ${new Date(
            script.updated_at
          ).toLocaleDateString()}</p>
          <div class="flex gap-2 mt-2">${siteFlags}</div>
          <button class="edit mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" data-id="${
            script.id
          }">
            Edit
          </button>
          <button class="delete mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" data-id="${
            script.id
          }">
            Delete
          </button>
        </div>
      `;
    })
    .join("");

  // Dynamically inject scripts
  const dynamicScripts = scripts
    .filter((script) => script.content && !script.src)
    .map((script) => ({
      src: script.src || null,
      content: script.content,
    }));

  dynamicScripts.forEach((script) => {
    if (script.content && script.content.startsWith("<script")) {
      try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = script.content.trim();
        const scriptElement = tempDiv.firstChild;
        document.head.appendChild(scriptElement);
      } catch (error) {
        console.error("Error injecting inline script:", error);
      }
    } else if (
      script.content &&
      script.content.startsWith("(function()") &&
      script.content.endsWith("})();")
    ) {
      try {
        eval(script.content); // Safely execute inline IIFE scripts
      } catch (error) {
        console.error("Error evaluating IIFE script:", error);
      }
    }
  });

  // Inject external scripts with attributes
  const externalScripts = scripts.filter((script) => script.src);
  injectDynamicScripts(externalScripts);

  // [New domain-based code starts here]
  // 3) FILTER SCRIPTS BY DOMAIN FOR INJECTION
  const currentDomain = window.location.hostname;
  const domainSpecificScripts = scripts.filter((script) => {
    const assignedSites = script.assignedSites || [];
    return assignedSites.some((site) => site.domain === currentDomain);
  });

  // 4) DOMAIN-BASED INLINE INJECTION
  const inlineScripts = domainSpecificScripts.filter(
    (script) => script.content && !script.src
  );
  inlineScripts.forEach((script) => {
    if (script.content.startsWith("<script")) {
      try {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = script.content.trim();
        const scriptElement = tempDiv.firstChild;
        document.head.appendChild(scriptElement);
      } catch (error) {
        console.error("Error injecting inline script:", error);
      }
    } else if (
      script.content.startsWith("(function()") &&
      script.content.endsWith("})();")
    ) {
      try {
        eval(script.content);
      } catch (error) {
        console.error("Error evaluating IIFE script:", error);
      }
    }
  });

  // 5) DOMAIN-BASED EXTERNAL INJECTION
  const domainExternalScripts = domainSpecificScripts.filter((script) => script.src);
  injectDynamicScripts(domainExternalScripts);

};

  siteGrid.addEventListener("click", async (e) => {
    const target = e.target;

    if (target.classList.contains("delete-site")) {
      const id = target.dataset.id;

      // Delete the site
      await fetch(`/sites/${id}`, { method: "DELETE" });

      // Refresh sites and scripts
      await fetchAndRenderSites();
      await fetchAndRenderScripts();
    }
  });

  // Add a new site
  document
    .getElementById("addSiteForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const domain = document.getElementById("domain").value;
      await fetch("/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      fetchAndRenderSites();
    });

  // Add Script Button
  addScriptBtn.addEventListener("click", () => {
    showModal("Add Script");
  });

  // Cancel Button
  cancelBtn.addEventListener("click", hideModal);

  // Handle Edit and Delete Buttons
  scriptCards.addEventListener("click", async (e) => {
    const target = e.target;

    if (target.classList.contains("edit")) {
      const id = target.dataset.id;
      const script = await fetch(`/scripts/${id}`).then((res) => res.json());
      showModal("Edit Script", script);
    } else if (target.classList.contains("delete")) {
      const id = target.dataset.id;
      await fetch(`/scripts/${id}`, { method: "DELETE" });
      fetchAndRenderScripts();
    }
  });

  // Submit Script Form
  scriptForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = scriptForm.dataset.id; // Script ID (empty if adding)
    const name = document.getElementById("name").value;
    const content = document.getElementById("content").value;

    const method = id ? "PUT" : "POST";
    const url = id ? `/scripts/${id}` : "/scripts";

    const selectedSites = Array.from(
      document.querySelectorAll("#siteCheckboxes input:checked")
    ).map((checkbox) => checkbox.value);

    // Send request to add or update the script
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content, siteIds: selectedSites }), // Include siteIds
    });

    // Handle site associations for both adding and editing
    if (response.ok) {
      if (!id) {
        // For new scripts, assign sites
        const script = await response.json();
        await fetch(`/scripts/${script.id}/sites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteIds: selectedSites }),
        });
      } else {
        // For existing scripts, update site associations
        await fetch(`/scripts/${id}/sites`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ siteIds: selectedSites }),
        });
      }
    }

    hideModal(); // Hide modal after submission
    fetchAndRenderScripts(); // Refresh script cards
  });

  // Initial Fetch
  fetchAndRenderScripts();
  fetchAndRenderSites();
});

