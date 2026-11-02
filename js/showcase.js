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
    let index = 0, moving = false;

    const links = slides.map((slide, position) => {
      const link = document.createElement("a");
      link.className = "showcase-slide";
      link.href = "#catalog";
      link.setAttribute("aria-label", `اكتشفي حقيبة ${slide.name}، إطلالة ${position + 1} من ${slides.length}`);
      const img = document.createElement("img");
      img.src = slide.image;
      img.alt = `إطلالة بحقيبة ${slide.name}`;
      img.width = 1254; img.height = 1254;
      img.loading = "eager";
      if (!position) img.fetchPriority = "high";
      const caption = document.createElement("div");
      caption.className = "showcase-caption";
      const name = document.createElement("strong");
      name.textContent = slide.name;
      const discover = document.createElement("span");
      discover.className = "showcase-discover";
      discover.textContent = "اكتشفي التفاصيل ←";
      caption.append(name, discover);
      link.append(img, caption);
      link.addEventListener("click", event => { event.preventDefault(); openProduct(slide.id); });
      return link;
    });
    // Identical end slides let the last-to-first transition keep moving forward.
    const before = links[links.length - 1].cloneNode(true);
    const after = links[0].cloneNode(true);
    for (const clone of [before, after]) {
      clone.setAttribute("aria-hidden", "true");
      clone.tabIndex = -1;
      clone.inert = true;
    }
    track.replaceChildren(before, ...links, after);
    controls.hidden = slides.length < 2;

    function settle() {
      track.style.transition = "none";
      track.style.transform = `translateX(-${(index + 1) * 100}%)`;
      moving = false;
    }
    function show(next, animate = true) {
      if (moving) return;
      index = (next + slides.length) % slides.length;
      const motion = animate && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      track.style.transition = motion ? "transform .7s var(--ease)" : "none";
      track.style.transform = `translateX(-${(motion ? next + 1 : index + 1) * 100}%)`;
      moving = motion;
      links.forEach((link, position) => {
        link.tabIndex = position === index ? 0 : -1;
        link.setAttribute("aria-hidden", String(position !== index));
      });
      count.textContent = `${index + 1} / ${slides.length}`;
    }
    track.addEventListener("transitionend", event => {
      if (event.target === track && event.propertyName === "transform") settle();
    });
    track.addEventListener("transitioncancel", settle);
    // No hover, touch, focus or modal state can suspend automatic playback.
    function move(delta) { show(index + delta); }
    document.getElementById("showcasePrev").addEventListener("click", () => move(-1));
    document.getElementById("showcaseNext").addEventListener("click", () => move(1));
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
    show(0, false);
    if (slides.length > 1) setInterval(() => show(index + 1), 5000);
  }

  if (typeof module !== "undefined" && module.exports) module.exports = { modelSlides };
  if (typeof window !== "undefined") window.ShantaShowcase = { init };
})();
