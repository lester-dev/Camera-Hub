/* ==========================================================================
   CAMERA HUB – Interactive Marketplace & Merchant Engine
   Features:
   - Atomic RPC Database Checkout Concurrency (PostgreSQL FOR UPDATE)
   - Slide-out Cart Drawer with Item Steppers
   - Philippine Payment Interface (GCash, Maya, Bank Transfer, COD)
   - Supabase Storage 'product-images' Integration & Presets
   - Dedicated Seller Analytics Dashboard & Inventory Management
   - Shopee/Lazada Style Hover Zoom & Snappy Cart Bounce Animation
   ========================================================================== */

// --- 1. Supabase Initialization ---
const SUPABASE_URL = "https://stwibyfuxcfhzfxunecf.supabase.co";
const SUPABASE_KEY = "sb_publishable_VzwJI0RCaApJYnQZY3_gJQ_NDV_hVt1";
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// Currency Formatter for Philippine Peso (PHP ₱)
const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});
const formatPHP = (n) => peso.format(Number(n) || 0);

// Safe HTML Escaping
function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

function isValidUUID(str) {
  return typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// --- 2. High-Quality Seed Assets & Presets ---
// High-fidelity studio product photography generated for Camera Hub
const PRESET_IMAGES = [
  {
    id: "sony-a1",
    name: "Sony Alpha 7 IV / A1",
    category: "camera",
    url: "/images/camera_sony_mirrorless_1791623732788.jpg",
  },
  {
    id: "canon-r5",
    name: "Canon EOS R5 Mirrorless",
    category: "camera",
    url: "/images/camera_canon_eos_r5_1791625325306.jpg",
  },
  {
    id: "nikon-z8",
    name: "Nikon Z8 Professional",
    category: "camera",
    url: "/images/camera_nikon_z8_1791625340806.jpg",
  },
  {
    id: "fuji-xt5",
    name: "Fujifilm X-T5 Classic",
    category: "camera",
    url: "/images/camera_canon_dslr_1791623749530.jpg",
  },
  {
    id: "fuji-tele",
    name: "Fujinon 50-140mm Zoom",
    category: "lens",
    url: "/images/camera_lens_zoom_1791623764222.jpg",
  },
  {
    id: "canon-50mm",
    name: "Canon RF 50mm f/1.2L Prime",
    category: "lens",
    url: "/images/camera_prime_lens_50mm_1791625356939.jpg",
  },
  {
    id: "canon-5d",
    name: "Canon EOS 5D Mark IV DSLR",
    category: "camera",
    url: "/images/camera_canon_dslr_5d_1791625373562.jpg",
  },
];

// Helper to guarantee authentic, high-quality photograph for any camera or lens
function getProductImage(p) {
  if (!p) return "/images/sony_a7iv.jpg";
  if (p.image_url && typeof p.image_url === "string" && p.image_url.trim().length > 4) {
    let clean = p.image_url.trim();
    if (clean.startsWith("/src/assets/images/")) clean = clean.replace("/src/assets/images/", "/images/");
    if (!clean.includes("camera_canon_dslr_1791623749530") || (p.brand === "Canon" && p.category !== "lens")) {
      return clean;
    }
  }

  const name = String(p.name || "").toLowerCase();
  const brand = String(p.brand || "").toLowerCase();
  const subcat = String(p.subcategory || "").toLowerCase();
  const desc = String(p.description || "").toLowerCase();
  const combined = `${name} ${brand} ${subcat} ${desc}`;

  // 1. Exact model photography matches
  if (combined.includes("a7 iv") || combined.includes("alpha 7 iv") || combined.includes("a7iv")) return "/images/sony_a7iv.jpg";
  if (combined.includes("a6400") || combined.includes("6400") || combined.includes("zv-e10")) return "/images/sony_a6400.jpg";
  if (combined.includes("eos r5") || combined.includes("r5 full-frame")) return "/images/canon_r5.jpg";
  if (combined.includes("eos r50") || combined.includes("r50")) return "/images/canon_r50.jpg";
  if (combined.includes("90d") || combined.includes("eos 90d")) return "/images/canon_90d.jpg";
  if (combined.includes("5d mark iv") || combined.includes("5d4") || combined.includes("5d mark")) return "/images/canon_5d4.jpg";
  if (combined.includes("z8") || combined.includes("z 8")) return "/images/nikon_z8.jpg";
  if (combined.includes("z fc") || combined.includes("zfc") || combined.includes("z30")) return "/images/nikon_zfc.jpg";
  if (combined.includes("d7500")) return "/images/nikon_d7500.jpg";
  if (combined.includes("x-t5") || combined.includes("xt5")) return "/images/fuji_xt5.jpg";
  if (combined.includes("x-t30") || combined.includes("xt30") || combined.includes("x-s20") || combined.includes("xs20")) return "/images/fuji_xt30ii.jpg";

  // 2. Exact lens photography matches
  if (combined.includes("24-70") || combined.includes("gm ii") || (brand.includes("sony") && combined.includes("zoom"))) return "/images/sony_2470_gm.jpg";
  if (combined.includes("24-105") || (brand.includes("canon") && combined.includes("rf 24-105"))) return "/images/canon_rf_24105.jpg";
  if (combined.includes("70-200") || (brand.includes("nikon") && combined.includes("telephoto"))) return "/images/nikon_70200.jpg";
  if (combined.includes("50-140") || (brand.includes("fuji") && combined.includes("zoom"))) return "/images/fuji_50140_zoom.jpg";
  if (brand.includes("fuji") && (combined.includes("35mm") || combined.includes("prime") || combined.includes("xf 35"))) return "/images/fuji_xf_35mm.jpg";
  if (brand.includes("canon") && (combined.includes("50mm") || combined.includes("rf 50"))) return "/images/canon_rf_50mm.jpg";
  if (brand.includes("sony") && (combined.includes("50mm") || combined.includes("prime"))) return "/images/sony_50mm_prime.jpg";

  // 3. Brand & Category Fallbacks
  if (p.category === "lens" || subcat === "prime") {
    if (brand.includes("canon")) return "/images/canon_rf_50mm.jpg";
    if (brand.includes("fuji")) return "/images/fuji_xf_35mm.jpg";
    if (brand.includes("nikon")) return "/images/nikon_70200.jpg";
    return "/images/sony_50mm_prime.jpg";
  }
  if (p.category === "lens" || subcat === "zoom") {
    if (brand.includes("canon")) return "/images/canon_rf_24105.jpg";
    if (brand.includes("fuji")) return "/images/fuji_50140_zoom.jpg";
    if (brand.includes("nikon")) return "/images/nikon_70200.jpg";
    return "/images/sony_2470_gm.jpg";
  }

  if (brand.includes("canon")) {
    return subcat === "dslr" ? "/images/canon_90d.jpg" : "/images/canon_r5.jpg";
  }
  if (brand.includes("nikon")) {
    return subcat === "dslr" ? "/images/nikon_d7500.jpg" : "/images/nikon_zfc.jpg";
  }
  if (brand.includes("fuji")) {
    return "/images/fuji_xt5.jpg";
  }

  return "/images/sony_a7iv.jpg";
}

// Fallback high quality camera images - all verified local studio photography
const DEFAULT_CATALOG = [
  {
    id: "prod-sony-a7iv",
    name: "Sony Alpha 7 IV Mirrorless Body",
    brand: "Sony",
    category: "camera",
    subcategory: "mirrorless",
    price: 139990,
    stock: 4,
    image_url: "/images/sony_a7iv.jpg",
    specs: { sensor: "33MP Full-Frame Exmor R", video: "4K 60p 10-Bit 4:2:2" },
    description: "Flagship hybrid mirrorless camera with real-time eye autofocus and 759 phase-detection AF points.",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    is_active: true,
  },
  {
    id: "prod-canon-r5",
    name: "Canon EOS R5 Full-Frame Mirrorless",
    brand: "Canon",
    category: "camera",
    subcategory: "full-frame",
    price: 198900,
    stock: 2,
    image_url: "/images/canon_r5.jpg",
    specs: { sensor: "45MP Full-Frame CMOS", video: "8K 30p Raw / 4K 120p" },
    description: "High-resolution commercial powerhouse with Dual Pixel CMOS AF II and 8-stop coordinated IS.",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    is_active: true,
  },
  {
    id: "prod-nikon-z8",
    name: "Nikon Z8 Professional Body",
    brand: "Nikon",
    category: "camera",
    subcategory: "full-frame",
    price: 219900,
    stock: 3,
    image_url: "/images/nikon_z8.jpg",
    specs: { sensor: "45.7MP Stacked CMOS", video: "8.3K 60p N-RAW" },
    description: "Mini Z9 powerhouse with blackout-free Real-Live Viewfinder and aircraft-grade weather sealing.",
    created_at: new Date(Date.now() - 10800000).toISOString(),
    is_active: true,
  },
  {
    id: "prod-fuji-xt5",
    name: "Fujifilm X-T5 Mirrorless Body (Black)",
    brand: "Fujifilm",
    category: "camera",
    subcategory: "mirrorless",
    price: 99990,
    stock: 3,
    image_url: "/images/fuji_xt5.jpg",
    specs: { sensor: "40.2MP X-Trans CMOS 5 HR", video: "6.2K 30p Internal" },
    description: "Compact photographic masterpiece with dedicated dials and 5-axis in-body image stabilization.",
    created_at: new Date(Date.now() - 14400000).toISOString(),
    is_active: true,
  },
  {
    id: "prod-canon-50",
    name: "Canon RF 50mm f/1.2L USM Prime",
    brand: "Canon",
    category: "lens",
    subcategory: "prime",
    price: 129500,
    stock: 0,
    image_url: "/images/canon_rf_50mm.jpg",
    specs: { focal_length: "50mm", aperture: "f/1.2 Ultra-Fast", mount: "Canon RF" },
    description: "Legendary low-light portrait prime lens with ring-type USM and customizable control ring.",
    created_at: new Date(Date.now() - 18000000).toISOString(),
    is_active: true,
  },
  {
    id: "prod-fuji-zoom",
    name: "Fujinon XF 50-140mm f/2.8 R LM OIS WR",
    brand: "Fujifilm",
    category: "lens",
    subcategory: "zoom",
    price: 84990,
    stock: 5,
    image_url: "/images/fuji_50140_zoom.jpg",
    specs: { focal_length: "50-140mm (76-213mm Equiv)", aperture: "f/2.8 Constant", mount: "Fuji X-Mount" },
    description: "Fast telephoto zoom lens with triple linear motor autofocus and weather-resistant sealing.",
    created_at: new Date(Date.now() - 21600000).toISOString(),
    is_active: true,
  },
  {
    id: "prod-sony-2470",
    name: "Sony FE 24-70mm f/2.8 GM II Zoom",
    brand: "Sony",
    category: "lens",
    subcategory: "zoom",
    price: 124990,
    stock: 6,
    image_url: "/images/sony_2470_gm.jpg",
    specs: { focal_length: "24-70mm Standard Zoom", aperture: "f/2.8", mount: "Sony E-Mount" },
    description: "Lightest f/2.8 standard zoom lens in the world with four XD Linear Motors for rapid focus tracking.",
    created_at: new Date(Date.now() - 25200000).toISOString(),
    is_active: true,
  },
  {
    id: "prod-canon-5d",
    name: "Canon EOS 5D Mark IV DSLR Body",
    brand: "Canon",
    category: "camera",
    subcategory: "dslr",
    price: 89000,
    stock: 2,
    image_url: "/images/canon_5d4.jpg",
    specs: { sensor: "30.4MP Full-Frame", video: "4K Motion JPEG" },
    description: "Workhorse professional DSLR known for rugged durability and rich color science.",
    created_at: new Date(Date.now() - 28800000).toISOString(),
    is_active: true,
  },
];

// --- 3. Application State ---
const state = {
  products: [...DEFAULT_CATALOG],
  category: "all",
  brand: "all",
  search: "",
  sort: "newest",
  session: null,
  profile: null,
  currentView: "storefront", // "storefront" | "seller"
  pendingCheckout: false,
  sellerOrderStageFilter: "all", // "all" | "to-ship" | "to-receive" | "completed"
  buyerOrderStageFilter: "all", // "all" | "to-ship" | "to-receive" | "completed"
  cart: new Map(), // productId -> { product, quantity }
  orders: [], // Clean empty array: new users start with 0 orders
  selectedPresetImage: PRESET_IMAGES[0].url,
};

// --- 4. DOM Selectors ---
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const grid = $("#productGrid");
const cartDrawer = $("#cartDrawer");
const checkoutModal = $("#checkoutModal");
const paymentSuccessModal = $("#paymentSuccessModal");
const authModal = $("#authModal");

const LABELS = {
  dslr: "DSLR",
  mirrorless: "Mirrorless",
  "full-frame": "Full-frame",
  prime: "Prime lens",
  zoom: "Zoom lens",
};

// Toast notification helper
let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

// Fallback placeholder SVGs
const PLACEHOLDER_CAMERA = `<svg class="placeholder" viewBox="0 0 120 90" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 28h18l6-10h48l6 10h18a4 4 0 0 1 4 4v44a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V32a4 4 0 0 1 4-4z"/><circle cx="60" cy="52" r="20"/><circle cx="60" cy="52" r="11"/></svg>`;
const PLACEHOLDER_LENS = `<svg class="placeholder" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="22" y="30" width="76" height="62" rx="6"/><rect x="30" y="18" width="60" height="12" rx="3"/><path d="M22 52h76M22 70h76"/><circle cx="60" cy="61" r="9"/></svg>`;

// ==========================================================================
// 5. PRODUCT CATALOG MANAGEMENT
// ==========================================================================

async function loadProducts() {
  let remoteProducts = [];
  let remoteCatalogLoaded = false;
  if (db) {
    try {
      const { data, error } = await db
        .from("products")
        .select("id, name, brand, category, subcategory, description, price, stock, image_url, specs, created_at, is_active")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        remoteCatalogLoaded = true;
        remoteProducts = data.map((p) => ({
          ...p,
          image_url: getProductImage(p),
        }));
      }
    } catch (err) {
      console.warn("Using offline catalog fallback:", err);
    }
  }

  // Also load seller-published products from local storage so newly created products reflect immediately
  let localProducts = [];
  try {
    const stored = localStorage.getItem("camerahub_local_products");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        localProducts = parsed
          .filter((p) => p && p.is_active !== false)
          .map((p) => ({
            ...p,
            image_url: getProductImage(p),
          }));
      }
    }
  } catch (e) {
    console.warn("Local products load note:", e);
  }

  // Unified Catalog Merge: Defaults < Remote Supabase < Seller Local Products (Highest Priority)
  const productMap = new Map();
  if (!remoteCatalogLoaded) {
    for (const p of DEFAULT_CATALOG) {
      productMap.set(String(p.id), { ...p, image_url: getProductImage(p) });
    }
  }
  for (const p of remoteProducts) {
    productMap.set(String(p.id), p);
  }
  for (const p of localProducts) {
    if (db && remoteCatalogLoaded) continue;
    productMap.set(String(p.id), p);
  }

  state.products = Array.from(productMap.values()).sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  renderProducts();
}

