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
  themeIcon.textContent = savedTheme === "dark" ? "L" : "T";
}

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

function renderMetrics(content) {
  const container = document.querySelector("[data-metrics]");
  if (!container) return;
  container.innerHTML = "";
  (content.metrics || []).forEach((metric) => {
    const item = createElement("div", "metric");
    item.append(createElement("strong", "", metric.value || ""));
    item.append(createElement("span", "", metric.label || ""));
    container.append(item);
  });
}

function renderResearch(content) {
  setText("[data-research-intro]", content.researchIntro || "");
  const container = document.querySelector("[data-research-grid]");
  if (!container) return;
  container.innerHTML = "";
  (content.research || []).forEach((item, index) => {
    const card = createElement("article", "focus-card");
    card.append(createElement("span", "focus-index", String(index + 1).padStart(2, "0")));
    card.append(createElement("h3", "", item.title || ""));
    card.append(createElement("p", "", item.description || ""));
    container.append(card);
  });
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

function renderPaperFilters(content) {
  const container = document.querySelector("[data-paper-filters]");
  if (!container) return;
  container.innerHTML = "";

  const topics = new Map([["all", "All"]]);
  (content.papers || []).forEach((paper) => {
    const topic = paper.topic || "other";
    if (!topics.has(topic)) topics.set(topic, paper.topicLabel || topic);
  });

  topics.forEach((label, topic) => {
    const button = createElement("button", topic === "all" ? "is-active" : "", label);
    button.type = "button";
    button.dataset.filter = topic;
    button.setAttribute("aria-pressed", String(topic === "all"));
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

  (content.papers || []).forEach((paper) => {
    const card = createElement("article", "paper-card");
    card.dataset.topic = paper.topic || "other";
    card.dataset.keywords = [
      paper.title,
      paper.meta,
      paper.overview,
      ...(paper.tags || []),
    ].join(" ");

    card.append(createElement("div", "paper-year", paper.year || ""));
    const body = createElement("div", "paper-body");
    body.append(createElement("p", "paper-status", paper.status || ""));
    body.append(createElement("h3", "", paper.title || ""));
    body.append(createElement("p", "paper-meta", paper.meta || ""));
    body.append(createElement("p", "", paper.overview || ""));

    const tags = createElement("div", "tag-row");
    (paper.tags || []).forEach((tag) => tags.append(createElement("span", "", tag)));
    body.append(tags);

    const actions = createElement("div", "paper-actions");
    const detailLink = createElement("a", "button paper-detail-link", "Details");
    detailLink.href = `paper.html?id=${encodeURIComponent(paper.id || paper.title || "")}`;
    actions.append(detailLink);
    body.append(actions);

    card.append(body);
    container.append(card);
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
  (content.education || []).forEach((item) => {
    const card = createElement("article", "timeline-item");
    card.append(createElement("span", "", item.label || ""));
    card.append(createElement("h3", "", item.title || ""));
    card.append(createElement("p", "", item.description || ""));
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
    const title = createElement("h3", "", file.title || "Untitled file");
    const description = createElement("p", "", file.description || "");
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
  renderMetrics(content);
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
  themeIcon.textContent = nextTheme === "dark" ? "L" : "T";
});

function filterPapers() {
  const activeTopic = document.querySelector("[data-filter].is-active")?.dataset.filter ?? "all";
  const query = document.querySelector("[data-paper-search]")?.value.trim().toLowerCase() ?? "";
  let visibleCount = 0;

  paperCards.forEach((card) => {
    const topicMatches = activeTopic === "all" || card.dataset.topic === activeTopic;
    const searchableText = `${card.textContent} ${card.dataset.keywords}`.toLowerCase();
    const queryMatches = !query || searchableText.includes(query);
    const isVisible = topicMatches && queryMatches;
    card.hidden = !isVisible;
    if (isVisible) visibleCount += 1;
  });

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
