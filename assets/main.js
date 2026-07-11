/* Sanu Dutta — profile site interactions */
(function () {
  "use strict";

  /* Mobile nav toggle */
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }

  /* Scroll reveal */
  const revs = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revs.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revs.forEach((r) => io.observe(r));
  } else {
    revs.forEach((r) => r.classList.add("in"));
  }

  /* Animated counters */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const decimals = (el.dataset.decimals && parseInt(el.dataset.decimals)) || 0;
    const dur = 1400;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = (decimals ? val.toFixed(decimals) : Math.round(val)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCount(e.target);
            co.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => co.observe(c));
  } else {
    counters.forEach(animateCount);
  }

  /* Skill bars fill on view */
  const bars = document.querySelectorAll(".bar > i");
  if ("IntersectionObserver" in window && bars.length) {
    const bo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.width = e.target.dataset.level + "%";
            bo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    bars.forEach((b) => bo.observe(b));
  } else {
    bars.forEach((b) => (b.style.width = b.dataset.level + "%"));
  }

  /* Tabs (expertise page) */
  const tabs = document.querySelectorAll(".tab");
  if (tabs.length) {
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const id = tab.dataset.tab;
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        document.querySelectorAll(".tab-panel").forEach((p) => {
          p.classList.toggle("active", p.dataset.panel === id);
        });
      });
    });
  }

  /* Deal filters (portfolio page) */
  const filters = document.querySelectorAll(".filter");
  const deals = document.querySelectorAll(".deal[data-cats]");
  if (filters.length && deals.length) {
    filters.forEach((f) => {
      f.addEventListener("click", () => {
        const cat = f.dataset.filter;
        filters.forEach((x) => x.classList.remove("active"));
        f.classList.add("active");
        deals.forEach((d) => {
          const show = cat === "all" || d.dataset.cats.split(" ").includes(cat);
          d.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* Contact form -> mailto */
  const form = document.querySelector("#contactForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.querySelector("#cf-name").value.trim();
      const email = form.querySelector("#cf-email").value.trim();
      const msg = form.querySelector("#cf-msg").value.trim();
      const subject = encodeURIComponent(`Enquiry from ${name || "website"}`);
      const body = encodeURIComponent(`${msg}\n\n— ${name}\n${email}`);
      window.location.href = `mailto:sanu.dutta1305@gmail.com?subject=${subject}&body=${body}`;
    });
  }

  /* Footer year */
  const y = document.querySelector("#year");
  if (y) y.textContent = new Date().getFullYear();
})();