function getVisibleProducts() {
  const q = state.search.trim().toLowerCase();
  const list = state.products.filter((p) => {
    const matchCat = state.category === "all" || p.subcategory === state.category;
    const matchBrand = state.brand === "all" || p.brand.toLowerCase() === state.brand.toLowerCase();
    const searchTarget = `${p.name} ${p.brand} ${LABELS[p.subcategory] || ""} ${p.category} ${p.description || ""}`.toLowerCase();
    const matchSearch = !q || searchTarget.includes(q);
    return matchCat && matchBrand && matchSearch;
  });

  const sorters = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
    newest: (a, b) => new Date(b.created_at) - new Date(a.created_at),
  };
  return list.sort(sorters[state.sort] || sorters.newest);
}

function specLine(p) {
  const s = p.specs || {};
  if (p.category === "camera") {
    return [s.sensor, s.video].filter(Boolean).join(" · ");
  }
  return [s.focal_length, s.aperture, s.mount].filter(Boolean).join(" · ");
}

function renderProducts() {
  const list = getVisibleProducts();
  const countEl = $("#resultCount");
  if (countEl) {
    countEl.textContent = `${list.length} item${list.length === 1 ? "" : "s"} available`;
  }
  $("#emptyState").hidden = list.length > 0;

  grid.innerHTML = list
    .map((p, i) => {
      const soldOut = p.stock <= 0;
      const lowStock = p.stock > 0 && p.stock <= 3;
      const imgSrc = getProductImage(p);
      const fallbackSrc = p.category === "camera"
        ? "/images/camera_sony_mirrorless_1791623732788.jpg"
        : "/images/camera_lens_zoom_1791623764222.jpg";

      // Real <img> tag with safe image fallback that doesn't break parent DOM
      const mediaHtml = `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(p.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null; this.src='${fallbackSrc}';" />`;

      return `
        <article class="card" data-product-id="${p.id}" style="animation-delay:${Math.min(i, 8) * 40}ms">
          <!-- Bounding box with overflow: hidden for Shopee/Lazada style image hover zoom -->
          <div class="card-media">
            ${mediaHtml}
            <span class="tag">${escapeHtml(LABELS[p.subcategory] || p.subcategory)}</span>
            ${soldOut ? `<span class="tag out">Sold out</span>` : lowStock ? `<span class="tag low">Only ${p.stock} left</span>` : ""}
          </div>
          <div class="card-body">
            <span class="card-brand">${escapeHtml(p.brand)}</span>
            <h3 class="card-title">${escapeHtml(p.name)}</h3>
            <p class="card-spec">${escapeHtml(specLine(p))}</p>
            <div class="card-foot">
              <span class="price tabular-nums">${formatPHP(p.price)}</span>
              <button class="add-btn" data-id="${p.id}" ${soldOut ? "disabled" : ""}>
                ${soldOut ? "Sold out" : "Add to cart"}
              </button>
            </div>
          </div>
        </article>`;
    })
    .join("");
}

