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

/* PostHarvestPro — deterioration kinetics and shelf life.

   * Zero-, first- and second-order kinetics of a quality attribute,
       order 0:  C(t) = C0 − k·t
       order 1:  C(t) = C0·exp(−k·t)
       order 2:  C(t) = C0 / (1 + C0·k·t)
     (Labuza 1984, J. Chem. Educ. 61:348–358; Taoukis, Labuza & Saguy 1997,
     in Handbook of Food Engineering Practice, ch. 9). k > 0: the attribute
     falls; k < 0: it rises (browning, softening indices, microbial counts…).
     Fitted by nonlinear least squares in the original scale (Levenberg 1944,
     Q. Appl. Math. 2:164–168; Marquardt 1963, J. SIAM 11:431–441), stopped by
     the relative-offset criterion of Bates and Watts (1981, Technometrics
     23:179–183); or by the classical linearised regressions of C, ln C and 1/C
     on t. Wald intervals with Student's t; AIC, AICc (Hurvich & Tsai 1989,
     Biometrika 76:297–307) and BIC from the Gaussian likelihood, and Akaike
     weights (Burnham & Anderson 2002, Model Selection and Multimodel Inference).
   * Temperature dependence: Arrhenius, ln k = ln k_ref − (Ea/R)(1/T − 1/T_ref)
     (Arrhenius 1889, Z. Phys. Chem. 4:226–248; the reparametrisation about a
     reference temperature, Nelson 1980, IEEE Trans. Reliab. R-29:103–108;
     Taoukis & Labuza 1989, J. Food Sci. 54:783–788); Q10 (Labuza 1982, Shelf-life
     Dating of Foods); the square-root model √k = b·(T − Tmin) (Ratkowsky,
     Olley, McMeekin & Ball 1982, J. Bacteriol. 149:1–5), a special case of
     Bělehrádek's power law.
   * Shelf life: the time for the attribute to reach a limit, with a
     delta-method interval (Oehlert 1992, Am. Stat. 46:27–29); shelf life at any
     temperature from the kinetic order and k(T); accelerated shelf-life testing
     by regression of ln θ on 1/T or on T with a prediction interval (Labuza &
     Schmidl 1985, Food Technol. 39(9):57–64; Mizrahi 2004, in Understanding and
     Measuring the Shelf-life of Food, ch. 14).

   Temperatures enter in °C; T(K) = °C + 273.15; R = 8.314462618 J mol⁻¹ K⁻¹. */
