/* Shared by every Elin's lists page: language, UI text, on-device storage, header. */
const I18N = {
  sv: {
    lists: "Listor", home_lede: "Ställen och saker vi vill hinna med, samlade i listor.", open_list: "Öppna listan",
    more_soon: "Fler listor kommer.", n_places: "{n} ställen", n_recipes: "{n} recept", n_areas: "{n} områden", n_chapters: "{n} kapitel",
    search_places: "Sök ställe, område eller mat", search_recipes: "Sök recept eller ingrediens", all: "Alla",
    year_round: "Året runt", seasonal: "Säsong", only_year_round: "Öppet året runt", not_visited: "Inte besökta ännu",
    km_from_city: "{km} km från city", places_sub: "{n} ställen inom 50 km från Sergels torg. Klicka på en nål eller ett namn.",
    price: { 1: "Billigt", 2: "Mellanpris", 3: "Dyrt", 4: "Finkrog" },
    website: "Hemsida", open_maps: "Öppna i Google Maps", reviews: "Vad andra tycker", good_to_know: "Bra att veta", best_for: "Passar för",
    been_there: "Har vi varit där?", cooked_it: "Har vi lagat den?", date: "Datum", notes: "Anteckningar", save: "Spara", saved: "Sparat",
    clear: "Rensa", device_note: "Sparas bara i den här webbläsaren.", back: "← Alla ställen", no_match: "Inget matchar. Prova att ta bort ett filter.",
    photo: "Foto", no_photo: "Vi har inget fritt foto av det här stället än.", visited: "{n} besökta", cooked: "{n} lagade",
    not_cooked: "Inte lagade ännu", video_only: "Bara video", full_recipe: "Hela receptet", open_recipe: "Till receptet",
    by: "Av {who}", serves: "Portioner", time: "Tid", recipes_sub: "{n} vegetariska recept. Varje recept finns hos sin skapare; här är vår korta beskrivning och en länk.",
    notes_ph: "Vad åt vi, hur var det, ska vi tillbaka?", notes_ph_recipe: "Hur blev det? Något vi ändrade?",
    footer: "Kartdata © OpenStreetMap-bidragsgivare. Foton från Wikimedia Commons enligt respektive licens. Recepten tillhör sina skapare; vi länkar till originalen.",
    rate: "{n} av 5", lang_label: "Språk", cropped: "beskuren", covers: "Omslagsbilder",
    sign_in: "Logga in", sign_out: "Logga ut", email: "E-post", send_link: "Skicka inloggningslänk", link_sent: "Kolla din e-post och klicka på länken.",
    signin_hint: "Logga in för att dela betygen med varandra.", not_member: "Det här kontot får inte spara betyg här.", shared_note: "Delas mellan oss.",
    save_failed: "Kunde inte spara. Försök igen.", link_failed: "Kunde inte skicka länken.", signed_in_as: "Inloggad som {who}", close: "Stäng",
  },
  en: {
    lists: "Lists", home_lede: "Places and things we want to get round to, collected in lists.", open_list: "Open the list",
    more_soon: "More lists to come.", n_places: "{n} places", n_recipes: "{n} recipes", n_areas: "{n} areas", n_chapters: "{n} chapters",
    search_places: "Search places, areas or food", search_recipes: "Search recipes or ingredients", all: "All",
    year_round: "All year", seasonal: "Seasonal", only_year_round: "Open all year", not_visited: "Not visited yet",
    km_from_city: "{km} km from the centre", places_sub: "{n} places within 50 km of Sergels torg. Click a pin or a name.",
    price: { 1: "Cheap", 2: "Mid-range", 3: "Pricey", 4: "Fine dining" },
    website: "Website", open_maps: "Open in Google Maps", reviews: "What people say", good_to_know: "Good to know", best_for: "Best for",
    been_there: "Have we been?", cooked_it: "Have we made it?", date: "Date", notes: "Notes", save: "Save", saved: "Saved",
    clear: "Clear", device_note: "Saved in this browser only.", back: "← All places", no_match: "Nothing matches. Try removing a filter.",
    photo: "Photo", no_photo: "We don't have a free photo of this place yet.", visited: "{n} visited", cooked: "{n} made",
    not_cooked: "Not made yet", video_only: "Video only", full_recipe: "Full recipe", open_recipe: "Go to the recipe",
    by: "By {who}", serves: "Serves", time: "Time", recipes_sub: "{n} vegetarian recipes. Each recipe lives with its creator; here is our short description and a link.",
    notes_ph: "What did we eat, how was it, would we go back?", notes_ph_recipe: "How did it turn out? Anything we changed?",
    footer: "Map data © OpenStreetMap contributors. Photos from Wikimedia Commons under their stated licences. Recipes belong to their creators; we link to the originals.",
    rate: "{n} out of 5", lang_label: "Language", cropped: "cropped", covers: "Cover images",
    sign_in: "Sign in", sign_out: "Sign out", email: "Email", send_link: "Send sign-in link", link_sent: "Check your email and click the link.",
    signin_hint: "Sign in to share ratings with each other.", not_member: "This account can't save ratings here.", shared_note: "Shared between us.",
    save_failed: "Couldn't save. Please try again.", link_failed: "Couldn't send the link.", signed_in_as: "Signed in as {who}", close: "Close",
  },
};

