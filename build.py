#!/usr/bin/env python3
"""Build the GitHub Pages site into docs/ from src/ (pages, scripts, styles) and lists/ (content).

    python3 build.py

No dependencies beyond Python 3. docs/ is what GitHub Pages serves (Settings > Pages > main /docs).
"""
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
SRC, LISTS, DOCS = ROOT / "src", ROOT / "lists", ROOT / "docs"

COVERS = {  # credited on the home page; photo under CC BY 2.0, painting in the public domain
    "places": dict(src="assets/covers/places.jpg", pos="72% 50%", credit=dict(
        what=dict(sv="Nybrokajen i soluppgång", en="Nybrokajen at sunrise"), who="chas B", license="CC BY 2.0",
        license_url="https://creativecommons.org/licenses/by/2.0/",
        source="https://commons.wikimedia.org/wiki/File:Nybrokajen_sunrise_(45237265042).jpg")),
    "recipes": dict(src="assets/covers/recipes.jpg", pos="50% 50%", credit=dict(
        what=dict(sv="William Morris, Fruit (1866)", en="William Morris, Fruit (1866)"), who="", license="Public domain",
        license_url="", source="https://commons.wikimedia.org/wiki/File:Morris_Fruit_wallpaper_c_1866.jpg")),
}


def read(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def write(p, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def items(slug):
    return sorted((read(f) for f in (LISTS / slug / "items").glob("*.json")), key=lambda x: x["n"])


def places():
    meta, out = read(LISTS / "places/list.json"), []
    for src in items("places"):
        p = dict(src)  # "id" is permanent (ratings are saved under it); "n" is the number shown, which can shift
        p["en"] = {k: v for k, v in src.get("en", {}).items() if not k.startswith("_")}
        # free photo, if one was found: lists/places/photos/<book id>.json + .jpg
        meta_file = LISTS / "places/photos" / f"{src['id']:03d}.json"
        if meta_file.exists():
            ph = read(meta_file)
            dst = f"photos/places/{src['id']:03d}.jpg"  # by permanent id, so renumbering never renames files
            (DOCS / dst).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy(LISTS / "places" / ph["file"], DOCS / dst)
            p["photo"] = dict(ph, file=dst)
        out.append(p)
    return dict(sv=meta["sv"], en=meta["en"], chapters=meta["chapters"], places=out)


def recipes():
    meta = read(LISTS / "recipes/list.json")
    out = items("recipes")
    return dict(sv=meta["sv"], en=meta["en"], chapters=meta["chapters"], recipes=out)


def main():
    if DOCS.exists():
        shutil.rmtree(DOCS)
    shutil.copytree(SRC, DOCS)
    (DOCS / ".nojekyll").write_text("")
    pl = places()
    rc = recipes()
    write(DOCS / "data/places.json", pl)
    write(DOCS / "data/recipes.json", rc)
    write(DOCS / "data/lists.json", [
        dict(slug="places", sv=pl["sv"], en=pl["en"], count=len(pl["places"]), chapters=len(pl["chapters"]), cover=COVERS["places"]),
        dict(slug="recipes", sv=rc["sv"], en=rc["en"], count=len(rc["recipes"]), chapters=len(rc["chapters"]), cover=COVERS["recipes"]),
    ])
    missing_en = [p["n"] for p in pl["places"] if not p["en"]] + [r["n"] for r in rc["recipes"] if not r["en"].get("description")]
    photos = sum(1 for p in pl["places"] if p.get("photo"))
    print(f"docs/ built: {len(pl['places'])} places ({photos} with a free photo), {len(rc['recipes'])} recipes; missing English: {missing_en or 'none'}")


if __name__ == "__main__":
    main()