// ==========================================================================
// 6. FILTERS & SMOOTH TRANSITION
// ==========================================================================

function triggerSmoothFilter() {
  grid.classList.add("filtering");
  setTimeout(() => {
    renderProducts();
    grid.classList.remove("filtering");
  }, 120);
}

function setActiveChip(container, attr, value) {
  $$(".chip", container).forEach((c) => c.classList.toggle("active", c.dataset[attr] === value));
}

$("#categoryChips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  state.category = chip.dataset.filter;
  setActiveChip($("#categoryChips"), "filter", state.category);
  triggerSmoothFilter();
});

function selectBrand(brand) {
  state.brand = brand;
  setActiveChip($("#brandChips"), "brand", brand);
  triggerSmoothFilter();
}

$("#brandChips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (chip) selectBrand(chip.dataset.brand);
});

$("#sortSelect").addEventListener("change", (e) => {
  state.sort = e.target.value;
  triggerSmoothFilter();
});

$("#searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  state.search = $("#searchInput").value;
  triggerSmoothFilter();
  $("#catalog").scrollIntoView({ behavior: "smooth" });
});

$("#searchInput").addEventListener("input", (e) => {
  state.search = e.target.value;
  triggerSmoothFilter();
});

$("#resetFilters").addEventListener("click", () => {
  state.category = "all";
  state.brand = "all";
  state.search = "";
  $("#searchInput").value = "";
  setActiveChip($("#categoryChips"), "filter", "all");
  setActiveChip($("#brandChips"), "brand", "all");
  triggerSmoothFilter();
});

// ==========================================================================
// 7. CART SYSTEM & SHOPEE/LAZADA BOUNCE ANIMATION
// ==========================================================================

function triggerCartBounce() {
  const cartBtn = $("#cartBtn");
  cartBtn.classList.remove("cart-bounce");
  // Force browser reflow to restart CSS animation cleanly
  void cartBtn.offsetWidth;
  cartBtn.classList.add("cart-bounce");
  setTimeout(() => cartBtn.classList.remove("cart-bounce"), 600);
}

function updateCartUI() {
  const totalItems = [...state.cart.values()].reduce((sum, item) => sum + item.quantity, 0);
  const badge = $("#cartCount");
  badge.textContent = totalItems;
  $("#cartDrawerCount").textContent = `${totalItems} item${totalItems === 1 ? "" : "s"}`;

  renderCartDrawer();
}

function addToCart(productId, btnElement) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;

  if (product.stock <= 0) {
    toast("Sorry, this item is sold out");
    return;
  }

  const existing = state.cart.get(productId);
  const currentQty = existing ? existing.quantity : 0;

  if (currentQty + 1 > product.stock) {
    toast(`Available stock limit reached (${product.stock} units)`);
    return;
  }

  // Add / Increment in cart
  state.cart.set(productId, { product, quantity: currentQty + 1 });
  updateCartUI();

  // Snappy cart bounce animation in top header
  triggerCartBounce();

  // Visual feedback on the button
  if (btnElement) {
    btnElement.textContent = "Added ✓";
    btnElement.classList.add("added");
    setTimeout(() => {
      btnElement.textContent = "Add to cart";
      btnElement.classList.remove("added");
    }, 1200);
  }

  toast(`Added ${product.name} to cart`);
}

function updateCartItemQty(productId, delta) {
  const entry = state.cart.get(productId);
  if (!entry) return;

  const newQty = entry.quantity + delta;
  if (newQty <= 0) {
    state.cart.delete(productId);
    toast("Item removed from cart");
  } else {
    if (newQty > entry.product.stock) {
      toast(`Maximum available stock is ${entry.product.stock}`);
      return;
    }
    entry.quantity = newQty;
  }

  updateCartUI();
}

function removeCartItem(productId) {
  state.cart.delete(productId);
  updateCartUI();
  toast("Item removed");
}

function renderCartDrawer() {
  const container = $("#cartItemsContainer");
  const footer = $("#cartFooter");

  if (state.cart.size === 0) {
    container.innerHTML = `
      <div class="empty-cart-view">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/>
          <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.76L20 8H6.2"/>
        </svg>
        <p><strong>Your cart is empty</strong></p>
        <p class="muted">Add a camera body or lens from the collection to get started.</p>
      </div>`;
    footer.hidden = true;
    return;
  }

  footer.hidden = false;
  let subtotal = 0;

  const itemsHtml = [...state.cart.entries()]
    .map(([id, item]) => {
      const lineTotal = item.product.price * item.quantity;
      subtotal += lineTotal;

      return `
        <div class="cart-item-card" data-id="${id}">
          <img class="cart-item-img" src="${escapeHtml(getProductImage(item.product))}" alt="${escapeHtml(item.product.name)}" onerror="this.onerror=null; this.src='/images/camera_sony_mirrorless_1791623732788.jpg';" />
          <div class="cart-item-info">
            <span class="cart-item-brand">${escapeHtml(item.product.brand)}</span>
            <strong class="cart-item-name">${escapeHtml(item.product.name)}</strong>
            <span class="cart-item-price tabular-nums">${formatPHP(item.product.price)}</span>
            <div class="cart-qty-row">
              <button class="qty-btn" data-action="dec" data-id="${id}" aria-label="Decrease quantity">−</button>
              <span class="qty-val tabular-nums">${item.quantity}</span>
              <button class="qty-btn" data-action="inc" data-id="${id}" aria-label="Increase quantity">+</button>
              <span class="muted font-mono" style="font-size:0.75rem; margin-left:6px;">(${item.product.stock} available)</span>
            </div>
          </div>
          <button class="cart-remove-btn" data-action="remove" data-id="${id}" aria-label="Remove item">&times;</button>
        </div>`;
    })
    .join("");

  container.innerHTML = itemsHtml;
  $("#cartSubtotal").textContent = formatPHP(subtotal);
  $("#cartTotal").textContent = formatPHP(subtotal);

  // Show login requirement alert if customer is not yet signed in
  const authWarning = $("#cartAuthWarning");
  if (authWarning) {
    authWarning.hidden = !!state.session;
  }
}

