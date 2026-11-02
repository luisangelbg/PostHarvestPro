/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.

   Tests of the sensory evaluation engine (js/sensory.js): properties of the
   methods, and comparison with the reference values in
   tests/validacion/ref_sensory.js (written by the reference script in
   tests/validacion/).

   Tolerances, written in every assertion (LEEME_sensory.md explains them):
   - closed forms, exact binomial and hypergeometric sums, linear models:
     1e-12 absolute or 1e-10 relative (double precision; the references are
     printed with 15 significant digits);
   - Pc(d′) and its derivative against the high-precision recomputation
     (adaptive quadrature at 1e-12): 1e-12 and 1e-11;
   - Pc(d′) against the reference implementation: 1e-8 (it evaluates the
     triangle through a noncentral F law and the other integrals with a
     default tolerance; we measured differences up to 5e-9);
   - d′ against the reference implementation: 2e-4 (its root finder stops at
     a tolerance of 1.22e-4); against the high-precision root: 1e-8;
   - studentized-range quantiles: 1e-6 (the reference inverts the
     distribution with a secant method stopped at 1e-4);
   - grouping letters, critical values and sample sizes: exact.
   Each comparison with a reference is labelled "ref" (the published
   implementation) or "precise" (recomputed at high precision). */
(function () {
'use strict';
const S = () => window.Sens;
const NUM = () => window.Num;
const REF = () => (window.REF && window.REF.sensory) || null;
const num = v => (v === null || v === undefined) ? NaN : typeof v === 'string' ? (v === 'Inf' ? Infinity : v === '-Inf' ? -Infinity : NaN) : v;
const arr = v => v == null ? [] : Array.isArray(v) ? v : [v];
const nums = v => arr(v).map(num);
const mat = v => arr(v).map(r => nums(r));
function need(a) { const v = REF(); a.ok(!!v, 'reference values loaded (tests/validacion/ref_sensory.js)'); return v; }
/* relative comparison that also accepts an expected NaN */
function relN(a, x, e, rtol, label, floor) {
  if (!isFinite(e) || e !== e) a.close(x, e, 0, label);
  else a.rel(x, e, rtol, label, floor);
}
/* flip the sign of each column of `ours` to agree with `ref` (axes of a
   factorial analysis are defined up to sign); returns the signs */
function signsOf(ours, ref) {
  const K = ref[0].length, s = [];
  for (let k = 0; k < K; k++) {
    let d = 0;
    for (let i = 0; i < ref.length; i++) d += ours[i][k] * ref[i][k];
    s.push(d < 0 ? -1 : 1);
  }
  return s;
}
const flip = (M, s) => M.map(r => r.map((v, k) => v * s[k]));
/* A reference value that is itself measurably off the high-precision
   recomputation (by more than tol) is not used as a target: ours must then
   equal the precise value, and the label records the size of the reference
   error (these cases are listed in LEEME_sensory.md). */
function vsRef(a, x, ref, precise, tol, tolPrecise, label) {
  if (isFinite(ref) && isFinite(precise) && Math.abs(ref - precise) > tol)
    a.close(x, precise, tolPrecise, label + ' (ref off by ' + Math.abs(ref - precise).toExponential(2) + ': precise)');
  else a.close(x, ref, tol, label + ' ref');
}
function matClose(a, A, B, tol, label) {
  a.eq(A.length, B.length, label + ' rows');
  for (let i = 0; i < B.length; i++) a.arr(A[i].slice(0, B[i].length), B[i], tol, label + '[' + i + ']');
}

/* ====================================================================
   Properties (no reference needed)
   ==================================================================== */

TEST('sensory', 'psychometric functions: Pc(0) = pGuess, increasing, Pc(∞) = 1', a => {
  S().METHODS.forEach(m => {
    const pg = S().pGuess(m);
    a.close(S().pc(m, 0), pg, 0, m + ' Pc(0)');
    a.close(S().pc(m, Infinity), 1, 0, m + ' Pc(∞)');
    /* the integrals at d′ = 0 reproduce the guessing probability to rounding */
    a.close(S().pc(m, 1e-9), pg, 1e-9, m + ' Pc(0+)');
    let prev = pg, mono = true;
    for (let d = 0.05; d <= 6; d += 0.05) { const p = S().pc(m, d); if (!(p > prev)) mono = false; prev = p; }
    a.ok(mono, m + ' strictly increasing on (0, 6]');
  });
  /* 2-AFC is the normal law itself */
  [0.3, 1, 2.2].forEach(d => a.close(S().pc('twoAFC', d), NUM().pnorm(d / Math.SQRT2), 1e-15, '2-AFC Φ(d/√2) d=' + d));
});

TEST('sensory', 'd′ inverts Pc and the derivative matches central differences', a => {
  S().METHODS.forEach(m => {
    [0.2, 0.7, 1.3, 2.5, 4].forEach(d => {
      const p = S().pc(m, d);
      a.close(S().dprime(m, p), d, 1e-9, m + ' dprime(pc(' + d + '))');
      const h = 1e-5, fd = (S().pc(m, d + h) - S().pc(m, d - h)) / (2 * h);
      a.close(S().pcDeriv(m, d), fd, 1e-8, m + " Pc'(" + d + ')');
    });
    a.close(S().dprime(m, S().pGuess(m)), 0, 0, m + ' d′ at pGuess');
    a.close(S().dprime(m, 0.1), 0, 0, m + ' d′ below pGuess');
    a.close(S().dprime(m, 1), Infinity, 0, m + ' d′ at 1');
  });
});

TEST('sensory', 'discrim: internal consistency', a => {
  S().METHODS.forEach(m => {
    const pg = S().pGuess(m);
    const r = S().discrim(m, 27, 50);
    a.close(r.pd, (r.pc - pg) / (1 - pg), 1e-15, m + ' pd from pc');
    a.close(r.d, S().dprime(m, r.pc), 1e-15, m + ' d from pc');
    a.ok(r.ci.pc[0] <= r.pc && r.pc <= r.ci.pc[1], m + ' interval contains pc');
    a.ok(r.ci.d[0] <= r.d && r.d <= r.ci.d[1], m + ' interval contains d′');
    a.close(r.se.pd, r.se.pc / (1 - pg), 1e-15, m + ' se(pd)');
    /* more correct answers, smaller difference p-value */
    let prev = 1, mono = true;
    for (let x = 0; x <= 50; x += 5) { const p = S().discrim(m, x, 50).p; if (p > prev + 1e-15) mono = false; prev = p; }
    a.ok(mono, m + ' p decreasing in x');
    /* difference and similarity tails at the same pc0 add to 1 + P(X = x) */
    const dd = S().discrim(m, 20, 50, { pd0: 0.2 }), ss = S().discrim(m, 20, 50, { pd0: 0.2, test: 'similarity' });
    a.close(dd.p + ss.p, 1 + NUM().dbinom(20, 50, dd.pc0), 1e-12, m + ' tails');
  });
});

TEST('sensory', 'critical values, power and sample size: definitions', a => {
  [[20, 1 / 3, 0.05], [36, 1 / 2, 0.01], [100, 1 / 3, 0.1], [7, 1 / 2, 0.05]].forEach(([n, pg, al]) => {
    const B = NUM();
    const c = S().critical(pg, n, al);
    a.ok(B.pbinom(c - 1, n, pg, true) <= al && (c === 0 || B.pbinom(c - 2, n, pg, true) > al), 'difference x_c n=' + n);
    const cs = S().critical(pg, n, al, 'similarity', 0.4);
    const pc0 = pg + 0.4 * (1 - pg);
    a.ok((cs < 0 || B.pbinom(cs, n, pc0) <= al) && B.pbinom(cs + 1, n, pc0) > al, 'similarity x_c n=' + n);
    /* the size of the exact test never exceeds α */
    a.ok(S().power(pg, n, { pdA: 0 }, al) <= al + 1e-15, 'size ≤ α n=' + n);
  });
  S().METHODS.forEach(m => {
    const n = S().sampleSize(m, 0.85, { dA: 1.2 }, 0.05);
    a.ok(S().power(m, n, { dA: 1.2 }, 0.05) > 0.85, m + ' power at the sample size exceeds the target');
  });
  /* a similarity test that cannot reject has power 0 */
  a.close(S().power('triangle', 3, { pdA: 0 }, 0.05, 'similarity', 0.2), 0, 0, 'no rejection region');
});

TEST('sensory', 'binomial test: symmetry and limits', a => {
  for (let x = 0; x <= 15; x++) a.close(S().binomTest(x, 15, 0.5).p, S().binomTest(15 - x, 15, 0.5).p, 1e-14, 'symmetric x=' + x);
  a.close(S().binomTest(10, 20, 0.5).p, 1, 0, 'x = np gives 1');
  const r = S().binomTest(0, 12, 0.3, 'less');
  a.close(r.p, Math.pow(0.7, 12), 1e-15, 'P(X ≤ 0)');
  a.close(r.ci[0], 0, 0, 'one-sided lower limit');
  a.close(S().binomTest(12, 12, 0.5).ci[1], 1, 0, 'upper limit at x = n');
});

TEST('sensory', 'A–Not A: closed form and antisymmetry', a => {
  const r = S().aNotA(30, 50, 15, 50), B = NUM();
  a.close(r.d, B.qnorm(0.6) - B.qnorm(0.3), 1e-14, 'd′ = z(H) − z(F)');
  a.close(S().aNotA(15, 50, 30, 50).d, -r.d, 1e-14, 'antisymmetric');
  a.ok(!isFinite(S().aNotA(0, 50, 30, 50).d), 'no finite estimate at H = 0');
});

TEST('sensory', 'Cochran Q with two treatments is McNemar without correction; Friedman on 0/1 is Cochran', a => {
  const x = [1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1], y = [0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 0, 0];
  const q = S().cochranQ(x.map((v, i) => [v, y[i]]));
  const m = S().mcnemar(x, y, { correct: false });
  a.close(q.Q, m.statistic, 1e-12, 'Q = (b − c)²/(b + c)');
  const M = [[1, 0, 1], [1, 1, 1], [0, 0, 1], [1, 0, 0], [1, 0, 1], [0, 0, 0], [1, 1, 0], [1, 0, 1]];
  a.close(S().friedman(M).chi2, S().cochranQ(M).Q, 1e-12, 'Friedman (ties corrected) = Cochran');
  const t = S().mcnemar([[5, 6], [2, 7]]);
  a.close(t.statistic, (Math.abs(6 - 2) - 1) ** 2 / 8, 1e-15, 'table form, corrected');
});

TEST('sensory', 'grouping letters: hand-worked cases', a => {
  const allSig = [[1, 0.001, 0.001], [0.001, 1, 0.001], [0.001, 0.001, 1]];
  const none = [[1, 0.5, 0.5], [0.5, 1, 0.5], [0.5, 0.5, 1]];
  /* means 30 > 20 > 10: first ~ second, second ~ third, first ≠ third */
  const chain = [[1, 0.2, 0.01], [0.2, 1, 0.3], [0.01, 0.3, 1]];
  a.eq(S().letters([30, 20, 10], allSig), ['a', 'b', 'c'], 'all different');
  a.eq(S().letters([30, 20, 10], none), ['a', 'a', 'a'], 'none different');
  a.eq(S().letters([30, 20, 10], chain), ['a', 'ab', 'b'], 'chain');
  /* the order of the input does not matter: letters follow the means */
  a.eq(S().letters([10, 30, 20], [[1, 0.01, 0.3], [0.01, 1, 0.2], [0.3, 0.2, 1]]), ['b', 'a', 'ab'], 'unsorted input');
});

TEST('sensory', 'JAR levels, CATA with an attribute never checked, invalid discrimination data', a => {
  const rows = [];
  [1, 2, 2, 3, 4, 4, 2, 3].forEach((j, i) => rows.push({ consumer: i, product: 'A', attribute: 'sal', jar: j, liking: 5 + (j === 2 ? 1 : 0) }));
  let threw = false;
  try { S().jar(rows, { levels: 4 }); } catch (e) { threw = true; }
  a.ok(threw, 'an even number of levels needs an explicit centre');
  const r = S().jar(rows, { levels: 4, center: 2 });
  a.eq([r.results[0].nLow, r.results[0].nJar, r.results[0].nHigh], [1, 3, 4], 'centre given: counts');
  const cr = [];
  for (let c = 0; c < 6; c++) ['P1', 'P2', 'P3'].forEach((p, i) => cr.push({ consumer: c, product: p, a1: (c + i) % 2, a2: 0, a3: c % 3 === i ? 1 : 0 }));
  const t = S().cata(cr, { attributes: ['a1', 'a2', 'a3'] });
  a.close(t.perAttribute[1].Q, NaN, 0, 'never checked: Q undefined');
  a.eq(t.ca.col.names, ['a1', 'a3'], 'never checked: left out of the CA');
  const bad = S().discrim('triangle', 12, 10);
  a.ok(isNaN(bad.pc) && isNaN(bad.p) && bad.notes.length === 1, 'correct > total: NaN with a note');
});

TEST('sensory', 'hedonic: sums of squares add up, balanced case', a => {
  const rows = [];
  const rng = NUM().rng(7);
  for (let c = 0; c < 10; c++) ['X', 'Y', 'Z', 'W'].forEach((p, i) => rows.push({ consumer: 'k' + c, product: p, score: 5 + i * 0.4 + c * 0.1 + rng.normal() }));
  const r = S().hedonic(rows);
  const tot = rows.reduce((s, v) => s + v.score, 0) / rows.length;
  const tss = rows.reduce((s, v) => s + (v.score - tot) ** 2, 0);
  a.rel(r.anova.reduce((s, v) => s + v.ss, 0), tss, 1e-12, 'SS add to the total');
  a.eq(r.anova.map(v => v.df), [3, 9, 27], 'degrees of freedom');
  a.ok(r.productAdjusted === null && r.balanced, 'balanced: no adjusted row');
  a.ok(isFinite(r.tukey.hsd), 'balanced: HSD defined');
});

TEST('sensory', 'correspondence analysis and PCA: internal identities', a => {
  const T = [[12, 5, 7, 3], [4, 15, 6, 9], [8, 8, 14, 2], [3, 6, 5, 16], [9, 2, 4, 6]];
  const c = S().ca(T);
  const n = T.reduce((s, r) => s + r.reduce((t, v) => t + v, 0), 0);
  let chi = 0;
  const rs = T.map(r => r.reduce((s, v) => s + v, 0)), cs = T[0].map((_, j) => T.reduce((s, r) => s + r[j], 0));
  T.forEach((r, i) => r.forEach((v, j) => { const e = rs[i] * cs[j] / n; chi += (v - e) ** 2 / e; }));
  a.rel(c.chi2, chi, 1e-12, 'χ² = n·Σλ');
  c.eig.forEach((_, s) => {
    a.close(c.row.contrib.reduce((t, r) => t + r[s], 0), 100, 1e-10, 'row contributions sum to 100, axis ' + s);
    a.close(c.col.contrib.reduce((t, r) => t + r[s], 0), 100, 1e-10, 'column contributions sum to 100, axis ' + s);
  });
  c.row.cos2.forEach((r, i) => a.close(r.reduce((t, v) => t + v, 0), 1, 1e-10, 'row cos² over all axes, ' + i));
  const X = [[1, 2, 3.5], [2.2, 1, 3], [3, 4, 1], [4, 3.3, 2], [0.5, 2, 2.2], [2, 2.5, 4]];
  const p = S().pca(X);
  a.rel(p.eig.reduce((s, v) => s + v, 0), 3, 1e-12, 'eigenvalues of a correlation matrix sum to p');
  p.var.cos2.forEach((r, j) => a.close(r.reduce((t, v) => t + v, 0), 1, 1e-10, 'variable cos² over all axes, ' + j));
  p.eig.forEach((_, k) => a.close(p.ind.contrib.reduce((t, r) => t + r[k], 0), 100, 1e-10, 'individual contributions, axis ' + k));
});

TEST('sensory', 'Williams designs: Latin square and first-order carry-over balance', a => {
  for (let t = 2; t <= 10; t++) {
    const W = S().williams(t), rows = t % 2 ? 2 * t : t;
    a.eq(W.length, rows, 't=' + t + ' rows');
    a.ok(W.every(r => r.slice().sort((x, y) => x - y).join() === Array.from({ length: t }, (_, i) => i).join()), 't=' + t + ' every row a permutation');
    /* each square: every product once in every position */
    for (let s = 0; s < rows / t; s++) for (let pos = 0; pos < t; pos++) {
      const col = W.slice(s * t, s * t + t).map(r => r[pos]).sort((x, y) => x - y);
      a.eq(col.join(), Array.from({ length: t }, (_, i) => i).join(), 't=' + t + ' square ' + s + ' position ' + pos);
    }
    /* every ordered pair of neighbours equally often */
    const cnt = {};
    W.forEach(r => { for (let i = 0; i + 1 < t; i++) { const k = r[i] + '>' + r[i + 1]; cnt[k] = (cnt[k] || 0) + 1; } });
    const want = t % 2 ? 2 : 1;
    let ok = Object.keys(cnt).length === t * (t - 1);
    Object.keys(cnt).forEach(k => { const [x, y] = k.split('>'); if (x === y || cnt[k] !== want) ok = false; });
    a.ok(ok, 't=' + t + ' carry-over: each ordered pair ' + want + '×');
  }
  a.eq(S().williams(1), [[0]], 't=1');
});

TEST('sensory', 'blinding codes and serving plan', a => {
  const c = S().codes(50, 123);
  a.eq(new Set(c).size, 50, 'distinct');
  a.ok(c.every(v => Number.isInteger(v) && v >= 100 && v <= 999), 'three digits');
  a.eq(S().codes(50, 123), c, 'same seed, same codes');
  a.ok(S().codes(50, 124).join() !== c.join(), 'another seed, other codes');
  a.eq(S().codes(900, 5).slice().sort((x, y) => x - y).join(), Array.from({ length: 900 }, (_, i) => 100 + i).join(), 'all 900 codes');
  const prods = ['A', 'B', 'C', 'D', 'E'];
  const sp = S().servingPlan(20, prods, 9);
  a.ok(Array.isArray(sp) && sp.length === 20, 'an array, one entry per assessor');
  a.ok(sp.balanced, '20 assessors, 10 rows: balanced');
  const codeOf = {};
  let consistent = true;
  sp.forEach(e => e.order.forEach(o => { if (codeOf[o.product] === undefined) codeOf[o.product] = o.code; else if (codeOf[o.product] !== o.code) consistent = false; }));
  a.ok(consistent, 'one code per product');
  a.eq(new Set(Object.values(codeOf)).size, 5, 'codes differ between products');
  const pos = {};
  sp.forEach(e => e.order.forEach(o => { const k = o.product + '@' + o.position; pos[k] = (pos[k] || 0) + 1; }));
  a.ok(Object.values(pos).every(v => v === 4) && Object.keys(pos).length === 25, 'each product 4× in each position');
  const sp2 = S().servingPlan(6, prods, 9, { codePerAssessor: true });
  const all = [];
  sp2.forEach(e => e.order.forEach(o => all.push(o.code)));
  a.eq(new Set(all).size, 30, 'a code per assessor and product');
  a.ok(!sp2.balanced && sp2.notes.length === 1, 'unbalanced plan carries a note');
});

/* ====================================================================
   Comparison with the reference values
   ==================================================================== */

TEST('sensory', 'Pc(d′) and Pc′(d′): precise and ref', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.pc.forEach(c => {
    const L = c.method + ' d=' + c.d;
    a.close(S().pc(c.method, c.d), num(c.pcPrecise), 1e-12, L + ' Pc precise');
    vsRef(a, S().pc(c.method, c.d), num(c.pc), num(c.pcPrecise), 1e-8, 1e-12, L + ' Pc');
    if (c.d > 0) {
      a.close(S().pcDeriv(c.method, c.d), num(c.derivPrecise), 1e-11, L + " Pc' precise");
      vsRef(a, S().pcDeriv(c.method, c.d), num(c.deriv), num(c.derivPrecise), 1e-8, 1e-11, L + " Pc'");
    } else a.close(S().pcDeriv(c.method, c.d), NaN, 0, L + " Pc'(0) undefined");
  });
});

TEST('sensory', 'Pc(d′) where the reference integration is inaccurate (fine scan)', a => {
  const REFS = need(a); if (!REFS) return;
  a.ok(arr(REFS.pcScan).length > 0, 'the scan found reference errors above 1e-6');
  arr(REFS.pcScan).forEach(c => {
    const x = S().pc(c.method, c.d), L = c.method + ' d=' + c.d;
    a.close(x, num(c.pcPrecise), 1e-12, L + ' precise');
    a.ok(Math.abs(x - num(c.pc)) > 1e-6, L + ' differs from the reference by ' + Math.abs(x - num(c.pc)).toExponential(2));
  });
});

TEST('sensory', 'd′(Pc): precise and ref', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.dprime.forEach(c => {
    const L = c.method + ' pc=' + c.pc, d = S().dprime(c.method, c.pc);
    a.close(d, num(c.dPrecise), 1e-8, L + ' precise');
    vsRef(a, d, num(c.d), num(c.dPrecise), 2e-4, 1e-8, L + ' d′');
  });
});

