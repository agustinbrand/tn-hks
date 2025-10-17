type Badge = { text: string; className?: string };

type BundlePack = {
  units: number;
  label: string;
  subheadline?: string;
  discount: number;
  badges?: Badge[];
};

type ComplementaryVariant = {
  id: number;
  option0?: string;
  option1?: string;
  option2?: string;
  available: boolean;
};

type ComplementaryProduct = {
  id: number;
  name: string;
  price: number;
  compare_at_price?: number | null;
  images?: { src: string }[];
  variants?: ComplementaryVariant[];
};

type BundleConfigResponse = {
  mainTitle: string;
  helpText: string;
  buttonText: string;
  addingText: string;
  successMessage: string;
  selectPackError: string;
  selectVariantsError: string;
  packs: BundlePack[];
  freeShippingThreshold: number;
  freeShippingBadgeText: string;
  complementariesPosition: "inside" | "bottom";
  colors: {
    primary: string;
    primaryHover: string;
    success: string;
  };
  complementaries: ComplementaryProduct[];
};

type StorefrontState = {
  config: BundleConfigResponse;
  basePrice: number;
  successCount: number;
  failedVariant: string | null;
  currentPackUnits: number;
};

declare global {
  interface Window {
    LS: any;
    jQuery?: any;
    jQueryNuvem?: any;
    CodexBundle?: {
      init: () => void;
    };
  }
}

const state: StorefrontState = {
  config: {} as BundleConfigResponse,
  basePrice: 0,
  successCount: 0,
  failedVariant: null,
  currentPackUnits: 1,
};

function getCurrentScript(): HTMLScriptElement | null {
  return document.currentScript as HTMLScriptElement | null;
}

function getStoreIdFromScript(script: HTMLScriptElement | null): number | null {
  if (!script) return null;
  try {
    const url = new URL(script.src);
    const storeId = Number.parseInt(url.searchParams.get("store_id") || "", 10);
    return Number.isFinite(storeId) ? storeId : null;
  } catch {
    return null;
  }
}

function detectProductId(): number | null {
  try {
    const ls = (window as any).LS;
    if (ls && ls.data && ls.data.product && ls.data.product.id) {
      return Number(ls.data.product.id);
    }
  } catch {
    /* noop */
  }

  const productIdInput = document.querySelector<HTMLInputElement>(
    'input[name="product_id"], input[data-product-id]',
  );
  if (productIdInput) {
    const value =
      productIdInput.value || productIdInput.getAttribute("data-product-id");
    const parsed = Number.parseInt(value || "", 10);
    if (parsed) return parsed;
  }

  const meta = document.querySelector<HTMLMetaElement>(
    'meta[property="product:id"]',
  );
  if (meta?.content) {
    const parsed = Number.parseInt(meta.content, 10);
    if (parsed) return parsed;
  }

  return null;
}

