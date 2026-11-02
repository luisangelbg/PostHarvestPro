/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.

   Tests of js/survival.js: textbook cases, properties, and the comparison with
   the reference values written by the validation script in tests/validacion/
   (window.REF.survival).

   Tolerances, and why:
   * Kaplan–Meier, Greenwood, intervals, median, quantiles, restricted mean and
     the log-rank family: finite sums and products of the same counts on both
     sides; they agree to rounding (abs 1e-12 for probabilities, rel 1e-10 for
     χ², variances and standard errors, exact for counts and times).
   * Maximum likelihood (accelerated failure time models): the reference
     iterates Newton–Raphson until the relative change of the log-likelihood is
     below 1e-12; ours ends with a Newton step on the score. Newton converges
     quadratically, so both sit at the maximum to ~1e-11 (observed: 4e-12 in
     the estimates). Margins of 10⁴–10⁵ over that: estimates and quantiles
     rel 1e-7; standard errors, covariances and quantile errors rel 1e-6 (the
     observed information is evaluated at the two end points); S(t) abs 1e-8;
     log-likelihood and AIC abs 1e-8.
   * The second reference for the log-likelihood (another maximum-likelihood
     program, with its own optimiser and tolerances): abs 1e-6. */
(function () {
  'use strict';
  const REFS = (typeof window !== 'undefined' && window.REF && window.REF.survival) || null;
  const num = v => (v === 'NA' || v === 'NaN' || v === null || v === undefined ? NaN : v === 'Inf' ? Infinity : v === '-Inf' ? -Infinity : v);
  const nums = a => [].concat(a).map(num);
  /* relative comparison that also accepts ±Inf and NaN in the reference (Greenwood is infinite where S = 0) */
  const arrRelInf = (a, x, e, rtol, lab) => {
    if (!x || x.length !== e.length) { a.eq(x && x.length, e.length, lab + ' length'); return; }
    e.forEach((v, i) => {
      if (Number.isNaN(v)) a.close(x[i], NaN, 0, lab + '[' + i + ']');
      else if (!isFinite(v)) a.eq(x[i], v, lab + '[' + i + ']');
      else a.rel(x[i], v, rtol, lab + '[' + i + ']', 1e-300);
    });
  };

  /* ---------------- textbook cases ----------------
     Remission times (weeks) of the 6-MP and placebo groups of the acute leukaemia
     trial of Freireich et al. (1963, Blood 21:699–716), the worked example of
     Kleinbaum & Klein (2012, Survival Analysis: A Self-Learning Text, ch. 2) and
     of many texts; + marks censoring. */
  const MP = { t: [6, 6, 6, 6, 7, 9, 10, 10, 11, 13, 16, 17, 19, 20, 22, 23, 25, 32, 32, 34, 35], s: [1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0] };
  const PL = { t: [1, 1, 2, 2, 3, 4, 4, 5, 5, 8, 8, 8, 8, 11, 11, 12, 12, 15, 17, 22, 23], s: new Array(21).fill(1) };
  TEST('survival', 'Kaplan–Meier of the 6-MP group (textbook values)', a => {
    const K = Surv.km(MP.t, MP.s);
    const at = t => K.surv[K.time.indexOf(t)];
    a.close(at(6), 0.857, 5e-4, 'S(6)'); a.close(at(7), 0.807, 5e-4, 'S(7)'); a.close(at(10), 0.753, 5e-4, 'S(10)');
    a.close(at(13), 0.690, 5e-4, 'S(13)'); a.close(at(16), 0.627, 5e-4, 'S(16)'); a.close(at(22), 0.538, 5e-4, 'S(22)');
    a.close(at(23), 0.448, 5e-4, 'S(23)');
    a.close(K.se[0], 0.0764, 5e-5, 'Greenwood SE at 6');
    a.eq(K.median, 23, 'median 23 weeks');
    a.eq(K.events, 9, '9 relapses');
    const KP = Surv.km(PL.t, PL.s);
    a.eq(KP.median, 8, 'placebo median 8 weeks');
  });
  TEST('survival', 'log-rank, 6-MP vs placebo: χ² = 16.79 (textbook)', a => {
    const t = MP.t.concat(PL.t), s = MP.s.concat(PL.s), g = MP.t.map(() => '6-MP').concat(PL.t.map(() => 'placebo'));
    const L = Surv.logrank(t, s, g);
    a.close(L.chisq, 16.79, 0.005, 'χ²'); a.eq(L.df, 1, 'df');
    a.ok(L.p < 1e-4, 'p < 0.0001');
    a.arr(L.obs, [9, 21], 1e-12, 'observed'); a.arr(L.exp, [19.25, 10.75], 0.005, 'expected');
    a.close(L.obs.reduce((x, y) => x + y, 0), L.exp.reduce((x, y) => x + y, 0), 1e-10, 'Σ O = Σ E');
  });
  TEST('survival', 'no censoring: Kaplan–Meier is the empirical survivor function; midpoint median', a => {
    const K = Surv.km([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], new Array(10).fill(1));
    a.arr(K.surv, [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0], 1e-15, 'S = 1 − i/n');
    a.eq(K.median, 5.5, 'S = ½ on [5, 6): median = 5.5');
    a.close(K.rmean, 5.5, 1e-12, 'restricted mean = sample mean without censoring');
    a.ok(Number.isNaN(K.se[9]), 'SE undefined where S = 0');
  });
  TEST('survival', 'a single group gives no test; censoring-only data gives S = 1', a => {
    const G = Surv.kmGroups([3, 5, 7], [1, 0, 1], ['A', 'A', 'A']);
    a.eq(G.logrank, null, 'no log-rank with one group');
    const K = Surv.km([2, 4, 6], [0, 0, 0]);
    a.arr(K.surv, [1, 1, 1], 0, 'S = 1'); a.ok(Number.isNaN(K.median), 'no median');
    a.ok(K.notes.length > 0, 'note');
  });
  TEST('survival', 'exponential model without censoring: the MLE of the mean is the sample mean', a => {
    const t = [2, 3, 5, 7, 11, 13, 17, 19], s = new Array(8).fill(1);
    const m = t.reduce((x, y) => x + y, 0) / t.length;
    const E = Surv.reg(t, s, { dist: 'exponential' });
    a.rel(Math.exp(E.coef[0]), m, 1e-10, 'exp(β0) = mean');
    a.rel(E.se[0], 1 / Math.sqrt(8), 1e-8, 'SE(β0) = 1/√d');
    a.rel(E.quantile(0.5).est, m * Math.LN2, 1e-10, 'median = mean·ln 2');
    /* with censoring: total time on test / events */
    const s2 = [1, 1, 0, 1, 0, 1, 1, 0];
    const E2 = Surv.reg(t, s2, { dist: 'exponential' });
    a.rel(Math.exp(E2.coef[0]), t.reduce((x, y) => x + y, 0) / 5, 1e-10, 'exp(β0) = Σt/d');
  });
  TEST('survival', 'Weibull: shape = 1/scale and S(t) from the fitted quantile', a => {
    const t = [12, 15, 17, 19, 20, 22, 23, 25, 28, 30, 31, 35], s = [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1];
    const W = Surv.reg(t, s, { dist: 'weibull' });
    a.rel(W.shape, 1 / W.scale, 1e-15, 'shape');
    for (const p of [0.1, 0.5, 0.9]) a.close(W.surv(W.quantile(p).est), 1 - p, 1e-12, 'S(t_p) = 1 − p at p = ' + p);
    a.ok(W.converged, 'converged');
  });
  TEST('survival', 'heavy censoring (90 %) still converges', a => {
    const rng = Num.rng(7), t = [], s = [];
    for (let i = 0; i < 80; i++) { const T = 30 * Math.pow(-Math.log(rng()), 1 / 2), C = 10 * rng(); t.push(Math.ceil(Math.min(T, C))); s.push(T <= C ? 1 : 0); }
    for (const d of ['weibull', 'lognormal', 'loglogistic', 'exponential']) {
      const f = Surv.reg(t, s, { dist: d });
      a.ok(f.converged && isFinite(f.loglik), d + ' converged (' + s.reduce((x, y) => x + y, 0) + ' events)');
      a.ok(f.se.every(v => v > 0), d + ' finite standard errors');
    }
  });

  /* ---------------- comparison with the reference values ---------------- */
  if (!REFS) { TEST('survival', 'reference values (ref_survival.js) are loaded', a => a.ok(false, 'window.REF.survival missing')); return; }

  const cmpKM = (a, K, r, lab) => {
    a.arr(K.time, nums(r.time), 0, lab + ' time');
    a.arr(K.nRisk, nums(r.nRisk), 0, lab + ' n.risk');
    a.arr(K.nEvent, nums(r.nEvent), 0, lab + ' n.event');
    a.arr(K.nCensor, nums(r.nCensor), 0, lab + ' n.censor');
    a.arr(K.surv, nums(r.surv), 1e-14, lab + ' surv');
    arrRelInf(a, K.stdErrLog, nums(r.stdErrLog), 1e-12, lab + ' std.err (log)');
    a.arr(K.se, nums(r.se), 1e-14, lab + ' std.err of S');
    a.arr(K.lower, nums(r.lower), 1e-13, lab + ' lower');
    a.arr(K.upper, nums(r.upper), 1e-13, lab + ' upper');
    a.close(K.median, num(r.median), 1e-12, lab + ' median');
    a.arr(K.medianCI, nums(r.medianCI), 1e-12, lab + ' median CI');
    a.close(K.rmean, num(r.rmean), 1e-10, lab + ' rmean');
    a.close(K.rmeanSE, num(r.rmeanSE), 1e-10, lab + ' se(rmean)');
    a.eq(K.n, num(r.n), lab + ' n'); a.eq(K.events, num(r.events), lab + ' events');
    const Q = K.quantile(r.quantile.p);
    a.arr(Q.map(q => q.est), nums(r.quantile.est), 1e-12, lab + ' quantiles');
    a.arr(Q.map(q => q.lo), nums(r.quantile.lo), 1e-12, lab + ' quantile lower');
    a.arr(Q.map(q => q.hi), nums(r.quantile.hi), 1e-12, lab + ' quantile upper');
  };
  const TYPES = [['log', 'log'], ['loglog', 'log-log'], ['plain', 'plain']];
  REFS.sets.concat(REFS.stress || []).forEach(S => {
    if (S.km) TEST('survival', 'Kaplan–Meier (3 interval types), median, quantiles, rmean vs reference · ' + S.id, a => {
      S.km.forEach(G => {
        const idx = S.group ? S.time.map((_, i) => i).filter(i => S.group[i] === G.level) : S.time.map((_, i) => i);
        TYPES.forEach(([key, type]) => {
          const K = Surv.km(idx.map(i => S.time[i]), idx.map(i => S.status[i]), { confType: type });
          cmpKM(a, K, G[key], (G.level || 'all') + ' ' + type);
        });
      });
    });
    if (S.logrank) TEST('survival', 'log-rank (ρ = 0) and Peto–Peto (ρ = 1) vs reference · ' + S.id, a => {
      S.logrank.forEach(r => {
        const L = Surv.logrank(S.time, S.status, S.group, { rho: r.rho });
        const lab = 'rho ' + r.rho;
        a.rel(L.chisq, r.chisq, 1e-10, lab + ' chisq'); a.eq(L.df, r.df, lab + ' df');
        a.rel(L.p, r.p, 1e-8, lab + ' p');
        a.arrRel(L.obs, nums(r.obs), 1e-12, lab + ' observed', 1e-12);
        a.arrRel(L.exp, nums(r.exp), 1e-12, lab + ' expected');
        a.arrRel([].concat(...L.var), [].concat(...r.var), 1e-10, lab + ' variance', 1e-10);
      });
      const G = Surv.kmGroups(S.time, S.status, S.group);
      a.eq(G.levels, S.levels, 'levels in the reference order');
      a.rel(G.logrank.chisq, S.logrank[0].chisq, 1e-10, 'kmGroups carries the log-rank');
    });
    TEST('survival', 'AFT models (weibull, lognormal, loglogistic, exponential) vs reference · ' + S.id, a => {
      ['weibull', 'lognormal', 'loglogistic', 'exponential'].forEach(d => {
        const r = S.reg[d], lab = d;
        if (!r || r.failed || !r.conv) return;   /* the reference did not converge */
        const opt = { dist: d };
        if (S.group) opt.group = S.group;
        if (S.x) opt.x = S.x;
        const f = Surv.reg(S.time, S.status, opt);
        a.ok(f.converged, lab + ' converged');
        /* the log-likelihood (its supremum, when a level has no events) and AIC of the full model */
        a.close(f.loglik, r.loglik, 1e-8, lab + ' loglik');
        a.close(f.aic, r.aic, 1e-8, lab + ' AIC');
        a.eq(f.df, num(r.df), lab + ' df');
        if (isFinite(num(r.loglik2))) a.close(f.loglik, num(r.loglik2), 1e-6, lab + ' loglik (second reference)');
        let ref = r, ats = S.levels ? S.levels : S.xnew ? S.xnew : [null], est = j => true;
        if (S.zeroEventLevels) {
          /* a level without events: its term is not estimable (NaN); the other
             terms are compared with the fit at the limit (without those records) */
          const zero = [].concat(S.zeroEventLevels);
          a.eq(f.excluded, zero, lab + ' levels left out');
          zero.forEach(L => {
            a.ok(Number.isNaN(f.coef[f.names.indexOf(L)]), lab + ' coefficient of ' + L + ' not estimable');
            a.ok(f.quantile([0.5], L).every(q => Number.isNaN(q.est)), lab + ' no quantile for ' + L);
          });
          ref = r.limit; ats = [].concat(r.limit.levels);
          est = j => j >= f.names.length || isFinite(f.coef[j]);
        }
        const pick = v => v.filter((_, j) => est(j));
        a.arrRel(pick(f.coef), nums(ref.coef), 1e-7, lab + ' coef', 1e-6);
        a.arrRel(pick(f.seAll), nums(ref.se), 1e-6, lab + ' se');
        a.arrRel(pick(f.z), nums(ref.z), 1e-6, lab + ' z', 1e-6);
        a.arrRel(pick(f.p), nums(ref.p), 1e-5, lab + ' p', 1e-12);
        a.rel(f.scale, ref.scale, 1e-7, lab + ' scale');
        a.close(f.logScaleSE, num(ref.logScaleSE), Math.abs(num(ref.logScaleSE)) * 1e-6 || 0, lab + ' se log(scale)');
        a.arrRel([].concat(...pick(f.vcov).map(row => pick(row))), [].concat(...ref.vcov), 1e-6, lab + ' vcov', 1e-6);
        /* quantiles and survival at the levels / covariate values the reference predicted at */
        ats.forEach((at, i) => {
          const Q = f.quantile(nums(ref.p_), at), tag = lab + ' @' + (at == null ? 'all' : at);
          a.arrRel(Q.map(q => q.est), nums(ref.qEst[i]), 1e-7, tag + ' quantile');
          a.arrRel(Q.map(q => q.se), nums(ref.qSE[i]), 1e-6, tag + ' quantile se');
          a.arrRel(Q.map(q => q.logEst), nums(ref.uqEst[i]), 1e-7, tag + ' log quantile', 1);
          a.arrRel(Q.map(q => q.logSE), nums(ref.uqSE[i]), 1e-6, tag + ' log quantile se');
          a.arr(f.surv(nums(ref.tq), at), nums(ref.surv[i]), 1e-8, tag + ' S(t)');
        });
      });
    });
    TEST('survival', 'distribution chosen by AIC vs reference · ' + S.id, a => {
      const o = {};
      if (S.x) o.x = S.x;
      const C = Surv.compare(S.time, S.status, S.group || null, o);
      const okR = nums(S.compare.aic).every(v => isFinite(v));
      a.arr(C.rows.map((r, i) => (isFinite(num(S.compare.aic[i])) ? r.aic : NaN)), nums(S.compare.aic), 1e-8, 'AIC');
      if (!okR) return;
      a.arr(C.rows.map(r => r.deltaAIC), nums(S.compare.deltaAIC), 1e-8, 'ΔAIC');
      a.arr(C.rows.map(r => r.weight), nums(S.compare.weights), 1e-9, 'weights');
      a.eq(C.best, S.compare.best, 'best');
    });
  });
})();