TEST('sensory', 'discrimination tests: estimates, standard errors, intervals and p (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.discrim.forEach(c => {
    const o = { test: c.test, conf: c.conf, statistic: c.statistic };
    if (isFinite(num(c.d0))) o.d0 = num(c.d0); else o.pd0 = c.pd0;
    const r = S().discrim(c.method, c.correct, c.total, o);
    const L = c.method + ' ' + c.correct + '/' + c.total + ' ' + c.test + ' pd0=' + c.pd0 + ' d0=' + c.d0 + ' ' + c.statistic + ' ' + c.conf;
    a.close(r.pc, num(c.pc), 1e-12, L + ' pc');
    a.close(r.pd, num(c.pd), 1e-12, L + ' pd');
    a.close(r.d, num(c.dPrecise), 1e-8, L + ' d′ precise');
    vsRef(a, r.d, num(c.d), num(c.dPrecise), 2e-4, 1e-8, L + ' d′');
    a.close(r.se.pc, num(c.se_pc), 1e-12, L + ' se(pc)');
    a.close(r.se.pd, num(c.se_pd), 1e-12, L + ' se(pd)');
    relN(a, r.se.d, num(c.se_dPrecise), 1e-8, L + ' se(d′) precise');
    /* se(d′) = se(pc)/Pc′(d′) inherits the error of the reference d′ (1.2e-4)
       through Pc″/Pc′ (at most ≈ 2 here): relative 5e-4 */
    if (isFinite(num(c.se_dPrecise)) && Math.abs(num(c.se_d) / num(c.se_dPrecise) - 1) > 5e-4) relN(a, r.se.d, num(c.se_dPrecise), 1e-8, L + ' se(d′) (ref off: precise)');
    else relN(a, r.se.d, num(c.se_d), 5e-4, L + ' se(d′) ref');
    if (c.statistic === 'likelihood') {
      /* the reference interpolates the profile with a spline; ours solves it */
      a.close(r.ci.pc[0], num(c.lo_pcExact), 1e-9, L + ' lower pc exact profile');
      a.close(r.ci.pc[1], num(c.hi_pcExact), 1e-9, L + ' upper pc exact profile');
      a.close(r.ci.pc[0], num(c.lo_pc), 5e-5, L + ' lower pc ref (spline)');
      a.close(r.ci.pc[1], num(c.hi_pc), 5e-5, L + ' upper pc ref (spline)');
      a.close(r.ci.d[0], S().dprime(c.method, r.ci.pc[0]), 1e-12, L + ' lower d′ = d′(lower pc)');
    } else {
      a.close(r.ci.pc[0], num(c.lo_pc), 1e-10, L + ' lower pc');
      a.close(r.ci.pc[1], num(c.hi_pc), 1e-10, L + ' upper pc');
      a.close(r.ci.pd[0], num(c.lo_pd), 1e-10, L + ' lower pd');
      a.close(r.ci.pd[1], num(c.hi_pd), 1e-10, L + ' upper pd');
      a.close(r.ci.d[0], num(c.lo_dPrecise), 1e-7, L + ' lower d′ precise');
      a.close(r.ci.d[1], num(c.hi_dPrecise), 1e-7, L + ' upper d′ precise');
      vsRef(a, r.ci.d[0], num(c.lo_d), num(c.lo_dPrecise), 2e-4, 1e-7, L + ' lower d′');
      vsRef(a, r.ci.d[1], num(c.hi_d), num(c.hi_dPrecise), 2e-4, 1e-7, L + ' upper d′');
    }
    if (isFinite(num(c.d0)) && c.statistic === 'exact') {
      /* with a null given as d′0 the reference maps it to pc0 through its
         approximate Pc (error ≈ 5e-9 at d′ = 1), which moves p by up to 2e-8 */
      a.close(r.p, num(c.pPrecise), 1e-12, L + ' p precise');
      a.close(r.p, num(c.p), 1e-7, L + ' p ref');
    } else a.close(r.p, num(c.p), 1e-12, L + ' p');
    if (c.statistic !== 'exact') relN(a, r.stat, num(c.stat_value), 1e-9, L + ' statistic', 1e-12);
  });
});

