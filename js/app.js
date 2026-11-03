/**
 * Shanta (شنطة) — Luxury Handmade Bag Boutique
 * Application Controller: DOM Rendering, Filtering, Modal State & WhatsApp Integration
 */

(function () {
  "use strict";

  /* ==========================================================================
     1. Application State & DOM References
     ========================================================================== */

  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;", "'":"&#39;"}[c]));

  const state = {
    selectedBag: null,
    galleryIndex: 0,
    lastFocusedElement: null
  };

  const dom = {
    productsGrid: document.getElementById("productsGrid"),
    modalBackdrop: document.getElementById("detailModalBackdrop"),
    modalCloseBtn: document.getElementById("modalCloseBtn"),
    modalImage: document.getElementById("modalImage"),
    modalCategory: document.getElementById("modalCategory"),
    modalCode: document.getElementById("modalCode"),
    modalTitle: document.getElementById("modalTitle"),
    modalDesc: document.getElementById("modalDesc"),
    modalHighlights: document.getElementById("modalHighlights"),
    modalColorSwatch: document.getElementById("modalColorSwatch"),
    modalColorText: document.getElementById("modalColorText"),
    modalDimensions: document.getElementById("modalDimensions"),
    modalYarnType: document.getElementById("modalYarnType"),
    modalHardware: document.getElementById("modalHardware"),
    modalLining: document.getElementById("modalLining"),
    modalOrderBtn: document.getElementById("modalOrderBtn")
  };

  /* ==========================================================================
     2. WhatsApp URI Builder
     ========================================================================== */

  /**
   * Generates a pre-filled, URI-encoded WhatsApp order URL for a specific bag.
   * Format: https://wa.me/201505765917?text=مرحباً شنطة، أود طلب: [كود الشنطة] | اللون: [اللون] | السعر: [سعر المنتج] ج.م
   *
   * @param {Object} bag - Bag item from BAGS_DATA
   * @returns {string} Complete WhatsApp wa.me URL
   */
  function buildWhatsAppOrderUrl(bag) {
    const rawMessage = `مرحباً شنطة، أود طلب: ${bag.code} | اللون: ${bag.color} | السعر: ${bag.price} ج.م`;
    const encodedMessage = encodeURIComponent(rawMessage);
    return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodedMessage}`;
  }

  /**
   * Generates a general WhatsApp inquiry link for header/footer triggers.
   * @returns {string}
   */
  function buildGeneralWhatsAppUrl() {
    const rawMessage = "مرحباً شنطة، أود الاستفسار عن الكتالوج المتاح والطلب.";
    return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(rawMessage)}`;
  }

  /* ==========================================================================
     4. Product Gallery Grid Rendering
     ========================================================================== */

  /**
   * Renders all product cards into the grid.
   */
  function productPurposes(bag) { return bag.purposes?.length ? bag.purposes : [bag.category]; }

  function renderProductsGrid() {
    if (!dom.productsGrid) return;

    const bags = BAGS_DATA;


    if (!bags.length) {
      dom.productsGrid.innerHTML = "<p>لا توجد منتجات حالياً.</p>";
      return;
    }
    dom.productsGrid.innerHTML = bags
      .map((bag) => {
        const whatsappUrl = buildWhatsAppOrderUrl(bag);
        return `
          <article class="product-card" data-bag-id="${escapeHTML(bag.id)}">
            <div
              class="product-card__media"
              data-action="open-modal"
              data-bag-id="${escapeHTML(bag.id)}"
              role="button"
              tabindex="0"
              aria-label="معاينة تفاصيل ${escapeHTML(bag.code)}"
            >
              <img
                src="${escapeHTML(bag.image)}"
                alt="${escapeHTML(bag.code)} - ${escapeHTML(bag.color)}"
                class="product-card__img"
                loading="lazy"
                width="1121" height="1403"
              />
              <div class="product-card__badges">
                <span class="product-card__purposes">${productPurposes(bag).slice(0,2).map(purpose => `<span class="badge-category">${escapeHTML(purpose)}</span>`).join("")}${productPurposes(bag).length > 2 ? `<span class="badge-category">+${productPurposes(bag).length-2}</span>` : ""}</span>
                <span class="badge-code">${escapeHTML(bag.codeBadge)}</span>
              </div>
            </div>

            <div class="product-card__body">
              <div class="product-card__top">
                <h3 class="product-card__title">${escapeHTML(bag.code)}</h3>
                <span class="product-card__price">${escapeHTML(bag.priceFormatted)}</span>
              </div>

              <div class="product-card__color-row">
                <span class="color-swatch" style="background-color: ${escapeHTML(bag.colorHex)};"></span>
                <span>اللون: ${escapeHTML(bag.color)}</span>
              </div>

              <div class="product-card__actions">
                <button
                  type="button"
                  class="card-btn card-btn--preview"
                  aria-label="عرض تفاصيل ${escapeHTML(bag.code)}"
                  data-action="open-modal"
                  data-bag-id="${escapeHTML(bag.id)}"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <span>التفاصيل</span>
                </button>

                <a
                  href="${whatsappUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="card-btn card-btn--whatsapp"
                  aria-label="اطلب ${escapeHTML(bag.code)} عبر واتساب"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12.031 2C6.508 2 2.023 6.485 2.023 12.008c0 1.766.461 3.49 1.337 5.012L2 22l5.122-1.343a9.972 9.972 0 0 0 4.909 1.294h.004c5.522 0 10.007-4.485 10.007-10.008C22.042 6.485 17.554 2 12.031 2Zm5.828 14.129c-.246.695-1.432 1.33-2.006 1.414-.537.079-1.216.112-1.964-.125-.454-.144-1.037-.338-1.784-.661-3.14-1.356-5.19-4.517-5.347-4.726-.157-.209-1.277-1.699-1.277-3.241 0-1.542.808-2.3 1.095-2.613.287-.313.626-.391.835-.391.209 0 .417.002.599.011.192.009.45-.073.704.538.261.627.887 2.169.965 2.326.078.157.13.34.026.549-.104.209-.157.34-.313.522-.157.183-.329.408-.47.549-.157.156-.32.326-.138.64.183.313.812 1.34 1.744 2.171 1.199 1.069 2.21 1.4 2.523 1.557.313.157.496.13.679-.078.183-.209.782-.914.991-1.227.209-.313.417-.261.704-.157.287.104 1.825.861 2.138 1.018.313.157.522.235.599.365.078.131.078.757-.168 1.452Z"/>
                  </svg>
                  <span>اطلب واتساب</span>
                </a>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }

  /* ==========================================================================
     5. Detail Modal Management
     ========================================================================== */

  /**
   * Opens the full-screen blurred detail modal for a selected bag ID.
   * @param {number} bagId
   */
  function galleryImages() {
    const bag = state.selectedBag;
    return bag ? [...new Set([bag.image, ...(bag.images || [])])] : [];
  }

  function renderGallery() {
    const bag = state.selectedBag, images = galleryImages();
    if (!bag) return;
    dom.modalImage.src = images[state.galleryIndex];
    dom.modalImage.alt = `${bag.code} — صورة ${state.galleryIndex + 1} من ${images.length}`;
    const controls = document.getElementById("galleryControls");
    controls.hidden = images.length < 2;
    document.getElementById("galleryNav").hidden = images.length < 2;
    document.getElementById("galleryCount").textContent = `${state.galleryIndex + 1} / ${images.length}`;
    const thumbnails = document.getElementById("galleryThumbnails");
    if (thumbnails.dataset.product !== String(bag.id)) {
    thumbnails.replaceChildren();
    thumbnails.dataset.product = String(bag.id);
    images.forEach((src, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", /-06\.webp$/.test(src) ? `عرض إطلالة ${bag.code} على الموديل` : `عرض صورة ${index + 1} لحقيبة ${bag.code}`);
      button.setAttribute("aria-pressed", String(index === state.galleryIndex));
      const img = document.createElement("img");
      img.src = src; img.alt = ""; img.loading = "lazy";
      button.append(img);
      button.addEventListener("click", () => { state.galleryIndex = index; renderGallery(); document.getElementById("galleryThumbnails").children[index].focus(); });
      thumbnails.append(button);
    });
    }
    [...thumbnails.children].forEach((button,index) => button.setAttribute("aria-pressed", String(index === state.galleryIndex)));
    thumbnails.children[state.galleryIndex]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function moveGallery(offset) {
    const images = galleryImages();
    if (!images.length) return;
    state.galleryIndex = (state.galleryIndex + offset + images.length) % images.length;
    renderGallery();
  }

  function openDetailModal(bagId) {
    const bag = BAGS_DATA.find((item) => item.id === Number(bagId));
    if (!bag || !dom.modalBackdrop) return;

    state.selectedBag = bag;
    state.lastFocusedElement = document.activeElement;

    // Populate modal fields
    state.galleryIndex = 0;
    renderGallery();

    dom.modalCategory.innerHTML = productPurposes(bag).map(purpose => `<span class="modal__purpose-tag">${escapeHTML(purpose)}</span>`).join("");
    dom.modalCode.textContent = bag.codeBadge;
    dom.modalTitle.textContent = bag.code;
    document.getElementById("modalFooterPrice").textContent = bag.priceFormatted;
    dom.modalDesc.textContent = bag.shortDescription;

    dom.modalColorSwatch.style.backgroundColor = bag.colorHex;
    dom.modalColorText.textContent = bag.color;
    // Unknown specifications are omitted instead of repeating placeholder rows.
    const specs = bag.specs || {};
    function specification(element, value) {
      const clean = String(value || "").trim();
      const plain = clean.replace(/[\u064B-\u065F\u0670]/g, "");
      const unknown = !plain || /^(?:تؤكد|تحدد|يؤكد|يحدد)?\s*(?:عند الطلب|لاحقا|غير محدد|غير متاح)$/.test(plain);
      element.textContent = unknown ? "" : clean;
      element.closest(".spec-item").hidden = unknown;
    }
    specification(dom.modalDimensions, specs.dimensions);
    specification(dom.modalYarnType, specs.yarnType);
    specification(dom.modalHardware, specs.hardware);
    specification(dom.modalLining, specs.lining);
    specification(document.getElementById("modalCrafting"), specs.craftingHours);
    document.getElementById("modalInquiryBtn").href = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(`مرحباً شنطة، أود الاستفسار عن حقيبة ${bag.code} (${bag.codeBadge}): المقاس والتوافر وتفاصيل التوصيل.`)}`;

    dom.modalHighlights.innerHTML = (bag.highlights || [])
      .map((chip) => `<span class="highlight-chip">${escapeHTML(chip)}</span>`)
      .join("");

    // Bind WhatsApp order URL
    dom.modalOrderBtn.href = buildWhatsAppOrderUrl(bag);

    // Reveal modal
    dom.modalBackdrop.classList.add("is-open");
    dom.modalBackdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    [document.querySelector("header"), document.querySelector("main"), document.querySelector("footer")].forEach(el => { if (el) el.inert = true; });

    document.querySelector(".modal__scroll").scrollTop = 0;
    if (dom.modalCloseBtn) {
      dom.modalCloseBtn.focus({ preventScroll: true });
    }
  }

  /**
   * Closes the active detail modal and restores scroll and focus.
   */
  function closeDetailModal() {
    if (!dom.modalBackdrop) return;

    dom.modalBackdrop.classList.remove("is-open");
    dom.modalBackdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    [document.querySelector("header"), document.querySelector("main"), document.querySelector("footer")].forEach(el => { if (el) el.inert = false; });
    state.selectedBag = null;

    if (state.lastFocusedElement && typeof state.lastFocusedElement.focus === "function") {
      state.lastFocusedElement.focus();
    }
  }

  /* ==========================================================================
     6. Event Listeners & Initialization
     ========================================================================== */

  function bindEvents() {
    document.getElementById("galleryPrev").addEventListener("click", () => moveGallery(-1));
    document.getElementById("galleryNext").addEventListener("click", () => moveGallery(1));
    let touchStart = null;
    dom.modalImage.addEventListener("touchstart", event => { touchStart = event.touches[0].clientX; }, { passive: true });
    dom.modalImage.addEventListener("touchend", event => {
      if (touchStart === null) return;
      const delta = event.changedTouches[0].clientX - touchStart;
      if (Math.abs(delta) > 50) moveGallery(delta > 0 ? 1 : -1);
      touchStart = null;
    }, { passive: true });
    // Product card preview delegation (mouse click)
    if (dom.productsGrid) {
      dom.productsGrid.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-action='open-modal']");
        if (!trigger) return;

        const bagId = trigger.getAttribute("data-bag-id");
        openDetailModal(bagId);
      });

      // Keyboard Enter/Space on card image preview
      dom.productsGrid.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const trigger = event.target.closest("[data-action='open-modal']");
        if (!trigger) return;

        event.preventDefault();
        const bagId = trigger.getAttribute("data-bag-id");
        openDetailModal(bagId);
      });
    }

    // Close modal button
    if (dom.modalCloseBtn) {
      dom.modalCloseBtn.addEventListener("click", closeDetailModal);
    }

    // Backdrop click outside modal card
    if (dom.modalBackdrop) {
      dom.modalBackdrop.addEventListener("click", (event) => {
        if (event.target === dom.modalBackdrop) {
          closeDetailModal();
        }
      });
    }

    // Trap keyboard focus inside the open detail sheet.
    dom.modalBackdrop?.addEventListener("keydown", event => {
      if (event.key !== "Tab" || !dom.modalBackdrop.classList.contains("is-open")) return;
      const controls = [...dom.modalBackdrop.querySelectorAll("button, a[href], [tabindex=\"0\"]")].filter(el => !el.disabled);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });

    // Escape key closes modal
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && dom.modalBackdrop?.classList.contains("is-open")) {
        closeDetailModal();
      }
    });

    // Populate general WhatsApp links if present
    const directContactLinks = document.querySelectorAll("[data-whatsapp-general]");
    directContactLinks.forEach((link) => {
      link.setAttribute("href", buildGeneralWhatsAppUrl());
    });
  }

  async function init() {
    bindEvents();
    try {
      const response = await fetch("/products.json", { cache: "no-cache" });
      if (!response.ok) throw new Error("Catalog unavailable");
      BAGS_DATA = await response.json();
      renderProductsGrid();
      ShantaShowcase.init(BAGS_DATA, openDetailModal);
    } catch {
      dom.productsGrid.replaceChildren();
      const message = document.createElement("p");
      message.textContent = "تعذر تحميل المنتجات. حاول مرة أخرى.";
      const retry = document.createElement("button");
      retry.textContent = "إعادة المحاولة";
      retry.addEventListener("click", () => location.reload());
      dom.productsGrid.append(message, retry);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