/* Which language to show on first visit. Order: ?lang= in the link, the reader's earlier choice, the browser's language. */
function pickLanguage() {
  const fromUrl = new URLSearchParams(location.search).get("lang");
  if (fromUrl === "sv" || fromUrl === "en") return fromUrl;
  const saved = store.get("lang");
  if (saved === "sv" || saved === "en") return saved;
  return (navigator.languages || [navigator.language]).some((l) => /^sv\b/i.test(l || "")) ? "sv" : "en";
}

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem("elinslists:" + k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem("elinslists:" + k, JSON.stringify(v)); } catch (e) { /* private mode: nothing kept */ } },
  del(k) { try { localStorage.removeItem("elinslists:" + k); } catch (e) { /* ignore */ } },
};

/* ---------- ratings: this browser, or shared through Supabase when configured and signed in ---------- */
const CFG = window.ELINSLISTS_CONFIG || {};
const SUPABASE_JS = { src: "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2/dist/umd/supabase.js",
  integrity: "sha384-Rj26LVGvoeRVR6+mwQmFfcR3QOBEwT+ZmuCWpuiqeTzJpCs0ER4ITAWGb4Hiy3Ok" };
const Ratings = {
  mode: "local",            // "local" = localStorage, "cloud" = Supabase table public.ratings
  cache: new Map(),         // cloud rows, "places:12" -> {stars, date, note}
  listeners: [],
  split(key) { const [list, item] = key.split(":"); return { list, item: +item }; },
  get(key) { return this.mode === "cloud" ? this.cache.get(key) || null : store.get(key); },
  count(list) {
    if (this.mode === "cloud") return [...this.cache.keys()].filter((k) => k.startsWith(list + ":")).length;
    try { return Object.keys(localStorage).filter((k) => k.startsWith(`elinslists:${list}:`)).length; } catch (e) { return 0; }
  },
  async set(key, body) {
    if (!(body.stars || body.date || body.note)) return this.del(key);
    if (this.mode === "cloud") {
      const { list, item } = this.split(key);
      const { error } = await sb.from("ratings").upsert({ list, item, stars: body.stars || 0, date: body.date || null,
        note: body.note || "", updated_at: new Date().toISOString() });
      if (error) throw error;
      this.cache.set(key, body);
    } else store.set(key, body);
    this.changed();
  },
  async del(key) {
    if (this.mode === "cloud") {
      const { list, item } = this.split(key);
      const { error } = await sb.from("ratings").delete().eq("list", list).eq("item", item);
      if (error) throw error;
      this.cache.delete(key);
    } else store.del(key);
    this.changed();
  },
  changed() { this.listeners.forEach((fn) => fn()); },
};

let sb = null, account = { user: null, member: false, msg: "" };
function loadScript({ src, integrity }) {
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.integrity = integrity;
    s.crossOrigin = "anonymous"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}
