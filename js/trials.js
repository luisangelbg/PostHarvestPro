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

/* PostHarvestPro — design and analysis of postharvest trials.

   · Treatment × storage time factorials in a completely randomised or a
     randomised complete block design (fruit sampled destructively at each
     time), with type I and type III sums of squares (sum-to-zero coding, so
     type III tests each effect averaged over the levels of the others).
   · Repeated measures on the same units over time as a split plot in time
     (Steel, Torrie and Dickey 1997, Principles and Procedures of Statistics,
     3rd ed., ch. 16): treatments against the units within treatments, time
     and the interaction against the residual, with the Greenhouse–Geisser
     (1959, Psychometrika 24:95–112) and Huynh–Feldt (1976, J. Educ. Stat.
     1:69–82; Lecoutre's 1991 correction) adjustments of the degrees of
     freedom, and Mauchly's (1940) test of sphericity.
   · Mean comparisons: Tukey–Kramer (studentized range), Fisher's LSD,
     Bonferroni and Dunnett against a control (many-to-one, unequal sizes by
     the one-factor correlation; Dunnett 1955), with compact letters by the
     insert-and-absorb algorithm (Piepho 2004, J. Comput. Graph. Stat.
     13:456–466); treatments within each time with the error of the design
     (in the split plot, the pooled error with Satterthwaite's 1946 degrees of
     freedom).
   · Regression of an attribute on time for each treatment and comparison of
     slopes (analysis of covariance: Snedecor and Cochran 1989, Statistical
     Methods, 8th ed., ch. 18).
   · A randomised field book (CRD or RCBD × sampling times) with the column
     names the suite's experimental-design app reads back. */
