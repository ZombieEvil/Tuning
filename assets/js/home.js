(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const escapeHtml = (s) =>
    (s ?? "").toString().replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

  const initSearch = () => {
    const form = $("#homeSearchForm");
    const input = $("#homeSearch");
    if (!form || !input) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = (input.value || "").trim();
      const url = q ? `roster/index.html?q=${encodeURIComponent(q)}` : "roster/index.html";
      location.href = url;
    });
  };

  const renderRosterTeaser = async () => {
    const host = $("#homeRoster");
    if (!host) return;

    let roster;
    try {
      roster = await window.URM.fetchJSON(`assets/data/roster.json`);
    } catch (e) {
      host.innerHTML = `<div class="panel notice"><strong>Roster indisponible.</strong><div class="small">Lance le site via un serveur local.</div></div>`;
      return;
    }

    // Best effort: load mapping for portraits
    let map = null;
    try {
      map = await window.URM.fetchJSON(`assets/data/urm-character-map.json`);
    } catch (e) {}

    const baseToUrmId = map?.baseToUrmId || window.URM?.assets?.baseToUrmId || {};
    const cand = (urmId) => {
      if (typeof window.URM?.assets?.charaImageCandidates === "function") return window.URM.assets.charaImageCandidates(urmId);
      const ch = `Ch${String(Number(urmId)).padStart(3, "0")}`;
      const rel = `/assets/Character/${ch}/GUI/FaceIcon/T_ui_${ch}_CharaImage`;
      return [
        `https://ultrarumble.com${rel}.png`,
        `https://fr.ultrarumble.com${rel}.png`,
        `https://ultrarumble.com${rel}.webp`,
        `https://fr.ultrarumble.com${rel}.webp`,
      ];
    };

    const bases = (roster?.bases || []).slice(0, 12);

    host.innerHTML = bases
      .map((b) => {
        const urmId = baseToUrmId[b.id];
        const img = urmId
          ? `<img data-urm-img="1" data-srcs="${escapeHtml(cand(urmId).join('|'))}" alt="" loading="lazy" decoding="async">`
          : "";

        const firstTags = (b.variants || []).slice(0, 3).map(v => v.variant ? `<span class="tag tag--${v.variant}">${v.variant}</span>` : `<span class="tag">—</span>`).join(" ");

        return `
          <article class="panel card">
            <div class="chara-splash" aria-hidden="true" style="height:150px">
              ${img}
              <div class="chara-label">
                <strong>${escapeHtml(b.name)}</strong>
                <span>${(b.variants || []).length} variante${(b.variants || []).length > 1 ? "s" : ""}</span>
              </div>
            </div>

            <div class="card-meta">${firstTags}</div>
            <a class="btn secondary" href="characters/${escapeHtml(b.id)}/index.html">Ouvrir</a>
          </article>
        `;
      })
      .join("");

    host.querySelectorAll('img[data-urm-img="1"]').forEach((imgEl) => {
      const srcs = (imgEl.getAttribute('data-srcs') || '').split('|').filter(Boolean);
      window.URM?.loadImage?.(imgEl, srcs);
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    initSearch();
    renderRosterTeaser();
  });
})();