function formatCurrency(value: number): string {
  try {
    const ls = (window as any).LS;
    if (ls && typeof ls.formatToCurrency === "function") {
      return ls.formatToCurrency(value);
    }
  } catch {
    /* noop */
  }

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function parsePrice(raw: unknown): number {
  if (typeof raw === "number") {
    return raw > 1000 ? raw / 100 : raw;
  }
  if (typeof raw === "string") {
    const parsed = Number.parseFloat(raw);
    return parsed > 1000 ? parsed / 100 : parsed;
  }
  return 0;
}

function getBasePrice(): number {
  try {
    const ls = (window as any).LS;
    if (ls && ls.data && ls.data.product && ls.data.product.price) {
      return parsePrice(ls.data.product.price);
    }
  } catch {
    /* noop */
  }

  const priceElement = document.querySelector<HTMLElement>(
    "#price_display, .js-price-display",
  );
  if (priceElement?.dataset?.productPrice) {
    return Number.parseFloat(priceElement.dataset.productPrice) / 100;
  }

  const priceInput = document.querySelector<HTMLElement>("[data-product-price]");
  if (priceInput?.getAttribute("data-product-price")) {
    return Number.parseFloat(priceInput.getAttribute("data-product-price")!) / 100;
  }

  return 0;
}

function renderComplementariesInside(): string {
  const complementaries = state.config.complementaries || [];
  if (!complementaries.length) return "";

  const list = complementaries
    .map((product) => {
      const variants = (product.variants || []).filter(
        (variant) => variant.available,
      );
      const price = formatCurrency(parsePrice(product.price));
      const compareAt =
        typeof product.compare_at_price === "number"
          ? formatCurrency(parsePrice(product.compare_at_price))
          : null;
      const savings =
        typeof product.compare_at_price === "number"
          ? formatCurrency(
              parsePrice(product.compare_at_price) - parsePrice(product.price),
            )
          : null;

      return `
        <div class="comp-item" data-comp-id="${product.id}">
          <input type="checkbox" class="comp-check" data-product="${product.id}" aria-label="Agregar ${product.name}">
          ${
            product.images && product.images[0]
              ? `<img src="${product.images[0].src}" class="comp-img" alt="${product.name}"/>`
              : '<div class="comp-img" aria-hidden="true"></div>'
          }
          <div class="comp-info">
            <div class="comp-name">${product.name}</div>
            <div>
              <span class="comp-price">${price}</span>
              ${
                compareAt && savings
                  ? `<span class="comp-compare">${compareAt}</span><span class="comp-save">AHORRÁ ${savings}</span>`
                  : ""
              }
            </div>
            ${
              variants.length > 1
                ? `<div style="margin-top:6px">
                <select class="comp-variant-select" data-product="${product.id}">
                  <option value="">-- Elegí opción --</option>
                  ${variants
                    .map(
                      (variant) =>
                        `<option value="${variant.id}" data-option0="${variant.option0 || ""}" data-option1="${variant.option1 || ""}" data-option2="${variant.option2 || ""}">
                          ${[variant.option0, variant.option1, variant.option2]
                            .filter(Boolean)
                            .join(" / ")}
                        </option>`,
                    )
                    .join("")}
                </select>
              </div>`
                : ""
            }
          </div>
          <button class="comp-btn" data-comp-id="${product.id}">+</button>
        </div>
      `;
    })
    .join("");

  return `<div class="mb-comps">${list}</div>`;
}

function renderComplementariesExternal(): string {
  const complementaries = state.config.complementaries || [];
  if (!complementaries.length) return "";

  const list = complementaries
    .map((product) => {
      const variants = (product.variants || []).filter(
        (variant) => variant.available,
      );
      const price = formatCurrency(parsePrice(product.price));
      const compareAt =
        typeof product.compare_at_price === "number"
          ? formatCurrency(parsePrice(product.compare_at_price))
          : null;
      const savings =
        typeof product.compare_at_price === "number"
          ? formatCurrency(
              parsePrice(product.compare_at_price) - parsePrice(product.price),
            )
          : null;
      return `
        <div class="comp-item" data-comp-id="${product.id}">
          ${
            product.images && product.images[0]
              ? `<img src="${product.images[0].src}" class="comp-img" alt="${product.name}"/>`
              : '<div class="comp-img" aria-hidden="true"></div>'
          }
          <div class="comp-info">
            <div class="comp-name">${product.name}</div>
            <div>
              <span class="comp-price">${price}</span>
              ${
                compareAt && savings
                  ? `<span class="comp-compare">${compareAt}</span><span class="comp-save">AHORRÁ ${savings}</span>`
                  : ""
              }
            </div>
            ${
              variants.length > 1
                ? `<div style="margin-top:6px">
                <select class="comp-variant-select" data-product="${product.id}">
                  <option value="">-- Elegí opción --</option>
                  ${variants
                    .map(
                      (variant) =>
                        `<option value="${variant.id}" data-option0="${variant.option0 || ""}" data-option1="${variant.option1 || ""}" data-option2="${variant.option2 || ""}">
                          ${[variant.option0, variant.option1, variant.option2]
                            .filter(Boolean)
                            .join(" / ")}
                        </option>`,
                    )
                    .join("")}
                </select>
              </div>`
                : ""
            }
          </div>
          <button class="comp-btn" data-comp-id="${product.id}">+</button>
        </div>
      `;
    })
    .join("");

  return `
    <div id="mb-comps-external" class="mb-comps-external">
      <h4>Productos Complementarios</h4>
      ${list}
    </div>
  `;
}

function generateBundleMarkup(): string {
  const packs = state.config.packs || [];
  const insideComplementaries =
    state.config.complementariesPosition === "inside"
      ? renderComplementariesInside()
      : "";

  const packHtml = packs
    .map((pack, index) => {
      const hasDiscount = pack.discount > 0;
      const badges = pack.badges || [];
      return `
        <div class="mb-mode" data-pack="${pack.units}">
          <div class="mb-mode__header">
            <div class="mb-mode__title">
              <span class="mb-mode__label">${pack.label}</span>
              ${
                pack.subheadline
                  ? `<span class="mb-mode__sub">${pack.subheadline}</span>`
                  : ""
              }
            </div>
            <span class="mb-mode__price" data-price-target="${index + 1}">$0</span>
          </div>
          ${
            hasDiscount
              ? `<div class="mb-mode__savings">
                <span class="mb-price-before" data-before-target="${index + 1}">$0</span>
                <span class="mb-mode__savings--highlight" data-savings-target="${index + 1}">Ahorrá $0</span>
              </div>`
              : ""
          }
          <div class="mb-variants"></div>
          ${
            badges.length
              ? `<div class="mb-badges">
                  ${badges
                    .map(
                      (badge) =>
                        `<div class="mb-badge ${badge.className || ""}">
                          ${badge.text}
                        </div>`,
                    )
                    .join("")}
                </div>`
              : ""
          }
          ${insideComplementaries}
        </div>
      `;
    })
    .join("");

  const externalComplementaries =
    state.config.complementariesPosition === "bottom"
      ? renderComplementariesExternal()
      : "";

  return `
    <div id="mod-bundle" class="mod-bundle" data-units="1">
      <h4 class="mod-bundle__title">${state.config.mainTitle}</h4>
      <div class="mb-modes" id="mb-modes-container">
        ${packHtml}
      </div>
      <div class="mb-help">${state.config.helpText}</div>
      <button id="mb-add" class="mb-btn">${state.config.buttonText}</button>
      <div id="mb-loader" class="mb-loader">⏳ <span>Preparando…</span></div>
    </div>
    ${externalComplementaries}
  `;
}

function injectStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .mod-bundle{margin:24px 0;font-family:Inter,Helvetica,Arial,sans-serif}
    .mod-bundle__title{font-size:24px;font-weight:700;margin-bottom:12px;text-align:center;position:relative;color:#1F2937}
    .mb-modes{display:flex;flex-direction:column;gap:16px;margin-bottom:16px}
    .mb-mode{border:2px solid #E5E7EB;border-radius:12px;padding:16px;cursor:pointer;transition:all .2s ease;background:#FFFFFF;position:relative}
    .mb-mode:hover{border-color:#93C5FD;background:#EBF4FF}
    .mb-mode.active{border-color:${state.config.colors.primary};background:#EBF4FF;box-shadow:0 0 0 3px rgba(228,67,67,.08) inset}
    .mb-mode__header{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:18px;margin-bottom:6px}
    .mb-mode__title { display: flex; flex-direction: column; }
    .mb-mode__label { font-weight: 700; font-size: 18px; color: #1F2937; line-height:1; }
    .mb-mode__sub { font-size: 13px; color: #6B7280; margin-top: 2px; font-weight:400; }
    .mb-mode__price{color:${state.config.colors.primary};font-size:20px;font-weight:800}
    .mb-mode__savings{font-size:14px;color:#6B7280;margin-bottom:8px;display:block}
    .mb-price-before{text-decoration:line-through;color:#999;font-size:14px;margin-right:10px}
    .mb-mode__savings--highlight{color:#059669;font-weight:700}
    .mb-variants{display:none;margin-top:8px}
    .mb-mode.active .mb-variants{display:block}
    .mb-unit{display:flex;align-items:center;gap:8px;padding:6px 0}
    .mb-unit label{font-size:14px;font-weight:800;min-width:28px}
    .mb-select{flex:1;padding:9px 10px;border:1px solid #d1d5db;border-radius:8px;background:#fff}
    .mb-help{font-size:14px;color:#6B7280;margin-top:10px;text-align:center}
    .mb-btn{background:${state.config.colors.primary};color:#FFFFFF;border:0;padding:14px 16px;border-radius:10px;cursor:pointer;width:100%;font-weight:700;margin-top:16px;font-size:16px;transition:background .2s ease}
    .mb-btn:hover{background:${state.config.colors.primaryHover}}
    .mb-btn:disabled{opacity:.6;cursor:not-allowed}
    .mb-loader{display:none;margin-top:12px;font-size:14px;color:#374151;text-align:center}
    .mb-loader span{font-weight:700;color:#111}
    .mb-badges{position:absolute;top:-12px;right:-12px;display:flex;flex-direction:row;gap:4px;align-items:center}
    .mb-badge{background:${state.config.colors.primary};color:#fff;font-size:12px;padding:5px 10px;border-radius:999px;font-weight:900;box-shadow:0 4px 12px rgba(228,67,67,.25)}
    .mb-badge--green{background:${state.config.colors.success};box-shadow:0 4px 12px rgba(34,197,94,.25)}
    .mb-badge--red{background:#ef4444;box-shadow:0 4px 12px rgba(239,68,68,.25)}
    .mb-comps{margin-top:12px;border-top:1px dashed #ddd;padding-top:12px;display:none}
    .mb-mode.active .mb-comps{display:block}
    .comp-item{display:flex;align-items:center;gap:10px;margin-bottom:10px}
    .comp-check{width:18px;height:18px;cursor:pointer}
    .comp-img{width:42px;height:42px;border-radius:8px;object-fit:cover;background:#f0f0f0}
    .comp-info{flex:1}
    .comp-name{font-size:14px;font-weight:600;line-height:1.2}
    .comp-price{font-size:14px;font-weight:700;color:#007bff}
    .comp-compare{font-size:12px;color:#999;text-decoration:line-through;margin-left:6px}
    .comp-save{font-size:11px;color:#22c55e;margin-left:6px}
    .comp-variant-select{padding:6px;border:1px solid #ddd;border-radius:6px}
    .mb-comps-external{margin:20px 0;display:none}
    .mb-comps-external h4{font-size:18px;font-weight:700;margin-bottom:16px;text-align:center}
    .mb-comps-external .comp-item{background:#f8f9fa;border-radius:16px;padding:16px;margin-bottom:16px}
    .comp-btn{background:${state.config.colors.primary};color:#FFFFFF;border:0;width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:18px;transition:background .2s ease}
    .comp-btn:hover{background:${state.config.colors.primaryHover}}
    .comp-btn:disabled{opacity:.6;cursor:not-allowed}
    @media (max-width:480px){ .mb-mode__header{font-size:16px} .mb-mode__price{font-size:18px} }
  `;
  document.head.appendChild(style);
}

function hasRealVariants(): boolean {
  const mainSelects = document.querySelectorAll(
    "form.js-product-form select, form#product_form select",
  );
  if (mainSelects.length === 0) return false;
  for (let i = 0; i < mainSelects.length; i += 1) {
    const availableOptions = mainSelects[i].querySelectorAll("option:not([disabled])");
    if (availableOptions.length > 2) return true;
  }
  const radios = document.querySelectorAll(
    'form.js-product-form input[type="radio"], form#product_form input[type="radio"]',
  );
  const radioGroups: Record<string, number> = {};
  radios.forEach((radio) => {
    const name = radio.getAttribute("name") || "";
    if (!radioGroups[name]) radioGroups[name] = 0;
    if (!(radio as HTMLInputElement).disabled) radioGroups[name] += 1;
  });
  return Object.values(radioGroups).some((count) => count > 1);
}

function attachVariantSync(container: HTMLElement) {
  container.querySelectorAll<HTMLSelectElement>(".mb-variant").forEach((select) => {
    select.addEventListener("change", () => {
      const option = select.selectedOptions[0];
      if (!option) return;
      const values = [
        option.getAttribute("data-option0"),
        option.getAttribute("data-option1"),
        option.getAttribute("data-option2"),
      ].filter(Boolean) as string[];
      values.forEach((value, index) => {
        const button = document.querySelector<HTMLElement>(
          `.js-insta-variant[data-variation-id="${index}"][data-option="${value}"]`,
        );
        if (button) button.click();
      });
    });
  });
}

function renderVariantSelects(modeEl: HTMLElement, units: number) {
  const variantsContainer = modeEl.querySelector(".mb-variants") as HTMLElement | null;
  if (!variantsContainer) return;
  variantsContainer.innerHTML = "";
  if (!hasRealVariants()) return;

  const variants = Array.from(
    document.querySelectorAll<HTMLSelectElement>(
      'form.js-product-form select[name*="variation"], form#product_form select[name*="variation"]',
    ),
  );

  const options: {
    id: string;
    option0: string | null;
    option1: string | null;
    option2: string | null;
    label: string;
  }[] = [];

  const lsVariants = (window as any).LS?.data?.product?.variants || [];
  if (lsVariants && lsVariants.length) {
    lsVariants
      .filter((variant: any) => variant.available)
      .forEach((variant: any) => {
        const label = [variant.option0, variant.option1, variant.option2]
          .filter(Boolean)
          .join(" / ");
        options.push({
          id: String(variant.id),
          option0: variant.option0,
          option1: variant.option1,
          option2: variant.option2,
          label,
        });
      });
  } else {
    const select = variants[0];
    if (select) {
      Array.from(select.options)
        .filter((option) => option.value)
        .forEach((option) => {
          options.push({
            id: option.value,
            option0: option.text,
            option1: null,
            option2: null,
            label: option.text,
          });
        });
    }
  }

  const html = new Array(units)
    .fill(null)
    .map((_, index) => {
      const rows = options
        .map(
          (variant) =>
            `<option value="${variant.id}" data-option0="${variant.option0 || ""}" data-option1="${variant.option1 || ""}" data-option2="${variant.option2 || ""}">
              ${variant.label}
            </option>`,
        )
        .join("");
      return `
        <div class="mb-unit">
          <label>#${index + 1}</label>
          <select class="mb-select mb-variant" data-unit="${index + 1}">
            <option value="">-- Elegí una variante --</option>
            ${rows}
          </select>
        </div>
      `;
    })
    .join("");

  variantsContainer.innerHTML = html;
  attachVariantSync(variantsContainer);
}

function updatePrices() {
  state.basePrice = getBasePrice();
  if (state.basePrice <= 0) return;

  state.config.packs.forEach((pack, index) => {
    const idx = index + 1;
    const discount = pack.discount;
    const original = state.basePrice * pack.units;
    const discounted = original * (1 - discount);
    const savings = original - discounted;

    const priceTarget = document.querySelector<HTMLElement>(
      `[data-price-target="${idx}"]`,
    );
    if (priceTarget) {
      priceTarget.textContent = formatCurrency(discounted);
    }

    const beforeTarget = document.querySelector<HTMLElement>(
      `[data-before-target="${idx}"]`,
    );
    const savingsTarget = document.querySelector<HTMLElement>(
      `[data-savings-target="${idx}"]`,
    );
    if (discount > 0 && beforeTarget && savingsTarget) {
      beforeTarget.textContent = `Antes ${formatCurrency(original)}`;
      savingsTarget.textContent = `Ahorrá ${formatCurrency(savings)}`;
    }

    if (discounted >= state.config.freeShippingThreshold) {
      const modeEl = document.querySelector<HTMLElement>(
        `.mb-mode[data-pack="${pack.units}"]`,
      );
      if (modeEl && !modeEl.querySelector(".mb-badge--dynamic")) {
        const badge = document.createElement("div");
        badge.className = "mb-badge mb-badge--green mb-badge--dynamic";
        badge.textContent = state.config.freeShippingBadgeText;
        const container =
          modeEl.querySelector(".mb-badges") || modeEl.appendChild(document.createElement("div"));
        container.className = "mb-badges";
        container.appendChild(badge);
      }
    }
  });
}

function hardTotalsFallback(cart: any) {
  if (!cart) return;
  try {
    const ls = (window as any).LS;
    if (ls) {
      ls.data = ls.data || {};
      ls.data.cart = ls.data.cart || {};
      const toCents = (value: any) =>
        Math.round(100 * Number.parseFloat(typeof value === "number" ? String(value) : value || 0));
      ls.data.cart.total = toCents(cart.total);
      ls.data.cart.subtotal = toCents(cart.subtotal);
      ls.data.cart.discount = toCents(cart.discount);
      if (typeof ls.refreshTotalInstallments === "function") {
        ls.refreshTotalInstallments(cart.total);
      }
    }
  } catch {
    /* noop */
  }
}

function syncWithTheme(data: any, shouldOpenDrawer: boolean) {
  (window as any).__lastResponse = data;
  try {
    const ls = (window as any).LS;
    if (ls && typeof ls.updateCartEnhanced === "function") {
      ls.updateCartEnhanced(
        data.cart,
        false,
        (window as any).__lastUpdateFn || false,
        data.html_cart_items || "",
        data.html_notification_related_products || "",
        data.html_notification_cross_selling || "",
      );
    }
  } catch {
    /* noop */
  }

  try {
    const ls = (window as any).LS;
    if (ls && typeof ls.refreshTotals === "function") {
      ls.refreshTotals(data);
    } else {
      hardTotalsFallback(data.cart);
    }
  } catch {
    hardTotalsFallback(data.cart);
  }

  if (shouldOpenDrawer) {
    const toggle =
      document.querySelector<HTMLElement>(
        ".js-toggle-cart, .js-modal-open[data-toggle*='cart'], .js-open-cart",
      );
    if (toggle) {
      window.setTimeout(() => toggle.click(), 150);
    }
  }
}

async function addProductToCart(
  productId: number,
  variant: {
    option0?: string | null;
    option1?: string | null;
    option2?: string | null;
  } | null,
  index: number,
  total: number,
  itemType: string,
) {
  const loader = document.getElementById("mb-loader");
  if (loader) {
    loader.innerHTML = `⏳ ${state.config.addingText} ${itemType} ${index} de ${total}…`;
    loader.style.display = "block";
  }

  const form = new URLSearchParams();
  form.append("add_to_cart", String(productId));
  form.append("quantity", "1");
  form.append("add_to_cart_enhanced", "1");
  if (variant) {
    if (variant.option0) form.append("variation[0]", variant.option0);
    if (variant.option1) form.append("variation[1]", variant.option1);
    if (variant.option2) form.append("variation[2]", variant.option2);
  }

  const response = await fetch("/comprar/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: form.toString(),
  });

  const data = await response.json();
  if (data?.success) {
    state.successCount += 1;
    syncWithTheme(data, false);
    hardTotalsFallback(data.cart);
    return true;
  }

  return false;
}

function getSelectedVariant(select: HTMLSelectElement | null) {
  if (!select) return null;
  const option = select.selectedOptions[0];
  if (!option || !option.value) return null;
  return {
    option0: option.getAttribute("data-option0"),
    option1: option.getAttribute("data-option1"),
    option2: option.getAttribute("data-option2"),
  };
}

async function addComplementaryFromMode(
  mode: HTMLElement,
  startIndex: number,
  totalItems: number,
) {
  const checks = Array.from(mode.querySelectorAll<HTMLInputElement>(".comp-check:checked"));
  for (let i = 0; i < checks.length; i += 1) {
    const check = checks[i];
    const productId = Number.parseInt(check.getAttribute("data-product") || "", 10);
    const itemType = "complementario";
    const compItem = check.closest(".comp-item") as HTMLElement | null;
    const select = compItem?.querySelector<HTMLSelectElement>(".comp-variant-select");
    const variant = getSelectedVariant(select);
    await addProductToCart(productId, variant, startIndex + i, totalItems, itemType);
  }
}

async function handleAddButtonClick() {
  const button = document.getElementById("mb-add") as HTMLButtonElement | null;
  const loader = document.getElementById("mb-loader") as HTMLElement | null;
  if (!button || !loader) return;

  button.disabled = true;
  button.textContent = state.config.addingText;
  loader.style.display = "block";
  loader.textContent = `⏳ ${state.config.addingText}`;
  state.successCount = 0;
  state.failedVariant = null;

  const activeMode = document.querySelector<HTMLElement>(".mb-mode.active");
  if (!activeMode) {
    window.alert(state.config.selectPackError);
    button.disabled = false;
    button.textContent = state.config.buttonText;
    loader.style.display = "none";
    return;
  }

  const packUnits = Number.parseInt(activeMode.getAttribute("data-pack") || "1", 10);
  const complementariesInside = activeMode.querySelectorAll(".comp-check:checked").length;
  const totalItems = packUnits + complementariesInside;

  const selects = Array.from(
    activeMode.querySelectorAll<HTMLSelectElement>(".mb-variant"),
  );

  const productId = detectProductId();
  if (!productId) {
    return;
  }

  const hasVariants = hasRealVariants();
  let index = 1;
  let allOk = true;

  if (!hasVariants) {
    for (let i = 0; i < packUnits; i += 1) {
      const ok = await addProductToCart(productId, null, index, totalItems, "producto");
      index += 1;
      if (!ok) allOk = false;
    }
  } else {
    if (selects.some((select) => !select.value)) {
      window.alert(state.config.selectVariantsError);
      button.disabled = false;
      button.textContent = state.config.buttonText;
      loader.style.display = "none";
      return;
    }

    for (let i = 0; i < selects.length; i += 1) {
      const variant = getSelectedVariant(selects[i]);
      const ok = await addProductToCart(productId, variant, index, totalItems, "producto");
      index += 1;
      if (!ok) allOk = false;
    }
  }

  const lastResponse = (window as any).__lastResponse;
  if (lastResponse) {
    syncWithTheme(lastResponse, true);
  }

  await addComplementaryFromMode(activeMode, index, totalItems);

  loader.innerHTML =
    allOk && state.successCount === totalItems
      ? state.config.successMessage
      : `❌ ${state.failedVariant || "Algunos productos"} sin stock - agregamos ${state.successCount} de ${totalItems}`;

  window.setTimeout(() => {
    loader.style.display = "none";
    button.disabled = false;
    button.textContent = state.config.buttonText;
  }, 2200);
}

function bindAddButton() {
  const button = document.getElementById("mb-add");
  if (button) {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      handleAddButtonClick();
    });
  }
}

function handleModeSelection() {
  const modes = Array.from(document.querySelectorAll<HTMLElement>(".mb-mode"));
  modes.forEach((mode) => {
    mode.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const isInteractive =
        target.tagName === "SELECT" ||
        target.tagName === "OPTION" ||
        target.tagName === "INPUT" ||
        !!target.closest("select");
      if (isInteractive) return;
      modes.forEach((m) => m.classList.remove("active"));
      mode.classList.add("active");
      state.currentPackUnits = Number.parseInt(mode.getAttribute("data-pack") || "1", 10);
      const variantsContainer = mode.querySelector(".mb-variants") as HTMLElement | null;
      if (variantsContainer && variantsContainer.innerHTML.trim() === "") {
        renderVariantSelects(mode, state.currentPackUnits);
      }
    });
  });
  if (modes[0]) {
    modes[0].classList.add("active");
    renderVariantSelects(modes[0], Number.parseInt(modes[0].getAttribute("data-pack") || "1", 10));
  }
}

function bindExternalComplementaries() {
  document.querySelectorAll<HTMLButtonElement>("#mb-comps-external .comp-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const compId = Number.parseInt(button.getAttribute("data-comp-id") || "", 10);
      if (!compId) return;
      const item = button.closest(".comp-item");
      const select = item?.querySelector<HTMLSelectElement>(".comp-variant-select");
      const variant = getSelectedVariant(select || null);

      button.disabled = true;
      button.textContent = "⏳";

      const success = await addProductToCart(compId, variant, 1, 1, "complementario");

      button.textContent = success ? "✓" : "✗";
      button.style.background = success ? state.config.colors.success : "#dc2626";
      window.setTimeout(() => {
        button.disabled = false;
        button.textContent = "+";
        button.style.background = state.config.colors.primary;
      }, 2000);
    });
  });
}

function moveExternalComplementaries() {
  if (state.config.complementariesPosition !== "bottom") return;
  const bundleButton = document.getElementById("mb-add");
  const external = document.getElementById("mb-comps-external");
  if (bundleButton && external) {
    bundleButton.insertAdjacentElement("afterend", external);
    external.style.display = "block";
  }
}

function mountBundle(container: HTMLElement) {
  container.insertAdjacentHTML("afterbegin", generateBundleMarkup());
  injectStyles();
  updatePrices();
  bindAddButton();
  handleModeSelection();
  bindExternalComplementaries();
  moveExternalComplementaries();
}

async function fetchBundleConfig(script: HTMLScriptElement) {
  const storeId = getStoreIdFromScript(script);
  if (!storeId) return null;
  const productId = detectProductId();
  if (!productId) return null;
  const configUrl = new URL("/public/config", script.src);
  configUrl.searchParams.set("store_id", String(storeId));
  configUrl.searchParams.set("product_id", String(productId));
  const res = await fetch(configUrl.toString());
  if (!res.ok) return null;
  const body = await res.json();
  if (body?.success) {
    return body.data as BundleConfigResponse;
  }
  return null;
}

async function initBundle() {
  const script = getCurrentScript();
  if (!script) return;
  const config = await fetchBundleConfig(script);
  if (!config) return;
  state.config = config;

  const form =
    document.querySelector(".js-product-form") ||
    document.getElementById("product_form") ||
    document.querySelector(".product-form");
  if (!form || !form.parentElement) return;

  mountBundle(form.parentElement as HTMLElement);
}

if (typeof window !== "undefined") {
  if (!document.readyState || document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBundle);
  } else {
    initBundle();
  }
}
