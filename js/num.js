/* PostHarvestPro — postharvest physiology and technology, quality, shelf life
   and sensory evaluation, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* PostHarvestPro — the numerical core.

   Sums, moments and ranks; the special functions and the probability laws
   (normal, t, χ², F, beta, gamma, binomial, studentized range, many-to-one
   comparisons); quadrature; small dense linear algebra (LU, Cholesky,
   symmetric eigenproblem, singular values); the linear model; root finding,
   simplex and Levenberg–Marquardt optimisers; and a seeded random generator.

   Wrapped in a named function that installs `Num` in the global object it is
   given: the page calls it with `window` and the test benches with a sandbox.
   Nothing here touches the DOM. */
function NumCore(g) {
'use strict';
const { abs, sqrt, exp, log, log1p, expm1, floor, PI, min, max } = Math;
const Num = {};
const LN_SQRT_2PI = 0.9189385332046727418;
const SQRT2 = 1.4142135623730950488;

/* ---------------- sums and moments ----------------
   Neumaier's compensated sum, and two-pass mean and variance: the naive
   one-pass formula loses every digit when the mean is large compared with the
   spread (heights in mm, dates as numbers…). */
Num.sum = function (a) {
  let s = 0, c = 0;
  for (let i = 0; i < a.length; i++) {
    const v = a[i], t = s + v;
    c += abs(s) >= abs(v) ? (s - t) + v : (v - t) + s;
    s = t;
  }
  return s + c;
};
Num.mean = a => Num.sum(a) / a.length;
Num.variance = function (a, m) {
  const n = a.length;
  if (n < 2) return NaN;
  if (m == null) m = Num.mean(a);
  let s = 0, c = 0;
  for (let i = 0; i < n; i++) { const d = a[i] - m; s += d * d; c += d; }
  return (s - c * c / n) / (n - 1);
};
Num.sd = a => sqrt(Num.variance(a));
Num.median = function (a) {
  const s = Float64Array.from(a).sort(), n = s.length;
  if (!n) return NaN;
  return n % 2 ? s[(n - 1) >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2;
};
/* sample quantile, continuous definition 7 (the default of most statistics books) */
Num.quantile = function (a, p) {
  const s = Float64Array.from(a).sort(), n = s.length;
  if (!n) return NaN;
  const h = (n - 1) * p, lo = floor(h), hi = Math.ceil(h);
  return s[lo] + (h - lo) * (s[hi] - s[lo]);
};
/* median absolute deviation, unscaled (constant 1) */
Num.mad = function (a, med) {
  if (med == null) med = Num.median(a);
  return Num.median(Array.from(a, v => abs(v - med)));
};

/* ---------------- ranks ----------------
   Average ranks (ties share the mean of the ranks they span), as in every
   rank correlation of the classical literature. `tieGroups` returns the sizes
   of the groups of tied values, which the variance corrections need. */
Num.order = function (a) {
  const idx = Array.from({ length: a.length }, (_, i) => i);
  idx.sort((i, j) => (a[i] - a[j]) || (i - j));
  return idx;
};
Num.rank = function (a) {
  const n = a.length, o = Num.order(a), r = new Float64Array(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && a[o[j + 1]] === a[o[i]]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[o[k]] = avg;
    i = j + 1;
  }
  return r;
};
Num.tieGroups = function (a) {
  const s = Float64Array.from(a).sort(), out = [];
  let i = 0;
  while (i < s.length) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[i]) j++;
    if (j > i) out.push(j - i + 1);
    i = j + 1;
  }
  return out;
};

/* ---------------- special functions ---------------- */
/* log Γ(x) for x > 0: Lanczos (g = 7, 9 terms), with the reflection formula below 0.5 */
const LZ = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
Num.lgamma = function (x) {
  if (x < 0.5) return log(PI / abs(Math.sin(PI * x))) - Num.lgamma(1 - x);
  x -= 1;
  let a = LZ[0];
  const t = x + 7.5;
  for (let i = 1; i < 9; i++) a += LZ[i] / (x + i);
  return LN_SQRT_2PI + (x + 0.5) * log(t) - t + log(a);
};
/* The remainder of Stirling's series, lgamma(x) − [(x − ½)log x − x + log √(2π)],
   for x ≥ 10: the odd powers of 1/x with the Bernoulli coefficients B₂ₖ/(2k(2k−1)),
   seven terms (the next one is below 1e-17 at x = 10). */
const STIR = [1 / 12, -1 / 360, 1 / 1260, -1 / 1680, 1 / 1188, -691 / 360360, 1 / 156, -3617 / 122400];
function stirRest(x) {
  const z = 1 / (x * x);
  let s = STIR[STIR.length - 1];
  for (let k = STIR.length - 2; k >= 0; k--) s = s * z + STIR[k];
  return s / x;
}
/* log B(a, b). Summing three log-gammas of size ~a log a to get a number of
   size ~1 throws away the digits of the result when a or b is large (t with a
   thousand degrees of freedom: twelve digits); the Stirling form keeps them:
     both ≥ 10:  ½log 2π − ½log(p+q) + corr + (p − ½)log(p/(p+q)) + (q − ½)log1p(−p/(p+q))
     p < 10 ≤ q: lgamma(p) + corr + p − p·log(p+q) + (q − ½)log1p(−p/(p+q))
   with p ≤ q and corr the difference of the Stirling remainders. */
Num.lbeta = function (a, b) {
  const p = min(a, b), q = max(a, b);
  if (q < 10) return Num.lgamma(p) + Num.lgamma(q) - Num.lgamma(p + q);
  const r = p / (p + q);
  if (p >= 10) {
    const corr = stirRest(p) + stirRest(q) - stirRest(p + q);
    return LN_SQRT_2PI - 0.5 * log(p + q) + corr + (p - 0.5) * log(r) + (q - 0.5) * log1p(-r);
  }
  const corr = stirRest(q) - stirRest(p + q);
  return Num.lgamma(p) + corr + p - p * log(p + q) + (q - 0.5) * log1p(-r);
};
/* log n! exactly summed for small n, Lanczos beyond */
const LFACT = [0];
for (let i = 1; i <= 170; i++) LFACT[i] = LFACT[i - 1] + log(i);
Num.lfactorial = n => n <= 170 ? LFACT[n] : Num.lgamma(n + 1);

/* Regularized incomplete beta I_x(a, b): continued fraction (modified
   Lentz), evaluated on the side where it converges fast. */
function betacf(x, a, b) {
  const TINY = 1e-300, EPS = 1e-16;
  let c = 1, d = 1 - (a + b) * x / (a + 1);
  if (abs(d) < TINY) d = TINY;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 10000; m++) {
    const m2 = 2 * m;
    let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d; if (abs(d) < TINY) d = TINY;
    c = 1 + aa / c; if (abs(c) < TINY) c = TINY;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d; if (abs(d) < TINY) d = TINY;
    c = 1 + aa / c; if (abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (abs(del - 1) < EPS) break;
  }
  return h;
}
/* returns [I_x(a,b), 1 − I_x(a,b)], each computed directly (no cancellation).
   y = 1 − x may be passed when the caller knows it exactly: near x = 1,
   forming 1 − x in floating point throws away the digits that a·log x and
   the continued fraction on the other side need (t with many degrees of
   freedom, F with a large denominator). */
