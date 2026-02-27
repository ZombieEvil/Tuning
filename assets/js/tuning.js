(() => {
  const $ = (sel, root=document) => root.querySelector(sel);

  const escapeHtml = (s) => (s ?? "").toString()
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");

  const getPrefix = () => "../";

  const tuningToText = (build, characterLabel) => {
    const lines = [];
    lines.push(`ULTRA RUMBLE — Build`);
    lines.push(characterLabel);
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

  const drawBuildCard = async (build, title) => {
    const canvas = document.createElement("canvas");
    const w = 1200;
    const pad = 70;
    const lineH = 44;

    const lines = [];
    lines.push("ULTRA RUMBLE — Build");
    lines.push(title);
    lines.push(`Mis à jour : ${build.updatedOn || "—"}`);
    lines.push("");
    (build.slots || []).forEach(s => {
      const lvl = (s.level !== undefined && s.level !== null) ? ` (Lv.${s.level})` : "";
      lines.push(`${s.slot} : ${s.skill}${lvl}`);
    });

    const h = pad*2 + lines.length*lineH + 40;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0,0,w,h);

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

    ctx.fillStyle = "#101a35";
    ctx.strokeStyle = "#0a0a0a";
    ctx.lineWidth = 10;
    roundRect(ctx, 40, 40, w-80, h-80, 36, true, true);

    ctx.fillStyle = "#00d4ff";
    roundRect(ctx, 70, 70, w-140, 18, 12, true, false);

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
      if (!t){ y += lineH/2; continue; }
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

  const init = async () => {
    const prefix = getPrefix();
    let roster;
    try{
      roster = await window.URM.fetchJSON(`${prefix}assets/data/roster.json`);
    }catch(e){
      $("#genOut").innerHTML = `<div class="notice"><strong>Impossible de charger le roster.</strong></div>`;
      return;
    }

    const baseSel = $("#baseSel");
    const variantSel = $("#variantSel");
    const out = $("#genOut");

    const bases = roster.bases.slice().sort((a,b) => a.name.localeCompare(b.name, "fr", {sensitivity:"base"}));
    baseSel.innerHTML = bases.map(b => `<option value="${b.id}">${escapeHtml(b.name)}</option>`).join("");

    const fillVariants = () => {
      const base = bases.find(b => b.id === baseSel.value) || bases[0];
      variantSel.innerHTML = base.variants.map(v => `<option value="${v.id}">${escapeHtml(v.label)}</option>`).join("");
    };

    const render = async () => {
      const base = bases.find(b => b.id === baseSel.value) || bases[0];
      const variant = base.variants.find(v => v.id === variantSel.value) || base.variants[0];

      const urmId = window.URM?.assets?.baseToUrmId?.[base.id];
      const faceCandidates = (urmId && typeof window.URM?.assets?.charaImageCandidates === "function")
        ? window.URM.assets.charaImageCandidates(urmId)
        : null;
      const dbBase = "https://fr.ultrarumble.com";
      const dbCharUrl = urmId ? `${dbBase}/character/${urmId}` : `${dbBase}/characters`;


      out.innerHTML = `<div class="small">Chargement…</div>`;

      let build=null;
      try{
        build = await window.URM.fetchJSON(`${prefix}assets/data/tuning/${variant.id}.json`);
      }catch(e){}

      if (!build){
        out.innerHTML = `
          <div class="speech">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
              <div style="display:flex; align-items:center; gap:12px;">
                ${faceCandidates ? `<img id="genFace" data-srcs="${escapeHtml(faceCandidates.join('|'))}" alt="${escapeHtml(base.name)}" style="width:52px; height:52px; object-fit:cover; border-radius:14px; border:3px solid var(--ink); box-shadow:var(--shadow);" loading="lazy">` : ``}
                <div>
                  <div style="font-weight:1000">${escapeHtml(base.name)} • ${escapeHtml(variant.label)}</div>
                  <div class="small">Build recommandé : <span class="mono">non publié</span></div>
                </div>
              </div>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <a class="btn secondary" href="${prefix}characters/${base.id}/index.html#${variant.id}">Ouvrir la fiche</a>
                <button class="btn ghost" type="button" id="openDbBtn">Voir skills & dégâts</button>
              </div>
            </div>
            <div class="notice" style="margin-top:12px">
              <strong>Pas de build recommandé pour le moment.</strong>
              <div class="small" style="margin-top:8px">
                Tu peux quand même consulter <strong>tous les skills + icônes + valeurs</strong> dans l’onglet
                <span class="mono">T.U.N.I.N.G</span> (sur ce site).
              </div>
            </div>
          </div>
        `;
        const imgEl = $("#genFace", out);
        if (imgEl) {
          const srcs = (imgEl.getAttribute("data-srcs") || "").split("|").filter(Boolean);
          window.URM?.loadImage?.(imgEl, srcs);
        }
        $("#openDbBtn", out)?.addEventListener("click", () => window.URM?.modal?.open({ title: `${base.name} — DB`, url: dbCharUrl }));
        return;
      }

      const rows = (build.slots || []).map(s => `
        <tr>
          <td style="font-weight:1000">${escapeHtml(s.slot)}</td>
          <td>${escapeHtml(s.skill)}</td>
          <td>${(s.level ?? "—")}</td>
          <td class="small">${escapeHtml(s.why || "")}</td>
        </tr>
      `).join("");

      out.innerHTML = `
        <div class="speech">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:12px;">
              ${faceCandidates ? `<img id="genFace2" data-srcs="${escapeHtml(faceCandidates.join('|'))}" alt="${escapeHtml(base.name)}" style="width:52px; height:52px; object-fit:cover; border-radius:14px; border:3px solid var(--ink); box-shadow:var(--shadow);" loading="lazy">` : ``}
              <div>
                <div style="font-weight:1000">${escapeHtml(build.title || "Build")}</div>
                <div class="small">${escapeHtml(base.name)} • ${escapeHtml(variant.label)} — Mis à jour : <span class="mono">${escapeHtml(build.updatedOn || "—")}</span></div>
              </div>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <button class="btn secondary" id="copyBtn" type="button">Copier</button>
              <button class="btn" id="pngBtn" type="button">Exporter PNG</button>
              <button class="btn ghost" id="openDbBtn2" type="button">DB (skills & dégâts)</button>
            </div>
          </div>
          <div style="margin-top:12px; overflow:auto">
            <table class="table"><thead><tr><th>Slot</th><th>Skill</th><th>Niveau</th><th>Pourquoi</th></tr></thead><tbody>${rows}</tbody></table>
          </div>
          ${build.notes ? `<div class="small" style="margin-top:10px"><strong>Note :</strong> ${escapeHtml(build.notes)}</div>` : ""}
        </div>
      `;

      const imgEl2 = $("#genFace2", out);
      if (imgEl2) {
        const srcs = (imgEl2.getAttribute("data-srcs") || "").split("|").filter(Boolean);
        window.URM?.loadImage?.(imgEl2, srcs);
      }
      $("#openDbBtn2", out)?.addEventListener("click", () => window.URM?.modal?.open({ title: `${base.name} — DB`, url: dbCharUrl }));

      const label = `${base.name} • ${variant.label}`;

      $("#copyBtn")?.addEventListener("click", async () => {
        try{
          await navigator.clipboard.writeText(tuningToText(build, label));
          window.URM?.toast?.("Build copié !");
        }catch(e){
          window.URM?.toast?.("Copie impossible.");
        }
      });

      $("#pngBtn")?.addEventListener("click", async () => {
        try{
          const blob = await drawBuildCard(build, label);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${variant.id}-build.png`.replace(/[^a-z0-9\-_.]/gi,"_");
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 2500);
          window.URM?.toast?.("Export prêt !");
        }catch(e){
          window.URM?.toast?.("Export impossible.");
        }
      });
    };

    baseSel.addEventListener("change", () => { fillVariants(); render(); });
    variantSel.addEventListener("change", render);

    fillVariants();
    render();
  };

  document.addEventListener("DOMContentLoaded", init);
})();
