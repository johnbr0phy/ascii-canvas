# python3 tools/review.py S01 S09  -> out/review_S01_S09.png : start/mid/end of each shot from frames/
import sys, json, subprocess
from PIL import Image, ImageDraw
shots = json.loads(subprocess.check_output(['node', '-e', "const {SHOTS}=require('./src/shots.js');console.log(JSON.stringify(SHOTS))"]))
ids = [s['id'] for s in shots]
a, b = ids.index(sys.argv[1]), ids.index(sys.argv[2])
sel = shots[a:b + 1]
w, h = 560, 315
sheet = Image.new('RGB', (w * 3, h * len(sel)), (0, 0, 0)); d = ImageDraw.Draw(sheet)
for r, s in enumerate(sel):
    for c, t in enumerate([s['start'] + 0.15, s['start'] + s['dur'] * 0.5, s['end'] - 0.15]):
        f = int(t * 12 + 1e-6)
        im = Image.open('frames/%05d.jpg' % f).resize((w, h))
        sheet.paste(im, (c * w, r * h))
        d.rectangle([c * w, r * h, c * w + 110, r * h + 14], fill=(0, 0, 0)); d.text((c * w + 3, r * h + 1), '%s %.1fs' % (s['id'], t - s['start']), fill=(255, 255, 0))
sheet.save('out/review_%s_%s.png' % (sys.argv[1], sys.argv[2]))
