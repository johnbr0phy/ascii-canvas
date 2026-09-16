/* Inlines paint + motion + one film into a single self-contained page.
   The films have to be one file each with no assets, so the two shared
   layers are copied into all three rather than linked. Run: node src/build.js */
var fs = require('fs'), path = require('path');
var dir = path.join(__dirname);
var out = path.join(__dirname, '..');

var paint = fs.readFileSync(path.join(dir, 'paint.js'), 'utf8');
var motion = fs.readFileSync(path.join(dir, 'motion.js'), 'utf8');

var FILMS = [
  { parts: ['film01.assets.js', 'film01.time.js'], file: '01-shopping-constellation.html', title: 'A Shopping List, Mostly Kept' },
  { parts: ['film02.assets.js', 'film02.time.js'], file: '02-umbrella-argument.html', title: 'Two Umbrellas, Having Words' },
  { parts: ['film03.assets.js', 'film03.time.js'], file: '03-kettle-weather.html', title: 'The Kettle Makes Its Own Weather' }
];

var AUTOSTART = [
  '/* auto-start; ?t=SEC renders one frame and holds it, for frame review */',
  '(function () {',
  '  var q = new URLSearchParams(location.search);',
  '  if (q.has(\'t\')) { window.draw(parseFloat(q.get(\'t\')) || 0); return; }',
  '  var t0 = null;',
  '  function frame(now) {',
  '    if (t0 == null) t0 = now;',
  '    window.draw((now - t0) / 1000);',
  '    requestAnimationFrame(frame);',
  '  }',
  '  requestAnimationFrame(frame);',
  '})();'
].join('\n');

FILMS.forEach(function (f) {
  if (!f.parts.every(function (p) { return fs.existsSync(path.join(dir, p)); })) {
    console.log('skip ' + f.file + ' (parts missing)');
    return;
  }
  var film = f.parts.map(function (p) { return fs.readFileSync(path.join(dir, p), 'utf8').replace(/\s+$/, ''); }).join('\n');
  var html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8"/>',
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>',
    '<title>' + f.title + '</title>',
    '<style>',
    '  html,body{margin:0;height:100%;background:#0d0b0a;overflow:hidden}',
    '  body{display:flex;align-items:center;justify-content:center}',
    '  canvas{width:min(100vw,100vh);height:min(100vw,100vh);display:block;touch-action:none}',
    '</style>',
    '</head>',
    '<body>',
    '<canvas id="c" width="1080" height="1080"></canvas>',
    '<script>',
    paint.trim(),
    motion.trim(),
    film.trim(),
    AUTOSTART,
    '</' + 'script>',
    '</body>',
    '</html>',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(out, f.file), html);
  console.log(f.file, html.split('\n').length + ' lines');
});
