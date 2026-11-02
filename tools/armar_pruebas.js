/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.

   Writes tests/run.html, the page that runs every test in the browser (also
   with a double click: the references are .js files, not JSON). It lists the
   engines of tests/files.json, every tests/validacion/ref_*.js and every
   tests/unit_*.js, in the same order as tests/run-node.js.

       node tools/armar_pruebas.js */
'use strict';
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const L = require(path.join(root, 'tests', 'files.json'));
const refs = fs.readdirSync(path.join(root, 'tests', 'validacion')).filter(f => /^ref_.*\.js$/.test(f)).sort().map(f => 'validacion/' + f);
const units = fs.readdirSync(path.join(root, 'tests')).filter(f => /^unit_.*\.js$/.test(f)).sort();
const tags = ['harness.js'].concat(L.engines.map(f => '../' + f), refs, units).map(s => `<script src="${s}"></script>`).join('\n');
const html = `<!DOCTYPE html>
<!-- PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
     Written by tools/armar_pruebas.js. -->
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PostHarvestPro — pruebas</title>
<link rel="stylesheet" href="../css/labg-base.css">
<style>
  body { font-family: system-ui, sans-serif; margin: 0; background: #FBF7F1; color: #1C150E; }
  main { max-width: 1100px; margin: 0 auto; padding: 24px 20px 60px; }
  h1 { font-size: 1.5rem; margin: 0 0 4px; } .sub { color: #5D5247; margin: 0 0 18px; }
  .sum { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin: 0 0 18px; }
  .sum div { background: #fff; border: 1px solid #EADFD1; border-radius: 12px; padding: 10px 12px; }
  .sum b { display: block; font-size: 1.4rem; } .ok { color: #1d6b34; } .bad { color: #a82c22; }
  table { border-collapse: collapse; width: 100%; font-size: 0.85rem; background: #fff; }
  th, td { padding: 6px 10px; border-bottom: 1px solid #EADFD1; text-align: left; } td.n { text-align: right; font-variant-numeric: tabular-nums; }
  details { margin: 2px 0; } pre { white-space: pre-wrap; font-size: 0.78rem; color: #a82c22; margin: 4px 0 0; }
</style>
</head>
<body>
<main>
  <h1>PostHarvestPro — pruebas unitarias y validación</h1>
  <p class="sub">Cada comparación lleva su tolerancia escrita en la prueba. Las referencias de R están en <code>validacion/ref_*.js</code>; cómo se obtuvieron, en <code>validacion/LEEME_*.md</code>.</p>
  <div class="sum" id="summary">Corriendo…</div>
  <div id="detail"></div>
</main>
${tags}
<script>
(function () {
  const t0 = performance.now();
  const res = PHTest.run(), s = PHTest.summary(res);
  const ms = Math.round(performance.now() - t0);
  const ok = !s.failedTests;
  document.getElementById('summary').innerHTML =
    '<div><span>Resultado</span><b class="' + (ok ? 'ok' : 'bad') + '">' + (ok ? 'Todo pasa' : s.failedTests + ' fallan') + '</b></div>' +
    '<div><span>Pruebas</span><b>' + s.tests + '</b></div><div><span>Comparaciones</span><b>' + s.comparisons.toLocaleString('es-MX') + '</b></div>' +
    '<div><span>Comparaciones fallidas</span><b class="' + (s.failedComparisons ? 'bad' : 'ok') + '">' + s.failedComparisons + '</b></div><div><span>Tiempo</span><b>' + (ms / 1000).toFixed(1) + ' s</b></div>';
  let h = '<table><thead><tr><th>Área</th><th>Prueba</th><th class="n">Comparaciones</th><th>Estado</th></tr></thead><tbody>';
  res.forEach(r => {
    const bad = r.fails.length || r.error;
    h += '<tr><td>' + r.area + '</td><td>' + r.name.replace(/&/g, '&amp;').replace(/</g, '&lt;') + (bad ? '<details><summary>ver</summary><pre>' + (r.error || r.fails.slice(0, 30).join(String.fromCharCode(10))).replace(/</g, '&lt;') + '</pre></details>' : '') + '</td><td class="n">' + r.n + '</td><td class="' + (bad ? 'bad' : 'ok') + '">' + (bad ? 'falla' : 'pasa') + '</td></tr>';
  });
  document.getElementById('detail').innerHTML = h + '</tbody></table>';
  document.title = (ok ? '✓ ' : '✗ ') + document.title;
})();
</script>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'tests', 'run.html'), html);
fs.writeFileSync(path.join(root, 'tests', 'index.html'), '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=run.html"><title>PostHarvestPro — pruebas</title></head><body><a href="run.html">Pruebas</a></body></html>\n');
console.log('tests/run.html:', refs.length, 'referencias,', units.length, 'archivos de pruebas.');