function TrialCore(g) {
'use strict';
const Num = g.Num;
const Tr = {};

/* ---------------- factors and model matrices ---------------- */
const levelsOf = (rows, key) => { const L = []; rows.forEach(r => { const v = String(r[key]); if (!L.includes(v)) L.push(v); }); return L; };
Tr.levelsOf = levelsOf;
/* sum-to-zero (deviation) coding: k − 1 columns */
function sumCols(levels, v) { const k = levels.length, j = levels.indexOf(v); return Array.from({ length: k - 1 }, (_, c) => (j === c ? 1 : j === k - 1 ? -1 : 0)); }
/* the columns of a term (a list of factor names) for one row: product of the codings */
function termCols(term, row, LV) {
  let cols = [1];
  term.forEach(f => {
    const c = sumCols(LV[f], String(row[f]));
    const next = [];
    cols.forEach(a => c.forEach(b => next.push(a * b)));
    cols = next;
  });
  return cols;
}
const termName = t => t.join(':');
/* residual sum of squares of a model made of the intercept and some terms */
function rssOf(rows, y, terms, LV) {
  const X = rows.map(r => { let x = [1]; terms.forEach(t => { x = x.concat(termCols(t, r, LV)); }); return x; });
  const f = Num.lm(X, y);
  return { rss: f.rss, rank: f.rank, fit: f };
}

/* ---------------- ANOVA of a factorial (CRD or RCBD) ----------------
   o: { y: key, factors: [keyA, keyB?], block?: key, type: 1|3 }
   Terms: block (if any), A, B, A:B. Sequential (type I) or each term last
   (type III, with the block always in the model). */
Tr.factorial = function (rows0, o) {
  const rows = rows0.filter(r => isFinite(r[o.y]) && r[o.y] !== '' && r[o.y] !== null && o.factors.every(f => r[f] != null && r[f] !== '') && (!o.block || (r[o.block] != null && r[o.block] !== '')));
  const y = rows.map(r => +r[o.y]);
  const LV = {};
  o.factors.forEach(f => { LV[f] = levelsOf(rows, f); });
  if (o.block) LV[o.block] = levelsOf(rows, o.block);
  const terms = [];
  if (o.block) terms.push([o.block]);
  o.factors.forEach(f => terms.push([f]));
  if (o.factors.length === 2 && o.interaction !== false) terms.push([o.factors[0], o.factors[1]]);
  const full = rssOf(rows, y, terms, LV);
  const dfe = rows.length - full.rank, mse = full.rss / dfe;
  const type = o.type || 3;
  const table = [];
  let prev = rssOf(rows, y, [], LV);
  terms.forEach((t, i) => {
    let ss, df;
    if (type === 1) {
      const cur = rssOf(rows, y, terms.slice(0, i + 1), LV);
      ss = prev.rss - cur.rss; df = cur.rank - prev.rank; prev = cur;
    } else {
      const red = rssOf(rows, y, terms.filter((_, j) => j !== i), LV);
      ss = red.rss - full.rss; df = full.rank - red.rank;
    }
    const ms = ss / df, F = ms / mse;
    table.push({ source: termName(t), term: t, df, ss, ms, F, p: Num.pf(F, df, dfe, true) });
  });
  table.push({ source: 'residual', df: dfe, ss: full.rss, ms: mse });
  const ybar = Num.mean(y), tss = y.reduce((s, v) => s + (v - ybar) ** 2, 0);
  table.push({ source: 'total', df: rows.length - 1, ss: tss });
  const cells = Tr.cellMeans(rows, o.y, o.factors);
  return { rows, y, LV, table, mse, dfe, n: rows.length, r2: 1 - full.rss / tss, cv: 100 * Math.sqrt(mse) / Math.abs(ybar), grand: ybar, cells, resid: full.fit.resid, fitted: full.fit.fitted, type, design: o.block ? 'rcbd' : 'crd', factors: o.factors, block: o.block || null };
};

/* means, standard deviations and errors of every cell (and of the margins) */
Tr.cellMeans = function (rows, y, factors) {
  const by = keys => {
    const map = new Map();
    rows.forEach(r => {
      const k = keys.map(f => String(r[f])).join('\u0001');
      if (!map.has(k)) map.set(k, { key: keys.map(f => String(r[f])), v: [] });
      map.get(k).v.push(+r[y]);
    });
    return [...map.values()].map(c => {
      const n = c.v.length, mean = Num.mean(c.v), sd = n > 1 ? Num.sd(c.v) : NaN;
      const out = { n, mean, sd, se: sd / Math.sqrt(n) };
      keys.forEach((f, i) => { out[f] = c.key[i]; });
      return out;
    });
  };
  const res = { cells: by(factors) };
  factors.forEach(f => { res[f] = by([f]); });
  return res;
};

/* ---------------- repeated measures: split plot in time ----------------
   o: { y, treatment, time, unit, block? }. Every unit must have one value at
   every time (the balanced case the classical analysis needs; incomplete
   units are dropped and reported). */
Tr.repeated = function (rows0, o) {
  const ok = rows0.filter(r => isFinite(r[o.y]) && r[o.y] !== '' && r[o.y] !== null);
  const times = levelsOf(ok, o.time);
  const uid = r => (o.block ? String(r[o.block]) + '\u0001' : '') + String(r[o.treatment]) + '\u0001' + String(r[o.unit]);
  const units = new Map();
  ok.forEach(r => { const k = uid(r); if (!units.has(k)) units.set(k, { trt: String(r[o.treatment]), block: o.block ? String(r[o.block]) : null, unit: String(r[o.unit]), v: {} }); units.get(k).v[String(r[o.time])] = +r[o.y]; });
  const complete = [...units.values()].filter(u => times.every(t => isFinite(u.v[t])));
  const dropped = units.size - complete.length;
  const rows = [];
  complete.forEach((u, i) => times.forEach(t => { const r = { _u: 'u' + i, _A: u.trt, _B: t, _y: u.v[t] }; if (o.block) r._K = u.block; rows.push(r); }));
  const y = rows.map(r => r._y);
  const LV = { _A: levelsOf(rows, '_A'), _B: times.slice(), _u: levelsOf(rows, '_u') };
  if (o.block) LV._K = levelsOf(rows, '_K');
  /* sequential sums of squares: block, A, units within A (and block), B, A:B */
  const seq = [];
  if (o.block) seq.push([['_K'], 'block']);
  seq.push([['_A'], 'treatment'], [['_u'], 'errorA'], [['_B'], 'time'], [['_A', '_B'], 'treatment:time']);
  const table = [];
  let prev = rssOf(rows, y, [], LV), cum = [];
  seq.forEach(([t, name]) => {
    cum = cum.concat([t]);
    const cur = rssOf(rows, y, cum, LV);
    table.push({ source: name, df: cur.rank - prev.rank, ss: prev.rss - cur.rss });
    prev = cur;
  });
  const dfe = rows.length - prev.rank;
  table.push({ source: 'errorB', df: dfe, ss: prev.rss });
  table.forEach(r => { r.ms = r.ss / r.df; });
  const T = name => table.find(r => r.source === name);
  const eA = T('errorA'), eB = T('errorB');
  const test = (name, err) => { const r = T(name); r.F = r.ms / err.ms; r.p = Num.pf(r.F, r.df, err.df, true); r.dfError = err.df; };
  if (o.block) test('block', eA);
  test('treatment', eA); test('time', eB); test('treatment:time', eB);
  /* sphericity: the residual covariance of the unit profiles after the
     between-unit model (treatment, and block if any), as in a multivariate
     linear model of the profiles */
  const b = times.length, A = LV._A;
  const Xu = complete.map(u => {
    let x = [1].concat(A.slice(1).map(a => (u.trt === a ? 1 : 0)));
    if (o.block) x = x.concat(LV._K.slice(1).map(k => (u.block === k ? 1 : 0)));
    return x;
  });
  const E = times.map(t => Num.lm(Xu, complete.map(u => u.v[t])));
  const dfS = E[0].df;
  const S = times.map((_, i) => times.map((__, j) => E[i].resid.reduce((acc, e, q) => acc + e * E[j].resid[q], 0) / dfS));
  const sph = Tr.sphericity(S, dfS);
  ['time', 'treatment:time'].forEach(name => {
    const r = T(name);
    r.pGG = Num.pf(r.F, r.df * sph.gg, eB.df * sph.gg, true);
    r.pHF = Num.pf(r.F, r.df * sph.hf, eB.df * sph.hf, true);
  });
  const ybar = Num.mean(y), tss = y.reduce((s, v) => s + (v - ybar) ** 2, 0);
  table.push({ source: 'total', df: rows.length - 1, ss: tss });
  const cells = Tr.cellMeans(rows.map(r => ({ trt: r._A, time: r._B, y: r._y })), 'y', ['trt', 'time']);
  return { table, sph, times, treatments: A, units: complete.length, dropped, rows, mseA: eA.ms, dfA: eA.df, mseB: eB.ms, dfB: eB.df, cells, grand: ybar, cv: 100 * Math.sqrt(eB.ms) / Math.abs(ybar), design: 'split' };
};
/* Greenhouse–Geisser and Huynh–Feldt epsilons and Mauchly's test from a
   covariance matrix S (b × b) with df degrees of freedom, using normalised
   Helmert contrasts (any orthonormal set gives the same values) */
Tr.sphericity = function (S, df) {
  const b = S.length, d = b - 1;
  if (d < 1) return { gg: 1, hf: 1, mauchly: NaN, p: NaN };
  const C = [];
  for (let k = 1; k <= d; k++) { const row = new Array(b).fill(0); for (let i = 0; i < k; i++) row[i] = 1; row[k] = -k; const nrm = Math.sqrt(k * (k + 1)); C.push(row.map(v => v / nrm)); }
  const Sig = Num.mat.mul(Num.mat.mul(C, S), Num.mat.T(C));
  const lam = Num.mat.eigSym(Sig).values;
  const s1 = lam.reduce((s, v) => s + v, 0), s2 = lam.reduce((s, v) => s + v * v, 0);
  const gg = Math.min(1, s1 * s1 / (d * s2));
  const n = df;
  const hf = Math.min(1, ((n + 1) * s1 * s1 - 2 * s2) / (d * (n * s2 - s1 * s1)));
  /* Mauchly's W = det(Σ)/(tr(Σ)/d)^d, with Bartlett's χ² approximation */
  const det = lam.reduce((s, v) => s * v, 1), W = det / Math.pow(s1 / d, d);
  const f = 1 - (2 * d * d + d + 2) / (6 * d * n);
  const chi = -n * f * Math.log(W), dfc = d * (d + 1) / 2 - 1;
  return { gg, hf, ggRaw: s1 * s1 / (d * s2), mauchly: W, chi, df: dfc, p: dfc > 0 ? Num.pchisq(chi, dfc, true) : NaN, lambda: lam };
};

/* ---------------- mean comparisons ----------------
   groups: [{name, mean, n}]; mse and dfe of the error that applies.
   method: 'tukey' | 'lsd' | 'bonferroni' | 'dunnett' (with control: index). */
Tr.compare = function (groups, mse, dfe, o) {
  o = o || {};
  const method = o.method || 'tukey', alpha = o.alpha || 0.05, k = groups.length;
  const pairs = [];
  const se = (i, j) => Math.sqrt(mse * (1 / groups[i].n + 1 / groups[j].n));
  if (method === 'dunnett') {
    const c = o.control || 0;
    const others = groups.map((_, i) => i).filter(i => i !== c);
    const lam = others.map(i => Math.sqrt(groups[i].n / (groups[i].n + groups[c].n)));
    const crit = Num.qDunnett(1 - alpha, lam, dfe, o.alternative !== 'greater' && o.alternative !== 'less');
    others.forEach((i, idx) => {
      const d = groups[i].mean - groups[c].mean, s = se(i, c), t = d / s;
      const two = o.alternative !== 'greater' && o.alternative !== 'less';
      const tt = o.alternative === 'less' ? -t : t;
      const p = 1 - Num.pDunnett(two ? Math.abs(t) : tt, lam, dfe, two);
      pairs.push({ i, j: c, a: groups[i].name, b: groups[c].name, diff: d, se: s, stat: t, p: Math.max(0, p), crit, lwr: d - crit * s, upr: d + crit * s, sig: p < alpha });
    });
    return { method, pairs, alpha, crit, control: c, letters: null };
  }
  const m = k * (k - 1) / 2;
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
    const d = groups[i].mean - groups[j].mean, s = se(i, j);
    let p, crit;
    if (method === 'tukey') { const q = Math.abs(d) / s * Math.SQRT2; p = Num.ptukey(q, k, dfe, true); crit = Num.qtukey(1 - alpha, k, dfe) / Math.SQRT2; }
    else if (method === 'bonferroni') { p = Math.min(1, m * Num.pt2(d / s, dfe)); crit = Num.qt(1 - alpha / (2 * m), dfe); }
    else { p = Num.pt2(d / s, dfe); crit = Num.qt(1 - alpha / 2, dfe); }
    pairs.push({ i, j, a: groups[i].name, b: groups[j].name, diff: d, se: s, stat: d / s, p, crit, lwr: d - crit * s, upr: d + crit * s, sig: p < alpha });
  }
  /* the minimum significant difference when sizes are equal */
  const balanced = groups.every(gr => gr.n === groups[0].n);
  const msd = balanced && pairs.length ? pairs[0].crit * pairs[0].se : NaN;
  return { method, pairs, alpha, msd, letters: Tr.letters(groups, pairs) };
};
/* compact letter display: insert-and-absorb (Piepho 2004). Groups that
   share a letter do not differ; letters run from the largest mean down. */