TEST('sensory', 'critical values (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.findcr.forEach(c => {
    if (!isFinite(num(c.cr))) return;
    a.eq(S().critical(c.pg, c.n, c.alpha, c.test, c.pd0), num(c.cr), 'n=' + c.n + ' pg=' + c.pg.toFixed(3) + ' α=' + c.alpha + ' ' + c.test + ' pd0=' + c.pd0);
  });
});

TEST('sensory', 'power of the exact test (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  const B = NUM();
  REFS.power.forEach(c => {
    const byD = isFinite(num(c.dA));
    const o = byD ? { dA: num(c.dA) } : { pdA: num(c.pdA) };
    const L = c.method + ' n=' + c.n + ' ' + (byD ? 'dA=' + c.dA : 'pdA=' + c.pdA) + ' ' + c.test + ' pd0=' + c.pd0;
    const pw = S().power(c.method, c.n, o, c.alpha, c.test, c.pd0);
    if (isFinite(num(c.cr))) a.eq(S().critical(c.method, c.n, c.alpha, c.test, c.pd0), num(c.cr), L + ' critical value');
    if (c.test === 'similarity' && num(c.cr) < 0) {
      /* no rejection region: we report 0; the reference reports P(X ≤ 0 | pcA) */
      a.close(pw, 0, 0, L + ' power 0');
      const pcA = S().pGuess(c.method) + num(c.pdA) * (1 - S().pGuess(c.method));
      a.close(num(c.power), B.dbinom(0, c.n, pcA), 1e-12, L + ' ref convention P(X ≤ 0)');
    } else {
      /* with d′ the reference maps dA → pdA through its approximate Pc (≈1e-9) */
      a.close(pw, num(c.power), byD ? 1e-7 : 1e-12, L + ' power');
    }
  });
});

