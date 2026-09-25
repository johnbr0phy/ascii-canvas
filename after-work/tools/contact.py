# python3 tools/contact.py out.png img1 img2 ... (3 columns, labelled)
import sys
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
cols = 3 if len(files) > 4 else 2
w, h = (640, 360) if cols == 3 else (960, 540)
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * h), (20, 20, 20))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    x, y = (i % cols) * w, (i // cols) * h
    sheet.paste(im, (x, y))
    lab = f.split('/')[-1].replace('f_', '').replace('.png', '')
    d.rectangle([x, y, x + 8 * len(lab) + 8, y + 16], fill=(0, 0, 0)); d.text((x + 4, y + 2), lab, fill=(255, 255, 0))
sheet.save(out)