// Open / Close Slide-out Cart Drawer
function openCartDrawer() {
  renderCartDrawer();
  cartDrawer.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeCartDrawer() {
  cartDrawer.hidden = true;
  document.body.style.overflow = "";
}

$("#cartBtn").addEventListener("click", openCartDrawer);
$("#closeCartBtn").addEventListener("click", closeCartDrawer);
$("#cartBackdrop").addEventListener("click", closeCartDrawer);

// Delegate cart item steppers and removals
$("#cartItemsContainer").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "inc") updateCartItemQty(id, 1);
  if (action === "dec") updateCartItemQty(id, -1);
  if (action === "remove") removeCartItem(id);
});

// Product Grid "Add to cart" click delegation
grid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-btn");
  if (btn) {
    addToCart(btn.dataset.id, btn);
  }
});

// ==========================================================================
// 8. CHECKOUT FLOW & PHILIPPINE PAYMENT SELECTION
// ==========================================================================

function openCheckoutModal() {
  if (state.cart.size === 0) {
    toast("Your cart is empty");
    return;
  }

  // ENFORCE CUSTOMER LOGIN: Customer must have an account before proceeding to checkout
  if (!state.session) {
    closeCartDrawer();
    state.pendingCheckout = true;
    toast("Login Required: Please sign in or create a customer account to checkout.");
    openAuth("login", "customer");
    const authMsg = $("#authMsg");
    if (authMsg) {
      authMsg.className = "form-msg error";
      authMsg.textContent = "Please log in to your Customer account to proceed to checkout.";
    }
    return;
  }

  closeCartDrawer();

  let subtotal = 0;
  let count = 0;
  for (const item of state.cart.values()) {
    subtotal += item.product.price * item.quantity;
    count += item.quantity;
  }

  $("#coItemCount").textContent = count;
  $("#coSubtotal").textContent = formatPHP(subtotal);
  $("#coTotal").textContent = formatPHP(subtotal);
  $("#checkoutMsg").textContent = "";

  // Pre-fill customer details from session if available
  if (state.profile?.full_name) {
    $("#custName").value = state.profile.full_name;
  } else if (state.session?.user?.email) {
    $("#custName").value = state.session.user.email.split("@")[0];
  }
  if (state.profile?.phone && !$("#custPhone").value) {
    $("#custPhone").value = state.profile.phone;
  }
  try {
    const savedInfo = localStorage.getItem("camerahub_saved_checkout_info");
    if (savedInfo) {
      const parsed = JSON.parse(savedInfo);
      if (parsed.phone && !$("#custPhone").value) $("#custPhone").value = parsed.phone;
      if (parsed.address && !$("#custAddress").value) $("#custAddress").value = parsed.address;
      if (parsed.city && !$("#custCity").value) $("#custCity").value = parsed.city;
    }
  } catch (e) {}

  checkoutModal.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#custName").focus(), 60);
}

function closeCheckoutModal() {
  checkoutModal.hidden = true;
  document.body.style.overflow = "";
}

$("#proceedCheckoutBtn").addEventListener("click", () => {
  if (!state.session) {
    closeCartDrawer();
    state.pendingCheckout = true;
    toast("Login Required: Please sign in to proceed to checkout.");
    openAuth("login", "customer");
    const authMsg = $("#authMsg");
    if (authMsg) {
      authMsg.className = "form-msg error";
      authMsg.textContent = "Please log in to your Customer account to proceed to checkout.";
    }
    return;
  }
  openCheckoutModal();
});
$("#closeCheckoutBtn").addEventListener("click", closeCheckoutModal);
$("#checkoutBackdrop").addEventListener("click", closeCheckoutModal);

// Dynamic payment method instructions
const PAYMENT_INSTRUCTIONS = {
  gcash: {
    icon: "📱",
    title: "GCash Instant Pay",
    desc: "Simulates immediate e-wallet deduction. Instant stock verification with PostgreSQL concurrency protection.",
  },
  maya: {
    icon: "💳",
    title: "Maya E-Wallet / Card",
    desc: "Seamless checkout via Maya. Funds verified in real-time, zero transaction fees.",
  },
  bank_transfer: {
    icon: "🏦",
    title: "Philippine Bank Transfer",
    desc: "Supports BDO, BPI, and UnionBank online transfers. Reference numbers generated automatically.",
  },
  cod: {
    icon: "📦",
    title: "Cash on Delivery",
    desc: "Doorstep delivery nationwide. Inspect package before paying courier in cash.",
  },
};

$$('input[name="payMethod"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    $$(".pay-radio-card").forEach((card) => {
      const isChecked = $("input", card).checked;
      card.classList.toggle("active", isChecked);
    });

    const info = PAYMENT_INSTRUCTIONS[radio.value] || PAYMENT_INSTRUCTIONS.gcash;
    const box = $("#payInstructions");
    box.innerHTML = `
      <div class="inst-icon">${info.icon}</div>
      <div class="inst-copy">
        <strong>${info.title}</strong>
        <p>${info.desc}</p>
      </div>`;
  });
});

// ==========================================================================
// 9. COMPLETE CODE INTEGRATION: DATABASE TRANSACTION (checkoutCart)
// ==========================================================================

function isCheckoutRpcUnavailable(error) {
  const text = [error?.message, error?.details, error?.hint].filter(Boolean).join(" ").toLowerCase();
  return error?.code === "PGRST202" || error?.code === "42883" || /function .*checkout_cart|checkout_cart.*not|could not find function/.test(text);
}