Tr.letters = function (groups, pairs, descending) {
  const k = groups.length;
  let cols = [new Array(k).fill(true)];
  pairs.filter(p => p.sig).forEach(p => {
    const next = [];
    cols.forEach(c => {
      if (c[p.i] && c[p.j]) {
        const a = c.slice(), b = c.slice();
        a[p.i] = false; b[p.j] = false;
        next.push(a, b);
      } else next.push(c);
    });
    /* absorb: drop a column contained in another */
    cols = next.filter((c, x) => !next.some((d, z) => z !== x && c.every((v, i) => !v || d[i]) && (!c.every((v, i) => v === d[i]) || z < x)));
  });
  const order = groups.map((_, i) => i).sort((a, b) => (descending === false ? groups[a].mean - groups[b].mean : groups[b].mean - groups[a].mean));
  /* columns in the order of the first (best) group they contain */
  const rank = c => { for (let r = 0; r < order.length; r++) if (c[order[r]]) return r; return 99; };
  cols.sort((a, b) => rank(a) - rank(b));
  const ABC = 'abcdefghijklmnopqrstuvwxyz';
  const out = groups.map(() => '');
  cols.forEach((c, x) => c.forEach((v, i) => { if (v) out[i] += x < 26 ? ABC[x] : ABC[Math.floor(x / 26) - 1] + ABC[x % 26]; }));
  return out;
};
/* treatments compared within each time (slices of the interaction).
   an: result of Tr.factorial or Tr.repeated; o: {method, alpha, control} */
