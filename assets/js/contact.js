(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const init = () => {
    const form = $("#contactForm");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#cName").value.trim();
      const email = $("#cEmail").value.trim();
      const msg = $("#cMsg").value.trim();

      if (!name || !email || !msg){
        window.URM?.toast?.("Remplis les champs requis.");
        return;
      }

      // No backend in this static ZIP. We provide a mailto fallback.
      const subject = encodeURIComponent("ULTRA RUMBLE — Contact");
      const body = encodeURIComponent(
        `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${msg}\n`
      );
      const mailto = `mailto:ton-email@exemple.com?subject=${subject}&body=${body}`;
      window.location.href = mailto;
    });
  };

  document.addEventListener("DOMContentLoaded", init);
})();
