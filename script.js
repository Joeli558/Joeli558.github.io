const STORAGE_KEY = "academicSiteContent";

const root = document.documentElement;
const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeIcon = document.querySelector("[data-theme-icon]");
const emptyState = document.querySelector("[data-empty-state]");
const fileEmptyState = document.querySelector("[data-file-empty]");

let paperCards = [];
let filterButtons = [];
let momentIndex = 0;
let momentTimer;

const savedTheme = localStorage.getItem("academic-site-theme");
if (savedTheme) {
  root.dataset.theme = savedTheme;
}
updateThemeControls(savedTheme === "dark" ? "dark" : "light");

function getContent() {
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
  return window.SITE_CONTENT;
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value || "";
}

function setHref(selector, href, label) {
  const element = document.querySelector(selector);
  if (!element) return;
  element.href = href || "#";
  if (label !== undefined) element.textContent = label || "";
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createSvgIcon(pathData, className = "") {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.8");
  icon.setAttribute("stroke-linecap", "round");
  icon.setAttribute("stroke-linejoin", "round");
  icon.setAttribute("aria-hidden", "true");
  if (className) icon.classList.add(className);
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  icon.append(path);
  return icon;
}

function updateThemeControls(theme) {
  const isDark = theme === "dark";
  const path = isDark
    ? "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4"
    : "M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7Z";
  themeIcon?.replaceChildren(createSvgIcon(path));
  themeToggle?.setAttribute("aria-label", isDark ? "Switch to light theme" : "Switch to dark theme");
  themeToggle?.setAttribute("aria-pressed", String(isDark));
}

function createResearchLink(label, href, className) {
  const link = createElement("a", className);
  link.href = href;
  link.append(createElement("span", "", label));
  link.append(createSvgIcon("M5 12h14m-6-6 6 6-6 6", "link-arrow"));
  return link;
}

function renderProfile(content) {
  const profile = content.profile || {};
  setText("[data-brand-mark]", profile.brandMark || "BL");
  setText("[data-profile-name]", profile.name || "");
  setText("[data-nav-subtitle]", profile.navSubtitle || "");
  setText("[data-hero-kicker]", profile.heroKicker || "");
  setText("[data-hero-title]", profile.heroTitle || profile.name || "");
  setText("[data-hero-summary]", profile.heroSummary || "");
  setText("[data-card-name]", profile.name || "");
  setText("[data-card-summary]", profile.cardSummary || "");
  setText("[data-last-updated]", profile.lastUpdated || "");
  setText("[data-footer-copy]", profile.footer || "");

  const title = profile.name ? `${profile.name} | Academic Website` : "Academic Website";
  document.title = title;

  const photo = document.querySelector("[data-profile-photo]");
  if (photo && profile.photo) {
    photo.src = profile.photo;
    photo.alt = `Portrait of ${profile.name || "the profile owner"}`;
  }

  const email = profile.email || "";
  setHref("[data-contact-email]", email ? `mailto:${email}` : "#", email || "Email");

  const facts = document.querySelector("[data-profile-facts]");
  if (facts) {
    facts.innerHTML = "";
    (content.facts || []).forEach((fact) => {
      const item = createElement("li");
      item.append(createElement("span", "", fact.label || ""));
      item.append(createElement("strong", "", fact.value || ""));
      facts.append(item);
    });
  }
}

function renderResearch(content) {
  setText("[data-research-intro]", content.researchIntro || "");
  const container = document.querySelector("[data-research-explorer]");
  if (!container) return;
  container.innerHTML = "";
  const tabs = createElement("div", "research-tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Research interests");
  const panels = createElement("div", "research-panels");
  panels.dataset.activeLens = "0";
  (content.research || []).forEach((item, index) => {
    const tab = createElement("button", "research-tab");
    tab.type = "button";
    tab.id = `research-tab-${index}`;
    tab.dataset.researchIndex = String(index);
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(index === 0));
    tab.setAttribute("aria-controls", `research-panel-${index}`);
    tab.setAttribute("aria-label", item.title || "Research interest");
    tab.tabIndex = index === 0 ? 0 : -1;
    tab.append(createElement("span", "research-tab-full", item.title || ""));
    tab.append(createElement("span", "research-tab-compact", item.shortTitle || item.title || ""));
    tabs.append(tab);

    const panel = createElement("article", "research-panel");
    panel.id = `research-panel-${index}`;
    panel.dataset.lens = String(index);
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panel.tabIndex = 0;
    panel.hidden = index !== 0;
    const copy = createElement("div", "research-panel-copy");
    copy.append(createElement("h3", "research-panel-title", item.title || ""));
    copy.append(createElement("p", "research-panel-description", item.description || ""));
    const link = createResearchLink("Explore related work", "#papers", "experience-button research-related");
    link.dataset.search = item.search || "";
    copy.append(link);
    const visual = createElement("div", "research-visual");
    visual.setAttribute("aria-hidden", "true");
    visual.append(createElement("span", "research-focus-word", item.focus || "Research"));
    panel.append(copy, visual);
    panels.append(panel);
  });
  container.append(tabs, panels);
}

