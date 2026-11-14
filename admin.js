const ADMIN_PASSWORD = "libinghong123";
const STORAGE_KEY = "academicSiteContent";

let state = loadState();

const loginPanel = document.querySelector("[data-login-panel]");
const adminApp = document.querySelector("[data-admin-app]");
const statusBox = document.querySelector("[data-status]");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (!window.SITE_CONTENT?.version || parsed.version === window.SITE_CONTENT.version) {
        return parsed;
      }
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  return clone(window.SITE_CONTENT);
}

function setStatus(message) {
  if (statusBox) statusBox.textContent = message;
}

function getByPath(path) {
  return path.split(".").reduce((current, key) => current?.[key], state);
}

function setByPath(path, value) {
  const parts = path.split(".");
  let target = state;
  parts.slice(0, -1).forEach((part) => {
    if (!target[part]) target[part] = {};
    target = target[part];
  });
  target[parts.at(-1)] = value;
}

function inputField(label, path, options = {}) {
  const wrapper = document.createElement("label");
  wrapper.className = "admin-field";
  const caption = document.createElement("span");
  caption.textContent = label;
  const input = document.createElement(options.rows ? "textarea" : "input");
  input.dataset.path = path;
  if (options.rows) input.rows = options.rows;
  if (options.type) input.type = options.type;
  input.value = getByPath(path) || "";
  wrapper.append(caption, input);
  return wrapper;
}

function listField(arrayName, index, key, label, rows = 0) {
  const wrapper = document.createElement("label");
  wrapper.className = "admin-field";
  const caption = document.createElement("span");
  caption.textContent = label;
  const input = document.createElement(rows ? "textarea" : "input");
  input.dataset.array = arrayName;
  input.dataset.index = String(index);
  input.dataset.key = key;
  if (rows) input.rows = rows;
  const value = state[arrayName]?.[index]?.[key];
  input.value = Array.isArray(value) ? value.join(", ") : value || "";
  wrapper.append(caption, input);
  return wrapper;
}

function button(text, className, onClick) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = className;
  element.textContent = text;
  element.addEventListener("click", onClick);
  return element;
}

function renderProfileForm() {
  const container = document.querySelector("[data-profile-form]");
  if (!container) return;
  container.innerHTML = "";
  [
    ["Name", "profile.name"],
    ["Brand mark", "profile.brandMark"],
    ["Navigation subtitle", "profile.navSubtitle"],
    ["Hero kicker", "profile.heroKicker"],
    ["Hero title", "profile.heroTitle"],
    ["Hero summary", "profile.heroSummary", 4],
    ["Profile card summary", "profile.cardSummary", 3],
    ["Profile photo path", "profile.photo"],
    ["Email", "profile.email", 0, "email"],
    ["Last updated", "profile.lastUpdated"],
    ["Footer text", "profile.footer"],
  ].forEach(([label, path, rows, type]) => {
    container.append(inputField(label, path, { rows, type }));
  });
}

function renderContactForm() {
  const container = document.querySelector("[data-contact-form]");
  if (!container) return;
  container.innerHTML = "";
  container.append(inputField("Contact title", "contact.title"));
  container.append(inputField("Contact text", "contact.text", { rows: 4 }));
}

const listSchemas = {
  facts: {
    title: "Profile Facts",
    empty: { label: "New label", value: "New value" },
    fields: [
      ["label", "Label"],
      ["value", "Value"],
    ],
  },
  research: {
    title: "Research Interests",
    empty: { title: "New research interest", description: "Description", focus: "Research", search: "" },
    fields: [
      ["title", "Title"],
      ["description", "Description", 3],
      ["shortTitle", "Short button label (optional)"],
      ["focus", "Visual focus word"],
      ["search", "Related publications keyword"],
    ],
  },
  papers: {
    title: "Paper Items",
    empty: {
      year: "2026",
      topic: "new",
      topicLabel: "New Topic",
      status: "Working Paper",
      title: "New paper title",
      meta: "Authors | Venue",
      doi: "",
      overview: "Overview",
      tags: ["Tag"],
    },
    fields: [
      ["id", "Detail page ID"],
      ["year", "Year"],
      ["topic", "Filter key"],
      ["topicLabel", "Filter label"],
      ["status", "Status"],
      ["title", "Title"],
      ["meta", "Authors and venue", 2],
      ["doi", "DOI identifier"],
      ["overview", "Overview", 4],
      ["tags", "Tags, comma-separated"],
    ],
  },
  education: {
    title: "Education Items",
    empty: { label: "Study", title: "Institution", description: "Description" },
    fields: [
      ["label", "Label"],
      ["title", "Institution"],
      ["description", "Description", 3],
    ],
  },
  files: {
    title: "Public Files",
    empty: {
      type: "File",
      title: "New file",
      description: "Description",
      url: "#",
      buttonText: "Open",
    },
    fields: [
      ["type", "Type"],
      ["title", "Title"],
      ["description", "Description", 3],
      ["url", "URL or uploaded data"],
      ["buttonText", "Button text"],
    ],
  },
};

