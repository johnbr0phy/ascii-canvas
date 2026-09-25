# Square 1080x1080 crop for X: per-shot pan-and-scan from the shot table's `focus`
import json, subprocess, os
from PIL import Image
shots = json.loads(subprocess.check_output(['node', '-e', "const {SHOTS}=require('./src/shots.js');console.log(JSON.stringify(SHOTS))"]))
os.makedirs('out/tmp/sq', exist_ok=True)
files = sorted(os.listdir('frames'))
for f in files:
    i = int(f[:5]); t = i / 12
    s = next((s for s in shots if t < s['end']), shots[-1])
    cx = int(s['focus'] * 1920); x0 = max(0, min(1920 - 1080, cx - 540))
    Image.open('frames/' + f).crop((x0, 0, x0 + 1080, 1080)).save('out/tmp/sq/' + f, quality=93)
print('square frames', len(files))
