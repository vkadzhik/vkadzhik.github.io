# Downloads every CDN file referenced in content.py into /media so the site
# does not depend on the CDN (it is unreliable for visitors in Russia).
import os, re, sys, io, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
from content import CDN, IMG
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), "..")
OUT = os.path.join(ROOT, "media")
os.makedirs(OUT, exist_ok=True)
src = open(os.path.join(os.path.dirname(__file__), "content.py"), encoding="utf-8").read() + \
      open(os.path.join(os.path.dirname(__file__), "build.py"), encoding="utf-8").read()
ids = {i for i, _, _ in IMG.values()} | set(re.findall(r'"([0-9a-f-]{36})\.png"', src))
vids = set(re.findall(r'"([0-9a-f-]{36})\.mp4"', src))

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    return urllib.request.urlopen(req, timeout=120).read()

for i in sorted(ids):
    dst = os.path.join(OUT, i + ".webp")
    if os.path.exists(dst): continue
    im = Image.open(io.BytesIO(get(CDN + i + ".png")))
    im = im.convert("RGBA") if im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
    if im.width > 2000:
        im = im.resize((2000, round(im.height * 2000 / im.width)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=84, method=6)
    print("img", i, os.path.getsize(dst))
for v in sorted(vids):
    dst = os.path.join(OUT, v + ".mp4")
    if os.path.exists(dst): continue
    open(dst, "wb").write(get(CDN + v + ".mp4"))
    print("vid", v, os.path.getsize(dst))
