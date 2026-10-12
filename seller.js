/* ==========================================================================
   CAMERA HUB – Official Merchant Center & Seller Engine (seller.js)
   Single-Seller Architecture: Exclusive Operations Dashboard for Camera Hub
   ========================================================================== */

// --- 1. Supabase Initialization ---
const SUPABASE_URL = "https://stwibyfuxcfhzfxunecf.supabase.co";
const SUPABASE_KEY = "sb_publishable_VzwJI0RCaApJYnQZY3_gJQ_NDV_hVt1";
const db = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
let sellerRecoveryMode = false;

// Helpers & Formatting
const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});
const formatPHP = (n) => peso.format(Number(n) || 0);

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

// Toast Notification
let toastTimer = null;
function toast(message, duration = 3000) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), duration);
}

// Preset Images for Fast Product Creation (Real commercial product photos)
const PRESET_IMAGES = [
  { id: "sony-a7iv", name: "Sony Alpha 7 IV Mirrorless", category: "camera", url: "/images/sony_a7iv.jpg" },
  { id: "canon-r5", name: "Canon EOS R5 Full-Frame", category: "camera", url: "/images/canon_r5.jpg" },
  { id: "nikon-z8", name: "Nikon Z8 Flagship", category: "camera", url: "/images/nikon_z8.jpg" },
  { id: "fuji-xt5", name: "Fujifilm X-T5 Mirrorless", category: "camera", url: "/images/fuji_xt5.jpg" },
  { id: "fuji-xt30ii", name: "Fujifilm X-T30 II Body", category: "camera", url: "/images/fuji_xt30ii.jpg" },
  { id: "nikon-zfc", name: "Nikon Z fc Retro", category: "camera", url: "/images/nikon_zfc.jpg" },
  { id: "sony-a6400", name: "Sony Alpha a6400", category: "camera", url: "/images/sony_a6400.jpg" },
  { id: "canon-90d", name: "Canon EOS 90D DSLR", category: "camera", url: "/images/canon_90d.jpg" },
  { id: "nikon-d7500", name: "Nikon D7500 DSLR", category: "camera", url: "/images/nikon_d7500.jpg" },
  { id: "canon-r50", name: "Canon EOS R50 Kit", category: "camera", url: "/images/canon_r50.jpg" },
  { id: "canon-5d", name: "Canon EOS 5D Mark IV DSLR", category: "camera", url: "/images/canon_5d4.jpg" },
  { id: "canon-rf-50mm", name: "Canon RF 50mm Prime", category: "lens", url: "/images/canon_rf_50mm.jpg" },
  { id: "sony-50mm", name: "Sony FE 50mm Prime", category: "lens", url: "/images/sony_50mm_prime.jpg" },
  { id: "fuji-35mm", name: "Fujifilm XF 35mm Prime", category: "lens", url: "/images/fuji_xf_35mm.jpg" },
  { id: "sony-2470-gm", name: "Sony FE 24-70mm f/2.8 GM II", category: "lens", url: "/images/sony_2470_gm.jpg" },
  { id: "canon-rf-24105", name: "Canon RF 24-105mm f/4L IS", category: "lens", url: "/images/canon_rf_24105.jpg" },
  { id: "nikon-70200", name: "Nikon 70-200mm f/2.8 VR", category: "lens", url: "/images/nikon_70200.jpg" },
  { id: "fuji-50140", name: "Fujinon XF 50-140mm Zoom", category: "lens", url: "/images/fuji_50140_zoom.jpg" },
];

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

const DEFAULT_CATALOG = [
  { id: "prod-sony-a7iv", name: "Sony Alpha 7 IV Mirrorless Body", brand: "Sony", category: "camera", subcategory: "mirrorless", price: 139990, stock: 4, image_url: "/images/sony_a7iv.jpg", specs: { sensor: "33MP Full-Frame Exmor R", video: "4K 60p 10-Bit 4:2:2" }, description: "Flagship hybrid mirrorless camera.", is_active: true },
  { id: "prod-canon-r5", name: "Canon EOS R5 Full-Frame Mirrorless", brand: "Canon", category: "camera", subcategory: "full-frame", price: 198900, stock: 2, image_url: "/images/canon_r5.jpg", specs: { sensor: "45MP Full-Frame CMOS", video: "8K 30p Raw" }, description: "High-resolution commercial powerhouse.", is_active: true },
  { id: "prod-nikon-z8", name: "Nikon Z8 Professional Body", brand: "Nikon", category: "camera", subcategory: "full-frame", price: 219900, stock: 3, image_url: "/images/nikon_z8.jpg", specs: { sensor: "45.7MP Stacked CMOS", video: "8.3K 60p N-RAW" }, description: "Mini Z9 powerhouse with blackout-free Real-Live Viewfinder.", is_active: true },
  { id: "prod-fuji-xt5", name: "Fujifilm X-T5 Mirrorless Body (Black)", brand: "Fujifilm", category: "camera", subcategory: "mirrorless", price: 99990, stock: 3, image_url: "/images/fuji_xt5.jpg", specs: { sensor: "40.2MP X-Trans CMOS 5 HR", video: "6.2K 30p Internal" }, description: "Compact photographic masterpiece with dedicated dials.", is_active: true },
  { id: "prod-canon-50", name: "Canon RF 50mm f/1.2L USM Prime", brand: "Canon", category: "lens", subcategory: "prime", price: 129500, stock: 0, image_url: "/images/canon_rf_50mm.jpg", specs: { focal_length: "50mm", aperture: "f/1.2 Ultra-Fast", mount: "Canon RF" }, description: "Legendary low-light portrait prime lens.", is_active: true },
  { id: "prod-fuji-zoom", name: "Fujinon XF 50-140mm f/2.8 R LM OIS WR", brand: "Fujifilm", category: "lens", subcategory: "zoom", price: 84990, stock: 5, image_url: "/images/fuji_50140_zoom.jpg", specs: { focal_length: "50-140mm", aperture: "f/2.8 Constant", mount: "Fuji X-Mount" }, description: "Fast telephoto zoom lens with triple linear motor.", is_active: true },
  { id: "prod-canon-5d4", name: "Canon EOS 5D Mark IV DSLR Body", brand: "Canon", category: "camera", subcategory: "dslr", price: 89000, stock: 2, image_url: "/images/canon_5d4.jpg", specs: { sensor: "30.4MP Full-Frame CMOS", video: "DCI 4K 30p" }, description: "Legendary battle-tested workhorse DSLR body.", is_active: true },
];