async function pullCloud() {
  const { data, error } = await sb.from("ratings").select("list,item,stars,date,note");
  if (error) throw error;
  Ratings.cache = new Map(data.map((r) => [`${r.list}:${r.item}`, { stars: r.stars, date: r.date || "", note: r.note || "" }]));
}
async function afterAuth(user) {
  account.user = user; account.member = false;
  if (user) {
    const { data: member } = await sb.rpc("is_member");
    account.member = member === true;
    if (!account.member) account.msg = t("not_member");
  }
  if (account.member) {
    await pullCloud();
    // first sign-in on this device: move ratings kept in this browser up to the shared table
    let moved = false;
    try {
      for (const k of Object.keys(localStorage)) {
        const m = k.match(/^elinslists:(\w+):(\d+)$/); if (!m) continue;
        const key = `${m[1]}:${m[2]}`;
        if (!Ratings.cache.has(key)) { Ratings.mode = "cloud"; await Ratings.set(key, store.get(key)); moved = true; }
        store.del(key);
      }
    } catch (e) { /* keep local copies if anything fails */ }
    Ratings.mode = "cloud";
    if (moved) await pullCloud();
  } else Ratings.mode = "local";
  renderAccount(); Ratings.changed();
}
async function initCloud() {
  if (!CFG.supabaseUrl || !CFG.supabaseKey) return;
  try {
    await loadScript(SUPABASE_JS);
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey);
    const { data: { session } } = await sb.auth.getSession();
    await afterAuth(session?.user || null);
    sb.auth.onAuthStateChange((_e, s) => { if ((s?.user?.id || null) !== (account.user?.id || null)) afterAuth(s?.user || null); });
    // pick up the other person's ratings when coming back to the tab
    document.addEventListener("visibilitychange", async () => {
      if (!document.hidden && Ratings.mode === "cloud") { try { await pullCloud(); Ratings.changed(); } catch (e) { /* offline */ } }
    });
  } catch (e) { sb = null; renderAccount(); }
}
function renderAccount() {
  const slot = document.querySelector(".account"); if (!slot) return;
  if (!sb) { slot.innerHTML = ""; return; }
  slot.innerHTML = account.user
    ? `<button class="acct" id="acct-btn" title="${esc(t("signed_in_as", { who: account.user.email }))}">${esc(account.member ? "✓ " : "")}${esc(t("sign_out"))}</button>`
    : `<button class="acct" id="acct-btn">${esc(t("sign_in"))}</button>`;
  slot.querySelector("#acct-btn").addEventListener("click", async () => {
    if (account.user) { await sb.auth.signOut(); account.msg = ""; return; }
    openSignIn();
  });
}
function openSignIn() {
  let pop = document.querySelector(".signin");
  if (!pop) { pop = document.createElement("div"); pop.className = "signin"; document.querySelector("header.top").after(pop); }
  pop.hidden = false;
  pop.innerHTML = `<form id="signin-form"><p>${esc(t("signin_hint"))}</p>
    <label for="signin-email">${esc(t("email"))}</label>
    <div class="signin__row"><input id="signin-email" type="email" required autocomplete="email">
    <button class="btn btn--solid" type="submit">${esc(t("send_link"))}</button>
    <button class="btn" type="button" id="signin-close">${esc(t("close"))}</button></div>
    <p class="status" id="signin-status">${esc(account.msg)}</p></form>`;
  pop.querySelector("#signin-close").addEventListener("click", () => { pop.hidden = true; });
  pop.querySelector("#signin-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = pop.querySelector("#signin-email").value.trim();
    const redirect = location.origin + location.pathname + location.search;
    // shouldCreateUser: false – only people already added in Supabase can get a link
    const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirect } });
    pop.querySelector("#signin-status").textContent = error ? `${t("link_failed")} ${error.message}` : t("link_sent");
  });
  pop.querySelector("#signin-email").focus();
}