Num.betaInc2 = function (x, a, b, y) {
  if (y == null) y = 1 - x;
  if (x <= 0) return [0, 1];
  if (y <= 0) return [1, 0];
  const lx = x < 0.5 ? log(x) : log1p(-y), ly = y < 0.5 ? log(y) : log1p(-x);
  const lfront = a * lx + b * ly - Num.lbeta(a, b);
  if (x < (a + 1) / (a + b + 2)) {
    const v = exp(lfront) * betacf(x, a, b) / a;
    return [v, 1 - v];
  }
  const v = exp(lfront) * betacf(y, b, a) / b;
  return [1 - v, v];
};
Num.betaInc = (x, a, b) => Num.betaInc2(x, a, b)[0];

/* Regularized lower incomplete gamma P(a, x) and its complement Q(a, x). */
Num.gammaInc2 = function (a, x) {
  if (x <= 0) return [0, 1];
  const lf = a * log(x) - x - Num.lgamma(a);
  if (x < a + 1) {
    let sum = 1 / a, del = sum, ap = a;
    for (let n = 1; n < 100000; n++) { ap += 1; del *= x / ap; sum += del; if (abs(del) < abs(sum) * 1e-16) break; }
    const p = exp(lf) * sum;
    return [p, 1 - p];
  }
  const TINY = 1e-300;
  let b = x + 1 - a, c = 1 / TINY, d = 1 / b, h = d;
  for (let i = 1; i < 100000; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b; if (abs(d) < TINY) d = TINY;
    c = b + an / c; if (abs(c) < TINY) c = TINY;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (abs(del - 1) < 1e-16) break;
  }
  const q = exp(lf) * h;
  return [1 - q, q];
};

/* ---------------- the normal distribution ----------------
   Φ through erfc: a Chebyshev-fitted rational approximation of erfc on three
   ranges (W. J. Cody 1969, Math. Comp. 23:631–637), accurate to ~1e-16
   relative also deep in the tails, which the tests of tiny p-values need. */
const CA = [3.16112374387056560e00, 1.13864154151050156e02, 3.77485237685302021e02, 3.20937758913846947e03, 1.85777706184603153e-1];
const CB = [2.36012909523441209e01, 2.44024637934444173e02, 1.28261652607737228e03, 2.84423683343917062e03];
const CC = [5.64188496988670089e-1, 8.88314979438837594e00, 6.61191906371416295e01, 2.98635138197400131e02,
  8.81952221241769090e02, 1.71204761263407058e03, 2.05107837782607147e03, 1.23033935479799725e03, 2.15311535474403846e-8];
const CD = [1.57449261107098347e01, 1.17693950891312499e02, 5.37181101862009858e02, 1.62138957456669019e03,
  3.29079923573345963e03, 4.36261909014324716e03, 3.43936767414372164e03, 1.23033935480374942e03];
const CP = [3.05326634961232344e-1, 3.60344899949804439e-1, 1.25781726111229246e-1, 1.60837851487422766e-2,
  6.58749161529837803e-4, 1.63153871373020978e-2];
const CQ = [2.56852019228982242e00, 1.87295284992346725e00, 5.27905102951428412e-1, 6.05183413124413191e-2, 2.33520497626869185e-3];
const SQRPI = 5.6418958354775628695e-1;
/* erfc(x) for x ≥ 0 */
function erfcPos(x) {
  if (x < 0.46875) {
    const y = x * x;
    let xn = CA[4] * y, xd = y;
    for (let i = 0; i < 3; i++) { xn = (xn + CA[i]) * y; xd = (xd + CB[i]) * y; }
    return 1 - x * (xn + CA[3]) / (xd + CB[3]);
  }
  let r;
  if (x <= 4) {
    let xn = CC[8] * x, xd = x;
    for (let i = 0; i < 7; i++) { xn = (xn + CC[i]) * x; xd = (xd + CD[i]) * x; }
    r = (xn + CC[7]) / (xd + CD[7]);
  } else {
    if (x > 27) return 0;
    const z = 1 / (x * x);
    let xn = CP[5] * z, xd = z;
    for (let i = 0; i < 4; i++) { xn = (xn + CP[i]) * z; xd = (xd + CQ[i]) * z; }
    r = z * (xn + CP[4]) / (xd + CQ[4]);
    r = (SQRPI - r) / x;
  }
  /* exp(−x²) split to keep the digits of x² */
  const xs = floor(x * 16) / 16, del = (x - xs) * (x + xs);
  return exp(-xs * xs) * exp(-del) * r;
}
Num.erfc = x => x >= 0 ? erfcPos(x) : 2 - erfcPos(-x);
/* Φ(z) and its upper tail 1 − Φ(z), each without cancellation */
Num.pnorm = function (z, upper) {
  if (z !== z) return NaN;
  const lower = z < 0 ? 0.5 * erfcPos(-z / SQRT2) : 1 - 0.5 * erfcPos(z / SQRT2);
  const up = z > 0 ? 0.5 * erfcPos(z / SQRT2) : 1 - 0.5 * erfcPos(-z / SQRT2);
  return upper ? up : lower;
};
Num.dnorm = z => exp(-0.5 * z * z - LN_SQRT_2PI);
/* Φ⁻¹(p): algorithm AS 241 (Wichura 1988, Appl. Statist. 37:477–484), PPND16,
   about 1e-16 relative. */
Num.qnorm = function (p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const q = p - 0.5;
  if (abs(q) <= 0.425) {
    const r = 0.180625 - q * q;
    return q * (((((((r * 2509.0809287301226727 + 33430.575583588128105) * r + 67265.770927008700853) * r +
      45921.953931549871457) * r + 13731.693765509461125) * r + 1971.5909503065514427) * r + 133.14166789178437745) * r +
      3.387132872796366608) / (((((((r * 5226.495278852545925 + 28729.085735721942674) * r + 39307.89580009271061) * r +
      21213.794301586595867) * r + 5394.1960214247511077) * r + 687.1870074920579083) * r + 42.313330701600911252) * r + 1);
  }
  let r = q < 0 ? p : 1 - p;
  r = sqrt(-log(r));
  let v;
  if (r <= 5) {
    r -= 1.6;
    v = (((((((r * 7.7454501427834140764e-4 + 0.0227238449892691845833) * r + 0.24178072517745061177) * r +
      1.27045825245236838258) * r + 3.64784832476320460504) * r + 5.7694972214606914055) * r + 4.6303378461565452959) * r +
      1.42343711074968357734) / (((((((r * 1.05075007164441684324e-9 + 5.475938084995344946e-4) * r +
      0.0151986665636164571966) * r + 0.14810397642748007459) * r + 0.68976733498510000455) * r + 1.6763848301838038494) * r +
      2.05319162663775882187) * r + 1);
  } else {
    r -= 5;
    v = (((((((r * 2.01033439929228813265e-7 + 2.71155556874348757815e-5) * r + 0.0012426609473880784386) * r +
      0.026532189526576123093) * r + 0.29656057182850489123) * r + 1.7848265399172913358) * r + 5.4637849111641143699) * r +
      6.6579046435011037772) / (((((((r * 2.04426310338993978564e-15 + 1.4215117583164458887e-7) * r +
      1.8463183175100546818e-5) * r + 7.868691311456132591e-4) * r + 0.0148753612908506148525) * r +
      0.13692988092273580531) * r + 0.59983220655588793769) * r + 1);
  }
  return q < 0 ? -v : v;
};

