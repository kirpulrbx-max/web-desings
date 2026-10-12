const ADMIN_PASSWORD = "Maracaibo1234";
const STORAGE_KEY = "off-archive-dept-store-v1";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80";
const starterCategories = ["Ropa", "Relojes", "Zapatillas"];

const starterProducts = [
  { id: "oa-001", name: "Chaqueta Utility", category: "Ropa", price: 128, image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85", tag: "BEST SELLER" },
  { id: "oa-002", name: "Camisa Boxy Poplin", category: "Ropa", price: 74, image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=85", tag: "NUEVO" },
  { id: "oa-003", name: "Pantalón Archive", category: "Ropa", price: 96, image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=85", tag: "SELECCIÓN" },
  { id: "oa-004", name: "Top Essential Rib", category: "Ropa", price: 42, image: "https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=900&q=85", tag: "BEST SELLER" },
  { id: "oa-005", name: "Field Watch 01", category: "Relojes", price: 184, image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=85", tag: "ARCHIVE" },
  { id: "oa-006", name: "Automatic Steel 02", category: "Relojes", price: 288, image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=900&q=85", tag: "NUEVO" },
  { id: "oa-007", name: "Runner Archive 90", category: "Zapatillas", price: 138, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85", tag: "EDICIÓN" },
  { id: "oa-008", name: "Court Low Leather", category: "Zapatillas", price: 112, image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=85", tag: "SELECCIÓN" },
];

const availableSections = ["hero", "clothing", "watches", "sneakers", "promo", "story", "clients"];
const sectionNames = { hero: "Campaña principal", clothing: "Ropa", watches: "Relojes", sneakers: "Zapatillas", promo: "Descuentos", story: "Nuestra historia", clients: "Clientes" };
const widgetDefaults = {
  hero: { kicker: "OFF ARCHIVE DEPT. · DROP 04", title: "Lo que queda es lo que importa.", description: "Prendas encontradas, recuperadas y listas para una nueva historia.", image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1500&q=90" },
  clothing: { kicker: "PIEZAS PARA TODOS LOS DÍAS", title: "Ropa", description: "Capas, básicos y piezas con carácter.", image: "" },
  watches: { kicker: "EL TIEMPO, A TU MANERA", title: "Relojes", description: "Detalles precisos. Diseño que permanece.", image: "" },
  sneakers: { kicker: "PASO PROPIO", title: "Zapatillas", description: "Pares seleccionados para ir más lejos.", image: "" },
  promo: { kicker: "UN DETALLE PARA TU PRIMER PEDIDO", title: "El próximo capítulo va por nuestra cuenta.", description: "10% de descuento en tu primera compra.", image: "" },
  story: { kicker: "MENOS, PERO MEJOR", title: "Las buenas piezas nunca salen de moda.", description: "Off Archive Dept. reúne prendas con carácter y las pone de nuevo en circulación. Una selección pequeña, pensada para llevar mucho.", image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85" },
  clients: { kicker: "NOTAS DEL DEPARTAMENTO", title: "Visto en la calle.", description: "La comunidad Off Archive, desde todos los días.", image: "" },
};
const initialData = {
  products: starterProducts,
  categories: starterCategories.slice(),
  sections: ["hero", "clothing", "watches", "sneakers", "promo", "story", "clients"],
  widgets: structuredClone(widgetDefaults),
  cart: [],
  favorites: [],
  orders: [],
  accounts: [],
  user: null,
  guestEmail: "",
  coupon: "",
  soundEnabled: true,
};

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!stored) return structuredClone(initialData);
    const data = { ...initialData, ...stored, widgets: { ...structuredClone(widgetDefaults), ...stored.widgets } };
    data.categories = starterCategories.map((category, index) => stored.categories?.[index] || category);
    data.sections = (stored.sections || initialData.sections).map((section) => section === "bestsellers" ? "clothing" : section).filter((section, index, sections) => availableSections.includes(section) && sections.indexOf(section) === index);
    ["clothing", "watches", "sneakers"].forEach((section) => { if (!data.sections.includes(section)) data.sections.push(section); });
    data.products = (stored.products || starterProducts).map((product) => ({ ...product, category: data.categories.includes(product.category) ? product.category : data.categories[0] }));
    data.orders = (stored.orders || []).map((order) => ({
      ...order,
      payment: ["Apple Pay", "Dataphone", "Efectivo", "Zelle"].includes(order.payment) ? order.payment : "Efectivo",
      address: order.address && !/,\s*USA$/i.test(order.address) ? "Address needs update, United States" : order.address,
      paymentStatus: ["Pendiente", "Pagado", "Verificado"].includes(order.paymentStatus) ? order.paymentStatus : "Pendiente",
    }));
    return data;
  } catch {
    return structuredClone(initialData);
  }
}

const state = loadData();
let adminUnlocked = false;
let toastTimer;
let audioContext;
const dialog = document.querySelector("#app-dialog");
const authScreen = document.querySelector("#auth-screen");
const shopApp = document.querySelector("#shop-app");

function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { showToast("No se pudo guardar en este navegador."); }
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function money(amount) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount || 0);
}

function showToast(message) {
  playSound("notice");
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2500);
}

function playSound(kind = "tap") {
  if (!state.soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext ||= new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const presets = { tap: [520, .035], success: [740, .12], notice: [610, .045] };
    const [frequency, duration] = presets[kind] || presets.tap;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    if (kind === "success") oscillator.frequency.exponentialRampToValueAtTime(990, now + duration);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "tap" ? .018 : .025, now + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + duration + .01);
  } catch {
    // Audio is optional and may be blocked by browser policies.
  }
}

function openDialog(content, drawer = false) {
  if (dialog.open) dialog.close();
  dialog.classList.toggle("drawer", drawer);
  dialog.innerHTML = content;
  dialog.showModal();
}

function closeDialog() {
  if (dialog.open) dialog.close();
}

function enterStore() {
  authScreen.classList.add("is-hidden");
  shopApp.classList.remove("is-hidden");
  renderStore();
}

function enterAuth() {
  closeDialog();
  shopApp.classList.add("is-hidden");
  authScreen.classList.remove("is-hidden");
  state.user = null;
  saveData();
  setAuthMode("login");
}

function setAuthMode(mode) {
  const isRegister = mode === "register";
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    const active = button.dataset.authMode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelector("#login-form").classList.toggle("is-hidden", isRegister);
  document.querySelector("#register-form").classList.toggle("is-hidden", !isRegister);
  document.querySelector("#auth-kicker").textContent = isRegister ? "ÚNETE AL DEPARTAMENTO" : "BIENVENIDO DE VUELTA";
  document.querySelector("#auth-title").innerHTML = isRegister ? "Una cuenta.<br />Más hallazgos." : "Entra a tu<br />espacio.";
  document.querySelector("#auth-description").textContent = isRegister ? "Guarda tus favoritos y sigue cada pedido." : "Tu próximo hallazgo está a un paso.";
  document.querySelector("#auth-feedback").textContent = "";
  document.querySelector("#auth-create-link").classList.add("is-hidden");
}

async function passwordDigest(password) {
  const bytes = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function productCard(product) {
  const favorite = state.favorites.includes(product.id);
  const image = escapeHTML(product.image || FALLBACK_IMAGE);
  return `<article class="product-card">
    <div class="product-photo"><img src="${image}" alt="${escapeHTML(product.name)}" loading="lazy" />
      <span class="product-tag">${escapeHTML(product.tag || product.category)}</span>
      <button class="product-favorite${favorite ? " is-favorite" : ""}" type="button" data-favorite="${escapeHTML(product.id)}" aria-label="${favorite ? "Quitar de favoritos" : "Añadir a favoritos"}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 8.8c0 5-8.8 11-8.8 11s-8.8-6-8.8-11a4.6 4.6 0 0 1 8.8-1.7 4.6 4.6 0 0 1 8.8 1.7Z"></path></svg></button>
    </div><div class="product-info"><div><h3>${escapeHTML(product.name)}</h3><p>${escapeHTML(product.category)}</p></div><span class="product-price">${money(product.price)}</span></div>
    <button class="product-add" type="button" data-add="${escapeHTML(product.id)}"><span>Añadir al carrito</span><span aria-hidden="true">+</span></button>
  </article>`;
}

function renderSection(section) {
  const widget = { ...widgetDefaults[section], ...(state.widgets?.[section] || {}) };
  const title = escapeHTML(widget.title);
  const description = escapeHTML(widget.description);
  const kicker = escapeHTML(widget.kicker);
  switch (section) {
    case "hero": return `<section class="hero-section" id="top"><div class="hero-copy"><p class="eyebrow">${kicker}</p><h1>${title}</h1><p>${description}</p><a class="button button-dark button-arrow" href="#catalog">Ver catálogo <span aria-hidden="true">↗</span></a></div><div class="hero-image"><img src="${escapeHTML(widget.image || FALLBACK_IMAGE)}" alt="Modelo con estilismo urbano de temporada" fetchpriority="high" /><span class="hero-caption">NEW YORK · NEW SEASON</span></div></section>`;
    case "clothing":
    case "watches":
    case "sneakers": {
      const categoryIndex = ["clothing", "watches", "sneakers"].indexOf(section);
      const category = state.categories[categoryIndex] || sectionNames[section];
      const categoryTitle = widget.title === widgetDefaults[section].title ? category : title;
      const products = state.products.filter((product) => product.category === category).slice(0, 4);
      return `<section class="section-wrap category-section" id="${section === "clothing" ? "catalog" : section}"><div class="section-heading"><div><p class="eyebrow">${kicker}</p><h2>${escapeHTML(categoryTitle)}</h2><p class="category-description">${description}</p></div><a href="#${section}" data-action="category-products" data-category="${escapeHTML(category)}">VER TODO <span aria-hidden="true">↗</span></a></div>${widget.image ? `<div class="category-cover" style="background-image:url('${escapeHTML(widget.image)}')"></div>` : ""}<div class="product-grid">${products.map(productCard).join("") || `<p class="empty-state">No items in ${escapeHTML(category)} yet.</p>`}</div></section>`;
    }
    case "promo": return `<section class="promo-section" id="offers"><div class="promo-copy"><p class="eyebrow">${kicker}</p><h2>${title}</h2><p class="promo-description">${description}</p>${widget.image ? `<img class="promo-image" src="${escapeHTML(widget.image)}" alt="Imagen promocional" loading="lazy" />` : ""}</div><div class="promo-code"><span>10% DE DESCUENTO</span><strong>ARCHIVE10</strong><button class="small-action" type="button" data-action="copy-coupon">COPIAR CÓDIGO</button></div></section>`;
    case "story": return `<section class="editorial-section" id="about"><div class="editorial-image" role="img" aria-label="Retrato editorial de moda urbana" style="background-image:url('${escapeHTML(widget.image || FALLBACK_IMAGE)}')"></div><div class="editorial-copy"><p class="eyebrow">${kicker}</p><h2>${title}</h2><p>${description}</p><a class="text-link" href="#contact">CONOCE EL DEPARTAMENTO ↗</a></div></section>`;
    case "clients": return `<section class="clients-section" id="clients"><div class="section-heading"><div><p class="eyebrow">${kicker}</p><h2>${title}</h2><p class="category-description">${description}</p></div><span class="eyebrow">UNITED STATES · 2026</span></div>${widget.image ? `<img class="clients-cover" src="${escapeHTML(widget.image)}" alt="Community editorial" loading="lazy" />` : ""}<div class="quote-row"><div class="quote"><p>“Piezas que se sienten encontradas, no fabricadas en serie.”</p><span>VALENTINA R. · CLIENTA</span></div><div class="quote"><p>“La chaqueta llegó impecable. Ya es parte de mi rotación.”</p><span>ANDRÉS M. · CLIENTE</span></div><div class="quote"><p>“Por fin una tienda que entiende que repetir es el punto.”</p><span>SOFÍA L. · CLIENTA</span></div></div></section>`;
    default: return "";
  }
}

function renderStore() {
  document.querySelector("#home-sections").innerHTML = state.sections.map(renderSection).join("");
  const quantity = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCount = document.querySelector("#cart-count");
  cartCount.textContent = quantity;
  cartCount.classList.toggle("is-hidden", quantity === 0);
  const favorites = document.querySelector("#favorite-count");
  favorites.textContent = state.favorites.length;
  favorites.classList.toggle("is-hidden", state.favorites.length === 0);
}

function addToCart(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return;
  const existing = state.cart.find((item) => item.productId === productId);
  if (existing) existing.quantity += 1;
  else state.cart.push({ productId, quantity: 1 });
  saveData();
  renderStore();
  showToast(`${product.name} añadido al carrito.`);
}

function toggleFavorite(productId) {
  playSound("tap");
  state.favorites = state.favorites.includes(productId) ? state.favorites.filter((id) => id !== productId) : [...state.favorites, productId];
  saveData();
  renderStore();
}

function cartTotals() {
  const subtotal = state.cart.reduce((sum, item) => {
    const product = state.products.find((productItem) => productItem.id === item.productId);
    return sum + (product ? product.price * item.quantity : 0);
  }, 0);
  const discountRate = state.coupon === "ARCHIVE10" ? .1 : state.coupon === "OFF15" && subtotal >= 80 ? .15 : 0;
  const discount = Math.round(subtotal * discountRate);
  const shipping = subtotal > 0 && subtotal < 120 ? 8 : 0;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}

function cartMarkup() {
  const items = state.cart.map((item) => {
    const product = state.products.find((productItem) => productItem.id === item.productId);
    if (!product) return "";
    return `<div class="cart-row"><img src="${escapeHTML(product.image || FALLBACK_IMAGE)}" alt="" /><div><h3>${escapeHTML(product.name)}</h3><p>${money(product.price)} · ${escapeHTML(product.category)}</p><div class="quantity-tools"><button type="button" data-cart-qty="${escapeHTML(product.id)}" data-change="-1" aria-label="Quitar una unidad">−</button><span>${item.quantity}</span><button type="button" data-cart-qty="${escapeHTML(product.id)}" data-change="1" aria-label="Añadir una unidad">+</button></div></div><div class="cart-row-price"><span>${money(product.price * item.quantity)}</span><button class="remove-link" type="button" data-remove-cart="${escapeHTML(product.id)}">Quitar</button></div></div>`;
  }).join("");
  const totals = cartTotals();
  return `<div class="dialog-inner"><div class="dialog-header"><div><p class="eyebrow">OFF ARCHIVE DEPT.</p><h2>Tu carrito <span>(${state.cart.reduce((sum, item) => sum + item.quantity, 0)})</span></h2></div><button class="close-button" type="button" data-action="close" aria-label="Cerrar">×</button></div>
    <div class="dialog-body">${items || `<div class="empty-state">Todavía no hay piezas aquí.<br />Encuentra tu próximo hallazgo en el catálogo.</div>`}
    ${state.cart.length ? `<div class="coupon-row"><input id="coupon-input" value="${escapeHTML(state.coupon)}" placeholder="Código promocional" aria-label="Código promocional" /><button type="button" data-action="apply-coupon">Aplicar</button></div><p class="coupon-note" id="coupon-note">${state.coupon ? `Código ${escapeHTML(state.coupon)} aplicado si cumple sus condiciones.` : "Prueba ARCHIVE10 para obtener 10% de descuento."}</p>
    <div class="totals"><div class="total-row"><span>Subtotal</span><span>${money(totals.subtotal)}</span></div>${totals.discount ? `<div class="total-row"><span>Descuento</span><span>−${money(totals.discount)}</span></div>` : ""}<div class="total-row"><span>Envío</span><span>${totals.shipping ? money(totals.shipping) : "Gratis"}</span></div><div class="total-row final"><span>Total</span><span>${money(totals.total)}</span></div></div><button class="button button-dark full-button" type="button" data-action="checkout">Continuar al delivery <span>↗</span></button>` : ""}</div></div>`;
}

function openCart() {
  openDialog(cartMarkup(), true);
}

function openFavorites() {
  const products = state.favorites.map((id) => state.products.find((product) => product.id === id)).filter(Boolean);
  openDialog(`<div class="dialog-inner"><div class="dialog-header"><div><p class="eyebrow">PIEZAS GUARDADAS</p><h2>Tus favoritos</h2></div><button class="close-button" type="button" data-action="close" aria-label="Cerrar">×</button></div><div class="dialog-body">${products.length ? `<div class="product-grid">${products.map(productCard).join("")}</div>` : `<div class="empty-state">Aún no has guardado ninguna pieza.<br />Usa el corazón para reunir tus favoritos.</div>`}</div></div>`);
}

function accountMarkup() {
  const user = state.user;
  if (!user) return `<div class="dialog-inner"><div class="dialog-header"><div><p class="eyebrow">OFF ARCHIVE DEPT.</p><h2>Tu cuenta</h2></div><button class="close-button" type="button" data-action="close" aria-label="Cerrar">×</button></div><div class="dialog-body"><div class="empty-state">Inicia sesión para guardar tus pedidos y acceder al delivery.</div><div class="account-actions"><button class="button button-dark" type="button" data-action="login">Iniciar sesión / Crear cuenta <span>↗</span></button></div></div></div>`;
  return `<div class="dialog-inner"><div class="dialog-header"><div><p class="eyebrow">OFF ARCHIVE DEPT.</p><h2>Tu cuenta</h2></div><button class="close-button" type="button" data-action="close" aria-label="Cerrar">×</button></div><div class="dialog-body"><div class="account-meta"><strong>${escapeHTML(user.name || "Miembro Off Archive")}</strong><br />${escapeHTML(user.email)}</div><div class="account-actions"><button class="button button-outline" type="button" data-action="delivery">Modo delivery <span>→</span></button>${adminUnlocked ? `<button class="button button-dark" type="button" data-action="admin">Panel administrador <span>↗</span></button>` : `<form id="admin-unlock-form" class="form-stack"><p class="eyebrow">ACCESO DE ADMINISTRADOR</p><label>Contraseña adicional<input class="field-input" type="password" name="adminPassword" placeholder="Contraseña de administrador" required /></label><button class="button button-dark" type="submit">Desbloquear panel <span>↗</span></button><p class="field-hint-text" id="admin-feedback" role="status"></p></form>`}<button class="button button-outline" type="button" data-action="logout">Cerrar sesión <span>↗</span></button></div></div></div>`;
}

function openAccount() {
  openDialog(accountMarkup());
}

function customerOrders() {
  if (state.user) {
    return state.orders.filter((order) => order.accountEmail === state.user.email || (!order.accountEmail && order.email === state.user.email));
  }
  return state.guestEmail ? state.orders.filter((order) => order.email === state.guestEmail && !order.accountEmail) : [];
}

function deliveryMarkup() {
  const orders = state.orders;
  const list = orders.map((order) => `<article class="order-card"><div class="order-card-head"><strong>ORDER ${escapeHTML(order.id)}</strong><span>${money(order.total)}</span></div><p>${escapeHTML(order.customerName || order.email)} · ${escapeHTML(order.email)}<br />${escapeHTML(order.address)}${order.coordinates ? `<br />Location: ${escapeHTML(order.coordinates)}` : ""}<br />Payment: ${escapeHTML(order.payment)} · Status: <span class="order-status">${escapeHTML(order.paymentStatus)}</span></p><p>${order.items.map((item) => `${escapeHTML(item.name)} × ${item.quantity}`).join(" · ")}</p><div class="order-actions"><span class="order-status">Delivery: ${escapeHTML(order.deliveryStatus || "Preparing")}</span>${order.paymentStatus === "Pendiente" ? `<button class="small-action" type="button" data-mark-paid="${escapeHTML(order.id)}">Mark paid</button>` : ""}${order.paymentStatus === "Pagado" ? `<button class="small-action" type="button" data-mark-verified="${escapeHTML(order.id)}">Verify payment</button>` : ""}${order.deliveryStatus !== "En ruta" ? `<button class="small-action" type="button" data-mark-delivery="${escapeHTML(order.id)}" data-status="En ruta">Mark en route</button>` : ""}${order.deliveryStatus !== "Entregado" ? `<button class="small-action" type="button" data-mark-delivery="${escapeHTML(order.id)}" data-status="Entregado">Mark delivered</button>` : ""}</div></article>`).join("");
  return `<div class="dialog-inner"><div class="dialog-header"><div><p class="eyebrow">ORDERS · PAYMENTS · DELIVERY</p><h2>Delivery control</h2></div><button class="close-button" type="button" data-action="close" aria-label="Close">×</button></div><div class="dialog-body">${list || `<div class="empty-state">No orders have been placed yet.</div>`}</div></div>`;
}

function openDelivery() {
  if (!adminUnlocked) return requestDeliveryAccess();
  openDialog(deliveryMarkup(), true);
}

function requestDeliveryAccess() {
  if (adminUnlocked) return openDelivery();
  openDialog(`<div class="dialog-inner"><div class="dialog-header"><div><p class="eyebrow">ACCESO RESTRINGIDO</p><h2>Modo delivery</h2></div><button class="close-button" type="button" data-action="close" aria-label="Cerrar">×</button></div><div class="dialog-body"><form id="delivery-unlock-form" class="form-stack"><p class="field-hint-text">Ingresa la contraseña de administrador para consultar pedidos, pagos y ubicaciones de entrega.</p><label>Contraseña<input class="field-input" type="password" name="adminPassword" autocomplete="current-password" required /></label><button class="button button-dark full-button" type="submit">Desbloquear delivery <span>↗</span></button><p class="field-hint-text" id="delivery-feedback" role="status"></p></form></div></div>`);
}

function checkoutMarkup() {
  const user = state.user;
  const paymentMethods = [{ id: "apple-pay", label: "Apple Pay", icon: "Pay", detail: "Pago digital" }, { id: "dataphone", label: "Dataphone", icon: "▰", detail: "Tarjeta en entrega" }, { id: "cash", label: "Efectivo", icon: "$", detail: "Paga al recibir" }, { id: "zelle", label: "Zelle", icon: "Z", detail: "Pago digital" }];
  const states = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];
  return `<div class="dialog-inner"><div class="dialog-header"><div><p class="eyebrow">UNITED STATES · USD</p><h2>Datos de entrega</h2></div><button class="close-button" type="button" data-action="close" aria-label="Cerrar">×</button></div><div class="dialog-body"><form class="form-stack" id="checkout-form"><label>Nombre de quien recibe<input class="field-input" name="customerName" value="${escapeHTML(user?.name || "")}" autocomplete="name" required /></label><label>Correo electrónico<input class="field-input" name="email" type="email" value="${escapeHTML(user?.email || "")}" placeholder="name@gmail.com" required /></label><label>Teléfono<input class="field-input" name="phone" type="tel" placeholder="+1 (212) 555-0100" autocomplete="tel" pattern="[+0-9() .-]{7,20}" required /></label><label>Dirección<input class="field-input" name="street" autocomplete="street-address" placeholder="Street address, apartment or suite" required /></label><div class="address-grid"><label>City<input class="field-input" name="city" autocomplete="address-level2" required /></label><label>State<select class="field-select" name="region" autocomplete="address-level1" required><option value="">Select state</option>${states.map((stateName) => `<option>${stateName}</option>`).join("")}</select></label></div><label>ZIP code<input class="field-input" name="postalCode" autocomplete="postal-code" inputmode="numeric" pattern="[0-9]{5}(-[0-9]{4})?" placeholder="10001" required /></label><button class="geo-button" type="button" data-action="geolocate">Use my current location</button><p class="field-hint-text" id="location-note">Location is used only to coordinate this delivery.</p><input type="hidden" name="coordinates" /><fieldset class="payment-fieldset"><legend>Choose a payment method</legend><div class="payment-method-grid">${paymentMethods.map((method) => `<label class="payment-method"><input type="radio" name="payment" value="${method.label}" required /><span class="payment-method-icon">${method.icon}</span><span><strong>${method.label}</strong><small>${method.detail}</small></span><span class="payment-check" aria-hidden="true"></span></label>`).join("")}</div></fieldset><div class="notice-block">Order total: <strong>${money(cartTotals().total)}</strong>. Payment status will be Pending until confirmed.</div><button class="button button-dark full-button" type="submit">Place order <span>↗</span></button></form></div></div>`;
}

function openCheckout() {
  if (!state.cart.length) return showToast("Add an item before checking out.");
  openDialog(checkoutMarkup());
}

function searchMarkup(query = "") {
  const matching = state.products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase()));
  return `<div class="dialog-inner"><div class="dialog-header"><div><p class="eyebrow">ENCUENTRA TU PIEZA</p><h2>Buscar</h2></div><button class="close-button" type="button" data-action="close" aria-label="Cerrar">×</button></div><div class="dialog-body"><input class="field-input" id="search-input" type="search" value="${escapeHTML(query)}" placeholder="Nombre o categoría" aria-label="Buscar productos" /><div class="product-grid search-results" id="search-results" style="margin-top:18px">${matching.map(productCard).join("")}</div>${matching.length ? "" : `<div class="empty-state">No encontramos piezas con ese término.</div>`}</div></div>`;
}