Tr.withinTime = function (an, o) {
  const isSplit = an.design === 'split';
  const tKey = isSplit ? 'time' : an.factors[1], aKey = isSplit ? 'trt' : an.factors[0];
  const times = isSplit ? an.times : an.LV[tKey];
  const trts = isSplit ? an.treatments : an.LV[aKey];
  let mse = an.mse, dfe = an.dfe;
  if (isSplit) {
    /* pooled error for treatments at a fixed time: (Ea + (b − 1)Eb)/b, Satterthwaite df */
    const b = an.times.length;
    mse = (an.mseA + (b - 1) * an.mseB) / b;
    dfe = Math.pow(an.mseA + (b - 1) * an.mseB, 2) / (an.mseA * an.mseA / an.dfA + Math.pow((b - 1) * an.mseB, 2) / an.dfB);
  }
  return times.map(t => {
    const groups = trts.map(a => {
      const c = an.cells.cells.find(x => String(x[aKey]) === a && String(x[tKey]) === t);
      return c ? { name: a, mean: c.mean, n: c.n, sd: c.sd, se: c.se } : null;
    }).filter(Boolean);
    return { time: t, groups, cmp: groups.length > 1 ? Tr.compare(groups, mse, dfe, o) : null, mse, dfe };
  });
};

/* ---------------- slopes over time ----------------
   rows with an attribute y, a numeric time x and a treatment; per treatment
   y = a + b·x; then the ANCOVA tests: equal slopes (interaction) and, with a
   common slope, equal intercepts; pairwise slope differences with the
   residual of the separate-slopes model (Holm adjustment). */
