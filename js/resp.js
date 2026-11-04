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

/* PostHarvestPro — respiration, ethylene, modified atmospheres and cooling.

   · Respiration rate (CO₂ production, O₂ uptake) and ethylene production in a
     closed (static) system, from the slope of the concentration over time, and
     in a flow-through system; respiratory quotient; heat of respiration.
     Kader 2002 (UC ANR 3311, ch. 13); Fonseca, Oliveira and Brecht 2002,
     J. Food Eng. 52:99–119; Saltveit 2016, USDA Agric. Handb. 66.
   · Climacteric or not, from the shape of the respiration and ethylene curves
     (Biale 1964, Science 146:880–888; Lelièvre et al. 1997, Physiol. Plant.
     101:727–739): a transparent rule, not a verdict.
   · Modified-atmosphere packaging at steady state: the O₂ the product takes
     equals the O₂ that permeates the film, and likewise for CO₂
     (Fishman, Rodov and Ben-Yehoshua 1996, J. Food Sci. 61:956–961; Exama,
     Arul, Lencki, Lee and Toupin 1993, J. Food Sci. 58:1365–1370), with an
     optional O₂-limited respiration of Michaelis–Menten form with
     uncompetitive CO₂ inhibition (Lee, Haggar, Lee and Yam 1991, J. Food Sci.
     56:1580–1585).
   · Field heat, specific heat from the water content (Siebel 1892, Ice and
     Refrigeration 2:256–257), half- and seven-eighths cooling times from the
     exponential cooling law (Thompson, Mitchell, Rumsey, Kasmire and Crisosto
     2008, Commercial Cooling of Fruits, Vegetables and Flowers, UC ANR 21567)
     and the refrigeration capacity that a load needs. */