// --- 2. State Management ---
const USERS_STORAGE_KEY = "camerahub_registered_users_v2";
const SELLER_SESSION_KEY = "camerahub_seller_active_session";

const sellerState = {
  session: null,
  products: [...DEFAULT_CATALOG],
  orders: [],
  selectedPresetImage: PRESET_IMAGES[0].url,
  currentOrderStage: "all",
};

// Seed initial orders - Empty by default to prevent ghost orders for new users
const DEFAULT_ORDERS = [];

// --- 3. Camera Hub Merchant Authentication ---
function getRegisteredUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

async function checkStoredSellerSession() {
  if (db) {
    try {
      const { data, error } = await db.auth.getUser();
      if (error) throw error;
      const user = data.user;
      if (!user || user.app_metadata?.role !== "seller") {
        localStorage.removeItem(SELLER_SESSION_KEY);
        return false;
      }
      establishSellerSession(user.email, user.id);
      return true;
    } catch (error) {
      console.error("Could not verify the merchant session:", error);
      return false;
    }
  }

  try {
    const raw = localStorage.getItem(SELLER_SESSION_KEY);
    if (raw) {
      const sess = JSON.parse(raw);
      if (sess && sess.role === "seller") {
        sellerState.session = sess;
        return true;
      }
    }
  } catch (e) {
    console.warn("Session parse error:", e);
  }
  return false;
}

function establishSellerSession(email = "seller@camerahub.ph", userId = null) {
  if (db && !userId) return false;
  const sess = {
    email,
    user_id: userId,
    role: "seller",
    store_name: "Camera Hub Official Store",
    full_name: "Camera Hub Operations",
    authenticated_at: new Date().toISOString(),
  };
  sellerState.session = sess;
  try {
    localStorage.setItem(SELLER_SESSION_KEY, JSON.stringify(sess));
  } catch (e) {
    console.warn(e);
  }
  updateSellerUI();
  toast(db ? "Authenticated as Camera Hub Official Seller" : "Signed in to the offline merchant preview");
  return true;
}

function updateSellerUI() {
  const isAuth = !!sellerState.session;
  $("#sellerAuthGate").hidden = isAuth;
  $("#sellerDashboardContent").hidden = !isAuth;
  $("#sellerUserChip").hidden = !isAuth;
  $("#sellerLogoutBtn").hidden = !isAuth;

  if (isAuth) {
    updateSellerDashboard();
  }
}

function showSellerPasswordRecovery() {
  sellerRecoveryMode = true;
  $("#quickSellerLoginBtn").hidden = true;
  $(".or-divider").hidden = true;
  $("#sellerLoginForm").hidden = true;
  $("#sellerResetMsg").hidden = true;
  $("#sellerPasswordRecoveryForm").hidden = false;
  $("#sellerPasswordRecoveryMsg").textContent = "";
  $("#sellerNewPassword").focus();
}

if (db) {
  db.auth.onAuthStateChange((event, session) => {
    if (event !== "PASSWORD_RECOVERY") return;

    const user = session?.user;
    if (
      !user ||
      user.app_metadata?.role !== "seller"
    ) {
      $("#sellerResetMsg").className = "form-msg error";
      $("#sellerResetMsg").textContent = "This account is not assigned the seller role. Ask the project administrator to grant merchant access.";
      void db.auth.signOut();
      return;
    }

    showSellerPasswordRecovery();
  });
}

$("#sellerLogoutBtn").addEventListener("click", async () => {
  if (db) {
    const { error } = await db.auth.signOut();
    if (error) {
      console.error("Could not sign out the merchant session:", error);
      toast(`Could not log out: ${error.message}`);
      return;
    }
  }
  sellerState.session = null;
  localStorage.removeItem(SELLER_SESSION_KEY);
  updateSellerUI();
  toast("Logged out of Merchant Center");
});

