/* Campaign imagery is deliberately separate from product-only gallery photos. */
(function () {
  "use strict";

  function modelSlides(products) {
    return products.flatMap(product => {
      const image = product.images?.find(path => /-06\.webp(?:\?.*)?$/.test(path));
      return image ? [{ id: product.id, name: product.code, image }] : [];
    });
  }

  function init(products, openProduct) {
    const root = document.getElementById("heroShowcase");
    const track = document.getElementById("showcaseTrack");
    const slides = modelSlides(products);
    if (!root || !track || !slides.length) return;
    const controls = document.getElementById("showcaseControls");
    const count = document.getElementById("showcaseCount");
    const toggle = document.getElementById("showcasePause");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let index = 0, paused = reduced.matches, inView = true, hovered = false, timer;

    const links = slides.map((slide, position) => {
      const link = document.createElement("a");
      link.className = "showcase-slide";
      link.href = "#catalog";
      link.setAttribute("aria-label", `اكتشفي حقيبة ${slide.name}، إطلالة ${position + 1} من ${slides.length}`);
      const img = document.createElement("img");
      img.src = slide.image;
      img.alt = `إطلالة بحقيبة ${slide.name}`;
      img.width = 1254; img.height = 1254;
      img.loading = position < 2 ? "eager" : "lazy";
      if (!position) img.fetchPriority = "high";
      const caption = document.createElement("div");
      caption.className = "showcase-caption";
      const kicker = document.createElement("span");
      kicker.textContent = "شنطة، على طريقتك.";
      const name = document.createElement("strong");
      name.textContent = slide.name;
      const discover = document.createElement("span");
      discover.className = "showcase-discover";
      discover.textContent = "اكتشفي التفاصيل ←";
      caption.append(kicker, name, discover);
      link.append(img, caption);
      link.addEventListener("click", event => { event.preventDefault(); openProduct(slide.id); });
      return link;
    });
    track.replaceChildren(...links);
    controls.hidden = slides.length < 2;

    function show(next) {
      index = (next + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      links.forEach((link, position) => {
        link.tabIndex = position === index ? 0 : -1;
        link.setAttribute("aria-hidden", String(position !== index));
      });
      count.textContent = `${index + 1} / ${slides.length}`;
      links[(index + 1) % slides.length].querySelector("img").loading = "eager";
    }
    function schedule() {
      clearInterval(timer);
      if (!paused && inView && !hovered && !document.hidden && !root.matches(":focus-within") && slides.length > 1) {
        timer = setInterval(() => {
          if (!document.body.classList.contains("modal-open")) show(index + 1);
        }, 5000);
      }
      toggle.textContent = paused ? "تشغيل تلقائي" : "إيقاف مؤقت";
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.setAttribute("aria-label", paused ? "تشغيل عرض الإطلالات تلقائياً" : "إيقاف عرض الإطلالات مؤقتاً");
    }
    function move(delta) { show(index + delta); schedule(); }
    document.getElementById("showcasePrev").addEventListener("click", () => move(-1));
    document.getElementById("showcaseNext").addEventListener("click", () => move(1));
    toggle.addEventListener("click", () => { paused = !paused; schedule(); });
    root.addEventListener("mouseenter", () => { hovered = true; schedule(); });
    root.addEventListener("mouseleave", () => { hovered = false; schedule(); });
    root.addEventListener("focusin", schedule);
    root.addEventListener("focusout", () => queueMicrotask(schedule));
    document.addEventListener("visibilitychange", schedule);
    reduced.addEventListener("change", () => { paused = reduced.matches; schedule(); });
    if (typeof IntersectionObserver !== "undefined") {
      new IntersectionObserver(entries => { inView = entries[0].isIntersecting; schedule(); }, { threshold: .2 }).observe(root);
    }
    let touchStart;
    track.addEventListener("touchstart", event => { touchStart = [event.touches[0].clientX, event.touches[0].clientY]; }, { passive: true });
    track.addEventListener("touchend", event => {
      if (!touchStart) return;
      const dx = event.changedTouches[0].clientX - touchStart[0];
      const dy = event.changedTouches[0].clientY - touchStart[1];
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { event.preventDefault(); move(dx < 0 ? 1 : -1); }
      touchStart = null;
    }, { passive: false });
    track.addEventListener("touchcancel", () => { touchStart = null; }, { passive: true });
    const marquee = document.querySelector(".process-marquee");
    const processToggle = document.getElementById("processPause");
    processToggle?.addEventListener("click", () => {
      const stopped = marquee.classList.toggle("is-paused");
      processToggle.textContent = stopped ? "تشغيل الحركة" : "إيقاف الحركة";
      processToggle.setAttribute("aria-pressed", String(stopped));
      processToggle.setAttribute("aria-label", stopped ? "تشغيل شريط خطوات الصناعة" : "إيقاف شريط خطوات الصناعة");
    });
    show(0);
    schedule();
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { modelSlides };
  if (typeof window !== "undefined") window.ShantaShowcase = { init };
})();