/* ---------------- t, F, χ² ---------------- */
/* P(T ≤ t) or P(T > t) with ν degrees of freedom (ν may be fractional) */
Num.pt = function (t, df, upper) {
  if (t !== t || !(df > 0)) return NaN;
  if (!isFinite(t)) return (t > 0) === !upper ? 1 : 0;
  if (df === Infinity) return Num.pnorm(t, upper);
  const t2 = t * t, x = df / (df + t2), y = t2 / (df + t2);
  /* tail = P(|T| > |t|)/2, computed as ½·I_x(ν/2, ½) */
  const [ix] = Num.betaInc2(x, df / 2, 0.5, y);
  const tail = 0.5 * ix;
  const big = t > 0;
  if (upper) return big ? tail : 1 - tail;
  return big ? 1 - tail : tail;
};
/* two-sided p-value of a t statistic */
Num.pt2 = (t, df) => min(1, 2 * Num.pt(abs(t), df, true));
Num.qt = function (p, df) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (df === Infinity) return Num.qnorm(p);
  if (p === 0.5) return 0;
  const lower = p < 0.5, pp = lower ? p : 1 - p;
  /* Newton on the upper tail from the normal start, safeguarded by bisection */
  let lo = 0, hi = 1, x = -Num.qnorm(pp);
  while (Num.pt(hi, df, true) > pp) { lo = hi; hi *= 2; if (hi > 1e12) break; }
  if (!(x > lo && x < hi)) x = (lo + hi) / 2;
  for (let it = 0; it < 200; it++) {
    const f = Num.pt(x, df, true) - pp;
    if (f > 0) lo = x; else hi = x;
    const dens = exp(Num.lgamma((df + 1) / 2) - Num.lgamma(df / 2) - 0.5 * log(df * PI) - (df + 1) / 2 * log1p(x * x / df));
    let nx = x + f / dens;
    if (!(nx > lo && nx < hi)) nx = (lo + hi) / 2;
    if (abs(nx - x) <= 1e-15 * max(1, abs(x))) { x = nx; break; }
    x = nx;
  }
  return lower ? -x : x;
};
Num.pchisq = (x, df, upper) => x <= 0 ? (upper ? 1 : 0) : Num.gammaInc2(df / 2, x / 2)[upper ? 1 : 0];
Num.pf = function (f, d1, d2, upper) {
  if (f <= 0) return upper ? 1 : 0;
  const den = d1 * f + d2;
  const [a, b] = Num.betaInc2(d1 * f / den, d1 / 2, d2 / 2, d2 / den);
  return upper ? b : a;
};


/* ---------------- densities and the other continuous laws ---------------- */
Num.dt = (t, df) => exp(Num.lgamma((df + 1) / 2) - Num.lgamma(df / 2) - 0.5 * log(df * PI) - (df + 1) / 2 * log1p(t * t / df));
Num.dchisq = function (x, df) {
  if (x < 0) return 0;
  if (x === 0) return df === 2 ? 0.5 : df < 2 ? Infinity : 0;
  return exp((df / 2 - 1) * log(x) - x / 2 - (df / 2) * Math.LN2 - Num.lgamma(df / 2));
};
Num.dbeta = function (x, a, b) {
  if (x < 0 || x > 1) return 0;
  if (x === 0 || x === 1) return 0;
  return exp((a - 1) * log(x) + (b - 1) * log1p(-x) - Num.lbeta(a, b));
};
Num.df = function (x, d1, d2) {
  if (x <= 0) return 0;
  return exp(0.5 * (d1 * log(d1 * x) + d2 * log(d2) - (d1 + d2) * log(d1 * x + d2)) - log(x) - Num.lbeta(d1 / 2, d2 / 2));
};
Num.pbeta = (x, a, b, upper) => Num.betaInc2(x, a, b)[upper ? 1 : 0];
Num.pgamma = (x, shape, rate, upper) => x <= 0 ? (upper ? 1 : 0) : Num.gammaInc2(shape, x * (rate || 1))[upper ? 1 : 0];
Num.dgamma = (x, shape, rate) => {
  rate = rate || 1;
  if (x < 0) return 0;
  if (x === 0) return shape === 1 ? rate : shape < 1 ? Infinity : 0;
  return exp(shape * log(rate) + (shape - 1) * log(x) - rate * x - Num.lgamma(shape));
};

/* Inverse of a continuous distribution function: Newton steps from a good
   start, kept inside a bracket that bisection shrinks whenever Newton would
   jump out of it (so it always converges, and fast when the start is good). */
function invert(cdf, dens, p, lo, hi, x) {
  if (!(x > lo && x < hi)) x = isFinite(hi) ? (lo + hi) / 2 : lo + 1;
  for (let it = 0; it < 300; it++) {
    const f = cdf(x) - p;
    if (f === 0) return x;
    if (f < 0) lo = x; else hi = x;
    const d = dens(x);
    let nx = d > 0 && isFinite(d) ? x - f / d : NaN;
    if (!(nx > lo && nx < hi)) nx = isFinite(hi) ? (lo + hi) / 2 : x * 2 + 1;
    if (abs(nx - x) <= 1e-15 * max(1, abs(x))) return nx;
    x = nx;
  }
  return x;
}
/* χ² quantile from the Wilson–Hilferty start */
Num.qchisq = function (p, df) {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  const z = Num.qnorm(p), c = 2 / (9 * df);
  let x0 = df * Math.pow(max(0.01, 1 - c + z * sqrt(c)), 3);
  if (!(x0 > 0)) x0 = df;
  let hi = max(x0 * 2, 10);
  while (Num.pchisq(hi, df) < p) hi *= 2;
  return invert(x => Num.pchisq(x, df), x => Num.dchisq(x, df), p, 0, hi, x0);
};
Num.qbeta = function (p, a, b) {
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  /* start: the normal approximation of the beta, clipped inside (0, 1) */
  const m = a / (a + b), s = sqrt(a * b / ((a + b) * (a + b) * (a + b + 1)));
  let x0 = Num.clamp(m + Num.qnorm(p) * s, 1e-6, 1 - 1e-6);
  return invert(x => Num.betaInc(x, a, b), x => Num.dbeta(x, a, b), p, 0, 1, x0);
};
Num.qf = function (p, d1, d2) {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  const x = Num.qbeta(p, d1 / 2, d2 / 2);
  return d2 * x / (d1 * (1 - x));
};
Num.qgamma = function (p, shape, rate) {
  rate = rate || 1;
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  return Num.qchisq(p, 2 * shape) / (2 * rate);
};