// One-Click Quick Sign In as Camera Hub
$("#quickSellerLoginBtn").addEventListener("click", () => {
  if (db) {
    toast("Database access requires verified merchant credentials. Use the sign-in form.");
    $("#sellerLoginPassword").focus();
    return;
  }
  establishSellerSession("seller@camerahub.ph");
});

async function requestSellerPasswordReset() {
  const email = $("#sellerLoginEmail").value.trim().toLowerCase();
  const msg = $("#sellerResetMsg");

  if (!email) {
    msg.className = "form-msg error";
    msg.textContent = "Enter the merchant email before requesting a password reset.";
    return;
  }

  if (!db) {
    msg.className = "form-msg error";
    msg.textContent = "Password reset is only available when Supabase Auth is connected for this merchant portal.";
    return;
  }

  try {
    const { error } = await db.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/seller.html`,
    });

    if (error) throw error;

    msg.className = "form-msg success";
    msg.textContent = "If this account exists, a password reset email has been sent. Check its inbox and follow the recovery link.";
    toast("If the account exists, a reset email has been sent");
  } catch (error) {
    console.error("Password reset request failed:", error);
    msg.className = "form-msg error";
    msg.textContent = error.message || "Could not send the password reset email.";
  }
}

$("#sellerForgotPasswordBtn").addEventListener("click", requestSellerPasswordReset);

$("#sellerPasswordRecoveryForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = $("#sellerNewPassword").value;
  const confirmation = $("#sellerConfirmPassword").value;
  const msg = $("#sellerPasswordRecoveryMsg");
  const submitButton = $("#sellerPasswordRecoverySubmit");

  if (password.length < 8) {
    msg.className = "form-msg error";
    msg.textContent = "Use a password with at least 8 characters.";
    return;
  }
  if (password !== confirmation) {
    msg.className = "form-msg error";
    msg.textContent = "The passwords do not match.";
    return;
  }
  if (!db || !sellerRecoveryMode) {
    msg.className = "form-msg error";
    msg.textContent = "This recovery session is missing or expired. Request a new password reset email.";
    return;
  }

  submitButton.disabled = true;
  msg.className = "form-msg";
  msg.textContent = "Saving your new password...";
  try {
    const { data, error } = await db.auth.updateUser({ password });
    if (error) throw error;

    const user = data.user;
    if (
      !user ||
      user.app_metadata?.role !== "seller"
    ) {
      throw new Error("The recovered account is not assigned the seller role.");
    }

    sellerRecoveryMode = false;
    $("#sellerResetMsg").className = "form-msg success";
    $("#sellerResetMsg").textContent = "Password updated. You are now signed in to the Merchant Center.";
    $("#sellerPasswordRecoveryForm").hidden = true;
    establishSellerSession(user.email, user.id);
    loadProducts();
    loadOrders();
    setupRealtimeListeners();
  } catch (error) {
    console.error("Merchant password update failed:", error);
    msg.className = "form-msg error";
    msg.textContent = error.message || "Could not update the password. Request a new recovery email and try again.";
  } finally {
    submitButton.disabled = false;
  }
});

// Credentials Form with Single-Seller Enforcement
$("#sellerLoginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("#sellerLoginEmail").value.trim().toLowerCase();
  const password = $("#sellerLoginPassword").value;
  const msg = $("#sellerLoginMsg");

  if (!email) {
    msg.className = "form-msg error";
    msg.textContent = "Please enter the merchant email.";
    return;
  }

  // Check if entered email is a registered buyer account!
  const users = getRegisteredUsers();
  const userRecord = users[email];
  if (!db && userRecord && userRecord.role === "customer") {
    msg.className = "form-msg error";
    msg.innerHTML = `
      <strong>⛔ Access Restricted: Buyer Account Detected</strong><br/>
      <span>${escapeHtml(email)} is registered as a buyer in this offline preview.</span>
    `;
    return;
  }

  if (db) {
    if (!password) {
      msg.className = "form-msg error";
      msg.textContent = "Enter the Supabase password for the merchant account.";
      return;
    }

    try {
      const { data, error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user || data.user.app_metadata?.role !== "seller") {
        await db.auth.signOut();
        throw new Error("This Supabase account is not assigned the seller role. Ask the project administrator to grant merchant access.");
      }
      establishSellerSession(data.user.email, data.user.id);
    } catch (error) {
      console.error("Merchant sign-in failed:", error);
      msg.className = "form-msg error";
      msg.textContent = error.message || "Merchant sign-in failed.";
    }
    return;
  }

  establishSellerSession(email);
});

// --- 4. Data Loading & Supabase Integration ---
async function loadProducts() {
  if (db) {
    try {
      const { data, error } = await db
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        sellerState.products = data;
      } else {
        syncLocalProducts();
      }
    } catch (err) {
      console.warn("Supabase products fetch note:", err);
      syncLocalProducts();
    }
  } else {
    syncLocalProducts();
  }
  renderSellerInventoryTable();
  updateSellerDashboardMetrics();
}

function syncLocalProducts() {
  try {
    const stored = localStorage.getItem("camerahub_local_products");
    if (stored) {
      sellerState.products = JSON.parse(stored);
    } else {
      localStorage.setItem("camerahub_local_products", JSON.stringify(sellerState.products));
    }
  } catch (e) {
    console.warn(e);
  }
}

function saveLocalProducts() {
  try {
    localStorage.setItem("camerahub_local_products", JSON.stringify(sellerState.products));
  } catch (e) {
    console.warn(e);
  }
}

function isValidUUID(str) {
  return typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

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
                name: i.product_name,
                price: i.unit_price,
                quantity: i.quantity,
              }))
            : [];

          // Parse full customer contact & location info from formatted shipping_address
          let parsedName = o.customer_name || "Customer";
          let parsedPhone = o.contact_number || "";
          let parsedAddress = o.shipping_address || "Philippines";
          let parsedCity = o.city_province || "Metro Manila";

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
                  o.customer_email = part.replace(/^Email:\s*/, "").trim();
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
            reference: o.reference_number || "CH-" + String(o.id).slice(0, 8).toUpperCase(),
            customer_name: parsedName,
            customer_email: o.customer_email || "",
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
      } else if (error) {
        console.warn("Supabase orders fetch note:", error.message || error);
        if (error.code === "42P17" || String(error.message).includes("infinite recursion")) {
          const alertEl = $("#supabaseSyncAlert");
          if (alertEl) alertEl.style.display = "flex";
        }
      }
    } catch (err) {
      console.warn("Supabase orders fetch note:", err);
    }
  }

  // Load and merge local orders (stripping any legacy seed dummy orders)
  let localOrders = [];
  try {
    const stored = localStorage.getItem("camerahub_local_orders");
    if (stored) {
      const parsed = JSON.parse(stored);
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

  // Combine remote and local orders deduplicated by id.
  const orderMap = new Map();
  for (const lo of localOrders) {
    orderMap.set(String(lo.id), lo);
  }
  for (const ro of remoteOrders) {
    const existing = orderMap.get(String(ro.id));
    if (!existing) {
      orderMap.set(String(ro.id), ro);
    } else {
      const stageScore = (st) => {
        const s = (st || "").toLowerCase();
        if (s === "completed" || s === "delivered") return 3;
        if (s === "to-receive" || s === "shipped") return 2;
        return 1;
      };
      const localScore = stageScore(existing.order_status || existing.status);
      const remoteScore = stageScore(ro.order_status || ro.status);
      const mergedTracking = existing.tracking_number || ro.tracking_number;
      if (remoteScore > localScore) {
        orderMap.set(String(ro.id), { ...existing, ...ro, tracking_number: mergedTracking });
      } else {
        orderMap.set(String(ro.id), { ...ro, ...existing, tracking_number: mergedTracking });
      }
    }
  }

  sellerState.orders = Array.from(orderMap.values()).sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  saveLocalOrders();
  renderSellerOrdersTable();
  updateSellerDashboardMetrics();
}

function syncLocalOrders() {
  try {
    const stored = localStorage.getItem("camerahub_local_orders");
    if (stored) {
      const parsed = JSON.parse(stored);
      sellerState.orders = Array.isArray(parsed)
        ? parsed.filter((lo) => {
            const sid = String(lo.id || "");
            return !sid.startsWith("ord-seed-") && !sid.startsWith("ord-1712739000");
          })
        : [];
    } else {
      sellerState.orders = [];
    }
  } catch (e) {
    sellerState.orders = [];
  }
}

function saveLocalOrders() {
  try {
    localStorage.setItem("camerahub_local_orders", JSON.stringify(sellerState.orders));
  } catch (e) {
    console.warn(e);
  }
  try {
    const syncChannel = new BroadcastChannel("camerahub_sync");
    syncChannel.postMessage({ type: "ORDER_STATUS_UPDATED" });
    syncChannel.close();
  } catch (e) {}
}

// --- 5. Seller Analytics Dashboard & Metrics ---
function updateSellerDashboardMetrics() {
  const products = sellerState.products;
  const orders = sellerState.orders;

  // 1. Revenue
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
  $("#metricRevenue").textContent = formatPHP(totalRevenue);

  // 2. Orders count
  $("#metricOrders").textContent = orders.length;

  // 3. Low stock and out of stock
  const lowStockItems = products.filter((p) => p.stock !== null && p.stock <= 3);
  $("#metricLowStock").textContent = lowStockItems.length;

  // 4. Active listings
  const activeListings = products.filter((p) => p.is_active !== false);
  $("#metricListings").textContent = activeListings.length;

  // Stock alert banner
  const alertBanner = $("#stockAlertBanner");
  if (lowStockItems.length > 0) {
    alertBanner.hidden = false;
    $("#stockAlertMessage").textContent = `${lowStockItems.length} product(s) currently low in stock (≤ 3 units) or sold out.`;
  } else {
    alertBanner.hidden = true;
  }

  // Gear distribution breakdown
  const mirrorlessVal = products
    .filter((p) => p.subcategory === "mirrorless")
    .reduce((s, p) => s + p.price * Math.max(1, p.stock), 0);
  const lensVal = products
    .filter((p) => p.category === "lens" || p.subcategory === "zoom" || p.subcategory === "prime")
    .reduce((s, p) => s + p.price * Math.max(1, p.stock), 0);
  const dslrVal = products
    .filter((p) => p.subcategory === "dslr")
    .reduce((s, p) => s + p.price * Math.max(1, p.stock), 0);

  const totalCatalogValue = mirrorlessVal + lensVal + dslrVal || 1;
  const pctM = Math.round((mirrorlessVal / totalCatalogValue) * 100);
  const pctL = Math.round((lensVal / totalCatalogValue) * 100);
  const pctD = Math.max(0, 100 - pctM - pctL);

  $("#distMirrorless").textContent = `${pctM}% · ${formatPHP(mirrorlessVal)}`;
  $("#fillMirrorless").style.width = `${pctM}%`;

  $("#distLenses").textContent = `${pctL}% · ${formatPHP(lensVal)}`;
  $("#fillLenses").style.width = `${pctL}%`;

  $("#distDslr").textContent = `${pctD}% · ${formatPHP(dslrVal)}`;
  $("#fillDslr").style.width = `${pctD}%`;

  // Stock Health Bar
  const totalItems = products.length || 1;
  const healthyCount = products.filter((p) => p.stock > 3).length;
  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= 3).length;
  const outCount = products.filter((p) => p.stock === 0).length;

  const pctHealthy = Math.round((healthyCount / totalItems) * 100);
  const pctLow = Math.round((lowCount / totalItems) * 100);
  const pctOut = Math.max(0, 100 - pctHealthy - pctLow);

  $("#segHealthy").style.width = `${pctHealthy}%`;
  $("#segLow").style.width = `${pctLow}%`;
  $("#segOut").style.width = `${pctOut}%`;

  $("#pctHealthy").textContent = pctHealthy;
  $("#pctLow").textContent = pctLow;
  $("#pctOut").textContent = pctOut;
  $("#stockHealthTag").textContent = `${pctHealthy}% Operational`;
}

function updateSellerDashboard() {
  updateSellerDashboardMetrics();
  renderSellerInventoryTable();
  renderSellerOrdersTable();
}

// --- 6. Live Inventory Table ---
function renderSellerInventoryTable() {
  const tbody = $("#sellerTableBody");
  if (!tbody) return;

  if (sellerState.products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="muted" style="text-align:center; padding:24px;">No products published yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = sellerState.products
    .map((p) => {
      const isOut = p.stock === 0;
      const isLow = p.stock > 0 && p.stock <= 3;
      const statusBadge = isOut
        ? `<span class="stock-badge badge-out">Sold Out (0)</span>`
        : isLow
        ? `<span class="stock-badge badge-low">Low Stock (${p.stock})</span>`
        : `<span class="stock-badge badge-ok">${p.stock} units</span>`;

      return `
      <tr data-id="${p.id}">
        <td>
          <div class="table-prod-cell">
            <img class="table-thumb" src="${getProductImage(p)}" alt="${escapeHtml(p.name)}" onerror="this.src='/images/camera_sony_mirrorless_1791623732788.jpg'" />
            <div>
              <span class="table-prod-name">${escapeHtml(p.name)}</span>
              <span class="table-prod-sub">${escapeHtml(p.category)} · ${escapeHtml(p.subcategory || "general")}</span>
            </div>
          </div>
        </td>
        <td><span class="brand-pill">${escapeHtml(p.brand)}</span></td>
        <td><span class="font-mono tabular-nums font-semibold">${formatPHP(p.price)}</span></td>
        <td>${statusBadge}</td>
        <td>
          <div class="stock-stepper">
            <button class="stock-stepper-btn" data-action="dec" data-id="${p.id}" aria-label="Decrease stock" ${p.stock <= 0 ? "disabled" : ""}>−</button>
            <span class="stock-stepper-val font-mono">${p.stock}</span>
            <button class="stock-stepper-btn" data-action="inc" data-id="${p.id}" aria-label="Increase stock">+</button>
          </div>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-ghost btn-xs" data-action="edit-price" data-id="${p.id}">Price</button>
            <button class="btn btn-ghost btn-xs text-danger" data-action="delete" data-id="${p.id}">Remove</button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

// Table Stepper & Quick Actions
$("#sellerInventoryTable").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const product = sellerState.products.find((p) => p.id === id);
  if (!product) return;

  if (action === "inc" || action === "dec") {
    const delta = action === "inc" ? 1 : -1;
    const newStock = Math.max(0, (product.stock || 0) + delta);
    product.stock = newStock;

    if (db) {
      await db.from("products").update({ stock: newStock }).eq("id", id);
    }
    saveLocalProducts();
    renderSellerInventoryTable();
    updateSellerDashboardMetrics();
    toast(`Stock updated for ${product.name}: ${newStock} units`);
  } else if (action === "edit-price") {
    const input = prompt(`Update price in PHP for ${product.name}:`, product.price);
    if (input !== null) {
      const newPrice = parseFloat(input);
      if (!isNaN(newPrice) && newPrice > 0) {
        product.price = newPrice;
        if (db) {
          await db.from("products").update({ price: newPrice }).eq("id", id);
        }
        saveLocalProducts();
        renderSellerInventoryTable();
        updateSellerDashboardMetrics();
        toast("Price updated");
      }
    }
  } else if (action === "delete") {
    if (confirm(`Remove "${product.name}" from marketplace listings?`)) {
      sellerState.products = sellerState.products.filter((p) => p.id !== id);
      if (db) {
        await db.from("products").delete().eq("id", id);
      }
      saveLocalProducts();
      renderSellerInventoryTable();
      updateSellerDashboardMetrics();
      toast("Listing removed");
    }
  }
});

