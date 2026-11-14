(() => {
  const pageRoot = document.documentElement;
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const researchSection = document.querySelector("#research");
  const educationTimeline = document.querySelector(".education-timeline");
  const researchTabs = [...document.querySelectorAll(".research-tab")];
  const researchPanels = [...document.querySelectorAll(".research-panel")];
  const researchFrame = document.querySelector(".research-panels");
  const educationEntries = [...document.querySelectorAll(".education-entry")];
  const educationAnimations = new WeakMap();
  let currentResearch = 0;
  let framePending = false;
  let revealObserver;

  const clamp = (value) => Math.max(0, Math.min(1, value));

  function updateScrollScene() {
    framePending = false;
    const maxScroll = Math.max(1, pageRoot.scrollHeight - innerHeight);
    const progress = clamp(scrollY / maxScroll);
    const researchRect = researchSection?.getBoundingClientRect();
    const educationRect = educationTimeline?.getBoundingClientRect();
    const reduced = motionPreference.matches;
    pageRoot.style.setProperty("--page-progress", progress.toFixed(4));
    pageRoot.style.setProperty("--ambient-shift", reduced ? "0px" : `${(-120 * progress).toFixed(1)}px`);
    pageRoot.style.setProperty("--ambient-drift", reduced ? "0px" : `${(90 * progress).toFixed(1)}px`);
    pageRoot.style.setProperty("--ambient-mix", reduced ? "0.4" : (0.2 + 0.75 * progress).toFixed(3));
    if (researchRect) {
      const phase = clamp((innerHeight - researchRect.top) / (innerHeight + researchRect.height));
      researchSection.style.setProperty("--research-shift", reduced ? "0px" : `${((phase - 0.5) * -24).toFixed(1)}px`);
    }
    if (educationRect) {
      const phase = reduced ? 1 : clamp((innerHeight * 0.84 - educationRect.top) / Math.max(1, educationRect.height * 0.8));
      educationTimeline.style.setProperty("--education-progress", phase.toFixed(4));
    }
  }

  function queueScrollScene() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(updateScrollScene);
  }

  function selectResearch(index, focus = false) {
    if (!researchTabs[index]) return;
    const changed = currentResearch !== index;
    currentResearch = index;
    researchTabs.forEach((tab, tabIndex) => {
      tab.setAttribute("aria-selected", String(tabIndex === index));
      tab.tabIndex = tabIndex === index ? 0 : -1;
    });
    researchPanels.forEach((panel, panelIndex) => {
      panel.getAnimations().forEach((animation) => animation.cancel());
      panel.hidden = panelIndex !== index;
    });
    if (researchFrame) researchFrame.dataset.activeLens = String(index);
    if (changed && !motionPreference.matches && researchPanels[index]?.animate) {
      researchPanels[index].animate(
        [{ opacity: 0.25, transform: "translateY(14px)", filter: "blur(4px)" },
          { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }],
        { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
    if (focus) researchTabs[index].focus();
    queueScrollScene();
  }

  researchTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectResearch(index));
    tab.addEventListener("keydown", (event) => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % researchTabs.length;
      if (event.key === "ArrowLeft") next = (index - 1 + researchTabs.length) % researchTabs.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = researchTabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectResearch(next, true);
      }
    });
  });

  document.querySelectorAll(".research-related").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelector('[data-filter="all"]')?.click();
      const search = document.querySelector("[data-paper-search]");
      if (search) {
        search.value = link.dataset.search || "";
        search.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
  });

  function setEducationExpanded(entry, expanded) {
    const summary = entry.querySelector("summary");
    if (!summary) return;
    const start = entry.getBoundingClientRect().height;
    educationAnimations.get(entry)?.cancel();
    educationAnimations.delete(entry);
    entry.dataset.expanded = String(expanded);
    summary.setAttribute("aria-expanded", String(expanded));

    if (motionPreference.matches || !entry.animate) {
      entry.open = expanded;
      entry.style.removeProperty("overflow");
      queueScrollScene();
      return;
    }

    entry.open = true;
    const styles = getComputedStyle(entry);
    const border = parseFloat(styles.borderTopWidth) + parseFloat(styles.borderBottomWidth);
    const end = expanded ? entry.scrollHeight + border : summary.getBoundingClientRect().height + border;
    entry.style.overflow = "hidden";
    const animation = entry.animate(
      [{ height: `${start}px` }, { height: `${end}px` }],
      { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "both" },
    );
    educationAnimations.set(entry, animation);
    animation.onfinish = () => {
      if (educationAnimations.get(entry) !== animation) return;
      educationAnimations.delete(entry);
      entry.open = expanded;
      entry.style.removeProperty("overflow");
      animation.cancel();
      queueScrollScene();
    };
  }

  educationEntries.forEach((entry) => {
    const summary = entry.querySelector("summary");
    summary?.setAttribute("aria-expanded", String(entry.open));
    summary?.addEventListener("click", (event) => {
      event.preventDefault();
      const expanded = entry.dataset.expanded !== "true";
      if (expanded) {
        educationEntries.forEach((other) => {
          if (other !== entry && other.dataset.expanded === "true") setEducationExpanded(other, false);
        });
      }
      setEducationExpanded(entry, expanded);
    });
  });

  const revealTargets = [...document.querySelectorAll(
    ".section > .section-heading, .research-explorer, .paper-group, .timeline-item, .file-card, .moment-viewer, .contact-band",
  )];
  if (!motionPreference.matches && "IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    revealTargets.forEach((target) => {
      target.classList.add("scroll-reveal");
      revealObserver.observe(target);
    });
    pageRoot.classList.add("motion-ready");
  }

  motionPreference.addEventListener("change", () => {
    if (motionPreference.matches) {
      pageRoot.classList.remove("motion-ready");
      revealObserver?.disconnect();
      revealTargets.forEach((target) => target.classList.add("is-revealed"));
      researchPanels.forEach((panel) => panel.getAnimations().forEach((animation) => animation.cancel()));
      educationEntries.forEach((entry) => setEducationExpanded(entry, entry.dataset.expanded === "true"));
    }
    queueScrollScene();
  });

  window.addEventListener("scroll", queueScrollScene, { passive: true });
  window.addEventListener("resize", queueScrollScene, { passive: true });
  queueScrollScene();
})();
