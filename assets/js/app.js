(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const getPrefixFromBrand = () => {
    // All pages include a ".brand" link back to index with a relative href.
    // Example: "../../index.html" => prefix "../../"
    const a = $(".brand");
    const href = a?.getAttribute("href") || "index.html";
    return href.replace(/index\.html$/i, "");
  };

  const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("urm_theme", theme);
    const btn = $("#themeToggle");
    if (btn) btn.setAttribute("aria-label", theme === "light" ? "Passer en thème sombre" : "Passer en thème clair");
  };

  const initTheme = () => {
    const saved = localStorage.getItem("urm_theme");
    if (saved === "light" || saved === "dark") return setTheme(saved);
    // Default: dark
    setTheme("dark");
  };

  const toast = (msg) => {
    const host = $("#toast");
    if (!host) return;
    host.querySelector(".toast-msg").textContent = msg;
    host.classList.add("show");
    clearTimeout(host._t);
    host._t = setTimeout(() => host.classList.remove("show"), 1800);
  };

  window.URM = window.URM || {};
  window.URM.toast = toast;

  // Progressive image loader: tries multiple candidate URLs before giving up.
  window.URM.loadImage = (imgEl, candidates, { classOnFail = "img-missing" } = {}) => {
    if (!imgEl || !candidates || !candidates.length) return;
    const urls = candidates.filter(Boolean);
    let i = 0;

    const tryNext = () => {
      if (i >= urls.length) {
        imgEl.classList.add(classOnFail);
        return;
      }
      imgEl.src = urls[i++];
    };

    imgEl.addEventListener("error", tryNext);
    tryNext();
  };

  // Full-screen modal for embedded DB pages (keeps users on your site).
  window.URM.modal = {
    open({ title = "", url = "" } = {}) {
      if (!url) return;
      let host = document.getElementById("urmModal");
      if (!host) {
        host = document.createElement("div");
        host.id = "urmModal";
        host.className = "urmModal";
        host.innerHTML = `
          <div class="urmModal__backdrop" data-close="1"></div>
          <div class="urmModal__panel" role="dialog" aria-modal="true" aria-label="Base de données">
            <div class="urmModal__bar">
              <div class="urmModal__title"></div>
              <div class="urmModal__actions">
                <a class="btn ghost" id="urmModalOpen" target="_blank" rel="noopener">Ouvrir sur la DB</a>
                <button class="btn secondary" type="button" data-close="1">Fermer</button>
              </div>
            </div>
            <div class="urmModal__body">
              <iframe id="urmModalFrame" title="UltraRumble Database" loading="lazy" referrerpolicy="no-referrer"></iframe>
              <div class="iframeFallback" id="urmModalFallback">
                <div class="panel stack">
                  <div class="kicker">Embed bloqué</div>
                  <div class="small">Ton navigateur empêche l’affichage intégré. Utilise “Ouvrir sur la DB”.</div>
                </div>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(host);
        host.addEventListener("click", (e) => {
          const t = e.target;
          if (t && t.getAttribute && t.getAttribute("data-close") === "1") {
            window.URM.modal.close();
          }
        });
        document.addEventListener("keydown", (e) => {
          if (e.key === "Escape") window.URM.modal.close();
        });
      }

      host.classList.add("open");
      host.querySelector(".urmModal__title").textContent = title || "Base de données";

      const frame = host.querySelector("#urmModalFrame");
      const fallback = host.querySelector("#urmModalFallback");
      const open = host.querySelector("#urmModalOpen");
      if (open) open.href = url;
      if (fallback) fallback.style.display = "none";
      if (frame) {
        frame.src = url;
        setTimeout(() => {
          try {
            const doc = frame.contentDocument;
            const href = doc?.location?.href || "";
            if (href === "about:blank") {
              if (fallback) fallback.style.display = "flex";
            }
          } catch (e) {
            // Cross-origin access error usually means the page loaded.
          }
        }, 1800);
      }
    },
    close() {
      const host = document.getElementById("urmModal");
      if (!host) return;
      host.classList.remove("open");
      const frame = host.querySelector("#urmModalFrame");
      if (frame) frame.src = "about:blank";
    },
  };

  window.URM.fetchJSON = async (url) => {
    const clean = (u) => (u || "").toString().split("#")[0].split("?")[0];

    const fromInline = (u) => {
      const pack = window.URM_INLINE;
      if (!pack) return null;
      const p = clean(u);

      if (p.endsWith("assets/data/roster.json")) return pack.roster || null;
      if (p.endsWith("assets/data/site.json")) return pack.site || null;
      if (p.endsWith("assets/data/urm-character-map.json")) return pack.urmCharacterMap || null;

      let m = p.match(/assets\/data\/content\/([^\/]+)\.json$/);
      if (m) return (pack.content && pack.content[m[1]]) ? pack.content[m[1]] : null;

      m = p.match(/assets\/data\/tuning\/([^\/]+)\.json$/);
      if (m) return (pack.tuning && pack.tuning[m[1]]) ? pack.tuning[m[1]] : null;

      return null;
    };

    // Try network/file fetch first (works on server/http).
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      const inline = fromInline(url);
      if (inline !== null) return inline;
      throw e;
    }
  };

  const initNav = () => {
    const burger = $("#burger");
    const drawer = $("#drawer");
    if (burger && drawer) {
      burger.addEventListener("click", () => {
        const open = drawer.classList.toggle("open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
      });
      $$("#drawer a").forEach((a) =>
        a.addEventListener("click", () => {
          drawer.classList.remove("open");
          burger.setAttribute("aria-expanded", "false");
        })
      );
    }

    // Active link highlight
    const path = location.pathname.replace(/\/index\.html$/, "/");
    $$(".navlinks a, #drawer a").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href || href.startsWith("http")) return;
      const abs = new URL(href, location.href).pathname.replace(/\/index\.html$/, "/");
      if (abs === path) a.classList.add("active");
    });

    const themeBtn = $("#themeToggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const cur = document.documentElement.getAttribute("data-theme") || "dark";
        setTheme(cur === "dark" ? "light" : "dark");
        toast(cur === "dark" ? "Thème clair activé !" : "Thème sombre activé !");
      });
    }
  };

  const initReveal = () => {
    // Progressive enhancement: adds a small "comic entrance" on scroll.
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduce) return;

    const targets = $$("main .panel, main .speech, .chara-splash, main .tab, main .btn");
    if (!targets.length) return;

    targets.forEach((el) => el.classList.add("reveal"));

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
    );

    targets.forEach((el) => io.observe(el));
  };

  const pad3 = (n) => String(n).padStart(3, "0");
  const initAssets = async () => {
    const prefix = getPrefixFromBrand();
    try {
      const map = await window.URM.fetchJSON(`${prefix}assets/data/urm-character-map.json`);
      const baseToUrmId = map?.baseToUrmId || {};
      const bannerUrl = map?.bannerUrl;

      window.URM.assets = {
        prefix,
        baseToUrmId,
        bannerUrl,
        toChCode: (urmId) => `Ch${pad3(Number(urmId))}`,
        // Best-effort: try multiple domains + extensions.
        charaImageCandidates: (urmId) => {
          const ch = `Ch${pad3(Number(urmId))}`;
          const rel = `/assets/Character/${ch}/GUI/FaceIcon/T_ui_${ch}_CharaImage`;
          return [
            `https://ultrarumble.com${rel}.png`,
            `https://fr.ultrarumble.com${rel}.png`,
            `https://ultrarumble.com${rel}.webp`,
            `https://fr.ultrarumble.com${rel}.webp`,
          ];
        },
      };
    } catch (e) {
      // If the map can't load (file:// or missing), the site still works without images.
      window.URM.assets = { prefix };
    }
  };

  const initSW = () => {
    // Optional: caches cross-origin assets (images) for faster repeat visits.
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:") return; // SW requires https (or localhost)
    navigator.serviceWorker.register(`${getPrefixFromBrand()}sw.js`).catch(() => {});
  };

  document.addEventListener("DOMContentLoaded", async () => {
    initTheme();
    initNav();
    await initAssets();
    initReveal();
    initSW();
  });
})();
