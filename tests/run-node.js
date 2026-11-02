/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.

   Runs the same tests as tests/run.html, without a browser:
       node tests/run-node.js            (every area)
       node tests/run-node.js sensory    (one area)
   The engines and the tests run in one sandbox whose `window` is its global
   object, exactly as in the page. Exit code 1 if anything fails. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const LIST = require('./files.json');
const box = {};
box.window = box;
box.console = console;
vm.createContext(box);
const load = f => {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) return false;
  vm.runInContext(fs.readFileSync(p, 'utf8'), box, { filename: f });
  return true;
};
load('tests/harness.js');
LIST.engines.forEach(load);
/* every reference file written by the R scripts, then every unit file */
fs.readdirSync(path.join(root, 'tests', 'validacion')).filter(f => /^ref_.*\.js$/.test(f)).sort().forEach(f => load('tests/validacion/' + f));
fs.readdirSync(path.join(root, 'tests')).filter(f => /^unit_.*\.js$/.test(f)).sort().forEach(f => load('tests/' + f));
const res = box.PHTest.run(process.argv[2]);
const s = box.PHTest.summary(res);
res.forEach(r => {
  const bad = r.fails.length || r.error;
  if (bad || process.env.VERBOSE) console.log((bad ? '✗ ' : '✓ ') + r.area + ' · ' + r.name + ' (' + r.n + ', ' + r.ms + ' ms)');
  r.fails.slice(0, 12).forEach(f => console.log('    ' + f));
  if (r.fails.length > 12) console.log('    … ' + (r.fails.length - 12) + ' more');
  if (r.error) console.log('    ' + r.error.split('\n').slice(0, 4).join('\n    '));
});
Object.keys(s.byArea).forEach(k => { const A = s.byArea[k]; console.log(k.padEnd(14) + String(A.tests).padStart(4) + ' tests ' + String(A.comparisons).padStart(7) + ' comparisons ' + (A.failed ? A.failed + ' FAILED' : 'ok')); });
console.log('Total: ' + s.tests + ' tests, ' + s.comparisons + ' comparisons, ' + s.failedTests + ' failed tests, ' + s.failedComparisons + ' failed comparisons, ' + s.errors + ' errors.');
process.exit(s.failedTests ? 1 : 0);
