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

/* PostHarvestPro — time to failure (sensory rejection, decay, loss of
   marketability) with right censoring.

   * Kaplan–Meier estimator, Ŝ(t) = Π_{t_j ≤ t} (1 − d_j/n_j) (Kaplan & Meier
     1958, J. Am. Statist. Assoc. 53:457–481), with Greenwood's variance,
     Var(log Ŝ) = Σ d_j/(n_j(n_j − d_j)) (Greenwood 1926, Rep. Public Health Med.
     Subj. 33), and pointwise intervals on the plain, log and log(−log) scales
     (Kalbfleisch & Prentice 2002, The Statistical Analysis of Failure Time
     Data, §1.4). Median and quantiles with the intervals of Brookmeyer and
     Crowley (1982, Biometrics 38:29–41): the times where the confidence limits
     of Ŝ cross 1 − p. Restricted mean ∫₀^τ Ŝ(t)dt and its standard error
     (Klein & Moeschberger 2003, Survival Analysis, §4.5).
   * Log-rank test and the G^ρ family, weights Ŝ(t−)^ρ from the pooled data
     (Mantel 1966, Cancer Chemother. Rep. 50:163–170; Peto & Peto 1972,
     J. R. Statist. Soc. A 135:185–207; Harrington & Fleming 1982, Biometrika
     69:553–566), with the hypergeometric covariance and a generalized inverse
     that drops the first group.
   * Parametric accelerated-failure-time models, log T = x'β + σ·W, W standard
     extreme-value (Weibull; exponential with σ = 1), normal (lognormal) or
     logistic (log-logistic), fitted by maximum likelihood with right
     censoring: Newton–Raphson in (β, log σ) with the analytic first and second
     derivatives, step halving, and the inverse observed information as the
     covariance (Kalbfleisch & Prentice 2002, ch. 2–3; Lawless 2003, Statistical
     Models and Methods for Lifetime Data, ch. 4–6). Quantiles
     t_p = exp(x'β + σ·w_p) with delta-method intervals on the log scale;
     Akaike's criterion to choose the distribution.

   time = time to the event (> 0 for the parametric models); status 1 = event,
   0 = right-censored. Groups use treatment contrasts: the first level is the
   reference. */
