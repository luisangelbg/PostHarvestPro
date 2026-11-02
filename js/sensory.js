/* PostHarvestPro — sensory evaluation engine
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* PostHarvestPro — sensory evaluation engine.

   1. Discrimination tests (triangle, duo-trio, 2-AFC, 3-AFC, unspecified
      tetrad) under the Thurstonian model: psychometric functions, d′, the
      proportion of discriminators, exact binomial inference with
      Clopper–Pearson intervals (and likelihood, score and Wald variants),
      critical values, power and sample size; the A–Not A test; the exact
      binomial test and the paired preference test.
      Thurstone 1927 (Psychol. Rev. 34:273–286); Ennis 1993 (J. Sens. Stud.
      8:353–370); Brockhoff & Christensen 2010 (Food Qual. Prefer. 21:330–338).
   2. Affective tests: hedonic ANOVA with Tukey–Kramer comparisons, just-about-
      right penalty analysis, Cochran's Q and McNemar's test, check-all-that-
      apply analysis, correspondence analysis and Friedman's rank test.
   3. Descriptive analysis (QDA): ANOVA per attribute with the assessor as a
      random effect, assessor performance (discrimination, repeatability,
      agreement) and principal component analysis.
   4. Tasting design: Williams Latin squares balanced for first-order carry-over,
      three-digit blinding codes and serving plans.

   Wrapped in a named function that installs `Sens` in the global object it is
   given (the page calls it with `window`, the test benches with a sandbox).
   Nothing here touches the DOM; notes meant for the interface are {es, en}. */
