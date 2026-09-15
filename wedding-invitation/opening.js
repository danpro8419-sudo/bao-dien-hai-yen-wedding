/* V9 — Modular Cinematic Opening
   This file controls ONLY #weddingOpening.
   It does not change styling for the wedding page.
*/
(() => {
  const opening = document.getElementById("weddingOpening");
  const seal = document.getElementById("weddingOpeningSeal");
  if (!opening || !seal) return;

  let running = false;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  function finishOpening() {
    document.body.style.overflow = previousOverflow;

    // Notify the main website without coupling its CSS/JS to this module.
    window.dispatchEvent(new CustomEvent("wedding:opening-complete"));

    const destination =
      document.querySelector("#hero, .hero, #story, .story-section, [data-section='story'], main");

    opening.remove();

    if (destination) {
      requestAnimationFrame(() => destination.scrollIntoView({behavior:"auto", block:"start"}));
    }
  }

  seal.addEventListener("click", () => {
    if (running) return;
    running = true;

    opening.classList.add("wedding-opening--tearing");

    window.setTimeout(() => {
      opening.classList.remove("wedding-opening--tearing");
      opening.classList.add("wedding-opening--revealed");

      // Hold on Bảo Điền & Hải Yến for 3 seconds.
      window.setTimeout(() => {
        opening.classList.add("wedding-opening--exit");
        window.setTimeout(finishOpening, 920);
      }, 3000);
    }, 820);
  });
})();
