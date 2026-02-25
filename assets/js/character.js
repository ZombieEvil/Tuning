(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const escapeHtml = (s) => (s ?? "").toString()
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

  const getPrefix = () => "../../";

  const drawBuildCard = async (build, characterName, variantLabel) => {
    const canvas = document.createElement("canvas");
    const w = 1200;
    const lineH = 44;
    const pad = 70;
    const lines = [];

    lines.push(`ULTRA RUMBLE — Build`);
    lines.push(`${characterName} • ${variantLabel}`);
    lines.push(`Mis à jour : ${build.updatedOn || "—"}`);
    lines.push("");
    (build.slots || []).forEach(s => {
      const lvl = (s.level !== undefined && s.level !== null) ? ` (Lv.${s.level})` : "";
      lines.push(`${s.slot} : ${s.skill}${lvl}`);
    });
    if (build.notes) {
      lines.push("");
      lines.push(`Note : ${build.notes}`);
    }

    const h = pad*2 + lines.length*lineH + 40;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    // background
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0,0,w,h);

    // halftone
    ctx.globalAlpha = 0.25;
    for (let y=0; y<h; y+=18){
      for (let x=0; x<w; x+=18){
        ctx.beginPath();
        ctx.arc(x+2, y+2, 2, 0, Math.PI*2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // panel
    ctx.fillStyle = "#101a35";
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = 10;
    roundRect(ctx, 40, 40, w-80, h-80, 36, true, true);

    // accent stripe
    ctx.fillStyle = "#ffd400";
    roundRect(ctx, 70, 70, w-140, 18, 12, true, false);

    // text
    ctx.fillStyle = "#f5f7ff";
    ctx.font = "900 54px Bangers, Arial";
    ctx.fillText(lines[0], 80, 150);

    ctx.font = "800 28px Inter, Arial";
    ctx.fillStyle = "#c6cbe6";
    ctx.fillText(lines[1], 80, 196);

    ctx.font = "700 24px Inter, Arial";
    ctx.fillText(lines[2], 80, 238);

    ctx.fillStyle = "#f5f7ff";
    ctx.font = "800 28px Inter, Arial";
    let y = 300;
    for (let i=3;i<lines.length;i++){
      const t = lines[i];
      if (!t){
        y += lineH/2;
        continue;
      }
      wrapText(ctx, t, 80, y, w-160, 34);
      y += lineH;
    }

    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
    return blob;

    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
      if (typeof radius === "number") radius = {tl: radius, tr: radius, br: radius, bl: radius};
      ctx.beginPath();
      ctx.moveTo(x + radius.tl, y);
      ctx.lineTo(x + width - radius.tr, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
      ctx.lineTo(x + width, y + height - radius.br);
      ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
      ctx.lineTo(x + radius.bl, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
      ctx.lineTo(x, y + radius.tl);
      ctx.quadraticCurveTo(x, y, x + radius.tl, y);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    }
    function wrapText(ctx, text, x, y, maxWidth, lineHeight){
      const words = text.split(" ");
      let line = "";
      for (let n=0; n<words.length; n++){
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0){
          ctx.fillText(line, x, y);
          line = words[n] + " ";
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, x, y);
    }
  };

  const tuningToText = (build, characterName, variantLabel) => {
    const lines = [];
    lines.push(`ULTRA RUMBLE — Build`);
    lines.push(`${characterName} • ${variantLabel}`);
    lines.push(`Mis à jour : ${build.updatedOn || "—"}`);
    lines.push("");
    (build.slots || []).forEach(s => {
      const lvl = (s.level !== undefined && s.level !== null) ? ` (Lv.${s.level})` : "";
      lines.push(`- ${s.slot} : ${s.skill}${lvl}`);
      if (s.why) lines.push(`  ↳ ${s.why}`);
    });
    if (build.notes) {
      lines.push("");
      lines.push(`Note : ${build.notes}`);
    }
    return lines.join("\n");
  };

  const renderVariantPanel = async ({base, variant, content, prefix}) => {
    const host = $("#variantPanel");
    if (!host) return;

    const tabs = base.variants.map(v => {
      const tag = v.variant ? `<span class="tag tag--${v.variant}">${v.variant}</span>` : `<span class="tag">—</span>`;
      const active = (variant.id === v.id) ? "active" : "";
      return `<a class="tab ${active}" href="#${v.id}" data-vid="${v.id}">${tag} <span style="margin-left:6px">${escapeHtml(v.label)}</span></a>`;
    }).join("");

    // skeleton first
    const assets = window.URM?.assets;
    const urmId = assets?.baseToUrmId?.[base.id];
    const imgUrl = (urmId && typeof assets?.charaImageUrl === "function") ? assets.charaImageUrl(urmId) : null;
    const heroImg = imgUrl ? `<img src="${escapeHtml(imgUrl)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">` : "";

    host.innerHTML = `
      <section class="panel cut stack">
        <div class="kicker">Fiche personnage</div>

        <div class="chara-splash" style="height:220px; margin-top:10px" aria-hidden="true">
          ${heroImg}
          <div class="chara-label">
            <strong>${escapeHtml(base.name)}</strong>
            <span>Choisis une variante → build & conseils</span>
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <div class="badge dot">Base</div>
          <div class="badge" title="Identifiant interne du site">
            ID : <span class="mono">${escapeHtml(base.id)}</span>
          </div>
        </div>

        <div class="tabs" aria-label="Variantes">${tabs}</div>

        <div class="notice">
          <strong>Important :</strong>
          <div class="small" style="margin-top:6px">
            Ton fichier HOME est déjà intégré au site (les visiteurs n’ont rien à importer).
            En revanche, il ne contient pas les réglages de T.U.N.I.N.G détaillés : les sections “Tuning recommandé”
            s’affichent automatiquement dès que tu ajoutes tes builds dans <span class="mono">assets/data/tuning/</span>.
          </div>
        </div>
      </section>

      <section class="grid grid-2">
        <div class="panel stack">
          <h2 class="h2">Playstyle</h2>
          <ul id="playstyleList" style="margin:0; padding-left:18px"></ul>
          <div class="hr"></div>
          <h2 class="h2">Tips</h2>
          <ul id="tipsList" style="margin:0; padding-left:18px"></ul>
        </div>

        <div class="panel stack">
          <h2 class="h2">Tuning recommandé</h2>
          <div id="tuningBox"></div>
          <div class="hr"></div>
          <h2 class="h2">Synergies</h2>
          <div id="synBox" class="stack"></div>
        </div>
      </section>

      <section class="panel stack">
        <h2 class="h2">Sources</h2>
        <div id="srcBox" class="stack"></div>
      </section>
    `;
    // fill content
    const play = $("#playstyleList");
    if (play) play.innerHTML = (content.playstyle || []).map(t => `<li>${escapeHtml(t)}</li>`).join("");
    const tips = $("#tipsList");
    if (tips) tips.innerHTML = (content.tips || []).map(t => `<li>${escapeHtml(t)}</li>`).join("");
    const syn = $("#synBox");
    if (syn) syn.innerHTML = (content.synergies || []).map(s => `
      <div class="speech">
        <div style="font-weight:1000">${escapeHtml(s.with)}</div>
        <div class="small">${escapeHtml(s.why)}</div>
      </div>
    `).join("");

    const srcBox = $("#srcBox");
    if (srcBox) srcBox.innerHTML = (content.sources || []).map(s => `
      <div class="speech">
        <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.label)}</a>
        <div class="small">${escapeHtml(s.url)}</div>
      </div>
    `).join("");

    // tuning load
    const tuningBox = $("#tuningBox");
    if (!tuningBox) return;
    tuningBox.innerHTML = `<div class="small">Chargement…</div>`;

    let build = null;
    try{
      build = await window.URM.fetchJSON(`${prefix}assets/data/tuning/${variant.id}.json`);
    }catch(e){
      // no build file
    }

    if (!build){
      tuningBox.innerHTML = `
        <div class="notice">
          <strong>Build indisponible (à remplir).</strong>
          <div class="small" style="margin-top:8px">
            Ajoute un fichier :
            <div class="mono" style="margin-top:6px">${escapeHtml(`assets/data/tuning/${variant.id}.json`)}</div>
            en copiant le modèle <a href="${prefix}assets/data/tuning/example.json" target="_blank" rel="noopener">example.json</a>.
          </div>
          <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
            <a class="btn secondary" href="${prefix}tuning/index.html">Voir le générateur</a>
            <a class="btn ghost" href="${prefix}resources/index.html">Rejoindre la commu</a>
          </div>
        </div>
      `;
      hookTabs(prefix);
      return;
    }

    // build present
    const rows = (build.slots || []).map(s => `
      <tr>
        <td style="font-weight:1000">${escapeHtml(s.slot)}</td>
        <td>${escapeHtml(s.skill)}</td>
        <td>${(s.level ?? "—")}</td>
        <td class="small">${escapeHtml(s.why || "")}</td>
      </tr>
    `).join("");

    tuningBox.innerHTML = `
      <div class="speech">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
          <div>
            <div style="font-weight:1000">${escapeHtml(build.title || "Build")}</div>
            <div class="small">Mis à jour : <span class="mono">${escapeHtml(build.updatedOn || "—")}</span></div>
          </div>
          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn secondary" id="copyBuildBtn" type="button">Copier</button>
            <button class="btn" id="exportBuildBtn" type="button">Exporter PNG</button>
          </div>
        </div>
        <div style="margin-top:12px; overflow:auto">
          <table class="table" aria-label="Tableau de tuning">
            <thead>
              <tr><th>Slot</th><th>Skill</th><th>Niveau</th><th>Pourquoi</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${build.notes ? `<div class="small" style="margin-top:10px"><strong>Note :</strong> ${escapeHtml(build.notes)}</div>` : ""}
      </div>
    `;

    const characterName = base.name;
    const variantLabel = variant.label;

    $("#copyBuildBtn")?.addEventListener("click", async () => {
      const txt = tuningToText(build, characterName, variantLabel);
      try{
        await navigator.clipboard.writeText(txt);
        window.URM?.toast?.("Build copié !");
      }catch(e){
        window.URM?.toast?.("Copie impossible (navigateur).");
      }
    });

    $("#exportBuildBtn")?.addEventListener("click", async () => {
      try{
        const blob = await drawBuildCard(build, characterName, variantLabel);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${base.id}-${variant.id}-build.png`.replace(/[^a-z0-9\-_.]/gi,"_");
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2500);
        window.URM?.toast?.("Export prêt !");
      }catch(e){
        window.URM?.toast?.("Export impossible.");
      }
    });

    hookTabs(prefix);
  };

  const hookTabs = (prefix) => {
    $$(".tab").forEach(a => {
      a.addEventListener("click", (e) => {
        // allow hash navigation; full render will run on hashchange
      });
    });
  };

  const init = async () => {
    const prefix = getPrefix();
    const baseId = document.body.getAttribute("data-base");
    if (!baseId) return;

    let roster;
    try{
      roster = await window.URM.fetchJSON(`${prefix}assets/data/roster.json`);
    }catch(e){
      $("#pageError").innerHTML = `<div class="panel notice"><strong>Impossible de charger le roster.</strong></div>`;
      return;
    }
    const base = roster.bases.find(b => b.id === baseId);
    if (!base){
      $("#pageError").innerHTML = `<div class="panel notice"><strong>Personnage introuvable.</strong></div>`;
      return;
    }

    let content = null;
    try{
      content = await window.URM.fetchJSON(`${prefix}assets/data/content/${baseId}.json`);
    }catch(e){
      content = { playstyle:[], tips:[], synergies:[], sources:[] };
    }

    const getVariantFromHash = () => {
      const id = (location.hash || "").replace("#","").trim();
      if (!id) return base.variants[0];
      return base.variants.find(v => v.id === id) || base.variants[0];
    };

    const render = async () => {
      const variant = getVariantFromHash();
      document.title = `${base.name} — ${variant.label} | ULTRA RUMBLE Guide`;
      await renderVariantPanel({base, variant, content, prefix});
      // update active tab classes
      $$(".tab").forEach(t => {
        const vid = t.getAttribute("data-vid");
        t.classList.toggle("active", vid === variant.id);
      });
    };

    window.addEventListener("hashchange", render);
    await render();

    // Breadcrumb
    const bc = $("#breadcrumb");
    if (bc) bc.innerHTML = `<a href="${prefix}index.html">Accueil</a> <span aria-hidden="true">›</span> <a href="${prefix}roster/index.html">Personnages</a> <span aria-hidden="true">›</span> <span>${base.name}</span>`;
  };

  document.addEventListener("DOMContentLoaded", init);
})();