function buildLocalCheckoutOrder(orderDetails) {
  // Local-only transaction mode is used only when Supabase is not configured.
  // Step A: Stock validation & lock check
  for (const [id, item] of state.cart.entries()) {
    const product = state.products.find((p) => p.id === id);
    if (!product) throw new Error(`Product ${id} is no longer available.`);
    if (product.stock < item.quantity) {
      throw new Error(`Insufficient stock for "${product.name}". Only ${product.stock} units remaining.`);
    }
  }

  // Step B: Atomically decrement stock
  let totalAmount = 0;
  for (const [id, item] of state.cart.entries()) {
    const product = state.products.find((p) => p.id === id);
    product.stock -= item.quantity;
    totalAmount += product.price * item.quantity;
  }

  // Step C: Generate unique order reference
  const refNum = `CH-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  const orderItemsList = [...state.cart.values()].map((i) => ({
    id: i.product.id,
    product_id: i.product.id,
    name: i.product.name,
    brand: i.product.brand,
    price: i.product.price,
    quantity: i.quantity,
    seller_id: i.product.seller_id || null,
    image_url: getProductImage(i.product),
  }));

  const newOrder = {
    id: `ord-${Date.now()}`,
    reference_number: refNum,
    reference: refNum,
    customer_id: state.session?.user?.id || null,
    customer_name: orderDetails.customer_name,
    customer_email: state.session?.user?.email || "",
    contact_number: orderDetails.contact_number,
    shipping_address: orderDetails.shipping_address,
    city_province: orderDetails.city_province,
    total_amount: totalAmount,
    payment_method: orderDetails.payment_method,
    items_count: [...state.cart.values()].reduce((a, b) => a + b.quantity, 0),
    items: orderItemsList,
    order_status: "to-ship",
    status: "processing",
    tracking_number: null,
    created_at: new Date().toISOString(),
  };

  // Persist local-only orders so a Supabase-free demo still works.
  try {
    const rawLocal = localStorage.getItem("camerahub_local_orders");
    const localOrders = rawLocal ? JSON.parse(rawLocal) : [];
    localOrders.unshift(newOrder);
    localStorage.setItem("camerahub_local_orders", JSON.stringify(localOrders));
  } catch (e) {
    console.warn("Local storage orders save note:", e);
  }

  // Decrement seller inventory in local products storage
  try {
    const rawLocalProds = localStorage.getItem("camerahub_local_products");
    if (rawLocalProds) {
      const localProds = JSON.parse(rawLocalProds);
      let changed = false;
      for (const [id, item] of state.cart.entries()) {
        const found = localProds.find((p) => String(p.id) === String(id));
        if (found) {
          found.stock = Math.max(0, (found.stock || 0) - item.quantity);
          changed = true;
        }
      }
      if (changed) {
        localStorage.setItem("camerahub_local_products", JSON.stringify(localProds));
      }
    }
  } catch (e) {}

  // Broadcast new order and stock reduction to seller dashboard
  try {
    const syncChannel = new BroadcastChannel("camerahub_sync");
    syncChannel.postMessage({ type: "NEW_ORDER", order: newOrder });
    syncChannel.postMessage({ type: "STOCK_UPDATED" });
    syncChannel.close();
  } catch (e) {}

  state.orders.unshift(newOrder);

  // Update order count badges across storefront views
  updateBuyerOrderCounts();

  return {
    success: true,
    order_id: newOrder.id,
    reference_number: newOrder.reference_number,
    total_amount: newOrder.total_amount,
    payment_method: newOrder.payment_method,
    customer_name: newOrder.customer_name,
  };
}

/**
 * Handles checkout through the PostgreSQL atomic RPC when Supabase is configured.
 */
async function checkoutCart(orderDetails) {
  if (db) {
    const invalidProduct = [...state.cart.values()].find(
      (item) => !isValidUUID(String(item.product.id))
    );
    if (invalidProduct) {
      throw new Error(`"${invalidProduct.product.name}" is not in the online catalog. Refresh the page and add it to your cart again.`);
    }
  }

  const itemsPayload = [...state.cart.entries()].map(([id, item]) => ({
    product_id: id,
    quantity: item.quantity,
  }));

  if (db) {
    const { data: authData, error: authError } = await db.auth.getUser();
    if (authError) {
      if (/auth session missing/i.test(authError.message)) {
        clearBuyerSession();
        throw new Error("Your customer session is missing or expired. Please log in again before placing your order.");
      }
      throw new Error(`Unable to verify your customer session: ${authError.message}`);
    }
    if (!authData.user) {
      clearBuyerSession();
      throw new Error("Please sign in with your customer account before placing an order.");
    }

    try {
      const { data, error } = await db.rpc("checkout_cart", {
        p_customer_name: orderDetails.customer_name,
        p_contact_number: orderDetails.contact_number,
        p_shipping_address: orderDetails.shipping_address,
        p_city_province: orderDetails.city_province,
        p_payment_method: orderDetails.payment_method,
        p_items: itemsPayload,
      });

      if (error) {
        if (isCheckoutRpcUnavailable(error)) {
          throw new Error("Database checkout is not installed yet. Apply the latest Supabase migration, then try again.");
        }
        throw new Error(`Order could not be saved. ${error.message}`);
      }

      if (!data?.success || !data.order_id) {
        throw new Error(data?.message || "Order could not be saved. Please try again.");
      }

      const savedOrder = {
        id: data.order_id,
        reference_number: data.reference_number,
        reference: data.reference_number,
        customer_id: authData.user.id,
        customer_name: orderDetails.customer_name,
        customer_email: authData.user.email || "",
        contact_number: orderDetails.contact_number,
        shipping_address: orderDetails.shipping_address,
        city_province: orderDetails.city_province,
        total_amount: Number(data.total_amount) || 0,
        payment_method: orderDetails.payment_method,
        items_count: [...state.cart.values()].reduce((count, item) => count + item.quantity, 0),
        items: [...state.cart.values()].map((item) => ({
          product_id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image_url: getProductImage(item.product),
        })),
        order_status: "to-ship",
        status: "processing",
        tracking_number: null,
        created_at: new Date().toISOString(),
      };
      state.orders.unshift(savedOrder);
      try {
        const localOrders = JSON.parse(localStorage.getItem("camerahub_local_orders") || "[]");
        localOrders.unshift(savedOrder);
        localStorage.setItem("camerahub_local_orders", JSON.stringify(localOrders));
      } catch (error) {
        console.warn("Could not cache the saved order locally:", error);
      }
      try {
        const syncChannel = new BroadcastChannel("camerahub_sync");
        syncChannel.postMessage({ type: "NEW_ORDER", order: savedOrder });
        syncChannel.close();
      } catch (error) {
        console.warn("Could not broadcast the saved order:", error);
      }
      updateBuyerOrderCounts();

      return {
        success: true,
        order_id: savedOrder.id,
        reference_number: savedOrder.reference_number,
        total_amount: savedOrder.total_amount,
        payment_method: orderDetails.payment_method,
        customer_name: orderDetails.customer_name,
      };
    } catch (rpcError) {
      throw rpcError;
    }
  }

  return buildLocalCheckoutOrder(orderDetails);
}

// Checkout Form Submission
$("#checkoutForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = $("#checkoutSubmitBtn");
  const msg = $("#checkoutMsg");
  msg.className = "form-msg";
  msg.textContent = "";

  const name = $("#custName").value.trim();
  const phone = $("#custPhone").value.trim();
  const address = $("#custAddress").value.trim();
  const city = $("#custCity").value.trim();
  const payMethod = $('input[name="payMethod"]:checked').value;

  if (!name || !phone || !address || !city) {
    msg.className = "form-msg error";
    msg.textContent = "Please fill in all delivery details.";
    return;
  }

  submitBtn.disabled = true;
  submitBtn.querySelector(".btn-text").textContent = "Processing Transaction...";

  try {
    const result = await checkoutCart({
      customer_name: name,
      contact_number: phone,
      shipping_address: address,
      city_province: city,
      payment_method: payMethod,
    });

    // Save checkout info for future orders
    try {
      localStorage.setItem("camerahub_saved_checkout_info", JSON.stringify({ phone, address, city }));
    } catch (e) {}

    // Clear cart on successful checkout
    state.cart.clear();
    updateCartUI();
    renderProducts();

    // Close checkout modal
    closeCheckoutModal();

    // Display Simulated Receipt / Success Popup
    showPaymentReceipt(result);
  } catch (err) {
    if (/customer session.*missing|please sign in with your customer/i.test(err.message || "")) {
      state.pendingCheckout = true;
      closeCheckoutModal();
      openAuth("login");
      const authMsg = $("#authMsg");
      authMsg.className = "form-msg error";
      authMsg.textContent = "Your customer session is missing or expired. Please log in again to continue checkout.";
    } else {
      msg.className = "form-msg error";
      msg.textContent = err.message || "Checkout failed. Please try again.";
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector(".btn-text").textContent = "Confirm & Pay";
  }
});

function showPaymentReceipt(order) {
  $("#recRef").textContent = order.reference_number;
  $("#recMethod").textContent = order.payment_method.toUpperCase();
  $("#recCustomer").textContent = order.customer_name;
  $("#recAmount").textContent = formatPHP(order.total_amount);

  paymentSuccessModal.hidden = false;
  document.body.style.overflow = "hidden";
}

$("#recContinueBtn").addEventListener("click", () => {
  paymentSuccessModal.hidden = true;
  document.body.style.overflow = "";
});

$("#recMerchantBtn").addEventListener("click", () => {
  paymentSuccessModal.hidden = true;
  document.body.style.overflow = "";
  window.location.href = "/seller.html";
});

$("#successBackdrop").addEventListener("click", () => {
  paymentSuccessModal.hidden = true;
  document.body.style.overflow = "";
});

// ==========================================================================
// 10. BUYER NAVIGATION & STOREFRONT ACTIONS
// ==========================================================================

$("#logoLink").addEventListener("click", (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

$("#recContinueBtn").addEventListener("click", () => {
  paymentSuccessModal.hidden = true;
  document.body.style.overflow = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ==========================================================================
// BUYER ORDERS & PURCHASES LIFECYCLE (Shopee / Lazada style)
// ==========================================================================

function getMyBuyerOrders() {
  if (!state.session || !state.session.user) return [];
  const currentEmail = (state.session.user.email || "").toLowerCase().trim();
  const currentId = state.session.user.id;

  return state.orders.filter((o) => {
    // Strictly isolate orders belonging only to this specific buyer
    const matchesEmail = Boolean(currentEmail && o.customer_email && o.customer_email.toLowerCase().trim() === currentEmail);
    const matchesId = Boolean(currentId && o.customer_id && String(o.customer_id) === String(currentId));
    return matchesEmail || matchesId;
  });
}

function updateBuyerOrderCounts() {
  const myOrders = getMyBuyerOrders();
  const toShipCount = myOrders.filter((o) => {
    const s = (o.order_status || "to-ship").toLowerCase();
    return s === "to-ship" || s === "processing";
  }).length;
  const toReceiveCount = myOrders.filter((o) => {
    const s = (o.order_status || "").toLowerCase();
    return s === "to-receive" || s === "shipped";
  }).length;
  const completedCount = myOrders.filter((o) => (o.order_status || "").toLowerCase() === "completed").length;

  const countToShip = $("#buyerCountToShip");
  const countToReceive = $("#buyerCountToReceive");
  const countCompleted = $("#buyerCountCompleted");
  if (countToShip) countToShip.textContent = toShipCount;
  if (countToReceive) countToReceive.textContent = toReceiveCount;
  if (countCompleted) countCompleted.textContent = completedCount;

  const buyerNavBtn = $("#buyerOrdersNavBtn");
  if (buyerNavBtn) {
    const activeOrdersCount = toShipCount + toReceiveCount;
    buyerNavBtn.textContent = activeOrdersCount > 0 ? `My Orders (${activeOrdersCount})` : "My Orders";
  }
}

function renderBuyerOrdersList() {
  updateBuyerOrderCounts();
  const container = $("#buyerOrdersList");
  if (!container) return;

  const myOrders = getMyBuyerOrders();
  const stage = state.buyerOrderStageFilter || "all";

  const filtered = myOrders.filter((o) => {
    const rawStatus = (o.order_status || "to-ship").toLowerCase();
    if (stage === "all") return true;
    if (stage === "to-ship") return rawStatus === "to-ship" || rawStatus === "processing";
    if (stage === "to-receive") return rawStatus === "to-receive" || rawStatus === "shipped";
    if (stage === "completed") return rawStatus === "completed";
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="order-empty-view">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
          <path d="M3 6h18"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <p><strong>No orders in this stage</strong></p>
        <p class="muted">Explore our gear collection to start shooting.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered
    .map((o) => {
      const rawStatus = (o.order_status || "to-ship").toLowerCase();
      const isToShip = rawStatus === "to-ship" || rawStatus === "processing";
      const isToReceive = rawStatus === "to-receive" || rawStatus === "shipped";
      const isCompleted = rawStatus === "completed";

      let badge = `<span class="stage-badge to-ship">📦 To Ship</span>`;
      let statusDesc = "Seller is preparing gear and inspecting optics for secure shipment.";
      let actionBtn = "";

      if (isToReceive) {
        badge = `<span class="stage-badge to-receive">🚚 To Receive</span>`;
        statusDesc = o.tracking_number
          ? `On the way via courier (${o.tracking_number}). Expect delivery soon.`
          : "Dispatched with courier. Delivery in progress.";
        actionBtn = `<button type="button" class="btn-stage-action btn-confirm-received" data-action="buyer-confirm" data-id="${o.id}">Order Received</button>`;
      } else if (isCompleted) {
        badge = `<span class="stage-badge completed">✓ Completed</span>`;
        statusDesc = "Parcel delivered and transaction concluded. Enjoy your camera gear!";
      }

      const items = o.items || [
        {
          name: "Photography Gear Equipment",
          price: o.total_amount,
          quantity: o.items_count || 1,
          image_url: "/images/camera_sony_mirrorless_1791623732788.jpg",
        },
      ];

      const itemsHtml = items
        .map(
          (item) => `
        <div class="order-item-row">
          <img class="order-item-thumb" src="${escapeHtml(item.image_url || "/images/camera_sony_mirrorless_1791623732788.jpg")}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null; this.src='/images/camera_sony_mirrorless_1791623732788.jpg';" />
          <div class="order-item-details">
            <strong>${escapeHtml(item.name)}</strong>
            <span class="muted font-mono tabular-nums" style="font-size:0.8rem;">Qty: ${item.quantity || 1} · ${formatPHP(item.price)}</span>
          </div>
        </div>
      `
        )
        .join("");

      return `
        <div class="buyer-order-item" data-id="${o.id}">
          <div class="order-card-top">
            <div class="order-ref-meta">
              <span class="font-mono receipt-ref">${escapeHtml(o.reference_number)}</span>
              <span class="muted" style="font-size:0.75rem;">${new Date(o.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <div>${badge}</div>
          </div>

          <div class="order-card-products">
            ${itemsHtml}
          </div>

          <div class="order-destination-meta" style="font-size:0.78rem; color:var(--gray-600); margin:6px 0; background:var(--gray-50); padding:6px 10px; border-radius:6px; display:flex; flex-wrap:wrap; gap:12px;">
            <span>📍 <strong>Destination:</strong> ${escapeHtml(o.shipping_address || o.city_province || "Philippines")}</span>
            ${o.contact_number ? `<span>📞 <strong>Contact:</strong> ${escapeHtml(o.contact_number)}</span>` : ""}
          </div>

          <p class="muted" style="font-size:0.82rem; background:var(--white); padding:8px 12px; border-radius:6px; border:1px solid var(--gray-200);">
            ${escapeHtml(statusDesc)}
          </p>

          <div class="order-card-foot">
            <div>
              <span class="pay-pill" style="font-size:0.75rem;">${escapeHtml(o.payment_method)}</span>
              <span class="muted" style="margin-left:8px; font-size:0.8rem;">Total:</span>
              <span class="order-foot-amount">${formatPHP(o.total_amount)}</span>
            </div>
            <div>${actionBtn}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function openBuyerOrdersModal() {
  if (!state.session) {
    toast("Please sign in as a customer to view your purchases.");
    openAuth("login", "customer");
    return;
  }
  renderBuyerOrdersList();
  const modal = $("#buyerOrdersModal");
  if (modal) {
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
}

function closeBuyerOrdersModal() {
  const modal = $("#buyerOrdersModal");
  if (modal) {
    modal.hidden = true;
    document.body.style.overflow = "";
  }
}

$("#buyerOrdersNavBtn").addEventListener("click", openBuyerOrdersModal);
$("#closeBuyerOrdersBtn").addEventListener("click", closeBuyerOrdersModal);
$("#buyerOrdersBackdrop").addEventListener("click", closeBuyerOrdersModal);

const recViewOrdersBtn = $("#recViewOrdersBtn");
if (recViewOrdersBtn) {
  recViewOrdersBtn.addEventListener("click", () => {
    paymentSuccessModal.hidden = true;
    openBuyerOrdersModal();
  });
}

const buyerOrderTabs = $("#buyerOrderTabs");
if (buyerOrderTabs) {
  buyerOrderTabs.addEventListener("click", (e) => {
    const tab = e.target.closest(".stage-tab");
    if (!tab) return;
    $$(".stage-tab", buyerOrderTabs).forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.buyerOrderStageFilter = tab.dataset.stage;
    renderBuyerOrdersList();
  });
}

$("#buyerOrdersList").addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn || btn.disabled) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === "buyer-confirm") {
    const order = state.orders.find((o) => String(o.id) === String(id));
    if (order) {
      btn.disabled = true;
      btn.textContent = "Confirming...";
      order.order_status = "completed";
      order.status = "delivered";

      if (db) {
        try {
          await db.from("orders").update({ status: "delivered" }).eq("id", order.id);
        } catch (err) {
          console.warn("Order update note:", err);
        }
      }

      // Sync to shared local orders storage
      try {
        const rawLocal = localStorage.getItem("camerahub_local_orders");
        if (rawLocal) {
          const list = JSON.parse(rawLocal);
          const found = list.find((o) => String(o.id) === String(id));
          if (found) {
            found.order_status = "completed";
            found.status = "delivered";
            localStorage.setItem("camerahub_local_orders", JSON.stringify(list));
          }
        }
      } catch (e) {
        console.warn(e);
      }

      toast(`Order confirmed as received! Gear delivered.`);
      renderBuyerOrdersList();
      updateBuyerOrderCounts();
    }
  }
});