function openSearch() {
  openDialog(searchMarkup());
  document.querySelector("#search-input")?.focus();
}

function openAdmin(tab = "products") {
  if (!adminUnlocked) return openAccount();
  openDialog(`<div class="dialog-inner"><div class="dialog-header"><div><p class="eyebrow">GESTIÓN OFF ARCHIVE</p><h2>Administración</h2></div><button class="close-button" type="button" data-action="close" aria-label="Cerrar">×</button></div><div class="admin-tabs"><button type="button" data-admin-tab="products" class="${tab === "products" ? "is-active" : ""}">Productos</button><button type="button" data-admin-tab="sections" class="${tab === "sections" ? "is-active" : ""}">Widgets</button><button type="button" data-admin-tab="categories" class="${tab === "categories" ? "is-active" : ""}">Categorías</button><button type="button" data-admin-tab="orders" class="${tab === "orders" ? "is-active" : ""}">Pedidos</button></div><div class="admin-content" id="admin-content">${adminContent(tab)}</div></div>`);
}

function adminContent(tab) {
  if (tab === "products") return `<form class="form-stack" id="product-form"><p class="eyebrow">AÑADIR PRODUCTO</p><label>Nombre<input class="field-input" name="name" required /></label><label>Precio (USD)<input class="field-input" name="price" type="number" min="1" step="1" required /></label><label>Categoría<select class="field-select" name="category" required>${state.categories.map((category) => `<option>${escapeHTML(category)}</option>`).join("")}</select></label><label>Imagen (URL)<input class="field-input" name="image" type="url" placeholder="https://…" required /></label><button class="button button-dark full-button" type="submit">Añadir al catálogo <span>+</span></button></form><div style="margin-top:24px"><p class="eyebrow">CATÁLOGO ACTUAL · ${state.products.length}</p>${state.categories.map((category) => `<div class="category-admin-group"><p class="eyebrow">${escapeHTML(category)}</p>${state.products.filter((product) => product.category === category).map((product) => `<div class="admin-product-row"><div><strong>${escapeHTML(product.name)}</strong><small>${escapeHTML(product.category)} · ${money(product.price)}</small></div><button class="small-action" type="button" data-edit-product="${escapeHTML(product.id)}">Editar</button><button class="small-action danger-action" type="button" data-delete-product="${escapeHTML(product.id)}">Eliminar</button></div>`).join("")}</div>`).join("")}</div>`;
  if (tab === "sections") {
    const available = availableSections.filter((section) => !state.sections.includes(section));
    return `<p class="field-hint-text">Edita textos e imágenes de cada widget; los cambios se reflejan en el home.</p><div>${state.sections.map((section, index) => `<div class="widget-row"><div><strong>${String(index + 1).padStart(2, "0")} · ${escapeHTML(sectionNames[section])}</strong><small>Contenido de inicio editable</small></div><button class="small-action" type="button" data-edit-widget="${escapeHTML(section)}">Editar</button><button class="small-action danger-action" type="button" data-remove-section="${escapeHTML(section)}">Quitar</button></div>`).join("") || `<div class="empty-state">No hay secciones activas.</div>`}</div>${available.length ? `<form class="form-stack" id="section-form" style="margin-top:20px"><label>Añadir widget<select class="field-select" name="section">${available.map((section) => `<option value="${section}">${escapeHTML(sectionNames[section])}</option>`).join("")}</select></label><button class="button button-dark full-button" type="submit">Añadir widget <span>+</span></button></form>` : `<p class="field-hint-text" style="margin-top:15px">Todos los widgets están activos.</p>`}`;
  }
  if (tab === "categories") return `<p class="field-hint-text">Cambia el nombre de las tres categorías principales. Los productos y widgets asociados se actualizan juntos.</p><form class="form-stack" id="categories-form">${state.categories.map((category, index) => `<label>Categoría ${index + 1}<input class="field-input" name="category-${index}" value="${escapeHTML(category)}" required /></label>`).join("")}<button class="button button-dark full-button" type="submit">Guardar categorías <span>↗</span></button></form>`;
  return state.orders.length ? state.orders.map((order) => `<article class="order-card"><div class="order-card-head"><strong>PEDIDO ${escapeHTML(order.id)}</strong><span>${money(order.total)}</span></div><p>${escapeHTML(order.email)} · ${escapeHTML(order.payment)}<br />${escapeHTML(order.address)}${order.coordinates ? `<br />GPS: ${escapeHTML(order.coordinates)}` : ""}</p><div class="order-actions"><span class="order-status">Pago: ${escapeHTML(order.paymentStatus)}</span><span class="order-status">Entrega: ${escapeHTML(order.deliveryStatus)}</span></div><div class="order-actions">${order.paymentStatus === "Pendiente" ? `<button class="small-action" type="button" data-set-payment="${escapeHTML(order.id)}" data-status="Pagado">Marcar pagado</button>` : ""}${order.paymentStatus === "Pagado" ? `<button class="small-action" type="button" data-set-payment="${escapeHTML(order.id)}" data-status="Verificado">Verificar pago</button>` : ""}${order.deliveryStatus !== "En ruta" ? `<button class="small-action" type="button" data-set-delivery="${escapeHTML(order.id)}" data-status="En ruta">Marcar en ruta</button>` : ""}${order.deliveryStatus !== "Entregado" ? `<button class="small-action" type="button" data-set-delivery="${escapeHTML(order.id)}" data-status="Entregado">Marcar entregado</button>` : ""}</div></article>`).join("") : `<div class="empty-state">Aún no hay pedidos registrados.</div>`;
}

