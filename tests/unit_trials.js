/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   Tests of the trials engine (js/trials.js) against tests/validacion/trials.R. */
(function () {
'use strict';
const R = () => (window.REF && window.REF.trials) || null;
const num = v => (typeof v === 'number' ? v : NaN);
/* compare an ANOVA table of the engine with one of the reference, by source name */
function sameTable(a, mine, ref, map, tol, label) {
  ref.source.forEach((s, i) => {
    const key = map[s];
    if (!key) return;
    const row = mine.find(r => r.source === key);
    if (!row) { a.ok(false, label + ': missing ' + key); return; }
    a.eq(row.df, ref.df[i], label + ' df ' + key);
    a.rel(row.ss, ref.ss[i], tol, label + ' SS ' + key, 1e-12);
    if (typeof ref.F[i] === 'number' && row.F != null) {
      a.rel(row.F, ref.F[i], tol, label + ' F ' + key, 1e-12);
      a.rel(row.p, num(ref.p[i]), 1e-6, label + ' p ' + key, 1e-300);
    }
  });
}

TEST('trials', 'factorial CRD: type I and type III sums of squares, balanced and unbalanced (relative 1e-9)', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  const map = { temperatura: 'temperatura', dia: 'dia', 'temperatura:dia': 'temperatura:dia', Residuals: 'residual' };
  [['crd', r.crd], ['crdUnbal', r.crdUnbal]].forEach(([lab, c]) => {
    const t1 = Trial.factorial(c.rows, { y: 'firmeza_N', factors: ['temperatura', 'dia'], type: 1 });
    sameTable(a, t1.table, c.type1, map, 1e-9, lab + ' I');
    const t3 = Trial.factorial(c.rows, { y: 'firmeza_N', factors: ['temperatura', 'dia'], type: 3 });
    sameTable(a, t3.table, c.type3, map, 1e-9, lab + ' III');
  });
});
TEST('trials', 'factorial in complete blocks (relative 1e-9)', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  const map = { bloque: 'bloque', trt: 'trt', tiempo: 'tiempo', 'trt:tiempo': 'trt:tiempo', Residuals: 'residual' };
  sameTable(a, Trial.factorial(r.rcbd.rows, { y: 'y', factors: ['trt', 'tiempo'], block: 'bloque', type: 1 }).table, r.rcbd.type1, map, 1e-9, 'I');
  sameTable(a, Trial.factorial(r.rcbd.rows, { y: 'y', factors: ['trt', 'tiempo'], block: 'bloque', type: 3 }).table, r.rcbd.type3, map, 1e-9, 'III');
});
TEST('trials', 'mean comparisons: Tukey–Kramer, LSD, Bonferroni (1e-6), Dunnett (2e-3), letters', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  [['bal', r.oneBal], ['unbal', r.oneUnbal]].forEach(([lab, c]) => {
    const groups = c.levels.map((l, i) => ({ name: l, mean: c.means[i], n: c.n[i] }));
    const tk = Trial.compare(groups, c.mse, c.dfe, { method: 'tukey' });
    c.tukey.pair.forEach((pr, i) => {
      const [b, aa] = pr.split('-');
      const p = tk.pairs.find(x => (x.a === aa && x.b === b) || (x.a === b && x.b === aa));
      const sg = p.a === b ? 1 : -1;            /* the reference reports second − first */
      a.close(sg * p.diff, c.tukey.diff[i], 1e-10, lab + ' diff ' + pr);
      a.close(sg > 0 ? p.lwr : -p.upr, c.tukey.lwr[i], 1e-5, lab + ' lwr ' + pr);
      a.close(p.p, c.tukey.p[i], 1e-6, lab + ' p ' + pr);
    });
    const pw = (res, ref, nm) => ref.rn.forEach((rn, i) => ref.cn.forEach((cn, j) => {
      const v = ref.p[i][j];
      if (typeof v !== 'number') return;
      const p = res.pairs.find(x => (x.a === rn && x.b === cn) || (x.a === cn && x.b === rn));
      a.close(p.p, v, 1e-9, lab + ' ' + nm + ' ' + rn + '/' + cn);
    }));
    pw(Trial.compare(groups, c.mse, c.dfe, { method: 'lsd' }), c.lsd, 'LSD');
    pw(Trial.compare(groups, c.mse, c.dfe, { method: 'bonferroni' }), c.bonf, 'Bonferroni');
    const dn = Trial.compare(groups, c.mse, c.dfe, { method: 'dunnett', control: 0 });
    dn.pairs.forEach((p, i) => { a.close(p.diff, c.dunnett.est[i], 1e-10, lab + ' Dunnett est'); a.close(p.p, c.dunnett.p[i], 2e-3, lab + ' Dunnett p ' + p.a); });
    const dg = Trial.compare(groups, c.mse, c.dfe, { method: 'dunnett', control: 0, alternative: 'greater' });
    dg.pairs.forEach((p, i) => a.close(p.p, c.dunnett.pGreater[i], 2e-3, lab + ' Dunnett one-sided p ' + p.a));
    if (lab === 'bal') {
      /* letters: the same «shares a letter» relation as the reference grouping */
      const L = tk.letters, ref = {};
      c.hsdGroups.level.forEach((l, i) => { ref[l] = c.hsdGroups.groups[i]; });
      const share = (x, y) => [...x].some(ch => y.includes(ch));
      for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) a.eq(share(L[i], L[j]), share(ref[groups[i].name], ref[groups[j].name]), 'letters ' + groups[i].name + '/' + groups[j].name);
    }
  });
});
TEST('trials', 'repeated measures: split plot in time, Greenhouse–Geisser, Huynh–Feldt (relative 1e-8)', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  const an = Trial.repeated(r.rm.rows, { y: 'perdida_peso', treatment: 'tratamiento', time: 'dia', unit: 'fruto' });
  const T = s => an.table.find(x => x.source === s);
  a.eq(T('treatment').df, r.rm.between.df[0], 'df treatment');
  a.rel(T('treatment').ss, r.rm.between.ss[0], 1e-9, 'SS treatment');
  a.rel(T('treatment').F, r.rm.between.F[0], 1e-9, 'F treatment');
  a.rel(T('errorA').ss, r.rm.between.ss[1], 1e-9, 'SS error A');
  a.rel(T('time').F, r.rm.within.F[0], 1e-9, 'F time');
  a.rel(T('treatment:time').F, r.rm.within.F[1], 1e-9, 'F interaction');
  a.rel(T('errorB').ss, r.rm.within.ss[2], 1e-9, 'SS error B');
  a.close(an.sph.gg, r.rm.ggEps, 1e-10, 'GG epsilon');
  a.close(an.sph.hf, Math.min(1, r.rm.hfEps), 1e-10, 'HF epsilon');
  a.rel(T('time').pGG, r.rm.gg[0], 1e-6, 'p GG time', 1e-300);
  a.rel(T('treatment:time').pGG, r.rm.gg[1], 1e-6, 'p GG interaction', 1e-300);
  a.rel(T('time').pHF, r.rm.hf[0], 1e-6, 'p HF time', 1e-300);
  a.rel(T('treatment:time').pHF, r.rm.hf[1], 1e-6, 'p HF interaction', 1e-300);
  a.close(an.sph.mauchly, r.rm.mauchlyW, 1e-10, 'Mauchly W');
  a.close(an.sph.p, r.rm.mauchlyP, 1e-8, 'Mauchly p');
});
TEST('trials', 'slopes over time: separate lines, equal-slope and equal-intercept tests, pairwise (1e-9)', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  const s = Trial.slopes(r.slopes.rows, { y: 'perdida_peso', x: 'dia', group: 'tratamiento' });
  r.slopes.levels.forEach((l, i) => {
    const p = s.per.find(x => x.group === l);
    a.close(p.a, r.slopes.per[i][0], 1e-10, 'a ' + l); a.close(p.b, r.slopes.per[i][1], 1e-12, 'b ' + l);
    a.close(p.seB, r.slopes.per[i][2], 1e-12, 'se b ' + l); a.close(p.r2, r.slopes.per[i][3], 1e-12, 'r2 ' + l);
  });
  a.rel(s.equalSlopes.F, r.slopes.Fslope, 1e-9, 'F slopes'); a.rel(s.equalSlopes.p, r.slopes.pslope, 1e-6, 'p slopes', 1e-300);
  a.rel(s.equalIntercepts.F, r.slopes.Fint, 1e-9, 'F intercepts'); a.rel(s.equalIntercepts.p, r.slopes.pint, 1e-6, 'p intercepts', 1e-300);
  r.slopes.pairs.contrast.forEach((c, i) => {
    const [x, y] = c.split(' - ');
    const p = s.pairs.find(q => q.a === x && q.b === y);
    a.close(p.diff, r.slopes.pairs.est[i], 1e-12, 'diff ' + c);
    a.close(p.se, r.slopes.pairs.se[i], 1e-12, 'se ' + c);
    a.rel(p.p, r.slopes.pairs.p[i], 1e-6, 'p ' + c, 1e-300);
    a.rel(p.pAdj, r.slopes.pairs.pHolm[i], 1e-6, 'Holm ' + c, 1e-300);
  });
});
TEST('trials', 'field book: sizes, balance and reproducibility', a => {
  const o = { treatments: ['T', 'A', 'B'], times: ['0', '7', '14'], reps: 4, seed: 9 };
  const crd = Trial.fieldBook(Object.assign({ design: 'crd' }, o));
  a.eq(crd.n, 36, 'CRD units');
  const rc = Trial.fieldBook(Object.assign({ design: 'rcbd' }, o));
  a.eq(rc.n, 36, 'RCBD units');
  [1, 2, 3, 4].forEach(b => a.eq(rc.rows.filter(r => r[1] === b).length, 9, 'block ' + b));
  a.eq(JSON.stringify(Trial.fieldBook(Object.assign({ design: 'crd' }, o)).rows), JSON.stringify(crd.rows), 'same seed, same book');
  const rm = Trial.fieldBook(Object.assign({ design: 'crd', repeated: true }, o));
  a.eq(new Set(rm.rows.map(r => r[0])).size, 12, 'repeated: 12 units');
  a.eq(rm.n, 36, 'repeated: 36 measurements');
});
})();
