/* Green favourites: our own short description of each recipe + credit and link to its creator.
   Stars are saved under the recipe's permanent id ("recipes:<id>"), on this device or in Supabase. */
(async () => {
  const DATA = await loadJSON("../data/recipes.json");
  const state = { chapter: null, q: "", fresh: false };
  const $ = (s) => document.querySelector(s);
  // one quiet colour per chapter for the card's top edge (same hue family as the site accent)
  const HUES = ["#5b8a5a", "#b07a2e", "#a2553f", "#6d6a9a", "#3f7f8f", "#8a6d4f", "#9a7d3a", "#a4587a"];
  const rating = (r) => Ratings.get(`recipes:${r.id}`) || {}; // saved under the permanent id, not the shown number
  const open = new Set(); // recipe ids whose "Har vi lagat den?" box (date + notes) is open

  $("#chips").addEventListener("click", (e) => {
    const b = e.target.closest(".chip"); if (!b) return;
    state.chapter = b.dataset.c === "" ? null : +b.dataset.c; renderAll();
  });
  $("#q").addEventListener("input", (e) => { state.q = e.target.value.trim().toLowerCase(); render(); });
  $("#f-new").addEventListener("change", (e) => { state.fresh = e.target.checked; render(); });

  function visible(r) {
    const x = L10N(r);
    if (state.chapter !== null && r.chapter !== state.chapter) return false;
    if (state.fresh && rating(r).stars) return false;
    if (state.q && ![x.title, x.description, (x.keywords || []).join(" "), r.creator].join(" ").toLowerCase().includes(state.q)) return false;
    return true;
  }

  function card(r) {
    const x = L10N(r), v = rating(r);
    const meta = [x.time && `${t("time")}: ${x.time}`, x.servings && `${t("serves")}: ${x.servings}`].filter(Boolean);
    const who = [r.creator, r.platform].filter(Boolean).join(" · ");
    return `<article class="card" id="r${r.n}" style="--chapter:${HUES[r.chapter % HUES.length]}">
      ${r.video_only ? `<span class="card__tag">${esc(t("video_only"))}</span>` : ""}
      <h3>${esc(x.title)}</h3>
      ${x.description ? `<p>${esc(x.description)}</p>` : ""}
      ${meta.length ? `<div class="card__meta">${meta.map((m) => `<span>${esc(m)}</span>`).join("")}</div>` : ""}
      ${who ? `<div class="card__meta card__by">${esc(t("by", { who }))}</div>` : ""}
      <div class="card__foot">
        ${r.link ? `<a class="btn" href="${esc(r.link)}" target="_blank" rel="noopener">${esc(t("open_recipe"))} ↗</a>` : "<span></span>"}
        <span class="card__stars" role="radiogroup" aria-label="${esc(t("cooked_it"))}">${[1, 2, 3, 4, 5].map((i) =>
          `<button class="${i <= (v.stars || 0) ? "on" : ""}" data-id="${r.id}" data-s="${i}" role="radio" aria-checked="${i === v.stars}" aria-label="${esc(t("rate", { n: i }))}">★</button>`).join("")}</span>
      </div>
      <div class="card__notes">
        <button class="linkbtn" data-notes="${r.id}" aria-expanded="${open.has(r.id)}">${esc(t("notes"))}${v.note ? " ✎" : ""}${v.date ? ` · ${esc(v.date)}` : ""}</button>
        <span class="status" data-status="${r.id}"></span>
      </div>
      ${open.has(r.id) ? `<div class="card__rating" data-box="${r.id}"></div>` : ""}</article>`;
  }

  function render() {
    const shown = DATA.recipes.filter(visible);
    $("#out").innerHTML = DATA.chapters.map((c, ci) => {
      const rs = shown.filter((r) => r.chapter === ci); if (!rs.length) return "";
      return `<h2 class="label rec__chapter">${esc(L10N(c).title)} · ${rs.length}</h2><div class="cards">${rs.map(card).join("")}</div>`;
    }).join("") || `<p class="empty">${esc(t("no_match"))}</p>`;
    // open boxes are rebuilt from the saved rating after every render
    document.querySelectorAll("[data-box]").forEach((el) =>
      el.replaceWith(ratingBox(`recipes:${el.dataset.box}`, t("cooked_it"), t("notes_ph_recipe"))));
  }
  // tap a star to rate "have we made it?"; tap the same star again to clear
  $("#out").addEventListener("click", async (e) => {
    const nb = e.target.closest("[data-notes]");
    if (nb) { const id = +nb.dataset.notes; open.has(id) ? open.delete(id) : open.add(id); render(); return; }
    const b = e.target.closest(".card__stars button"); if (!b) return;
    const key = `recipes:${b.dataset.id}`, old = Ratings.get(key) || {};
    const stars = +b.dataset.s === old.stars ? 0 : +b.dataset.s;
    try { await Ratings.set(key, { ...old, stars, date: old.date || new Date().toISOString().slice(0, 10) }); }
    catch (err) { const st = document.querySelector(`[data-status="${b.dataset.id}"]`); if (st) st.textContent = t("save_failed"); }
  });
  Ratings.listeners.push(render);

  function renderAll() {
    $("#title").textContent = L10N(DATA).title;
    $("#sub").textContent = t("recipes_sub", { n: DATA.recipes.length });
    document.title = `${L10N(DATA).short} · Elin's lists`;
    $("#chips").innerHTML = [`<button class="chip" data-c="" aria-pressed="${state.chapter === null}">${esc(t("all"))}</button>`]
      .concat(DATA.chapters.map((c, i) => `<button class="chip" data-c="${i}" aria-pressed="${state.chapter === i}">${esc(L10N(c).title)}</button>`)).join("");
    render();
  }
  onLang.push(renderAll); renderAll();
})();