/* ---------------- the binomial ----------------
   P(X ≤ k) = I_{1−p}(n − k, k + 1): the incomplete beta gives both tails
   without cancellation. */
Num.dbinom = function (k, n, p) {
  if (k < 0 || k > n || k !== floor(k)) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  return exp(Num.lfactorial(n) - Num.lfactorial(k) - Num.lfactorial(n - k) + k * log(p) + (n - k) * log1p(-p));
};
Num.pbinom = function (k, n, p, upper) {
  k = floor(k + 1e-7);
  if (k < 0) return upper ? 1 : 0;
  if (k >= n) return upper ? 0 : 1;
  if (p <= 0) return upper ? 0 : 1;
  if (p >= 1) return upper ? 1 : 0;
  const r = Num.betaInc2(1 - p, n - k, k + 1, p);
  return upper ? r[1] : r[0];
};
/* smallest k with P(X ≤ k) ≥ q (the fuzz keeps a probability computed as
   0.95 − 1e-16 from moving the answer one step) */
Num.qbinom = function (q, n, p) {
  const qq = q * (1 - 64 * 2.220446e-16);
  for (let k = 0; k <= n; k++) if (Num.pbinom(k, n, p) >= qq) return k;
  return n;
};

/* ---------------- studentized range (Tukey) ----------------
   P(Q ≤ q) for k means and ν degrees of freedom: the double integral of
   Copenhaver and Holland (1988, J. Statist. Comput. Simul. 30:1–15) with
   Gauss–Legendre rules; the same constants as the classical algorithm. */
const XLEG = [0.981560634246719250690549090149, 0.904117256370474856678465866119, 0.769902674194304687036893833213,
  0.587317954286617447296702418941, 0.367831498998180193752691536644, 0.125233408511468915472441369464];
const ALEG = [0.047175336386511827194615961485, 0.106939325995318430960254718194, 0.160078328543346226334652529543,
  0.203167426723065921749064455810, 0.233492536538354808760849898925, 0.249147045813402785000562436043];
function wprob(w, k) {
  const C1 = -30, C3 = 60, bb = 8, wlar = 3;
  const qsqz = w * 0.5;
  if (qsqz >= bb) return 1;
  let pr = 2 * Num.pnorm(qsqz) - 1;
  pr = pr >= exp(-50 / k) ? Math.pow(pr, k) : 0;
  const wincr = w > wlar ? 2 : 3;
  let blb = qsqz;
  const binc = (bb - qsqz) / wincr;
  let bub = blb + binc, einsum = 0;
  const cc = k - 1;
  for (let wi = 1; wi <= wincr; wi++) {
    let elsum = 0;
    const a = 0.5 * (bub + blb), b = 0.5 * (bub - blb);
    for (let jj = 1; jj <= 12; jj++) {
      let j, xx;
      if (6 < jj) { j = 12 - jj + 1; xx = XLEG[j - 1]; } else { j = jj; xx = -XLEG[j - 1]; }
      const ac = a + b * xx, qexpo = ac * ac;
      if (qexpo > C3) break;
      const pplus = 2 * Num.pnorm(ac), pminus = 2 * Num.pnorm(ac - w);
      let rinsum = pplus * 0.5 - pminus * 0.5;
      if (rinsum >= exp(C1 / cc)) elsum += ALEG[j - 1] * exp(-(0.5 * qexpo)) * Math.pow(rinsum, cc);
    }
    elsum *= (2 * b) * k / sqrt(2 * PI);
    einsum += elsum;
    blb = bub; bub += binc;
  }
  pr += einsum;
  /* one range (the classical nranges = 1): the cut-off is exp(−30), not exp(−30/k) */
  return pr <= exp(C1) ? 0 : min(pr, 1);
}
const XLEGQ = [0.989400934991649932596154173450, 0.944575023073232576077988415535, 0.865631202387831743880467897712,
  0.755404408355003033895101194847, 0.617876244402643748446671764049, 0.458016777657227386342419442984,
  0.281603550779258913230460501460, 0.950125098376374401853193354250e-1];
const ALEGQ = [0.271524594117540948517805724560e-1, 0.622535239386478928628438369944e-1, 0.951585116824927848099251076022e-1,
  0.124628971255533872052476282192, 0.149595988816576732081501730547, 0.169156519395002538189312079030,
  0.182603415044923588866763667969, 0.189450610455068496285396723208];
Num.ptukey = function (q, k, df, upper) {
  if (!(q > 0)) return upper ? 1 : 0;
  if (!isFinite(q)) return upper ? 0 : 1;
  let ans = 0;
  if (df > 25000) ans = wprob(q, k);
  else {
    const f2 = df * 0.5, f21 = f2 - 1, ff4 = df * 0.25;
    const ulen = df <= 100 ? 1 : df <= 800 ? 0.5 : df <= 5000 ? 0.25 : 0.125;
    const f2lf = f2 * log(df) - df * Math.LN2 - Num.lgamma(f2) + log(ulen);
    for (let i = 1; i <= 50; i++) {
      let otsum = 0;
      const twa1 = (2 * i - 1) * ulen;
      for (let jj = 1; jj <= 16; jj++) {
        let j, t1;
        if (8 < jj) { j = jj - 8 - 1; t1 = f2lf + f21 * log(twa1 + XLEGQ[j] * ulen) - (XLEGQ[j] * ulen + twa1) * ff4; }
        else { j = jj - 1; t1 = f2lf + f21 * log(twa1 - XLEGQ[j] * ulen) + (XLEGQ[j] * ulen - twa1) * ff4; }
        if (t1 >= -30) {
          const u = 8 < jj ? sqrt(0.5 * (XLEGQ[j] * ulen + twa1)) : sqrt(0.5 * (-XLEGQ[j] * ulen + twa1));
          otsum += wprob(q * u, k) * ALEGQ[j] * exp(t1);
        }
      }
      if (i * ulen >= 1 && otsum <= 1e-14) break;
      ans += otsum;
    }
    ans = min(1, ans);
  }
  return upper ? 1 - ans : ans;
};
Num.qtukey = function (p, k, df) {
  if (p <= 0) return 0;
  if (p >= 1) return Infinity;
  let lo = 0, hi = 4;
  while (Num.ptukey(hi, k, df) < p) { lo = hi; hi *= 2; if (hi > 1e4) break; }
  for (let i = 0; i < 100; i++) {
    const m = (lo + hi) / 2;
    if (Num.ptukey(m, k, df) < p) lo = m; else hi = m;
    if (hi - lo < 1e-10 * max(1, m)) break;
  }
  return (lo + hi) / 2;
};

