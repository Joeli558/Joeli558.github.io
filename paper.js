const params = new URLSearchParams(window.location.search);
const requestedId = params.get("id");
const content = window.SITE_CONTENT;
const paper = requestedId
  ? (content.papers || []).find((item) => item.id === requestedId)
  : content.papers?.[0];

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value || "";
}

if (paper) {
  document.title = `${paper.title} | Binghong Li`;
  setText("[data-detail-status]", paper.status);
  setText("[data-detail-title]", paper.title);
  setText("[data-detail-meta]", paper.meta);
  setText("[data-detail-overview]", paper.overview);

  const tags = document.querySelector("[data-detail-tags]");
  if (tags) {
    tags.innerHTML = "";
    (paper.tags || []).forEach((tag) => {
      const item = document.createElement("span");
      item.textContent = tag;
      tags.append(item);
    });
  }

  const email = content.profile?.email || "libinghong84@gmail.com";
  const mail = document.querySelector("[data-detail-mail]");
  if (mail) {
    mail.href = `mailto:${email}?subject=${encodeURIComponent(paper.title)}`;
    const doi = paper.doi?.trim();
    if (doi) {
      const doiLink = document.createElement("a");
      doiLink.className = "button secondary admin-dark-button detail-doi";
      doiLink.href = `https://doi.org/${doi}`;
      doiLink.textContent = `DOI ${doi}`;
      mail.before(doiLink);
    }
  }
} else {
  document.title = "Paper No Longer Listed | Binghong Li";
  setText("[data-detail-status]", "Research Portfolio");
  setText("[data-detail-title]", "Paper no longer listed");
  setText("[data-detail-meta]", "Explore the current publications and forthcoming research.");
  document.querySelector(".detail-layout")?.remove();
  const link = document.createElement("a");
  link.className = "button primary";
  link.href = "index.html#papers";
  link.textContent = "View Current Papers";
  document.querySelector(".detail-hero")?.append(link);
}
