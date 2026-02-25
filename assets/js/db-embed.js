(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const init = () => {
    const host = $("#dbEmbed");
    if (!host) return;

    const buttons = $$("[data-tab]", host);
    const frame = $("#dbFrame", host);
    const openLink = $("#dbOpen", host);
    const fallback = $("#dbFallback", host);
    const fallbackLink = $("#dbFallbackOpen", host);

    const setTab = (btn) => {
      buttons.forEach(b => b.setAttribute("aria-selected", b === btn ? "true" : "false"));
      const src = btn.getAttribute("data-src");
      if (!src) return;

      // update links
      if (openLink) openLink.href = src;
      if (fallbackLink) fallbackLink.href = src;

      // reset
      if (fallback) fallback.style.display = "none";

      // load iframe
      if (frame) {
        frame.src = src;
        // Detect common frame-block cases (X-Frame-Options / CSP)
        setTimeout(() => {
          try {
            // If blocked, iframe usually stays about:blank and is accessible.
            const doc = frame.contentDocument;
            const href = doc?.location?.href || "";
            if (href === "about:blank") {
              if (fallback) fallback.style.display = "flex";
            }
          } catch (e) {
            // Cross-origin access error means the page actually loaded (or navigated away from about:blank).
            // Assume OK.
          }
        }, 1800);
      }
    };

    buttons.forEach(btn => btn.addEventListener("click", () => setTab(btn)));

    // Default: first tab
    setTab(buttons[0]);
  };

  document.addEventListener("DOMContentLoaded", init);
})();