// ==========================================================================
// 12. BUYER AUTH & SESSION MANAGEMENT
// ==========================================================================

const USERS_STORAGE_KEY = "camerahub_registered_users_v2";

function getRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveRegisteredUser(user) {
  try {
    const users = getRegisteredUsers();
    users[user.email.toLowerCase()] = user;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn("Storage error:", e);
  }
}

let authMode = "login";

function setAuthMode(mode) {
  authMode = mode;
  $$(".tab", authModal).forEach((t) => t.classList.toggle("active", t.dataset.mode === mode));
  $(".signup-only").hidden = mode !== "signup";
  $("#authTitle").textContent = mode === "signup" ? "Create an account" : "Welcome back";
  $("#authSubmit").textContent = mode === "signup" ? "Create Buyer Account" : "Log in";
  $("#authMsg").textContent = "";
}

function openAuth(mode = "login") {
  setAuthMode(mode);
  authModal.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => (mode === "signup" ? $("#fullName") : $("#authEmail")).focus(), 60);
}

function closeAuth() {
  authModal.hidden = true;
  document.body.style.overflow = "";
}

function updateSessionUI() {
  const chip = $("#userChip");
  const authBtn = $("#authBtn");
  const buyerOrdersNavBtn = $("#buyerOrdersNavBtn");
  const cartAuthWarning = $("#cartAuthWarning");

  if (cartAuthWarning) {
    cartAuthWarning.hidden = !!state.session;
  }

  if (state.session) {
    authBtn.textContent = "Log out";
    chip.hidden = false;

    if (state.profile?.role === "seller") {
      chip.textContent = "🏪 Camera Hub (Seller)";
      if (buyerOrdersNavBtn) buyerOrdersNavBtn.hidden = true;
    } else {
      chip.textContent = `👤 ${state.profile?.full_name || state.session.user.email} (Buyer)`;
      if (buyerOrdersNavBtn) {
        buyerOrdersNavBtn.hidden = false;
        updateBuyerOrderCounts();
      }
    }
  } else {
    authBtn.textContent = "Log in";
    chip.hidden = true;
    if (buyerOrdersNavBtn) buyerOrdersNavBtn.hidden = true;
  }

  updateBuyerOrderCounts();
  renderBuyerOrdersList();
}

