/* PostHarvestPro — postharvest physiology and technology, quality, shelf life
   and sensory evaluation, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; see the GNU General Public License, in the file LICENSE at the root
   of this program, or <https://www.gnu.org/licenses/>. */

/* PostHarvestPro — packaging, cold storage and logistics.

   · Boxes per pallet layer by the best of the one-block and two-block
     patterns (the guillotine heuristics of Steudel 1979, Manage. Sci.
     25:997–1004, and Smith and De Cani 1980, J. Oper. Res. Soc. 31:573–578),
     layers under a height limit, weight limit; pallets per container.
   · Vent area of a box (% of each face), with the ≥ 5 % that forced-air
     cooling asks for (Thompson et al. 2008, UC ANR 21567).
   · Psychrometrics of the cold room with the ideal-gas relations of the
     ASHRAE Handbook — Fundamentals (2017, ch. 1): humidity ratio, dew point,
     wet bulb, enthalpy, specific volume, vapour-pressure deficit of the air
     and between product and air; water loss as transpiration coefficient ×
     deficit (Sastry, Baird and Buffington 1978, ASHRAE Trans. 84:237–255).
   · Cost of storage per day and per unit.
   · Storage compatibility: temperature and humidity ranges that must
     overlap, ethylene producers next to sensitive products, chilling
     injury, odour transfer (Kader 2002, UC ANR 3311; Gross, Wang and Saltveit
     2016, USDA Agric. Handb. 66; McGregor 1989, USDA Agric. Handb. 668). The
     table of products holds orientative values to be adjusted. */
