"""Generate real PNG app icons (gold 'J' mark on warm cream) for the PWA.

Outputs: frontend/icons/icon-{512,192,180,32}.png
Run once:  .venv/Scripts/python.exe tools/make_icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent.parent / "frontend" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

SIZES = {"icon-512.png": 512, "icon-192.png": 192, "icon-180.png": 180, "icon-32.png": 32}


def base_mark(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Rounded-square cream background
    radius = int(size * 0.22)
    d.rounded_rectangle([0, 0, size, size], radius=radius, fill=(250, 246, 238, 255))

    # Gold gradient fill approximated with horizontal bands
    top = (213, 171, 98)
    bottom = (143, 109, 43)
    inset = int(size * 0.06)
    r2 = int(size * 0.17)
    grad = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(inset, size - inset):
        t = (y - inset) / max(1, size - 2 * inset)
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,)
        gd.line([(inset, y), (size - inset, y)], fill=c)
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([inset, inset, size - inset, size - inset], radius=r2, fill=255)
    img.paste(grad, (0, 0), mask)

    # Letter J
    font = None
    for name in ("georgia.ttf", "times.ttf", "arial.ttf"):
        try:
            font = ImageFont.truetype(name, int(size * 0.62))
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()
    text = "J"
    bbox = d.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] - size * 0.02
    d.text((x, y), text, font=font, fill=(255, 253, 248, 255))
    return img


for fname, size in SIZES.items():
    base_mark(size).save(OUT / fname, "PNG")
    print("wrote", OUT / fname)