function clearBuyerSession() {
  state.session = null;
  state.profile = null;
  try {
    localStorage.removeItem("camerahub_user_session");
  } catch (e) {}
  updateSessionUI();
}

$("#authBtn").addEventListener("click", () => {
  if (state.session) {
    if (db) db.auth.signOut();
    state.session = null;
    state.profile = null;
    try {
      localStorage.removeItem("camerahub_user_session");
    } catch (e) {}
    updateSessionUI();
    toast("Logged out");
  } else {
    openAuth("login");
  }
});

$("#closeAuthBtn").addEventListener("click", closeAuth);
$("#authBackdrop").addEventListener("click", closeAuth);
$$(".tab", authModal).forEach((t) => t.addEventListener("click", () => setAuthMode(t.dataset.mode)));

// Buyer Registration & Authentication: Public accounts are strictly Buyers!
$("#authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#authEmail").value.trim().toLowerCase();
  const password = $("#authPassword").value;
  const msg = $("#authMsg");
  const submitBtn = $("#authSubmit");

  if (!email || password.length < 6) {
    msg.className = "form-msg error";
    msg.textContent = "Please enter a valid email and a 6+ character password.";
    return;
  }

  submitBtn.disabled = true;

  try {
    const users = getRegisteredUsers();
    const existing = users[email];

    // ==========================================
    // SIGN UP FLOW: Strictly Buyer / Customer
    // ==========================================
    if (authMode === "signup") {
      const fullName = $("#fullName").value.trim() || email.split("@")[0];
      let authUserId = `user-${Date.now()}`;

      if (db) {
        const { data, error } = await db.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: "customer",
            },
          },
        });
        if (error) throw error;
        if (!data?.session?.user) {
          msg.className = "form-msg success";
          msg.textContent = "If an account was created, check your email to confirm your address, then log in before checkout.";
          return;
        }
        authUserId = data.session.user.id;
      } else {
        saveRegisteredUser({
          id: authUserId,
          email,
          password,
          role: "customer",
          full_name: fullName,
          created_at: new Date().toISOString(),
        });
      }

      state.session = { user: { email, id: authUserId } };
      state.profile = { role: "customer", full_name: fullName };

      try {
        localStorage.setItem("camerahub_user_session", JSON.stringify({ session: state.session, profile: state.profile }));
      } catch (e) {}

      closeAuth();
      updateSessionUI();
      toast(`Welcome to Camera Hub, ${fullName}! Account created.`);

      if (state.pendingCheckout) {
        state.pendingCheckout = false;
        openCheckoutModal();
      }
      return;
    }

    // ==========================================
    // LOG IN FLOW
    // ==========================================
    let userRole = !db && existing ? existing.role : "customer";
    let fullName = !db && existing ? existing.full_name : email.split("@")[0];
    let authUserId = !db && existing ? existing.id : `user-${Date.now()}`;

    // Special recognition for Camera Hub Seller
    if (email === "seller@camerahub.ph" || email === "admin@camerahub.ph") {
      userRole = "seller";
      fullName = "Camera Hub Operations";
    }

    // Check remote Supabase credentials
    if (db) {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data?.session?.user) {
        throw new Error("Supabase did not return an active customer session. Please try logging in again.");
      }
      authUserId = data.session.user.id;
      const meta = data.session.user.user_metadata || {};
      if (meta.role) userRole = meta.role;
      if (meta.full_name) fullName = meta.full_name;
    } else {
      if (existing && existing.password && existing.password !== password) {
        throw new Error("Invalid password. Please check your credentials.");
      }
    }

    // Successful Login
    state.session = { user: { email, id: authUserId } };
    state.profile = { role: userRole, full_name: fullName };

    try {
      localStorage.setItem("camerahub_user_session", JSON.stringify({ session: state.session, profile: state.profile }));
    } catch (e) {}

    closeAuth();
    updateSessionUI();

    if (userRole === "seller") {
      toast("Welcome, Camera Hub Merchant! Access the Seller Portal at /seller.html anytime.");
    } else {
      toast(`Welcome back, ${fullName}!`);
      if (state.pendingCheckout) {
        state.pendingCheckout = false;
        openCheckoutModal();
      }
    }
  } catch (err) {
    const isRateLimit = err.message && err.message.toLowerCase().includes("rate limit");
    msg.className = "form-msg error";

    if (isRateLimit) {
      msg.textContent = "Supabase email rate limit reached. Please wait before requesting another confirmation email, or log in if your account is already confirmed.";
    } else {
      msg.textContent = err.message || "Authentication error. Please check your credentials.";
    }
  } finally {
    submitBtn.disabled = false;
  }
});

// ==========================================================================
// 13. SUPABASE REALTIME & REMOTE SYNC
// ==========================================================================

