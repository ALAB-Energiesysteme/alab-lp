(() => {
  const host = document.getElementById("ref-gallery");
  if (!host) return;

  const wrap  = host.querySelector(".rg");
  const vp    = host.querySelector(".rg__viewport");
  const slides = Array.from(host.querySelectorAll(".rg__slide"));
  const prev  = host.querySelector(".rg__nav--prev");
  const next  = host.querySelector(".rg__nav--next");
  const dotsC = host.querySelector(".rg__dots");
  if (!wrap || !vp || slides.length === 0 || !dotsC) return;

  // Dots
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Slide ${i + 1}`);
    b.addEventListener("click", () => { goToLoop(i); resetAuto(); });
    dotsC.appendChild(b);
  });

  let active = 0;

  function centerTo(i, smooth = true) {
    i = Math.max(0, Math.min(i, slides.length - 1));
    const s = slides[i]; if (!s) return;
    const vpRect = vp.getBoundingClientRect();
    const sRect  = s.getBoundingClientRect();
    const delta = (sRect.left + sRect.width/2) - (vpRect.left + vpRect.width/2);
    vp.scrollBy({ left: delta, behavior: smooth ? "smooth" : "auto" });
  }
  function nearestIndex() {
    const vpRect = vp.getBoundingClientRect();
    let best = 0, bestDist = Infinity;
    slides.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs((r.left + r.width/2) - (vpRect.left + vpRect.width/2));
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }
  function markActive(i) {
    active = i;
    slides.forEach((s, k) => s.setAttribute("aria-selected", String(k === i)));
    Array.from(dotsC.children).forEach((d, k) => d.setAttribute("aria-selected", String(k === i)));
  }
  function goToLoop(i) {
    if (i < 0) i = slides.length - 1;
    if (i > slides.length - 1) i = 0;
    centerTo(i);
    markActive(i);
  }

  prev?.addEventListener("click", () => { goToLoop(active - 1); resetAuto(); });
  next?.addEventListener("click", () => { goToLoop(active + 1); resetAuto(); });
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft")  { e.preventDefault(); goToLoop(active - 1); resetAuto(); }
    if (e.key === "ArrowRight") { e.preventDefault(); goToLoop(active + 1); resetAuto(); }
  });

  // active nach Scroll
  let ticking = false;
  vp.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { markActive(nearestIndex()); ticking = false; });
  });

  // Drag/Swipe
  let drag = { on:false, id:null, startX:0, startLeft:0, moved:false };
  const pointerDown = (e) => {
    if (!e.isPrimary) return;
    drag.on = true; drag.id = e.pointerId; drag.startX = e.clientX; drag.startLeft = vp.scrollLeft; drag.moved = false;
    vp.setPointerCapture(drag.id); stopAuto();
  };
  const pointerMove = (e) => {
    if (!drag.on || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.startX;
    if (!drag.moved && Math.abs(dx) > 5) drag.moved = true;
    if (drag.moved) vp.scrollLeft = drag.startLeft - dx;
  };
  const pointerUp = (e) => {
    if (!drag.on || e.pointerId !== drag.id) return;
    vp.releasePointerCapture(drag.id); drag.on = false;
    centerTo(nearestIndex()); setTimeout(startAuto, 200);
  };
  const clickHandler = (e) => { if (drag.moved){ e.preventDefault(); e.stopPropagation(); } drag.moved = false; };

  vp.addEventListener("pointerdown",  pointerDown);
  vp.addEventListener("pointermove",  pointerMove);
  vp.addEventListener("pointerup",     pointerUp);
  vp.addEventListener("pointercancel", pointerUp);
  vp.addEventListener("click", clickHandler, true);

  // Autoplay nur wenn sichtbar
  let timer = null;
  function startAuto(){ stopAuto(); timer = setInterval(() => goToLoop(active + 1), 3500); }
  function stopAuto(){ if (timer){ clearInterval(timer); timer = null; } }
  function resetAuto(){ stopAuto(); startAuto(); }

  const visObs = new IntersectionObserver(([entry]) => {
    if (entry && entry.isIntersecting) startAuto(); else stopAuto();
  }, { threshold: 0.25 });
  visObs.observe(host);



  // Init
  function initialize(){
    Array.from(dotsC.children).forEach((d,k)=>d.setAttribute("aria-selected", String(k===active)));
    slides.forEach((s,k)=>s.setAttribute("aria-selected", String(k===active)));
    markActive(active);
    centerTo(active, false);
    setTimeout(() => centerTo(active, false), 100);
  }
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