// --- 7. Customer Orders Fulfillment Pipeline ---
function updateOrderStageCounts() {
  const orders = sellerState.orders;
  const toShipCount = orders.filter((o) => {
    const s = (o.order_status || "to-ship").toLowerCase();
    return s === "to-ship" || s === "processing";
  }).length;

  const toReceiveCount = orders.filter((o) => {
    const s = (o.order_status || "").toLowerCase();
    return s === "to-receive" || s === "shipped";
  }).length;

  const completedCount = orders.filter((o) => (o.order_status || "").toLowerCase() === "completed").length;

  $("#countToShip").textContent = toShipCount;
  $("#countToReceive").textContent = toReceiveCount;
  $("#countCompleted").textContent = completedCount;
}

function renderSellerOrdersTable() {
  updateOrderStageCounts();
  const tbody = $("#sellerOrdersBody");
  if (!tbody) return;

  const stage = sellerState.currentOrderStage;
  const filteredOrders = sellerState.orders.filter((o) => {
    if (stage === "all") return true;
    const s = (o.order_status || "to-ship").toLowerCase();
    if (stage === "to-ship") return s === "to-ship" || s === "processing";
    if (stage === "to-receive") return s === "to-receive" || s === "shipped";
    if (stage === "completed") return s === "completed";
    return true;
  });

  if (filteredOrders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="muted" style="text-align:center; padding:24px;">No orders found in stage "${stage}".</td></tr>`;
    return;
  }

  tbody.innerHTML = filteredOrders
    .map((o) => {
      const status = (o.order_status || o.status || "to-ship").toLowerCase();
      let badgeHtml = "";
      let actionBtn = "";

      if (status === "to-ship" || status === "processing") {
        badgeHtml = `<span class="stage-badge badge-to-ship">📦 To Ship</span>`;
        actionBtn = `<button class="btn btn-primary btn-xs" data-action="dispatch-order" data-id="${o.id}">Proceed to Ship</button>`;
      } else if (status === "to-receive" || status === "shipped") {
        badgeHtml = `<span class="stage-badge badge-to-receive">🚚 In Transit</span>`;
        actionBtn = `<span class="dispatched-tag font-mono" style="font-size:0.75rem; color:#1e40af; font-weight:600; display:inline-flex; align-items:center; gap:4px;">✓ Dispatched</span>`;
      } else if (status === "completed" || status === "delivered") {
        badgeHtml = `<span class="stage-badge badge-completed">✓ Completed</span>`;
        actionBtn = `<span class="font-mono text-muted" style="font-size:0.75rem;">Fulfilled & Delivered</span>`;
      } else {
        badgeHtml = `<span class="stage-badge badge-to-ship">${escapeHtml(status)}</span>`;
        actionBtn = `<span class="font-mono text-muted" style="font-size:0.75rem;">—</span>`;
      }

      // Summary of items
      const itemsList = Array.isArray(o.items) && o.items.length > 0
        ? o.items.map((i) => `${i.quantity || 1}x ${i.name}`).join(", ")
        : `${o.items_count || 1} Camera item(s)`;

      const trackingText = o.tracking_number
        ? `<span class="tracking-pill font-mono" title="Carrier Tracking">${escapeHtml(o.tracking_number)}</span>`
        : "";

      return `
      <tr data-id="${o.id}">
        <td>
          <div class="order-ref-cell">
            <span class="font-mono font-semibold">${escapeHtml(o.reference || o.id)}</span>
            <span class="muted" style="font-size:0.72rem;">${new Date(o.created_at || Date.now()).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
            ${trackingText}
          </div>
        </td>
        <td>
          <div class="customer-info-cell">
            <strong>${escapeHtml(o.customer_name || "Customer")}</strong>
            <span class="muted" style="font-size:0.75rem; display:block;">📍 ${escapeHtml(o.city_province || o.shipping_address || "Philippines")}</span>
            ${o.contact_number ? `<a href="tel:${escapeHtml(o.contact_number)}" class="muted font-mono" style="font-size:0.75rem; color:var(--accent); text-decoration:none; display:inline-block; margin-top:2px;" title="Customer Phone Number">📞 ${escapeHtml(o.contact_number)}</a>` : ""}
          </div>
        </td>
        <td><span class="pay-pill-compact">${escapeHtml(o.payment_method || "GCash")}</span></td>
        <td><div class="order-items-snippet" title="${escapeHtml(itemsList)}">${escapeHtml(itemsList)}</div></td>
        <td><span class="font-mono font-semibold tabular-nums">${formatPHP(o.total_amount)}</span></td>
        <td>${badgeHtml}</td>
        <td>${actionBtn}</td>
      </tr>`;
    })
    .join("");
}

// Stage Filter Tabs
$("#sellerOrderTabs").addEventListener("click", (e) => {
  const tab = e.target.closest(".stage-tab");
  if (!tab) return;
  $$(".stage-tab", $("#sellerOrderTabs")).forEach((t) => t.classList.remove("active"));
  tab.classList.add("active");
  sellerState.currentOrderStage = tab.dataset.stage;
  renderSellerOrdersTable();
});

// Order Fulfillment Actions (Seller proceeds ONCE: to dispatch & ship order)
$("#sellerOrdersTable").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn || btn.disabled) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  const order = sellerState.orders.find((o) => String(o.id) === String(id));
  if (!order) return;

  if (action === "dispatch-order") {
    btn.disabled = true;
    btn.textContent = "Dispatching...";

    const trackingCode = `CH-TRACK-${Math.floor(1000 + Math.random() * 9000)}-LBC`;

    try {
      if (db && isValidUUID(id)) {
        const { data, error } = await db.rpc("dispatch_order_v2", {
          p_order_id: id,
          p_tracking_number: trackingCode,
        });
        if (error) {
          const text = [error?.message, error?.details, error?.hint].filter(Boolean).join(" ").toLowerCase();
          const remoteMissing = error?.code === "PGRST202" || /does not exist|not found|function .*dispatch_order_v2|dispatch_order_v2.*not|could not find function/.test(text);
          if (remoteMissing) {
            console.warn("dispatch_order_v2 RPC missing. Updating the local order state only.", error);
          } else {
            throw error;
          }
        } else if (!data?.success) {
          throw new Error(data?.message || "Order was not updated.");
        }
      }

      order.order_status = "to-receive";
      order.status = "shipped";
      order.tracking_number = trackingCode;
      saveLocalOrders();
      renderSellerOrdersTable();
      updateSellerDashboardMetrics();
      toast(`Order ${order.reference || id} dispatched! Handed over to courier (Tracking: ${trackingCode})`);
    } catch (error) {
      console.error("Could not dispatch order:", error);
      btn.disabled = false;
      btn.textContent = "Proceed to Ship";
      toast(`Could not dispatch order: ${error.message || "Database update failed."}`);
    }
  }
});

// --- 8. Add Product Form & Supabase Storage ---
function initPresetPickers() {
  const container = $("#presetPickers");
  if (!container) return;
  container.innerHTML = PRESET_IMAGES.map(
    (preset, i) => `
    <button type="button" class="preset-btn ${i === 0 ? "active" : ""}" data-url="${preset.url}">
      <img src="${preset.url}" alt="${preset.name}" />
      <span>${preset.name}</span>
    </button>`
  ).join("");

  updateImagePreview(PRESET_IMAGES[0].url);

  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".preset-btn");
    if (!btn) return;
    $$(".preset-btn", container).forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    sellerState.selectedPresetImage = btn.dataset.url;
    updateImagePreview(btn.dataset.url);
  });
}

function updateImagePreview(url) {
  const img = $("#imagePreviewImg");
  const placeholder = $("#imagePreviewPlaceholder");
  if (url && url.trim().length > 3) {
    img.src = url;
    img.hidden = false;
    placeholder.hidden = true;
  } else {
    img.hidden = true;
    placeholder.hidden = false;
  }
}

// Image Tabs (Preset vs URL vs File)
$$(".img-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".img-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const mode = tab.dataset.imgMode;

    $("#imgModePreset").hidden = mode !== "preset";
    $("#imgModeUrl").hidden = mode !== "url";
    $("#imgModeFile").hidden = mode !== "file";

    if (mode === "preset") {
      updateImagePreview(sellerState.selectedPresetImage);
    } else if (mode === "url") {
      updateImagePreview($("#pImageUrl").value);
    }
  });
});

$("#pImageUrl").addEventListener("input", (e) => {
  updateImagePreview(e.target.value);
});

// File upload handler to Supabase Storage 'product-images'
$("#pImageFile").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const localPreview = URL.createObjectURL(file);
  updateImagePreview(localPreview);

  if (db) {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      toast("Uploading image to Supabase Storage...");
      const { data, error } = await db.storage.from("product-images").upload(filePath, file);

      if (!error) {
        const { data: publicUrlData } = db.storage.from("product-images").getPublicUrl(filePath);
        if (publicUrlData && publicUrlData.publicUrl) {
          $("#pImageUrl").value = publicUrlData.publicUrl;
          toast("Image stored in public Supabase bucket 'product-images'");
        }
      }
    } catch (err) {
      console.warn("Storage upload completed with preview fallback:", err);
    }
  }
});

// Category change toggles relevant spec fields
$("#pCategory").addEventListener("change", (e) => {
  const isCamera = e.target.value === "camera";
  $("#cameraSpecsFields").hidden = !isCamera;
  $("#lensSpecsFields").hidden = isCamera;
});

// Add Product Form Submission
$("#newProductForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = $("#pName").value.trim();
  const brand = $("#pBrand").value;
  const category = $("#pCategory").value;
  const subcategory = $("#pSubcategory").value;
  const price = parseFloat($("#pPrice").value);
  const stock = parseInt($("#pStock").value, 10);
  const description = $("#pDescription").value.trim();

  if (!name || isNaN(price) || isNaN(stock) || price <= 0 || stock < 0) {
    toast("Please enter a valid product name, price, and inventory stock.");
    return;
  }

  // Determine active image URL
  const activeTab = $(".img-tab.active")?.dataset?.imgMode || "preset";
  let imageUrl = sellerState.selectedPresetImage;
  if (activeTab === "url" && $("#pImageUrl").value.trim()) {
    imageUrl = $("#pImageUrl").value.trim();
  } else if (activeTab === "file" && $("#pImageUrl").value.trim()) {
    imageUrl = $("#pImageUrl").value.trim();
  }

  const specs = category === "camera"
    ? {
        sensor: $("#pSpecSensor").value.trim() || "Full-Frame Optical Sensor",
        video: $("#pSpecVideo").value.trim() || "4K 60p HDR",
      }
    : {
        focal_length: $("#pSpecFocal").value.trim() || "Standard Zoom",
        mount: $("#pSpecMount").value.trim() || `${brand} Mount`,
      };

  // Generate standard UUID for database compatibility
  const newId = (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

  const newProduct = {
    id: newId,
    name,
    brand,
    category,
    subcategory,
    price,
    stock,
    image_url: imageUrl,
    specs,
    description: description || `Official ${brand} camera gear released for Camera Hub marketplace.`,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  sellerState.products.unshift(newProduct);
  saveLocalProducts();

  if (db) {
    try {
      const dbPayload = {
        id: newProduct.id,
        name: newProduct.name,
        brand: newProduct.brand,
        category: newProduct.category,
        subcategory: newProduct.subcategory,
        price: newProduct.price,
        stock: newProduct.stock,
        image_url: newProduct.image_url,
        specs: newProduct.specs,
        description: newProduct.description,
        is_active: true,
      };
      if (sellerState.session?.user?.id && isValidUUID(sellerState.session.user.id)) {
        dbPayload.seller_id = sellerState.session.user.id;
      }
      await db.from("products").insert([dbPayload]);
    } catch (err) {
      console.warn("Remote product insertion note:", err);
    }
  }

  // Instant broadcast to buyer storefront
  try {
    const syncChannel = new BroadcastChannel("camerahub_sync");
    syncChannel.postMessage({ type: "PRODUCT_CREATED", product: newProduct });
    syncChannel.close();
  } catch (e) {}

  window.dispatchEvent(new CustomEvent("camerahub_product_created", { detail: newProduct }));

  toast(`"${name}" published to Camera Hub and live on Storefront!`);
  $("#newProductForm").reset();
  updateImagePreview(PRESET_IMAGES[0].url);
  renderSellerInventoryTable();
  updateSellerDashboardMetrics();
});

// Refresh button
$("#refreshSellerDataBtn").addEventListener("click", () => {
  loadProducts();
  loadOrders();
  toast("Seller inventory and orders refreshed");
});

$("#refreshAllBtn").addEventListener("click", () => {
  loadProducts();
  loadOrders();
  toast("All data synchronized with Supabase");
});

$("#scrollToStockBtn").addEventListener("click", () => {
  $("#sellerInventoryTable").scrollIntoView({ behavior: "smooth" });
});

// --- 9. Supabase Realtime & Cross-System Subscriptions ---
function setupRealtimeListeners() {
  if (!db) return;

  try {
    db.channel("seller-realtime-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          loadOrders();
          toast(`⚡ Real-time Order Alert: New checkout received (${formatPHP(payload.new.total_amount)})`);
        } else if (payload.eventType === "UPDATE") {
          const idx = sellerState.orders.findIndex((o) => o.id === payload.new.id);
          if (idx !== -1) {
            sellerState.orders[idx] = payload.new;
            saveLocalOrders();
            renderSellerOrdersTable();
          }
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, (payload) => {
        if (payload.eventType === "UPDATE") {
          const idx = sellerState.products.findIndex((p) => p.id === payload.new.id);
          if (idx !== -1) {
            sellerState.products[idx] = payload.new;
            saveLocalProducts();
            renderSellerInventoryTable();
            updateSellerDashboardMetrics();
          }
        }
      })
      .subscribe();
  } catch (e) {
    console.warn("Realtime setup note:", e);
  }
}

// Cross-system listeners for real-time synchronization with Buyer portal
window.addEventListener("storage", (e) => {
  if (e.key === "camerahub_local_orders") {
    loadOrders();
  }
  if (e.key === "camerahub_local_products") {
    loadProducts();
  }
});

try {
  const syncChannel = new BroadcastChannel("camerahub_sync");
  syncChannel.onmessage = (event) => {
    if (event.data?.type === "NEW_ORDER" || event.data?.type === "ORDER_STATUS_UPDATED") {
      loadOrders();
    }
    if (event.data?.type === "STOCK_UPDATED" || event.data?.type === "PRODUCT_UPDATED") {
      loadProducts();
    }
  };
} catch (e) {}

document.addEventListener("DOMContentLoaded", async () => {
  initPresetPickers();
  const hasSession = await checkStoredSellerSession();
  updateSellerUI();

  if (hasSession) {
    loadProducts();
    loadOrders();
    setupRealtimeListeners();
  }
});