function renderMoments(content) {
  setText("[data-moments-intro]", content.momentsIntro || "");
  const moments = content.moments || [];
  const image = document.querySelector("[data-moment-image]");
  const actions = document.querySelector("[data-moment-actions]");
  if (!image || !actions || moments.length === 0) return;

  function showMoment(index) {
    momentIndex = (index + moments.length) % moments.length;
    const active = moments[momentIndex];
    image.src = active.image || "";
    image.alt = active.title || "Academic moment";
    setText("[data-moment-title]", active.title || "");
    setText("[data-moment-caption]", active.caption || "");
    actions.querySelectorAll("button").forEach((button, buttonIndex) => {
      button.classList.toggle("is-active", buttonIndex === momentIndex);
      button.setAttribute("aria-pressed", String(buttonIndex === momentIndex));
    });
  }

  actions.innerHTML = "";
  moments.forEach((moment, index) => {
    const button = createElement("button", index === 0 ? "is-active" : "", String(index + 1));
    button.type = "button";
    button.setAttribute("aria-label", moment.title || `Photo ${index + 1}`);
    button.setAttribute("aria-pressed", String(index === 0));
    button.addEventListener("click", () => {
      window.clearInterval(momentTimer);
      showMoment(index);
    });
    actions.append(button);
  });

  showMoment(0);
  window.clearInterval(momentTimer);
  momentTimer = window.setInterval(() => showMoment(momentIndex + 1), 5500);
}

const PAPER_CATEGORIES = [
  ["published", "Published"],
  ["forthcoming", "Forthcoming"],
  ["review", "Under Review"],
  ["working", "Working Papers"],
];

function paperCategory(paper) {
  const status = paper.status || "";
  if (/\bpublished\b/i.test(status)) return "published";
  if (/\bforthcoming\b/i.test(status)) return "forthcoming";
  if (/review|revision/i.test(status)) return "review";
  return "working";
}

function renderPaperFilters(content) {
  const container = document.querySelector("[data-paper-filters]");
  if (!container) return;
  container.innerHTML = "";

  const papers = content.papers || [];
  const categories = [["all", "All Papers"], ...PAPER_CATEGORIES];
  categories.forEach(([key, label]) => {
    const count = key === "all" ? papers.length : papers.filter((paper) => paperCategory(paper) === key).length;
    if (key !== "all" && count === 0) return;
    const button = createElement("button", key === "all" ? "is-active" : "", label);
    const counter = createElement("span", "filter-count", String(count));
    counter.setAttribute("aria-hidden", "true");
    button.append(counter);
    button.type = "button";
    button.dataset.filter = key;
    button.setAttribute("aria-pressed", String(key === "all"));
    button.setAttribute("aria-label", `${label}, ${count} ${count === 1 ? "paper" : "papers"}`);
    container.append(button);
  });

  filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
}

function renderPapers(content) {
  setText("[data-papers-intro]", content.papersIntro || "");
  renderPaperFilters(content);

  const container = document.querySelector("[data-paper-list]");
  if (!container) return;
  container.innerHTML = "";

  const groups = new Map();
  PAPER_CATEGORIES.forEach(([key, label]) => {
    if (!(content.papers || []).some((paper) => paperCategory(paper) === key)) return;
    const group = createElement("section", "paper-group");
    group.dataset.category = key;
    const heading = createElement("div", "paper-group-heading");
    const title = createElement("h3", "", label);
    title.id = `papers-${key}`;
    group.setAttribute("aria-labelledby", title.id);
    const count = createElement("span", "paper-group-count");
    count.dataset.groupCount = "";
    heading.append(title, count);
    const list = createElement("div", "paper-group-list");
    group.append(heading, list);
    container.append(group);
    groups.set(key, list);
  });

  (content.papers || []).forEach((paper) => {
    const card = createElement("article", "paper-card");
    card.dataset.category = paperCategory(paper);
    card.dataset.keywords = [
      paper.title,
      paper.meta,
      paper.overview,
      paper.doi,
      paper.topicLabel,
      ...(paper.tags || []),
    ].join(" ");

    if (paper.year) card.append(createElement("div", "paper-year", paper.year));
    const body = createElement("div", "paper-body");
    body.append(createElement("p", "paper-status", paper.status || ""));
    body.append(createElement("h4", "paper-title", paper.title || ""));
    body.append(createElement("p", "paper-meta", paper.meta || ""));
    body.append(createElement("p", "", paper.overview || ""));

    const tags = createElement("div", "tag-row");
    (paper.tags || []).forEach((tag) => tags.append(createElement("span", "", tag)));
    body.append(tags);

    const actions = createElement("div", "paper-actions");
    const detailLink = createElement("a", "button paper-detail-link", "Details");
    detailLink.href = `paper.html?id=${encodeURIComponent(paper.id || paper.title || "")}`;
    actions.append(detailLink);
    const doi = paper.doi?.trim();
    if (doi) {
      const doiLink = createElement("a", "button paper-detail-link", "DOI");
      doiLink.href = `https://doi.org/${doi}`;
      doiLink.setAttribute("aria-label", `DOI for ${paper.title}`);
      actions.append(doiLink);
    }
    body.append(actions);

    card.append(body);
    groups.get(card.dataset.category).append(card);
  });

  paperCards = Array.from(document.querySelectorAll(".paper-card"));
  bindPaperFilters();
  filterPapers();
}

