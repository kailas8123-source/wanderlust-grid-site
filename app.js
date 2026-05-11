function qs(selector, root = document) {
  return root.querySelector(selector);
}

function qsa(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function showToast(message) {
  const toast = qs("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

function setupNav() {
  const button = qs("[data-menu]");
  const links = qs(".links");
  if (!button || !links) return;
  button.setAttribute("aria-expanded", "false");
  button.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    button.setAttribute("aria-expanded", String(isOpen));
  });
}

function card(item, kind = "destination") {
  const href = kind === "experience" ? `experiences.html#${item.id}` : `destination-detail.html?id=${item.id}`;
  return `
    <article class="card" data-region="${item.region || ""}" data-style="${item.style || item.type || ""}" data-price="${item.price || 0}">
      <a href="${href}"><img src="${item.image}" alt="${item.name}"></a>
      <div class="card-body">
        <h3>${item.name}</h3>
        <p>${item.summary}</p>
        <div class="meta">
          ${item.region ? `<span>${item.region}</span>` : ""}
          <span>${item.style || item.type}</span>
          ${item.days ? `<span>${item.days} days</span>` : ""}
        </div>
        ${item.price ? `<span class="pill">from ${money(item.price)}</span>` : ""}
        <a class="explore" href="${href}">Explore <span class="orange">&nbsp;-></span></a>
      </div>
    </article>
  `;
}

function renderDestinations(limit) {
  const target = qs("[data-destinations]");
  if (!target) return;
  const items = limit ? destinations.slice(0, limit) : destinations;
  target.innerHTML = items.map((item) => card(item)).join("");
}

function renderExperiences() {
  const target = qs("[data-experiences]");
  if (!target) return;
  target.innerHTML = experiences.map((item) => card(item, "experience")).join("");
}

function setupFilters() {
  const grid = qs("[data-filter-grid]");
  if (!grid) return;
  const region = qs("#regionFilter");
  const style = qs("#styleFilter");
  const budget = qs("#budgetFilter");
  const note = qs("[data-result-note]");

  function apply() {
    const cards = qsa(".card", grid);
    let visible = 0;
    cards.forEach((item) => {
      const matchesRegion = !region.value || item.dataset.region === region.value;
      const matchesStyle = !style.value || item.dataset.style === style.value;
      const matchesBudget = !budget.value || Number(item.dataset.price) <= Number(budget.value);
      const keep = matchesRegion && matchesStyle && matchesBudget;
      item.style.display = keep ? "" : "none";
      if (keep) visible += 1;
    });
    if (note) note.textContent = `${visible} trip${visible === 1 ? "" : "s"} match your filters.`;
  }

  [region, style, budget].forEach((control) => control && control.addEventListener("change", apply));
  apply();
}

function setupPlanner() {
  let modal = qs("#plannerModal");
  if (!modal) {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal" id="plannerModal">
        <div class="modal-card">
          <div class="modal-head"><h2>Plan your trip</h2><button class="icon-btn" data-close-planner aria-label="Close planner">x</button></div>
          <form id="plannerForm" class="planner-panel">
            <div class="field"><label>Destination</label><select name="destination"><option value="bali">Bali</option><option value="switzerland">Swiss Alps</option><option value="dubai">Dubai</option><option value="paris">Paris</option><option value="new-york">New York</option><option value="maldives">Maldives</option></select></div>
            <div class="field"><label>Travelers</label><input name="travelers" type="number" min="1" value="2"></div>
            <div class="field"><label>Days</label><input name="days" type="number" min="2" value="6"></div>
            <div class="field"><label>Pace</label><select name="pace"><option>balanced</option><option>relaxed</option><option>packed</option></select></div>
            <button class="btn dark" type="submit">Estimate Trip</button>
          </form>
          <div id="quoteResult" class="quote-box">Choose a route and generate a quick estimate.</div>
        </div>
      </div>
    `);
    modal = qs("#plannerModal");
  }
  const openers = qsa("[data-open-planner]");
  const closers = qsa("[data-close-planner]");
  const form = qs("#plannerForm");
  const result = qs("#quoteResult");
  if (!modal) return;

  if (!modal.hasAttribute("aria-hidden")) modal.setAttribute("aria-hidden", "true");

  function openPlanner() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    qs("[name='destination']", modal)?.focus();
  }

  function closePlanner() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  openers.forEach((button) => button.addEventListener("click", openPlanner));
  closers.forEach((button) => button.addEventListener("click", closePlanner));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closePlanner();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("open")) closePlanner();
  });

  if (form && result) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const destination = destinations.find((item) => item.id === data.get("destination")) || destinations[0];
      const travelers = Number(data.get("travelers") || 1);
      const days = Number(data.get("days") || destination.days);
      const pace = data.get("pace");
      const estimate = Math.round((destination.price / destination.days) * days * travelers);
      result.innerHTML = `<strong>${destination.name}</strong><br>${travelers} traveler${travelers > 1 ? "s" : ""}, ${days} days, ${pace} pace. Estimated package: <strong>${money(estimate)}</strong>. A travel designer can refine flights, stays, and dates from here.`;
      showToast("Trip estimate ready.");
    });
  }
}

function setupForms() {
  qsa("[data-feedback-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.reset();
      showToast(form.dataset.feedbackForm || "Thanks. We will be in touch soon.");
    });
  });
}

function renderDetail() {
  const target = qs("[data-detail]");
  if (!target) return;
  const params = new URLSearchParams(location.search);
  const item = destinations.find((entry) => entry.id === params.get("id")) || destinations[0];
  document.title = `${item.name} | Wanderlust Grid`;
  target.innerHTML = `
    <div>
      <img class="detail-image" src="${item.image}" alt="${item.name}">
      <h2>${item.name}</h2>
      <p>${item.summary}</p>
      <div class="itinerary">
        ${item.highlights.map((highlight, index) => `<div class="day"><strong>Day ${index + 1}</strong><br>${highlight}</div>`).join("")}
      </div>
    </div>
    <aside class="panel">
      <div class="eyebrow">Trip Snapshot</div>
      <h2>${item.days} days from ${money(item.price)}</h2>
      <p>Includes boutique stays, guided experiences, airport transfers, and local support during the journey.</p>
      <div class="meta">
        <span>${item.region}</span>
        <span>${item.style}</span>
        <span>Flexible dates</span>
      </div>
      <button class="btn" data-open-planner>Plan this trip</button>
    </aside>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  renderDestinations(qs("[data-destinations]")?.dataset.limit ? Number(qs("[data-destinations]").dataset.limit) : undefined);
  renderExperiences();
  renderDetail();
  setupFilters();
  setupPlanner();
  setupForms();
});