/* ---------------- Gauss–Legendre rules ----------------
   Nodes by Newton's method on the Legendre polynomial (Golub–Welsch would
   also do); cached by order. */
const GLC = new Map();
Num.gaussLegendre = function (n) {
  if (GLC.has(n)) return GLC.get(n);
  const x = new Float64Array(n), w = new Float64Array(n);
  for (let i = 0; i < (n + 1) >> 1; i++) {
    let z = Math.cos(PI * (i + 0.75) / (n + 0.5)), pp = 0;
    for (let it = 0; it < 100; it++) {
      let p1 = 1, p2 = 0;
      for (let j = 1; j <= n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j; }
      pp = n * (z * p1 - p2) / (z * z - 1);
      const z1 = z;
      z = z1 - p1 / pp;
      if (abs(z - z1) < 1e-15) break;
    }
    x[i] = -z; x[n - 1 - i] = z;
    w[i] = w[n - 1 - i] = 2 / ((1 - z * z) * pp * pp);
  }
  const r = { x, w };
  GLC.set(n, r);
  return r;
};
/* ∫_a^b f by an n-point rule on m equal pieces */
Num.glIntegrate = function (f, a, b, n, m) {
  const R = Num.gaussLegendre(n || 32), pieces = m || 1, h = (b - a) / pieces;
  let s = 0;
  for (let k = 0; k < pieces; k++) {
    const c = a + (k + 0.5) * h, r = h / 2;
    for (let i = 0; i < R.x.length; i++) s += R.w[i] * f(c + r * R.x[i]);
  }
  return s * h / 2;
};
/* adaptive Gauss–Kronrod (7 → 15 points) with a global error budget */
const GK_X = [0.991455371120812639206854697526, 0.949107912342758524526189684048, 0.864864423359769072789712788641,
  0.741531185599394439863864773281, 0.586087235467691130294144845694, 0.405845151377397166906606412077,
  0.207784955007898467600689403773, 0];
const GK_WK = [0.022935322010529224963732008059, 0.063092092629978553290700663189, 0.104790010322250183839876322542,
  0.140653259715525918745189590510, 0.169004726639267902826583426599, 0.190350578064785409913256402421,
  0.204432940075298892414161999235, 0.209482141084727828012999174892];
const GK_WG = [0.129484966168869693270611432679, 0.279705391489276667901467771424, 0.381830050505118944950369775489,
  0.417959183673469387755102040816];
function gk15(f, a, b) {
  const c = (a + b) / 2, h = (b - a) / 2;
  const fc = f(c);
  let k = fc * GK_WK[7], g = fc * GK_WG[3];
  for (let j = 0; j < 7; j++) {
    const d = h * GK_X[j], f1 = f(c - d), f2 = f(c + d);
    k += GK_WK[j] * (f1 + f2);
    if (j % 2 === 1) g += GK_WG[(j - 1) / 2] * (f1 + f2);
  }
  return [k * h, abs((k - g) * h)];
}
Num.integrate = function (f, a, b, tol) {
  tol = tol || 1e-10;
  let parts = [[a, b].concat(gk15(f, a, b))];
  for (let it = 0; it < 200; it++) {
    let tot = 0, err = 0, worst = 0;
    parts.forEach((p, i) => { tot += p[2]; err += p[3]; if (p[3] > parts[worst][3]) worst = i; });
    if (err <= max(tol, tol * abs(tot))) return tot;
    const [lo, hi] = parts[worst], mid = (lo + hi) / 2;
    parts.splice(worst, 1, [lo, mid].concat(gk15(f, lo, mid)), [mid, hi].concat(gk15(f, mid, hi)));
  }
  return parts.reduce((s, p) => s + p[2], 0);
};

/* ---------------- many-to-one comparisons (Dunnett) ----------------
   P(max_i |T_i| ≤ c) for T_i = (Z_i)/S, where the Z_i are standard normals
   with the one-factor correlation ρ_ij = λ_i λ_j (every comparison with the
   same control: λ_i = √(n_i / (n_i + n_0))), and S² ~ χ²_ν/ν independent.
   Conditioning on the shared factor reduces it to a product of univariate
   normal probabilities (Dunnett 1955, J. Am. Statist. Assoc. 50:1096–1121),
   integrated over the factor and over S with Gauss–Legendre rules.
   twoSided false: P(max_i T_i ≤ c). */
Num.pDunnett = function (c, lambdas, df, twoSided) {
  if (twoSided == null) twoSided = true;
  const L = lambdas.map(l => Num.clamp(l, 0, 0.999999)), D = L.map(l => sqrt(1 - l * l));
  const inner = s => {
    const g = z => {
      let pr = 1;
      for (let i = 0; i < L.length; i++) {
        const up = Num.pnorm((c * s - L[i] * z) / D[i]);
        pr *= twoSided ? up - Num.pnorm((-c * s - L[i] * z) / D[i]) : up;
        if (pr <= 0) return 0;
      }
      return pr * Num.dnorm(z);
    };
    return Num.glIntegrate(g, -8.5, 8.5, 48, 6);
  };
  if (!isFinite(df) || df > 2e5) return Num.clamp(inner(1), 0, 1);
  /* S = √(X/ν), X ~ χ²_ν: integrate over X between quantiles that leave 1e-12 out */
  const lo = Num.qchisq(1e-12, df), hi = Num.qchisq(1 - 1e-12, df);
  const val = Num.glIntegrate(x => Num.dchisq(x, df) * inner(sqrt(x / df)), lo, hi, 32, 8);
  return Num.clamp(val, 0, 1);
};
Num.qDunnett = function (p, lambdas, df, twoSided) {
  let lo = 0, hi = 3;
  while (Num.pDunnett(hi, lambdas, df, twoSided) < p) { lo = hi; hi *= 1.6; if (hi > 100) break; }
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (Num.pDunnett(m, lambdas, df, twoSided) < p) lo = m; else hi = m;
    if (hi - lo < 1e-7) break;
  }
  return (lo + hi) / 2;
};

/* ---------------- adjusting p-values for multiplicity ---------------- */
Num.padjust = function (p, method) {
  const n = p.length, o = Num.order(p), out = new Array(n);
  if (!n) return [];
  method = method || 'holm';
  if (method === 'none') return p.slice();
  if (method === 'bonferroni') return p.map(v => min(1, v * n));
  if (method === 'holm') {
    let run = 0;
    o.forEach((i, k) => { run = max(run, min(1, (n - k) * p[i])); out[i] = run; });
    return out;
  }
  if (method === 'hochberg' || method === 'BH' || method === 'fdr' || method === 'BY') {
    const q = method === 'BY' ? Array.from({ length: n }, (_, i) => 1 / (i + 1)).reduce((s, v) => s + v, 0) : 1;
    let run = 1;
    for (let k = n - 1; k >= 0; k--) {
      const i = o[k];
      const v = method === 'hochberg' ? (n - k) * p[i] : q * n / (k + 1) * p[i];
      run = min(run, v);
      out[i] = min(1, run);
    }
    return out;
  }
  throw new Error('padjust: ' + method);
};

