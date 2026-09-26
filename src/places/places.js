/* Places by the water: list + Leaflet map (live OpenStreetMap tiles) + detail. Deep link: #12 = place 12. */
(async () => {
  const DATA = await loadJSON("../data/places.json");
  const byN = new Map(DATA.places.map((p) => [p.n, p]));
  const state = { chapter: null, types: new Set(), q: "", year: false, fresh: false, selected: null };
  const $ = (s) => document.querySelector(s);
  const rated = (p) => (Ratings.get(`places:${p.id}`) || {}).stars || 0; // saved under the permanent id, not the shown number

  /* ---------- map ---------- */
  const map = L.map("map", { zoomSnap: 0.5, maxZoom: 18 });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  const all = L.latLngBounds(DATA.places.map((p) => [p.lat, p.lon]));
  map.fitBounds(all.pad(0.08));
  const markers = new Map();
  DATA.places.forEach((p) => {
    const icon = L.divIcon({ className: "pinwrap", iconSize: [26, 26], iconAnchor: [13, 13],
      html: `<span class="pin ${p.status === "seasonal" ? "pin--s" : ""}">${p.n}</span>` });
    const m = L.marker([p.lat, p.lon], { icon, riseOnHover: true, keyboard: true }).addTo(map);
    m.on("click", () => { location.hash = String(p.n); });
    markers.set(p.n, m);
  });
  const highlight = (n) => markers.forEach((m, k) => {
    m.getElement()?.querySelector(".pin")?.classList.toggle("pin--on", k === n); m.setZIndexOffset(k === n ? 1000 : 0);
  });

  /* ---------- filters ---------- */
  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    state.chapter = b.dataset.c === "" ? null : +b.dataset.c; renderChips(); renderList(true);
  });
  // categories: pick any number; a place shows if it has at least one of them
  $("#types").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    if (!b.dataset.t) state.types.clear();
    else state.types.has(b.dataset.t) ? state.types.delete(b.dataset.t) : state.types.add(b.dataset.t);
    renderChips(); renderList(true);
  });
  $("#q").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); renderList(); });
  $("#f-year").addEventListener("change", (e) => { state.year = e.target.checked; renderList(); });
  $("#f-new").addEventListener("change", (e) => { state.fresh = e.target.checked; renderList(); });

  function visible(p) {
    const x = L10N(p);
    if (state.chapter !== null && p.chapter !== state.chapter) return false;
    if (state.types.size && !p.categories.some((c) => state.types.has(c))) return false;
    if (state.year && p.status === "seasonal") return false;
    if (state.fresh && rated(p)) return false;
    if (state.q && ![x.name, x.kind, x.area, x.tagline, x.description].join(" ").toLowerCase().includes(state.q)) return false;
    return true;
  }
  function renderChips() {
    $("#chips").innerHTML = [`<span class="chips__label">${esc(t("area"))}</span><button class="chip" data-c="" aria-pressed="${state.chapter === null}">${esc(t("all"))}</button>`]
      .concat(DATA.chapters.map((c, i) => `<button class="chip" data-c="${i}" aria-pressed="${state.chapter === i}">${esc(L10N(c).short)}</button>`)).join("");
    const count = (c) => DATA.places.filter((p) => p.categories.includes(c)).length;
    $("#types").innerHTML = [`<span class="chips__label">${esc(t("type"))}</span><button class="chip" data-t="" aria-pressed="${!state.types.size}">${esc(t("all"))}</button>`]
      .concat(DATA.categories.map((c) => `<button class="chip" data-t="${c}" aria-pressed="${state.types.has(c)}">${esc(t("cat")[c])} <span class="chip__n">${count(c)}</span></button>`)).join("");
    $("#chips").setAttribute("aria-label", t("area")); $("#types").setAttribute("aria-label", t("type"));
  }
  function renderList(fit) {
    const shown = DATA.places.filter(visible);
    $("#list").innerHTML = DATA.chapters.map((c, ci) => {
      const ps = shown.filter((p) => p.chapter === ci); if (!ps.length) return "";
      return `<div class="group"><h2 class="label">${esc(L10N(c).title)}</h2></div><ul class="rows">` + ps.map((p) => {
        const x = L10N(p), s = rated(p);
        return `<li><button class="row" data-n="${p.n}"><span class="num ${p.status === "seasonal" ? "num--s" : ""}">${p.n}</span>
          <span><span class="row__name">${esc(x.name)}</span><span class="row__sub">${esc(x.kind)} · ${esc((x.area || "").split(",")[0])}</span></span>
          <span class="row__side">${fmt(p.km)} km${s ? `<span class="stars-inline" aria-label="${esc(t("rate", { n: s }))}">${starsText(s)}</span>` : ""}</span></button></li>`;
      }).join("") + "</ul>";
    }).join("") || `<p class="empty">${esc(t("no_match"))}</p>`;
    markers.forEach((m, n) => { const on = shown.some((p) => p.n === n); if (on !== map.hasLayer(m)) on ? m.addTo(map) : m.remove(); });
    if (fit && shown.length) map.flyToBounds(L.latLngBounds(shown.map((p) => [p.lat, p.lon])).pad(0.15), { duration: 0.6, maxZoom: 14 });
  }
  $("#list").addEventListener("click", (e) => { const r = e.target.closest(".row"); if (r) location.hash = r.dataset.n; });

  /* ---------- detail ---------- */
  function renderDetail(p) {
    const x = L10N(p), seasonal = p.status === "seasonal";
    const facts = [x.kind, x.area, t("km_from_city", { km: fmt(p.km) }), t("price")[p.price]].filter(Boolean)
      .map((f) => `<span class="fact">${esc(f)}</span>`).join("") + (x.season ? `<span class="fact fact--s">${esc(x.season)}</span>` : "");
    const scores = p.scores.map((s) => `<span>${esc(s.site)} <b>${fmt(s.rating)}</b>/${s.scale}${s.count ? ` (${Number(s.count).toLocaleString(LANG === "sv" ? "sv-SE" : "en-GB")})` : ""}</span>`).join("");
    const ph = p.photo;
    const photo = ph ? `<figure><img src="../${esc(ph.file)}" alt="${esc(ph.shows[LANG] || ph.shows.sv)}" loading="lazy">
        <figcaption>${esc(ph.shows[LANG] || ph.shows.sv)}. ${esc(t("photo"))}: ${esc(ph.author)},
        ${ph.license_url ? `<a href="${esc(ph.license_url)}" target="_blank" rel="noopener">${esc(ph.license)}</a>` : esc(ph.license)},
        <a href="${esc(ph.commons_page)}" target="_blank" rel="noopener">Wikimedia Commons</a>${ph.modified ? ` (${esc(t("cropped"))})` : ""}</figcaption></figure>`
      : `<p class="nophoto">${esc(t("no_photo"))}</p>`;
    $("#detail").innerHTML = `<button class="back" id="back">${esc(t("back"))}</button>${photo}
      <div class="detail__title"><span class="num ${seasonal ? "num--s" : ""}">${p.n}</span><h1>${esc(x.name)}</h1></div>
      ${x.tagline ? `<p class="tagline">${esc(x.tagline)}</p>` : ""}
      <div class="facts">${facts}</div>
      <div class="links">${p.website ? `<a class="btn btn--solid" href="${esc(p.website)}" target="_blank" rel="noopener">${esc(t("website"))}</a>` : ""}
        <a class="btn" href="${esc(p.maps)}" target="_blank" rel="noopener">${esc(t("open_maps"))}</a></div>
      <p>${esc(x.description)}</p>${p.address ? `<p class="addr">${esc(p.address)}</p>` : ""}
      <div id="rating-slot"></div>
      <section><h2 class="label">${esc(t("reviews"))}</h2>${x.review_summary ? `<p>${esc(x.review_summary)}</p>` : ""}
        ${scores ? `<div class="scores">${scores}</div>` : ""}</section>
      <section><h2 class="label">${esc(t("good_to_know"))}</h2><ul class="know">${(x.good_to_know || []).map((g) => `<li>${esc(g)}</li>`).join("")}</ul>
        ${x.best_for ? `<div class="bestfor"><span class="label">${esc(t("best_for"))}</span><br>${esc(x.best_for)}</div>` : ""}</section>`;
    $("#rating-slot").replaceWith(ratingBox(`places:${p.id}`, t("been_there"), t("notes_ph")));
    $("#back").addEventListener("click", () => { history.pushState(null, "", location.pathname + location.search); route(); });
  }
  Ratings.listeners.push(() => renderList());

  /* ---------- routing ---------- */
  function route() {
    const n = +location.hash.slice(1), p = byN.get(n);
    state.selected = p ? n : null;
    $("#list").hidden = !!p; $("#detail").hidden = !p; $("#head").hidden = !!p && innerWidth < 900;
    highlight(state.selected);
    if (p) {
      renderDetail(p);
      map.flyTo([p.lat, p.lon], Math.max(map.getZoom(), 15), { duration: 0.6 });
      if (innerWidth >= 900) $("#panel").scrollTop = 0; else $("#mapwrap").scrollIntoView({ block: "start" });
    }
  }
  window.addEventListener("hashchange", route);

  function renderAll() {
    $("#title").textContent = L10N(DATA).title;
    $("#sub").textContent = t("places_sub", { n: DATA.places.length });
    document.title = `${L10N(DATA).short} · Elin's lists`;
    renderChips(); renderList();
    if (state.selected) renderDetail(byN.get(state.selected));
  }
  onLang.push(renderAll); renderAll(); route();
})();