function widgetEditorMarkup(section) {
  const widget = { ...widgetDefaults[section], ...(state.widgets[section] || {}) };
  return `<div class="dialog-inner"><div class="dialog-header"><div><p class="eyebrow">EDITOR DE WIDGET</p><h2>${escapeHTML(sectionNames[section])}</h2></div><button class="close-button" type="button" data-action="close" aria-label="Cerrar">×</button></div><div class="dialog-body"><form id="widget-form" class="form-stack" data-widget="${escapeHTML(section)}"><label>Eyebrow / etiqueta<input class="field-input" name="kicker" value="${escapeHTML(widget.kicker)}" required /></label><label>Título<textarea class="field-textarea" name="title" required>${escapeHTML(widget.title)}</textarea></label><label>Descripción<textarea class="field-textarea" name="description">${escapeHTML(widget.description)}</textarea></label><label>Imagen (URL)<input class="field-input" type="url" name="image" value="${escapeHTML(widget.image)}" placeholder="https://…" /></label><button class="button button-dark full-button" type="submit">Guardar cambios <span>↗</span></button></form></div></div>`;
}

function editProductMarkup(productId) {
  const product = state.products.find((item) => item.id === productId);
  if (!product) return "";
  return `<div class="dialog-inner"><div class="dialog-header"><div><p class="eyebrow">CATÁLOGO</p><h2>Editar producto</h2></div><button class="close-button" type="button" data-action="close" aria-label="Cerrar">×</button></div><div class="dialog-body"><form id="edit-product-form" class="form-stack" data-product="${escapeHTML(product.id)}"><label>Nombre<input class="field-input" name="name" value="${escapeHTML(product.name)}" required /></label><label>Precio (USD)<input class="field-input" name="price" type="number" min="1" step="1" value="${product.price}" required /></label><label>Categoría<select class="field-select" name="category">${state.categories.map((category) => `<option ${category === product.category ? "selected" : ""}>${escapeHTML(category)}</option>`).join("")}</select></label><label>Imagen (URL)<input class="field-input" name="image" type="url" value="${escapeHTML(product.image)}" required /></label><button class="button button-dark full-button" type="submit">Guardar producto <span>↗</span></button></form></div></div>`;
}

