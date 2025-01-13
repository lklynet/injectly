document.addEventListener("DOMContentLoaded", () => {
  const scriptCards = document.getElementById("scriptCards");
  const addScriptBtn = document.getElementById("addScript");
  const scriptModal = document.getElementById("scriptModal");
  const scriptForm = document.getElementById("scriptForm");
  const formTitle = document.getElementById("formTitle");
  const cancelBtn = document.getElementById("cancel");
  const copyButton = document.getElementById("copyButton");
  const scriptCode = document.getElementById("scriptCode");

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
  };

  // Hide Modal
  const hideModal = () => {
    scriptModal.classList.add("hidden");
  };

  // Fetch and render scripts
  const fetchScripts = async () => {
    const res = await fetch("/scripts");
    const scripts = await res.json();

    scriptCards.innerHTML = scripts
      .map(
        (script) => `
          <article class="card">
            <h3>${script.name}</h3>
            <p>Added: ${new Date(script.created_at).toLocaleDateString()}</p>
            <p>Updated: ${new Date(script.updated_at).toLocaleDateString()}</p>
            <button class="edit" data-id="${script.id}">Edit</button>
            <button class="delete" data-id="${script.id}">Delete</button>
          </article>
        `
      )
      .join("");
  };

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
      fetchScripts();
    }
  });

  // Submit Form
  scriptForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = scriptForm.dataset.id;
    const name = document.getElementById("name").value;
    const content = document.getElementById("content").value;

    const method = id ? "PUT" : "POST";
    const url = id ? `/scripts/${id}` : "/scripts";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content }),
    });

    hideModal(); // Hide modal after submission
    fetchScripts(); // Refresh script cards
  });

  // Initial Fetch
  fetchScripts();
});