Tr.slopes = function (rows0, o) {
  const rows = rows0.filter(r => isFinite(r[o.x]) && isFinite(r[o.y]) && r[o.y] !== '' && r[o.y] !== null && r[o.group] != null && r[o.group] !== '');
  const G = levelsOf(rows, o.group);
  const per = G.map(gname => {
    const sub = rows.filter(r => String(r[o.group]) === gname);
    const f = Num.lm(sub.map(r => [1, +r[o.x]]), sub.map(r => +r[o.y]));
    const tq = Num.qt(0.975, f.df);
    return { group: gname, n: sub.length, a: f.coef[0], b: f.coef[1], seA: f.se[0], seB: f.se[1], r2: f.r2, p: f.p[1], lo: f.coef[1] - tq * f.se[1], hi: f.coef[1] + tq * f.se[1], sigma: f.sigma };
  });
  const y = rows.map(r => +r[o.y]), x = rows.map(r => +r[o.x]);
  /* separate lines: indicator intercepts and slopes per group */
  const Xsep = rows.map(r => { const d = G.map(gname => (String(r[o.group]) === gname ? 1 : 0)); return d.concat(d.map(v => v * +r[o.x])); });
  const sep = Num.lm(Xsep, y);
  const Xpar = rows.map(r => G.map(gname => (String(r[o.group]) === gname ? 1 : 0)).concat([+r[o.x]]));
  const par = Num.lm(Xpar, y);
  const Xone = rows.map(r => [1, +r[o.x]]);
  const one = Num.lm(Xone, y);
  const k = G.length;
  const Fslope = ((par.rss - sep.rss) / (k - 1)) / (sep.rss / sep.df);
  const Fint = ((one.rss - par.rss) / (k - 1)) / (par.rss / par.df);
  const pairs = [];
  for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) {
    const bi = sep.coef[k + i], bj = sep.coef[k + j];
    const v = sep.vcov[k + i][k + i] + sep.vcov[k + j][k + j] - 2 * sep.vcov[k + i][k + j];
    const t = (bi - bj) / Math.sqrt(v);
    pairs.push({ a: G[i], b: G[j], diff: bi - bj, se: Math.sqrt(v), t, df: sep.df, p: Num.pt2(t, sep.df) });
  }
  const adj = Num.padjust(pairs.map(p => p.p), o.adjust || 'holm');
  pairs.forEach((p, i) => { p.pAdj = adj[i]; });
  return {
    per, groups: G, pairs,
    equalSlopes: { F: Fslope, df1: k - 1, df2: sep.df, p: Num.pf(Fslope, k - 1, sep.df, true) },
    equalIntercepts: { F: Fint, df1: k - 1, df2: par.df, p: Num.pf(Fint, k - 1, par.df, true), commonSlope: par.coef[k], commonSlopeSE: par.se[k] },
    sigma: sep.sigma, df: sep.df,
  };
};

