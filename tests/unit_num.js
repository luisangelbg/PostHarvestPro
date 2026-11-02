/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   Tests of the numerical core (js/num.js) against the references of tests/validacion/num.R. */
(function () {
'use strict';
const R = () => (window.REF && window.REF.num) || null;

TEST('num', 'quantiles of t, χ², F and beta (relative 1e-9)', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  r.qt.v.forEach((v, i) => a.rel(Num.qt(r.qt.p[i], r.qt.df[i]), v, 1e-9, 'qt ' + r.qt.p[i] + ',' + r.qt.df[i]));
  r.qchisq.v.forEach((v, i) => a.rel(Num.qchisq(r.qchisq.p[i], r.qchisq.df[i]), v, 1e-9, 'qchisq ' + r.qchisq.p[i] + ',' + r.qchisq.df[i]));
  r.qf.v.forEach((v, i) => a.rel(Num.qf(r.qf.p[i], r.qf.d1[i], r.qf.d2[i]), v, 1e-9, 'qf'));
  r.qbeta.v.forEach((v, i) => a.rel(Num.qbeta(r.qbeta.p[i], r.qbeta.a[i], r.qbeta.b[i]), v, 1e-9, 'qbeta'));
});
TEST('num', 'binomial: densities, both tails and quantiles', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  const b = r.pbinom;
  b.k.forEach((k, i) => {
    a.rel(Num.pbinom(k, b.n[i], b.p[i]), b.lower[i], 1e-10, 'lower', 1e-300);
    a.rel(Num.pbinom(k, b.n[i], b.p[i], true), b.upper[i], 1e-10, 'upper', 1e-300);
    a.rel(Num.dbinom(k, b.n[i], b.p[i]), b.d[i], 1e-10, 'dbinom', 1e-300);
  });
  r.qbinom.v.forEach((v, i) => a.eq(Num.qbinom(r.qbinom.q[i], r.qbinom.n[i], r.qbinom.p[i]), v, 'qbinom'));
});
TEST('num', 'studentized range: distribution (1e-7) and quantiles (1e-5)', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  r.ptukey.v.forEach((v, i) => a.close(Num.ptukey(r.ptukey.q[i], r.ptukey.k[i], r.ptukey.df[i]), v, 1e-7, `ptukey(${r.ptukey.q[i]},${r.ptukey.k[i]},${r.ptukey.df[i]})`));
  /* the reference quantile is itself found by a secant search to about 1e-4 relative */
  r.qtukey.v.forEach((v, i) => a.rel(Num.qtukey(r.qtukey.p[i], r.qtukey.k[i], r.qtukey.df[i]), v, 1e-4, `qtukey(${r.qtukey.p[i]},${r.qtukey.k[i]},${r.qtukey.df[i]})`));
});
TEST('num', 'many-to-one comparisons: critical values and p (2e-3, the reference is a randomised integration)', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  r.dunnett.forEach((d, i) => {
    a.close(Num.qDunnett(0.95, d.lambda, d.df, true), d.q2, 2e-3, 'two-sided #' + i);
    a.close(Num.qDunnett(0.95, d.lambda, d.df, false), d.q1, 2e-3, 'one-sided #' + i);
    a.close(1 - Num.pDunnett(2.4, d.lambda, d.df, true), d['p2_at_2.4'], 5e-4, 'p at 2.4 #' + i);
  });
});
TEST('num', 'linear model, eigenvalues, singular values, nonlinear least squares, p adjustment', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  const f = Num.lm(r.lm.X, r.lm.y);
  a.arr(f.coef, r.lm.coef, 1e-10, 'coef'); a.arr(f.se, r.lm.se, 1e-10, 'se');
  a.close(f.r2, r.lm.r2, 1e-12, 'r2'); a.close(f.sigma, r.lm.sigma, 1e-12, 'sigma');
  a.arr(Num.mat.eigSym(r.eig.S).values, r.eig.values, 1e-10, 'eigen');
  a.arr(Num.mat.svd(r.svd.A).d, r.svd.d, 1e-10, 'svd');
  const fit = Num.levMar(p => r.nls.t.map((t, i) => r.nls.y[i] - p[0] * Math.exp(-p[1] * t)), [120, 0.1]);
  a.arr(fit.p, r.nls.coef, 1e-6, 'nls coef'); a.rel(fit.rss, r.nls.rss, 1e-9, 'nls rss');
  ['holm', 'BH', 'hochberg', 'bonferroni'].forEach(m => a.arr(Num.padjust(r.padjust.p, m), r.padjust[m], 1e-14, m));
});
TEST('num', 'properties: quadrature, roots, simplex', a => {
  a.close(Num.integrate(x => Math.exp(-x * x), 0, 3), 0.886207348259521, 1e-12, '∫exp(−x²)');
  a.close(Num.glIntegrate(x => x * x * x, -1, 2, 8, 1), 3.75, 1e-13, 'GL cubic');
  a.close(Num.brent(x => Math.cos(x) - x, 0, 1), 0.7390851332151607, 1e-12, 'Dottie number');
  const nm = Num.nelderMead(p => (1 - p[0]) ** 2 + 100 * (p[1] - p[0] * p[0]) ** 2, [-1.2, 1]);
  a.close(nm.x[0], 1, 1e-5, 'Rosenbrock x'); a.close(nm.x[1], 1, 1e-5, 'Rosenbrock y');
  const L = Num.mat.chol([[4, 2], [2, 3]]);
  a.close(L[1][1], Math.sqrt(2), 1e-14, 'cholesky');
  a.arr(Num.mat.solve([[2, 1], [1, 3]], [3, 5]), [0.8, 1.4], 1e-14, 'solve');
});
})();
