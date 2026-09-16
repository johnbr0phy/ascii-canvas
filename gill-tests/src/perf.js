/* Timing and loop-seam harness. Rewrites a built film with a measuring tail,
   runs it in headless chrome and prints the numbers.
   usage: node src/perf.js 01-shopping-constellation.html 14.0 */
var fs = require('fs'), path = require('path'), cp = require('child_process');
var film = process.argv[2], dur = parseFloat(process.argv[3] || '14');
var src = fs.readFileSync(path.join(__dirname, '..', film), 'utf8');
var tail = [
  '(function () {',
  '  var out = [], n = 30, i;',
  '  window.draw(0.001);',                     /* first frame pays the bake */
  '  var t0 = performance.now();',
  '  for (i = 0; i < n; i++) window.draw(i / n * ' + dur + ');',
  '  var per = (performance.now() - t0) / n;',
  '  var cv = document.getElementById(\'c\'), X = cv.getContext(\'2d\');',
  '  window.draw(0);',
  '  var a = X.getImageData(0, 0, 1080, 1080).data;',
  '  window.draw(' + dur + ' - 0.0001);',
  '  var b = X.getImageData(0, 0, 1080, 1080).data;',
  '  var mx = 0, sum = 0;',
  '  for (i = 0; i < a.length; i++) { var d = Math.abs(a[i] - b[i]); if (d > mx) mx = d; sum += d; }',
  '  out.push(\'PERF ms/frame=\' + per.toFixed(1) + \' seam max=\' + mx + \' mean=\' + (sum / a.length).toFixed(4));',
  '  document.title = out.join(\' | \');',
  '  document.body.appendChild(document.createTextNode(out.join(\' | \')));',
  '})();'
].join('\n');
var page = src.replace(/\/\* auto-start[\s\S]*?\}\)\(\);/, tail);
fs.writeFileSync('/tmp/perf-page.html', page);
var prof = fs.mkdtempSync('/tmp/prof-');
var res = '';
try {
  res = cp.execSync('timeout 90 google-chrome --headless=new --disable-gpu --no-sandbox' +
    ' --user-data-dir=' + prof + ' --virtual-time-budget=25000 --window-size=1080,1080' +
    ' --dump-dom file:///tmp/perf-page.html 2>/dev/null', { maxBuffer: 1 << 28 }).toString();
} catch (e) { res = (e.stdout || '').toString(); }
var m = res.match(/PERF[^<]*/);
console.log(film, m ? m[0] : 'NO RESULT');