function refreshAdmin(tab) {
  const content = document.querySelector("#admin-content");
  if (content) content.innerHTML = adminContent(tab);
  document.querySelectorAll("[data-admin-tab]").forEach((button) => button.classList.toggle("is-active", button.dataset.adminTab === tab));
}

document.querySelectorAll("[data-auth-mode]").forEach((button) => button.addEventListener("click", () => setAuthMode(button.dataset.authMode)));

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = String(form.get("email")).trim().toLowerCase();
  try {
    const digest = await passwordDigest(String(form.get("password")));
    const account = state.accounts.find((item) => item.email === email);
    if (!account) {
      document.querySelector("#auth-feedback").textContent = "No encontramos una cuenta con ese correo. Si es tu primera vez, crea una cuenta.";
      const createLink = document.querySelector("#auth-create-link");
      createLink.dataset.email = email;
      createLink.classList.remove("is-hidden");
      return;
    }
    if (account.passwordHash !== digest) {
      document.querySelector("#auth-feedback").textContent = "La contraseña no coincide. Revisa e inténtalo de nuevo.";
      return;
    }
    state.user = { name: account.name, email: account.email };
    saveData();
    enterStore();
  } catch {
    document.querySelector("#auth-feedback").textContent = "Este navegador no admite el acceso seguro de demostración.";
  }
});

