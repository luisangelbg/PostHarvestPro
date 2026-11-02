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

/* PostHarvestPro — postharvest losses along the value chain and mechanical damage.

   · The chain: what enters each stage, what is lost there (as a percentage of
     what entered, or in kg), what leaves, and what the loss is worth at the
     price of that stage; accumulated losses, critical points (Pareto) and the
     what-if of reducing the loss of one stage. The quantity loss follows the
     load-tracking logic of the FAO Food Loss Index (FAO 2019, The State of Food
     and Agriculture: Moving forward on food loss and waste reduction) and of
     the commodity-system assessment of La Gra, Kitinoja and Alpuche 2016
     (Postharvest Education Foundation, White Paper 16-01).
   · The Sankey layout of the chain (main flow and one branch per loss).
   · Mechanical damage against drop height or energy: linear, quadratic,
     power and exponential curves by least squares, the bruising threshold,
     bruise susceptibility (volume per joule absorbed; Bajema and Hyde 1998,
     Trans. ASAE 41:1399–1405) and, for incidence (bruised or not), logistic
     regression by iteratively reweighted least squares with the height that
     bruises half the fruit and its Fieller interval (Finney 1971, Probit
     Analysis, 3rd ed.). */
function LossCore(g) {
'use strict';
const Num = g.Num;
const L = {};

/* ---------------- the chain ----------------
   stages: [{name, pct?, kg?, price?}] in order; initial: kg entering the first
   stage. A stage with `kg` uses that loss; otherwise `pct` of its input. */
L.chain = function (stages, initial) {
  let input = initial;
  const rows = stages.map((s, i) => {
    const lost = s.kg != null && s.kg !== '' && isFinite(s.kg) ? Math.min(+s.kg, input) : input * (+s.pct || 0) / 100;
    const out = input - lost;
    const price = +s.price || 0;
    const r = { i, name: s.name, input, lost, output: out, pct: input > 0 ? 100 * lost / input : 0, price, value: lost * price, pctOfInitial: 100 * lost / initial };
    input = out;
    return r;
  });
  const lost = rows.reduce((s, r) => s + r.lost, 0), value = rows.reduce((s, r) => s + r.value, 0);
  let acc = 0;
  rows.forEach(r => { acc += r.lost; r.cumPct = 100 * acc / initial; });
  /* Pareto: stages by kg and by value, with their cumulative share */
  const pareto = key => {
    const tot = rows.reduce((s, r) => s + r[key], 0);
    let c = 0;
    return rows.slice().sort((a, b) => b[key] - a[key]).map(r => { c += r[key]; return { i: r.i, name: r.name, v: r[key], share: tot ? 100 * r[key] / tot : 0, cum: tot ? 100 * c / tot : 0 }; });
  };
  const byKg = pareto('lost'), byValue = pareto('value');
  /* critical points: the fewest stages that add up to 80 % of the loss */
  const vital = list => { const out = []; for (const r of list) { out.push(r.i); if (r.cum >= 80) break; } return out; };
  const finalPrice = rows.length ? rows[rows.length - 1].price : 0;
  return {
    rows, initial, lost, value, delivered: input,
    lossIndex: 100 * lost / initial,
    /* the loss valued at the final price: what the market would have paid */
    valueAtMarket: lost * finalPrice,
    byKg, byValue, criticalKg: vital(byKg), criticalValue: vital(byValue),
  };
};
/* what if the loss of stage k fell by `reduce` % (relative)? */
L.simulate = function (stages, initial, k, reduce) {
  const base = L.chain(stages, initial);
  const s2 = stages.map((s, i) => {
    if (i !== k) return s;
    const c = Object.assign({}, s);
    if (c.kg != null && c.kg !== '' && isFinite(c.kg)) c.kg = +c.kg * (1 - reduce / 100); else c.pct = (+c.pct || 0) * (1 - reduce / 100);
    return c;
  });
  const alt = L.chain(s2, initial);
  const finalPrice = base.rows.length ? base.rows[base.rows.length - 1].price : 0;
  const gainKg = alt.delivered - base.delivered;
  return { base, alt, gainKg, gainValue: gainKg * finalPrice, savedLossValue: base.value - alt.value, newIndex: alt.lossIndex };
};
/* the same reduction tried on every stage: where a point of effort pays most */
L.sensitivity = (stages, initial, reduce) => stages.map((s, k) => {
  const r = L.simulate(stages, initial, k, reduce);
  return { i: k, name: s.name, gainKg: r.gainKg, gainValue: r.gainValue, newIndex: r.newIndex };
});

/* ---------------- Sankey layout ----------------
   Columns: one per stage boundary; the main band narrows as losses branch
   off downwards. Returns rectangles and ribbons in a W × H box (units of
   the drawing), scaled so the initial flow fills `band` of the height. */
L.sankey = function (ch, W, H, o) {
  o = o || {};
  const n = ch.rows.length, padL = o.padL || 20, padR = o.padR || 20, top = o.top || 30;
  const band = (o.band || 0.42) * H, k = band / ch.initial, nodeW = o.nodeW || 14;
  const colX = i => padL + i * (W - padL - padR - nodeW) / n;
  const nodes = [], links = [], losses = [];
  for (let i = 0; i <= n; i++) {
    const v = i === 0 ? ch.initial : ch.rows[i - 1].output;
    nodes.push({ i, x: colX(i), y: top, w: nodeW, h: v * k, v, name: i === 0 ? null : ch.rows[i - 1].name });
  }
  for (let i = 0; i < n; i++) {
    const r = ch.rows[i], a = nodes[i], b = nodes[i + 1];
    links.push({ from: i, to: i + 1, v: r.output, x0: a.x + nodeW, x1: b.x, y0: a.y, y1: b.y, h: r.output * k });
    /* the loss leaves from the bottom of node i and drops to a sink below */
    const sinkY = top + band + 36 + (o.sinkGap || 0);
    losses.push({ stage: i, v: r.lost, value: r.value, x0: a.x + nodeW, y0: a.y + r.output * k, h: r.lost * k, x1: (a.x + b.x) / 2 + nodeW / 2, y1: sinkY, name: r.name, pct: r.pct });
  }
  return { nodes, links, losses, k, band, top };
};

/* ---------------- mechanical damage ----------------
   x: drop height (cm) or energy (J); y: bruise size (area mm², volume mm³,
   depth mm…). Models by least squares on the original scale except the
   power and exponential curves, fitted on the log scale (their usual form
   in the impact literature). */
L.damageModels = function (x, y) {
  const pts = x.map((v, i) => [+v, +y[i]]).filter(p => isFinite(p[0]) && isFinite(p[1]));
  const X = pts.map(p => p[0]), Y = pts.map(p => p[1]), n = pts.length;
  const out = [];
  const add = (id, fit, pred, k, extra) => {
    const rss = Y.reduce((s, v, i) => s + (v - pred(X[i])) ** 2, 0);
    const ybar = Num.mean(Y), tss = Y.reduce((s, v) => s + (v - ybar) ** 2, 0);
    const aic = n * (Math.log(2 * Math.PI) + 1 + Math.log(rss / n)) + 2 * (k + 1);
    out.push(Object.assign({ id, coef: fit.coef, se: fit.se, p: fit.p, rss, r2: 1 - rss / tss, aic, predict: pred, k, n }, extra || {}));
  };
  if (n >= 3) {
    const f1 = Num.lm(X.map(v => [1, v]), Y);
    add('linear', f1, v => f1.coef[0] + f1.coef[1] * v, 2, { threshold: f1.coef[1] > 0 ? -f1.coef[0] / f1.coef[1] : NaN });
  }
  if (n >= 4) {
    const f2 = Num.lm(X.map(v => [1, v, v * v]), Y);
    add('quadratic', f2, v => f2.coef[0] + f2.coef[1] * v + f2.coef[2] * v * v, 3);
  }
  const pos = pts.filter(p => p[0] > 0 && p[1] > 0);
  if (pos.length >= 3) {
    const fp = Num.lm(pos.map(p => [1, Math.log(p[0])]), pos.map(p => Math.log(p[1])));
    add('power', fp, v => Math.exp(fp.coef[0]) * Math.pow(v, fp.coef[1]), 2, { logScale: true, nUsed: pos.length });
    const fe = Num.lm(pos.map(p => [1, p[0]]), pos.map(p => Math.log(p[1])));
    add('exponential', fe, v => Math.exp(fe.coef[0] + fe.coef[1] * v), 2, { logScale: true, nUsed: pos.length });
  }
  return out;
};
/* impact energy of a drop: E = m·g·h (m in kg, h in m) */
L.dropEnergy = (massKg, heightCm) => massKg * 9.80665 * heightCm / 100;
/* bruise susceptibility: bruise volume (mm³) per joule */
L.susceptibility = (volMm3, energyJ) => volMm3 / energyJ;
/* bruise volume of a spherical cap (Mohsenin 1986): V = πh(3w²/4 + h²)/6 with
   w the bruise width and h its depth (mm) */
L.capVolume = (w, h) => Math.PI * h * (3 * w * w / 4 + h * h) / 6;

/* logistic regression of a 0/1 (or k-of-n) response on one predictor, by
   IRLS. y: successes, m: trials (1 for single fruit). Returns the
   coefficients, their covariance, the deviance, the dose for probability p
   with its Fieller interval. */
L.logistic = function (x, y, m, conf) {
  m = m || x.map(() => 1);
  conf = conf || 0.95;
  let b0 = 0, b1 = 0, it = 0, dev = Infinity, conv = false, V = null;
  for (; it < 100; it++) {
    const XtWX = [[0, 0], [0, 0]], XtWz = [0, 0];
    x.forEach((xi, i) => {
      const eta = b0 + b1 * xi, mu = 1 / (1 + Math.exp(-eta));
      const w = m[i] * mu * (1 - mu);
      const z = eta + (y[i] / m[i] - mu) / Math.max(mu * (1 - mu), 1e-12);
      XtWX[0][0] += w; XtWX[0][1] += w * xi; XtWX[1][1] += w * xi * xi;
      XtWz[0] += w * z; XtWz[1] += w * xi * z;
    });
    XtWX[1][0] = XtWX[0][1];
    V = Num.mat.inv(XtWX);
    if (!V) break;
    const nb = Num.mat.mulv(V, XtWz);
    let d = 0;
    x.forEach((xi, i) => {
      const mu = 1 / (1 + Math.exp(-(nb[0] + nb[1] * xi)));
      const yi = y[i], mi = m[i];
      if (yi > 0) d += 2 * yi * Math.log(yi / (mi * mu));
      if (mi - yi > 0) d += 2 * (mi - yi) * Math.log((mi - yi) / (mi * (1 - mu)));
    });
    b0 = nb[0]; b1 = nb[1];
    if (Math.abs(d - dev) / (Math.abs(d) + 0.1) < 1e-10) { dev = d; conv = true; break; }
    dev = d;
  }
  /* the covariance at the final estimates (the loop's last one belongs to the step before) */
  {
    const I = [[0, 0], [0, 0]];
    x.forEach((xi, i) => { const mu = 1 / (1 + Math.exp(-(b0 + b1 * xi))), w = m[i] * mu * (1 - mu); I[0][0] += w; I[0][1] += w * xi; I[1][1] += w * xi * xi; });
    I[1][0] = I[0][1];
    V = Num.mat.inv(I);
  }
  const se = [Math.sqrt(V[0][0]), Math.sqrt(V[1][1])];
  const z = Num.qnorm(1 - (1 - conf) / 2);
  /* x at probability p: (logit p − b0)/b1; Fieller interval on the ratio */
  const dose = function (p) {
    const lp = Math.log(p / (1 - p)), est = (lp - b0) / b1;
    const v00 = V[0][0], v11 = V[1][1], v01 = V[0][1];
    const gg = z * z * v11 / (b1 * b1);
    let lo = NaN, hi = NaN;
    if (gg < 1) {
      const a = est + gg / (1 - gg) * (est + v01 / v11);
      const half = z / (Math.abs(b1) * (1 - gg)) * Math.sqrt(v00 + 2 * est * v01 + est * est * v11 - gg * (v00 - v01 * v01 / v11));
      lo = Math.min(a - half, a + half); hi = Math.max(a - half, a + half);
    }
    return { p, est, lo, hi };
  };
  return { coef: [b0, b1], se, z: [b0 / se[0], b1 / se[1]], p: [2 * Num.pnorm(-Math.abs(b0 / se[0])), 2 * Num.pnorm(-Math.abs(b1 / se[1]))], vcov: V, deviance: dev, iter: it, converged: conv, dose, predict: v => 1 / (1 + Math.exp(-(b0 + b1 * v))) };
};

g.Loss = L;
return L;
}
if (typeof window !== 'undefined') LossCore(window);
