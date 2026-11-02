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

/* PostHarvestPro — quality and maturity indices.

   Soluble solids, titratable acidity (from the titration itself, for the acid
   that dominates each crop), the SSC/TA ratio and the BrimA index, pH,
   firmness in any unit, accumulated weight loss and its daily rate, moisture
   and dry matter, scales of ripeness and damage with their weighted index
   and the share of marketable fruit, and grading by size.

   Sources: AOAC 942.15 (titratable acidity of fruit products); Kader 2002,
   Postharvest Technology of Horticultural Crops, 3rd ed., UC ANR 3311;
   Jordan, Seelye and McGlone 2001, Food Technol. 55(4):36–44 (BrimA);
   McKinney 1923, J. Agric. Res. 26:195–218 (disease index); Townsend and
   Heuberger 1943, Plant Dis. Rep. 27:340–343 (weighted severity). */
function QualityCore(g) {
'use strict';
const Num = g.Num;
const Q = {};

/* ---------------- titratable acidity ----------------
   %acid = V(NaOH, mL) · N(NaOH, meq/mL) · meq weight of the acid (g/meq)
           · (total volume / aliquot) · 100 / sample (g or mL).
   Milliequivalent weights: the grams of acid neutralised by one meq of base. */
Q.ACIDS = {
  citric:   { meq: 0.064,  es: 'cítrico', en: 'citric', crops: ['cítricos, mango, papaya, tomate, fresa, piña', 'citrus, mango, papaya, tomato, strawberry, pineapple'] },
  malic:    { meq: 0.067,  es: 'málico', en: 'malic', crops: ['manzana, pera, durazno, ciruela, plátano', 'apple, pear, peach, plum, banana'] },
  tartaric: { meq: 0.075,  es: 'tartárico', en: 'tartaric', crops: ['uva, tamarindo', 'grape, tamarind'] },
  oxalic:   { meq: 0.045,  es: 'oxálico', en: 'oxalic', crops: ['espinaca, carambola', 'spinach, star fruit'] },
  lactic:   { meq: 0.090,  es: 'láctico', en: 'lactic', crops: ['productos fermentados', 'fermented products'] },
  acetic:   { meq: 0.060,  es: 'acético', en: 'acetic', crops: ['vinagres, encurtidos', 'vinegars, pickles'] },
};
Q.titratableAcidity = function (o) {
  const meq = o.meq != null ? o.meq : (Q.ACIDS[o.acid || 'citric'] || Q.ACIDS.citric).meq;
  const dil = o.totalVolume && o.aliquot ? o.totalVolume / o.aliquot : 1;
  return o.volume * o.normality * meq * dil * 100 / o.sample;
};
/* the same acidity expressed as another acid (only the meq weight changes) */
Q.convertAcid = (pct, from, to) => pct * Q.ACIDS[to].meq / Q.ACIDS[from].meq;

/* ---------------- maturity ----------------
   SSC/TA (the classical maturity index) and BrimA = SSC − k·TA, with k = 2
   by default: it weighs acidity as the tongue does (Jordan et al. 2001). */
Q.ratio = (ssc, ta) => (ta > 0 ? ssc / ta : NaN);
Q.brimA = (ssc, ta, k) => ssc - (k == null ? 2 : k) * ta;

/* ---------------- firmness ----------------
   Force units and, with the plunger diameter, pressure. */
Q.FORCE = { N: 1, kgf: 9.80665, lbf: 4.4482216152605, gf: 0.00980665 };
Q.convertForce = (v, from, to) => v * Q.FORCE[from] / Q.FORCE[to];
/* force (N) on a plunger of diameter d (mm) → pressure in kPa (N/mm² × 1000) */
Q.pressure = (forceN, diamMm) => forceN / (Math.PI * diamMm * diamMm / 4) * 1000;

/* ---------------- weight loss ----------------
   Accumulated loss at each time (% of the initial weight) and its rate by
   least squares through the origin when asked (loss is zero at time 0) or
   with an intercept. */
Q.weightLoss = (w0, wt) => 100 * (w0 - wt) / w0;
Q.weightLossSeries = function (t, w, o) {
  o = o || {};
  const w0 = w[0];
  const loss = w.map(v => Q.weightLoss(w0, v));
  let rate, se, r2, intercept = 0;
  if (o.origin !== false) {
    let sxy = 0, sxx = 0;
    t.forEach((v, i) => { sxy += v * loss[i]; sxx += v * v; });
    rate = sxy / sxx;
    let rss = 0, tss = 0;
    loss.forEach((v, i) => { rss += (v - rate * t[i]) ** 2; tss += v * v; });
    se = Math.sqrt(rss / (t.length - 1) / sxx);
    r2 = 1 - rss / tss;
  } else {
    const fit = Num.lm(t.map(v => [1, v]), loss);
    intercept = fit.coef[0]; rate = fit.coef[1]; se = fit.se[1]; r2 = fit.r2;
  }
  return { loss, rate, se, r2, intercept };
};

/* ---------------- moisture and dry matter ---------------- */
Q.moisture = function (fresh, dry) {
  return {
    wetBasis: 100 * (fresh - dry) / fresh,       /* g water / 100 g fresh */
    dryMatter: 100 * dry / fresh,
    dryBasis: 100 * (fresh - dry) / dry,         /* g water / 100 g dry matter */
  };
};
/* the same from the weighing of a dish: empty, with fresh sample, after drying */
Q.moistureFromDish = (tare, withFresh, withDry) => Q.moisture(withFresh - tare, withDry - tare);

/* ---------------- descriptive summary ---------------- */
Q.summary = function (v, conf) {
  const x = v.filter(a => a !== null && a !== '' && isFinite(a)).map(Number);
  const n = x.length;
  if (!n) return { n: 0 };
  const mean = Num.mean(x), sd = n > 1 ? Num.sd(x) : NaN, se = sd / Math.sqrt(n);
  const tq = n > 1 ? Num.qt(1 - (1 - (conf || 0.95)) / 2, n - 1) : NaN;
  return {
    n, mean, sd, se, cv: 100 * sd / Math.abs(mean), min: Math.min(...x), max: Math.max(...x), median: Num.median(x),
    q1: Num.quantile(x, 0.25), q3: Num.quantile(x, 0.75), lo: mean - tq * se, hi: mean + tq * se,
  };
};
/* summaries of several columns by the levels of a grouping column (keeps the order of appearance) */
Q.groupSummary = function (rows, groupKey, keys, conf) {
  const levels = [];
  rows.forEach(r => { const k = groupKey ? String(r[groupKey]) : '—'; if (!levels.includes(k)) levels.push(k); });
  return levels.map(lv => {
    const sub = groupKey ? rows.filter(r => String(r[groupKey]) === lv) : rows;
    const out = { group: lv, n: sub.length };
    keys.forEach(k => { out[k] = Q.summary(sub.map(r => r[k]), conf); });
    return out;
  });
};

/* ---------------- scales of ripeness and damage ----------------
   A scale is a list of classes {value, label}; the data, a count per class.
   Weighted index (McKinney 1923) = 100·Σ(value·count)/(N·value_max);
   mean grade = Σ(value·count)/N; incidence = % of units above the lowest
   class; marketable = % of units at or below the tolerance class. */
Q.scaleIndex = function (classes, counts, tolerance) {
  const N = counts.reduce((s, v) => s + (+v || 0), 0);
  const vals = classes.map(c => +c.value);
  const vmax = Math.max(...vals), vmin = Math.min(...vals);
  let sw = 0;
  counts.forEach((c, i) => { sw += vals[i] * (+c || 0); });
  const pct = counts.map(c => (N ? 100 * (+c || 0) / N : NaN));
  const tol = tolerance == null ? vmin : +tolerance;
  let ok = 0, affected = 0;
  counts.forEach((c, i) => { if (vals[i] <= tol) ok += +c || 0; if (vals[i] > vmin) affected += +c || 0; });
  return {
    N, pct,
    index: N && vmax > 0 ? 100 * sw / (N * vmax) : NaN,
    meanGrade: N ? sw / N : NaN,
    incidence: N ? 100 * affected / N : NaN,
    marketable: N ? 100 * ok / N : NaN,
  };
};
/* the same from one grade per fruit (raw observations) */
Q.scaleFromGrades = function (classes, grades, tolerance) {
  const counts = classes.map(c => grades.filter(gv => +gv === +c.value).length);
  return Object.assign({ counts }, Q.scaleIndex(classes, counts, tolerance));
};

/* ---------------- grading by size ----------------
   classes [{name, min, max}] on weight (g), diameter (mm) or any measure;
   each unit falls in the first class with min ≤ v < max (the last class
   includes its upper edge). Units outside every class are reported apart. */
Q.calibre = function (values, classes) {
  const x = values.filter(v => v !== null && v !== '' && isFinite(v)).map(Number);
  const counts = classes.map(() => 0);
  let out = 0;
  x.forEach(v => {
    const i = classes.findIndex((c, j) => v >= +c.min && (v < +c.max || (j === classes.length - 1 && v <= +c.max)));
    if (i >= 0) counts[i]++; else out++;
  });
  const N = x.length;
  return {
    N, counts, out,
    pct: counts.map(c => (N ? 100 * c / N : NaN)),
    mean: N ? Num.mean(x) : NaN, sd: N > 1 ? Num.sd(x) : NaN,
    /* no unit inside any class: no grade is the most frequent */
    mode: Math.max(0, ...counts) > 0 ? classes[counts.indexOf(Math.max(...counts))].name : null,
  };
};
/* classes for fruit sold by count per box: the count k of a box of B kg
   corresponds to fruit of about B/k kg; the class edges are the midpoints
   between neighbouring counts */
Q.countClasses = function (boxKg, counts) {
  const c = counts.slice().sort((a, b) => a - b);
  const w = c.map(k => boxKg * 1000 / k);
  return c.map((k, i) => ({
    name: String(k),
    min: i === c.length - 1 ? 0 : Math.round((w[i] + w[i + 1]) / 2),
    max: i === 0 ? Math.round(w[0] * 1.6) : Math.round((w[i] + w[i - 1]) / 2),
  }));
};

g.Quality = Q;
return Q;
}
if (typeof window !== 'undefined') QualityCore(window);