function renderList(arrayName) {
  const container = document.querySelector(`[data-list="${arrayName}"]`);
  const schema = listSchemas[arrayName];
  if (!container || !schema) return;

  container.innerHTML = "";
  const header = document.createElement("div");
  header.className = "list-header";
  const title = document.createElement("h3");
  title.textContent = schema.title;
  header.append(title, button("Add", "button small-button", () => {
    if (!state[arrayName]) state[arrayName] = [];
    state[arrayName].push(clone(schema.empty));
    renderAll();
  }));
  container.append(header);

  (state[arrayName] || []).forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "edit-item";
    const itemHeader = document.createElement("div");
    itemHeader.className = "edit-item-header";
    const heading = document.createElement("strong");
    heading.textContent = item.title || item.label || `${schema.title} ${index + 1}`;
    itemHeader.append(heading, button("Remove", "button danger-button", () => {
      state[arrayName].splice(index, 1);
      renderAll();
    }));
    card.append(itemHeader);

    schema.fields.forEach(([key, label, rows]) => {
      card.append(listField(arrayName, index, key, label, rows));
    });

    if (arrayName === "files") {
      const upload = document.createElement("label");
      upload.className = "button secondary admin-dark-button upload-button";
      upload.textContent = "Upload file";
      const input = document.createElement("input");
      input.type = "file";
      input.addEventListener("change", () => handleFileUpload(input.files?.[0], index));
      upload.append(input);
      card.append(upload);
    }

    container.append(card);
  });
}

function handleFileUpload(file, index) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.files[index].url = reader.result;
    if (!state.files[index].title || state.files[index].title === "New file") {
      state.files[index].title = file.name;
    }
    state.files[index].type = file.type || "File";
    renderAll();
    setStatus(`Uploaded ${file.name} for export.`);
  };
  reader.readAsDataURL(file);
}

function renderAll() {
  renderProfileForm();
  renderContactForm();
  Object.keys(listSchemas).forEach(renderList);
  syncInputs();
  updateJsonPreview();
}

function syncInputs() {
  document.querySelectorAll("[data-path]").forEach((input) => {
    input.value = getByPath(input.dataset.path) || "";
  });
}

function updateJsonPreview() {
  const preview = document.querySelector("[data-json-preview]");
  if (preview) preview.value = JSON.stringify(state, null, 2);
}

document.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

  if (target.dataset.path) {
    setByPath(target.dataset.path, target.value);
  }

  if (target.dataset.array) {
    const arrayName = target.dataset.array;
    const index = Number(target.dataset.index);
    const key = target.dataset.key;
    const value = key === "tags"
      ? target.value.split(",").map((tag) => tag.trim()).filter(Boolean)
      : target.value;
    state[arrayName][index][key] = value;
  }

  updateJsonPreview();
});

function savePreview() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  updateJsonPreview();
  setStatus("Saved. Open the public site in this browser to preview changes.");
}

function exportFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportJs() {
  const content = `window.SITE_CONTENT = ${JSON.stringify(state, null, 2)};\n`;
  exportFile("site-content.js", content, "text/javascript");
}

function exportJson() {
  exportFile("site-content.json", JSON.stringify(state, null, 2), "application/json");
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      state = JSON.parse(String(reader.result));
      renderAll();
      savePreview();
      setStatus(`Imported ${file.name}.`);
    } catch {
      setStatus("Import failed: invalid JSON.");
    }
  };
  reader.readAsText(file);
}

document.querySelector("[data-login]")?.addEventListener("click", () => {
  const password = document.querySelector("[data-password]")?.value || "";
  const error = document.querySelector("[data-login-error]");
  if (password !== ADMIN_PASSWORD) {
    if (error) error.hidden = false;
    return;
  }
  sessionStorage.setItem("adminUnlocked", "true");
  loginPanel.hidden = true;
  adminApp.hidden = false;
  renderAll();
});

document.querySelector("[data-password]")?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") document.querySelector("[data-login]")?.click();
});

document.querySelector("[data-save]")?.addEventListener("click", savePreview);
document.querySelector("[data-export-js]")?.addEventListener("click", exportJs);
document.querySelector("[data-export-json]")?.addEventListener("click", exportJson);
document.querySelector("[data-import-json]")?.addEventListener("change", (event) => {
  importJson(event.target.files?.[0]);
});
document.querySelector("[data-reset]")?.addEventListener("click", () => {
  state = clone(window.SITE_CONTENT);
  localStorage.removeItem(STORAGE_KEY);
  renderAll();
  setStatus("Reset to published content.");
});

document.querySelectorAll("[data-admin-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-admin-tab]").forEach((item) => {
      item.classList.toggle("is-active", item === tab);
    });
    document.querySelectorAll("[data-admin-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.adminPanel !== tab.dataset.adminTab;
    });
  });
});

if (sessionStorage.getItem("adminUnlocked") === "true") {
  loginPanel.hidden = true;
  adminApp.hidden = false;
  renderAll();
}