document.querySelector("#register-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = String(form.get("email")).trim().toLowerCase();
  if (!email.endsWith("@gmail.com")) {
    document.querySelector("#auth-feedback").textContent = "Usa una dirección Gmail para crear tu cuenta.";
    return;
  }
  if (state.accounts.some((account) => account.email === email)) {
    document.querySelector("#auth-feedback").textContent = "Ya existe una cuenta con ese correo.";
    return;
  }
  try {
    const account = { name: String(form.get("name")).trim(), email, passwordHash: await passwordDigest(String(form.get("password"))) };
    state.accounts.push(account);
    state.user = { name: account.name, email: account.email };
    saveData();
    enterStore();
  } catch {
    document.querySelector("#auth-feedback").textContent = "No se pudo crear la cuenta en este navegador.";
  }
});

document.querySelector("#guest-button").addEventListener("click", () => {
  state.user = null;
  saveData();
  enterStore();
});

document.querySelectorAll("[data-social]").forEach((button) => button.addEventListener("click", () => {
  const provider = button.dataset.social;
  state.user = { name: `Cuenta ${provider}`, email: `demo.${provider.toLowerCase()}@gmail.com`, demoProvider: provider };
  saveData();
  enterStore();
  showToast(`Acceso de demostración con ${provider}. OAuth real no está configurado.`);
}));