function SurvCore(g) {
'use strict';
const Num = g.Num;
const Surv = {};
const { abs, sqrt, exp, log, log1p, max, min } = Math;
const note = (es, en) => ({ es, en });
const isNum = v => typeof v === 'number' && isFinite(v);
const LN_SQRT_2PI = 0.9189385332046727418;

function stat01(s) { return s === true || s === 1 || s === '1' ? 1 : s === false || s === 0 || s === '0' ? 0 : NaN; }
/* keeps the valid records: finite time ≥ 0 (> 0 when positive is set), status 0/1 */
function clean(time, status, extra, positive) {
  const keep = [];
  for (let i = 0; i < time.length; i++) {
    const t = +time[i], s = stat01(status[i]);
    if (isNum(t) && (positive ? t > 0 : t >= 0) && (s === 0 || s === 1)) keep.push(i);
  }
  return keep;
}
/* level order: as given, else the sorted distinct values (numerically when all are numbers) */
function levelsOf(group, given) {
  if (given) return given.slice();
  const u = Array.from(new Set(group.map(v => (v == null ? v : String(v))))).filter(v => v != null && v !== '');
  const allNum = u.every(v => isNum(+v));
  return u.sort((a, b) => (allNum ? +a - +b : a < b ? -1 : a > b ? 1 : 0));
}

/* ---------------- Kaplan–Meier ----------------
   One row per distinct time (events and censorings), as in the classical
   life table: n at risk just before t, events, censorings, Ŝ(t), the standard
   error of Ŝ (Greenwood: Ŝ·√Σ d/(n(n−d)); infinite when every subject at risk
   fails, so Ŝ = 0 and its error is undefined), and the interval:
     plain    Ŝ ± z·SE, clipped to [0, 1]
     log      Ŝ·exp(∓ z·σ_H), σ_H = SE/Ŝ, the upper limit clipped at 1
     log-log  Ŝ^exp(±z·σ_H/log Ŝ)   (undefined at Ŝ = 0 and Ŝ = 1). */
function kmCI(S, sH, z, type) {
  if (type === 'plain') {
    const h = z * sH * S;
    return [max(S - h, 0), min(S + h, 1)];
  }
  if (type === 'log-log') {
    if (S === 0 || S === 1) return [NaN, NaN];
    const h = z * sH / log(S), ll = log(-log(S));
    return [exp(-exp(ll - h)), exp(-exp(ll + h))];
  }
  if (S === 0) return [NaN, NaN];
  return [exp(log(S) - z * sH), min(exp(log(S) + z * sH), 1)];
}
/* the median rule of the classical summary table: the first time with Ŝ ≤ ½
   (to a tolerance √ε); if Ŝ equals ½ exactly over an interval, the midpoint of
   that interval (to the next drop) */
function medianRule(y, x) {
  const tol = 1.4901161193847656e-8;
  const X = [], Y = [];
  for (let i = 0; i < y.length; i++) if (y[i] === y[i] && y[i] < 0.5 + tol) { X.push(x[i]); Y.push(y[i]); }
  if (!X.length) return NaN;
  if (abs(Y[0] - 0.5) < tol) {
    for (let i = 1; i < Y.length; i++) if (Y[i] < Y[0]) return (X[0] + X[i]) / 2;
  }
  return X[0];
}
/* constant (right-continuous, f = 1) interpolation of index against level,
   after dropping missing levels, sorting and averaging ties */
function stepIndex(levels, p) {
  const pts = [];
  for (let i = 0; i < levels.length; i++) if (levels[i] === levels[i]) pts.push([levels[i], i + 1]);
  pts.sort((a, b) => a[0] - b[0]);
  const X = [], Y = [];
  for (let i = 0; i < pts.length;) {
    let j = i, s = 0;
    while (j < pts.length && pts[j][0] === pts[i][0]) { s += pts[j][1]; j++; }
    X.push(pts[i][0]); Y.push(s / (j - i));
    i = j;
  }
  if (!X.length || p < X[0] || p > X[X.length - 1]) return NaN;
  for (let i = 0; i < X.length; i++) {
    if (p === X[i]) return Y[i];
    if (p < X[i]) return Y[i];
  }
  return NaN;
}
/* the p-th quantile of a step distribution F (x = times with the start time
   first, y = F = 1 − Ŝ with 0 first): the first time F exceeds p; when F
   equals p (to √ε) over an interval, its midpoint (Brookmeyer & Crowley 1982) */
function findQ(x, y, p) {
  const tol = 1.4901161193847656e-8;
  let ymax = -Infinity;
  for (const v of y) if (v === v && v > ymax) ymax = v;
  if (ymax < p) return NaN;
  const xmax = x[x.length - 1];
  /* drop repeated levels, keeping the first time of each */
  const X = [], Y = [], seen = [];
  for (let i = 0; i < y.length; i++) {
    const v = y[i], dup = seen.some(s => (s !== s && v !== v) || s === v);
    if (dup) continue;
    seen.push(v); X.push(x[i]); Y.push(v);
  }
  const n = Y.length;
  if (p === 0) return X[0];
  const i1 = stepIndex(Y.map(v => v + tol), p), i2 = stepIndex(Y.map(v => v - tol), p);
  let q = (X[i1 - 1] + X[i2 - 1]) / 2;
  if (Y[n - 1] === Y[n - 1] && abs(p - Y[n - 1]) < tol) q = (X[i1 - 1] + xmax) / 2;
  return isNum(q) ? q : NaN;
}

Surv.km = function (time, status, o) {
  o = o || {};
  const conf = o.conf || 0.95, type = o.confType || 'log', z = Num.qnorm(1 - (1 - conf) / 2);
  const keep = clean(time, status), notes = [];
  if (keep.length < time.length) notes.push(note('Se omitieron registros con tiempo o estado no válido.', 'Records with an invalid time or status were omitted.'));
  const T = keep.map(i => +time[i]), D = keep.map(i => stat01(status[i])), n = T.length;
  const ord = T.map((_, i) => i).sort((a, b) => T[a] - T[b]);
  const out = { n, events: 0, conf, confType: type, time: [], nRisk: [], nEvent: [], nCensor: [], surv: [], stdErrLog: [], se: [], lower: [], upper: [], notes };
  let nr = n, S = 1, vH = 0;
  for (let i = 0; i < n;) {
    const t = T[ord[i]];
    let d = 0, c = 0, j = i;
    while (j < n && T[ord[j]] === t) { if (D[ord[j]]) d++; else c++; j++; }
    if (d > 0) {
      S *= (nr - d) / nr;
      vH += nr > d ? d / (nr * (nr - d)) : Infinity;
    }
    const sH = sqrt(vH), ci = kmCI(S, sH, z, type);
    out.time.push(t); out.nRisk.push(nr); out.nEvent.push(d); out.nCensor.push(c);
    out.surv.push(S); out.stdErrLog.push(sH); out.se.push(S * sH); out.lower.push(ci[0]); out.upper.push(ci[1]);
    out.events += d;
    nr -= d + c;
    i = j;
  }
  out.median = medianRule(out.surv, out.time);
  out.medianCI = [medianRule(out.lower, out.time), medianRule(out.upper, out.time)];
  /* restricted mean up to τ (default: the last time), with the variance
     Σ_j A_j² d_j/(n_j(n_j − d_j)), A_j the area under Ŝ after t_j */
  const tau = o.tau != null ? +o.tau : (n ? out.time[out.time.length - 1] : NaN);
  const rm = rmean(out, tau);
  out.rmean = rm.mean; out.rmeanSE = rm.se; out.tau = tau;
  out.quantile = p => kmQuantile(out, p);
  if (n && out.events === 0) notes.push(note('No hay eventos: Ŝ = 1 en todo el periodo.', 'There are no events: Ŝ = 1 throughout.'));
  return out;
};
function rmean(K, tau) {
  if (!K.time.length || !isNum(tau)) return { mean: NaN, se: NaN };
  const t0 = min(0, K.time[0]);
  const idx = [];
  for (let i = 0; i < K.time.length; i++) if (K.time[i] <= tau) idx.push(i);
  let tt, ss, hh;
  const hz = i => (K.nRisk[i] - K.nEvent[i] === 0 ? 0 : K.nEvent[i] / (K.nRisk[i] * (K.nRisk[i] - K.nEvent[i])));
  if (!idx.length) { tt = [tau]; ss = [1]; hh = [0]; }
  else {
    tt = idx.map(i => K.time[i]).concat([tau]);
    ss = idx.map(i => K.surv[i]).concat([K.surv[idx[idx.length - 1]]]);
    hh = idx.map(hz).concat([0]);
  }
  const m = tt.length, rect = [];
  for (let i = 0; i < m; i++) rect.push((tt[i] - (i ? tt[i - 1] : t0)) * (i ? ss[i - 1] : 1));
  let mean = t0, v = 0, cum = 0;
  for (let i = 0; i < m; i++) mean += rect[i];
  /* Σ over j of (area after t_j)² · h_j, j running backwards from the end */
  for (let k = m - 1; k >= 1; k--) { cum += rect[k]; v += cum * cum * hh[k - 1]; }
  return { mean, se: sqrt(v) };
}
function kmQuantile(K, p) {
  const x = [min(0, K.time[0])].concat(K.time);
  const F = s => [0].concat(s.map(v => 1 - v));
  const one = pp => ({ p: pp, est: findQ(x, F(K.surv), pp), lo: findQ(x, F(K.lower), pp), hi: findQ(x, F(K.upper), pp) });
  return Array.isArray(p) ? p.map(one) : one(p);
}
Surv.kmQuantile = kmQuantile;

/* ---------------- several groups ---------------- */
Surv.kmGroups = function (time, status, group, o) {
  o = o || {};
  const lv = levelsOf(group, o.levels);
  const groups = lv.map(L => {
    const idx = [];
    for (let i = 0; i < group.length; i++) if (String(group[i]) === String(L)) idx.push(i);
    return Object.assign({ name: L }, Surv.km(idx.map(i => time[i]), idx.map(i => status[i]), o));
  });
  return { levels: lv, groups, logrank: lv.length > 1 ? Surv.logrank(time, status, group, Object.assign({}, o, { levels: lv })) : null };
};

/* ---------------- log-rank and G^ρ tests ----------------
   At each distinct event time, with N at risk, d events, n_k at risk in group k
   and weight w = Ŝ(t−)^ρ (pooled Kaplan–Meier, left-continuous):
     O_k += w·d_k,  E_k += w·d·n_k/N,
     V_kl += w²·d·(N − d)/(N − 1)·(n_k/N)·(δ_kl − n_l/N).
   χ² = (O − E)'V⁻(O − E) over the groups with E > 0 but the first; df = their
   number − 1. ρ = 0: log-rank (Mantel 1966); ρ = 1: Peto–Peto–Prentice. */
Surv.logrank = function (time, status, group, o) {
  o = o || {};
  const rho = o.rho || 0;
  const keep = clean(time, status).filter(i => group[i] != null && group[i] !== '');
  const lv = levelsOf(keep.map(i => group[i]), o.levels), G = lv.length;
  const T = keep.map(i => +time[i]), D = keep.map(i => stat01(status[i])), K = keep.map(i => lv.indexOf(String(group[i])));
  const n = T.length, ord = T.map((_, i) => i).sort((a, b) => T[a] - T[b] || D[b] - D[a]);
  const obs = new Array(G).fill(0), ex = new Array(G).fill(0), V = Array.from({ length: G }, () => new Array(G).fill(0));
  const risk = new Array(G).fill(0);
  K.forEach(k => { if (k >= 0) risk[k]++; });
  let km = 1, N = n;
  for (let i = 0; i < n;) {
    const t = T[ord[i]];
    let j = i, d = 0;
    const dk = new Array(G).fill(0), ck = new Array(G).fill(0);
    while (j < n && T[ord[j]] === t) { const k = K[ord[j]]; if (D[ord[j]]) { d++; dk[k]++; } else ck[k]++; j++; }
    const w = rho === 0 ? 1 : Math.pow(km, rho);
    for (let k = 0; k < G; k++) obs[k] += w * dk[k];
    if (d > 0) {
      for (let k = 0; k < G; k++) ex[k] += w * d * risk[k] / N;
      if (N > 1) {
        const w2 = w * w, f = w2 * d * (N - d) / (N - 1);
        for (let k = 0; k < G; k++) for (let l = 0; l < G; l++) V[k][l] += f * (risk[k] / N) * ((k === l ? 1 : 0) - risk[l] / N);
      }
    }
    km *= (N - d) / N;
    for (let k = 0; k < G; k++) risk[k] -= dk[k] + ck[k];
    N -= j - i;
    i = j;
  }
  const use = [];
  for (let k = 0; k < G; k++) if (ex[k] > 0) use.push(k);
  let chisq = 0;
  const df = use.length - 1;
  if (df >= 1) {
    const sub = use.slice(1), u = sub.map(k => obs[k] - ex[k]), Vs = sub.map(k => sub.map(l => V[k][l]));
    const sol = Num.mat.solve(Vs, u);
    chisq = sol ? sol.reduce((s, v, i) => s + v * u[i], 0) : NaN;
  }
  return { rho, chisq, df, p: df >= 1 ? Num.pchisq(chisq, df, true) : NaN, obs, exp: ex, var: V, levels: lv, n };
};

/* ---------------- accelerated failure time models ----------------
   For each distribution, the log density g and log survivor function G of W,
   with their first and second derivatives.
     extreme value: g = w − eʷ, G = −eʷ                 (Weibull, exponential)
     normal:        g = −w²/2 − log√2π, G = log Φ(−w); G' = −h, G'' = −h(h − w),
                    h = φ(w)/Φ(−w)                       (lognormal)
     logistic:      g = −|w| − 2·log(1 + e^−|w|), g' = 1 − 2F, g'' = −2F(1 − F),
                    G = −log(1 + eʷ), G' = −F, G'' = −F(1 − F)   (log-logistic) */
function logPhiUpper(w) {
  if (w < 5) return log(Num.pnorm(w, true));
  /* asymptotic Mills ratio beyond 5, where the upper tail loses relative digits */
  const r = 1 / (w * w);
  return -0.5 * w * w - log(w) - LN_SQRT_2PI + log1p(r * (-1 + r * (3 + r * (-15 + r * 105))));
}
const plogis = w => (w >= 0 ? 1 / (1 + exp(-w)) : exp(w) / (1 + exp(w)));
const DIST = {
  extreme: {
    ev: w => { const e = exp(w); return [w - e, 1 - e, -e]; },
    cs: w => { const e = exp(w); return [-e, -e, -e]; },
    q: p => log(-log1p(-p)),
    S: w => exp(-exp(w)),
  },
  normal: {
    ev: w => [-0.5 * w * w - LN_SQRT_2PI, -w, -1],
    cs: w => {
      const lS = logPhiUpper(w), h = exp(-0.5 * w * w - LN_SQRT_2PI - lS);
      return [lS, -h, -h * (h - w)];
    },
    q: p => Num.qnorm(p),
    S: w => Num.pnorm(w, true),
  },
  logistic: {
    ev: w => { const F = plogis(w), a = abs(w); return [-a - 2 * log1p(exp(-a)), 1 - 2 * F, -2 * F * (1 - F)]; },
    cs: w => { const F = plogis(w), lS = w > 0 ? -w - log1p(exp(-w)) : -log1p(exp(w)); return [lS, -F, -F * (1 - F)]; },
    q: p => log(p / (1 - p)),
    S: w => 1 - plogis(w),
  },
};
const DISTS = { weibull: 'extreme', exponential: 'extreme', lognormal: 'normal', loglogistic: 'logistic' };

/* log-likelihood on the time scale (with the Jacobian −Σ_events log t), its
   gradient and Hessian in θ = (β, log σ); z = (log t − x'β)/σ:
     ∂ℓ/∂β = −ψ'(z)·x/σ,  ∂ℓ/∂τ = −z·ψ'(z) − δ,
     ∂²ℓ/∂β∂β' = ψ''·xx'/σ²,  ∂²ℓ/∂β∂τ = (ψ' + zψ'')·x/σ,  ∂²ℓ/∂τ² = zψ' + z²ψ''
   (ψ = g for events, G for censored; δ the event indicator; τ = log σ). */
function aftLik(X, y, d, D, fixScale) {
  const n = y.length, p = X[0].length, k = fixScale ? p : p + 1;
  return function (th, deriv) {
    const sig = fixScale ? 1 : exp(th[p]);
    if (!(sig > 0) || !isFinite(sig)) return { ll: -Infinity };
    let ll = 0;
    const gr = deriv ? new Array(k).fill(0) : null, H = deriv ? Array.from({ length: k }, () => new Array(k).fill(0)) : null;
    for (let i = 0; i < n; i++) {
      let eta = 0;
      for (let j = 0; j < p; j++) eta += X[i][j] * th[j];
      const z = (y[i] - eta) / sig;
      const r = d[i] ? D.ev(z) : D.cs(z);
      ll += r[0] - (d[i] ? log(sig) + y[i] : 0);
      if (!deriv) continue;
      const a = r[1], b = r[2], x = X[i];
      for (let j = 0; j < p; j++) {
        gr[j] += -a * x[j] / sig;
        for (let l = 0; l <= j; l++) H[j][l] += b * x[j] * x[l] / (sig * sig);
      }
      if (!fixScale) {
        gr[p] += -z * a - d[i];
        for (let j = 0; j < p; j++) H[p][j] += (a + z * b) * x[j] / sig;
        H[p][p] += z * a + z * z * b;
      }
    }
    if (H) for (let j = 0; j < k; j++) for (let l = j + 1; l < k; l++) H[j][l] = H[l][j];
    return { ll: isFinite(ll) ? ll : -Infinity, g: gr, H };
  };
}
/* Newton–Raphson with step halving; when −H is not positive definite, a
   Levenberg-type ridge is added until it is (always an ascent direction) */
function newton(f, th0, maxIt) {
  let th = th0.slice(), cur = f(th, true), it = 0, conv = false;
  if (!isFinite(cur.ll)) return { th, ll: cur.ll, converged: false, iter: 0 };
  const k = th.length;
  for (; it < (maxIt || 200); it++) {
    const A = cur.H.map(r => r.map(v => -v));
    let step = null, ridge = 0;
    for (let tries = 0; tries < 30; tries++) {
      const B = A.map((r, i) => r.map((v, j) => (i === j ? v + ridge * max(abs(v), 1) : v)));
      if (Num.mat.chol(B)) { step = Num.mat.solve(B, cur.g); if (step) break; }
      ridge = ridge ? ridge * 10 : 1e-6;
    }
    if (!step) break;
    let lam = 1, next = null;
    for (let h = 0; h < 60; h++) {
      const cand = th.map((v, j) => v + lam * step[j]);
      const r = f(cand, true);
      if (isFinite(r.ll) && r.ll >= cur.ll - 1e-12 * abs(cur.ll)) { next = { th: cand, r }; break; }
      lam /= 2;
    }
    if (!next) { conv = max(...cur.g.map(abs)) < 1e-6; break; }
    const dll = next.r.ll - cur.ll, dmax = max(...step.map((s, j) => abs(lam * s) / max(1, abs(th[j]))));
    th = next.th; cur = next.r;
    if (dmax < 1e-11 || (abs(dll) <= 1e-15 * max(1, abs(cur.ll)) && dmax < 1e-8)) { conv = true; it++; break; }
  }
  /* a final Newton step from the end point, so that the estimates sit at the
     zero of the score to rounding */
  if (conv) {
    const A = cur.H.map(r => r.map(v => -v)), s = Num.mat.chol(A) ? Num.mat.solve(A, cur.g) : null;
    if (s) { const c = th.map((v, j) => v + s[j]), r = f(c, true); if (isFinite(r.ll) && r.ll >= cur.ll - 1e-10 * abs(cur.ll)) { th = c; cur = r; } }
  }
  return { th, ll: cur.ll, g: cur.g, H: cur.H, converged: conv, iter: it };
}

/* design: intercept, treatment contrasts of the group, numeric covariates */
function design(n, idx, o, lv) {
  const X = idx.map(() => [1]), names = ['(Intercept)'];
  if (lv) {
    lv.slice(1).forEach(L => { names.push(String(L)); });
    idx.forEach((i, r) => { lv.slice(1).forEach(L => X[r].push(String(o.group[i]) === String(L) ? 1 : 0)); });
  }
  const cols = covCols(o);
  cols.forEach((c, j) => { names.push(o.xNames && o.xNames[j] != null ? String(o.xNames[j]) : 'x' + (cols.length > 1 ? j + 1 : '')); idx.forEach((i, r) => X[r].push(+c[i])); });
  return { X, names };
}
function covCols(o) {
  if (!o.x) return [];
  return Array.isArray(o.x[0]) ? o.x : [o.x];
}

/* A level of the group with no events has no finite maximum-likelihood
   effect: the likelihood keeps increasing as its location goes to +∞, where
   its records contribute log S = 0 (monotone likelihood; Bryson & Johnson
   1981, J. Am. Statist. Assoc. 76:271–275). The limit is the fit without
   those records, so they are left out, their coefficient is reported as NaN
   (not estimable) and the other estimates and the log-likelihood are those
   of the limit. If the first level is one of them, the first level with
   events becomes the reference. */
Surv.reg = function (time, status, o) {
  o = o || {};
  const distName = o.dist || 'weibull', conf = o.conf || 0.95, D = DIST[DISTS[distName]];
  if (!D) throw new Error('Surv.reg: unknown distribution ' + distName);
  const fix = distName === 'exponential', notes = [];
  let keep = clean(time, status, null, true);
  if (o.group) keep = keep.filter(i => o.group[i] != null && o.group[i] !== '');
  covCols(o).forEach(c => { keep = keep.filter(i => isNum(+c[i])); });
  if (keep.length < time.length) notes.push(note('Se omitieron registros con tiempo ≤ 0, estado o covariable no válidos.', 'Records with time ≤ 0 or an invalid status or covariate were omitted.'));
  const lvAll = o.group ? levelsOf(keep.map(i => o.group[i]), o.levels) : null;
  let lv = lvAll, dropped = [];
  if (lvAll) {
    const ev = {};
    lvAll.forEach(L => { ev[L] = 0; });
    keep.forEach(i => { const L = String(o.group[i]); if (L in ev) ev[L] += stat01(status[i]); });
    dropped = lvAll.filter(L => ev[L] === 0);
    if (dropped.length && dropped.length < lvAll.length) {
      lv = lvAll.filter(L => !dropped.includes(L));
      keep = keep.filter(i => !dropped.includes(String(o.group[i])));
      notes.push(note('Sin eventos en ' + dropped.join(', ') + ': su efecto no es estimable (la verosimilitud crece sin límite); esos registros quedan fuera del ajuste.',
        'No events in ' + dropped.join(', ') + ': the effect is not estimable (the likelihood increases without bound); those records are left out of the fit.'));
      if (dropped.includes(lvAll[0])) notes.push(note('El nivel de referencia pasa a ser ' + lv[0] + '.', 'The reference level becomes ' + lv[0] + '.'));
    } else dropped = [];
  }
  const { X, names: fitNames } = design(keep.length, keep, o, lv);
  const y = keep.map(i => log(+time[i])), d = keep.map(i => stat01(status[i])), n = y.length, p = X[0] ? X[0].length : 1;
  const events = d.reduce((s, v) => s + v, 0);
  /* the reported terms: every level but the reference (NaN where not
     estimable), then the covariates; pos[j] = column of term j in the fit */
  let names = fitNames, pos = fitNames.map((_, j) => j);
  if (lvAll) {
    const others = lvAll.filter(L => L !== lv[0]), nc = fitNames.length - lv.length;
    names = ['(Intercept)'].concat(others, fitNames.slice(lv.length));
    pos = [0].concat(others.map(L => { const j = lv.indexOf(L); return j > 0 ? j : -1; }), Array.from({ length: nc }, (_, j) => lv.length + j));
  }
  const base = { dist: distName, n, events, conf, names, levels: lvAll, reference: lv ? lv[0] : null, excluded: dropped, notes };
  const nanOut = () => Object.assign(base, {
    coef: names.map(() => NaN), se: names.map(() => NaN), seAll: names.map(() => NaN), z: [], p: [], scale: NaN, logScaleSE: NaN, shape: NaN,
    loglik: NaN, df: NaN, aic: NaN, vcov: [], converged: false, iter: 0, timeRatio: [],
    quantile: (pp) => [].concat(pp).map(q => ({ p: q, est: NaN, se: NaN, lo: NaN, hi: NaN, logEst: NaN, logSE: NaN })), surv: t => [].concat(t).map(() => NaN),
  });
  if (!events || n < p + (fix ? 0 : 1)) {
    notes.push(note('No hay eventos suficientes para estimar el modelo.', 'There are not enough events to fit the model.'));
    return nanOut();
  }
  const f = aftLik(X, y, d, D, fix);
  /* start: least squares of log t on the design (censored times as if
     observed), σ from the residuals; the intercept shifted by −σ·w_½ so that it
     is the location of W rather than its median */
  const L = Num.lm(X, y);
  const b0 = L.coef.map(v => (isNum(v) ? v : 0));
  const s0 = max(isNum(L.sigma) && L.sigma > 1e-3 ? L.sigma : 1, 0.05);
  const starts = [];
  if (fix) starts.push(b0.slice());
  else {
    const st = b0.slice(); st[0] -= s0 * D.q(0.5); starts.push(st.concat([log(s0)]));
    starts.push(b0.concat([0]));
  }
  let best = null;
  for (const s of starts) {
    const r = newton(f, s, 300);
    if (!best || (r.converged && !best.converged) || (r.converged === best.converged && r.ll > best.ll)) best = r;
    if (r.converged) break;
  }
  if (!best.converged) {
    /* fallback: simplex on −ℓ, then Newton again */
    const nm = Num.nelderMead(th => -f(th, false).ll, best.th, { maxIter: 20000 });
    const r = newton(f, nm.x, 300);
    if (r.ll >= best.ll) best = r;
  }
  if (!best.converged) notes.push(note('La máxima verosimilitud no convergió; los resultados son aproximados.', 'Maximum likelihood did not converge; results are approximate.'));
  const th = best.th, k = th.length;
  const info = best.H.map(r => r.map(v => -v)), V = Num.mat.inv(info) || info.map(r => r.map(() => NaN));
  const se = th.map((_, j) => sqrt(V[j][j]));
  const coef = th.slice(0, p), sc = fix ? 1 : exp(th[p]);
  if (coef.some((b, j) => !(se[j] < 1e6 * max(1, abs(b))))) {
    notes.push(note('Algún efecto tiene un error estándar enorme: posible verosimilitud monótona (separación completa); no lo interprete.',
      'Some effect has a huge standard error: possibly a monotone likelihood (complete separation); do not interpret it.'));
  }
  const zq = Num.qnorm(1 - (1 - conf) / 2);
  const zval = th.map((v, j) => v / se[j]), pval = zval.map(z => 2 * Num.pnorm(-abs(z)));
  /* parameters counted for AIC: every term of the model, the non-estimable
     ones included (their maximum is at infinity), plus σ */
  const dfm = names.length + (fix ? 0 : 1);
  /* the full-length vectors (terms, then log σ) with NaN for the terms left out */
  const posAll = pos.concat(fix ? [] : [p]);
  const full = v => posAll.map(j => (j < 0 ? NaN : v[j]));
  const Vfull = posAll.map(i => posAll.map(j => (i < 0 || j < 0 ? NaN : V[i][j])));
  /* the linear predictor at a level of the group and/or covariate values */
  const xrow = at => {
    const r = [1];
    let lvl = null, xs = [];
    if (at != null && typeof at === 'object' && !Array.isArray(at)) { lvl = at.group != null ? at.group : at.level; xs = at.x == null ? [] : [].concat(at.x); }
    else if (lv && at != null && !Array.isArray(at)) lvl = at;
    else if (at != null) xs = [].concat(at);
    if (lv) {
      const L0 = lvl == null ? lv[0] : String(lvl);
      if (lv.indexOf(L0) < 0) return null;
      lv.slice(1).forEach(Lk => r.push(Lk === L0 ? 1 : 0));
    }
    const nc = p - r.length;
    for (let j = 0; j < nc; j++) r.push(xs[j] == null ? 0 : +xs[j]);
    return r;
  };
  const quantile = (pp, at) => {
    const one = q => {
      const x = xrow(at);
      if (!x || !(q > 0 && q < 1)) return { p: q, est: NaN, se: NaN, lo: NaN, hi: NaN, logEst: NaN, logSE: NaN };
      const wq = D.q(q);
      let eta = 0;
      for (let j = 0; j < p; j++) eta += x[j] * coef[j];
      const m = eta + sc * wq, gv = x.concat(fix ? [] : [sc * wq]);
      let v = 0;
      for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) v += gv[a] * V[a][b] * gv[b];
      const sl = sqrt(v);
      return { p: q, est: exp(m), se: exp(m) * sl, lo: exp(m - zq * sl), hi: exp(m + zq * sl), logEst: m, logSE: sl };
    };
    return Array.isArray(pp) ? pp.map(one) : one(pp);
  };
  const surv = (t, at) => {
    const one = tt => {
      const x = xrow(at);
      if (!x || !(tt > 0)) return x && tt === 0 ? 1 : NaN;
      let eta = 0;
      for (let j = 0; j < p; j++) eta += x[j] * coef[j];
      return D.S((log(tt) - eta) / sc);
    };
    return Array.isArray(t) ? t.map(one) : one(t);
  };
  const coefF = full(coef.concat(fix ? [] : [th[p]])).slice(0, names.length), seF = full(se);
  /* time ratios (acceleration factors) exp(β) of the non-intercept terms */
  const timeRatio = names.slice(1).map((nm, j) => {
    const b = coefF[j + 1], s = seF[j + 1];
    return { name: nm, est: exp(b), lo: exp(b - zq * s), hi: exp(b + zq * s) };
  });
  return Object.assign(base, {
    coef: coefF, se: seF.slice(0, names.length), z: full(zval), p: full(pval), scale: sc, logScale: fix ? 0 : th[p], logScaleSE: fix ? NaN : se[p],
    shape: distName === 'weibull' || fix ? 1 / sc : NaN, loglik: best.ll, df: dfm, aic: -2 * best.ll + 2 * dfm,
    vcov: Vfull, converged: best.converged, iter: best.iter, seAll: seF, timeRatio, quantile, surv,
    median: at => quantile(0.5, at),
  });
};

/* ---------------- choosing the distribution ----------------
   AIC = −2ℓ + 2·(number of parameters), ΔAIC and Akaike weights. */
Surv.compare = function (time, status, group, o) {
  o = Object.assign({}, o || {});
  if (group) o.group = group;
  const dists = o.dists || ['weibull', 'lognormal', 'loglogistic', 'exponential'];
  const fits = dists.map(dn => Surv.reg(time, status, Object.assign({}, o, { dist: dn })));
  const aic = fits.map(f => f.aic), ok = aic.filter(isNum), m = ok.length ? min(...ok) : NaN;
  const delta = aic.map(a => (isNum(a) ? a - m : NaN)), e = delta.map(x => (isNum(x) ? exp(-x / 2) : 0)), s = e.reduce((a, b) => a + b, 0);
  const rows = dists.map((dn, i) => ({ dist: dn, loglik: fits[i].loglik, df: fits[i].df, aic: aic[i], deltaAIC: delta[i], weight: s > 0 ? e[i] / s : NaN, converged: fits[i].converged }));
  return { rows, fits, best: ok.length ? dists[aic.indexOf(m)] : null };
};

g.Surv = Surv;
return Surv;
}
if (typeof window !== 'undefined') SurvCore(window);
