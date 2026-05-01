const WA_NUMBER = "5581984195038";
const STORE_NAME = "AL ELÉTRICA, HIDRÁULICA & PARAFUSO";
const CITY = "TAMANDARÉ-PE";

const PROD_PLACEHOLDER =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='420' viewBox='0 0 600 420'>
  <defs>
    <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0' stop-color='#1a1230'/>
      <stop offset='1' stop-color='#0b0611'/>
    </linearGradient>
  </defs>
  <rect width='600' height='420' fill='url(#g)'/>
  <g fill='none' stroke='rgba(255,255,255,.22)' stroke-width='2'>
    <rect x='130' y='105' width='340' height='210' rx='18'/>
    <path d='M170 255l70-70 70 70 60-60 70 70'/>
    <circle cx='245' cy='180' r='20'/>
  </g>
  <text x='50%' y='86%' text-anchor='middle' fill='rgba(255,255,255,.62)' font-family='Arial' font-size='18'>Sem imagem</text>
</svg>`);

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function brl(v) {
  return (v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function productImageSrc(p) {
  return p.image || `img/products/${p.id}.jpg`;
}

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("AL_CART") || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("AL_CART", JSON.stringify(cart));
}

function addToCart(id) {
  let cart = loadCart();
  const item = cart.find((i) => i.id === id);
  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });
  saveCart(cart);
  toast("Adicionado ao carrinho!");
  updateBadges();
}

function setQty(id, qty) {
  let cart = loadCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty = Math.max(0, qty);
  cart = cart.filter((i) => i.qty > 0);
  saveCart(cart);
}

function removeItem(id) {
  let cart = loadCart();
  cart = cart.filter((i) => i.id !== id);
  saveCart(cart);
}

function productCard(p) {
  return `
  <div class="prod">
    <div class="prod-media">
      <img class="prod-img" src="${productImageSrc(p)}" alt="${escapeHtml(
        p.name,
      )}" loading="lazy" onerror="this.onerror=null;this.src=PROD_PLACEHOLDER;" />
    </div>
    <div class="meta">
      <span class="badge">${escapeHtml(p.category)}</span>
      <span class="price">${brl(p.price)}</span>
    </div>
    <h3>${escapeHtml(p.name)}</h3>

    <!-- ✅ TEMPORÁRIO: MOSTRAR CÓDIGO/ID -->
    <div class="small" style="opacity:.75">Cód.: <b>${escapeHtml(
      p.id,
    )}</b></div>

    <div class="small">${escapeHtml(p.desc || "")}</div>
    <div class="row" style="margin-top:auto;justify-content:space-between;align-items:center">
      <span class="small">Unid.: ${escapeHtml(p.unit)}</span>
      <button class="btn primary" data-add="${p.id}">Adicionar</button>
    </div>
  </div>`;
}

function renderFeatured() {
  const host = document.querySelector("[data-featured]");
  if (!host) return;
  const picks = window.PRODUCTS.slice(0, 8);
  host.innerHTML = picks.map(productCard).join("");
  host
    .querySelectorAll("[data-add]")
    .forEach((btn) =>
      btn.addEventListener("click", () => addToCart(btn.dataset.add)),
    );
}

function renderCatalog() {
  const host = document.querySelector("[data-catalog]");
  const chipHost = document.querySelector("[data-chips]");
  if (!host) return;

  const q = document.querySelector("#q");

  const rawCats = Array.from(
    new Set(window.PRODUCTS.map((p) => String(p.category)))
  );

  rawCats.sort((a, b) => {
    const la = CATEGORY_MAP[a] || a;
    const lb = CATEGORY_MAP[b] || b;
    return la.localeCompare(lb, "pt-BR");
  });

  const categories = ["Todas", ...rawCats];

  if (chipHost) {
    chipHost.innerHTML = categories
      .map((c) => {
        const label = c === "Todas" ? "Todas" : (CATEGORY_MAP[c] || c);
        return `<div class="chip ${c === "Todas" ? "active" : ""}" data-cat-val="${c}">${label}</div>`;
      })
      .join("");

    chipHost.querySelectorAll(".chip").forEach(chip => {
      chip.addEventListener("click", () => {
        chipHost.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        apply();
      });
    });
  }

  function apply() {
    const term = (q.value || "").trim().toLowerCase();
    const activeChip = chipHost?.querySelector(".chip.active");
    const c = activeChip ? activeChip.dataset.catVal : "Todas";

    const list = window.PRODUCTS.filter((p) => {
      const mt =
        !term ||
        p.name.toLowerCase().includes(term) ||
        String(p.id).toLowerCase().includes(term) ||
        (p.desc || "").toLowerCase().includes(term);

      const mc = c === "Todas" || String(p.category) === c;
      return mt && mc;
    });

    host.innerHTML =
      list.map(productCard).join("") ||
      `<div class="card padded">Nenhum item encontrado.</div>`;

    host
      .querySelectorAll("[data-add]")
      .forEach((btn) =>
        btn.addEventListener("click", () => addToCart(btn.dataset.add))
      );
  }

  let timeout;
  q.addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      apply();
    }, 300);
  });
  
  // Handle initial hash
  const m = (location.hash || "").match(/cat=([^&]+)/i);
  if (m) {
    const wanted = decodeURIComponent(m[1]);
    const target = chipHost?.querySelector(`[data-cat-val="${wanted}"]`);
    if (target) {
      chipHost.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
      target.classList.add("active");
    }
  }

  apply();
}

function renderCart() {
  const host = document.querySelector("[data-cart]");
  if (!host) return;
  const cart = loadCart();
  if (cart.length === 0) {
    host.innerHTML = `<div class="card padded">Seu carrinho está vazio. <a class="btn primary" href="catalogo.html" style="margin-top:10px">Ver catálogo</a></div>`;
    return;
  }
  const lines = cart
    .map((i) => {
      const p = getProduct(i.id);
      if (!p) return "";
      const total = p.price * i.qty;
      return `
    <div class="cart-item">
      <div class="cart-thumb"><img src="${productImageSrc(p)}" alt="${escapeHtml(
        p.name,
      )}" loading="lazy" onerror="this.onerror=null;this.src=PROD_PLACEHOLDER;"></div>
      <div>
        <div class="name">${escapeHtml(p.name)}</div>
        <div class="small">Cód.: ${escapeHtml(
          p.id,
        )} • ${escapeHtml(p.category)} • ${escapeHtml(p.unit)}</div>
      </div>
      <div class="qty">
        <button class="btn" data-dec="${p.id}">-</button>
        <input class="input" style="width:60px;text-align:center" value="${
          i.qty
        }" data-qty="${p.id}" inputmode="numeric" />
        <button class="btn" data-inc="${p.id}">+</button>
      </div>
      <div class="price">${brl(total)}</div>
      <button class="btn danger" title="Remover" data-rm="${p.id}">✕</button>
    </div>`;
    })
    .join("");
  host.innerHTML = `<div class="card">${lines}</div>`;
  host.querySelectorAll("[data-inc]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.inc;
      const item = loadCart().find((x) => x.id === id);
      if (item) setQty(id, item.qty + 1);
      renderCart();
      renderSummary();
      updateBadges();
    }),
  );
  host.querySelectorAll("[data-dec]").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.dataset.dec;
      const item = loadCart().find((x) => x.id === id);
      if (item) setQty(id, item.qty - 1);
      renderCart();
      renderSummary();
      updateBadges();
    }),
  );
  host.querySelectorAll("[data-rm]").forEach((b) =>
    b.addEventListener("click", () => {
      removeItem(b.dataset.rm);
      renderCart();
      renderSummary();
      updateBadges();
    }),
  );
  host.querySelectorAll("[data-qty]").forEach((inp) =>
    inp.addEventListener("change", () => {
      const id = inp.dataset.qty;
      const v = parseInt(inp.value, 10);
      setQty(id, isNaN(v) ? 1 : v);
      renderCart();
      renderSummary();
      updateBadges();
    }),
  );
}

function setupCheckout() {
  const bairroSel = document.querySelector("#bairro");
  const retiradaCheck = document.querySelector("#retirada");
  const addressBox = document.querySelector("[data-address]");

  if (!bairroSel) return;

  const bairros = Object.keys(window.DELIVERY_FEES || {});
  bairroSel.innerHTML = bairros
    .map((b) => `<option value="${b}">${b} (${brl(window.DELIVERY_FEES[b])})</option>`)
    .join("");

  retiradaCheck?.addEventListener("change", () => {
    const isRetirada = retiradaCheck.checked;
    addressBox.style.display = isRetirada ? "none" : "block";
    bairroSel.disabled = isRetirada;
    renderSummary();
  });

  bairroSel.addEventListener("change", renderSummary);
}

function renderSummary() {
  const host = document.querySelector("[data-summary]");
  if (!host) return;
  const cart = loadCart();
  const subtotal = cartTotal(cart);
  
  const isRetirada = document.querySelector("#retirada")?.checked;
  const bairro = document.querySelector("#bairro")?.value;
  const taxa = isRetirada ? 0 : (window.DELIVERY_FEES[bairro] || 0);
  const total = subtotal + taxa;

  host.innerHTML = `
    <div class="card padded">
      <div class="totals">
        <div class="line"><span>Subtotal</span><span>${brl(subtotal)}</span></div>
        ${!isRetirada ? `<div class="line"><span>Entrega (${bairro})</span><span>${brl(taxa)}</span></div>` : `<div class="line"><span>Retirada na loja</span><span>Grátis</span></div>`}
        <div class="line grand"><span>Total</span><span>${brl(total)}</span></div>
      </div>
      <button class="btn primary" style="width:100%;margin-top:14px;height:50px;font-weight:bold" id="btnWhats">
        Confirmar Pedido via WhatsApp
      </button>
    </div>
  `;
  const btn = document.querySelector("#btnWhats");
  btn?.addEventListener("click", () => sendWhats(cart, taxa, isRetirada));
}

function sendWhats(cart, taxa, isRetirada) {
  const nome = document.querySelector("#nome")?.value.trim();
  const tel = document.querySelector("#tel")?.value.trim();
  const pagamento = document.querySelector("#pagamento")?.value;
  const obs = document.querySelector("#obs")?.value.trim();
  
  if (!nome) return alert("Por favor, informe seu nome.");

  const total = brl(cartTotal(cart) + taxa);
  const lines = cart
    .map((i) => {
      const p = getProduct(i.id);
      if (!p) return "";
      return `• ${p.name} (${i.qty} ${p.unit}) — ${brl(p.price * i.qty)}`;
    })
    .filter(Boolean)
    .join("\n");

  let msg = `*🛍️ NOVO PEDIDO - ${STORE_NAME}*\n\n`;
  msg += `*Cliente:* ${nome}\n`;
  if (tel) msg += `*WhatsApp:* ${tel}\n`;
  msg += `*Pagamento:* ${pagamento}\n\n`;
  
  msg += `*Itens:*\n${lines}\n\n`;
  
  if (isRetirada) {
    msg += `📍 *Retirada na Loja*\n`;
  } else {
    const bairro = document.querySelector("#bairro")?.value;
    const rua = document.querySelector("#rua")?.value;
    const num = document.querySelector("#numero")?.value;
    const comp = document.querySelector("#complemento")?.value;
    msg += `📍 *Entrega:* ${bairro}\n`;
    msg += `🏠 *Endereço:* ${rua}, nº ${num}${comp ? ` (${comp})` : ""}\n`;
    msg += `🚚 *Taxa de entrega:* ${brl(taxa)}\n`;
  }

  if (obs) msg += `\n📝 *OBS:* ${obs}\n`;
  
  msg += `\n💰 *TOTAL: ${total}*`;

  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

function updateBadges() {
  const cart = loadCart();
  const n = cart.reduce((a, b) => a + b.qty, 0);
  document.querySelectorAll("[data-cart-badge]").forEach((el) => {
    el.textContent = n;
    const parent = el.closest(".btn, .float-cart");
    if (parent && parent.classList.contains("primary")) {
       // No header/desktop, talvez queira esconder se 0
       el.parentElement.style.display = n > 0 ? "inline-flex" : "none";
    }
  });
}

function init() {
  window.PRODUCTS = window.PRODUCTS || [];
  updateBadges();
  renderFeatured();
  renderCatalog();
  renderCart();
  setupCheckout();
  renderSummary();
  
  // Update badges again after some renders just in case
  setTimeout(updateBadges, 100);
}

document.addEventListener("DOMContentLoaded", init);