document.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    const action = actionButton.dataset.action;
    playSound("tap");
    if (action === "cart") openCart();
    if (action === "favorites") openFavorites();
    if (action === "account") openAccount();
    if (action === "delivery") requestDeliveryAccess();
    if (action === "search") openSearch();
    if (action === "admin") openAdmin();
    if (action === "close") closeDialog();
    if (action === "login") enterAuth();
    if (action === "logout") { adminUnlocked = false; enterAuth(); }
    if (action === "checkout") openCheckout();
    if (action === "apply-coupon") applyCoupon();
    if (action === "copy-coupon") navigator.clipboard?.writeText("ARCHIVE10").then(() => showToast("Código ARCHIVE10 copiado.")).catch(() => showToast("Usa el código ARCHIVE10 en tu carrito."));
    if (action === "geolocate") locateCustomer();
    if (action === "menu") document.querySelector(".main-nav").classList.toggle("is-open");
    if (action === "all-products") { event.preventDefault(); showAllProducts(); }
    if (action === "category-products") { event.preventDefault(); showAllProducts(actionButton.dataset.category); }
    if (action === "sound") {
      state.soundEnabled = !state.soundEnabled;
      actionButton.setAttribute("aria-label", state.soundEnabled ? "Desactivar sonidos" : "Activar sonidos");
      actionButton.title = state.soundEnabled ? "Sonidos activados" : "Sonidos desactivados";
      saveData();
      if (state.soundEnabled) playSound("success");
    }
  }

  const addButton = event.target.closest("[data-add]");
  if (addButton) addToCart(addButton.dataset.add);
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) toggleFavorite(favoriteButton.dataset.favorite);
  const qtyButton = event.target.closest("[data-cart-qty]");
  if (qtyButton) changeQuantity(qtyButton.dataset.cartQty, Number(qtyButton.dataset.change));
  const removeButton = event.target.closest("[data-remove-cart]");
  if (removeButton) { state.cart = state.cart.filter((item) => item.productId !== removeButton.dataset.removeCart); saveData(); openCart(); renderStore(); }
  const payButton = event.target.closest("[data-mark-paid]");
  if (payButton && adminUnlocked) updateOrder(payButton.dataset.markPaid, "paymentStatus", "Pagado", "delivery");
  const verifyButton = event.target.closest("[data-mark-verified]");
  if (verifyButton && adminUnlocked) updateOrder(verifyButton.dataset.markVerified, "paymentStatus", "Verificado", "delivery");
  const deliveryStatusButton = event.target.closest("[data-mark-delivery]");
  if (deliveryStatusButton && adminUnlocked) updateOrder(deliveryStatusButton.dataset.markDelivery, "deliveryStatus", deliveryStatusButton.dataset.status, "delivery");
  const paymentButton = event.target.closest("[data-set-payment]");
  if (paymentButton && adminUnlocked) updateOrder(paymentButton.dataset.setPayment, "paymentStatus", paymentButton.dataset.status, "orders");
  const deliveryButton = event.target.closest("[data-set-delivery]");
  if (deliveryButton && adminUnlocked) updateOrder(deliveryButton.dataset.setDelivery, "deliveryStatus", deliveryButton.dataset.status, "orders");
  const deleteButton = event.target.closest("[data-delete-product]");
  if (deleteButton && adminUnlocked) {
    state.products = state.products.filter((product) => product.id !== deleteButton.dataset.deleteProduct);
    state.cart = state.cart.filter((item) => item.productId !== deleteButton.dataset.deleteProduct);
    state.favorites = state.favorites.filter((id) => id !== deleteButton.dataset.deleteProduct);
    saveData(); renderStore(); refreshAdmin("products");
  }
  const editProduct = event.target.closest("[data-edit-product]");
  if (editProduct && adminUnlocked) openDialog(editProductMarkup(editProduct.dataset.editProduct));
  const editWidget = event.target.closest("[data-edit-widget]");
  if (editWidget && adminUnlocked) openDialog(widgetEditorMarkup(editWidget.dataset.editWidget));
  const removeSection = event.target.closest("[data-remove-section]");
  if (removeSection && adminUnlocked) { state.sections = state.sections.filter((section) => section !== removeSection.dataset.removeSection); saveData(); renderStore(); refreshAdmin("sections"); }
  const adminTab = event.target.closest("[data-admin-tab]");
  if (adminTab && adminUnlocked) refreshAdmin(adminTab.dataset.adminTab);
  if (event.target === dialog) closeDialog();
});