let LANG = pickLanguage();
const t = (key, vars) => {
  let s = I18N[LANG][key] ?? I18N.en[key] ?? key;
  if (vars && typeof s === "string") for (const [k, v] of Object.entries(vars)) s = s.replace("{" + k + "}", v);
  return s;
};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (x, d = 1) => Number(x).toLocaleString(LANG === "sv" ? "sv-SE" : "en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const L10N = (obj) => obj?.[LANG] && Object.keys(obj[LANG]).length ? obj[LANG] : obj?.sv || {}; // English falls back to Swedish
const onLang = [];

function setLanguage(l) {
  LANG = l; store.set("lang", l);
  document.documentElement.lang = l === "sv" ? "sv" : "en-GB";
  document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === l));
  const u = new URL(location.href); u.searchParams.set("lang", l); history.replaceState(null, "", u);
  onLang.forEach((fn) => fn());
}

/* Header with the language switch; every page has <header class="top" data-home="../"> */
function mountHeader() {
  const h = document.querySelector("header.top"); if (!h) return;
  const home = h.dataset.home || "./";
  h.innerHTML = `<a class="brand" href="${home}">Elin's lists</a>
    <div class="top__right"><span class="account"></span><div class="lang" role="group" aria-label="${t("lang_label")}">
      <button data-lang="sv" aria-pressed="false" title="Svenska">SV</button><button data-lang="en" aria-pressed="false" title="English (UK)">EN</button>
    </div></div>`;
  h.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => setLanguage(b.dataset.lang)));
  // keep the chosen language when following links inside the site
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]"); if (!a || a.target === "_blank") return;
    const u = new URL(a.href, location.href); if (u.origin !== location.origin) return;
    u.searchParams.set("lang", LANG); a.href = u.href;
  });
}

/* Stars + date + notes, kept in localStorage under key; used by places and recipes. */
function ratingBox(key, title, placeholder) {
  const v = Ratings.get(key) || {};
  const note = () => (Ratings.mode === "cloud" ? t("shared_note") : t("device_note"));
  const box = document.createElement("section");
  box.className = "rating";
  box.innerHTML = `<h2 class="label">${esc(title)}</h2>
    <div class="stars" role="radiogroup" aria-label="${esc(title)}">${[1, 2, 3, 4, 5].map((i) =>
      `<button class="star${i <= (v.stars || 0) ? " on" : ""}" data-s="${i}" role="radio" aria-checked="${i === v.stars}" aria-label="${esc(t("rate", { n: i }))}">★</button>`).join("")}</div>
    <div class="rating__fields">
      <label>${t("date")}<input type="date" name="date" value="${esc(v.date || "")}"></label>
      <label>${t("notes")}<textarea name="note" placeholder="${esc(placeholder)}">${esc(v.note || "")}</textarea></label>
    </div>
    <div class="rating__actions"><button class="btn btn--solid" data-act="save">${t("save")}</button>
      <button class="btn" data-act="clear">${t("clear")}</button><span class="status">${esc(note())}</span></div>`;
  let stars = v.stars || 0;
  box.querySelectorAll(".star").forEach((b) => b.addEventListener("click", () => {
    stars = +b.dataset.s === stars ? 0 : +b.dataset.s;
    box.querySelectorAll(".star").forEach((x) => { x.classList.toggle("on", +x.dataset.s <= stars); x.setAttribute("aria-checked", +x.dataset.s === stars); });
  }));
  const status = (s) => { box.querySelector(".status").textContent = s; };
  box.querySelector('[data-act="save"]').addEventListener("click", async () => {
    const body = { stars, date: box.querySelector('[name="date"]').value, note: box.querySelector('[name="note"]').value.trim() };
    try { await Ratings.set(key, body); status(t("saved")); } catch (e) { status(t("save_failed")); }
  });
  box.querySelector('[data-act="clear"]').addEventListener("click", async () => {
    try { await Ratings.del(key); } catch (e) { status(t("save_failed")); return; }
    stars = 0; box.querySelectorAll(".star").forEach((x) => x.classList.remove("on"));
    box.querySelector('[name="date"]').value = ""; box.querySelector('[name="note"]').value = ""; status(note());
  });
  return box;
}
const starsText = (n) => "★".repeat(n) + "☆".repeat(5 - n);

async function loadJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(url + " " + r.status); return r.json(); }

mountHeader();
document.addEventListener("DOMContentLoaded", () => setLanguage(LANG));
onLang.push(renderAccount);
initCloud();
