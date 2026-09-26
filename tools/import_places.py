#!/usr/bin/env python3
"""Copy the public part of the places guide into lists/places/.

    python3 tools/import_places.py [path/to/places-by-the-water]

Reads the book's data/NNN.json + chapters.json (same numbering as the printed guide) and writes
lists/places/items/NNN.json with a Swedish block ("sv") and keeps any English block ("en") already there.
Left out on purpose (public site): photos from the places' websites and quotes from reviewers.
If the Swedish text changed since an English translation was made, the item is listed as stale.
"""
import hashlib
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
BOOK = Path(sys.argv[1] if len(sys.argv) > 1 else REPO.parent / "places-by-the-water").resolve()
OUT = REPO / "lists" / "places"
sys.path.insert(0, str(BOOK))
from build import load, chapters, maps_url  # noqa: E402  (the book's own loader and ordering)

TEXT = ("name", "kind", "area", "tagline", "description", "season", "best_for", "good_to_know", "review_summary")


def fingerprint(block):
    return hashlib.sha1(json.dumps([block.get(k) for k in TEXT], ensure_ascii=False).encode()).hexdigest()[:12]


def main():
    places, _ = load()
    sections = chapters(places)
    (OUT / "items").mkdir(parents=True, exist_ok=True)
    stale, n = [], 0
    for ci, (ch, ps) in enumerate(sections):
        for p in ps:
            n += 1
            path = OUT / "items" / f"{p['id']:03d}.json"
            old = json.loads(path.read_text()) if path.exists() else {}
            rv = p.get("reviews") or {}
            sv = dict(name=p["name"], kind=p.get("kind", ""), area=p.get("area", ""), tagline=p.get("tagline", ""),
                      description=p.get("description", ""), season=p.get("season", ""), best_for=p.get("best_for", ""),
                      good_to_know=p.get("good_to_know", []), review_summary=rv.get("summary", ""))
            item = dict(
                id=p["id"], n=n, chapter=ci, lat=p["lat"], lon=p["lon"], km=p["distance_km"], status=p.get("status"),
                price=p.get("price"), website=p.get("website", ""), maps=maps_url(p), address=p.get("address", ""),
                scores=[dict(site=s["site"], rating=s["rating"], scale=s.get("scale", 5), count=s.get("count"))
                        for s in rv.get("sources", []) if s.get("rating") is not None],
                sv=sv, en=old.get("en", {}),
            )
            if item["en"] and item["en"].get("_from") != fingerprint(sv):
                stale.append(f'{n} {p["name"]}')
            path.write_text(json.dumps(item, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    cfg = json.loads((BOOK / "chapters.json").read_text())
    old_list = json.loads((OUT / "list.json").read_text()) if (OUT / "list.json").exists() else {}
    old_en = {c["sv"]["title"]: c.get("en", {}) for c in old_list.get("chapters", [])}
    by_title = {c["title"]: c for c in cfg["chapters"]}
    lst = dict(old_list, chapters=[dict(
        sv=dict(title=ch["title"], short=by_title[ch["title"]].get("short", ch["title"]), intro=ch.get("intro", "")),
        en=old_en.get(ch["title"], {})) for ch, _ in sections])
    (OUT / "list.json").write_text(json.dumps(lst, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    missing = [f.stem for f in sorted((OUT / "items").glob("*.json")) if not json.loads(f.read_text()).get("en")]
    print(f"{n} places imported from {BOOK}")
    print(f"missing English: {len(missing)}" + (f" ({', '.join(missing)})" if missing else ""))
    if stale:
        print("English out of date (Swedish changed since translation):", "; ".join(stale))


if __name__ == "__main__":
    main()