TEST('sensory', 'sample size of the exact test (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.sampleSize.forEach(c => {
    const byD = isFinite(num(c.dA));
    const o = byD ? { dA: num(c.dA) } : { pdA: num(c.pdA) };
    a.eq(S().sampleSize(c.method, c.power, o, c.alpha, c.test, c.pd0), num(c.n),
      c.method + ' ' + (byD ? 'dA=' + c.dA : 'pdA=' + c.pdA) + ' power=' + c.power + ' α=' + c.alpha + ' ' + c.test + ' pd0=' + c.pd0);
  });
});

TEST('sensory', 'A–Not A (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.anota.forEach(c => {
    const r = S().aNotA(c.x1, c.n1, c.x2, c.n2), L = c.x1 + '/' + c.n1 + ' ' + c.x2 + '/' + c.n2;
    /* the reference fits the probit model by iteratively reweighted least
       squares, stopped at a relative change of deviance of 1e-8; its standard
       error uses the weights of the last iteration (measured 7.5e-8) */
    a.close(r.d, num(c.d), 1e-10, L + ' d′');
    a.rel(r.se, num(c.se), 1e-6, L + ' se');
    a.rel(r.p, num(c.p), 1e-10, L + ' p', 1e-300);
  });
});

TEST('sensory', 'binomial test and paired preference (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.binom.forEach(c => {
    const r = S().binomTest(c.x, c.n, c.p0, c.alternative, c.conf), L = c.x + '/' + c.n + ' p0=' + c.p0.toFixed(3) + ' ' + c.alternative + ' ' + c.conf;
    a.close(r.p, num(c.p), 1e-12, L + ' p');
    a.close(r.ci[0], num(c.lo), 1e-10, L + ' lower');
    a.close(r.ci[1], num(c.hi), 1e-10, L + ' upper');
  });
  REFS.preference.forEach(c => {
    const r = S().preference(c.nA, c.nB, { noPref: c.noPref, ties: c.ties }), L = c.nA + ':' + c.nB + ' (' + c.noPref + ') ' + c.ties;
    a.eq([r.x, r.n], [c.x, c.n], L + ' counts');
    a.close(r.p, num(c.p), 1e-12, L + ' p');
    a.close(r.ci[0], num(c.lo), 1e-10, L + ' lower');
    a.close(r.ci[1], num(c.hi), 1e-10, L + ' upper');
  });
});

