from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def font(size):
    return ImageFont.truetype(FONT, size)

# Landing page: replace the two v0.1 labels only.
p = ROOT / "public/screenshots/landing-page.png"
im = Image.open(p).convert("RGBA")
d = ImageDraw.Draw(im)
d.rectangle((208, 20, 242, 38), fill=(10, 9, 9, 255))
d.text((212, 22), "v0.2.0", font=font(11), fill=(112, 109, 118, 255))
d.rectangle((125, 156, 238, 173), fill=(37, 30, 18, 255))
d.text((127, 157), "V0.2.0 · FOUNDATION", font=font(11), fill=(236, 171, 54, 255))
im.save(p, optimize=True)

# Dashboard: replace the v0.1 label only.
p = ROOT / "public/screenshots/overview-dashboard.png"
im = Image.open(p).convert("RGBA")
d = ImageDraw.Draw(im)
d.rectangle((109, 20, 140, 38), fill=(17, 17, 17, 255))
d.text((113, 22), "v0.2.0", font=font(11), fill=(112, 109, 118, 255))
im.save(p, optimize=True)
