/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.

   Tests of js/kinetics.js: closed-form and textbook cases, properties, and the
   comparison with the reference values written by the validation script in
   tests/validacion/ (window.REF.kinetics).

   Tolerances, and why:
   * Nonlinear estimates (C0, k, t_L): within 1e-7 relative or 1e-6 of their
     standard error, whichever is larger. The reference fits stop at a
     relative offset (Bates & Watts) below 1e-8, i.e. a few 1e-8 standard
     errors from the least-squares point; ours stop at 1e-11. Observed: at most
     5e-8 standard errors (1.4e-8 relative, for a k whose standard error is
     65 % of it). Fitted values and predicted means: rel 1e-7.
   * Standard errors, covariances and every interval that uses them, rel 1e-6:
     they are evaluated at the two (slightly different) end points, and the
     Jacobian there moves at first order with the estimates.
   * RSS, σ, AIC, BIC, r²: the RSS is flat at the optimum, so it agrees to
     rounding (rel 1e-9; AIC abs 1e-7).
   * Linear regressions (linearised fits, Arrhenius, square-root model, ASLT):
     closed-form least squares on both sides, rel 1e-9 (1e-8 for intervals that
     go through the t quantile, which is computed by iteration on both sides).
   * Delta-method intervals of the time to a limit are compared with a nonlinear
     fit reparametrised in t_L (whose Wald standard error is the delta-method
     one exactly): rel 1e-6, as for the other standard errors. */