function SensCore(g) {
'use strict';
const Num = g.Num;
const Sens = {};
const { abs, sqrt, exp, log, log1p, min, max, floor, ceil } = Math;
const SQRT2 = Math.SQRT2, SQRT3 = sqrt(3), SQRT6 = sqrt(6), SQRT23 = sqrt(2 / 3);
const pn = Num.pnorm, dn = Num.dnorm;
const note = (es, en) => ({ es, en });
const isNum = v => typeof v === 'number' && isFinite(v);

/* Rounding of x.5 to the even neighbour (round half to even, IEC 60559),
   used where a published algorithm rounds a real sample size. */
function roundEven(x) {
  const r = Math.round(x);
  return (abs(x % 1) === 0.5 && r % 2 !== 0) ? r - 1 : r;
}
/* log C(n, k) */
const lchoose = (n, k) => Num.lfactorial(n) - Num.lfactorial(k) - Num.lfactorial(n - k);
/* log of the binomial probability, with 0·log 0 = 0 */
function ldbinom(x, n, p) {
  if (p <= 0) return x === 0 ? 0 : -Infinity;
  if (p >= 1) return x === n ? 0 : -Infinity;
  return lchoose(n, x) + (x ? x * log(p) : 0) + (n - x ? (n - x) * log1p(-p) : 0);
}
/* distinct values in order of first appearance, as strings */
function levelsOf(vals) {
  const index = new Map(), names = [];
  vals.forEach(v => { const k = String(v); if (!index.has(k)) { index.set(k, names.length); names.push(k); } });
  return { names, index };
}

/* ======================================================================
   1. DISCRIMINATION TESTS
   ====================================================================== */

Sens.METHODS = ['triangle', 'duotrio', 'twoAFC', 'threeAFC', 'tetrad'];
/* probability of a correct answer by guessing alone */
const PGUESS = { triangle: 1 / 3, duotrio: 1 / 2, twoAFC: 1 / 2, threeAFC: 1 / 3, tetrad: 1 / 3 };
function checkMethod(m) { if (!Object.prototype.hasOwnProperty.call(PGUESS, m)) throw new Error('Sens: unknown method "' + m + '"'); }
Sens.pGuess = function (method) { checkMethod(method); return PGUESS[method]; };

/* Gauss–Legendre, 48 points on 8 equal pieces: the integrands below are
   products of normal densities and distribution functions, smooth and
   negligible beyond ±10, so the rule is exact to rounding. */
const quad = (f, a, b) => Num.glIntegrate(f, a, b, 48, 8);

/* Psychometric functions Pc = f(d′) of the Thurstonian (equal-variance
   normal) model; d′ is the distance between the two products in units of the
   perceptual standard deviation.
   2-AFC:     Pc = Φ(d/√2)                                  (Green & Swets 1966, Signal Detection Theory and Psychophysics, Wiley)
   3-AFC:     Pc = ∫ φ(z − d) Φ(z)² dz                       (Green & Swets 1966; Ennis 1993, J. Sens. Stud. 8:353–370)
   duo-trio:  Pc = 1 − Φ(d/√2) − Φ(d/√6) + 2Φ(d/√2)Φ(d/√6)   (Ennis 1993; Frijters 1979, Br. J. Math. Stat. Psychol. 32:229–241)
   triangle:  Pc = 2∫₀^∞ [Φ(−z√3 + d√(2/3)) + Φ(−z√3 − d√(2/3))] φ(z) dz
                                                            (Ura 1960, Rep. Stat. Appl. Res. JUSE 7:107–119; Frijters 1979)
   tetrad:    Pc = 1 − 2∫ φ(z) [2Φ(z)Φ(z − d) − Φ(z − d)²] dz (Ennis, Ennis, Yip & O'Mahony 1998, Br. J. Math. Stat. Psychol. 51:205–215) */
function pcRaw(method, d) {
  switch (method) {
    case 'twoAFC': return pn(d / SQRT2);
    case 'duotrio': {
      /* written as (1 − a)(1 − b) + ab, which keeps its digits when a, b → 1 */
      const a = pn(d / SQRT2), b = pn(d / SQRT6), ua = pn(d / SQRT2, true), ub = pn(d / SQRT6, true);
      return ua * ub + a * b;
    }
    case 'triangle': {
      const s = d * SQRT23;
      return 2 * quad(z => (pn(-z * SQRT3 + s) + pn(-z * SQRT3 - s)) * dn(z), 0, 10);
    }
    case 'threeAFC': return quad(z => { const p = pn(z); return dn(z - d) * p * p; }, d - 10, d + 10);
    case 'tetrad': return 1 - 2 * quad(z => { const b = pn(z - d); return dn(z) * (2 * pn(z) * b - b * b); }, -10, 10);
  }
  return NaN;
}
/* Pc(d′), kept inside [pGuess, 1] */
Sens.pc = function (method, d) {
  checkMethod(method);
  if (d !== d) return NaN;
  if (d <= 0) return PGUESS[method];
  if (d === Infinity) return 1;
  return Num.clamp(pcRaw(method, d), PGUESS[method], 1);
};
/* dPc/dd′, for the delta-method standard error of d′ (Brockhoff &
   Christensen 2010, Food Qual. Prefer. 21:330–338):
   2-AFC     φ(d/√2)/√2
   duo-trio  −φ(d/√2)/√2 − φ(d/√6)/√6 + 2[φ(d/√2)Φ(d/√6)/√2 + Φ(d/√2)φ(d/√6)/√6]
   triangle  √(2/3) φ(d/√6) [Φ(d/√2) − Φ(−d/√2)]
   3-AFC     ∫ (z − d) φ(z − d) Φ(z)² dz = 2∫ φ(z) φ(z − d) Φ(z) dz
             (integrated by parts: the second form has a positive integrand
             and keeps its digits for large d′, where the first cancels)
   tetrad    4∫ φ(z) φ(z − d) [Φ(z) − Φ(z − d)] dz   (differentiating under the integral)
   Both integrands carry φ(z)φ(z − d), a Gaussian centred at d/2 with
   standard deviation 1/√2. Undefined (NaN) at d′ = 0 and 0 at d′ = ∞. */
Sens.pcDeriv = function (method, d) {
  checkMethod(method);
  if (!(d > 0)) return NaN;
  if (d === Infinity) return 0;
  switch (method) {
    case 'twoAFC': return dn(d / SQRT2) / SQRT2;
    case 'duotrio': {
      const a = d / SQRT2, b = d / SQRT6;
      return -dn(a) / SQRT2 - dn(b) / SQRT6 + 2 * (dn(a) * pn(b) / SQRT2 + pn(a) * dn(b) / SQRT6);
    }
    case 'triangle': return SQRT23 * dn(d / SQRT6) * (pn(d / SQRT2) - pn(-d / SQRT2));
    case 'threeAFC': return 2 * quad(z => dn(z) * dn(z - d) * pn(z), d / 2 - 9, d / 2 + 9);
    case 'tetrad': return 4 * quad(z => dn(z) * dn(z - d) * (pn(z) - pn(z - d)), d / 2 - 9, d / 2 + 9);
  }
  return NaN;
};
/* Above 1 − ε the proportion is reported as perfect discrimination, d′ = ∞
   (the same thresholds as the published implementation of these models). */
const EPS_INF = { triangle: 1e-8, tetrad: 1e-8, threeAFC: 1e-8, duotrio: 1e-10, twoAFC: 0 };
/* d′ = Pc⁻¹: closed form for 2-AFC, Brent's root of Pc(d) − pc otherwise;
   0 when pc ≤ pGuess. */
Sens.dprime = function (method, pc) {
  checkMethod(method);
  const pg = PGUESS[method];
  if (pc !== pc) return NaN;
  if (pc <= pg) return 0;
  if (pc >= 1 - EPS_INF[method]) return Infinity;
  if (method === 'twoAFC') return SQRT2 * Num.qnorm(pc);
  let hi = 4;
  while (pcRaw(method, hi) < pc && hi < 64) hi *= 2;
  return Num.brent(d => pcRaw(method, d) - pc, 0, hi, 1e-14);
};
/* the proportion of discriminators: pc = pg + pd(1 − pg) (Abbott's formula) */
const pc2pd = (pc, pg) => pc <= pg ? 0 : (pc - pg) / (1 - pg);
const pd2pc = (pd, pg) => pg + pd * (1 - pg);
Sens.pc2pd = (method, pc) => pc2pd(pc, Sens.pGuess(method));
Sens.pd2pc = (method, pd) => pd2pc(pd, Sens.pGuess(method));
/* pc → {pc, pd, d′} with pc raised to pGuess when below it */
function fromPc(method, pc) {
  const pg = PGUESS[method], p = pc < pg ? pg : pc;
  return { pc: p, pd: pc2pd(p, pg), d: Sens.dprime(method, p) };
}

/* Exact binomial tail probabilities and the Clopper–Pearson interval
   (Clopper & Pearson 1934, Biometrika 26:404–413):
   lower = B⁻¹(α/2; x, n − x + 1), upper = B⁻¹(1 − α/2; x + 1, n − x). */
function clopperPearson(x, n, conf, alternative) {
  const a = 1 - conf;
  const L = al => x === 0 ? 0 : Num.qbeta(al, x, n - x + 1);
  const U = al => x === n ? 1 : Num.qbeta(1 - al, x + 1, n - x);
  if (alternative === 'less') return [0, U(a)];
  if (alternative === 'greater') return [L(a), 1];
  return [L(a / 2), U(a / 2)];
}
/* Two-sided exact p-value: the probability of every outcome no more likely
   than the one observed (the "minimum likelihood" rule; Hollander, Wolfe &
   Chicken 2014, Nonparametric Statistical Methods, Wiley), with a relative
   fuzz of 1e-7 on the comparison of probabilities. */
function binomP2(x, n, p) {
  if (p === 0) return x === 0 ? 1 : 0;
  if (p === 1) return x === n ? 1 : 0;
  const relErr = 1 + 1e-7, d = Num.dbinom(x, n, p), m = n * p;
  if (x === m) return 1;
  let y = 0;
  if (x < m) {
    for (let i = ceil(m); i <= n; i++) if (Num.dbinom(i, n, p) <= d * relErr) y++;
    return min(1, Num.pbinom(x, n, p) + Num.pbinom(n - y, n, p, true));
  }
  for (let i = 0; i <= floor(m); i++) if (Num.dbinom(i, n, p) <= d * relErr) y++;
  return min(1, Num.pbinom(y - 1, n, p) + Num.pbinom(x - 1, n, p, true));
}
function normAlt(a) {
  if (!a || a === 'two.sided' || a === 'two-sided' || a === 'twoSided') return 'two.sided';
  if (a === 'less' || a === 'greater') return a;
  throw new Error('Sens: unknown alternative "' + a + '"');
}
/* Exact binomial test of H0: p = p0, with the Clopper–Pearson interval. */
Sens.binomTest = function (x, n, p0, alternative, conf) {
  if (p0 == null) p0 = 0.5;
  if (conf == null) conf = 0.95;
  const alt = normAlt(alternative);
  if (!(Number.isInteger(x) && Number.isInteger(n) && n >= 1 && x >= 0 && x <= n) || !(p0 >= 0 && p0 <= 1))
    return { x, n, p0, alternative: alt, estimate: NaN, p: NaN, ci: [NaN, NaN], conf, notes: [note('Datos no válidos: se requieren enteros 0 ≤ x ≤ n, n ≥ 1 y 0 ≤ p0 ≤ 1.', 'Invalid data: integers 0 ≤ x ≤ n, n ≥ 1 and 0 ≤ p0 ≤ 1 are required.')] };
  const p = alt === 'less' ? Num.pbinom(x, n, p0) : alt === 'greater' ? Num.pbinom(x - 1, n, p0, true) : binomP2(x, n, p0);
  return { x, n, p0, alternative: alt, estimate: x / n, p, ci: clopperPearson(x, n, conf, alt), conf };
};

/* Paired preference test: a two-sided exact binomial test of H0: P(A) = ½.
   No-preference answers are either ignored or split equally between the two
   products (Odesky 1967, J. Marketing Res. 4:199–201); an odd number of them
   leaves one answer out. */
Sens.preference = function (nA, nB, o) {
  o = o || {};
  const noPref = o.noPref || 0, ties = o.ties || 'ignore', conf = o.conf == null ? 0.95 : o.conf;
  const notes = [];
  let x = nA, n = nA + nB;
  if (ties === 'split' && noPref > 0) {
    const half = floor(noPref / 2);
    x = nA + half; n = nA + nB + 2 * half;
    if (noPref % 2) notes.push(note('Número impar de respuestas «sin preferencia»: una se descartó al repartirlas.', 'Odd number of "no preference" answers: one was left out when splitting them.'));
  } else if (noPref > 0) notes.push(note('Las respuestas «sin preferencia» no entran en la prueba.', '"No preference" answers are left out of the test.'));
  const t = Sens.binomTest(x, n, 0.5, 'two.sided', conf);
  return { nA, nB, noPref, ties, x, n, estimate: t.estimate, p: t.p, ci: t.ci, conf, notes: notes.concat(t.notes || []) };
};

/* ---- the discrimination test itself ----
   x correct answers out of n. Estimates: pc = max(x/n, pGuess), pd and d′ by
   the transformations above; standard errors by the delta method,
   se(pc) = √(pc(1 − pc)/n), se(pd) = se(pc)/(1 − pg), se(d′) = se(pc)/Pc′(d′),
   reported only when pg < x/n < 1 (Brockhoff & Christensen 2010).
   H0 for a difference test: pd ≤ pd0, p = P(X ≥ x | pc0); for a similarity
   test: pd ≥ pd0, p = P(X ≤ x | pc0) (similarity testing with discrimination
   methods: Bi 2005, Food Qual. Prefer. 16:139–149). The interval for pc is
   computed on x/n and carried to pd and d′ through the same monotone
   transformations.
   statistic 'exact'      — binomial tails, Clopper–Pearson interval;
             'likelihood' — signed root of the likelihood ratio, profile-likelihood interval;
             'score'      — Wilson's score test (Wilson 1927, J. Am. Statist. Assoc. 22:209–212),
                            interval with continuity correction;
             'Wald'       — (pc − pc0)/√(pc(1 − pc)/n), Wald interval. */
Sens.discrim = function (method, correct, total, o) {
  checkMethod(method);
  o = o || {};
  const conf = o.conf == null ? 0.95 : o.conf;
  const test = o.test || 'difference';
  const statistic = o.statistic || 'exact';
  const x = correct, n = total, pg = PGUESS[method], notes = [];
  if (!(Number.isInteger(x) && Number.isInteger(n) && n >= 1 && x >= 0 && x <= n)) {
    const nn = [NaN, NaN];
    return { method, correct: x, total: n, pGuess: pg, test, statistic, conf, pd0: NaN, pc0: NaN, pc: NaN, pd: NaN, d: NaN,
      se: { pc: NaN, pd: NaN, d: NaN }, ci: { pc: nn, pd: nn.slice(), d: nn.slice() }, p: NaN, stat: NaN,
      notes: [note('Datos no válidos: se requieren enteros 0 ≤ correctas ≤ total y total ≥ 1.', 'Invalid data: integers 0 ≤ correct ≤ total and total ≥ 1 are required.')] };
  }
  if (test !== 'difference' && test !== 'similarity') throw new Error('Sens.discrim: test must be "difference" or "similarity"');
  let pd0 = 0, pc0 = pg;
  if (o.d0 != null) { pc0 = Sens.pc(method, o.d0); pd0 = pc2pd(pc0, pg); }
  else if (o.pd0 != null) { pd0 = o.pd0; pc0 = pd2pc(pd0, pg); }
  if (test === 'similarity' && !(pd0 > 0))
    notes.push(note('Una prueba de similitud requiere pd0 > 0 (la mayor proporción de discriminadores que se considera despreciable).', 'A similarity test needs pd0 > 0 (the largest proportion of discriminators regarded as negligible).'));
  const mu = x / n, seMu = sqrt(mu * (1 - mu) / n);
  const est = fromPc(method, mu);
  let se = { pc: NaN, pd: NaN, d: NaN };
  if (mu < 1 && mu > pg) se = { pc: seMu, pd: seMu / (1 - pg), d: seMu / Sens.pcDeriv(method, est.d) };
  if (mu <= pg) notes.push(note('La proporción observada no supera la de adivinanza: pd = 0 y d′ = 0.', 'The observed proportion does not exceed the guessing probability: pd = 0 and d′ = 0.'));
  const diff = test === 'difference';
  let p, statValue = NaN, ci;
  const za = Num.qnorm((1 + conf) / 2);
  if (statistic === 'exact') {
    p = diff ? Num.pbinom(x - 1, n, pc0, true) : Num.pbinom(x, n, pc0);
    ci = clopperPearson(x, n, conf, 'two.sided');
  } else if (statistic === 'likelihood') {
    const llMax = ldbinom(x, n, est.pc), llNull = ldbinom(x, n, pc0);
    const sg = est.pc > pc0 ? 1 : est.pc < pc0 ? -1 : 0;
    statValue = sg ? sg * sqrt(max(0, 2 * (llMax - llNull))) : 0;
    p = diff ? pn(statValue, true) : pn(statValue);
    ci = likelihoodCI(x, n, conf);
  } else if (statistic === 'Wald') {
    statValue = (est.pc - pc0) / sqrt(est.pc * (1 - est.pc) / n);
    p = diff ? pn(statValue, true) : pn(statValue);
    ci = [mu - za * seMu, mu + za * seMu];
  } else if (statistic === 'score') {
    ci = scoreCI(x, n, conf);
    const P0 = Num.clamp(pc0, 1e-8, 1 - 1e-8);
    statValue = (x - n * P0) * (x - n * P0) / (n * P0 * (1 - P0));
    const z = (mu > P0 ? 1 : mu < P0 ? -1 : 0) * sqrt(statValue);
    p = diff ? pn(z, true) : pn(z);
  } else throw new Error('Sens.discrim: unknown statistic "' + statistic + '"');
  ci = ci.map(v => Num.clamp(v, 0, 1));
  const lo = fromPc(method, ci[0]), hi = fromPc(method, ci[1]);
  return {
    method, correct: x, total: n, pGuess: pg, test, statistic, conf, pd0, pc0,
    pc: est.pc, pd: est.pd, d: est.d, se,
    ci: { pc: [lo.pc, hi.pc], pd: [lo.pd, hi.pd], d: [lo.d, hi.d] },
    p, stat: statValue, notes,
  };
};
/* Profile-likelihood interval for a binomial proportion: the two roots of
   2[ℓ(p̂) − ℓ(p)] = z²_{(1+conf)/2}, solved exactly (Brent). */
function likelihoodCI(x, n, conf) {
  const ph = x / n, z = Num.qnorm((1 + conf) / 2), t = z * z / 2;
  const ll = p => (x ? x * log(p) : 0) + (n - x ? (n - x) * log1p(-p) : 0);
  const l0 = ll(ph);
  const lo = x === 0 ? 0 : Num.brent(p => l0 - ll(p) - t, 1e-15, ph, 1e-15);
  const hi = x === n ? 1 : Num.brent(p => l0 - ll(p) - t, ph, 1 - 1e-15, 1e-15);
  return [lo, hi];
}
/* Wilson's score interval with continuity correction (Newcombe 1998, Stat.
   Med. 17:857–872, method 4), the correction limited to |x − n/2|. */
function scoreCI(x, n, conf) {
  const z = Num.qnorm((1 + conf) / 2), est = x / n;
  const yates = min(0.5, abs(x - n * 0.5)), z22n = z * z / (2 * n);
  let pc = est + yates / n;
  const pu = pc >= 1 ? 1 : (pc + z22n + z * sqrt(pc * (1 - pc) / n + z22n / (2 * n))) / (1 + 2 * z22n);
  pc = est - yates / n;
  const pl = pc <= 0 ? 0 : (pc + z22n - z * sqrt(pc * (1 - pc) / n + z22n / (2 * n))) / (1 + 2 * z22n);
  return [max(pl, 0), min(pu, 1)];
}

/* ---- critical value, power and sample size (exact binomial) ----
   Difference test: the smallest x with P(X ≥ x | pc0) ≤ α (n + 1 when none);
   similarity test: the largest x with P(X ≤ x | pc0) ≤ α (−1 when none).
   Power: P(X ≥ x_c | pcA) or P(X ≤ x_c | pcA) (Ennis 1993, J. Sens. Stud.
   8:353–370; Schlich 1993, Food Qual. Prefer. 4, risk tables for
   discrimination tests). */
function critValue(n, pc0, alpha, test) {
  if (test === 'similarity') {
    let x = min(n, floor(n * pc0));
    if (Num.pbinom(x, n, pc0) <= alpha) { while (x + 1 <= n && Num.pbinom(x + 1, n, pc0) <= alpha) x++; return x; }
    while (x >= 0 && Num.pbinom(x, n, pc0) > alpha) x--;
    return x;
  }
  let x = max(0, ceil(n * pc0));
  const up = k => Num.pbinom(k - 1, n, pc0, true);
  if (up(x) <= alpha) { while (x - 1 >= 0 && up(x - 1) <= alpha) x--; return x; }
  while (x <= n && up(x) > alpha) x++;
  return x;
}
function pgOf(method) { return typeof method === 'number' ? method : Sens.pGuess(method); }
Sens.critical = function (method, n, alpha, test, pd0) {
  const pg = pgOf(method);
  if (alpha == null) alpha = 0.05;
  test = test || 'difference';
  if (!(Number.isInteger(n) && n >= 1) || !(alpha > 0 && alpha < 1)) return NaN;
  return critValue(n, pd2pc(pd0 || 0, pg), alpha, test);
};
/* alternative and null given as pd or as d′ (dA, d0) */
function altOpts(method, o, alpha, test, pd0) {
  o = (o !== null && typeof o === 'object') ? o : { pdA: o };
  const pg = pgOf(method);
  const pdOfD = d => pc2pd(Sens.pc(method, d), pg);
  const r = {
    pg,
    alpha: alpha != null ? alpha : o.alpha != null ? o.alpha : 0.05,
    test: test || o.test || 'difference',
    pd0: pd0 != null ? pd0 : o.pd0 != null ? o.pd0 : o.d0 != null ? pdOfD(o.d0) : 0,
    pdA: o.pdA != null ? o.pdA : o.dA != null ? pdOfD(o.dA) : NaN,
  };
  return r;
}
function powerAt(n, pcA, pc0, alpha, test) {
  const cr = critValue(n, pc0, alpha, test);
  if (test === 'similarity') return cr < 0 ? 0 : Num.pbinom(min(cr, n), n, pcA);
  return Num.pbinom(Num.clamp(cr, 1, n + 1) - 1, n, pcA, true);
}
/* Power of the exact test with n assessors. When a similarity test cannot
   reject at this n (critical value −1) the power is 0. */
Sens.power = function (method, n, o, alpha, test, pd0) {
  const a = altOpts(method, o, alpha, test, pd0);
  if (!(Number.isInteger(n) && n >= 1) || !(a.pdA >= 0 && a.pdA <= 1) || !(a.pd0 >= 0 && a.pd0 <= 1)) return NaN;
  if (a.test === 'difference' && a.pdA < a.pd0) return NaN;
  if (a.test === 'similarity' && a.pdA > a.pd0) return NaN;
  return powerAt(n, pd2pc(a.pdA, a.pg), pd2pc(a.pd0, a.pg), a.alpha, a.test);
};
/* Normal-approximation sample sizes that bracket the exact one: n = m², m
   the larger root of a·m² + b·m + c = 0 (m = √n), with a = pc0 − pcA,
   b = z_{1−α}√(pc0(1 − pc0)) − z_{1−β}√(pcA(1 − pcA)) and c = 0 (normal),
   ½ (continuity correction), c_L(α) for the lower bracket and 1 − c_L(1 − β)
   for the upper one, c_L(α) = −1 when α ≥ 0.01 and −1 − ⌈−log₁₀(100α)⌉
   otherwise; for a similarity test the roles of (pc0, α) and (pcA, β) are
   exchanged. These brackets reproduce the published search, so the sample
   size found is the same. */
function normalSS(pdA, pd0, target, alpha, pg, test, type) {
  const adjC = al => al >= 1e-2 ? -1 : -1 - ceil(-Math.log10(al * 100));
  let pow = target, pc0 = pd2pc(pd0, pg), pcA = pd2pc(pdA, pg);
  if (test === 'similarity') { const t = pcA; pcA = pc0; pc0 = t; const ta = alpha; alpha = 1 - pow; pow = 1 - ta; }
  const a = pc0 - pcA;
  const b = Num.qnorm(1 - alpha) * sqrt(pc0 * (1 - pc0)) - Num.qnorm(1 - pow) * sqrt(pcA * (1 - pcA));
  const c = type === 'normal' ? 0 : type === 'cont.normal' ? 0.5 : type === 'lwr' ? adjC(alpha) : 1 - adjC(1 - pow);
  const D = max(0, b * b - 4 * a * c);
  const x = (-b - sqrt(D)) / (2 * a);
  return max(1, roundEven(x * x));
}
/* The smallest n whose exact power exceeds the target, searched upwards
   from the lower normal bracket (exact power is a saw-tooth in n, so "the"
   sample size is the first n past the bracket with power > target). */
Sens.sampleSize = function (method, power, o, alpha, test, pd0) {
  const a = altOpts(method, o, alpha, test, pd0);
  if (!(power > 0 && power < 1) || !(a.alpha > 0 && a.alpha < 1) || !(a.pdA >= 0 && a.pdA <= 1)) return NaN;
  if (a.test === 'difference' && !(a.pdA > a.pd0)) return NaN;
  if (a.test === 'similarity' && !(a.pdA < a.pd0)) return NaN;
  if (power <= 0.5 || a.alpha >= 0.5) return NaN;
  const nn = normalSS(a.pdA, a.pd0, power, a.alpha, a.pg, a.test, 'cont.normal');
  if (nn > 1e5) return nn;
  const pcA = pd2pc(a.pdA, a.pg), pc0 = pd2pc(a.pd0, a.pg);
  const pw = n => powerAt(n, pcA, pc0, a.alpha, a.test);
  const nl = normalSS(a.pdA, a.pd0, power, a.alpha, a.pg, a.test, 'lwr');
  const nu = normalSS(a.pdA, a.pd0, power, a.alpha, a.pg, a.test, 'upr');
  if (pw(nl) >= power || pw(nu) <= power) return NaN;
  const from = nl + 1, step = nu >= from ? 1 : -1;
  let i = from;
  for (;; i += step) {
    if (pw(i) > power) break;
    if (i === nu) break;
  }
  return i;
};

/* ---- A–Not A ----
   Hits H = x1/n1 ("A" said to A samples), false alarms F = x2/n2 ("A" said to
   not-A samples). d′ = z(H) − z(F), the maximum-likelihood estimate of the
   probit model; se(d′)² = H(1 − H)/(n1 φ(z_H)²) + F(1 − F)/(n2 φ(z_F)²)
   (Macmillan & Creelman 2005, Detection Theory, 2nd ed., Erlbaum;
   Gourevitch & Galanter 1967, Psychometrika 32:25–33). The p-value is
   Fisher's one-sided exact test that the A samples draw more "A" answers
   (Fisher 1935, J. Roy. Statist. Soc. 98:39–82). */
function phyperUpper(x, m, nn, k) {
  /* P(X ≥ x), X hypergeometric: m marked, nn unmarked, k drawn */
  const lo = max(0, k - nn), hi = min(k, m), lt = lchoose(m + nn, k);
  let s = 0;
  for (let i = max(x, lo); i <= hi; i++) s += exp(lchoose(m, i) + lchoose(nn, k - i) - lt);
  return min(1, s);
}
Sens.aNotA = function (x1, n1, x2, n2, o) {
  o = o || {};
  const conf = o.conf == null ? 0.95 : o.conf;
  const ok = [x1, n1, x2, n2].every(Number.isInteger) && x1 > 0 && x2 > 0 && x1 < n1 && x2 < n2;
  if (!ok) return { x1, n1, x2, n2, hit: x1 / n1, fa: x2 / n2, d: NaN, se: NaN, ci: [NaN, NaN], p: NaN, conf,
    notes: [note('Se requieren enteros 0 < x1 < n1 y 0 < x2 < n2 (con proporciones de 0 o 1 el modelo probit no tiene estimación finita).', 'Integers 0 < x1 < n1 and 0 < x2 < n2 are required (with proportions of 0 or 1 the probit model has no finite estimate).')] };
  const H = x1 / n1, F = x2 / n2, zH = Num.qnorm(H), zF = Num.qnorm(F);
  const d = zH - zF;
  const se = sqrt(H * (1 - H) / (n1 * dn(zH) * dn(zH)) + F * (1 - F) / (n2 * dn(zF) * dn(zF)));
  const zc = Num.qnorm((1 + conf) / 2);
  const p = phyperUpper(x1, x1 + x2, (n1 - x1) + (n2 - x2), n1);
  return { x1, n1, x2, n2, hit: H, fa: F, d, se, ci: [d - zc * se, d + zc * se], p, conf, notes: [] };
};

/* ======================================================================
   LINEAR-MODEL TOOLS SHARED BY THE AFFECTIVE AND DESCRIPTIVE ANALYSES
   ====================================================================== */

/* Sequential (type I) sums of squares: the columns of each term, in the
   order given, are orthogonalised by modified Gram–Schmidt (two passes,
   which keeps the basis orthogonal to rounding) against the intercept and
   the previous terms; columns that add nothing (aliased) are skipped, so the
   degrees of freedom of a term are the columns it really adds. The sum of
   squares of a term is ‖Q_term ᵀ y‖². */
function seqAnova(y, terms) {
  const n = y.length, Q = [];
  const r = Float64Array.from(y);
  const dot = (a, b) => { let s = 0; for (let i = 0; i < n; i++) s += a[i] * b[i]; return s; };
  const add = v => {
    const n0 = sqrt(dot(v, v));
    if (!(n0 > 0)) return false;
    for (let pass = 0; pass < 2; pass++) for (const q of Q) { const c = dot(q, v); for (let i = 0; i < n; i++) v[i] -= c * q[i]; }
    const nv = sqrt(dot(v, v));
    if (nv <= 1e-9 * n0) return false;
    for (let i = 0; i < n; i++) v[i] /= nv;
    Q.push(v);
    return true;
  };
  add(new Float64Array(n).fill(1));
  { const c = dot(Q[0], r); for (let i = 0; i < n; i++) r[i] -= c * Q[0][i]; }
  const tss = dot(r, r);
  const out = terms.map(t => {
    let df = 0, ss = 0;
    t.cols.forEach(col => {
      const v = Float64Array.from(col);
      if (!add(v)) return;
      df++;
      const c = dot(v, r);
      ss += c * c;
      for (let i = 0; i < n; i++) r[i] -= c * v[i];
    });
    return { source: t.name, df, ss };
  });
  const rss = dot(r, r), dfRes = n - Q.length;
  return { terms: out, rss, dfRes, tss, resid: r };
}
/* indicator columns of a factor given as level indices */
function dummies(idx, L) {
  const n = idx.length, cols = [];
  for (let l = 0; l < L; l++) { const c = new Float64Array(n); for (let i = 0; i < n; i++) if (idx[i] === l) c[i] = 1; cols.push(c); }
  return cols;
}
function interactionCols(a, La, b, Lb) {
  const n = a.length, cols = [];
  for (let i = 0; i < La; i++) for (let j = 0; j < Lb; j++) {
    const c = new Float64Array(n);
    let any = false;
    for (let k = 0; k < n; k++) if (a[k] === i && b[k] === j) { c[k] = 1; any = true; }
    if (any) cols.push(c);
  }
  return cols;
}
/* ANOVA table rows from a sequential fit */
function anovaRows(fit) {
  const mse = fit.dfRes > 0 ? fit.rss / fit.dfRes : NaN;
  const rows = fit.terms.map(t => {
    const ms = t.df > 0 ? t.ss / t.df : NaN;
    const F = ms / mse;
    return { source: t.source, df: t.df, ss: t.ss, ms, F, p: isFinite(F) ? Num.pf(F, t.df, fit.dfRes, true) : NaN };
  });
  rows.push({ source: 'residual', df: fit.dfRes, ss: fit.rss, ms: mse, F: NaN, p: NaN });
  return rows;
}

/* Grouping letters from a matrix of pairwise p-values: means sorted in
   decreasing order, a letter is opened at the first mean that differs from
   the current reference mean and the reference moves down past every mean
   that differs from the new one. This is the sequential scheme used for the
   classical tables of means of agricultural research (Steel & Torrie 1980,
   Principles and Procedures of Statistics, 2nd ed., McGraw-Hill), written to
   reproduce, letter for letter, its widespread published implementation. */
const LETRAS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789'.split('')
  .concat(['.', '+', '-', '*', '/', '#', '$', '%', '&', '^', '[', ']', ':', '@', ';', '_', '?', '!', '=', '#']);
function lastC(s) { const t = s.replace(/ +$/, ''); return t.slice(-1); }
function letterGroups(means, P, alpha) {
  const n = means.length;
  const q = means.map((_, i) => i).sort((a, b) => (means[b] - means[a]) || (a - b));
  const M = new Array(n).fill('');
  const L = k => LETRAS[k] || ' ';
  if (!n) return [];
  let k = 0, j = 0, cambio1 = 0, chequeo = 0;
  M[0] = L(0);
  while (j < n - 1) {
    chequeo++;
    if (chequeo > n) break;
    for (let i = j; i < n; i++) {
      if (P[q[i]][q[j]] > alpha) {
        if (lastC(M[i]) !== L(k)) M[i] += L(k);
      } else {
        k++;
        const cambio = i, ja = j;
        cambio1 = 0;
        M[cambio] += L(k);
        for (let v = ja; v <= cambio; v++) {
          if (P[q[v]][q[cambio]] <= alpha) { j++; cambio1 = 1; } else break;
        }
        break;
      }
    }
    if (cambio1 === 0) j++;
  }
  const out = new Array(n);
  q.forEach((orig, pos) => { out[orig] = M[pos]; });
  return out;
}
/* exported: letters for any set of means (or rank sums) and their matrix of
   pairwise p-values, in the order the means are given */
Sens.letters = (means, P, alpha) => letterGroups(means, P, alpha == null ? 0.05 : alpha);
const toObj = (names, vals) => { const o = {}; names.forEach((nm, i) => { o[nm] = vals[i]; }); return o; };

/* Pairwise comparisons of means with a common error (MS, df):
   'HSD' — Tukey–Kramer: q = |ȳa − ȳb| / √(MS/2·(1/na + 1/nb)), p from the
           studentized range with k means (Tukey 1953, The Problem of Multiple
           Comparisons, Princeton; Kramer 1956, Biometrics 12:307–310);
   'LSD' — Fisher's least significant difference: t = |ȳa − ȳb| / √(MS(1/na + 1/nb)).
   With `tukeyOrder` the pairs run down the columns of the lower triangle
   (a later than b: 2−1, 3−1, …, 3−2, …), else as combinations (a earlier
   than b: 1−2, 1−3, …). */
function compareMeans(names, means, ns, ms, df, alpha, kind, tukeyOrder) {
  const k = means.length, P = Array.from({ length: k }, () => new Array(k).fill(1));
  const pairs = [];
  const qcrit = kind === 'HSD' ? Num.qtukey(1 - alpha, k, df) : Num.qt(1 - alpha / 2, df);
  const one = (a, b) => {
    const diff = means[a] - means[b];
    if (kind === 'HSD') {
      const s = sqrt(ms / 2 * (1 / ns[a] + 1 / ns[b]));
      const p = Num.ptukey(abs(diff) / s, k, df, true);
      return { a: names[a], b: names[b], diff, se: s * SQRT2, lwr: diff - qcrit * s, upr: diff + qcrit * s, p };
    }
    const s = sqrt(ms * (1 / ns[a] + 1 / ns[b]));
    const p = Num.pt2(diff / s, df);
    return { a: names[a], b: names[b], diff, se: s, lwr: diff - qcrit * s, upr: diff + qcrit * s, p };
  };
  if (tukeyOrder) { for (let i = 0; i < k - 1; i++) for (let j = i + 1; j < k; j++) { const r = one(j, i); P[i][j] = P[j][i] = r.p; pairs.push(r); } }
  else { for (let i = 0; i < k - 1; i++) for (let j = i + 1; j < k; j++) { const r = one(i, j); P[i][j] = P[j][i] = r.p; pairs.push(r); } }
  const balanced = ns.every(v => v === ns[0]);
  const crit = !balanced ? NaN : kind === 'HSD' ? qcrit * sqrt(ms / ns[0]) : qcrit * sqrt(2 * ms / ns[0]);
  return { pairs, P, letters: toObj(names, letterGroups(means, P, alpha)), crit, quantile: qcrit };
}

/* ======================================================================
   2. AFFECTIVE TESTS
   ====================================================================== */

/* Hedonic test (Peryam & Pilgrim 1957, Food Technol. 11:9–14): the scores
   follow score = μ + product + consumer + ε (consumers as blocks). ANOVA by
   sequential sums of squares, product first; when consumers did not score
   every product, `productAdjusted` gives the product effect adjusted for
   consumers (product entered last). Tukey–Kramer comparisons of the product
   means with the residual mean square; grouping letters; the least
   significant difference `hsd` when every product has the same n. */
Sens.hedonic = function (rows, o) {
  o = o || {};
  const alpha = o.alpha == null ? 0.05 : o.alpha;
  const data = (rows || []).filter(r => r && r.product != null && r.consumer != null && isNum(r.score));
  const notes = [];
  if (data.length < (rows || []).length) notes.push(note('Se omitieron filas sin producto, consumidor o puntuación numérica.', 'Rows without product, consumer or a numeric score were left out.'));
  const P = levelsOf(data.map(r => r.product)), C = levelsOf(data.map(r => r.consumer));
  const y = data.map(r => r.score);
  const pi = data.map(r => P.index.get(String(r.product))), ci = data.map(r => C.index.get(String(r.consumer)));
  const kP = P.names.length;
  const fit = seqAnova(y, [{ name: 'product', cols: dummies(pi, kP) }, { name: 'consumer', cols: dummies(ci, C.names.length) }]);
  const anova = anovaRows(fit);
  const mse = fit.dfRes > 0 ? fit.rss / fit.dfRes : NaN, dfe = fit.dfRes;
  const groups = P.names.map(() => []);
  data.forEach((r, i) => groups[pi[i]].push(y[i]));
  const means = P.names.map((nm, k) => {
    const v = groups[k], n = v.length, m = Num.mean(v), sd = Num.sd(v);
    return { product: nm, n, mean: m, sd, se: sqrt(mse / n), seSample: sd / sqrt(n) };
  });
  const ns = means.map(m => m.n);
  const balanced = ns.every(v => v === ns[0]) && ns[0] === C.names.length;
  let productAdjusted = null;
  if (!balanced) {
    const f2 = seqAnova(y, [{ name: 'consumer', cols: dummies(ci, C.names.length) }, { name: 'product', cols: dummies(pi, kP) }]);
    const t = f2.terms[1], ms = t.ss / t.df, F = ms / mse;
    productAdjusted = { source: 'product', df: t.df, ss: t.ss, ms, F, p: Num.pf(F, t.df, dfe, true) };
    notes.push(note('Diseño desbalanceado (no todos los consumidores calificaron todos los productos): la tabla de ANOVA es secuencial, con el producto primero, y el efecto de producto que se informa es el ajustado por consumidor (producto al final). Las comparaciones usan las medias observadas.', 'Unbalanced design (not every consumer scored every product): the ANOVA table is sequential, with product first, and the product effect reported is the one adjusted for consumers (product entered last). The comparisons use the observed means.'));
  }
  const cmp = compareMeans(P.names, means.map(m => m.mean), ns, mse, dfe, alpha, 'HSD', true);
  return {
    products: P.names, consumers: C.names, n: y.length, alpha,
    anova, productAdjusted, means,
    tukey: { pairs: cmp.pairs.map(r => ({ a: r.a, b: r.b, diff: r.diff, lwr: r.lwr, upr: r.upr, p: r.p })), letters: cmp.letters, hsd: cmp.crit, q: cmp.quantile },
    mse, dfe, cv: 100 * sqrt(mse) / Num.mean(y), grandMean: Num.mean(y), balanced, notes,
  };
};

/* Just-about-right scales and penalty analysis. Each consumer rates each
   attribute on a JAR scale (1 … levels, the centre being "just about right")
   and gives an overall liking score. For every product × attribute the
   answers are collapsed into "too little" (below the centre), JAR and "too
   much"; the mean drop in liking of each non-JAR group, drop = ȳ_JAR − ȳ_group,
   is weighted by the share of consumers in it, penalty = drop·pct/100, and
   tested with a pooled-variance two-sample t test of the group against the
   JAR group (Rothman & Parker 2009, Just-About-Right Scales, ASTM MNL63;
   Xiong & Meullenet 2006, Food Qual. Prefer. 17:188–198). Groups holding at
   least `threshold` % of the consumers are flagged. */
Sens.jar = function (rows, o) {
  o = o || {};
  const levels = o.levels || 5, threshold = o.threshold == null ? 20 : o.threshold;
  const center = o.center != null ? o.center : (levels + 1) / 2;
  if (!Number.isInteger(center)) throw new Error('Sens.jar: an even number of levels has no centre; give opts.center');
  const data = (rows || []).filter(r => r && r.product != null && r.attribute != null && isNum(r.jar) && isNum(r.liking) && r.jar >= 1 && r.jar <= levels);
  const P = levelsOf(data.map(r => r.product)), A = levelsOf(data.map(r => r.attribute));
  const ttest = (g, j) => {
    if (g.length < 2 || j.length < 2) return NaN;
    const mg = Num.mean(g), mj = Num.mean(j), df = g.length + j.length - 2;
    const sp2 = ((g.length - 1) * Num.variance(g) + (j.length - 1) * Num.variance(j)) / df;
    const t = (mj - mg) / sqrt(sp2 * (1 / g.length + 1 / j.length));
    return isFinite(t) ? Num.pt2(t, df) : NaN;
  };
  const out = [];
  P.names.forEach(pn_ => A.names.forEach(an => {
    const sub = data.filter(r => String(r.product) === pn_ && String(r.attribute) === an);
    if (!sub.length) return;
    const lowV = sub.filter(r => r.jar < center).map(r => r.liking);
    const jarV = sub.filter(r => r.jar === center).map(r => r.liking);
    const highV = sub.filter(r => r.jar > center).map(r => r.liking);
    const n = sub.length, m = v => v.length ? Num.mean(v) : NaN;
    const pctLow = 100 * lowV.length / n, pctJar = 100 * jarV.length / n, pctHigh = 100 * highV.length / n;
    const meanJar = m(jarV), meanLow = m(lowV), meanHigh = m(highV);
    const dropLow = meanJar - meanLow, dropHigh = meanJar - meanHigh;
    out.push({
      product: pn_, attribute: an, n, nLow: lowV.length, nJar: jarV.length, nHigh: highV.length,
      pctLow, pctJar, pctHigh, meanLiking: m(sub.map(r => r.liking)), meanJar, meanLow, meanHigh,
      dropLow, dropHigh, penaltyLow: dropLow * pctLow / 100, penaltyHigh: dropHigh * pctHigh / 100,
      pLow: ttest(lowV, jarV), pHigh: ttest(highV, jarV),
      flagLow: pctLow >= threshold, flagHigh: pctHigh >= threshold,
    });
  }));
  return { levels, center, threshold, products: P.names, attributes: A.names, results: out };
};

/* Cochran's Q for k related binary samples (Cochran 1950, Biometrika
   37:256–266): Q = (k − 1)[k ΣC_j² − N²] / (k N − ΣR_i²), χ² with k − 1 df;
   C_j column totals, R_i block totals, N the grand total. Blocks with a
   missing value are dropped; blocks all 0 or all 1 add nothing. */
Sens.cochranQ = function (M) {
  const rows = (M || []).filter(r => r && r.every(v => v === 0 || v === 1 || v === true || v === false)).map(r => r.map(Number));
  const b = rows.length, k = b ? rows[0].length : 0;
  if (b < 1 || k < 2) return { Q: NaN, df: k - 1, p: NaN, blocks: b, k };
  const C = new Array(k).fill(0);
  let N = 0, sR2 = 0;
  rows.forEach(r => { let s = 0; r.forEach((v, j) => { C[j] += v; s += v; }); N += s; sR2 += s * s; });
  const den = k * N - sR2;
  const Q = den > 0 ? (k - 1) * (k * C.reduce((s, c) => s + c * c, 0) - N * N) / den : NaN;
  return { Q, df: k - 1, p: isFinite(Q) ? Num.pchisq(Q, k - 1, true) : NaN, blocks: b, k, colTotals: C };
};
/* McNemar's test for paired binary answers (McNemar 1947, Psychometrika
   12:153–157): χ² = (|b − c| − 1)²/(b + c) with the continuity correction
   (applied only when b ≠ c), (b − c)²/(b + c) without; 1 df. x and y are the
   paired 0/1 vectors, or x is the 2×2 table [[n00, n01], [n10, n11]]. */
Sens.mcnemar = function (x, y, o) {
  let b, c, tab;
  if (y == null || (!Array.isArray(y) && typeof y === 'object')) {
    /* table form: mcnemar(table, opts) */
    o = y || o || {};
    tab = x; b = x[0][1]; c = x[1][0];
  } else {
    o = o || {};
    tab = [[0, 0], [0, 0]];
    for (let i = 0; i < x.length; i++) {
      const u = Number(x[i]), v = Number(y[i]);
      if ((u === 0 || u === 1) && (v === 0 || v === 1)) tab[u][v]++;
    }
    b = tab[0][1]; c = tab[1][0];
  }
  const cc = o.correct !== false && b !== c;
  const num = cc ? (abs(b - c) - 1) ** 2 : (b - c) ** 2;
  const stat = b + c > 0 ? num / (b + c) : NaN;
  return { statistic: stat, df: 1, p: isFinite(stat) ? Num.pchisq(stat, 1, true) : NaN, b, c, table: tab, correct: cc };
};

/* Check-all-that-apply questions (Adams et al. 2007, Pangborn Symposium;
   Meyners, Castura & Carr 2013, Food Qual. Prefer. 30:309–319): citation
   counts and percentages per product × attribute; for each attribute
   Cochran's Q across products (consumers as blocks, those who tasted every
   product) and McNemar's test for every pair of products with Holm's
   adjustment (Holm 1979, Scand. J. Statist. 6:65–70); and the correspondence
   analysis of the contingency table of counts. */
Sens.cata = function (rows, o) {
  o = o || {};
  const data = (rows || []).filter(r => r && r.product != null && r.consumer != null);
  let attrs = o.attributes;
  if (!attrs) {
    const skip = new Set(['consumer', 'product', 'session']);
    attrs = Object.keys(data[0] || {}).filter(k => !skip.has(k));
  }
  const P = levelsOf(data.map(r => r.product)), C = levelsOf(data.map(r => r.consumer));
  const kP = P.names.length;
  const counts = P.names.map(() => new Array(attrs.length).fill(0));
  const nEval = new Array(kP).fill(0);
  const cell = new Map();
  data.forEach(r => {
    const p = P.index.get(String(r.product));
    nEval[p]++;
    attrs.forEach((a, j) => { if (Number(r[a]) === 1) counts[p][j]++; });
    cell.set(String(r.consumer) + '\u0001' + p, r);
  });
  const pct = counts.map((row, i) => row.map(v => 100 * v / nEval[i]));
  const complete = C.names.filter(c => P.names.every((_, p) => cell.has(c + '\u0001' + p)));
  const perAttribute = attrs.map(a => {
    const M = complete.map(c => P.names.map((_, p) => Number(cell.get(c + '\u0001' + p)[a]) === 1 ? 1 : 0));
    const q = Sens.cochranQ(M);
    const pairs = [];
    for (let i = 0; i < kP - 1; i++) for (let j = i + 1; j < kP; j++) {
      const t = Sens.mcnemar(M.map(r => r[i]), M.map(r => r[j]), { correct: o.correct !== false });
      pairs.push({ a: P.names[i], b: P.names[j], stat: t.statistic, p: t.p, b01: t.b, b10: t.c });
    }
    const ok = pairs.filter(r => isFinite(r.p));
    const adj = Num.padjust(ok.map(r => r.p), 'holm');
    ok.forEach((r, i) => { r.pAdj = adj[i]; });
    pairs.forEach(r => { if (r.pAdj === undefined) r.pAdj = NaN; });
    return { attribute: a, Q: q.Q, df: q.df, p: q.p, blocks: q.blocks, pairs };
  });
  /* the CA leaves out attributes never checked (and products with no checks) */
  const keepC = attrs.map((_, j) => counts.some(r => r[j] > 0));
  const keepR = counts.map(r => r.some((v, j) => keepC[j] && v > 0));
  const tab = counts.filter((_, i) => keepR[i]).map(r => r.filter((_, j) => keepC[j]));
  const ca = tab.length >= 2 && tab[0].length >= 2 ? Sens.ca(tab, { rowNames: P.names.filter((_, i) => keepR[i]), colNames: attrs.filter((_, j) => keepC[j]) }) : null;
  return { products: P.names, attributes: attrs, nEval, counts, pct, consumersComplete: complete.length, perAttribute, ca };
};

/* Correspondence analysis (Benzécri 1973, L'Analyse des Données, Dunod;
   Greenacre 1984, Theory and Applications of Correspondence Analysis,
   Academic Press). With P = N/n, row masses r and column masses c, the SVD
   of S = D_r^{-½}(P − rcᵀ)D_c^{-½} = UΣVᵀ gives the eigenvalues λ = σ², the
   principal coordinates F = D_r^{-½}UΣ (rows) and G = D_c^{-½}VΣ (columns),
   contributions 100·r_i F_is²/λ_s, squared cosines F_is²/d_i² with
   d_i² = Σ_j (p_ij/r_i − c_j)²/c_j, and the χ² test of independence,
   χ² = n·Σλ with (I − 1)(J − 1) df. Axis signs: on each axis the column with
   the largest |standard coordinate| is made positive (a fixed convention;
   comparisons with other programs must align signs axis by axis). */
Sens.ca = function (table, o) {
  o = o || {};
  const N = table.map(r => r.map(Number)), I = N.length, J = N[0].length;
  let n = 0;
  N.forEach(r => r.forEach(v => { n += v; }));
  const rM = N.map(r => r.reduce((s, v) => s + v, 0) / n);
  const cM = N[0].map((_, j) => N.reduce((s, r) => s + r[j], 0) / n);
  const S = N.map((r, i) => r.map((v, j) => (v / n - rM[i] * cM[j]) / sqrt(rM[i] * cM[j])));
  const sv = Num.mat.svd(S);
  let K = min(I - 1, J - 1);
  const tot = sv.d.slice(0, K).reduce((s, v) => s + v * v, 0);
  /* axes with no inertia (a table of lower rank) are left out */
  while (K > 0 && !(sv.d[K - 1] * sv.d[K - 1] > 1e-12 * tot)) K--;
  const eig = sv.d.slice(0, K).map(s => s * s);
  for (let s = 0; s < K; s++) {
    let big = 0;
    for (let j = 0; j < J; j++) if (abs(sv.v[j][s]) > abs(sv.v[big][s])) big = j;
    if (sv.v[big][s] < 0) { for (let j = 0; j < J; j++) sv.v[j][s] = -sv.v[j][s]; for (let i = 0; i < I; i++) sv.u[i][s] = -sv.u[i][s]; }
  }
  const Fr = N.map((_, i) => eig.map((_, s) => sv.u[i][s] * sv.d[s] / sqrt(rM[i])));
  const Gc = N[0].map((_, j) => eig.map((_, s) => sv.v[j][s] * sv.d[s] / sqrt(cM[j])));
  const d2r = N.map((r, i) => r.reduce((s, v, j) => s + (v / n / rM[i] - cM[j]) ** 2 / cM[j], 0));
  const d2c = N[0].map((_, j) => N.reduce((s, r, i) => s + (r[j] / n / cM[j] - rM[i]) ** 2 / rM[i], 0));
  const chi2 = n * tot, df = (I - 1) * (J - 1);
  return {
    eig, pct: eig.map(v => 100 * v / tot), cum: eig.map((_, s) => 100 * eig.slice(0, s + 1).reduce((a, b) => a + b, 0) / tot),
    row: { names: o.rowNames || null, mass: rM, coord: Fr, contrib: Fr.map((f, i) => f.map((v, s) => 100 * rM[i] * v * v / eig[s])), cos2: Fr.map((f, i) => f.map(v => v * v / d2r[i])), inertia: rM.map((m, i) => m * d2r[i]) },
    col: { names: o.colNames || null, mass: cM, coord: Gc, contrib: Gc.map((f, j) => f.map((v, s) => 100 * cM[j] * v * v / eig[s])), cos2: Gc.map((f, j) => f.map(v => v * v / d2c[j])), inertia: cM.map((m, j) => m * d2c[j]) },
    inertia: tot, chi2, df, p: Num.pchisq(chi2, df, true), n,
  };
};

/* Friedman's rank test for a randomised complete block design (Friedman
   1937, J. Am. Statist. Assoc. 32:675–701): ranks within each block (mid-ranks
   for ties), rank sums R_j, A = Σr², C = b·t(t + 1)²/4,
   χ²_F = (t − 1)(ΣR_j² − bC)/(A − C) (tie-corrected), with t − 1 df. Multiple
   comparisons of rank sums (Conover 1999, Practical Nonparametric Statistics,
   3rd ed., Wiley, §5.8): |R_i − R_j| > t_{1−α/2, (b−1)(t−1)}·√(2(bA − ΣR_j²)/((b − 1)(t − 1))). */
Sens.friedman = function (M, o) {
  o = o || {};
  const alpha = o.alpha == null ? 0.05 : o.alpha;
  const rows = (M || []).filter(r => r && r.every(isNum));
  const b = rows.length, t = b ? rows[0].length : 0;
  const names = o.names || Array.from({ length: t }, (_, j) => String(j + 1));
  const ranks = rows.map(r => Array.from(Num.rank(r)));
  const Rs = names.map((_, j) => ranks.reduce((s, r) => s + r[j], 0));
  let A = 0;
  ranks.forEach(r => r.forEach(v => { A += v * v; }));
  const C = b * t * (t + 1) * (t + 1) / 4, sR2 = Rs.reduce((s, v) => s + v * v, 0);
  const chi2 = (t - 1) * (sR2 - b * C) / (A - C);
  const chi2NoTies = 12 * Rs.reduce((s, v) => s + (v - b * (t + 1) / 2) ** 2, 0) / (b * t * (t + 1));
  const dfe = (b - 1) * (t - 1);
  const F = (b - 1) * chi2 / (b * (t - 1) - chi2);
  const sd = sqrt(2 * (b * A - sR2) / dfe);
  const tq = Num.qt(1 - alpha / 2, dfe);
  const P = Array.from({ length: t }, () => new Array(t).fill(1)), pairs = [];
  for (let i = 0; i < t - 1; i++) for (let j = i + 1; j < t; j++) {
    const diff = Rs[i] - Rs[j], p = Num.pt2(diff / sd, dfe);
    P[i][j] = P[j][i] = p;
    pairs.push({ a: names[i], b: names[j], diff, p });
  }
  const notes = rows.length < (M || []).length ? [note('Se omitieron bloques incompletos.', 'Incomplete blocks were left out.')] : [];
  return {
    names, blocks: b, k: t, rankSums: toObj(names, Rs), rankSumList: Rs, meanRanks: toObj(names, Rs.map(v => v / b)),
    chi2, df: t - 1, p: isFinite(chi2) ? Num.pchisq(chi2, t - 1, true) : NaN,
    chi2NoTies, pNoTies: Num.pchisq(chi2NoTies, t - 1, true),
    F, dfError: dfe, pF: isFinite(F) ? Num.pf(F, t - 1, dfe, true) : NaN,
    lsd: tq * sd, pairs, letters: toObj(names, letterGroups(Rs, P, alpha)), alpha, notes,
  };
};

/* ======================================================================
   3. DESCRIPTIVE ANALYSIS
   ====================================================================== */

/* Quantitative descriptive analysis (Stone et al. 1974, Food Technol.
   28:24–34). For each attribute, the ANOVA
     y = μ + product + assessor + [session] + product:assessor + ε
   by sequential sums of squares (the interaction only when assessors scored
   products more than once). With the assessor as a random effect the
   product effect is tested against the interaction, F = MS_P/MS_PA
   (Lea, Næs & Rødbotten 1997, Analysis of Variance for Sensory Data, Wiley;
   Næs, Brockhoff & Tomic 2010, Statistics for Sensory and Consumer Science,
   Wiley), and the means are compared with that same error (LSD or Tukey).
   Assessor performance per attribute: discrimination (one-way ANOVA of the
   assessor's own scores across products, using the replicates),
   repeatability (the residual standard deviation of that ANOVA) and
   agreement (Pearson's r between the assessor's product means and the
   panel's, the panel means being the averages of the assessor × product
   cell means). */
Sens.qda = function (rows, o) {
  o = o || {};
  const alpha = o.alpha == null ? 0.05 : o.alpha;
  const kind = (o.multcomp || 'LSD').toUpperCase() === 'HSD' ? 'HSD' : 'LSD';
  const random = o.random !== false;
  const all = (rows || []).filter(r => r && r.product != null && r.panelist != null);
  let attrs = o.attributes;
  if (!attrs) {
    const skip = new Set(['panelist', 'product', 'session', 'replicate']);
    attrs = Object.keys(all[0] || {}).filter(k => !skip.has(k) && isNum(all[0][k]));
  }
  const P = levelsOf(all.map(r => r.product)), J = levelsOf(all.map(r => r.panelist));
  const hasSes = all.some(r => r.session != null);
  const S = levelsOf(hasSes ? all.map(r => r.session == null ? '' : r.session) : []);
  const useSession = hasSes && S.names.length > 1;
  const perPanel = J.names.map(() => []);
  const results = attrs.map(attr => {
    const data = all.filter(r => isNum(r[attr]));
    const y = data.map(r => r[attr]);
    const pi = data.map(r => P.index.get(String(r.product))), ji = data.map(r => J.index.get(String(r.panelist)));
    const cellN = new Map();
    data.forEach((r, i) => { const k = pi[i] + ',' + ji[i]; cellN.set(k, (cellN.get(k) || 0) + 1); });
    const replicated = Array.from(cellN.values()).some(v => v > 1);
    const terms = [{ name: 'product', cols: dummies(pi, P.names.length) }, { name: 'panelist', cols: dummies(ji, J.names.length) }];
    if (useSession) terms.push({ name: 'session', cols: dummies(data.map(r => S.index.get(String(r.session == null ? '' : r.session))), S.names.length) });
    if (replicated) terms.push({ name: 'product:panelist', cols: interactionCols(pi, P.names.length, ji, J.names.length) });
    const fit = seqAnova(y, terms);
    const anova = anovaRows(fit);
    const rowP = anova[0], rowI = replicated ? anova.find(r => r.source === 'product:panelist') : null;
    let fMixed = rowP.F, pMixed = rowP.p, errMS = anova[anova.length - 1].ms, errDf = fit.dfRes;
    if (random && rowI && rowI.df > 0) {
      fMixed = rowP.ms / rowI.ms; pMixed = Num.pf(fMixed, rowP.df, rowI.df, true);
      errMS = rowI.ms; errDf = rowI.df;
    }
    /* means and comparisons */
    const groups = P.names.map(() => []);
    data.forEach((r, i) => groups[pi[i]].push(y[i]));
    const means = P.names.map((nm, k) => ({ product: nm, n: groups[k].length, mean: groups[k].length ? Num.mean(groups[k]) : NaN, sd: Num.sd(groups[k]), se: sqrt(errMS / groups[k].length) }));
    const present = means.filter(m => m.n > 0);
    const cmp = compareMeans(present.map(m => m.product), present.map(m => m.mean), present.map(m => m.n), errMS, errDf, alpha, kind, false);
    /* panel means: averages of the assessor × product cell means */
    const cellSum = new Map();
    data.forEach((r, i) => { const k = pi[i] + ',' + ji[i]; cellSum.set(k, (cellSum.get(k) || 0) + y[i]); });
    const cellMean = (p, j) => { const k = p + ',' + j; return cellN.has(k) ? cellSum.get(k) / cellN.get(k) : NaN; };
    const panelMeans = P.names.map((_, p) => { const v = J.names.map((_, j) => cellMean(p, j)).filter(isFinite); return v.length ? Num.mean(v) : NaN; });
    const panelists = J.names.map((jn, j) => {
      const idx = [];
      ji.forEach((v, i) => { if (v === j) idx.push(i); });
      const yj = idx.map(i => y[i]), pj = idx.map(i => pi[i]);
      const L = levelsOf(pj);
      const f1 = seqAnova(yj, [{ name: 'product', cols: dummies(pj.map(v => L.index.get(String(v))), L.names.length) }]);
      const t1 = f1.terms[0], mse1 = f1.dfRes > 0 ? f1.rss / f1.dfRes : NaN;
      const F = t1.df > 0 ? (t1.ss / t1.df) / mse1 : NaN;
      const own = P.names.map((_, p) => cellMean(p, j));
      const ok = own.map((v, p) => isFinite(v) && isFinite(panelMeans[p]));
      const a = own.filter((_, p) => ok[p]), b = panelMeans.filter((_, p) => ok[p]);
      const agreement = a.length > 1 && Num.variance(a) > 1e-20 ? pearson(a, b) : NaN;
      const rec = { panelist: jn, n: yj.length, dfProduct: t1.df, dfResidual: f1.dfRes, fProduct: F, pProduct: isFinite(F) ? Num.pf(F, t1.df, f1.dfRes, true) : NaN, repeatability: sqrt(mse1), agreement };
      perPanel[j].push(rec);
      return rec;
    });
    const tss = fit.tss;
    return {
      attribute: attr, n: y.length, replicated, anova, fProductMixed: fMixed, pProductMixed: pMixed,
      errorMS: errMS, errorDf: errDf, multcomp: kind,
      r2: 1 - fit.rss / tss, sdResidual: sqrt(anova[anova.length - 1].ms),
      means, panelMeans: toObj(P.names, panelMeans), letters: cmp.letters,
      pairs: cmp.pairs.map(r => ({ a: r.a, b: r.b, diff: r.diff, p: r.p })), crit: cmp.crit,
      panelists,
    };
  });
  const med = v => { const w = v.filter(isFinite); return w.length ? Num.median(w) : NaN; };
  const avg = v => { const w = v.filter(isFinite); return w.length ? Num.mean(w) : NaN; };
  const panelSummary = J.names.map((jn, j) => {
    const r = perPanel[j];
    return {
      panelist: jn, attributes: r.length,
      nDiscriminating: r.filter(x => x.pProduct < alpha).length,
      medianP: med(r.map(x => x.pProduct)),
      meanRepeatability: avg(r.map(x => x.repeatability)),
      medianAgreement: med(r.map(x => x.agreement)), meanAgreement: avg(r.map(x => x.agreement)),
    };
  });
  return { products: P.names, panelists: J.names, sessions: useSession ? S.names : [], attributes: attrs, alpha, results, panelSummary };
};
function pearson(a, b) {
  const ma = Num.mean(a), mb = Num.mean(b);
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < a.length; i++) { const u = a[i] - ma, v = b[i] - mb; sab += u * v; saa += u * u; sbb += v * v; }
  return sab / sqrt(saa * sbb);
}
Sens.pearson = pearson;