/* ---------------- small dense linear algebra ----------------
   Matrices are arrays of rows. Enough for the models of the app (a few
   dozen columns at most). */
const M = {};
M.zeros = (r, c) => Array.from({ length: r }, () => new Array(c).fill(0));
M.eye = n => { const A = M.zeros(n, n); for (let i = 0; i < n; i++) A[i][i] = 1; return A; };
M.T = A => A.length ? A[0].map((_, j) => A.map(r => r[j])) : [];
M.mul = function (A, B) {
  const n = A.length, m = B[0].length, p = B.length, C = M.zeros(n, m);
  for (let i = 0; i < n; i++) for (let k = 0; k < p; k++) { const a = A[i][k]; if (a) for (let j = 0; j < m; j++) C[i][j] += a * B[k][j]; }
  return C;
};
M.mulv = (A, v) => A.map(r => { let s = 0; for (let j = 0; j < r.length; j++) s += r[j] * v[j]; return s; });
M.crossprod = A => M.mul(M.T(A), A);
/* LU with partial pivoting; returns null if singular */
M.lu = function (A) {
  const n = A.length, U = A.map(r => r.slice()), piv = Array.from({ length: n }, (_, i) => i);
  let sign = 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (abs(U[r][c]) > abs(U[p][c])) p = r;
    if (abs(U[p][c]) < 1e-300) return null;
    if (p !== c) { const t = U[p]; U[p] = U[c]; U[c] = t; const q = piv[p]; piv[p] = piv[c]; piv[c] = q; sign = -sign; }
    for (let r = c + 1; r < n; r++) {
      const f = U[r][c] / U[c][c];
      U[r][c] = f;
      if (f) for (let k = c + 1; k < n; k++) U[r][k] -= f * U[c][k];
    }
  }
  return { LU: U, piv, sign };
};
M.solve = function (A, b) {
  const F = M.lu(A);
  if (!F) return null;
  const n = A.length, many = Array.isArray(b[0]), cols = many ? b[0].length : 1;
  const X = M.zeros(n, cols);
  for (let c = 0; c < cols; c++) {
    const y = new Array(n);
    for (let i = 0; i < n; i++) { let s = many ? b[F.piv[i]][c] : b[F.piv[i]]; for (let k = 0; k < i; k++) s -= F.LU[i][k] * y[k]; y[i] = s; }
    for (let i = n - 1; i >= 0; i--) { let s = y[i]; for (let k = i + 1; k < n; k++) s -= F.LU[i][k] * X[k][c]; X[i][c] = s / F.LU[i][i]; }
  }
  return many ? X : X.map(r => r[0]);
};
M.inv = A => M.solve(A, M.eye(A.length));
M.det = A => { const F = M.lu(A); if (!F) return 0; let d = F.sign; for (let i = 0; i < A.length; i++) d *= F.LU[i][i]; return d; };
/* Cholesky A = LLᵀ; null if A is not positive definite */
M.chol = function (A) {
  const n = A.length, L = M.zeros(n, n);
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = A[i][j];
    for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    if (i === j) { if (s <= 0) return null; L[i][i] = sqrt(s); } else L[i][j] = s / L[j][j];
  }
  return L;
};
/* symmetric eigenproblem by cyclic Jacobi rotations: values in decreasing
   order, vectors as the COLUMNS of `vectors`, each with its largest
   component made positive (a fixed sign, so results do not flip) */
M.eigSym = function (S) {
  const n = S.length, A = S.map(r => r.slice()), V = M.eye(n);
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
    if (off < 1e-30) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (abs(A[p][q]) < 1e-300) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = (th >= 0 ? 1 : -1) / (abs(th) + sqrt(th * th + 1));
      const c = 1 / sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) {
        const akp = A[k][p], akq = A[k][q];
        A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq;
      }
      for (let k = 0; k < n; k++) {
        const apk = A[p][k], aqk = A[q][k];
        A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk;
      }
      for (let k = 0; k < n; k++) {
        const vkp = V[k][p], vkq = V[k][q];
        V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq;
      }
    }
  }
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => A[b][b] - A[a][a]);
  const values = idx.map(i => A[i][i]);
  const vectors = M.zeros(n, n);
  idx.forEach((i, c) => {
    let big = 0;
    for (let k = 0; k < n; k++) if (abs(V[k][i]) > abs(V[big][i])) big = k;
    const sg = V[big][i] < 0 ? -1 : 1;
    for (let k = 0; k < n; k++) vectors[k][c] = sg * V[k][i];
  });
  return { values, vectors };
};
/* thin singular value decomposition A = U·diag(d)·Vᵀ by one-sided Jacobi
   (Hestenes); A is m×n. Singular values in decreasing order. */
M.svd = function (A) {
  const m = A.length, n = A[0].length;
  if (m < n) { const r = M.svd(M.T(A)); return { u: r.v, d: r.d, v: r.u }; }
  const U = A.map(r => r.slice()), V = M.eye(n);
  for (let sweep = 0; sweep < 80; sweep++) {
    let rot = 0;
    for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
      let a = 0, b = 0, g = 0;
      for (let i = 0; i < m; i++) { a += U[i][p] * U[i][p]; b += U[i][q] * U[i][q]; g += U[i][p] * U[i][q]; }
      if (abs(g) <= 1e-15 * sqrt(a * b) || g === 0) continue;
      rot++;
      const z = (b - a) / (2 * g), t = (z >= 0 ? 1 : -1) / (abs(z) + sqrt(1 + z * z));
      const c = 1 / sqrt(1 + t * t), s = c * t;
      for (let i = 0; i < m; i++) { const x = U[i][p], y = U[i][q]; U[i][p] = c * x - s * y; U[i][q] = s * x + c * y; }
      for (let i = 0; i < n; i++) { const x = V[i][p], y = V[i][q]; V[i][p] = c * x - s * y; V[i][q] = s * x + c * y; }
    }
    if (!rot) break;
  }
  const d = new Array(n).fill(0);
  for (let j = 0; j < n; j++) { let s = 0; for (let i = 0; i < m; i++) s += U[i][j] * U[i][j]; d[j] = sqrt(s); }
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => d[b] - d[a]);
  const uu = M.zeros(m, n), vv = M.zeros(n, n), dd = idx.map(i => d[i]);
  idx.forEach((j, c) => {
    /* sign: largest component of v positive */
    let big = 0;
    for (let k = 0; k < n; k++) if (abs(V[k][j]) > abs(V[big][j])) big = k;
    const sg = V[big][j] < 0 ? -1 : 1;
    for (let i = 0; i < m; i++) uu[i][c] = d[j] > 1e-300 ? sg * U[i][j] / d[j] : 0;
    for (let k = 0; k < n; k++) vv[k][c] = sg * V[k][j];
  });
  return { u: uu, d: dd, v: vv };
};
Num.mat = M;

/* ---------------- the linear model ----------------
   y = Xβ + ε by Householder QR (columns that add nothing — aliased — are
   dropped and reported); weights w give weighted least squares. Returns the
   estimates, their standard errors, t and p, the covariance, the residuals,
   the residual variance and R². */