function RespCore(g) {
'use strict';
const Num = g.Num;
const R = {};
const MW_CO2 = 44.0095, MW_O2 = 31.9988, MW_C2H4 = 28.0532;
const R_GAS = 8.314462618;         /* J mol⁻¹ K⁻¹ */
R.MW = { CO2: MW_CO2, O2: MW_O2, C2H4: MW_C2H4 };

/* molar volume of an ideal gas, L/mol, at t °C and P kPa */
R.molarVolume = (tc, kPa) => R_GAS * (tc + 273.15) / (kPa || 101.325);
/* free volume of a jar: its volume minus the volume of the produce (mass/density, kg/L) */
R.freeVolume = (jarL, massKg, density) => jarL - massKg / (density || 1);

/* slope of y on t by least squares, with its standard error and R² */
function slope(t, y) {
  const ok = t.map((v, i) => [v, y[i]]).filter(p => isFinite(p[0]) && isFinite(p[1]));
  if (ok.length < 2) return { b: NaN, se: NaN, r2: NaN, a: NaN, n: ok.length };
  if (ok.length === 2) {
    const b = (ok[1][1] - ok[0][1]) / (ok[1][0] - ok[0][0]);
    return { b, se: NaN, r2: 1, a: ok[0][1] - b * ok[0][0], n: 2 };
  }
  const fit = Num.lm(ok.map(p => [1, p[0]]), ok.map(p => p[1]));
  return { b: fit.coef[1], se: fit.se[1], r2: fit.r2, a: fit.coef[0], n: ok.length };
}
R.slope = slope;

/* ---------------- closed (static) system ----------------
   o: { t (h), co2 (%), o2 (%), c2h4 (µL/L = ppm), mass (kg), free (L), temp (°C), kPa }
   A change of Δ% in a free volume V (L) is Δ/100·V L of gas = Δ/100·V/Vm mol.
     r (mL kg⁻¹ h⁻¹)  = slope(%/h)/100 · V · 1000 / m
     r (mg kg⁻¹ h⁻¹)  = slope/100 · V / Vm · M · 1000 / m
     ethylene (µL kg⁻¹ h⁻¹) = slope(ppm/h) · V / m
   O₂ is consumed: its rate is minus its slope. */
R.closed = function (o) {
  const Vm = R.molarVolume(o.temp == null ? 20 : o.temp, o.kPa);
  const V = o.free, m = o.mass;
  const out = { Vm, free: V };
  const gas = (key, mw, sign) => {
    if (!o[key] || o[key].filter(isFinite).length < 2) return null;
    const s = slope(o.t, o[key]);
    const mlKgH = sign * s.b / 100 * V * 1000 / m;
    const mgKgH = sign * s.b / 100 * V / Vm * mw * 1000 / m;
    const k = mlKgH / s.b;
    return { slope: s.b, slopeSE: s.se, r2: s.r2, n: s.n, mlKgH, mgKgH, mlKgHSE: Math.abs(k * s.se), mgKgHSE: Math.abs(mgKgH / s.b * s.se), fit: s };
  };
  out.co2 = gas('co2', MW_CO2, 1);
  out.o2 = gas('o2', MW_O2, -1);
  if (o.c2h4 && o.c2h4.filter(isFinite).length >= 2) {
    const s = slope(o.t, o.c2h4);
    out.c2h4 = { slope: s.b, slopeSE: s.se, r2: s.r2, n: s.n, ulKgH: s.b * V / m, ulKgHSE: s.se * V / m, nlGH: s.b * V / m, fit: s };
  }
  if (out.co2 && out.o2) out.rq = out.co2.mlKgH / out.o2.mlKgH;
  if (out.co2) out.heat = R.respHeat(out.co2.mgKgH);
  return out;
};

/* ---------------- flow-through system ----------------
   o: { co2In, co2Out, o2In, o2Out (%), c2h4In, c2h4Out (ppm), flow (mL/min), mass (kg), temp, kPa }
   r = Δ%/100 · F(mL/h) / m; ethylene = Δppm · F(L/h) / m. */
R.flow = function (o) {
  const Vm = R.molarVolume(o.temp == null ? 20 : o.temp, o.kPa);
  const Fh = o.flow * 60;                       /* mL/h */
  const out = { Vm };
  if (isFinite(o.co2Out) && isFinite(o.co2In)) {
    const ml = (o.co2Out - o.co2In) / 100 * Fh / o.mass;
    out.co2 = { mlKgH: ml, mgKgH: ml / 1000 / Vm * MW_CO2 * 1000 };
  }
  if (isFinite(o.o2Out) && isFinite(o.o2In)) {
    const ml = (o.o2In - o.o2Out) / 100 * Fh / o.mass;
    out.o2 = { mlKgH: ml, mgKgH: ml / 1000 / Vm * MW_O2 * 1000 };
  }
  if (isFinite(o.c2h4Out) && isFinite(o.c2h4In)) out.c2h4 = { ulKgH: (o.c2h4Out - o.c2h4In) * Fh / 1000 / o.mass };
  if (out.co2 && out.o2) out.rq = out.co2.mlKgH / out.o2.mlKgH;
  if (out.co2) out.heat = R.respHeat(out.co2.mgKgH);
  return out;
};

/* heat of respiration: oxidizing one mole of hexose (2 816 kJ) releases six
   of CO₂ (264 g), so 10.67 J per mg of CO₂.
   W per metric ton = r(mg kg⁻¹ h⁻¹) · 10.67 J/mg · 1000 kg / 3600 s */
R.J_PER_MG_CO2 = 2816000 / (6 * MW_CO2 * 1000);
R.respHeat = function (mgKgH) {
  const wPerT = mgKgH * R.J_PER_MG_CO2 * 1000 / 3600;
  return { wPerT, kjPerTDay: wPerT * 86.4, kcalPerTDay: wPerT * 86.4 / 4.184 };
};

/* ---------------- climacteric or not ----------------
   t, resp (respiration, any unit), eth (ethylene, µL kg⁻¹ h⁻¹ or empty).
   Rule (documented to the user):
   · respiratory rise = peak / pre-climacteric minimum, where the minimum is
     the lowest value before the peak and the peak the highest value after
     that minimum; it counts when ≥ riseMin (1.5 by default) and the peak is
     not the last reading (a curve still climbing at the end is «uncertain»);
   · ethylene burst = highest / lowest-before-it ≥ ethRise (10 by default)
     or a peak ≥ ethMin µL kg⁻¹ h⁻¹ (1 by default);
   · climacteric: both (or the respiratory rise alone when there is no
     ethylene); non-climacteric: neither, with a falling or flat respiration;
     anything else is reported as uncertain, with its numbers. */
R.climacteric = function (t, resp, eth, o) {
  o = Object.assign({ riseMin: 1.5, ethRise: 10, ethMin: 1 }, o || {});
  const peakAfterMin = (y) => {
    const ok = y.map((v, i) => [t[i], v]).filter(p => isFinite(p[0]) && isFinite(p[1]));
    if (ok.length < 3) return null;
    let best = null;
    for (let i = 0; i < ok.length; i++) {
      let mi = i;
      for (let j = 0; j <= i; j++) if (ok[j][1] < ok[mi][1]) mi = j;
      const r = ok[i][1] / ok[mi][1];
      if (ok[mi][1] > 0 && (!best || r > best.rise)) best = { rise: r, iPeak: i, iMin: mi, tPeak: ok[i][0], tMin: ok[mi][0], peak: ok[i][1], min: ok[mi][1], last: i === ok.length - 1 };
    }
    return best;
  };
  const rp = peakAfterMin(resp);
  const hasEth = eth && eth.filter(isFinite).length >= 3;
  const ep = hasEth ? peakAfterMin(eth) : null;
  const respRise = !!rp && rp.rise >= o.riseMin && !rp.last;
  const respStillRising = !!rp && rp.rise >= o.riseMin && rp.last;
  const ethBurst = !!ep && (ep.rise >= o.ethRise || ep.peak >= o.ethMin);
  let type;
  if (respRise && (!hasEth || ethBurst)) type = 'climacteric';
  else if (!respRise && !respStillRising && (!hasEth || !ethBurst)) type = 'nonclimacteric';
  else type = 'uncertain';
  return { type, resp: rp, eth: ep, respRise, respStillRising, ethBurst, opts: o };
};

/* ---------------- modified-atmosphere packaging ----------------
   Films: permeability P in mL·µm m⁻² d⁻¹ atm⁻¹ at 23–25 °C (oxygen and carbon
   dioxide). Indicative values for common films, to be replaced by the
   supplier's sheet (Mangaraj, Goswami and Mahajan 2009, Food Eng. Rev.
   1:133–158; Exama et al. 1993); Ea in kJ/mol for the temperature
   correction P(T) = P(Tref)·exp(−Ea/R·(1/T − 1/Tref)). */
R.FILMS = [
  { id: 'ldpe', es: 'Polietileno de baja densidad', en: 'Low-density polyethylene', o2: 195000, co2: 975000, eaO2: 42, eaCO2: 38 },
  { id: 'lldpe', es: 'Polietileno lineal de baja densidad', en: 'Linear low-density polyethylene', o2: 175000, co2: 760000, eaO2: 40, eaCO2: 37 },
  { id: 'hdpe', es: 'Polietileno de alta densidad', en: 'High-density polyethylene', o2: 50000, co2: 190000, eaO2: 35, eaCO2: 30 },
  { id: 'pp', es: 'Polipropileno colado', en: 'Cast polypropylene', o2: 95000, co2: 260000, eaO2: 45, eaCO2: 38 },
  { id: 'bopp', es: 'Polipropileno biorientado', en: 'Biaxially oriented polypropylene', o2: 40000, co2: 140000, eaO2: 45, eaCO2: 38 },
  { id: 'pvc', es: 'Policloruro de vinilo plastificado', en: 'Plasticized poly(vinyl chloride)', o2: 40000, co2: 250000, eaO2: 50, eaCO2: 45 },
  { id: 'eva', es: 'Etileno acetato de vinilo', en: 'Ethylene–vinyl acetate', o2: 310000, co2: 1300000, eaO2: 40, eaCO2: 35 },
  { id: 'ps', es: 'Poliestireno orientado', en: 'Oriented polystyrene', o2: 125000, co2: 450000, eaO2: 30, eaCO2: 25 },
  { id: 'pet', es: 'Poliéster (PET)', en: 'Polyester (PET)', o2: 1500, co2: 5000, eaO2: 28, eaCO2: 25 },
];
R.filmAt = function (film, tc, tref) {
  const T = tc + 273.15, Tr = (tref == null ? 23 : tref) + 273.15;
  const f = (P, ea) => P * Math.exp(-(ea || 0) * 1000 / R_GAS * (1 / T - 1 / Tr));
  return Object.assign({}, film, { o2: f(film.o2, film.eaO2), co2: f(film.co2, film.eaCO2) });
};
/* respiration in mL kg⁻¹ h⁻¹; mass kg; area m²; thickness µm; P as above;
   gas fractions in % (outside air 20.95 % O₂ and 0.04 % CO₂).
   Steady state with constant respiration (independent of the atmosphere):
     rO₂·W·24 = (P_O₂/L)·A·(pO₂out − pO₂in)  →  pO₂in = pO₂out − rO₂·W·24·L/(P_O₂·A)
     rCO₂·W·24 = (P_CO₂/L)·A·(pCO₂in − pCO₂out)
   (×24: respiration per hour, permeability per day; partial pressures in atm
   at 1 atm total). */
R.mapSteady = function (o) {
  const L = o.thickness, A = o.area, W = o.mass;
  const out = { o2Out: o.o2Out == null ? 20.95 : o.o2Out, co2Out: o.co2Out == null ? 0.04 : o.co2Out };
  const rO2 = o.rO2, rCO2 = o.rCO2 != null ? o.rCO2 : o.rO2 * (o.rq || 1);
  if (!o.mm) {
    out.o2In = out.o2Out - 100 * rO2 * W * 24 * L / (o.film.o2 * A);
    out.co2In = out.co2Out + 100 * rCO2 * W * 24 * L / (o.film.co2 * A);
    out.rO2 = rO2; out.rCO2 = rCO2;
  } else {
    /* O₂-limited respiration: r = Vm·[O₂]/(Km + [O₂]·(1 + [CO₂]/Ki)), with
       [CO₂] from its own balance; one equation in [O₂] solved by bisection */
    const { vm, km, ki } = o.mm, rq = o.rq || 1;
    const rate = (x, c) => vm * x / (km + x * (1 + (ki ? c / ki : 0)));
    const co2Of = x => out.co2Out + 100 * rq * rate(x, 0) * W * 24 * L / (o.film.co2 * A);
    const bal = x => {
      /* fixed point on CO₂ (it converges in a few passes: the inhibition is mild) */
      let c = co2Of(x);
      for (let i = 0; i < 50; i++) { const c2 = out.co2Out + 100 * rq * rate(x, c) * W * 24 * L / (o.film.co2 * A); if (Math.abs(c2 - c) < 1e-12) break; c = c2; }
      return { f: out.o2Out - 100 * rate(x, c) * W * 24 * L / (o.film.o2 * A) - x, c };
    };
    const x = Num.brent(v => bal(v).f, 1e-9, out.o2Out);
    out.o2In = x; out.co2In = bal(x).c;
    out.rO2 = rate(x, out.co2In); out.rCO2 = rq * out.rO2;
  }
  out.anaerobic = out.o2In < (o.o2Min == null ? 1 : o.o2Min);
  out.beta = o.film.co2 / o.film.o2;
  return out;
};
/* the thickness that brings O₂ inside to the target (constant respiration) */
R.mapThickness = (o) => (o.film.o2 * o.area * ((o.o2Out == null ? 20.95 : o.o2Out) - o.targetO2) / 100) / (o.rO2 * o.mass * 24);
/* the film area that does it for a given thickness */
R.mapArea = (o) => (o.rO2 * o.mass * 24 * o.thickness) / (o.film.o2 * ((o.o2Out == null ? 20.95 : o.o2Out) - o.targetO2) / 100);
/* the line of every steady atmosphere a film of ratio β = P_CO₂/P_O₂ can give
   with a product of respiratory quotient RQ (Exama et al. 1993):
   CO₂in = CO₂out + (RQ/β)·(O₂out − O₂in) */
R.betaLine = (beta, rq, o2In, o2Out, co2Out) => (co2Out == null ? 0.04 : co2Out) + (rq || 1) / beta * ((o2Out == null ? 20.95 : o2Out) - o2In);
/* the permeability ratio a package needs to land inside a window of O₂ and CO₂ */
R.betaNeeded = (rq, o2In, co2In, o2Out, co2Out) => (rq || 1) * ((o2Out == null ? 20.95 : o2Out) - o2In) / (co2In - (co2Out == null ? 0.04 : co2Out));

/* ---------------- field heat and cooling ---------------- */
/* specific heat above freezing from the water content (%), kJ kg⁻¹ K⁻¹ (Siebel 1892) */
R.cpSiebel = water => 0.0335 * water + 0.837;
R.fieldHeat = (massKg, ti, tf, cp) => massKg * cp * (ti - tf);       /* kJ */
/* the exponential cooling law Y = (T − Tm)/(Ti − Tm) = j·exp(−C·t): ln Y on t by
   least squares; half-cooling time ln(2j)/C, seven-eighths ln(8j)/C */
R.cooling = function (t, T, Tm, Ti) {
  const T0 = Ti == null ? T[0] : Ti;
  const pts = t.map((v, i) => [v, (T[i] - Tm) / (T0 - Tm)]).filter(p => isFinite(p[0]) && p[1] > 0);
  const fit = Num.lm(pts.map(p => [1, p[0]]), pts.map(p => Math.log(p[1])));
  const C = -fit.coef[1], j = Math.exp(fit.coef[0]);
  return {
    C, j, r2: fit.r2, n: pts.length, se: fit.se[1],
    half: Math.log(2 * j) / C, sevenEighths: Math.log(8 * j) / C,
    predict: tt => Tm + (T0 - Tm) * j * Math.exp(-C * tt),
    timeTo: target => Math.log(j * (T0 - Tm) / (target - Tm)) / C,
    pts,
  };
};
/* the time to bring produce from Ti to a target, given a half-cooling time (j = 1) */
R.timeFromHalf = (half, ti, tm, target) => half * Math.log((ti - tm) / (target - tm)) / Math.LN2;
/* refrigeration capacity of a cooling job:
   o: { mass (kg), ti, tf (°C), cp (kJ kg⁻¹ K⁻¹), hours, rCO2 (mg kg⁻¹ h⁻¹ at the mean temperature),
        packMass (kg), packCp, extra (%, other loads: infiltration, fans, lights, people) } */
R.refrigLoad = function (o) {
  const field = R.fieldHeat(o.mass, o.ti, o.tf, o.cp);
  const pack = o.packMass ? o.packMass * (o.packCp || 1.4) * (o.ti - o.tf) : 0;
  const resp = o.rCO2 ? o.rCO2 * R.J_PER_MG_CO2 / 1000 * o.mass * o.hours : 0;   /* kJ */
  const base = field + pack + resp;
  const total = base * (1 + (o.extra || 0) / 100);
  const kW = total / (o.hours * 3600);
  return { field, pack, resp, extra: total - base, total, kW, tr: kW / 3.51685 };
};

g.Resp = R;
return R;
}
if (typeof window !== 'undefined') RespCore(window);