/* Principal component analysis (Pearson 1901, Phil. Mag. 2:559–572;
   Hotelling 1933, J. Educ. Psychol. 24:417–441) of an n × p table, rows of
   weight 1/n: the columns are centred and, when `scale`, divided by their
   standard deviation computed with divisor n. The SVD Z/√n = UDVᵀ gives the
   eigenvalues λ = d², the row coordinates ZV, the variable coordinates VD
   (correlations with the components when scaled, covariances otherwise),
   contributions (rows: 100·coord²/(nλ); variables: 100·coord²/λ) and squared
   cosines. Axis signs: the variable with the largest |loading| on each axis
   is made positive (a fixed convention; align signs axis by axis before
   comparing with other programs). */
Sens.pca = function (X, o) {
  o = o || {};
  const scale = o.scale !== false;
  const n = X.length, p = X[0].length, notes = [];
  const m = new Array(p).fill(0), s = new Array(p).fill(1);
  for (let j = 0; j < p; j++) {
    const col = X.map(r => r[j]);
    m[j] = Num.mean(col);
    const v = col.reduce((a, x) => a + (x - m[j]) * (x - m[j]), 0) / n;
    s[j] = sqrt(v);
  }
  const Z = X.map(r => r.map((v, j) => (v - m[j]) / (scale ? (s[j] > 0 ? s[j] : 1) : 1)));
  if (scale && s.some(v => !(v > 0))) notes.push(note('Hay variables constantes: no se pueden estandarizar y no aportan a los ejes.', 'Some variables are constant: they cannot be standardized and add nothing to the axes.'));
  const A = Z.map(r => r.map(v => v / sqrt(n)));
  const sv = Num.mat.svd(A);
  let K = min(n - 1, p, o.ncp || Infinity);
  const eigAll = sv.d.map(d => d * d);
  const tr = eigAll.reduce((a, b) => a + b, 0);
  while (K > 0 && !(eigAll[K - 1] > 1e-12 * tr)) K--;
  for (let k = 0; k < K; k++) {
    let big = 0;
    for (let j = 0; j < p; j++) if (abs(sv.v[j][k]) > abs(sv.v[big][k])) big = j;
    if (sv.v[big][k] < 0) { for (let j = 0; j < p; j++) sv.v[j][k] = -sv.v[j][k]; for (let i = 0; i < n; i++) sv.u[i][k] = -sv.u[i][k]; }
  }
  const eig = eigAll.slice(0, K);
  const indCoord = Z.map((_, i) => eig.map((_, k) => sqrt(n) * sv.u[i][k] * sv.d[k]));
  const dist2 = Z.map(r => r.reduce((a, v) => a + v * v, 0));
  const varCoord = m.map((_, j) => eig.map((_, k) => sv.v[j][k] * sv.d[k]));
  const varVar = scale ? m.map((_, j) => s[j] > 0 ? 1 : 0) : s.map(v => v * v);
  return {
    eig, pct: eig.map(v => 100 * v / tr), cum: eig.map((_, k) => 100 * eig.slice(0, k + 1).reduce((a, b) => a + b, 0) / tr),
    ind: { names: o.rowNames || null, coord: indCoord, cos2: indCoord.map((r, i) => r.map(v => v * v / dist2[i])), contrib: indCoord.map(r => r.map((v, k) => 100 * v * v / (n * eig[k]))), dist: dist2.map(sqrt) },
    var: { names: o.colNames || null, coord: varCoord, cor: varCoord.map((r, j) => r.map(v => v / (scale ? 1 : (s[j] > 0 ? s[j] : NaN)))), cos2: varCoord.map((r, j) => r.map(v => v * v / varVar[j])), contrib: varCoord.map(r => r.map((v, k) => 100 * v * v / eig[k])) },
    center: m, scaleBy: scale ? s : null, notes,
  };
};

