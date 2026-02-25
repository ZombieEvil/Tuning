(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const norm = (s) => (s || "").toString().toLowerCase().normalize("NFKD").replace(/\p{Diacritic}/gu, "");
  const escapeHtml = (s) =>
    (s ?? "").toString().replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

  const buildTag = (v) => (!v ? `<span class="tag">—</span>` : `<span class="tag tag--${v}">${v}</span>`);

  const render = (bases, prefix) => {
    const list = $("#rosterList");
    if (!list) return;

    const assets = window.URM?.assets;
    const baseToUrmId = assets?.baseToUrmId || {};
    const charaUrl = assets?.charaImageUrl;

    list.innerHTML = bases
      .map((b) => {
        const tags = b.variants.map((v) => buildTag(v.variant)).join(" ");
        const count = b.variants.length;

        const urmId = baseToUrmId[b.id];
        const img = (urmId && typeof charaUrl === "function")
          ? `<img src="${escapeHtml(charaUrl(urmId))}" alt="" loading="lazy" decoding="async"
                onerror="this.remove()">`
          : "";

        return `
          <article class="panel card">
            <div class="chara-splash" aria-hidden="true">
              ${img}
              <div class="chara-label">
                <strong>${escapeHtml(b.name)}</strong>
                <span>${count} variante${count > 1 ? "s" : ""}</span>
              </div>
            </div>

            <div class="card-meta" aria-label="Tags variantes">${tags}</div>

            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:6px;">
              <a class="btn secondary" href="${prefix}characters/${b.id}/index.html">Ouvrir la fiche</a>
              <button class="btn ghost" data-base="${escapeHtml(b.id)}" type="button">Partager</button>
            </div>

            <div class="small" style="margin-top:2px">
              Astuce : clique une variante dans la fiche pour switcher le build.
            </div>
          </article>
        `;
      })
      .join("");

    $("#rosterCount").textContent = `${bases.length} personnage${bases.length > 1 ? "s" : ""}`;

    $$("button[data-base]", list).forEach((btn) => {
      btn.addEventListener("click", async () => {
        const base = btn.getAttribute("data-base");
        const url = new URL(`${prefix}characters/${base}/index.html`, location.href).href;
        try {
          await navigator.clipboard.writeText(url);
          window.URM?.toast?.("Lien copié !");
        } catch (e) {
          window.URM?.toast?.("Copie impossible (navigateur).");
        }
      });
    });
  };

  const getPrefix = () => "../";

  const init = async () => {
    const prefix = getPrefix();
    let roster;
    try {
      roster = await window.URM.fetchJSON(`${prefix}assets/data/roster.json`);
    } catch (e) {
      $("#rosterList").innerHTML =
        `<div class="panel notice"><strong>Impossible de charger les données.</strong><div class="small">Lance le site via un serveur local (ex: <span class="mono">python -m http.server</span>).</div></div>`;
      return;
    }

    const bases = roster.bases;
    const search = $("#rosterSearch");
    const checks = $$("input[name='vf']");
    const state = { q: "", filters: new Set() };

    const apply = () => {
      const q = norm(state.q);
      const out = bases.filter((b) => {
        const hay = norm(b.name + " " + b.variants.map((v) => v.label).join(" "));
        if (q && !hay.includes(q)) return false;

        if (state.filters.size === 0) return true;
        return b.variants.some((v) => state.filters.has(v.variant || "NONE"));
      });

      render(out, prefix);
    };

    search?.addEventListener("input", (e) => {
      state.q = e.target.value || "";
      apply();
    });

    checks.forEach((ch) => {
      ch.addEventListener("change", () => {
        state.filters = new Set(checks.filter((c) => c.checked).map((c) => c.value));
        apply();
      });
    });

    const params = new URLSearchParams(location.search);
    const preQ = params.get("q");
    if (preQ && search) {
      search.value = preQ;
      state.q = preQ;
    }

    render(bases, prefix);

    const note = $("#variantNote");
    if (note && roster.variantMeaningNote) note.textContent = roster.variantMeaningNote;
  };

  document.addEventListener("DOMContentLoaded", init);
})();