/* ---------------- a randomised field book ----------------
   o: { treatments: [names], times: [labels], reps, design: 'crd'|'rcbd',
        repeated: bool (one unit per treatment × rep, measured at every time),
        seed, responses: [names] }
   Destructive sampling: one unit per treatment × time × rep (the factorial
   is randomised as a whole, or within each block). Repeated measures: one
   unit per treatment × rep, measured at every time. */
Tr.fieldBook = function (o) {
  const rng = Num.rng(o.seed || 2026);
  const reps = Math.max(1, o.reps | 0), times = o.times && o.times.length ? o.times : [''];
  const es = o.lang !== 'en';
  const H = es ? { unit: 'Parcela', block: 'Bloque', rep: 'Repeticion', trt: 'Tratamiento', time: 'Tiempo', order: 'Orden' }
    : { unit: 'Plot', block: 'Block', rep: 'Replicate', trt: 'Treatment', time: 'Time', order: 'Order' };
  const units = [];
  if (o.repeated) {
    const cells = [];
    if (o.design === 'rcbd') for (let b = 1; b <= reps; b++) rng.shuffle(o.treatments.slice()).forEach(t => cells.push({ block: b, trt: t }));
    else { const all = []; for (let r = 1; r <= reps; r++) o.treatments.forEach(t => all.push({ rep: r, trt: t })); rng.shuffle(all).forEach(c => cells.push(c)); }
    cells.forEach((c, i) => times.forEach(tm => units.push(Object.assign({ unit: i + 1, time: tm }, c))));
  } else if (o.design === 'rcbd') {
    for (let b = 1; b <= reps; b++) {
      const cells = [];
      o.treatments.forEach(t => times.forEach(tm => cells.push({ trt: t, time: tm })));
      rng.shuffle(cells).forEach((c, i) => units.push(Object.assign({ unit: b * 100 + i + 1, block: b }, c)));
    }
  } else {
    const cells = [];
    for (let r = 1; r <= reps; r++) o.treatments.forEach(t => times.forEach(tm => cells.push({ trt: t, time: tm, rep: r })));
    rng.shuffle(cells).forEach((c, i) => units.push(Object.assign({ unit: i + 1 }, c)));
  }
  const header = [H.unit];
  if (o.design === 'rcbd') header.push(H.block); else header.push(H.rep);
  header.push(H.trt);
  if (times[0] !== '') header.push(H.time);
  (o.responses || []).forEach(r => header.push(r));
  const rows = units.map(u => {
    const r = [u.unit, o.design === 'rcbd' ? u.block : u.rep, u.trt];
    if (times[0] !== '') r.push(u.time);
    (o.responses || []).forEach(() => r.push(''));
    return r;
  });
  return { header, rows, n: rows.length };
};

g.Trial = Tr;
return Tr;
}
if (typeof window !== 'undefined') TrialCore(window);