dialog.addEventListener("input", (event) => {
  if (event.target.id !== "search-input") return;
  const results = document.querySelector("#search-results");
  const matching = state.products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(event.target.value.toLowerCase()));
  results.innerHTML = matching.map(productCard).join("") || `<p class="empty-state">No encontramos piezas con ese término.</p>`;
});

dialog.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  if (form.id === "admin-unlock-form") {
    const value = new FormData(form).get("adminPassword");
    if (value !== ADMIN_PASSWORD) {
      document.querySelector("#admin-feedback").textContent = "Contraseña incorrecta.";
      return;
    }
    adminUnlocked = true;
    openAdmin();
  }
  if (form.id === "delivery-unlock-form") {
    const value = new FormData(form).get("adminPassword");
    if (value !== ADMIN_PASSWORD) {
      document.querySelector("#delivery-feedback").textContent = "Incorrect password.";
      return;
    }
    adminUnlocked = true;
    openDelivery();
  }
  if (form.id === "checkout-form") submitOrder(form);
  if (form.id === "product-form" && adminUnlocked) {
    const values = new FormData(form);
    const product = { id: `oa-${Date.now()}`, name: String(values.get("name")).trim(), price: Number(values.get("price")), category: String(values.get("category")).trim(), image: String(values.get("image")).trim() || FALLBACK_IMAGE, tag: "NEW" };
    if (!product.name || !state.categories.includes(product.category) || product.price <= 0) return;
    state.products.unshift(product); saveData(); renderStore(); refreshAdmin("products"); showToast("Producto añadido al catálogo.");
  }
  if (form.id === "section-form" && adminUnlocked) {
    const section = new FormData(form).get("section");
    if (availableSections.includes(section) && !state.sections.includes(section)) state.sections.push(section);
    saveData(); renderStore(); refreshAdmin("sections"); showToast("Sección añadida a la página principal.");
  }
  if (form.id === "widget-form" && adminUnlocked) {
    const section = form.dataset.widget;
    const values = new FormData(form);
    state.widgets[section] = { ...state.widgets[section], kicker: String(values.get("kicker")).trim(), title: String(values.get("title")).trim(), description: String(values.get("description")).trim(), image: String(values.get("image") || "").trim() };
    saveData(); renderStore(); openAdmin("sections"); showToast("Widget updated.");
  }
  if (form.id === "edit-product-form" && adminUnlocked) {
    const product = state.products.find((item) => item.id === form.dataset.product);
    const values = new FormData(form);
    if (product) Object.assign(product, { name: String(values.get("name")).trim(), price: Number(values.get("price")), category: String(values.get("category")), image: String(values.get("image")).trim() });
    saveData(); renderStore(); openAdmin("products"); showToast("Product updated.");
  }
  if (form.id === "categories-form" && adminUnlocked) {
    const values = new FormData(form);
    const oldCategories = state.categories.slice();
    state.categories = oldCategories.map((_, index) => String(values.get(`category-${index}`)).trim());
    if (state.categories.some((category) => !category) || new Set(state.categories.map((category) => category.toLowerCase())).size !== state.categories.length) {
      state.categories = oldCategories;
      return showToast("Category names must be unique.");
    }
    state.products.forEach((product) => { const index = oldCategories.indexOf(product.category); if (index >= 0) product.category = state.categories[index]; });
    saveData(); renderStore(); refreshAdmin("categories"); showToast("Categories updated.");
  }
});