function renderEducation(content) {
  setText("[data-education-intro]", content.educationIntro || "");
  const container = document.querySelector("[data-education-grid]");
  if (!container) return;
  container.innerHTML = "";
  (content.education || []).forEach((item, index) => {
    const card = createElement("li", "timeline-item");
    const entry = createElement("details", "education-entry");
    entry.open = index === 0;
    entry.dataset.expanded = String(index === 0);
    const summary = createElement("summary");
    summary.id = `education-summary-${index}`;
    const heading = createElement("h3", "education-summary");
    heading.append(createElement("span", "education-label", item.label || ""));
    heading.append(createElement("span", "education-title", item.title || ""));
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.classList.add("education-chevron");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("fill", "none");
    icon.setAttribute("stroke", "currentColor");
    icon.setAttribute("stroke-width", "1.8");
    icon.setAttribute("stroke-linecap", "round");
    icon.setAttribute("stroke-linejoin", "round");
    icon.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "m6 9 6 6 6-6");
    icon.append(path);
    summary.append(heading, icon);
    entry.append(summary);
    const body = createElement("div", "education-body");
    body.id = `education-body-${index}`;
    body.setAttribute("aria-labelledby", summary.id);
    summary.setAttribute("aria-controls", body.id);
    if (item.description) body.append(createElement("p", "education-description", item.description));
    if (index === 0) {
      body.append(createResearchLink("Explore my research", "#research", "experience-button education-research-link"));
    }
    entry.append(body);
    card.append(entry);
    container.append(card);
  });
}

function renderFiles(content) {
  setText("[data-files-intro]", content.filesIntro || "");
  const container = document.querySelector("[data-file-grid]");
  if (!container) return;
  container.innerHTML = "";
  const files = content.files || [];
  if (fileEmptyState) fileEmptyState.hidden = files.length > 0;

  files.forEach((file) => {
    const card = createElement("article", "file-card");
    const type = createElement("p", "project-type", file.type || "File");
    const title = createElement("h3", "writing-title", file.title || "Untitled file");
    if (file.language) title.lang = file.language;
    const description = createElement("p", "writing-summary", file.description || "");
    const link = createElement("a", "button file-link", file.buttonText || "Open");
    link.href = file.url || "#";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    card.append(type, title, description, link);
    container.append(card);
  });
}

function renderContact(content) {
  setText("[data-contact-title]", content.contact?.title || "");
  setText("[data-contact-text]", content.contact?.text || "");
}

function renderSite() {
  const content = getContent();
  if (!content) return;
  renderProfile(content);
  renderResearch(content);
  renderMoments(content);
  renderPapers(content);
  renderEducation(content);
  renderFiles(content);
  renderContact(content);
  observeSections();
}

const closeMenu = () => {
  document.body.classList.remove("nav-open");
  navToggle?.setAttribute("aria-expanded", "false");
};

const updateHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
};

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

navToggle?.addEventListener("click", () => {
  const isOpen = document.body.classList.toggle("nav-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

themeToggle?.addEventListener("click", () => {
  const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  localStorage.setItem("academic-site-theme", nextTheme);
  updateThemeControls(nextTheme);
});

function filterPapers() {
  const activeCategory = document.querySelector("[data-filter].is-active")?.dataset.filter ?? "all";
  const query = document.querySelector("[data-paper-search]")?.value.trim().toLowerCase() ?? "";
  let visibleCount = 0;

  paperCards.forEach((card) => {
    const categoryMatches = activeCategory === "all" || card.dataset.category === activeCategory;
    const searchableText = `${card.textContent} ${card.dataset.keywords}`.toLowerCase();
    const queryMatches = !query || searchableText.includes(query);
    const isVisible = categoryMatches && queryMatches;
    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

  document.querySelectorAll(".paper-group").forEach((group) => {
    const count = group.querySelectorAll(".paper-card:not([hidden])").length;
    group.hidden = count === 0;
    group.querySelector("[data-group-count]").textContent = `${count} ${count === 1 ? "paper" : "papers"}`;
  });
  setText("[data-paper-results]", `${visibleCount} ${visibleCount === 1 ? "paper" : "papers"}`);
  if (emptyState) emptyState.hidden = visibleCount > 0;
}

function bindPaperFilters() {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      });
      filterPapers();
    });
  });

  document.querySelector("[data-paper-search]")?.addEventListener("input", filterPapers);
}

let sectionObserver;
function observeSections() {
  const navLinks = Array.from(document.querySelectorAll(".site-menu a[href^='#']"));
  if (sectionObserver) sectionObserver.disconnect();

  sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    },
    {
      rootMargin: "-26% 0px -62% 0px",
      threshold: [0.08, 0.18, 0.32],
    },
  );

  document.querySelectorAll("main section[id]").forEach((section) => {
    sectionObserver.observe(section);
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });
}

renderSite();