Num.lm = function (X, y, w) {
  const n = y.length, p0 = X[0].length;
  const sw = w ? w.map(sqrt) : null;
  let A = X.map((r, i) => sw ? r.map(v => v * sw[i]) : r.slice());
  let b = sw ? y.map((v, i) => v * sw[i]) : y.slice();
  /* modified Gram–Schmidt with a tolerance for aliased columns */
  const keep = [], Q = [], R = [];
  const colNorm0 = [];
  for (let j = 0; j < p0; j++) { let s = 0; for (let i = 0; i < n; i++) s += A[i][j] * A[i][j]; colNorm0.push(sqrt(s)); }
  for (let j = 0; j < p0; j++) {
    const v = A.map(r => r[j]);
    const rcol = new Array(Q.length).fill(0);
    for (let k = 0; k < Q.length; k++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += Q[k][i] * v[i];
      rcol[k] = s;
      for (let i = 0; i < n; i++) v[i] -= s * Q[k][i];
    }
    let nv = 0;
    for (let i = 0; i < n; i++) nv += v[i] * v[i];
    nv = sqrt(nv);
    if (nv <= 1e-9 * max(1, colNorm0[j])) continue;   /* aliased */
    for (let i = 0; i < n; i++) v[i] /= nv;
    Q.push(v); keep.push(j);
    rcol.push(nv);
    R.push(rcol);
  }
  const k = keep.length;
  /* R is upper triangular: R[c] holds column c (entries 0..c) */
  const Rm = M.zeros(k, k);
  for (let c = 0; c < k; c++) for (let r = 0; r <= c; r++) Rm[r][c] = R[c][r];
  const qty = Q.map(q => { let s = 0; for (let i = 0; i < n; i++) s += q[i] * b[i]; return s; });
  const beta = new Array(k).fill(0);
  for (let i = k - 1; i >= 0; i--) { let s = qty[i]; for (let j = i + 1; j < k; j++) s -= Rm[i][j] * beta[j]; beta[i] = s / Rm[i][i]; }
  /* (RᵀR)⁻¹ = R⁻¹R⁻ᵀ */
  const Ri = M.zeros(k, k);
  for (let c = 0; c < k; c++) {
    for (let i = k - 1; i >= 0; i--) {
      let s = i === c ? 1 : 0;
      for (let j = i + 1; j < k; j++) s -= Rm[i][j] * Ri[j][c];
      Ri[i][c] = s / Rm[i][i];
    }
  }
  const XtXi = M.mul(Ri, M.T(Ri));
  const coef = new Array(p0).fill(NaN);
  keep.forEach((j, i) => { coef[j] = beta[i]; });
  const fitted = X.map(r => { let s = 0; keep.forEach((j, i) => { s += r[j] * beta[i]; }); return s; });
  const resid = y.map((v, i) => v - fitted[i]);
  let rss = 0;
  resid.forEach((e, i) => { rss += (w ? w[i] : 1) * e * e; });
  const df = n - k, s2 = df > 0 ? rss / df : NaN;
  const vcov = M.zeros(p0, p0).map(r => r.fill(NaN));
  keep.forEach((a, i) => keep.forEach((c, j) => { vcov[a][c] = XtXi[i][j] * s2; }));
  const se = coef.map((_, j) => sqrt(vcov[j][j]));
  const tval = coef.map((c, j) => c / se[j]);
  const pval = tval.map(t => (isFinite(t) && df > 0 ? Num.pt2(t, df) : NaN));
  /* R² about the (weighted) mean when the model has an intercept */
  const ws = w || y.map(() => 1);
  const ybar = y.reduce((s, v, i) => s + ws[i] * v, 0) / ws.reduce((s, v) => s + v, 0);
  let tss = 0;
  y.forEach((v, i) => { tss += ws[i] * (v - ybar) * (v - ybar); });
  const r2 = 1 - rss / tss;
  return { coef, se, t: tval, p: pval, vcov, XtXi, keep, aliased: Array.from({ length: p0 }, (_, j) => !keep.includes(j)), fitted, resid, rss, df, sigma2: s2, sigma: sqrt(s2), rank: k, n, r2, adjR2: 1 - (1 - r2) * (n - 1) / max(1, df) };
};