TEST('sensory', 'hedonic ANOVA, Tukey–Kramer and letters (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.hedonic.forEach(h => {
    const d = h.data, rows = d.consumer.map((c, i) => ({ consumer: c, product: d.product[i], score: d.score[i] }));
    const r = S().hedonic(rows, { alpha: h.alpha }), L = h.name;
    a.eq(r.anova.map(x => x.df), nums(h.anova.df), L + ' df');
    r.anova.forEach((x, i) => { a.rel(x.ss, h.anova.ss[i], 1e-10, L + ' SS ' + x.source); a.rel(x.ms, h.anova.ms[i], 1e-10, L + ' MS ' + x.source); });
    [0, 1].forEach(i => { a.rel(r.anova[i].F, h.anova.F[i], 1e-9, L + ' F ' + i); a.rel(r.anova[i].p, num(h.anova.p[i]), 1e-8, L + ' p ' + i, 1e-300); });
    if (r.balanced) a.ok(r.productAdjusted === null, L + ' balanced');
    else {
      a.eq(r.productAdjusted.df, h.adjusted.df, L + ' adjusted df');
      a.rel(r.productAdjusted.ss, h.adjusted.ss, 1e-10, L + ' adjusted SS');
      a.rel(r.productAdjusted.F, h.adjusted.F, 1e-9, L + ' adjusted F');
      a.rel(r.productAdjusted.p, num(h.adjusted.p), 1e-8, L + ' adjusted p', 1e-300);
    }
    a.eq(r.products, arr(h.means.product), L + ' product order');
    r.means.forEach((m, i) => {
      a.eq(m.n, h.means.n[i], L + ' n ' + m.product);
      a.close(m.mean, h.means.mean[i], 1e-12, L + ' mean ' + m.product);
      a.close(m.sd, h.means.sd[i], 1e-12, L + ' sd ' + m.product);
      a.close(m.se, h.means.se[i], 1e-12, L + ' se ' + m.product);
    });
    a.eq(r.tukey.pairs.map(p => p.a + '-' + p.b), arr(h.tukey.pair), L + ' pair order');
    r.tukey.pairs.forEach((p, i) => {
      a.close(p.diff, h.tukey.diff[i], 1e-12, L + ' diff ' + i);
      a.close(p.lwr, h.tukey.lwr[i], 1e-6, L + ' lwr ' + i);
      a.close(p.upr, h.tukey.upr[i], 1e-6, L + ' upr ' + i);
      a.close(p.p, num(h.tukey.p[i]), 1e-9, L + ' p adj ' + i);
    });
    arr(h.letters.product).forEach((p, i) => a.eq(r.tukey.letters[p], arr(h.letters.group)[i], L + ' letters ' + p));
    a.close(r.tukey.hsd, num(h.hsd), 1e-6, L + ' HSD');
    a.rel(r.cv, h.cv, 1e-12, L + ' CV');
    a.rel(r.mse, h.mse, 1e-12, L + ' MSE');
    a.eq(r.dfe, h.dfe, L + ' df error');
  });
});

