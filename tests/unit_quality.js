/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   Tests of colour (js/color.js), quality indices (js/quality.js), respiration and
   atmospheres (js/resp.js), losses and damage (js/losses.js) and logistics
   (js/logistics.js): references of tests/validacion/color_losses.R, published
   values and hand calculations written out in each test. */
(function () {
'use strict';
const R = () => (window.REF && window.REF.colorLosses) || null;

TEST('color', 'sRGB → CIELAB against an independent implementation (0.02 units: its sRGB matrix carries more decimals than the 4 of the standard)', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  r.color.rgb.forEach((c, i) => {
    const L = Color.rgbToLab(c[0], c[1], c[2]);
    a.arr(L, r.color.labF[i], 0.02, 'reference ' + c.join(','));
  });
});
TEST('color', 'ΔE*ab and LCh written out (1e-9); ΔE94 and ΔE00 against an independent implementation (1e-5)', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  r.color.lab1.forEach((x, i) => {
    const y = r.color.lab2[i];
    a.close(Color.dE76(...x, ...y), r.color.de76[i], 1e-9, 'dE76 #' + i);
    a.close(Color.dE94(...x, ...y), r.color.de94[i], 1e-5, 'dE94 #' + i);
    a.close(Color.dE00(...x, ...y), r.color.de00[i], 1e-5, 'dE00 #' + i);
    const lch = Color.labToLch(...x);
    a.close(lch[1], r.color.lch[i][1], 1e-9, 'C* #' + i); a.close(lch[2], r.color.lch[i][2], 1e-9, 'h #' + i);
  });
});
TEST('color', 'CIEDE2000 test pairs of Sharma, Wu and Dalal 2005 (4 decimals as published)', a => {
  const P = [[[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425], [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
    [[50, 2.8361, -74.02], [50, 0, -82.7485], 3.4412], [[50, 0, 0], [50, -1, 2], 2.3669], [[50, 2.5, 0], [73, 25, -18], 27.1492],
    [[50, 2.5, 0], [61, -5, 29], 22.8977], [[50, 2.5, 0], [56, -27, -3], 31.903], [[50, 2.5, 0], [58, 24, 15], 19.4535],
    [[50, 2.5, 0], [50, 3.1736, 0.5854], 1], [[50, 2.5, 0], [50, 3.2972, 0], 1], [[50, 2.5, 0], [50, 1.8634, 0.5757], 1],
    [[50, 2.5, 0], [50, 3.2592, 0.335], 1], [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
    [[63.0109, -31.0961, -5.8663], [62.8187, -29.7946, -4.0864], 1.263], [[61.2901, 3.7196, -5.3901], [61.4292, 2.248, -4.962], 1.8731],
    [[35.0831, -44.1164, 3.7933], [35.0232, -40.0716, 1.5901], 1.8645], [[22.7233, 20.0904, -46.694], [23.0331, 14.973, -42.5619], 2.0373],
    [[36.4612, 47.858, 18.3852], [36.2715, 50.5065, 21.2231], 1.4146], [[90.8027, -2.0831, 1.441], [91.1528, -1.6435, 0.0447], 1.4441],
    [[90.9257, -0.5406, -0.9208], [88.6381, -0.8985, -0.7239], 1.5381], [[6.7747, -0.2908, -2.4247], [5.8714, -0.0985, -2.2286], 0.6377],
    [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082]];
  P.forEach(([x, y, v], i) => { a.close(Color.dE00(...x, ...y), v, 5e-5, 'pair ' + (i + 1)); a.close(Color.dE00(...y, ...x), v, 5e-5, 'pair ' + (i + 1) + ' swapped'); });
});
TEST('color', 'round trips, hexadecimal codes and the colour indices written out', a => {
  for (let r = 0; r <= 255; r += 51) for (let gg = 0; gg <= 255; gg += 51) for (let b = 0; b <= 255; b += 51) {
    const L = Color.rgbToLab(r, gg, b), back = Color.labToRgb(...L);
    a.arr(back.rgb, [r, gg, b], 1e-6, 'round trip ' + [r, gg, b]);
  }
  a.eq(Color.rgbToHex(239, 108, 0), '#EF6C00', 'hex'); a.eq(Color.hexToRgb('#7cb342'), [124, 179, 66], 'hex → rgb');
  a.close(Color.rgbToLab(255, 255, 255)[0], 100, 1e-9, 'white L*');
  a.ok(!Color.labToRgb(60, 90, 80).inGamut, 'out of gamut detected');
  const h = Color.labToHex(60, 90, 80); a.ok(/^#[0-9A-F]{6}$/.test(h.hex) && !h.inGamut, 'displayable colour for an out-of-gamut L*a*b*');
  const I = Color.indices(60, 20, 40);
  a.close(I.cci, 1000 * 20 / (60 * 40), 1e-12, 'CCI'); a.close(I.aOverB, 0.5, 1e-12, 'a*/b*');
  const x = (20 + 1.75 * 60) / (5.645 * 60 + 20 - 3.012 * 40);
  a.close(I.bi, 100 * (x - 0.31) / 0.17, 1e-12, 'browning index');
  a.close(I.h, Math.atan2(40, 20) * 180 / Math.PI, 1e-12, 'hue');
  a.close(Color.hue(-10, -10), 225, 1e-12, 'hue third quadrant');
});

TEST('quality', 'acidity, ratio, BrimA, moisture, firmness, weight loss (hand calculations)', a => {
  /* 10 g of pulp, 8.2 mL of 0.1 N NaOH, citric acid: 8.2·0.1·0.064·100/10 = 0.5248 % */
  a.close(Quality.titratableAcidity({ volume: 8.2, normality: 0.1, sample: 10, acid: 'citric' }), 0.5248, 1e-12, 'TA citric');
  /* with dilution: 25 g made up to 250 mL, aliquot 50 mL, 6 mL of 0.1 N, malic */
  a.close(Quality.titratableAcidity({ volume: 6, normality: 0.1, sample: 25, totalVolume: 250, aliquot: 50, acid: 'malic' }), 6 * 0.1 * 0.067 * 5 * 100 / 25, 1e-12, 'TA with dilution');
  a.close(Quality.convertAcid(0.64, 'citric', 'malic'), 0.67, 1e-12, 'citric → malic');
  a.close(Quality.ratio(15, 0.5), 30, 1e-12, 'SSC/TA'); a.close(Quality.brimA(15, 0.5), 14, 1e-12, 'BrimA');
  const m = Quality.moisture(50, 7.5);
  a.close(m.wetBasis, 85, 1e-12, 'moisture'); a.close(m.dryMatter, 15, 1e-12, 'dry matter'); a.close(m.dryBasis, 566.6666666666666, 1e-9, 'dry basis');
  a.close(Quality.convertForce(10, 'kgf', 'N'), 98.0665, 1e-12, 'kgf → N'); a.close(Quality.convertForce(1, 'lbf', 'N'), 4.4482216152605, 1e-12, 'lbf');
  a.close(Quality.pressure(100, 8), 100 / (Math.PI * 16) * 1000, 1e-9, 'pressure');
  const wl = Quality.weightLossSeries([0, 1, 2, 3], [200, 199, 198.1, 197]);
  a.close(wl.loss[3], 1.5, 1e-12, 'loss %');
  a.close(wl.rate, (0.5 * 1 + 0.95 * 2 + 1.5 * 3) / 14, 1e-12, 'rate through the origin');
});
TEST('quality', 'scales of damage (McKinney) and grading by size', a => {
  const cls = [0, 1, 2, 3, 4].map(v => ({ value: v }));
  const s = Quality.scaleIndex(cls, [50, 20, 15, 10, 5], 1);
  a.close(s.index, 100 * (20 + 30 + 30 + 20) / (100 * 4), 1e-12, 'McKinney index');
  a.close(s.meanGrade, 1, 1e-12, 'mean grade'); a.close(s.incidence, 50, 1e-12, 'incidence'); a.close(s.marketable, 70, 1e-12, 'marketable');
  const c = Quality.calibre([180, 210, 260, 300, 410, 450, 520, 90], [{ name: 'S', min: 150, max: 250 }, { name: 'M', min: 250, max: 400 }, { name: 'L', min: 400, max: 600 }]);
  a.eq(c.counts, [2, 2, 3], 'counts'); a.eq(c.out, 1, 'outside'); a.eq(c.mode, 'L', 'modal class');
  const cc = Quality.countClasses(4, [8, 10, 12]);
  a.eq(cc.map(x => x.name), ['8', '10', '12'], 'count classes');
  a.close(cc[1].max, 450, 1e-9, 'edge between 8 and 10');
});

TEST('resp', 'closed and flow-through systems, respiratory quotient, heat (hand calculations)', a => {
  /* a jar with 3.15 L free, 0.65 kg, CO₂ rising 0.5 %/h at 20 °C */
  const Vm = 8.314462618 * 293.15 / 101.325;
  const r = Resp.closed({ t: [0, 1, 2], co2: [0.04, 0.54, 1.04], o2: [20.95, 20.4, 19.85], c2h4: [0.02, 0.12, 0.22], mass: 0.65, free: 3.15, temp: 20 });
  a.close(r.co2.mlKgH, 0.5 / 100 * 3.15 * 1000 / 0.65, 1e-9, 'mL CO2/kg h');
  a.close(r.co2.mgKgH, 0.5 / 100 * 3.15 / Vm * 44.0095 * 1000 / 0.65, 1e-9, 'mg CO2/kg h');
  a.close(r.o2.mlKgH, 0.55 / 100 * 3.15 * 1000 / 0.65, 1e-9, 'mL O2/kg h');
  a.close(r.rq, 0.5 / 0.55, 1e-12, 'RQ');
  a.close(r.c2h4.ulKgH, 0.1 * 3.15 / 0.65, 1e-12, 'ethylene');
  a.close(Resp.respHeat(100).wPerT, 100 * 2816000 / (6 * 44.0095 * 1000) * 1000 / 3600, 1e-9, 'heat W/t');
  const f = Resp.flow({ co2In: 0.04, co2Out: 0.54, o2In: 20.95, o2Out: 20.4, flow: 100, mass: 2, temp: 20 });
  a.close(f.co2.mlKgH, 0.5 / 100 * 6000 / 2, 1e-12, 'flow mL/kg h');
});
TEST('resp', 'packaging at steady state, thickness, β line, cooling times', a => {
  const film = { o2: 195000, co2: 975000 };
  const o = { rO2: 10, rCO2: 9, mass: 1, area: 0.12, thickness: 25, film };
  const s = Resp.mapSteady(o);
  /* 10 mL/kg h · 1 kg · 24 = 240 mL/d; permeance 7800 mL/m² d atm · 0.12 m² = 936 mL/d atm → ΔO₂ = 0.2564 atm */
  a.close(s.o2In, 20.95 - 100 * 240 / 936, 1e-9, 'O2 inside');
  a.close(s.co2In, 0.04 + 100 * 216 / (975000 / 25 * 0.12), 1e-9, 'CO2 inside');
  const L = Resp.mapThickness({ rO2: 10, mass: 1, area: 0.12, film, targetO2: 5 });
  a.close(Resp.mapSteady(Object.assign({}, o, { thickness: L })).o2In, 5, 1e-9, 'thickness hits the target');
  a.close(Resp.betaLine(5, 1, 5), 0.04 + 15.95 / 5, 1e-12, 'β line');
  /* O₂-limited respiration: the steady state satisfies both balances */
  const mm = Resp.mapSteady(Object.assign({}, o, { mm: { vm: 12, km: 2, ki: 8 }, rq: 0.9 }));
  a.close(mm.rO2, 12 * mm.o2In / (2 + mm.o2In * (1 + mm.co2In / 8)), 1e-9, 'Michaelis–Menten rate');
  a.close(mm.o2In, 20.95 - 100 * mm.rO2 * 24 * 25 / (195000 * 0.12), 1e-6, 'O2 balance');
  const c = Resp.cooling([0, 1, 2, 3, 4], [30, 30 - 25 * (1 - Math.pow(0.5, 1 / 1.5)), 30 - 25 * (1 - Math.pow(0.5, 2 / 1.5)), 30 - 25 * (1 - Math.pow(0.5, 3 / 1.5)), 30 - 25 * (1 - Math.pow(0.5, 4 / 1.5))], 5);
  a.close(c.half, 1.5, 1e-9, 'half-cooling time'); a.close(c.sevenEighths, 4.5, 1e-9, 'seven-eighths');
  a.close(Resp.cpSiebel(90), 3.852, 1e-12, 'cp Siebel');
  const ld = Resp.refrigLoad({ mass: 1000, ti: 30, tf: 5, cp: 3.85, hours: 4, extra: 0 });
  a.close(ld.kW, 1000 * 3.85 * 25 / (4 * 3600), 1e-9, 'kW');
});
TEST('resp', 'climacteric classification on the example curve and on a flat one', a => {
  const D = Datasets.rows('aguacateClimaterico');
  const c = Resp.climacteric(D.map(r => r.dia), D.map(r => r.respiracion_mg), D.map(r => r.etileno_ul));
  a.eq(c.type, 'climacteric', 'avocado');
  const f = Resp.climacteric([0, 1, 2, 3, 4, 5], [40, 38, 36, 35, 33, 31], [0.05, 0.05, 0.06, 0.05, 0.05, 0.05]);
  a.eq(f.type, 'nonclimacteric', 'flat and falling');
});

TEST('losses', 'chain, Pareto, simulation (hand calculations)', a => {
  const st = [{ name: 'A', pct: 10, price: 5 }, { name: 'B', pct: 20, price: 8 }, { name: 'C', kg: 50, price: 12 }];
  const ch = Loss.chain(st, 1000);
  a.close(ch.rows[0].lost, 100, 1e-12, 'A'); a.close(ch.rows[1].lost, 180, 1e-12, 'B'); a.close(ch.rows[2].lost, 50, 1e-12, 'C (kg)');
  a.close(ch.delivered, 670, 1e-12, 'delivered'); a.close(ch.lossIndex, 33, 1e-12, 'loss index');
  a.close(ch.value, 100 * 5 + 180 * 8 + 50 * 12, 1e-12, 'value');
  a.eq(ch.byKg[0].name, 'B', 'Pareto first');
  const s = Loss.simulate(st, 1000, 1, 50);
  a.close(s.alt.rows[1].lost, 90, 1e-12, 'B halved'); a.close(s.gainKg, 90, 1e-12, 'gain kg'); a.close(s.gainValue, 90 * 12, 1e-12, 'gain value');
});
TEST('losses', 'damage curves and logistic dose with Fieller interval against R (1e-6)', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  const d = r.damage, ms = Loss.damageModels(d.x, d.y);
  const M = id => ms.find(m => m.id === id);
  a.arr(M('linear').coef, d.linear.coef, 1e-9, 'linear'); a.arr(M('linear').se, d.linear.se, 1e-9, 'linear se');
  a.close(M('linear').r2, d.linear.r2, 1e-12, 'linear r2'); a.close(M('linear').aic, d.linear.aic, 1e-9, 'linear AIC');
  a.arr(M('quadratic').coef, d.quadratic.coef, 1e-9, 'quadratic'); a.close(M('quadratic').aic, d.quadratic.aic, 1e-9, 'quadratic AIC');
  a.arr(M('power').coef, d.power.coef, 1e-9, 'power'); a.arr(M('exponential').coef, d.exponential.coef, 1e-9, 'exponential');
  const lg = Loss.logistic(d.x, d.inc);
  a.arr(lg.coef, d.glm.coef, 1e-6, 'glm'); a.arr(lg.se, d.glm.se, 1e-6, 'glm se'); a.close(lg.deviance, d.glm.deviance, 1e-6, 'deviance');
  const e50 = lg.dose(0.5), e10 = lg.dose(0.1);
  a.arr([e50.est, e50.lo, e50.hi], d.glm.ed50, 1e-5, 'ED50 Fieller'); a.arr([e10.est, e10.lo, e10.hi], d.glm.ed10, 1e-5, 'ED10 Fieller');
});

TEST('logistics', 'psychrometrics against the published tables (ASHRAE 2017, ch. 1, table 3) and identities', a => {
  /* saturation pressure, kPa (4 decimals as tabulated): 0 °C 0.6112, 5 °C 0.8726, 20 °C 2.3392, 30 °C 4.2467; −10 °C over ice 0.2599 */
  /* within 0.02 %: the rounding of the table and the small difference between formulations */
  [[0, 0.6112], [5, 0.8726], [20, 2.3392], [30, 4.2467], [-10, 0.2599]].forEach(([t, v]) => a.rel(Logi.pws(t) / 1000, v, 2e-4, 'pws ' + t));
  const s = Logi.air(20, 100);
  /* the ideal-gas humidity ratio; the table (0.014758) adds the enhancement factor of real moist air, about 0.44 % */
  a.close(s.W, 0.621945 * Logi.pws(20) / (101325 - Logi.pws(20)), 1e-15, 'Ws at 20 °C (ideal gas)');
  a.rel(s.W, 0.014758, 0.006, 'Ws against the real-gas table');
  a.close(s.dew, 20, 1e-9, 'saturated: dew point = dry bulb'); a.close(s.wet, 20, 1e-9, 'saturated: wet bulb = dry bulb');
  const m = Logi.air(25, 50);
  a.close(m.dew, 13.86, 0.02, 'dew point 25 °C 50 %');
  a.close(m.wet, 17.9, 0.1, 'wet bulb 25 °C 50 %');
  a.close(m.vpd, Logi.pws(25) * 0.5, 1e-9, 'VPD');
  a.close(Logi.waterLoss(42, 1000), 42 * 0.001 * 86400 / 1e6 * 100, 1e-12, 'water loss % per day');
});
TEST('logistics', 'pallets, vents, conversions, cost, compatibility', a => {
  /* 40 × 30 boxes on 120 × 100: 10 per layer by the two-block pattern (one orientation gives 9) */
  const L = Logi.layer(120, 100, 40, 30);
  a.eq(L.n, 10, '40 × 30 on 120 × 100');
  a.eq(Logi.layer(120, 80, 40, 30).n, 8, '40 × 30 on 120 × 80');
  const p = Logi.pallet({ pallet: { L: 120, W: 100, H: 15 }, box: { l: 40, w: 30, h: 20, kg: 10 }, maxHeight: 215, maxKg: 900 });
  a.eq(p.layers, 9, 'layers by weight (10 high, 9 by weight)'); a.ok(p.limitedByWeight, 'limited by weight');
  a.close(Logi.ventPct([{ shape: 'circle', a: 2, count: 10 }], { a: 40, b: 20 }), 100 * 10 * Math.PI / 800, 1e-12, 'vent %');
  a.close(Logi.holeArea({ shape: 'oblong', a: 6, b: 2 }), 4 * 2 + Math.PI, 1e-12, 'oblong');
  a.close(Logi.convert('temperature', 212, 'F', 'C'), 100, 1e-12, '°F → °C');
  a.close(Logi.convert('pressure', 1, 'atm', 'kPa'), 101.325, 1e-12, 'atm → kPa');
  a.close(Logi.convert('length', 1, 'mil', 'um'), 25.4, 1e-12, 'mil → µm');
  const c = Logi.storageCost({ kWhDay: 100, tariff: 2, labourDay: 300, capitalYear: 36500, capacity: 50, occupancy: 80 });
  a.close(c.total, 200 + 300 + 100, 1e-12, 'daily cost'); a.close(c.perUnit, 600 / 40, 1e-12, 'per pallet');
  const P = id => Logi.PRODUCTS.find(x => x.id === id);
  const ab = Logi.pairIssues(P('manzana'), P('lechuga'));
  a.ok(ab.some(x => x.k === 'eth' && x.level === 'bad'), 'apple + lettuce: ethylene');
  const bt = Logi.pairIssues(P('platano'), P('lechuga'));
  a.ok(bt.some(x => x.k === 'temp' && x.level === 'bad'), 'banana + lettuce: temperature');
  a.eq(Logi.pairIssues(P('lechuga'), P('brocoli')).length, 0, 'lettuce + broccoli compatible');
});
TEST('losses', 'damage curves: shown coefficients are a = e^(ln a) and b; susceptibility in mm³/J', a => {
  const r = R(); if (!r) { a.ok(false, 'no reference'); return; }
  const d = r.damage, ms = Loss.damageModels(d.x, d.y), M = id => ms.find(m => m.id === id);
  a.close(M('power').shown[0], Math.exp(d.power.coef[0]), 1e-9, 'power a'); a.close(M('power').shown[1], d.power.coef[1], 1e-9, 'power b');
  a.close(M('exponential').shown[0], Math.exp(d.exponential.coef[0]), 1e-9, 'exponential a');
  a.arr(M('linear').shown, d.linear.coef, 1e-9, 'linear shown = coef');
  /* the curve passes through its own coefficients: a·1ᵇ = a, a·e⁰ = a */
  a.close(M('power').predict(1), M('power').shown[0], 1e-12, 'power at x = 1'); a.close(M('exponential').predict(0), M('exponential').shown[0], 1e-12, 'exponential at x = 0');
  const s = Loss.susceptibilityMean([20, 0, 30, null, 10], [0.2, 0.3, 0.3, 0.4, 0]);
  a.eq(s.n, 2, 'only bruised fruit with a positive energy'); a.close(s.value, 100, 1e-12, 'mean of 20/0.2 and 30/0.3');
  a.close(Loss.dropEnergy(0.147, 20), 0.2883, 5e-5, 'm·g·h of the example (energia_J column)');
});
TEST('logistics', 'ranges with the true minus sign, one ppm unit', a => {
  a.eq(Logi.range(0, 0, '°C'), '0 °C', 'equal ends'); a.eq(Logi.range(-1, 4, '°C'), '−1 a 4 °C', 'negative end, es');
  a.eq(Logi.range(-1, 4, '°C', 1), '−1 to 4 °C', 'negative end, en'); a.eq(Logi.range(85, 90, '%'), '85–90 %', 'en dash');
  const P = id => Logi.PRODUCTS.find(x => x.id === id);
  const t = Logi.pairIssues(P('manzana'), P('platano')).find(x => x.k === 'temp');
  a.ok(t && t.es.includes('−1 a 4 °C') && !/-\d/.test(t.es + t.en), 'apple range in the sentence, no hyphen-minus');
  a.ok(!('ulL' in Logi.UNITS.concentration), 'µL/L is ppm, listed once');
});
})();