(function () {
  'use strict';
  const REFK = (typeof window !== 'undefined' && window.REF && window.REF.kinetics) || null;
  /* the reference files write NA, NaN and ±Inf as strings */
  const num = v => (v === 'NA' || v === 'NaN' || v === null || v === undefined ? NaN : v === 'Inf' ? Infinity : v === '-Inf' ? -Infinity : v);
  const nums = a => a.map(num);
  const RG = 8.314462618, K0 = 273.15;

  /* ---------------- closed-form and textbook cases ---------------- */
  TEST('kinetics', 'exact first-order data: the fit recovers C0 and k, RSS ≈ 0', a => {
    const t = [0, 2, 4, 6, 8, 10, 12], y = t.map(v => 100 * Math.exp(-0.05 * v));
    const f = Kin.fit(t, y, { order: 1 });
    a.rel(f.C0, 100, 1e-10, 'C0');
    a.rel(f.k, 0.05, 1e-10, 'k');
    a.ok(f.rss < 1e-18, 'rss');
    a.rel(f.halfLife, Math.LN2 / 0.05, 1e-10, 'half-life ln2/k');
    a.ok(f.converged, 'converged');
    const fl = Kin.fit(t, y, { order: 1, method: 'linear' });
    a.rel(fl.C0, 100, 1e-12, 'linear C0');
    a.rel(fl.k, 0.05, 1e-12, 'linear k');
  });
  TEST('kinetics', 'exact zero- and second-order data', a => {
    const t = [0, 1, 2, 3, 5, 8];
    const f0 = Kin.fit(t, t.map(v => 50 - 2.5 * v), { order: 0 });
    a.rel(f0.C0, 50, 1e-12, 'C0 order 0'); a.rel(f0.k, 2.5, 1e-12, 'k order 0');
    a.rel(f0.halfLife, 10, 1e-12, 'half-life C0/(2k)');
    const f2 = Kin.fit(t, t.map(v => 20 / (1 + 20 * 0.01 * v)), { order: 2 });
    a.rel(f2.C0, 20, 1e-9, 'C0 order 2'); a.rel(f2.k, 0.01, 1e-9, 'k order 2');
    a.rel(f2.halfLife, 1 / (20 * 0.01), 1e-9, 'half-life 1/(C0 k)');
    const f2l = Kin.fit(t, t.map(v => 20 / (1 + 20 * 0.01 * v)), { order: 2, method: 'linear' });
    a.rel(f2l.k, 0.01, 1e-12, 'linear 1/C slope = k');
  });
  TEST('kinetics', 'a rising attribute: k < 0, no half-life, time to an upper limit', a => {
    const t = [0, 5, 10, 15, 20, 25], y = [10.1, 12.4, 14.8, 18.6, 22.0, 27.5];
    const f = Kin.fit(t, y, { order: 1 });
    a.ok(f.k < 0, 'k < 0');
    a.ok(Number.isNaN(f.halfLife), 'half-life NaN');
    const L = Kin.timeToLimit(f, 20);
    a.ok(L.t > 15 && L.t < 25, 'time to 20 between 15 and 25');
    a.close(f.predict(L.t), 20, 1e-9, 'the model reaches the limit at t_L');
    a.ok(Number.isNaN(Kin.timeToLimit(f, 5).t), 'a lower limit is never reached');
  });
  TEST('kinetics', 'time to a limit: the model passes through the limit at t_L, and NaN beyond reach', a => {
    const t = [0, 3, 6, 9, 12, 15], y = [98, 86, 77, 66, 60, 52];
    for (const order of [0, 1, 2]) {
      const f = Kin.fit(t, y, { order });
      const L = Kin.timeToLimit(f, 40);
      a.close(f.predict(L.t), 40, 1e-9, 'f(t_L) = L, order ' + order);
      a.ok(L.lo < L.t && L.t < L.hi, 'interval brackets t_L, order ' + order);
      a.ok(Number.isNaN(Kin.timeToLimit(f, 120).t), 'limit above C0 never reached, order ' + order);
    }
  });
  TEST('kinetics', 'Akaike weights sum to 1 and the best order has ΔAIC = 0', a => {
    const t = [0, 0, 4, 4, 8, 8, 12, 12, 16, 16], y = [100, 98, 79, 82, 66, 64, 52, 55, 44, 42];
    const c = Kin.compare(t, y);
    a.close(c.weights.reduce((s, v) => s + v, 0), 1, 1e-14, 'Σ w = 1');
    a.close(c.deltaAIC[c.best], 0, 0, 'ΔAIC(best) = 0');
    a.eq(c.fits.length, 3, 'three fits');
    a.eq(c.linearR2.length, 3, 'three linear r²');
  });
  TEST('kinetics', 'Q10 and activation energy: textbook values', a => {
    /* k doubles between 20 and 30 °C: Q10 = 2, Ea = R ln 2 / (1/293.15 − 1/303.15) ≈ 51.2 kJ/mol */
    a.close(Kin.q10(1, 20, 2, 30), 2, 1e-15, 'Q10 = 2');
    const Ea = RG * Math.LN2 / (1 / 293.15 - 1 / 303.15);
    a.close(Ea / 1000, 51.22, 0.005, 'Ea ≈ 51.2 kJ/mol');
    a.rel(Kin.q10FromEa(Ea, 20), 2, 1e-12, 'Q10 from Ea at 20 °C');
    a.rel(Kin.eaFromQ10(2, 20), Ea, 1e-12, 'Ea from Q10 (inverse)');
    a.ok(Number.isNaN(Kin.q10(0, 5, 1, 15)), 'k ≤ 0: NaN');
    a.ok(Number.isNaN(Kin.q10(1, 5, 2, 5)), 'same temperature: NaN');
  });
  TEST('kinetics', 'Arrhenius on exact data: Ea and k_ref recovered, and Ea does not depend on T_ref', a => {
    const Tc = [5, 15, 25, 35], Ea = 80000, k = Tc.map(c => 0.02 * Math.exp(-Ea / RG * (1 / (c + K0) - 1 / (25 + K0))));
    const A = Kin.arrhenius(Tc, k, { Tref: 25 });
    a.rel(A.Ea, Ea, 1e-10, 'Ea'); a.rel(A.kRef, 0.02, 1e-10, 'k_ref at 25 °C');
    const B = Kin.arrhenius(Tc, k);
    a.rel(B.Ea, Ea, 1e-10, 'Ea, harmonic-mean T_ref');
    a.rel(B.predict(25).k, 0.02, 1e-10, 'k(25 °C) from the other reference');
    a.rel(A.q10At(20), Kin.q10FromEa(Ea, 20), 1e-10, 'q10At');
    a.rel(A.lnA, Math.log(0.02) + Ea / (RG * (25 + K0)), 1e-10, 'ln A');
  });
  TEST('kinetics', 'square-root model on exact data', a => {
    const Tc = [0, 5, 10, 15, 20], k = Tc.map(c => (0.03 * (c + 3)) ** 2);
    const B = Kin.belehradek(Tc, k);
    a.rel(B.b, 0.03, 1e-12, 'b'); a.close(B.Tmin, -3, 1e-10, 'Tmin');
    a.eq(B.predict(-5).k, 0, 'k = 0 below Tmin');
  });
  TEST('kinetics', 'ASLT textbook case: shelf life doubles every 10 °C → Q10 = 2, 240 d at 5 °C', a => {
    const r = Kin.aslt({ Tc: [25, 35, 45], shelfLife: [60, 30, 15], Ttarget: 5, model: 'q10' });
    a.rel(r.Q10, 2, 1e-12, 'Q10'); a.rel(r.estimate, 240, 1e-12, 'θ(5 °C)');
    const ra = Kin.aslt({ Tc: [25, 35, 45], shelfLife: [60, 30, 15], Ttarget: 25, model: 'arrhenius' });
    a.ok(Math.abs(ra.estimate - 60) < 3, 'Arrhenius line close at 25 °C');
  });
  TEST('kinetics', 'shelf life at a temperature equals g(C0, L)/k(T)', a => {
    const Tc = [5, 15, 25], Ea = 60000, kk = Tc.map(c => 0.01 * Math.exp(-Ea / RG * (1 / (c + K0) - 1 / (15 + K0))));
    const A = Kin.arrhenius(Tc, kk, { Tref: 15 });
    const s = Kin.shelfLifeAt(A, 15, 50, { order: 1, C0: 100 });
    a.rel(s.result.t, Math.log(2) / 0.01, 1e-10, 'θ = ln 2 / k');
  });
  TEST('kinetics', 'degenerate inputs give NaN, not exceptions', a => {
    a.ok(Number.isNaN(Kin.fit([0, 1], [1, 2], { order: 1 }).k), 'n = 2');
    a.ok(Number.isNaN(Kin.fit([1, 1, 1], [1, 2, 3], { order: 0 }).k), 'one time only');
    a.ok(Number.isNaN(Kin.fit([0, 1, 2, 3], [1, -2, 3, 4], { order: 1, method: 'linear' }).k), 'ln of a negative value');
    a.ok(Number.isNaN(Kin.arrhenius([5], [0.1]).Ea), 'one temperature');
    a.ok(Kin.fit([0, 1, 2, 3, 'x'], [5, 4, 3, 2, 1], { order: 0 }).notes.length > 0, 'note for an omitted pair');
    const W = Kin.arrhenius([5, 15, 25], [0.01, 0.03, 0.08], { se: [0.001, 0, 0.004] });
    a.ok(!W.weighted && W.notes.length > 0, 'a zero SE: unweighted fit with a note');
    a.ok(Number.isNaN(Kin.aslt({}).estimate), 'ASLT without data');
  });

  TEST('kinetics', 'robustness: 300 noisy random data sets (up to 25 % noise), every order ends at a minimum', a => {
    /* harsher than the reference batch: noise up to 25 % of C0, 5–20 irregular times.
       Each fit must be finite and converged, and no step of 1e-4 (relative) in C0
       or k may lower the residual sum of squares (to 1e-12 relative). */
    const rng = Num.rng(20261004), M = (o, t, C0, k) => Kin.model(o, t, C0, k);
    for (let i = 0; i < 300; i++) {
      const gen = i % 3, up = Math.floor(i / 3) % 2 === 1, m = 5 + rng.int(16);
      const t = [0];
      for (let j = 1; j < m; j++) t.push(Math.round(rng() * 300) / 10);
      t.sort((x, y) => x - y);
      const tm = Math.max(t[t.length - 1], 1), C0 = 20 + 180 * rng(), f = 0.3 + 0.5 * rng(), gn = 0.3 + 1.2 * rng();
      const k = up ? [-gn * C0 / tm, -Math.log(1 + gn) / tm, (1 / (C0 * (1 + gn)) - 1 / C0) / tm][gen]
        : [f * C0 / tm, -Math.log(1 - f) / tm, (1 / (C0 * (1 - f)) - 1 / C0) / tm][gen];
      const noise = 0.005 + 0.245 * rng();
      const y = t.map(v => M(gen, v, C0, k) + noise * C0 * rng.normal());
      for (let o = 0; o < 3; o++) {
        const F = Kin.fit(t, y, { order: o });
        const rss = (c, kk) => y.reduce((s, v, j) => { const e = v - M(o, t[j], c, kk); return s + e * e; }, 0);
        let ok = F.converged && isFinite(F.C0) && isFinite(F.k) && isFinite(F.se.k);
        if (ok) {
          const S0 = rss(F.C0, F.k), h0 = 1e-4 * Math.abs(F.C0), h1 = 1e-4 * Math.max(Math.abs(F.k), 1e-12);
          for (const [dc, dk] of [[h0, 0], [-h0, 0], [0, h1], [0, -h1]]) {
            const S1 = rss(F.C0 + dc, F.k + dk);
            if (S1 === S1 && S1 < S0 * (1 - 1e-12)) ok = false;
          }
        }
        a.ok(ok, 'set ' + i + ' (generated order ' + gen + (up ? ', rising' : ', falling') + ', n = ' + m + '), fitted order ' + o);
      }
    }
  });
  TEST('kinetics', 'second order, rising attribute: the model is undefined beyond its pole', a => {
    const f = Kin.fit([0, 2, 4, 6, 8], [10, 11.2, 12.6, 14.6, 17.3], { order: 2 });
    a.ok(f.k < 0, 'k < 0');
    const pole = -1 / (f.C0 * f.k);
    a.ok(pole > 8, 'pole beyond the data');
    a.ok(Number.isNaN(f.predict(pole * 1.01)), 'NaN beyond the pole');
    a.ok(isFinite(f.predict(pole * 0.99)), 'finite before it');
  });

  /* ---------------- comparison with the reference values ---------------- */
  if (!REFK) { TEST('kinetics', 'reference values (ref_kinetics.js) are loaded', a => a.ok(false, 'window.REF.kinetics missing')); return; }

  const cmpNonlin = (a, f, r, lab) => {
    /* estimates: within 1e-7 relative or a millionth of their standard error */
    a.close(f.C0, r.C0, Math.max(1e-7 * Math.abs(r.C0), 1e-6 * r.se.C0), lab + ' C0');
    a.close(f.k, r.k, Math.max(1e-7 * Math.abs(r.k), 1e-6 * r.se.k), lab + ' k');
    a.rel(f.se.C0, r.se.C0, 1e-6, lab + ' se C0');
    a.rel(f.se.k, r.se.k, 1e-6, lab + ' se k');
    a.arrRel(f.ci.C0, r.ci.C0, 1e-7, lab + ' ci C0');
    a.arrRel(f.ci.k, r.ci.k, 1e-6, lab + ' ci k', Math.abs(r.k));
    a.arrRel([f.vcov[0][0], f.vcov[0][1], f.vcov[1][1]], [r.vcov[0][0], r.vcov[0][1], r.vcov[1][1]], 1e-6, lab + ' vcov');
    a.rel(f.rss, r.rss, 1e-9, lab + ' rss');
    a.rel(f.sigma, r.sigma, 1e-9, lab + ' sigma');
    a.eq(f.df, r.df, lab + ' df');
    a.close(f.aic, r.aic, 1e-7, lab + ' AIC');
    a.close(f.aicc, r.aicc, 1e-7, lab + ' AICc');
    a.close(f.bic, r.bic, 1e-7, lab + ' BIC');
    a.close(f.r2, r.r2, 1e-10, lab + ' r2');
    a.arrRel(f.fitted, r.fitted, 1e-7, lab + ' fitted', 1);
    a.arr(f.resid, r.resid, 1e-6, lab + ' resid');
    a.close(f.halfLife, num(r.halfLife), Math.abs(num(r.halfLife)) * 1e-7 || 0, lab + ' half-life');
    a.ok(f.converged, lab + ' converged');
    const P = f.predictCI(r.pred.t);
    a.arrRel(P.map(p => p.fit), nums(r.pred.fit), 1e-7, lab + ' pred fit');
    a.arrRel(P.map(p => p.se), nums(r.pred.se), 1e-6, lab + ' pred se');
    /* interval limits: relative to the larger of the limit and the half-width (a limit can be near 0) */
    const sc = P.map(p => Math.max(Math.abs(p.fit), p.hi - p.lo));
    P.forEach((p, i) => a.close(p.lo, num(r.pred.lo[i]), 1e-7 * sc[i], lab + ' pred lo[' + i + ']'));
    P.forEach((p, i) => a.close(p.hi, num(r.pred.hi[i]), 1e-7 * sc[i], lab + ' pred hi[' + i + ']'));
  };
  REFK.fits.concat(REFK.stress || []).forEach(D => {
    TEST('kinetics', 'nonlinear least squares, orders 0, 1, 2 vs reference · ' + D.id, a => {
      for (let o = 0; o < 3; o++) {
        const r = D.nonlin[o];
        if (!r) continue;
        cmpNonlin(a, Kin.fit(D.t, D.y, { order: o, method: 'nls' }), r, 'order ' + o + (r.via === 'levenberg-marquardt' ? ' (LM reference)' : ''));
      }
    });
    TEST('kinetics', 'time to the limit (delta method) vs reference fit reparametrised in t_L · ' + D.id, a => {
      for (let o = 0; o < 3; o++) {
        const r = D.nonlin[o];
        if (!r || !r.ttl) continue;
        const L = Kin.timeToLimit(Kin.fit(D.t, D.y, { order: o }), D.limit);
        a.close(L.t, num(r.ttl.t), Math.max(Math.abs(num(r.ttl.t)) * 1e-7, 1e-6 * num(r.ttl.se)) || 0, 'order ' + o + ' t_L');
        a.close(L.se, num(r.ttl.se), Math.abs(num(r.ttl.se)) * 1e-6 || 0, 'order ' + o + ' se');
        /* the limits t ± q·SE may sit near 0: the tolerance scales with t and with the half-width */
        const sc = Math.abs(num(r.ttl.t)) * 1e-7 + Math.abs(num(r.ttl.hi) - num(r.ttl.lo)) * 1e-6;
        a.close(L.lo, num(r.ttl.lo), sc || 0, 'order ' + o + ' lo');
        a.close(L.hi, num(r.ttl.hi), sc || 0, 'order ' + o + ' hi');
      }
    });
    TEST('kinetics', 'linearised fits (C, ln C, 1/C on t) vs reference least squares · ' + D.id, a => {
      for (let o = 0; o < 3; o++) {
        const r = D.lin[o], f = Kin.fit(D.t, D.y, { order: o, method: 'linear' });
        if (!r) { a.ok(Number.isNaN(f.k), 'order ' + o + ' undefined'); continue; }
        const lab = 'order ' + o;
        a.arrRel(f.lin.coef, r.coef, 1e-9, lab + ' coef', 1e-12);
        a.arrRel(f.lin.se, r.seCoef, 1e-9, lab + ' se coef');
        a.rel(f.C0, r.C0, 1e-9, lab + ' C0');
        a.rel(f.k, r.k, 1e-9, lab + ' k');
        a.rel(f.se.C0, r.se.C0, 1e-9, lab + ' se C0');
        a.rel(f.se.k, r.se.k, 1e-9, lab + ' se k');
        a.arrRel(f.ci.C0, r.ci.C0, 1e-9, lab + ' ci C0');
        a.arrRel(f.ci.k, r.ci.k, 1e-8, lab + ' ci k', Math.abs(r.k));
        a.arrRel([f.vcov[0][0], f.vcov[0][1], f.vcov[1][1]], [r.vcov[0][0], r.vcov[0][1], r.vcov[1][1]], 1e-9, lab + ' vcov');
        a.close(f.r2, r.r2, 1e-12, lab + ' r2');
        a.rel(f.sigma, r.sigma, 1e-9, lab + ' sigma');
        a.rel(f.rss, r.rss, 1e-9, lab + ' rss');
        a.close(f.aic, r.aic, 1e-8, lab + ' AIC (transformed scale)');
        a.arrRel(f.fitted, r.fitted, 1e-10, lab + ' fitted', 1);
        a.arr(f.resid, r.resid, 1e-8, lab + ' resid');
      }
    });
    TEST('kinetics', 'ΔAIC and Akaike weights of the three orders · ' + D.id, a => {
      const c = Kin.compare(D.t, D.y);
      a.arr(c.aic, nums(D.compare.aic), 1e-7, 'AIC');
      a.arr(c.deltaAIC, nums(D.compare.deltaAIC), 1e-7, 'ΔAIC');
      a.arr(c.weights, nums(D.compare.weights), 1e-9, 'weights');
      a.eq(c.best, D.compare.best, 'best order');
    });
  });

  REFK.arrhenius.forEach((D, i) => {
    TEST('kinetics', 'Arrhenius (ln k on 1/T − 1/Tref) vs reference · case ' + (i + 1) + (D.weights ? ' (weighted)' : ''), a => {
      const o = { Tref: i === 1 ? 25 : undefined };
      if (D.seK) o.se = D.seK;
      const A = Kin.arrhenius(D.Tc, D.k, o);
      a.rel(A.TrefC + 273.15, D.TrefC + 273.15, 1e-14, 'T_ref');
      a.rel(A.Ea, D.Ea, 1e-9, 'Ea'); a.rel(A.EaKJ, D.EaKJ, 1e-9, 'Ea kJ');
      a.rel(A.se.Ea, D.seEa, 1e-9, 'se Ea');
      a.arrRel(A.ci.Ea, D.ciEa, 1e-8, 'ci Ea');
      a.rel(A.kRef, D.kRef, 1e-9, 'k_ref'); a.rel(A.se.lnKRef, D.seLnKRef, 1e-9, 'se ln k_ref');
      a.arrRel(A.ci.kRef, D.ciKRef, 1e-8, 'ci k_ref');
      a.rel(A.lnA, D.lnA, 1e-9, 'ln A'); a.rel(A.se.lnA, D.seLnA, 1e-9, 'se ln A');
      a.arrRel(A.ci.lnA, D.ciLnA, 1e-8, 'ci ln A');
      a.close(A.r2, D.r2, 1e-12, 'r2'); a.eq(A.df, D.df, 'df'); a.rel(A.sigma, D.sigma, 1e-9, 'sigma');
      const P = A.predict(D.Tnew);
      a.arrRel(P.map(p => p.lnk), D.pred.lnk, 1e-10, 'pred ln k');
      a.arrRel(P.map(p => p.se), D.pred.se, 1e-9, 'pred se');
      a.arrRel(P.map(p => p.k), D.pred.k, 1e-9, 'pred k');
      a.arrRel(P.map(p => p.lo), D.pred.lo, 1e-8, 'pred lo');
      a.arrRel(P.map(p => p.hi), D.pred.hi, 1e-8, 'pred hi');
      a.arrRel(A.q10At(D.Tnew), D.q10, 1e-9, 'Q10 at T');
      if (D.predP) {
        const PP = A.predict(D.Tnew, { interval: 'prediction' });
        a.arrRel(PP.map(p => p.lo), D.predP.lo, 1e-8, 'prediction lo');
        a.arrRel(PP.map(p => p.hi), D.predP.hi, 1e-8, 'prediction hi');
      }
    });
  });
  TEST('kinetics', 'Q10 vs reference computation', a => {
    REFK.q10.forEach((D, i) => {
      const v = D.Ea != null ? Kin.q10FromEa(D.Ea, D.Tc) : Kin.q10(D.k1, D.T1, D.k2, D.T2);
      a.rel(v, D.q, 1e-13, 'case ' + (i + 1));
    });
  });
  REFK.belehradek.forEach((D, i) => {
    TEST('kinetics', 'square-root model vs reference (√k on T, linear and nonlinear) · case ' + (i + 1), a => {
      const B = Kin.belehradek(D.Tc, D.k);
      a.rel(B.b, D.lmB, 1e-10, 'b (linear)'); a.rel(B.Tmin, D.lmTmin, 1e-10, 'Tmin (linear)');
      a.rel(B.b, D.b, 1e-7, 'b (nonlinear)'); a.rel(B.Tmin, D.Tmin, 1e-7, 'Tmin (nonlinear)');
      a.rel(B.se.b, D.seB, 1e-6, 'se b'); a.rel(B.se.Tmin, D.seTmin, 1e-6, 'se Tmin (delta = nonlinear)');
      a.arrRel(B.ci.b, D.ciB, 1e-7, 'ci b'); a.arrRel(B.ci.Tmin, D.ciTmin, 1e-6, 'ci Tmin', Math.abs(D.Tmin));
      a.close(B.r2, D.r2, 1e-12, 'r2'); a.rel(B.sigma, D.sigma, 1e-9, 'sigma'); a.eq(B.df, D.df, 'df');
      const P = B.predict(D.Tnew);
      a.arrRel(P.map(p => p.k), D.pred.k, 1e-9, 'pred k', 1e-12);
      a.arrRel(P.map(p => p.lo), D.pred.lo, 1e-8, 'pred lo', 1e-12);
      a.arrRel(P.map(p => p.hi), D.pred.hi, 1e-8, 'pred hi', 1e-12);
    });
  });
  TEST('kinetics', 'ASLT, prediction interval vs reference', a => {
    REFK.aslt.forEach(D => {
      const lab = D.model + ' at ' + D.Ttarget + ' °C';
      const r = Kin.aslt({ Tc: D.Tc, shelfLife: D.shelfLife, Ttarget: D.Ttarget, model: D.model });
      a.rel(r.estimate, D.estimate, 1e-9, lab + ' estimate');
      a.rel(r.lo, D.lo, 1e-8, lab + ' lo'); a.rel(r.hi, D.hi, 1e-8, lab + ' hi');
      a.arrRel(r.ciMean, D.ciMean, 1e-8, lab + ' ci of the mean');
      a.rel(r.seMean, D.seMean, 1e-9, lab + ' se of the mean');
      a.rel(r.Ea, D.Ea, 1e-9, lab + ' Ea'); a.rel(r.Q10, D.Q10, 1e-9, lab + ' Q10');
      a.rel(r.slope, D.slope, 1e-9, lab + ' slope');
      a.close(r.r2, D.r2, 1e-12, lab + ' r2'); a.rel(r.sigma, D.sigma, 1e-9, lab + ' sigma'); a.eq(r.df, D.df, lab + ' df');
    });
  });
  REFK.shelf.forEach(D => {
    TEST('kinetics', 'shelf life at any temperature (order-1 fits + Arrhenius' + (D.weighted ? ', weighted' : '') + ')', a => {
      const fits = D.sets.map(s => Kin.fit(s.t, s.y, { order: 1 }));
      a.arrRel(fits.map(f => f.k), D.k, 1e-7, 'k per temperature');
      a.arrRel(fits.map(f => f.se.k), D.seK, 1e-6, 'se k per temperature');
      const s = Kin.shelfLifeAt({ Tc: D.sets.map(x => x.Tc), fits }, D.Tnew, D.limit, { weighted: D.weighted });
      a.rel(s.C0, D.C0, 1e-7, 'mean C0');
      a.rel(s.arrhenius.Ea, D.Ea, 1e-6, 'Ea');
      a.arrRel(s.result.map(p => p.k), D.kp, 1e-6, 'k(T)');
      a.arrRel(s.result.map(p => p.kLo), D.klo, 1e-6, 'k lo');
      a.arrRel(s.result.map(p => p.kHi), D.khi, 1e-6, 'k hi');
      a.arrRel(s.result.map(p => p.t), D.t, 1e-6, 'θ(T)');
      a.arrRel(s.result.map(p => p.lo), D.lo, 1e-6, 'θ lo');
      a.arrRel(s.result.map(p => p.hi), D.hi, 1e-6, 'θ hi');
    });
  });
})();