TEST('sensory', 'just-about-right penalty analysis (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.jar.forEach(J => {
    const d = J.data, rows = d.consumer.map((c, i) => ({ consumer: c, product: d.product[i], attribute: d.attribute[i], jar: d.jar[i], liking: d.liking[i] }));
    const r = S().jar(rows, { levels: J.levels, threshold: J.threshold });
    a.eq(r.results.length, J.results.length, J.name + ' groups');
    J.results.forEach(e => {
      const x = r.results.find(v => v.product === e.product && v.attribute === e.attribute), L = J.name + ' ' + e.product + '/' + e.attribute;
      a.ok(!!x, L + ' present');
      if (!x) return;
      a.eq([x.n, x.nLow, x.nJar, x.nHigh], [e.n, e.nLow, e.nJar, e.nHigh], L + ' counts');
      ['pctLow', 'pctJar', 'pctHigh', 'meanJar', 'meanLow', 'meanHigh', 'penaltyLow', 'penaltyHigh'].forEach(k => a.close(x[k], num(e[k]), 1e-12, L + ' ' + k));
      a.close(x.pLow, num(e.pLow), 1e-12, L + ' pLow');
      a.close(x.pHigh, num(e.pHigh), 1e-12, L + ' pHigh');
      a.eq([x.flagLow, x.flagHigh], [e.flagLow, e.flagHigh], L + ' flags');
    });
  });
});

