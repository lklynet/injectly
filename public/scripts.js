document.addEventListener("DOMContentLoaded", () => {
  const COLORS = {
    1: "bg-red-600", // Closest to #e6194B
    2: "bg-green-500", // Closest to #3cb44b
    3: "bg-yellow-400", // Closest to #ffe119
    4: "bg-blue-600", // Closest to #4363d8
    5: "bg-orange-500", // Closest to #f58231
    6: "bg-purple-700", // Closest to #911eb4
    7: "bg-cyan-400", // Closest to #42d4f4
    8: "bg-pink-500", // Closest to #f032e6
    9: "bg-lime-400", // Closest to #bfef45
    10: "bg-pink-200", // Closest to #fabed4
    11: "bg-teal-500", // Closest to #469990
    12: "bg-purple-300", // Closest to #dcbeff
    13: "bg-orange-800", // Closest to #9A6324
    14: "bg-yellow-200", // Closest to #fffac8
    15: "bg-red-900", // Closest to #800000
    16: "bg-green-200", // Closest to #aaffc3
    17: "bg-yellow-800", // Closest to #808000
    18: "bg-orange-200", // Closest to #ffd8b1
    19: "bg-blue-900", // Closest to #000075
    20: "bg-gray-500", // Closest to #a9a9a9
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
  // Fetch and render scripts
  const fetchAndRenderScripts = async () => {
    const res = await fetch("/scripts");
    const scripts = await res.json();

    scriptCards.innerHTML = scripts
      .map((script) => {
        const assignedSites = script.assignedSites || []; // Assigned sites from backend
        const siteFlags = assignedSites
          .map((site) => {
            const colorClass =
              COLORS[site.id % Object.keys(COLORS).length] || "bg-gray-500";
            return `<div class="w-4 h-4 ${colorClass} rounded-full" title="${site.domain}"></div>`;
          })
          .join("");

        return `
      <div class="p-4 bg-gray-800 rounded shadow">
  <!-- Title and Ellipses -->
  <div class="flex justify-between items-center">
    <h3 class="text-lg font-semibold text-white">${script.name}</h3>
    <div class="script-options relative">
      <button
        class="ellipsis-menu text-gray-400 hover:text-gray-200"
        onclick="showOptions(${script.id})"
      >
        ⋮
      </button>
      <div
        id="options-${script.id}"
        class="options-popup hidden absolute right-0 bg-gray-700 p-2 rounded shadow"
      >
        <button
          class="block px-4 py-2 text-left text-sm text-gray-300 hover:text-gray-100"
          onclick="editScript(${script.id})"
        >
          Edit
        </button>
        <button
          class="block px-4 py-2 text-left text-sm text-gray-300 hover:text-gray-100"
          onclick="deleteScript(${script.id})"
        >
          Delete
        </button>
      </div>
    </div>
  </div>

  <!-- Site Flags -->
  <div class="flex gap-2 mt-2">${siteFlags}</div>

  <!-- Graph -->
  <div id="graph-${script.id}" class="graph-container bg-gray-800 rounded h-24 my-2"></div>

  <!-- Call Count -->
  <p id="call-count-${script.id}" class="text-sm text-gray-400">
    Loading call data...
  </p>
</div>
    `;
      })
      .join("");

    // Call graph and call count renderers here
    scripts.forEach((script) => {
      fetchAndRenderGraph(script.id);
      fetchAndRenderCallCount(script.id);
    });

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

    // Ellipsis Menu
    let activeMenu = null; // Track the currently active menu

    // Function to toggle the visibility of the options menu
    window.showOptions = (scriptId) => {
      const optionsMenu = document.getElementById(`options-${scriptId}`);

      // Close any currently active menu if it's not the same
      if (activeMenu && activeMenu !== optionsMenu) {
        activeMenu.classList.add("hidden");
      }

      // Toggle the visibility of the clicked menu
      optionsMenu.classList.toggle("hidden");

      // Update the active menu reference
      activeMenu = optionsMenu.classList.contains("hidden")
        ? null
        : optionsMenu;
    };

    // Global click listener to close the menu when clicking outside
    document.addEventListener("click", (event) => {
      // If there's an active menu, check if the click is outside it
      if (activeMenu) {
        const isMenuClick = activeMenu.contains(event.target);
        const isEllipsisClick = event.target.closest(".ellipsis-menu") !== null;

        if (!isMenuClick && !isEllipsisClick) {
          activeMenu.classList.add("hidden");
          activeMenu = null; // Reset active menu reference
        }
      }
    });

    // Prevent menu from closing immediately after being toggled
    document.querySelectorAll(".ellipsis-menu").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation(); // Prevent global click listener from firing
      });
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
    const domainExternalScripts = domainSpecificScripts.filter(
      (script) => script.src
    );
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

  function editScript(scriptId) {
    fetch(`/scripts/${scriptId}`)
      .then((response) => response.json())
      .then((script) => {
        showModal("Edit Script", script);
      })
      .catch((error) => {
        console.error(`Error fetching script with ID ${scriptId}:`, error);
      });
  }
  window.editScript = editScript; // Attach to window

  async function deleteScript(scriptId) {
    try {
      await fetch(`/scripts/${scriptId}`, { method: "DELETE" });
      fetchAndRenderScripts(); // Refresh the scripts UI
    } catch (error) {
      console.error(`Error deleting script with ID ${scriptId}:`, error);
    }
  }
  window.deleteScript = deleteScript; // Attach to window

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

  // Fetch and render graph for a specific script
  async function fetchAndRenderGraph(scriptId) {
    try {
      const response = await fetch(`/scripts/${scriptId}/calls?range=24h`);
      const { graphData } = await response.json();

      // Select the graph container
      const graphContainer = document.getElementById(`graph-${scriptId}`);
      graphContainer.innerHTML = ""; // Clear any existing content

      // Graph dimensions and margins
      const width = graphContainer.offsetWidth || 300; // Responsive width
      const height = 80; // Fixed height
      const margin = { top: 10, right: 10, bottom: 10, left: 10 };

      const svg = d3
        .select(graphContainer)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      // Add a defs element for the subtle glow effect
      const defs = svg.append("defs");

      // Subtle glow filter
      defs
        .append("filter")
        .attr("id", "subtle-glow")
        .append("feGaussianBlur")
        .attr("stdDeviation", 3) // Reduced blur intensity
        .attr("result", "coloredBlur");

      const merge = defs.append("feMerge");
      merge.append("feMergeNode").attr("in", "coloredBlur");
      merge.append("feMergeNode").attr("in", "SourceGraphic");

      // Gradient for the area below the line
      const gradient = defs
        .append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

      gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#4759e1")
        .attr("stop-opacity", 0.3); // Subtle gradient opacity

      gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#4759e1")
        .attr("stop-opacity", 0); // Fade to transparent

      const xScale = d3
        .scaleLinear()
        .domain([0, graphData.length - 1])
        .range([margin.left, width - margin.right]);

      const yScale = d3
        .scaleLinear()
        .domain([0, d3.max(graphData)])
        .range([height - margin.bottom, margin.top]);

      // Line generator
      const line = d3
        .line()
        .x((d, i) => xScale(i))
        .y((d) => yScale(d))
        .curve(d3.curveMonotoneX); // Smooth curve

      // Append area below the line with a subtle gradient
      svg
        .append("path")
        .datum(graphData)
        .attr("fill", "url(#gradient)")
        .attr(
          "d",
          d3
            .area()
            .x((d, i) => xScale(i))
            .y0(height - margin.bottom)
            .y1((d) => yScale(d))
            .curve(d3.curveMonotoneX)
        );

      svg
        .append("path")
        .datum(graphData)
        .attr("fill", "none")
        .attr("stroke", "#4759e1") // Main line color
        .attr("stroke-width", 2)
        .attr("d", line);

      svg
        .append("path")
        .datum(graphData)
        .attr("fill", "none")
        .attr("stroke", "#7683e4") // Main line color
        .attr("stroke-width", 1)
        .attr("d", line);
    } catch (error) {
      console.error(`Error fetching graph data for script ${scriptId}:`, error);
    }
  }

  // Fetch and render call count for a specific script
  async function fetchAndRenderCallCount(scriptId) {
    try {
      const response = await fetch(`/scripts/${scriptId}/calls?range=24h`);
      const { callCount } = await response.json();

      // Update the call count text
      const callCountElement = document.getElementById(
        `call-count-${scriptId}`
      );
      callCountElement.textContent = `${callCount} calls in the last 24h`;
    } catch (error) {
      console.error(`Error fetching call count for script ${scriptId}:`, error);
    }
  }

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

  function showOptions(scriptId) {
    const optionsPopup = document.getElementById(`options-${scriptId}`);
    optionsPopup.classList.toggle("hidden");
  }
  window.showOptions = showOptions;

  // Initial Fetch
  fetchAndRenderScripts();
  fetchAndRenderSites();
});