function changeQuantity(productId, change) {
  const item = state.cart.find((cartItem) => cartItem.productId === productId);
  if (!item) return;
  item.quantity += change;
  if (item.quantity <= 0) state.cart = state.cart.filter((cartItem) => cartItem.productId !== productId);
  saveData(); openCart(); renderStore();
}

function applyCoupon() {
  const input = document.querySelector("#coupon-input");
  const code = input.value.trim().toUpperCase();
  const subtotal = cartTotals().subtotal;
  if (code === "ARCHIVE10" || (code === "OFF15" && subtotal >= 80)) {
    state.coupon = code; saveData(); openCart(); showToast(`Descuento ${code} aplicado.`);
  } else {
    document.querySelector("#coupon-note").textContent = code === "OFF15" ? "OFF15 requiere una compra mínima de $80." : "Código no válido. Prueba ARCHIVE10.";
    document.querySelector("#coupon-note").style.color = "#a34237";
  }
}

function locateCustomer() {
  const note = document.querySelector("#location-note");
  if (!navigator.geolocation) { note.textContent = "This browser does not support location services."; return; }
  note.textContent = "Requesting location permission…";
  navigator.geolocation.getCurrentPosition((position) => {
    const coordinates = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
    document.querySelector("[name=coordinates]").value = coordinates;
    note.textContent = `Location added: ${coordinates}`;
  }, () => { note.textContent = "Location unavailable. Enter your address manually."; }, { enableHighAccuracy: false, timeout: 8000 });
}

function submitOrder(form) {
  if (!state.cart.length) return showToast("Tu carrito está vacío.");
  const values = new FormData(form);
  const totals = cartTotals();
  const order = {
    id: String(Date.now()).slice(-7),
    email: String(values.get("email")).trim().toLowerCase(),
    accountEmail: state.user?.email || "",
    customerName: String(values.get("customerName")).trim(),
    phone: String(values.get("phone")).trim(),
    address: `${String(values.get("street")).trim()}, ${String(values.get("city")).trim()}, ${String(values.get("region")).trim()} ${String(values.get("postalCode")).trim()}, USA`,
    coordinates: String(values.get("coordinates") || ""),
    payment: String(values.get("payment")),
    paymentStatus: "Pendiente",
    deliveryStatus: "Preparando",
    total: totals.total,
    items: state.cart.map((item) => {
      const product = state.products.find((productItem) => productItem.id === item.productId);
      return { name: product?.name || "Producto", quantity: item.quantity };
    }),
    createdAt: new Date().toISOString(),
  };
  state.orders.unshift(order);
  if (!state.user) state.guestEmail = order.email;
  state.cart = [];
  state.coupon = "";
  saveData(); renderStore();
  playSound("success");
  openDialog(`<div class="dialog-inner"><div class="dialog-header"><div><p class="eyebrow">ORDER PLACED</p><h2>Your order is in motion.</h2></div><button class="close-button" type="button" data-action="close" aria-label="Close">×</button></div><div class="dialog-body"><div class="notice-block">Order ${escapeHTML(order.id)} registered. Payment is <strong>Pending</strong>; delivery is <strong>Preparing</strong>.</div><p class="field-hint-text" style="margin-top:14px">Delivering to ${escapeHTML(order.address)}${order.coordinates ? ` · Location ${escapeHTML(order.coordinates)}` : ""}</p><div class="account-actions"><button class="button button-outline" type="button" data-action="close">Continue browsing <span>↗</span></button></div></div></div>`);
}

function updateOrder(orderId, property, value, tab) {
  const order = state.orders.find((item) => item.id === orderId);
  if (!order) return;
  order[property] = value;
  saveData();
  if (tab === "orders") openAdmin("orders");
  else openDelivery();
  showToast(property === "paymentStatus" ? `Pago actualizado: ${value}.` : `Entrega actualizada: ${value}.`);
}

function showAllProducts(category = "") {
  const products = category ? state.products.filter((product) => product.category === category) : state.products;
  openDialog(`<div class="dialog-inner"><div class="dialog-header"><div><p class="eyebrow">FULL SELECTION</p><h2>${escapeHTML(category || "Catalog")}</h2></div><button class="close-button" type="button" data-action="close" aria-label="Close">×</button></div><div class="dialog-body"><div class="product-grid">${products.map(productCard).join("") || `<p class="empty-state">No items in this category yet.</p>`}</div></div></div>`);
}

if (state.user) enterStore();

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !event.ctrlKey && !event.metaKey && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
    event.preventDefault();
    openSearch();
  }
});

document.querySelector("#auth-create-link").addEventListener("click", (event) => {
  const email = event.currentTarget.dataset.email || "";
  setAuthMode("register");
  document.querySelector("#register-email").value = email;
  document.querySelector("#register-name").focus();
});