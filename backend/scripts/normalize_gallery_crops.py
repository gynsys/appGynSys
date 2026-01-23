"""
Script to normalize gallery image crop data from pixel-based `croppedArea` to percent-based values.

Usage:
  # Dry-run (default): show what would change
  python backend/scripts/normalize_gallery_crops.py

  # Apply changes to DB
  python backend/scripts/normalize_gallery_crops.py --apply

The script requires Pillow (PIL) to read image natural dimensions. Install with:
  pip install Pillow

It will iterate all GalleryImage rows where `crop.croppedArea` looks like pixel values
(i.e., width > 100) and convert them to percent relative to the image natural size.
"""

import argparse
import json
from pathlib import Path
from pprint import pprint

from app.db.base import SessionLocal
from app.db.models.gallery import GalleryImage
from app.core.config import settings

try:
    from PIL import Image
except Exception as e:
    raise SystemExit("Pillow is required to run this script. Install with: pip install Pillow")


def to_percent_area(px_area, natural_w, natural_h):
    """Convert a px-based area dict {x,y,width,height} to percent-based."""
    return {
        "x": (px_area.get("x", 0) / natural_w) * 100,
        "y": (px_area.get("y", 0) / natural_h) * 100,
        "width": (px_area.get("width", 0) / natural_w) * 100,
        "height": (px_area.get("height", 0) / natural_h) * 100,
    }


def main(apply: bool = False):
    db = SessionLocal()
    uploads_dir = Path(settings.UPLOAD_DIR).resolve()

    images = db.query(GalleryImage).all()
    to_update = []

    for img in images:
        if not img.crop:
            continue
        ca = img.crop.get("croppedArea") if isinstance(img.crop, dict) else None
        if not ca:
            continue
        # Heuristic: if width > 100, we assume px-based crop
        try:
            w = float(ca.get("width", 0))
        except Exception:
            continue
        if w <= 100:
            # already percent-based
            continue

        # Build file path
        image_url = (img.image_url or "").strip()
        # image_url may be like "/uploads/gallery/filename.jpg" or "uploads/gallery/..." or "/gallery/..."
        image_rel = image_url.lstrip('/\\')
        # If the URL included the 'uploads/' prefix, remove it because uploads_dir already points to uploads/
        if image_rel.startswith('uploads/'):
            image_rel = image_rel[len('uploads/'):]
        image_path = uploads_dir / image_rel
        if not image_path.exists():
            print(f"[WARN] File not found for image id={img.id}: {image_path}")
            continue

        # Read natural size
        try:
            with Image.open(image_path) as im:
                natural_w, natural_h = im.size
        except Exception as e:
            print(f"[ERROR] Failed to open image id={img.id} path={image_path}: {e}")
            continue

        percent_area = to_percent_area(ca, natural_w, natural_h)
        # Round to 4 decimals
        percent_area = {k: round(v, 6) for k, v in percent_area.items()}

        print(f"Image id={img.id} file={image_path.name} natural={natural_w}x{natural_h}")
        print("  before croppedArea:", ca)
        print("  after percentArea:", percent_area)

        to_update.append((img, percent_area))

    if not to_update:
        print("No legacy pixel-based crops found.")
        return

    if not apply:
        print("Dry-run complete. To apply changes run with --apply")
        return

    # Apply updates
    print("Applying updates...")
    for (img, percent_area) in to_update:
        crop = img.crop or {}
        crop["croppedArea"] = percent_area
        img.crop = crop
        db.add(img)
        print(f"Updated image id={img.id}")

    db.commit()
    print("Done. Committed changes to DB.")


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true', help='Apply changes to DB (default is dry-run)')
    args = parser.parse_args()
    main(apply=args.apply)