TEST('sensory', 'Cochran Q and McNemar (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.cochran.forEach((c, i) => {
    const r = S().cochranQ(mat(c.M));
    a.rel(r.Q, num(c.Q), 1e-12, 'Q ' + i);
    a.eq(r.df, num(c.df), 'df ' + i);
    a.rel(r.p, num(c.p), 1e-10, 'p ' + i, 1e-300);
  });
  REFS.mcnemar.forEach((c, i) => {
    const r1 = S().mcnemar(nums(c.x), nums(c.y)), r0 = S().mcnemar(nums(c.x), nums(c.y), { correct: false });
    a.close(r1.statistic, num(c.stat), 1e-12, 'corrected χ² ' + i);
    a.close(r1.p, num(c.p), 1e-12, 'corrected p ' + i);
    a.close(r0.statistic, num(c.stat0), 1e-12, 'χ² ' + i);
    a.close(r0.p, num(c.p0), 1e-12, 'p ' + i);
  });
});

function caCompare(a, r, e, L) {
  a.arrRel(r.eig, nums(e.eig), 1e-10, L + ' eigenvalues');
  a.arr(r.pct, nums(e.pct), 1e-9, L + ' %');
  a.arr(r.cum, nums(e.cum), 1e-9, L + ' cumulative %');
  const Rc = mat(e.rowCoord), s = signsOf(r.row.coord, Rc);
  matClose(a, flip(r.row.coord, s), Rc, 1e-10, L + ' row coord');
  matClose(a, flip(r.col.coord, s), mat(e.colCoord), 1e-10, L + ' col coord (same axis signs)');
  matClose(a, r.row.contrib, mat(e.rowContrib), 1e-8, L + ' row contrib');
  matClose(a, r.col.contrib, mat(e.colContrib), 1e-8, L + ' col contrib');
  matClose(a, r.row.cos2, mat(e.rowCos2), 1e-10, L + ' row cos²');
  matClose(a, r.col.cos2, mat(e.colCos2), 1e-10, L + ' col cos²');
  a.arr(r.row.inertia, nums(e.rowInertia), 1e-12, L + ' row inertia');
  a.arr(r.col.inertia, nums(e.colInertia), 1e-12, L + ' col inertia');
  a.rel(r.chi2, num(e.chi2), 1e-10, L + ' χ²');
  a.eq(r.df, num(e.df), L + ' df');
  a.rel(r.p, num(e.p), 1e-8, L + ' p', 1e-300);
}

TEST('sensory', 'check-all-that-apply and its correspondence analysis (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  const C = REFS.cata, d = C.data, attrs = arr(C.attributes);
  const rows = d.consumer.map((c, i) => { const o = { consumer: c, product: d.product[i] }; attrs.forEach(k => { o[k] = num(d[k][i]); }); return o; });
  const r = S().cata(rows, { attributes: attrs });
  matClose(a, r.counts, mat(C.counts), 0, 'counts');
  matClose(a, r.pct, mat(C.pct), 1e-12, '% of consumers');
  C.perAttribute.forEach((e, k) => {
    const x = r.perAttribute[k], L = e.attribute;
    a.eq(x.attribute, e.attribute, L);
    a.rel(x.Q, num(e.Q), 1e-12, L + ' Q');
    a.rel(x.p, num(e.p), 1e-10, L + ' p', 1e-300);
    a.eq(x.pairs.map(p => p.a + '|' + p.b), arr(e.a).map((v, i) => v + '|' + arr(e.b)[i]), L + ' pairs');
    x.pairs.forEach((p, i) => {
      a.close(p.stat, num(arr(e.stat)[i]), 1e-12, L + ' McNemar ' + i);
      a.close(p.p, num(arr(e.pp)[i]), 1e-12, L + ' p ' + i);
      a.close(p.pAdj, num(arr(e.pAdj)[i]), 1e-12, L + ' Holm ' + i);
    });
  });
  caCompare(a, r.ca, C.ca, 'CATA CA');
});

TEST('sensory', 'correspondence analysis (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.ca.forEach((e, i) => caCompare(a, S().ca(mat(e.table)), e, 'CA ' + i));
});

TEST('sensory', 'Friedman test, rank-sum comparisons and letters (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.friedman.forEach(f => {
    const M = mat(f.M), t = M[0].length, names = Array.from({ length: t }, (_, j) => 'T' + (j + 1));
    const r = S().friedman(M, { alpha: f.alpha, names }), L = f.name;
    a.rel(r.chi2, num(f.chi2), 1e-12, L + ' χ²');
    a.rel(r.chi2, num(f.chi2Ag), 1e-12, L + ' χ² (comparison routine)');
    a.eq(r.df, num(f.df), L + ' df');
    a.rel(r.p, num(f.p), 1e-10, L + ' p', 1e-300);
    a.rel(r.F, num(f.F), 1e-12, L + ' F');
    /* the comparison routine computes 1 − F(x), which loses digits for small p */
    a.rel(r.pF, num(f.pFprecise), 1e-10, L + ' p(F) precise', 1e-300);
    a.close(r.pF, num(f.pF), 1e-14, L + ' p(F) ref');
    a.close(r.lsd, num(f.lsd), 1e-10, L + ' LSD of rank sums');
    a.arr(r.rankSumList, nums(f.rankSums), 1e-12, L + ' rank sums');
    arr(f.letters.trt).forEach((p, i) => a.eq(r.letters[p], arr(f.letters.group)[i], L + ' letters ' + p));
    a.eq(r.pairs.map(p => p.a + ' - ' + p.b), arr(f.pairs.pair), L + ' pair order');
    /* the reference rounds these p-values to four decimals */
    r.pairs.forEach((p, i) => { a.close(p.diff, num(arr(f.pairs.diff)[i]), 1e-12, L + ' diff ' + i); a.close(p.p, num(arr(f.pairs.p)[i]), 5e-5 + 1e-12, L + ' p ' + i); });
  });
});

