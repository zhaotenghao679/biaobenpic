#!/usr/bin/env python3
import argparse
import json
import shutil
from pathlib import Path

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def pinyin_key(text):
    try:
        return text.encode("gbk", errors="ignore").hex()
    except Exception:
        return text.lower()


def category_sort_key(name):
    other = "\u5176\u4ed6"
    if name == other:
        return (1, "")
    return (0, pinyin_key(name))


def disease_sort_key(name):
    return (pinyin_key(name), name)


def iter_images(root):
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in IMG_EXTS:
            yield path


def derive_labels(root, path):
    rel = path.relative_to(root)
    parts = rel.parts
    if len(parts) >= 3:
        category = parts[0]
        disease = parts[1]
        rest = parts[2:]
    elif len(parts) == 2:
        category = parts[0]
        disease = parts[0]
        rest = parts[1:]
    elif len(parts) == 1:
        category = "\u5176\u4ed6"
        disease = parts[0]
        rest = parts[0:]
    else:
        category = "\u5176\u4ed6"
        disease = "\u5176\u4ed6"
        rest = []
    return category, disease, rest


def build_index(root, out_root):
    categories = {}
    total = 0
    for path in iter_images(root):
        category, disease, rest = derive_labels(root, path)
        rel = Path("images") / category / disease
        if rest:
            rel = rel.joinpath(*rest)
        else:
            rel = rel / path.name
        rel_str = str(rel).replace("\\", "/")
        categories.setdefault(category, {}).setdefault(disease, []).append(rel_str)
        total += 1

    category_list = []
    for category in sorted(categories.keys(), key=category_sort_key):
        disease_map = categories[category]
        diseases = []
        for disease in sorted(disease_map.keys(), key=disease_sort_key):
            images = sorted(disease_map[disease])
            diseases.append({"name": disease, "images": images})
        category_list.append({"name": category, "diseases": diseases})

    return {"total_images": total, "categories": category_list}


def copy_images(root, out_root):
    images_root = out_root / "images"
    for path in iter_images(root):
        category, disease, rest = derive_labels(root, path)
        dest_dir = images_root / category / disease
        if rest:
            dest_dir = dest_dir.joinpath(*rest[:-1])
            dest = dest_dir / rest[-1]
        else:
            dest = dest_dir / path.name
        dest.parent.mkdir(parents=True, exist_ok=True)
        if dest.exists() and dest.stat().st_size == path.stat().st_size:
            continue
        shutil.copy2(path, dest)


def main():
    default_root = "/home/zth/5\u6b21\u8bfe\u7ebf\u4e0a\u8003\u8bd5\u590d\u4e60\u56fe\u7247(1)"
    default_out = "/home/zth/disease_gallery_static"

    parser = argparse.ArgumentParser(description="Build static gallery for GitHub Pages")
    parser.add_argument("--root", default=default_root, help="image library root")
    parser.add_argument("--out", default=default_out, help="output directory")
    parser.add_argument("--no-copy", action="store_true", help="skip copying images")
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    out_root = Path(args.out).expanduser().resolve()
    out_root.mkdir(parents=True, exist_ok=True)
    (out_root / "data").mkdir(parents=True, exist_ok=True)

    if not args.no_copy:
        copy_images(root, out_root)

    index = build_index(root, out_root)
    index_path = out_root / "data" / "index.json"
    with index_path.open("w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=True, indent=2)
    print(f"index written: {index_path}")


if __name__ == "__main__":
    main()