function KinCore(g) {
'use strict';
const Num = g.Num;
const Kin = {};
const { abs, sqrt, exp, log, max, min, LN2 } = Math;
const RGAS = 8.314462618, K0 = 273.15;
Kin.R = RGAS;
Kin.K0 = K0;
const note = (es, en) => ({ es, en });
const isNum = v => typeof v === 'number' && isFinite(v);
const tq = (conf, df) => (df > 0 ? Num.qt(1 - (1 - conf) / 2, df) : NaN);
const LOG2PI = log(2 * Math.PI);

/* ---------------- the three kinetic models ----------------
   f(t; C0, k) and its gradient [∂f/∂C0, ∂f/∂k].
   order 2: ∂f/∂C0 = 1/D², ∂f/∂k = −C0²·t/D², D = 1 + C0·k·t; the model is
   undefined where D ≤ 0 (the pole of a rising second-order attribute). */
const MODELS = [
  { f: (t, C0, k) => C0 - k * t, d: (t) => [1, -t] },
  { f: (t, C0, k) => C0 * exp(-k * t), d: (t, C0, k) => { const e = exp(-k * t); return [e, -C0 * t * e]; } },
  {
    f: (t, C0, k) => { const D = 1 + C0 * k * t; return D > 0 ? C0 / D : NaN; },
    d: (t, C0, k) => { const D = 1 + C0 * k * t, D2 = D * D; return [1 / D2, -C0 * C0 * t / D2]; },
  },
];
Kin.model = function (order, t, C0, k) { return MODELS[order].f(t, C0, k); };
/* half-life (k > 0): order 0 C0/(2k); order 1 ln 2/k; order 2 1/(C0·k) */
function halfLife(order, C0, k) {
  if (!(k > 0)) return NaN;
  return order === 0 ? C0 / (2 * k) : order === 1 ? LN2 / k : 1 / (C0 * k);
}
/* the integrated kinetic function between C0 and a limit L, g(C0, L) = k·t_L:
   order 0 C0 − L; order 1 ln(C0/L); order 2 1/L − 1/C0 */
function gLimit(order, C0, L) {
  if (order === 0) return C0 - L;
  if (order === 1) return C0 / L > 0 ? log(C0 / L) : NaN;
  return L !== 0 && C0 !== 0 ? 1 / L - 1 / C0 : NaN;
}
Kin.gLimit = gLimit;

function cleanPairs(t, y) {
  const T = [], Y = [];
  for (let i = 0; i < Math.min(t.length, y.length); i++) if (isNum(+t[i]) && isNum(+y[i])) { T.push(+t[i]); Y.push(+y[i]); }
  return [T, Y];
}

/* ---------------- nonlinear least squares for two parameters ----------------
   Levenberg–Marquardt with Marquardt's diagonal scaling and the analytic
   Jacobian. Converged when the relative offset of Bates and Watts,
   √(gᵀ(JᵀJ)⁻¹g / RSS), g = Jᵀr, falls below 1e-11 (the projection of the
   residuals on the tangent plane is negligible next to the residuals), or
   when no step can lower the residual sum of squares any more. */
function lsq(t, y, M, p0) {
  const n = t.length;
  const rssOf = p => {
    let s = 0;
    for (let i = 0; i < n; i++) {
      const f = M.f(t[i], p[0], p[1]);
      if (!isFinite(f)) return Infinity;
      const r = y[i] - f;
      s += r * r;
    }
    return s;
  };
  let p = p0.slice(), S = rssOf(p);
  if (!isFinite(S)) return null;
  let yy = 0;
  for (let i = 0; i < n; i++) yy += y[i] * y[i];
  let lam = 1e-3, it = 0, conv = false, off = Infinity;
  for (; it < 1000; it++) {
    let a11 = 0, a12 = 0, a22 = 0, g1 = 0, g2 = 0;
    for (let i = 0; i < n; i++) {
      const d = M.d(t[i], p[0], p[1]), r = y[i] - M.f(t[i], p[0], p[1]);
      a11 += d[0] * d[0]; a12 += d[0] * d[1]; a22 += d[1] * d[1]; g1 += d[0] * r; g2 += d[1] * r;
    }
    const det = a11 * a22 - a12 * a12;
    const proj = det > 0 ? (a22 * g1 * g1 - 2 * a12 * g1 * g2 + a11 * g2 * g2) / det : Infinity;
    off = sqrt(max(0, proj) / max(S - proj, 1e-300));
    if (off < 1e-11 || S <= 1e-30 * yy) { conv = true; break; }
    let accepted = false;
    for (let tries = 0; tries < 80; tries++) {
      const b11 = a11 * (1 + lam), b22 = a22 * (1 + lam), dd = b11 * b22 - a12 * a12;
      if (!(dd > 0)) { lam = lam * 10 || 1e-6; continue; }
      const d0 = (b22 * g1 - a12 * g2) / dd, d1 = (b11 * g2 - a12 * g1) / dd;
      const pn = [p[0] + d0, p[1] + d1], Sn = rssOf(pn);
      if (Sn <= S) {
        const tiny = abs(d0) <= 1e-15 * max(abs(p[0]), 1e-300) && abs(d1) <= 1e-15 * max(abs(p[1]), 1e-300);
        p = pn; S = Sn; lam = max(lam / 10, 1e-15); accepted = true;
        if (tiny) conv = true;
        break;
      }
      lam *= 10;
      if (lam > 1e20) break;
    }
    if (!accepted) { conv = off < 1e-6; break; }
    if (conv) break;
  }
  return { p, rss: S, converged: conv, iter: it, offset: off };
}

/* starting values: the linearised regressions and the zero-order line, so that
   a noisy or odd data set still has a sensible start */
function starts(t, y, order) {
  const X = t.map(v => [1, v]);
  const L0 = Num.lm(X, y), a0 = L0.coef[0], b0 = L0.coef[1];
  const S = [];
  const pos = y.every(v => v > 0);
  if (order === 0) S.push([a0, -b0]);
  if (order === 1) {
    if (pos) { const L = Num.lm(X, y.map(log)); S.push([exp(L.coef[0]), -L.coef[1]]); }
    if (a0 !== 0) S.push([a0, -b0 / a0]);
    S.push([Num.mean(y), 0]);
  }
  if (order === 2) {
    if (pos) { const L = Num.lm(X, y.map(v => 1 / v)); if (L.coef[0] !== 0) S.push([1 / L.coef[0], L.coef[1]]); }
    if (a0 !== 0) S.push([a0, -b0 / (a0 * a0)]);
    S.push([Num.mean(y), 0]);
  }
  /* keep the second-order starts away from the pole */
  return S.filter(s => s.every(isNum)).map(s => {
    if (order !== 2) return s;
    const tmax = max(...t);
    if (1 + s[0] * s[1] * tmax <= 0.05) s[1] = -0.95 / (s[0] * tmax);
    return s;
  });
}

function nanFit(order, method, n, conf, notes) {
  const nan2 = [NaN, NaN];
  return {
    order, method, n, conf, C0: NaN, k: NaN, se: { C0: NaN, k: NaN }, ci: { C0: nan2, k: nan2 },
    vcov: [[NaN, NaN], [NaN, NaN]], rss: NaN, sigma: NaN, df: n - 2, aic: NaN, aicc: NaN, bic: NaN, r2: NaN,
    fitted: [], resid: [], converged: false, iter: 0, halfLife: NaN, predict: () => NaN,
    predictCI: () => ({ fit: NaN, se: NaN, lo: NaN, hi: NaN }), notes,
  };
}

/* Gaussian information criteria of a least-squares fit with p mean parameters
   (+1 for σ²): AIC = n·(log 2π + 1 + log(RSS/n)) + 2(p+1); AICc adds
   2K(K+1)/(n−K−1), K = p+1; BIC uses log(n)·(p+1). */
function infoCrit(n, rss, p) {
  const K = p + 1, base = n * (LOG2PI + 1 + log(rss / n));
  return { aic: base + 2 * K, aicc: n - K - 1 > 0 ? base + 2 * K + 2 * K * (K + 1) / (n - K - 1) : NaN, bic: base + log(n) * K };
}

/* attaches predict(t) and predictCI(t) — the confidence interval of the mean
   response by the delta method, f ± t·√(∇fᵀ V ∇f) — to a fit */
function attachPredict(F) {
  const M = MODELS[F.order], q = tq(F.conf, F.df);
  const one = t => M.f(t, F.C0, F.k);
  const oneCI = t => {
    const f = M.f(t, F.C0, F.k), d = M.d(t, F.C0, F.k), V = F.vcov;
    const se = sqrt(d[0] * d[0] * V[0][0] + 2 * d[0] * d[1] * V[0][1] + d[1] * d[1] * V[1][1]);
    return { t, fit: f, se, lo: f - q * se, hi: f + q * se };
  };
  F.predict = t => (Array.isArray(t) ? t.map(one) : one(t));
  F.predictCI = t => (Array.isArray(t) ? t.map(oneCI) : oneCI(t));
  return F;
}

/* ---------------- Kin.fit ----------------
   o.order 0 | 1 | 2 (default 1); o.method 'nls' (nonlinear least squares in
   the original scale, the default) or 'linear' (the linearised regressions);
   o.conf (0.95). */
Kin.fit = function (t, y, o) {
  o = o || {};
  const order = o.order == null ? 1 : +o.order, method = o.method || 'nls', conf = o.conf || 0.95;
  const [T, Y] = cleanPairs(t, y), n = T.length, notes = [];
  if (n < t.length) notes.push(note('Se omitieron pares con valores faltantes o no numéricos.', 'Pairs with missing or non-numeric values were omitted.'));
  if (![0, 1, 2].includes(order)) throw new Error('Kin.fit: order must be 0, 1 or 2');
  if (n < 3 || new Set(T).size < 2) {
    notes.push(note('Se necesitan al menos 3 observaciones en 2 tiempos distintos.', 'At least 3 observations at 2 different times are needed.'));
    return nanFit(order, method, n, conf, notes);
  }
  const F = method === 'linear' ? fitLinear(T, Y, order, conf, notes) : fitNls(T, Y, order, conf, notes);
  F.t = T; F.y = Y;
  if (F.k < 0) notes.push(note('k < 0: el atributo aumenta con el tiempo.', 'k < 0: the attribute increases with time.'));
  return F;
};

function fitNls(T, Y, order, conf, notes) {
  const n = T.length, M = MODELS[order];
  let best = null;
  for (const s of starts(T, Y, order)) {
    const r = lsq(T, Y, M, s);
    if (!r || !isFinite(r.rss)) continue;
    if (!best || (r.converged && !best.converged) || (r.converged === best.converged && r.rss < best.rss)) best = r;
  }
  if (!best) {
    notes.push(note('El ajuste no lineal no encontró una solución válida.', 'The nonlinear fit found no valid solution.'));
    return nanFit(order, 'nls', n, conf, notes);
  }
  if (!best.converged) notes.push(note('El ajuste no lineal no convergió; los resultados son aproximados.', 'The nonlinear fit did not converge; results are approximate.'));
  const [C0, k] = best.p, df = n - 2;
  let a11 = 0, a12 = 0, a22 = 0;
  const fitted = [], resid = [];
  for (let i = 0; i < n; i++) {
    const d = M.d(T[i], C0, k), f = M.f(T[i], C0, k);
    a11 += d[0] * d[0]; a12 += d[0] * d[1]; a22 += d[1] * d[1];
    fitted.push(f); resid.push(Y[i] - f);
  }
  const rss = best.rss, s2 = df > 0 ? rss / df : NaN, det = a11 * a22 - a12 * a12;
  const vcov = [[s2 * a22 / det, -s2 * a12 / det], [-s2 * a12 / det, s2 * a11 / det]];
  const se = { C0: sqrt(vcov[0][0]), k: sqrt(vcov[1][1]) }, q = tq(conf, df);
  const ybar = Num.mean(Y);
  let tss = 0;
  for (let i = 0; i < n; i++) tss += (Y[i] - ybar) * (Y[i] - ybar);
  const ic = infoCrit(n, rss, 2);
  return attachPredict({
    order, method: 'nls', n, conf, C0, k, se,
    ci: { C0: [C0 - q * se.C0, C0 + q * se.C0], k: [k - q * se.k, k + q * se.k] },
    vcov, rss, sigma: sqrt(s2), df, aic: ic.aic, aicc: ic.aicc, bic: ic.bic, r2: 1 - rss / tss,
    fitted, resid, converged: best.converged, iter: best.iter, offset: best.offset,
    halfLife: halfLife(order, C0, k), notes,
  });
}

/* the linearised regressions: C, ln C or 1/C on t (Labuza 1984). The regression
   statistics (r², σ, RSS, AIC) belong to the transformed scale, as the classical
   method reports them; C0 and k are back-transformed, with delta-method
   standard errors and the intervals of the regression coefficients transformed
   end to end. */
function fitLinear(T, Y, order, conf, notes) {
  const n = T.length;
  if (order > 0 && !Y.every(v => v > 0)) {
    notes.push(note('La linealización requiere valores positivos del atributo.', 'The linearisation needs positive values of the attribute.'));
    return nanFit(order, 'linear', n, conf, notes);
  }
  const tr = [v => v, exp, v => 1 / v][order];
  const Z = order === 0 ? Y.slice() : order === 1 ? Y.map(log) : Y.map(v => 1 / v);
  const L = Num.lm(T.map(v => [1, v]), Z);
  const a = L.coef[0], b = L.coef[1], V = L.vcov, df = L.df, q = tq(conf, df);
  const C0 = tr(a), k = order === 2 ? b : -b;
  const dC0 = [1, exp(a), -1 / (a * a)][order], dk = order === 2 ? 1 : -1;
  const vcov = [[dC0 * dC0 * V[0][0], dC0 * dk * V[0][1]], [dC0 * dk * V[0][1], dk * dk * V[1][1]]];
  const ciA = [a - q * L.se[0], a + q * L.se[0]].map(tr).sort((u, v) => u - v);
  const ciK = order === 2 ? [b - q * L.se[1], b + q * L.se[1]] : [-b - q * L.se[1], -b + q * L.se[1]];
  const fitted = L.fitted.map(tr), resid = Y.map((v, i) => v - fitted[i]);
  const ic = infoCrit(n, L.rss, 2);
  return attachPredict({
    order, method: 'linear', n, conf, C0, k, se: { C0: abs(dC0) * L.se[0], k: L.se[1] },
    ci: { C0: ciA, k: ciK }, vcov, rss: L.rss, sigma: L.sigma, df, aic: ic.aic, aicc: ic.aicc, bic: ic.bic, r2: L.r2,
    fitted, resid, converged: true, iter: 0, halfLife: halfLife(order, C0, k),
    lin: { scale: ['C', 'ln C', '1/C'][order], coef: [a, b], se: L.se.slice(), rss: L.rss, sigma: L.sigma, r2: L.r2 },
    notes,
  });
}

/* ---------------- Kin.compare: the three orders side by side ----------------
   Nonlinear fits of the three orders in the original scale, so that their
   likelihoods are comparable; ΔAIC and Akaike weights w_i = exp(−Δ_i/2)/Σ
   (Burnham & Anderson 2002). The r² of the linearised plots (the classical
   choice of order) is given alongside. */
function akaike(v) {
  const ok = v.filter(isNum), m = ok.length ? min(...ok) : NaN;
  const d = v.map(a => (isNum(a) ? a - m : NaN));
  const e = d.map(x => (isNum(x) ? exp(-x / 2) : 0)), s = e.reduce((p, q) => p + q, 0);
  return { delta: d, weights: e.map(x => (s > 0 && isNum(x) ? x / s : NaN)), best: ok.length ? v.indexOf(m) : -1 };
}
Kin.compare = function (t, y, o) {
  o = o || {};
  const fits = [0, 1, 2].map(order => Kin.fit(t, y, Object.assign({}, o, { order, method: 'nls' })));
  const A = akaike(fits.map(f => f.aic)), Ac = akaike(fits.map(f => f.aicc));
  const lin = [0, 1, 2].map(order => Kin.fit(t, y, Object.assign({}, o, { order, method: 'linear' })));
  return {
    fits, aic: fits.map(f => f.aic), deltaAIC: A.delta, weights: A.weights, best: A.best, bestFit: fits[A.best] || null,
    aicc: fits.map(f => f.aicc), deltaAICc: Ac.delta, weightsAICc: Ac.weights, bestAICc: Ac.best,
    linearR2: lin.map(f => f.r2), linear: lin,
  };
};

/* ---------------- Arrhenius ----------------
   ln k = ln k_ref − (Ea/R)·(1/T − 1/T_ref), by (weighted) least squares on ln k.
   T_ref defaults to the harmonic mean of the temperatures (in K), which makes
   the intercept and the slope uncorrelated in the unweighted fit. Ea = −R·slope;
   ln A = ln k_ref + Ea/(R·T_ref). With standard errors of k, the weights are
   1/Var(ln k) ≈ k²/SE(k)² (delta method). The intervals of k(T) transform the
   interval of the mean of ln k (or, with interval: 'prediction', of a new
   observation, with weight 1). */
Kin.arrhenius = function (Tc, k, o) {
  o = o || {};
  const conf = o.conf || 0.95, notes = [];
  const idx = [];
  for (let i = 0; i < Math.min(Tc.length, k.length); i++) if (isNum(+Tc[i]) && +k[i] > 0) idx.push(i);
  if (idx.length < Math.min(Tc.length, k.length)) notes.push(note('Se omitieron puntos con k ≤ 0 o faltantes (ln k no existe).', 'Points with k ≤ 0 or missing were omitted (ln k is undefined).'));
  const T = idx.map(i => +Tc[i] + K0), K = idx.map(i => +k[i]), n = T.length;
  let w = null;
  if (o.weights) w = idx.map(i => +o.weights[i]);
  else if (o.se) w = idx.map((i, j) => (K[j] / +o.se[i]) ** 2);
  if (w && !w.every(v => isNum(v) && v > 0)) {
    notes.push(note('Pesos no válidos (EE nulo, negativo o faltante): se ajusta sin ponderar.', 'Invalid weights (zero, negative or missing SE): the fit is unweighted.'));
    w = null;
  }
  const TrefK = o.Tref != null ? +o.Tref + K0 : n / T.reduce((s, v) => s + 1 / v, 0);
  const res = { n, conf, TrefC: TrefK - K0, notes, weighted: !!w };
  if (n < 2 || new Set(T).size < 2) {
    notes.push(note('Se necesitan al menos 2 temperaturas distintas.', 'At least 2 different temperatures are needed.'));
    return Object.assign(res, { Ea: NaN, EaKJ: NaN, se: { Ea: NaN, lnKRef: NaN, lnA: NaN }, ci: { Ea: [NaN, NaN], kRef: [NaN, NaN], lnA: [NaN, NaN] }, kRef: NaN, lnA: NaN, r2: NaN, df: n - 2, sigma: NaN, predict: () => ({ k: NaN, lo: NaN, hi: NaN }), q10At: () => NaN });
  }
  const x = T.map(v => 1 / v - 1 / TrefK), z = K.map(log);
  const L = Num.lm(x.map(v => [1, v]), z, w || undefined);
  const a = L.coef[0], b = L.coef[1], V = L.vcov, df = L.df, q = tq(conf, df);
  const Ea = -b * RGAS, seEa = L.se[1] * RGAS;
  const lnA = a - b / TrefK, seLnA = sqrt(V[0][0] - 2 * V[0][1] / TrefK + V[1][1] / (TrefK * TrefK));
  const one = (tc, oo) => {
    const x0 = 1 / (tc + K0) - 1 / TrefK, m = a + b * x0;
    const seM = sqrt(V[0][0] + 2 * x0 * V[0][1] + x0 * x0 * V[1][1]);
    const s = oo && oo.interval === 'prediction' ? sqrt(seM * seM + L.sigma2) : seM;
    return { Tc: tc, lnk: m, se: s, k: exp(m), lo: exp(m - q * s), hi: exp(m + q * s) };
  };
  return Object.assign(res, {
    Ea, EaKJ: Ea / 1000, se: { Ea: seEa, lnKRef: L.se[0], lnA: seLnA },
    ci: { Ea: [Ea - q * seEa, Ea + q * seEa], kRef: [exp(a - q * L.se[0]), exp(a + q * L.se[0])], lnA: [lnA - q * seLnA, lnA + q * seLnA] },
    kRef: exp(a), lnKRef: a, lnA, slope: b, vcov: V, r2: L.r2, df, sigma: L.sigma,
    x, lnk: z, fitted: L.fitted, resid: L.resid, Tc: idx.map(i => +Tc[i]), k: K,
    predict: (tc, oo) => (Array.isArray(tc) ? tc.map(v => one(v, oo)) : one(tc, oo)),
    q10At: tc => (Array.isArray(tc) ? tc.map(v => Kin.q10FromEa(Ea, v)) : Kin.q10FromEa(Ea, tc)),
  });
};

/* ---------------- Q10 ----------------
   Q10 = (k2/k1)^(10/(T2 − T1)) (Labuza 1982); from an activation energy,
   Q10(T) = exp(10·Ea / (R·T·(T + 10))), T in K (Taoukis & Labuza 1989), and back,
   Ea = ln Q10 · R·T·(T + 10)/10. */
Kin.q10 = function (k1, T1, k2, T2) {
  if (!(k1 > 0 && k2 > 0) || T1 === T2) return NaN;
  return Math.pow(k2 / k1, 10 / (T2 - T1));
};
Kin.q10FromEa = function (Ea, Tc) { const T = Tc + K0; return exp(10 * Ea / (RGAS * T * (T + 10))); };
Kin.eaFromQ10 = function (Q10, Tc) { const T = Tc + K0; return Q10 > 0 ? log(Q10) * RGAS * T * (T + 10) / 10 : NaN; };

/* ---------------- square-root (Ratkowsky) model ----------------
   √k = b·(T − Tmin) (Ratkowsky et al. 1982), fitted as the straight line
   √k = β0 + β1·T: b = β1, Tmin = −β0/β1, whose standard error comes from the
   delta method with ∇Tmin = (−1/β1, β0/β1²). Predictions square the
   confidence limits of the mean of √k (0 below Tmin). */
Kin.belehradek = function (Tc, k, o) {
  o = o || {};
  const conf = o.conf || 0.95, notes = [];
  const idx = [];
  for (let i = 0; i < Math.min(Tc.length, k.length); i++) if (isNum(+Tc[i]) && +k[i] >= 0) idx.push(i);
  if (idx.length < Math.min(Tc.length, k.length)) notes.push(note('Se omitieron puntos con k < 0 o faltantes.', 'Points with k < 0 or missing were omitted.'));
  const T = idx.map(i => +Tc[i]), s = idx.map(i => sqrt(+k[i])), n = T.length;
  if (n < 3 || new Set(T).size < 2) {
    notes.push(note('Se necesitan al menos 3 puntos en 2 temperaturas distintas.', 'At least 3 points at 2 different temperatures are needed.'));
    return { n, b: NaN, Tmin: NaN, se: { b: NaN, Tmin: NaN }, ci: { b: [NaN, NaN], Tmin: [NaN, NaN] }, r2: NaN, sigma: NaN, df: n - 2, notes, predict: () => ({ k: NaN, lo: NaN, hi: NaN }) };
  }
  const L = Num.lm(T.map(v => [1, v]), s), b0 = L.coef[0], b1 = L.coef[1], V = L.vcov, q = tq(conf, L.df);
  const Tmin = -b0 / b1, gA = -1 / b1, gB = b0 / (b1 * b1);
  const seTmin = sqrt(gA * gA * V[0][0] + 2 * gA * gB * V[0][1] + gB * gB * V[1][1]);
  const sq = v => (v > 0 ? v * v : 0);
  const one = tc => {
    const m = b0 + b1 * tc, se = sqrt(V[0][0] + 2 * tc * V[0][1] + tc * tc * V[1][1]);
    return { Tc: tc, sqrtK: m, se, k: sq(m), lo: sq(m - q * se), hi: sq(m + q * se) };
  };
  return {
    n, conf, b: b1, Tmin, se: { b: L.se[1], Tmin: seTmin }, ci: { b: [b1 - q * L.se[1], b1 + q * L.se[1]], Tmin: [Tmin - q * seTmin, Tmin + q * seTmin] },
    coef: [b0, b1], vcov: V, r2: L.r2, sigma: L.sigma, df: L.df, fitted: L.fitted, resid: L.resid, notes,
    predict: tc => (Array.isArray(tc) ? tc.map(one) : one(tc)),
  };
};

/* ---------------- time to a limit ----------------
   t_L = g(C0, L)/k with g = C0 − L, ln(C0/L) or 1/L − 1/C0 for orders 0, 1, 2.
   Delta method with the covariance of (C0, k):
     ∂t/∂C0 = 1/k, 1/(C0·k), 1/(C0²·k);  ∂t/∂k = −t/k;
   t ± t_{df}·SE. NaN when the limit is never reached (t ≤ 0 or undefined). */
Kin.timeToLimit = function (fit, limit, o) {
  o = o || {};
  const conf = o.conf || fit.conf || 0.95, out = { limit, t: NaN, se: NaN, lo: NaN, hi: NaN, notes: [] };
  const { order, C0, k } = fit;
  if (!isNum(C0) || !isNum(k) || !isNum(limit)) return out;
  const t = gLimit(order, C0, limit) / k;
  if (!(t > 0) || !isFinite(t)) {
    out.notes.push(note('El atributo nunca alcanza ese límite con este modelo.', 'The attribute never reaches that limit under this model.'));
    return out;
  }
  const dC = order === 0 ? 1 / k : order === 1 ? 1 / (C0 * k) : 1 / (C0 * C0 * k), dk = -t / k, V = fit.vcov;
  const se = sqrt(dC * dC * V[0][0] + 2 * dC * dk * V[0][1] + dk * dk * V[1][1]), q = tq(conf, fit.df);
  return Object.assign(out, { t, se, lo: t - q * se, hi: t + q * se });
};

/* ---------------- shelf life at any temperature ----------------
   θ(T) = g(C0, L)/k(T), with k(T) from an Arrhenius fit. The interval maps the
   interval of k(T) through θ = g/k (the uncertainty of C0 is not propagated).
   `src` is either an Arrhenius result (then o.order and o.C0 are required) or
   { Tc: [...], fits: [...] }, kinetic fits of one order at several
   temperatures: Arrhenius is fitted to their k (weighted by 1/Var(ln k) with
   o.weighted), C0 is the mean of their C0 unless o.C0 is given. For a rising
   attribute (all k < 0) the fit uses |k|. */
Kin.shelfLifeAt = function (src, Tc, limit, o) {
  o = o || {};
  const conf = o.conf || 0.95;
  let arr, order, C0, sign = 1;
  if (src && Array.isArray(src.fits)) {
    const ks = src.fits.map(f => f.k);
    sign = ks.every(v => v < 0) ? -1 : 1;
    arr = Kin.arrhenius(src.Tc, ks.map(v => sign * v), { conf, Tref: o.Tref, se: o.weighted ? src.fits.map(f => f.se.k) : undefined });
    order = o.order != null ? o.order : src.fits[0].order;
    C0 = o.C0 != null ? o.C0 : Num.mean(src.fits.map(f => f.C0));
  } else {
    arr = src; order = o.order; C0 = o.C0;
    if (o.sign) sign = o.sign < 0 ? -1 : 1;
  }
  const G = gLimit(order, C0, limit) * sign;
  const one = tc => {
    const p = arr.predict(tc, { interval: o.interval });
    const ok = G > 0 && p.k > 0;
    return { Tc: tc, k: sign * p.k, kLo: sign * p.lo, kHi: sign * p.hi, t: ok ? G / p.k : NaN, lo: ok ? G / p.hi : NaN, hi: ok ? G / p.lo : NaN };
  };
  const out = Array.isArray(Tc) ? Tc.map(one) : one(Tc);
  return { arrhenius: arr, order, C0, limit, result: out };
};

/* ---------------- accelerated shelf-life testing ----------------
   Shelf lives θ observed at high temperatures, extrapolated to the storage
   temperature by the straight line
     arrhenius: ln θ = a + b·(1/T)   (θ ∝ 1/k, so Ea = R·b)
     q10:       ln θ = a + b·T(°C)   (Q10 = exp(−10·b))
   (Labuza & Schmidl 1985). The estimate exp(â + b̂·x0) is the geometric-mean
   shelf life; its interval is the PREDICTION interval of a new ln θ (Student's
   t), transformed; the interval of the mean is given too. */
Kin.aslt = function (o) {
  o = o || {};
  const conf = o.conf || 0.95, model = o.model || 'arrhenius', Tt = +o.Ttarget, notes = [];
  const TcIn = o.Tc || [], thIn = o.shelfLife || [];
  const idx = [];
  for (let i = 0; i < Math.min(TcIn.length, thIn.length); i++) if (isNum(+TcIn[i]) && +thIn[i] > 0) idx.push(i);
  const Tc = idx.map(i => +TcIn[i]), th = idx.map(i => +thIn[i]), n = Tc.length;
  const xOf = tc => (model === 'arrhenius' ? 1 / (tc + K0) : tc);
  const out = { model, n, conf, Ttarget: Tt, notes };
  if (n < 3 || new Set(Tc).size < 2) {
    notes.push(note('Se necesitan al menos 3 vidas de anaquel en 2 temperaturas distintas.', 'At least 3 shelf lives at 2 different temperatures are needed.'));
    return Object.assign(out, { estimate: NaN, lo: NaN, hi: NaN, Q10: NaN, Ea: NaN, r2: NaN });
  }
  /* centred abscissa: the same line, better conditioned */
  const xs = Tc.map(xOf), xm = Num.mean(xs);
  const L = Num.lm(xs.map(v => [1, v - xm]), th.map(log));
  const a = L.coef[0], b = L.coef[1], V = L.vcov, q = tq(conf, L.df);
  const x0 = xOf(Tt) - xm, m = a + b * x0, seM = sqrt(V[0][0] + 2 * x0 * V[0][1] + x0 * x0 * V[1][1]);
  const seP = sqrt(seM * seM + L.sigma2);
  let Ea, Q10;
  if (model === 'arrhenius') { Ea = b * RGAS; Q10 = Kin.q10FromEa(Ea, Tt); } else { Q10 = exp(-10 * b); Ea = Kin.eaFromQ10(Q10, Tt); }
  if (isNum(Tt) && (Tt < min(...Tc) || Tt > max(...Tc))) notes.push(note('Extrapolación fuera de las temperaturas ensayadas.', 'Extrapolation outside the tested temperatures.'));
  return Object.assign(out, {
    estimate: exp(m), lo: exp(m - q * seP), hi: exp(m + q * seP), se: seP, seMean: seM, ciMean: [exp(m - q * seM), exp(m + q * seM)],
    Ea, EaKJ: Ea / 1000, Q10, slope: b, intercept: a - b * xm, r2: L.r2, df: L.df, sigma: L.sigma,
    Tc, shelfLife: th, fitted: L.fitted.map(exp),
    predict: tc => { const z = xOf(tc) - xm, mm = a + b * z, s1 = sqrt(V[0][0] + 2 * z * V[0][1] + z * z * V[1][1]), s2 = sqrt(s1 * s1 + L.sigma2); return { Tc: tc, estimate: exp(mm), lo: exp(mm - q * s2), hi: exp(mm + q * s2) }; },
  });
};

g.Kin = Kin;
return Kin;
}
if (typeof window !== 'undefined') KinCore(window);