/* ======================================================================
   4. TASTING DESIGN
   ====================================================================== */

/* Williams designs (Williams 1949, Aust. J. Sci. Res. A2:149–168; MacFie et
   al. 1989, J. Sens. Stud. 4:129–148): a Latin square whose first row is
   0, 1, t−1, 2, t−2, 3, … and whose row r adds r (mod t). For even t every
   product follows every other product exactly once; for odd t > 1 the square
   is joined by its mirror image (each row reversed) and every ordered pair of
   neighbours occurs exactly twice in the 2t rows. Products are numbered
   0 … t−1. */
Sens.williams = function (t) {
  if (!(Number.isInteger(t) && t >= 1)) throw new Error('Sens.williams: t must be a positive integer');
  const first = [0];
  for (let k = 1, lo = 1, hi = t - 1; k < t; k++) first.push(k % 2 ? lo++ : hi--);
  const sq = Array.from({ length: t }, (_, r) => first.map(v => (v + r) % t));
  return t % 2 && t > 1 ? sq.concat(sq.map(row => row.slice().reverse())) : sq;
};
/* n distinct three-digit codes (100 … 999) drawn without replacement with
   the seeded generator. */
Sens.codes = function (n, seed) {
  if (!(Number.isInteger(n) && n >= 0 && n <= 900)) throw new Error('Sens.codes: n must be an integer between 0 and 900');
  const rng = Num.rng(seed == null ? 1 : seed);
  const pool = Array.from({ length: 900 }, (_, i) => 100 + i);
  for (let i = 0; i < n; i++) { const j = i + floor(rng() * (900 - i)); const t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  return pool.slice(0, n);
};
/* Serving plan: assessor a receives row a (mod number of rows) of the
   Williams design, so the plan is balanced for position and first-order
   carry-over whenever the number of assessors is a multiple of the number
   of rows. Each product carries one code for the whole session, or its own
   code for every assessor (opts.codePerAssessor). Returns the array
   [{assessor, row, order: [{position, product, code}]}], which also carries
   the properties rows (rows of the design), balanced and notes. */
Sens.servingPlan = function (nAssessors, products, seed, o) {
  o = o || {};
  const t = products.length, W = Sens.williams(t);
  const perA = !!o.codePerAssessor;
  const codes = Sens.codes(perA ? min(900, t * nAssessors) : t, seed);
  if (perA && t * nAssessors > 900) throw new Error('Sens.servingPlan: more than 900 codes needed');
  const plan = [];
  for (let a = 0; a < nAssessors; a++) {
    const row = W[a % W.length];
    plan.push({ assessor: a + 1, row: a % W.length, order: row.map((p, pos) => ({ position: pos + 1, product: products[p], code: codes[perA ? a * t + p : p] })) });
  }
  plan.rows = W.length;
  plan.balanced = nAssessors % W.length === 0;
  plan.notes = plan.balanced ? [] : [note('El número de evaluadores no es múltiplo de ' + W.length + ': el balance de posición y arrastre es incompleto.', 'The number of assessors is not a multiple of ' + W.length + ': position and carry-over balance is incomplete.')];
  return plan;
};

g.Sens = Sens;
return Sens;
}
if (typeof window !== 'undefined') SensCore(window);
