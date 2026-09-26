#!/usr/bin/env python3
"""Copy the public part of the recipe book into lists/recipes/.

    python3 tools/import_recipes.py [path/to/recept]

Public = credit and link: title (sv/en), chapter, creator, platform, link to the original, servings and time,
whether the full recipe is written out or only shown in the video. NOT copied: the creators' own text
(intro, ingredients, method, tips) and their photos. The short description in each language is our own
and lives only here (lists/recipes/items/NNN.json -> "sv"/"en" -> "description"); re-importing keeps it.
"""
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
BOOK = Path(sys.argv[1] if len(sys.argv) > 1 else REPO.parent / "recept").resolve()
OUT = REPO / "lists" / "recipes"
PLATFORM = {"instagram": "Instagram", "facebook": "Facebook", "web": "Web", "none": ""}


def read(p):
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else {}


def main():
    recipes = {r["id"]: r for r in read(BOOK / "recipes.json")}
    cats = read(BOOK / "categories.json")
    (OUT / "items").mkdir(parents=True, exist_ok=True)
    n, no_desc = 0, []
    chapters = []
    for ci, sec in enumerate(cats["sections"]):
        chapters.append(dict(sv=dict(title=sec["title"], intro=sec.get("intro", "")),
                             en=dict(title=sec.get("title_en", sec["title"]), intro=sec.get("intro_en", ""))))
        for rid in sec["ids"]:
            if rid in cats.get("exclude", []) or rid not in recipes:
                continue
            n += 1
            r = recipes[rid]
            sv, en = read(BOOK / "translated" / f"{rid:03d}.json"), read(BOOK / "english" / f"{rid:03d}.json")
            path = OUT / "items" / f"{rid:03d}.json"
            old = read(path)
            full = bool(sv.get("steps")) and any(g.get("items") for g in sv.get("ingredients", []))
            item = dict(
                id=rid, n=n, chapter=ci, creator=r.get("author") or "", platform=PLATFORM.get(r.get("source"), ""),
                link=r.get("canonical") or r.get("url") or "", video_only=not full,
                original_title=sv.get("original_title", ""),
                sv=dict(title=sv.get("title") or r["title"], servings=sv.get("servings", ""), time=sv.get("time", ""),
                        description=old.get("sv", {}).get("description", ""), keywords=old.get("sv", {}).get("keywords", [])),
                en=dict(title=en.get("title") or sv.get("title") or r["title"], servings=en.get("servings", ""), time=en.get("time", ""),
                        description=old.get("en", {}).get("description", ""), keywords=old.get("en", {}).get("keywords", [])),
            )
            if not (item["sv"]["description"] and item["en"]["description"]):
                no_desc.append(rid)
            path.write_text(json.dumps(item, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    lst = read(OUT / "list.json")
    lst["chapters"] = chapters
    (OUT / "list.json").write_text(json.dumps(lst, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{n} recipes imported from {BOOK}; without our own description: {len(no_desc)}")


if __name__ == "__main__":
    main()