TEST('sensory', 'QDA: ANOVA per attribute, mixed-model F, comparisons and assessor performance (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.qda.forEach(q => {
    const d = q.data, attrs = arr(q.attributes), n = d.panelist.length;
    const rows = [];
    for (let i = 0; i < n; i++) {
      const o = { panelist: d.panelist[i], product: d.product[i] };
      if (q.session) o.session = d.session[i];
      attrs.forEach(k => { o[k] = num(d[k][i]); });
      rows.push(o);
    }
    const r = S().qda(rows, { attributes: attrs, alpha: q.alpha, multcomp: 'LSD' });
    const rh = S().qda(rows, { attributes: attrs, alpha: q.alpha, multcomp: 'HSD' });
    q.perAttribute.forEach((e, k) => {
      const x = r.results[k], L = q.name + ' · ' + e.attribute;
      a.eq(x.anova.map(v => v.source), arr(e.source).map(s => s === 'Residuals' ? 'residual' : s), L + ' sources');
      a.eq(x.anova.map(v => v.df), nums(e.df), L + ' df');
      x.anova.forEach((v, i) => { a.rel(v.ss, num(e.ss[i]), 1e-9, L + ' SS ' + v.source, 1e-12); a.rel(v.ms, num(e.ms[i]), 1e-9, L + ' MS ' + v.source, 1e-12); });
      nums(e.F).forEach((F, i) => { a.rel(x.anova[i].F, F, 1e-8, L + ' F ' + i, 1e-12); a.rel(x.anova[i].p, num(arr(e.p)[i]), 1e-8, L + ' p ' + i, 1e-300); });
      a.rel(x.fProductMixed, num(e.fMixed), 1e-9, L + ' F mixed');
      a.rel(x.pProductMixed, num(e.pMixed), 1e-8, L + ' p mixed', 1e-300);
      a.rel(x.errorMS, num(e.msI), 1e-10, L + ' error MS');
      a.eq(x.errorDf, num(e.dfI), L + ' error df');
      a.close(x.r2, num(e.r2), 1e-12, L + ' R2');
      a.rel(x.sdResidual, num(e.sdRes), 1e-10, L + ' residual sd');
      a.arr(x.means.map(m => m.mean), nums(e.means), 1e-12, L + ' means');
      a.eq(x.means.map(m => m.n), nums(e.n), L + ' n');
      a.arrRel(x.pairs.map(p => p.p), nums(e.pLSD), 1e-8, L + ' LSD p', 1e-300);
      arr(e.lettersLSD.product).forEach((p, i) => a.eq(x.letters[p], arr(e.lettersLSD.group)[i], L + ' LSD letters ' + p));
      arr(e.lettersHSD.product).forEach((p, i) => a.eq(rh.results[k].letters[p], arr(e.lettersHSD.group)[i], L + ' HSD letters ' + p));
      a.arr(r.products.map(p => x.panelMeans[p]), nums(e.panelMeans), 1e-12, L + ' panel means');
      /* panel performance: every term against the residual, except the
         product (against the interaction when there are replicates) */
      const pp = mat(q.panelperf.p)[k];
      pp.forEach((p, t) => a.rel(t === 0 ? x.pProductMixed : x.anova[t].p, p, 1e-8, L + ' panel p term ' + t, 1e-300));
      a.rel(x.sdResidual, nums(q.panelperf.res)[k], 1e-10, L + ' panel residual sd');
      a.close(x.r2, nums(q.panelperf.r2)[k], 1e-12, L + ' panel R2');
      const tot = x.anova.reduce((s, v) => s + v.ss, 0);
      mat(q.panelperf.variability)[k].forEach((v, t) => a.close(x.anova[t].ss / tot, v, 1e-12, L + ' share of variability ' + t));
      /* assessors */
      if (q.paneliperf && q.paneliperf.panelists) {
        const P = arr(q.paneliperf.panelists), prob = mat(q.paneliperf.prob), res = mat(q.paneliperf.res), agr = mat(q.paneliperf.agree);
        P.forEach((pn, j) => {
          const y = x.panelists.find(v => v.panelist === pn);
          a.rel(y.pProduct, prob[j][k], 1e-8, L + ' ' + pn + ' discrimination p', 1e-300);
          a.rel(y.repeatability, res[j][k], 1e-10, L + ' ' + pn + ' repeatability');
          a.close(y.agreement, agr[j][k], 1e-12, L + ' ' + pn + ' agreement');
        });
      }
    });
    a.eq(r.panelSummary.length, r.panelists.length, q.name + ' summary per assessor');
  });
});

TEST('sensory', 'principal component analysis (ref)', a => {
  const REFS = need(a); if (!REFS) return;
  REFS.pca.forEach(e => {
    const r = S().pca(mat(e.X), { scale: e.scale }), L = e.name;
    a.arrRel(r.eig, nums(e.eig), 1e-10, L + ' eigenvalues');
    a.arr(r.pct, nums(e.pct), 1e-9, L + ' %');
    a.arr(r.cum, nums(e.cum), 1e-9, L + ' cumulative %');
    const V = mat(e.varCoord), s = signsOf(r.var.coord, V);
    matClose(a, flip(r.var.coord, s), V, 1e-10, L + ' variable coord');
    matClose(a, flip(r.var.cor, s), mat(e.varCor), 1e-10, L + ' variable correlations');
    matClose(a, r.var.cos2, mat(e.varCos2), 1e-10, L + ' variable cos²');
    matClose(a, r.var.contrib, mat(e.varContrib), 1e-8, L + ' variable contrib');
    matClose(a, flip(r.ind.coord, s), mat(e.indCoord), 1e-10, L + ' individual coord (same axis signs)');
    matClose(a, r.ind.cos2, mat(e.indCos2), 1e-10, L + ' individual cos²');
    matClose(a, r.ind.contrib, mat(e.indContrib), 1e-8, L + ' individual contrib');
    a.arr(r.ind.dist, nums(e.indDist), 1e-12, L + ' distance to the centre');
  });
});
})();