async function loadOrders() {
  let remoteOrders = [];
  if (db) {
    try {
      const { data, error } = await db
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        remoteOrders = data.map((o) => {
          const dbStatus = (o.status || "").toLowerCase();
          const mappedStage = (dbStatus === "shipped") ? "to-receive"
            : (dbStatus === "delivered" || dbStatus === "completed") ? "completed"
            : "to-ship";

          const itemsList = Array.isArray(o.order_items) && o.order_items.length > 0
            ? o.order_items.map((i) => ({
                id: i.product_id,
                product_id: i.product_id,
                name: i.product_name,
                price: i.unit_price,
                quantity: i.quantity,
              }))
            : [];

          // Parse full customer contact, location, and identity from formatted shipping_address
          let parsedName = o.customer_name || "Customer";
          let parsedPhone = o.contact_number || "";
          let parsedAddress = o.shipping_address || "Philippines";
          let parsedCity = o.city_province || "Metro Manila";
          let parsedEmail = o.customer_email || "";

          if (o.shipping_address && typeof o.shipping_address === "string") {
            const raw = o.shipping_address;
            if (raw.includes("|")) {
              const parts = raw.split("|").map((p) => p.trim());
              parsedAddress = parts[0] || parsedAddress;
              const commaIdx = parsedAddress.lastIndexOf(",");
              if (!o.city_province) {
                parsedCity = commaIdx !== -1 ? parsedAddress.slice(commaIdx + 1).trim() : parsedAddress;
              }
              for (let i = 1; i < parts.length; i++) {
                const part = parts[i];
                if (!o.contact_number && (part.startsWith("Phone:") || part.startsWith("Contact:"))) {
                  parsedPhone = part.replace(/^(Phone|Contact):\s*/, "").trim();
                } else if (!o.customer_name && (part.startsWith("Buyer:") || part.startsWith("Customer:"))) {
                  parsedName = part.replace(/^(Buyer|Customer):\s*/, "").trim();
                } else if (!o.customer_email && part.startsWith("Email:")) {
                  parsedEmail = part.replace(/^Email:\s*/, "").trim();
                }
              }
            } else {
              const commaIdx = raw.lastIndexOf(",");
              if (!o.city_province) {
                parsedCity = commaIdx !== -1 ? raw.slice(commaIdx + 1).trim() : raw;
              }
            }
          }

          return {
            id: o.id,
            reference_number: o.reference_number || "CH-" + String(o.id).slice(0, 8).toUpperCase(),
            reference: o.reference_number || "CH-" + String(o.id).slice(0, 8).toUpperCase(),
            customer_name: parsedName,
            customer_email: parsedEmail,
            customer_id: o.customer_id || null,
            contact_number: parsedPhone,
            shipping_address: parsedAddress,
            city_province: parsedCity,
            payment_method: o.payment_method || "GCash",
            total_amount: Number(o.total_amount) || 0,
            order_status: mappedStage,
            status: o.status,
            tracking_number: o.tracking_number || null,
            items_count: itemsList.length > 0 ? itemsList.reduce((acc, i) => acc + (i.quantity || 1), 0) : 1,
            items: itemsList,
            created_at: o.created_at,
          };
        });
        console.log(`Loaded ${remoteOrders.length} live orders from Supabase database.`);
      }
    } catch (err) {
      console.warn("Could not query Supabase orders table:", err);
    }
  }

  // Load and merge local orders (stripping any legacy dummy seed orders)
  let localOrders = [];
  try {
    const rawLocal = localStorage.getItem("camerahub_local_orders");
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (Array.isArray(parsed)) {
        localOrders = parsed.filter((lo) => {
          const sid = String(lo.id || "");
          return !sid.startsWith("ord-seed-") && !sid.startsWith("ord-1712739000");
        });
      }
    }
  } catch (e) {
    localOrders = [];
  }

  const map = new Map();
  for (const o of remoteOrders) {
    map.set(String(o.id), o);
  }
  for (const o of localOrders) {
    const existing = map.get(String(o.id));
    if (!existing) {
      map.set(String(o.id), o);
    } else {
      map.set(String(o.id), { ...o, ...existing });
    }
  }

  state.orders = Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  updateBuyerOrderCounts();
  renderBuyerOrdersList();
}

function updateRealtimeIndicator(isLive) {
  const pill = $("#realtimePill");
  if (!pill) return;
  pill.classList.toggle("disconnected", !isLive);
  const textSpan = pill.querySelector("span:last-child");
  if (textSpan) {
    textSpan.textContent = isLive ? "Supabase Live" : "Supabase Reconnecting";
  }
}

function initSupabaseRealtime() {
  if (!db) return;

  try {
    // 1. Listen for new orders across all customer checkouts in real-time
    db.channel("realtime-orders-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          console.log("⚡ Supabase Realtime Order Insert:", payload.new);
          const newOrder = payload.new;
          const exists = state.orders.some(
            (o) => o.id === newOrder.id || o.reference_number === newOrder.reference_number
          );
          if (!exists) {
            state.orders.unshift(newOrder);
            updateBuyerOrderCounts();
            renderBuyerOrdersList();
            toast(`🔔 Order confirmed: ${newOrder.reference_number} (${formatPHP(newOrder.total_amount)})`);
          }
        }
      )
      .subscribe((status) => {
        const isSubscribed = status === "SUBSCRIBED";
        updateRealtimeIndicator(isSubscribed);
      });

    // 2. Listen for product stock and listing updates in real-time
    db.channel("realtime-products-channel")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload) => {
          console.log("⚡ Supabase Realtime Product Update:", payload.new);
          const updated = payload.new;
          const idx = state.products.findIndex((p) => p.id === updated.id);
          if (idx !== -1) {
            state.products[idx] = {
              ...state.products[idx],
              ...updated,
              image_url: getProductImage(updated),
            };
            renderProducts();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "products" },
        (payload) => {
          console.log("⚡ Supabase Realtime New Product Listed:", payload.new);
          const listed = payload.new;
          const exists = state.products.some((p) => p.id === listed.id);
          if (!exists) {
            state.products.unshift({
              ...listed,
              image_url: getProductImage(listed),
            });
            renderProducts();
          }
        }
      )
      .subscribe();
  } catch (err) {
    console.warn("Supabase Realtime initialization note:", err);
  }
}

// Header scroll elevation
window.addEventListener(
  "scroll",
  () => {
    $("#siteHeader").classList.toggle("scrolled", window.scrollY > 8);
  },
  { passive: true }
);

// Set Current Year
$("#year").textContent = new Date().getFullYear();

// Restore user session on startup
async function restoreUserSession() {
  if (db) {
    try {
      const { data, error } = await db.auth.getSession();
      if (error) throw error;
      if (data?.session?.user) {
        const u = data.session.user;
        const meta = u.user_metadata || {};
        state.session = { user: { email: u.email, id: u.id } };
        state.profile = { role: meta.role || "customer", full_name: meta.full_name || u.email.split("@")[0] };
        return;
      }
    } catch (e) {
      console.warn("Session restore note:", e);
    }
    try {
      localStorage.removeItem("camerahub_user_session");
    } catch (e) {
      console.warn("Could not clear the stale buyer session cache:", e);
    }
    return;
  }

  try {
    const raw = localStorage.getItem("camerahub_user_session");
    if (raw) {
      const s = JSON.parse(raw);
      if (s?.session?.user) {
        state.session = s.session;
        state.profile = s.profile;
      }
    }
  } catch (e) {}
}

// Cross-system listeners for real-time synchronization with Seller Portal
window.addEventListener("storage", (e) => {
  if (e.key === "camerahub_local_products") {
    loadProducts();
  }
  if (e.key === "camerahub_local_orders") {
    loadOrders();
  }
});

try {
  const syncChannel = new BroadcastChannel("camerahub_sync");
  syncChannel.onmessage = (event) => {
    if (event.data?.type === "PRODUCT_CREATED" || event.data?.type === "PRODUCT_UPDATED" || event.data?.type === "STOCK_UPDATED") {
      loadProducts();
    }
    if (event.data?.type === "ORDER_STATUS_UPDATED" || event.data?.type === "NEW_ORDER") {
      loadOrders();
    }
  };
} catch (e) {}

window.addEventListener("camerahub_product_created", () => loadProducts());

// ==========================================================================
// 14. INIT
// ==========================================================================
async function initApp() {
  await restoreUserSession();
  await loadProducts();
  await loadOrders();
  initSupabaseRealtime();
  updateSessionUI();
}

initApp();