/* ---------------- optimisation and roots ---------------- */
/* Brent's root finder (zeroin) on a bracket [a, b] with f(a)·f(b) ≤ 0 */
Num.brent = function (f, a, b, tol) {
  tol = tol || 1e-12;
  let fa = f(a), fb = f(b);
  if (fa === 0) return a;
  if (fb === 0) return b;
  if (fa * fb > 0) return NaN;
  let c = a, fc = fa, d = b - a, e = d;
  for (let it = 0; it < 200; it++) {
    if (fb * fc > 0) { c = a; fc = fa; d = e = b - a; }
    if (abs(fc) < abs(fb)) { a = b; b = c; c = a; fa = fb; fb = fc; fc = fa; }
    const tol1 = 2 * 2.2e-16 * abs(b) + 0.5 * tol, xm = 0.5 * (c - b);
    if (abs(xm) <= tol1 || fb === 0) return b;
    if (abs(e) >= tol1 && abs(fa) > abs(fb)) {
      const s = fb / fa;
      let p, q;
      if (a === c) { p = 2 * xm * s; q = 1 - s; }
      else { const qq = fa / fc, r = fb / fc; p = s * (2 * xm * qq * (qq - r) - (b - a) * (r - 1)); q = (qq - 1) * (r - 1) * (s - 1); }
      if (p > 0) q = -q;
      p = abs(p);
      if (2 * p < min(3 * xm * q - abs(tol1 * q), abs(e * q))) { e = d; d = p / q; } else { d = xm; e = d; }
    } else { d = xm; e = d; }
    a = b; fa = fb;
    b += abs(d) > tol1 ? d : (xm > 0 ? tol1 : -tol1);
    fb = f(b);
  }
  return b;
};
/* Nelder–Mead simplex minimiser (Lagarias et al. 1998 coefficients) */
Num.nelderMead = function (f, x0, o) {
  o = o || {};
  const n = x0.length, maxIt = o.maxIter || 4000 * n, tol = o.tol || 1e-12;
  const step = o.step || x0.map(v => (abs(v) > 1e-8 ? 0.1 * abs(v) : 0.1));
  let S = [x0.slice()];
  for (let i = 0; i < n; i++) { const v = x0.slice(); v[i] += step[i]; S.push(v); }
  let F = S.map(v => f(v));
  let it = 0;
  for (; it < maxIt; it++) {
    const idx = F.map((_, i) => i).sort((a, b) => F[a] - F[b]);
    S = idx.map(i => S[i]); F = idx.map(i => F[i]);
    if (abs(F[n] - F[0]) <= tol * (abs(F[0]) + tol) && it > 5) {
      let span = 0;
      for (let i = 1; i <= n; i++) for (let j = 0; j < n; j++) span = max(span, abs(S[i][j] - S[0][j]));
      if (span < 1e-10 * max(1, ...S[0].map(abs))) break;
    }
    const c = new Array(n).fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) c[j] += S[i][j] / n;
    const at = t => c.map((cj, j) => cj + t * (S[n][j] - cj));
    const xr = at(-1), fr = f(xr);
    if (fr < F[0]) {
      const xe = at(-2), fe = f(xe);
      if (fe < fr) { S[n] = xe; F[n] = fe; } else { S[n] = xr; F[n] = fr; }
    } else if (fr < F[n - 1]) { S[n] = xr; F[n] = fr; }
    else {
      const out = fr < F[n];
      const xc = at(out ? -0.5 : 0.5), fc = f(xc);
      if (fc < (out ? fr : F[n])) { S[n] = xc; F[n] = fc; }
      else {
        for (let i = 1; i <= n; i++) { S[i] = S[i].map((v, j) => S[0][j] + 0.5 * (v - S[0][j])); F[i] = f(S[i]); }
      }
    }
  }
  return { x: S[0], f: F[0], iter: it, converged: it < maxIt };
};
/* numerical gradient and Hessian (central differences) */
Num.grad = function (f, x, h) {
  return x.map((v, i) => {
    const d = h || 1e-5 * max(1, abs(v));
    const a = x.slice(), b = x.slice(); a[i] += d; b[i] -= d;
    return (f(a) - f(b)) / (2 * d);
  });
};
Num.hessian = function (f, x, h) {
  const n = x.length, H = M.zeros(n, n), f0 = f(x);
  const d = x.map(v => h || 1e-4 * max(1, abs(v)));
  for (let i = 0; i < n; i++) for (let j = i; j < n; j++) {
    let v;
    if (i === j) {
      const a = x.slice(), b = x.slice(); a[i] += d[i]; b[i] -= d[i];
      v = (f(a) - 2 * f0 + f(b)) / (d[i] * d[i]);
    } else {
      const pp = x.slice(), pm = x.slice(), mp = x.slice(), mm = x.slice();
      pp[i] += d[i]; pp[j] += d[j]; pm[i] += d[i]; pm[j] -= d[j]; mp[i] -= d[i]; mp[j] += d[j]; mm[i] -= d[i]; mm[j] -= d[j];
      v = (f(pp) - f(pm) - f(mp) + f(mm)) / (4 * d[i] * d[j]);
    }
    H[i][j] = H[j][i] = v;
  }
  return H;
};
/* Levenberg–Marquardt for nonlinear least squares: minimises Σ r_i(θ)².
   res(θ) → residual array; jac(θ) → n×k matrix (numerical if omitted).
   Returns θ, the residual sum of squares, the Jacobian at θ and whether it
   converged (relative change of RSS and of θ below tol). */
Num.levMar = function (res, p0, o) {
  o = o || {};
  const maxIt = o.maxIter || 500, tol = o.tol || 1e-12;
  const numJac = p => {
    const r0 = res(p);
    return { r0, J: r0.map(() => new Array(p.length).fill(0)), fill(J) {
      p.forEach((v, j) => {
        const h = 1e-7 * max(1, abs(v)), a = p.slice(), b = p.slice();
        a[j] += h; b[j] -= h;
        const ra = res(a), rb = res(b);
        for (let i = 0; i < r0.length; i++) J[i][j] = (ra[i] - rb[i]) / (2 * h);
      });
      return J;
    } };
  };
  const jacOf = p => (o.jac ? o.jac(p) : (() => { const q = numJac(p); return q.fill(q.J); })());
  let p = p0.slice(), r = res(p), rss = r.reduce((s, v) => s + v * v, 0), lambda = 1e-3, conv = false, it = 0;
  if (!isFinite(rss)) return { p, rss, J: null, converged: false, iter: 0 };
  for (; it < maxIt; it++) {
    const J = jacOf(p), k = p.length;
    const JtJ = M.zeros(k, k), Jtr = new Array(k).fill(0);
    for (let i = 0; i < r.length; i++) for (let a = 0; a < k; a++) {
      Jtr[a] += J[i][a] * r[i];
      for (let b = a; b < k; b++) JtJ[a][b] += J[i][a] * J[i][b];
    }
    for (let a = 0; a < k; a++) for (let b = 0; b < a; b++) JtJ[a][b] = JtJ[b][a];
    let improved = false;
    for (let tries = 0; tries < 40; tries++) {
      const A = JtJ.map((row, a) => row.map((v, b) => (a === b ? v + lambda * max(v, 1e-12) : v)));
      const delta = M.solve(A, Jtr.map(v => -v));
      if (!delta) { lambda *= 10; continue; }
      const pn = p.map((v, j) => v + delta[j]);
      const rn = res(pn), rssn = rn.reduce((s, v) => s + v * v, 0);
      if (isFinite(rssn) && rssn <= rss) {
        const dRel = abs(rss - rssn) / max(rss, 1e-300);
        const pRel = max(...delta.map((d, j) => abs(d) / max(abs(p[j]), 1e-8)));
        p = pn; r = rn; rss = rssn; lambda = max(lambda / 10, 1e-12); improved = true;
        if (dRel < tol || pRel < 1e-10) conv = true;
        break;
      }
      lambda *= 10;
    }
    /* no step lowers the sum of squares: a minimum only if the gradient vanishes there (it may be a wall
       of undefined residuals instead, as near the pole of a second-order curve) */
    if (!improved) { conv = Math.max(...Jtr.map(Math.abs)) <= 1e-6 * Math.max(1, Math.sqrt(rss)) * Math.max(1, ...p.map(Math.abs)); break; }
    if (conv) break;
  }
  return { p, rss, J: jacOf(p), resid: r, converged: conv, iter: it };
};

/* ---------------- random numbers ----------------
   sfc32 (a small fast counter generator that passes the usual statistical
   batteries), seeded; a normal by Box–Muller with its spare value kept. */
Num.rng = function (seed) {
  let a = 0x9e3779b9, b = 0x243f6a88, c = 0xb7e15162, d = (seed >>> 0) ^ 0xdeadbeef;
  const next = () => {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
  for (let i = 0; i < 15; i++) next();
  let spare = null;
  next.normal = function () {
    if (spare !== null) { const s = spare; spare = null; return s; }
    let u = 0;
    while (u === 0) u = next();
    const v = next(), r = sqrt(-2 * log(u));
    spare = r * Math.sin(2 * PI * v);
    return r * Math.cos(2 * PI * v);
  };
  next.int = k => floor(next() * k);
  next.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) { const j = floor(next() * (i + 1)); const t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
    return arr;
  };
  return next;
};

/* ---------------- small helpers ---------------- */
Num.clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
Num.atanh = x => 0.5 * log1p(2 * x / (1 - x));
Num.expm1 = expm1;
Num.log1p = log1p;

g.Num = Num;
return Num;
}
if (typeof window !== 'undefined') NumCore(window);
