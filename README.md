# Elin's lists

Small, personal lists published as a website, in Swedish and English (UK):

- **Places by the water near Stockholm** (`/places/`): restaurants, cafes and places to stay within 50 km
  of Sergels torg, on an OpenStreetMap map.
- **Green favourites** (`/recipes/`): vegetarian recipes we want to cook, with our own short
  description and a link to each creator.

Live site: https://tablackmore.github.io/elinslists/

## How it fits together

```
lists/<list>/list.json         titles, blurbs and chapters, in "sv" and "en"
lists/<list>/items/NNN.json    one item per file, text in "sv" and "en" blocks
lists/places/photos/NNN.*      freely licensed photos from Wikimedia Commons + their credit
src/                           the pages, scripts and styles (hand-written, no framework)
build.py                       src/ + lists/ -> docs/
docs/                          what GitHub Pages serves (generated, but committed)
tools/import_*.py              refresh lists/ from the private book projects
```

```bash
python3 build.py                                     # rebuild docs/
cd docs && python3 -m http.server 8000               # preview at http://localhost:8000
```

GitHub Pages: Settings → Pages → Deploy from a branch → `main` / `docs`.

## Languages

Every page has an SV / EN switch in the header. The choice is remembered in the browser and carried in
links as `?lang=sv` or `?lang=en`, so a shared link opens in the same language. On a first visit the
browser's language decides (`pickLanguage()` in `src/assets/site.js`). UI text lives in the `I18N`
table in the same file; item text lives in each item's `sv` and `en` blocks. A missing English text
falls back to Swedish.

## Place categories

The type filter on the places page (Restaurant, Bar, Cafe, Places to stay, Sauna, Events) is worked out in
`build.py` (`CATEGORIES`) from each place's Swedish "kind", so "Restaurang & bar" counts as both. If a place
comes out wrong, give its item an explicit list, e.g. `"categories": ["cafe", "bar"]`.

## Ratings

"Have we been?" (places) and the stars on recipes work in two modes:

- **This browser only** (default): saved in local storage on that device.
- **Shared** between the two of us through a free Supabase project, when `src/assets/config.js` has a
  Supabase URL and key and you are signed in (e-mail link, no password). Ratings you saved in the
  browser before signing in are copied up the first time.

### Setting up shared ratings (once, about 5 minutes)

1. Create a free project at https://supabase.com (any name, region EU North / Stockholm if offered).
2. **SQL Editor → New query**: paste `supabase/schema.sql`, change the two e-mail addresses at the
   top to ours, and run it. It creates the `ratings` table, a private `members` list and row-level
   security so only members can read or write ratings.
3. **Authentication → Users → Add user → Send invitation** for both addresses. Then
   **Authentication → Sign In / Providers**: turn off "Allow new users to sign up".
4. **Authentication → URL Configuration**: Site URL `https://tablackmore.github.io/elinslists/`,
   and add redirect URLs `https://tablackmore.github.io/elinslists/**` and `http://localhost:8000/**`.
5. **Project Settings → API**: copy the Project URL and the `anon` / publishable key into
   `src/assets/config.js`, then `python3 build.py`, commit and push.

The anon key is designed to be public; what protects the ratings is the row-level security in
`schema.sql`. Never put the `service_role` / secret key in this repository.

## Where the content comes from, and copyright

This repository is public, so it only contains material we may publish:

- **Our own writing**: place descriptions, review summaries and practical notes were written for this
  list; recipe descriptions are our own short summaries. Ratings shown for places are numbers
  (Google, Tripadvisor, Thatsup, White Guide) with the source named.
- **Recipes are credited and linked, not copied.** The creators' ingredient lists, methods, captions
  and photos are not in this repository; each card links to the original.
- **Photos** are from Wikimedia Commons under public domain, CC0, CC BY or CC BY-SA, and every photo
  shows its author, licence and source link. A place without a free photo has none.
- **Covers** are public-domain museum works: Eugène Jansson, *Riddarfjärden, Stockholm* (1898,
  Nationalmuseum) and William Morris, *Fruit* (1866).
- **Maps**: © OpenStreetMap contributors, tiles from tile.openstreetmap.org under the OSM tile policy.

The printed books (full recipes, restaurant photos) are private and live outside this repository.

## Updating from the books

The books live next to this repo (`../places-by-the-water`, `../recept`). After changing them:

```bash
../places-by-the-water/.venv/bin/python tools/import_places.py   # keeps English + photos; lists stale translations
python3 tools/import_recipes.py                                    # keeps our descriptions
python3 build.py
```

A new place or recipe arrives with Swedish only; add its `en` block (and for recipes our own
`description`/`keywords` in both languages) before publishing.

## Adding a new list

1. `lists/<slug>/list.json` and `lists/<slug>/items/*.json` with `sv`/`en` blocks.
2. A page in `src/<slug>/` using `assets/site.js` (header, language, `t()`, `L10N()`, `ratingBox()`).
3. Add it to `data/lists.json` in `build.py` so it gets a card on the home page.
