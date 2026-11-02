/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.

   The test bench shared by tests/run.html (in the browser) and tests/run-node.js
   (from the command line). A test file registers its cases with
       TEST('area', 'what it checks', a => { a.close(x, 1.234, 1e-6, 'label'); … });
   and every assertion counts as one comparison. Tolerances are always written
   in the test: absolute (close), relative (rel) or exact (eq). */
(function (g) {
  'use strict';
  const H = { tests: [] };
  g.TEST = (area, name, fn) => H.tests.push({ area, name, fn });

  function fmt(v) {
    if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toPrecision(10);
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }
  function asserter(rec) {
    const fail = (label, msg) => { rec.fails.push((label ? label + ': ' : '') + msg); };
    const a = {
      /* |actual − expected| ≤ tol */
      close(actual, expected, tol, label) {
        rec.n++;
        if (expected === null || (typeof expected === 'number' && Number.isNaN(expected))) {
          if (!(actual === null || Number.isNaN(actual) || actual === undefined)) fail(label, 'expected NaN/null, got ' + fmt(actual));
          return;
        }
        if (!isFinite(expected) && actual === expected) return;
        if (!(Math.abs(actual - expected) <= tol)) fail(label, fmt(actual) + ' vs ' + fmt(expected) + ' (|Δ| = ' + fmt(Math.abs(actual - expected)) + ' > ' + tol + ')');
      },
      /* |actual − expected| ≤ rtol·max(|expected|, floor) */
      rel(actual, expected, rtol, label, floor) {
        rec.n++;
        const s = Math.max(Math.abs(expected), floor == null ? 1e-300 : floor);
        if (!(Math.abs(actual - expected) <= rtol * s)) fail(label, fmt(actual) + ' vs ' + fmt(expected) + ' (rel ' + fmt(Math.abs(actual - expected) / s) + ' > ' + rtol + ')');
      },
      eq(actual, expected, label) {
        rec.n++;
        const A = typeof actual === 'object' ? JSON.stringify(actual) : actual;
        const E = typeof expected === 'object' ? JSON.stringify(expected) : expected;
        if (A !== E) fail(label, fmt(actual) + ' !== ' + fmt(expected));
      },
      ok(cond, label) { rec.n++; if (!cond) fail(label, 'false'); },
      /* element by element, absolute tolerance */
      arr(actual, expected, tol, label) {
        if (!actual || actual.length !== expected.length) { rec.n++; fail(label, 'length ' + (actual && actual.length) + ' vs ' + expected.length); return; }
        for (let i = 0; i < expected.length; i++) a.close(actual[i], expected[i], tol, (label || '') + '[' + i + ']');
      },
      arrRel(actual, expected, rtol, label, floor) {
        if (!actual || actual.length !== expected.length) { rec.n++; fail(label, 'length ' + (actual && actual.length) + ' vs ' + expected.length); return; }
        for (let i = 0; i < expected.length; i++) a.rel(actual[i], expected[i], rtol, (label || '') + '[' + i + ']', floor);
      },
    };
    return a;
  }
  H.run = function (filter) {
    const out = [];
    for (const t of H.tests) {
      if (filter && t.area !== filter) continue;
      const rec = { area: t.area, name: t.name, n: 0, fails: [], ms: 0, error: null };
      const t0 = Date.now();
      try { t.fn(asserter(rec)); } catch (e) { rec.error = (e && e.stack) || String(e); }
      rec.ms = Date.now() - t0;
      out.push(rec);
    }
    return out;
  };
  H.summary = function (res) {
    const s = { tests: res.length, comparisons: 0, failedTests: 0, failedComparisons: 0, errors: 0, byArea: {} };
    res.forEach(r => {
      s.comparisons += r.n;
      s.failedComparisons += r.fails.length;
      if (r.fails.length || r.error) s.failedTests++;
      if (r.error) s.errors++;
      const A = s.byArea[r.area] || (s.byArea[r.area] = { tests: 0, comparisons: 0, failed: 0 });
      A.tests++; A.comparisons += r.n; if (r.fails.length || r.error) A.failed++;
    });
    return s;
  };
  g.PHTest = H;
})(typeof window !== 'undefined' ? window : globalThis);