function LogiCore(g) {
'use strict';
const Num = g.Num;
const Lg = {};
const { floor, max, min, exp, log, abs, PI } = Math;

/* ---------------- boxes on a pallet ----------------
   2D: how many l × w rectangles fit in an L × W area, both orientations,
   splitting the area once along its length or its width (two blocks, each
   with its own orientation). Returns the count and the blocks. */
Lg.layer = function (L, W, l, w) {
  const fit = (A, B, a, b) => floor(A / a) * floor(B / b);
  let best = { n: 0, blocks: [] };
  const consider = (n, blocks) => { if (n > best.n) best = { n, blocks }; };
  consider(fit(L, W, l, w), [{ x: 0, y: 0, L, W, a: l, b: w }]);
  consider(fit(L, W, w, l), [{ x: 0, y: 0, L, W, a: w, b: l }]);
  /* split along the length at a multiple of the box side used on the left */
  [[l, w], [w, l]].forEach(([a, b]) => {
    for (let k = 1; k * a <= L; k++) {
      const x = k * a, n1 = floor(W / b) * k, n2 = fit(L - x, W, b, a);
      consider(n1 + n2, [{ x: 0, y: 0, L: x, W, a, b }, { x, y: 0, L: L - x, W, a: b, b: a }]);
    }
    for (let k = 1; k * b <= W; k++) {
      const y = k * b, n1 = floor(L / a) * k, n2 = fit(L, W - y, b, a);
      consider(n1 + n2, [{ x: 0, y: 0, L, W: y, a, b }, { x: 0, y, L, W: W - y, a: b, b: a }]);
    }
  });
  best.area = best.n * l * w / (L * W) * 100;
  return best;
};
/* o: { pallet: {L, W, H (deck height)}, box: {l, w, h, kg}, maxHeight (cm, with the pallet), maxKg } */
Lg.pallet = function (o) {
  const lay = Lg.layer(o.pallet.L, o.pallet.W, o.box.l, o.box.w);
  let layers = floor((o.maxHeight - (o.pallet.H || 0)) / o.box.h);
  let byWeight = Infinity;
  if (o.maxKg && o.box.kg) byWeight = floor(o.maxKg / (o.box.kg * max(1, lay.n)));
  const limitedByWeight = byWeight < layers;
  layers = max(0, min(layers, byWeight));
  const boxes = lay.n * layers;
  return { perLayer: lay.n, layers, boxes, kg: boxes * (o.box.kg || 0), height: (o.pallet.H || 0) + layers * o.box.h, areaUse: lay.area, blocks: lay.blocks, limitedByWeight };
};
Lg.PALLETS = [
  { id: 'iso', es: 'ISO 120 × 100 cm', en: 'ISO 120 × 100 cm', L: 120, W: 100, H: 15 },
  { id: 'eur', es: 'Europeo 120 × 80 cm', en: 'European 120 × 80 cm', L: 120, W: 80, H: 14.4 },
  { id: 'us', es: 'Norteamericano 121.9 × 101.6 cm (48 × 40 in)', en: 'North American 121.9 × 101.6 cm (48 × 40 in)', L: 121.9, W: 101.6, H: 14 },
];
/* interior dimensions (cm) and payload (kg) of refrigerated containers; check
   the carrier's sheet: they vary with the make */
Lg.CONTAINERS = [
  { id: 'rf20', es: 'Refrigerado de 20 pies', en: '20 ft reefer', L: 544, W: 229, H: 227, kg: 27000 },
  { id: 'rf40', es: 'Refrigerado de 40 pies, cubo alto', en: '40 ft high-cube reefer', L: 1158, W: 229, H: 255, kg: 29000 },
  { id: 'truck', es: 'Caja refrigerada de 53 pies', en: '53 ft refrigerated trailer', L: 1590, W: 249, H: 259, kg: 20000 },
];
Lg.container = function (o) {
  const lay = Lg.layer(o.container.L, o.container.W, o.pallet.L, o.pallet.W);
  const tiers = o.stack ? max(1, floor(o.container.H / o.palletHeight)) : 1;
  let pallets = lay.n * tiers;
  const byWeight = o.palletKg ? floor(o.container.kg / o.palletKg) : Infinity;
  const limitedByWeight = byWeight < pallets;
  pallets = min(pallets, byWeight);
  return { perFloor: lay.n, tiers, pallets, kg: pallets * (o.palletKg || 0), areaUse: lay.area, blocks: lay.blocks, limitedByWeight, boxes: pallets * (o.boxesPerPallet || 0) };
};

/* ---------------- vents ----------------
   holes: [{shape:'rect'|'circle'|'oblong', a, b, count}] (cm; a = length or
   diameter, b = width); face: {a, b} (cm) */
Lg.holeArea = h => {
  if (h.shape === 'circle') return PI * h.a * h.a / 4;
  if (h.shape === 'oblong') return (h.a - h.b) * h.b + PI * h.b * h.b / 4;
  return h.a * h.b;
};
Lg.ventPct = (holes, face) => 100 * holes.reduce((s, h) => s + Lg.holeArea(h) * (+h.count || 0), 0) / (face.a * face.b);

/* ---------------- psychrometrics ----------------
   Saturation pressure (Pa) over liquid water by the auxiliary equation of
   Wagner and Pruss (2002, J. Phys. Chem. Ref. Data 31:387–535) and over ice
   by the sublimation equation of Wagner, Riethmann, Feistel and Harvey
   (2011, J. Phys. Chem. Ref. Data 40:043103), the ones behind the 2017 tables. */
Lg.pws = function (tc) {
  const T = tc + 273.15;
  if (tc >= 0) {
    const Tc = 647.096, pc = 22.064e6, t = 1 - T / Tc;
    const s = -7.85951783 * t + 1.84408259 * Math.pow(t, 1.5) - 11.7866497 * t * t * t + 22.6807411 * Math.pow(t, 3.5) - 15.9618719 * Math.pow(t, 4) + 1.80122502 * Math.pow(t, 7.5);
    return pc * exp(Tc / T * s);
  }
  const th = T / 273.16;
  return 611.657 * exp((-21.2144006 * Math.pow(th, 0.00333333333) + 27.3203819 * Math.pow(th, 1.20666667) - 6.1059813 * Math.pow(th, 1.70333333)) / th);
};
/* the state of moist air at dry bulb t (°C), relative humidity rh (%), pressure p (kPa) */
Lg.air = function (tc, rh, kPa) {
  const p = (kPa || 101.325) * 1000, ps = Lg.pws(tc), pw = rh / 100 * ps;
  const W = 0.621945 * pw / (p - pw);                  /* kg water / kg dry air */
  const h = 1.006 * tc + W * (2501 + 1.86 * tc);        /* kJ / kg dry air */
  const v = 0.287042 * (tc + 273.15) * (1 + 1.607858 * W) / (p / 1000);
  const dew = pw > 0 ? Num.brent(t => Lg.pws(t) - pw, -60, tc + 1e-9) : NaN;
  /* wet bulb from the psychrometric equation (ASHRAE 2017, ch. 1, eqs. 33 and 35) */
  const Wof = ts => {
    const Ws = 0.621945 * Lg.pws(ts) / (p - Lg.pws(ts));
    return ts >= 0 ? ((2501 - 2.326 * ts) * Ws - 1.006 * (tc - ts)) / (2501 + 1.86 * tc - 4.186 * ts)
      : ((2830 - 0.24 * ts) * Ws - 1.006 * (tc - ts)) / (2830 + 1.86 * tc - 2.1 * ts);
  };
  const wet = Num.brent(ts => Wof(ts) - W, max(-60, dew - 1), tc);
  return {
    t: tc, rh, pws: ps, pw, W, Wg: W * 1000, h, v, dew, wet,
    vpd: ps - pw,                                       /* Pa */
    absHum: pw / (461.52 * (tc + 273.15)) * 1000,       /* g water / m³ */
  };
};
/* deficit that drives water loss: saturated product surface at its own
   temperature against the room air (Pa); product colder than the air → small */
Lg.productVPD = (tProduct, tAir, rhAir) => Lg.pws(tProduct) - rhAir / 100 * Lg.pws(tAir);
/* water loss (% of the weight per day) from a transpiration coefficient k
   (mg kg⁻¹ s⁻¹ MPa⁻¹) and a deficit (Pa) */
Lg.waterLoss = (k, vpdPa) => k * (vpdPa / 1e6) * 86400 / 1e6 * 100;
/* orientative transpiration coefficients, mg kg⁻¹ s⁻¹ MPa⁻¹ (Sastry et al. 1978) */
Lg.TRANSPIRATION = [
  { es: 'Manzana', en: 'Apple', k: 42 }, { es: 'Pera', en: 'Pear', k: 69 }, { es: 'Naranja', en: 'Orange', k: 117 },
  { es: 'Toronja', en: 'Grapefruit', k: 81 }, { es: 'Limón', en: 'Lemon', k: 186 }, { es: 'Uva', en: 'Grape', k: 79 },
  { es: 'Durazno', en: 'Peach', k: 572 }, { es: 'Ciruela', en: 'Plum', k: 136 }, { es: 'Tomate', en: 'Tomato', k: 140 },
  { es: 'Papa', en: 'Potato', k: 44 }, { es: 'Cebolla', en: 'Onion', k: 60 }, { es: 'Zanahoria', en: 'Carrot', k: 1207 },
  { es: 'Col', en: 'Cabbage', k: 671 }, { es: 'Lechuga', en: 'Lettuce', k: 7400 },
];

/* ---------------- cost of storage ----------------
   o: { kWhDay, tariff (per kWh), labourDay, otherDay, capitalYear (depreciation + rent,
        per year), capacity (units: pallets, t…), occupancy (%), lossPctDay, price (per unit),
        unitsStored } */
Lg.storageCost = function (o) {
  const energy = (o.kWhDay || 0) * (o.tariff || 0);
  const fixedDay = (o.capitalYear || 0) / 365;
  const total = energy + (o.labourDay || 0) + (o.otherDay || 0) + fixedDay;
  const used = (o.capacity || 0) * (o.occupancy == null ? 100 : o.occupancy) / 100;
  const perUnit = used > 0 ? total / used : NaN;
  const shrinkPerUnit = (o.lossPctDay || 0) / 100 * (o.price || 0);
  return { energy, fixedDay, total, used, perUnit, shrinkPerUnit, fullPerUnit: perUnit + shrinkPerUnit };
};

/* ---------------- unit conversions ---------------- */
Lg.UNITS = {
  temperature: { C: [v => v, v => v], F: [v => (v - 32) * 5 / 9, v => v * 9 / 5 + 32], K: [v => v - 273.15, v => v + 273.15] },
  pressure: { kPa: 1, atm: 101.325, bar: 100, psi: 6.894757293, mmHg: 0.1333223684, Pa: 0.001 },
  mass: { kg: 1, g: 0.001, lb: 0.45359237, t: 1000, oz: 0.028349523125 },
  force: { N: 1, kgf: 9.80665, lbf: 4.4482216152605, gf: 0.00980665 },
  length: { mm: 1, cm: 10, m: 1000, in: 25.4, ft: 304.8, mil: 0.0254, um: 0.001 },
  concentration: { pct: 10000, ppm: 1, ppb: 0.001, ulL: 1 },
};
Lg.convert = function (kind, v, from, to) {
  const U = Lg.UNITS[kind];
  if (!U) return NaN;
  if (kind === 'temperature') return U[to][1](U[from][0](v));
  return v * U[from] / U[to];
};

/* ---------------- storage compatibility ----------------
   t: recommended range (°C), rh: (%), eth: production class at 20 °C
   (VL < 0.1, L 0.1–1, M 1–10, H 10–100, VH > 100 µL kg⁻¹ h⁻¹), sens:
   sensitivity to ethylene (L, M, H), chill: chilling injury (0 none,
   1 moderate, 2 sensitive), odor: 'p' gives off strong odours, 'a' absorbs
   them. Orientative values compiled from Kader (2002) and Gross et al.
   (2016) for the most common cultivars; adjust them to your own. */
Lg.PRODUCTS = [
  ['aguacate', 'Aguacate (Hass, verde maduro)', 'Avocado (Hass, mature green)', 5, 7, 85, 90, 'H', 'H', 2, ''],
  ['platano', 'Plátano (verde)', 'Banana (green)', 13, 15, 90, 95, 'M', 'H', 2, ''],
  ['mango', 'Mango', 'Mango', 10, 13, 85, 90, 'M', 'M', 2, ''],
  ['papaya', 'Papaya', 'Papaya', 7, 13, 85, 90, 'H', 'M', 2, ''],
  ['pina', 'Piña', 'Pineapple', 7, 13, 85, 90, 'L', 'L', 2, ''],
  ['guayaba', 'Guayaba', 'Guava', 5, 10, 90, 95, 'M', 'M', 2, ''],
  ['maracuya', 'Maracuyá', 'Passion fruit', 7, 10, 85, 90, 'VH', 'M', 2, ''],
  ['tomateVerde', 'Tomate (verde maduro)', 'Tomato (mature green)', 12.5, 15, 90, 95, 'M', 'H', 2, ''],
  ['tomateRojo', 'Tomate (rojo maduro)', 'Tomato (firm ripe)', 7, 10, 85, 90, 'H', 'L', 1, ''],
  ['chileMorron', 'Chile morrón', 'Bell pepper', 7, 10, 90, 95, 'L', 'L', 2, ''],
  ['pepino', 'Pepino', 'Cucumber', 10, 12.5, 85, 90, 'L', 'H', 2, ''],
  ['calabacita', 'Calabacita', 'Summer squash', 5, 10, 90, 95, 'L', 'M', 2, ''],
  ['chayote', 'Chayote', 'Chayote', 7, 10, 85, 90, 'L', 'M', 2, ''],
  ['berenjena', 'Berenjena', 'Eggplant', 10, 12, 90, 95, 'L', 'M', 2, ''],
  ['ejote', 'Ejote', 'Snap bean', 4, 7, 95, 95, 'L', 'M', 1, ''],
  ['limon', 'Limón persa', 'Persian lime', 9, 10, 85, 90, 'VL', 'M', 2, 'a'],
  ['naranja', 'Naranja', 'Orange', 3, 8, 85, 90, 'VL', 'M', 1, 'a'],
  ['toronja', 'Toronja', 'Grapefruit', 10, 15, 85, 90, 'VL', 'M', 2, 'a'],
  ['manzana', 'Manzana', 'Apple', -1, 4, 90, 95, 'H', 'H', 0, 'a'],
  ['pera', 'Pera', 'Pear', -1.5, -0.5, 90, 95, 'H', 'H', 0, 'a'],
  ['durazno', 'Durazno', 'Peach', -0.5, 0, 90, 95, 'H', 'H', 0, ''],
  ['uva', 'Uva de mesa', 'Table grape', -1, 0, 90, 95, 'VL', 'L', 0, 'a'],
  ['fresa', 'Fresa', 'Strawberry', 0, 0.5, 90, 95, 'VL', 'L', 0, 'a'],
  ['frambuesa', 'Frambuesa y zarzamora', 'Raspberry and blackberry', -0.5, 0, 90, 95, 'L', 'L', 0, ''],
  ['kiwi', 'Kiwi', 'Kiwifruit', 0, 0, 90, 95, 'H', 'H', 0, ''],
  ['melon', 'Melón cantalupo', 'Cantaloupe', 2, 5, 95, 95, 'H', 'M', 0, ''],
  ['sandia', 'Sandía', 'Watermelon', 10, 15, 90, 90, 'L', 'H', 2, ''],
  ['lechuga', 'Lechuga', 'Lettuce', 0, 0, 98, 100, 'VL', 'H', 0, ''],
  ['brocoli', 'Brócoli', 'Broccoli', 0, 0, 95, 100, 'VL', 'H', 0, ''],
  ['zanahoria', 'Zanahoria', 'Carrot', 0, 0, 98, 100, 'VL', 'H', 0, ''],
  ['esparrago', 'Espárrago', 'Asparagus', 0, 2, 95, 100, 'VL', 'M', 0, ''],
  ['cilantro', 'Cilantro', 'Coriander', 0, 1, 95, 100, 'VL', 'H', 0, ''],
  ['elote', 'Elote', 'Sweet corn', 0, 0, 95, 98, 'VL', 'L', 0, ''],
  ['champinon', 'Champiñón', 'Mushroom', 0, 0, 95, 95, 'VL', 'M', 0, ''],
  ['cebolla', 'Cebolla seca', 'Dry onion', 0, 0, 65, 70, 'VL', 'L', 0, 'p'],
  ['ajo', 'Ajo', 'Garlic', -1, 0, 60, 70, 'VL', 'L', 0, 'p'],
  ['papa', 'Papa de mesa', 'Table potato', 7, 10, 90, 95, 'VL', 'M', 1, ''],
  ['camote', 'Camote', 'Sweet potato', 13, 15, 85, 90, 'VL', 'L', 2, ''],
].map(r => ({ id: r[0], es: r[1], en: r[2], tMin: r[3], tMax: r[4], rhMin: r[5], rhMax: r[6], eth: r[7], sens: r[8], chill: r[9], odor: r[10] }));
const ETH = { VL: 0, L: 1, M: 2, H: 3, VH: 4 }, SENS = { L: 0, M: 1, H: 2 };
/* issues between two products: [{level: 'bad'|'warn', k, es, en}] */
Lg.pairIssues = function (a, b, o) {
  o = Object.assign({ tTol: 0, rhTol: 5 }, o || {});
  const out = [];
  const tLo = max(a.tMin, b.tMin), tHi = min(a.tMax, b.tMax);
  if (tLo > tHi + o.tTol) {
    const cold = a.tMax < b.tMin ? a : b, warm = cold === a ? b : a;
    out.push({ level: 'bad', k: 'temp', es: `Temperaturas incompatibles: ${cold.es} pide ${cold.tMin}–${cold.tMax} °C y ${warm.es} ${warm.tMin}–${warm.tMax} °C` + (warm.chill === 2 ? `; ${warm.es} sufre daño por frío.` : '.'), en: `Incompatible temperatures: ${cold.en} needs ${cold.tMin}–${cold.tMax} °C and ${warm.en} ${warm.tMin}–${warm.tMax} °C` + (warm.chill === 2 ? `; ${warm.en} suffers chilling injury.` : '.') });
  }
  const hLo = max(a.rhMin, b.rhMin), hHi = min(a.rhMax, b.rhMax);
  if (hLo > hHi + o.rhTol) out.push({ level: 'warn', k: 'rh', es: `Humedad relativa distinta: ${a.es} ${a.rhMin}–${a.rhMax} % y ${b.es} ${b.rhMin}–${b.rhMax} %.`, en: `Different relative humidity: ${a.en} ${a.rhMin}–${a.rhMax}% and ${b.en} ${b.rhMin}–${b.rhMax}%.` });
  [[a, b], [b, a]].forEach(([p, s]) => {
    const prod = ETH[p.eth], sens = SENS[s.sens];
    if (prod >= 3 && sens === 2) out.push({ level: 'bad', k: 'eth', es: `${p.es} produce mucho etileno y ${s.es} es muy sensible a él.`, en: `${p.en} produces much ethylene and ${s.en} is very sensitive to it.` });
    else if ((prod >= 3 && sens === 1) || (prod === 2 && sens === 2)) out.push({ level: 'warn', k: 'eth', es: `Riesgo por etileno: ${p.es} (producción ${p.eth}) junto a ${s.es} (sensibilidad ${s.sens}); conviene ventilar o absorber el etileno.`, en: `Ethylene risk: ${p.en} (production ${p.eth}) next to ${s.en} (sensitivity ${s.sens}); ventilate or scrub ethylene.` });
    if (p.odor === 'p' && s.odor !== 'p') out.push({ level: 'warn', k: 'odor', es: `${p.es} desprende olores que ${s.es} puede absorber.`, en: `${p.en} gives off odours that ${s.en} may absorb.` });
  });
  return out;
};
/* every pair of a list of products, and the room setting they could share */
Lg.compatibility = function (list, o) {
  const pairs = [];
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) pairs.push({ i, j, issues: Lg.pairIssues(list[i], list[j], o) });
  const tLo = max(...list.map(p => p.tMin)), tHi = min(...list.map(p => p.tMax));
  const hLo = max(...list.map(p => p.rhMin)), hHi = min(...list.map(p => p.rhMax));
  const bad = pairs.some(p => p.issues.some(x => x.level === 'bad'));
  return { pairs, shared: { tLo, tHi, hLo, hHi, tOk: tLo <= tHi, hOk: hLo <= hHi }, bad, warn: pairs.some(p => p.issues.length) };
};

g.Logi = Lg;
return Lg;
}
if (typeof window !== 'undefined') LogiCore(window);
