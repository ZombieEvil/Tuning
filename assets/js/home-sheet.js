(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const linkify = (txt) => {
    const s = (txt || "").trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) {
      const safe = s.replaceAll('"', "%22");
      return `<a href="${safe}" target="_blank" rel="noopener">${safe}</a>`;
    }
    return (s ?? "").toString()
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  };

  const parseCSV = (raw) => {
    // Simple CSV parsing (HOME file is a grid, no quoted commas expected).
    const rows = raw.replace(/\r/g, "").split("\n");
    return rows.map((line) => line.split(","));
  };

  const render = (grid) => {
    const table = $("#csvTable");
    const status = $("#csvStatus");
    if (!table || !status) return;

    const maxCols = grid.reduce((m, r) => Math.max(m, r.length), 0);

    const body = grid
      .map((row) => {
        const cells = [];
        for (let i = 0; i < maxCols; i++) {
          const v = row[i] ?? "";
          const html = linkify(v) || "&nbsp;";
          const isEmpty = !String(v || "").trim();
          cells.push(`<td style="${isEmpty ? "opacity:.55" : ""}">${html}</td>`);
        }
        return `<tr>${cells.join("")}</tr>`;
      })
      .join("");

    table.innerHTML = `<tbody>${body}</tbody>`;
    status.textContent = `Chargé : ${grid.length} lignes • ${maxCols} colonnes`;
  };

  const init = async () => {
    const status = $("#csvStatus");
    try {
      const url = encodeURI(`../data/TUNING ULTRA RUMBLE - HOME.csv`);
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.text();
      const grid = parseCSV(raw);
      render(grid);
    } catch (e) {
      if (status) status.textContent = "Impossible de charger le CSV (lance le site via un serveur local).";
    }
  };

  document.addEventListener("DOMContentLoaded", init);
})();
