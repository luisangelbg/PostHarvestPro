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

/* PostHarvestPro — Block 3, deterioration kinetics and shelf life: the three
   orders with their AIC and the time to a limit; temperature (Arrhenius, Q10,
   square root) and the shelf life at any temperature; accelerated tests; and
   time to rejection with censoring (Kaplan–Meier, log-rank, parametric). */
(function () {
'use strict';
const S = { k: null, t: null, a: null, s: null };
const ORD = [['Orden cero', 'Zero order'], ['Primer orden', 'First order'], ['Segundo orden', 'Second order']];
const ordName = o => T(ORD[o][0], ORD[o][1]);
const EQ = ['C = C₀ − k·t', 'C = C₀·e^(−k·t)', '1/C = 1/C₀ + k·t'];
/* the parametric models as they read inside a sentence («el modelo log-logístico»,
   «the log-logistic model»); distName(d, true) capitalises them for a label */
const DISTS = { weibull: ['Weibull', 'Weibull'], lognormal: ['log-normal', 'log-normal'], loglogistic: ['log-logístico', 'log-logistic'], exponential: ['exponencial', 'exponential'] };
const distName = (d, cap) => { const s = T(DISTS[d][0], DISTS[d][1]); return cap ? s.charAt(0).toUpperCase() + s.slice(1) : s; };
/* an interval with n (3) significant figures of its larger bound: a k near 4
   does not carry four decimals and one near 0.06 keeps its digits */
const ciSig = (lo, hi, n) => {
  const m = Math.max(Math.abs(lo), Math.abs(hi));
  return Fmt.ci(lo, hi, isFinite(m) && m > 0 ? Math.min(8, Math.max(0, (n || 3) - 1 - Math.floor(Math.log10(m)))) : 4);
};
/* the engines' notes (non-convergence, omitted rows, limits never reached…), shown
   under the reading as the hedonic test of Block 6 shows its own; repeated ones once */
const notesHTML = list => {
  const seen = new Set();
  return list.filter(x => x && x.n && !seen.has(x.pre + x.n.es) && seen.add(x.pre + x.n.es)).map(x => `<p class="hint">${x.pre ? '<b>' + x.pre + '</b>: ' : ''}${L2(x.n.es, x.n.en)}</p>`).join('');
};
/* the k of each numeric group (the temperature), as the temperature table takes them */
const kRows = res => res.filter(r => isFinite(+r.group) && isFinite(r.fit.k)).map(r => ({ T: +r.group, k: Math.abs(r.fit.k), se: r.fit.se.k }));

const tools = [
  { id: 'cinetica', es: 'Modelos cinéticos', en: 'Kinetic models', html: `
    <div class="card"><h2>${L2('Datos', 'Data')}</h2>
      <p class="hint">${L2('Un atributo medido en el tiempo (firmeza, color, vitamina C, peso…), con un grupo opcional (temperatura, tratamiento). Cada grupo se ajusta por separado con los tres órdenes, por mínimos cuadrados en la escala original.', 'An attribute measured over time (firmness, colour, vitamin C, weight…), with an optional group (temperature, treatment). Each group is fitted separately with the three orders, by least squares on the original scale.')}</p>
      <div id="b3kIn"></div>
      <div class="form-grid tight">${UI.sel('b3kOrder', 'Orden', 'Order', [['auto', 'El de menor AIC', 'Lowest AIC'], ['0', 'Orden cero', 'Zero order'], ['1', 'Primer orden', 'First order'], ['2', 'Segundo orden', 'Second order']], 'auto')}${UI.sel('b3kMeth', 'Método', 'Method', [['nls', 'No lineal (escala original)', 'Nonlinear (original scale)'], ['linear', 'Linealizado', 'Linearised']], 'nls', { wide: true })}${UI.num('b3kLim', 'Límite de aceptación', 'Acceptance limit', 25, { help: L2('vacío: sin límite', 'empty: no limit') })}${UI.sel('b3kConf', 'Confianza', 'Confidence', [['0.9', '90 %', '90 %'], ['0.95', '95 %', '95 %'], ['0.99', '99 %', '99 %']], '0.95')}</div></div>
    <div id="b3kOut" hidden><div class="card"><h2>${L2('Ajuste y vida de anaquel', 'Fit and shelf life')}</h2><div id="b3kTiles"></div><div id="b3kRead"></div><div id="b3kFig"></div><div id="b3kTab"></div><h3>${L2('Los tres órdenes', 'The three orders')}</h3><div id="b3kCmp"></div><div class="btn-row"><button type="button" class="btn btn-secondary btn-sm" id="b3kToT">${L2('Llevar las k al análisis de temperatura →', 'Take the k values to the temperature analysis →')}</button></div><div id="b3kCite"></div></div></div>` },
  { id: 'temperatura', es: 'Temperatura', en: 'Temperature', html: `
    <div class="card"><h2>${L2('Constantes de velocidad a varias temperaturas', 'Rate constants at several temperatures')}</h2>
      <p class="hint">${L2('Escribe k (con su error estándar, si lo tienes, para ponderar) o llévalas desde los modelos cinéticos.', 'Type k (with its standard error, if you have it, to weight) or bring them from the kinetic models.')}</p>
      <div id="b3tTable"></div>
      <div class="form-grid tight">${UI.check('b3tW', 'Ponderar por el error estándar de k', 'Weight by the standard error of k', false)}${UI.num('b3tTref', 'Temperatura de referencia (°C)', 'Reference temperature (°C)', 20)}</div></div>
    <div class="card" id="b3tOut" hidden><h2>${L2('Arrhenius, Q10 y raíz cuadrada', 'Arrhenius, Q10 and square root')}</h2><div id="b3tTiles"></div><div id="b3tRead"></div><div class="figs-2"><div id="b3tFigA"></div><div id="b3tFigB"></div></div><div id="b3tTab"></div>
      <h3>${L2('Vida de anaquel a cualquier temperatura', 'Shelf life at any temperature')}</h3>
      <div class="form-grid tight">${UI.sel('b3tOrd', 'Orden', 'Order', [['0', 'Cero', 'Zero'], ['1', 'Uno', 'One'], ['2', 'Dos', 'Two']], '1')}${UI.num('b3tC0', 'Valor inicial C₀', 'Initial value C₀', 125)}${UI.num('b3tLim', 'Límite', 'Limit', 25)}${UI.num('b3tT', 'Temperatura de almacén (°C)', 'Storage temperature (°C)', 10)}${UI.sel('b3tInt', 'Intervalo', 'Interval', [['confidence', 'De la media', 'Of the mean'], ['prediction', 'De predicción', 'Prediction']], 'confidence')}</div>
      <div id="b3tSL"></div><div id="b3tFigC"></div><div id="b3tCite"></div></div>` },
  { id: 'aslt', es: 'Prueba acelerada', en: 'Accelerated test', html: `
    <div class="card"><h2>${L2('Vidas de anaquel a temperaturas altas', 'Shelf lives at high temperatures')}</h2>
      <p class="hint">${L2('La vida de anaquel observada (días, semanas…) a cada temperatura de la prueba acelerada. El ejemplo es ilustrativo.', 'The shelf life observed (days, weeks…) at each temperature of the accelerated test. The example is illustrative.')}</p>
      <div id="b3aTable"></div>
      <div class="form-grid tight">${UI.sel('b3aModel', 'Modelo', 'Model', [['arrhenius', 'Arrhenius (ln θ contra 1/T)', 'Arrhenius (ln θ against 1/T)'], ['q10', 'Q10 (ln θ contra T)', 'Q10 (ln θ against T)']], 'arrhenius')}${UI.num('b3aT', 'Temperatura de almacén (°C)', 'Storage temperature (°C)', 20)}</div></div>
    <div class="card" id="b3aOut" hidden><h2>${L2('Predicción', 'Prediction')}</h2><div id="b3aTiles"></div><div id="b3aRead"></div><div id="b3aFig"></div><div id="b3aCite"></div></div>` },
  { id: 'rechazo', es: 'Tiempo hasta rechazo', en: 'Time to rejection', html: `
    <div class="card"><h2>${L2('Datos', 'Data')}</h2>
      <p class="hint">${L2('Una fila por fruto: el tiempo hasta que se rechazó (o hasta el último día que se observó sano) y si se rechazó (1) o seguía aceptable al terminar (0, censurado).', 'One row per fruit: the time until it was rejected (or until the last day it was seen sound) and whether it was rejected (1) or still acceptable at the end (0, censored).')}</p>
      <div id="b3sIn"></div>
      <div class="form-grid tight">${UI.sel('b3sCI', 'Intervalo de Kaplan–Meier', 'Kaplan–Meier interval', [['log', 'Logarítmico', 'Log'], ['log-log', 'Log-log', 'Log-log'], ['plain', 'Lineal', 'Plain']], 'log')}${UI.sel('b3sDist', 'Modelo paramétrico', 'Parametric model', [['auto', 'El de menor AIC', 'The one with the lowest AIC'], ['weibull', 'Weibull', 'Weibull'], ['lognormal', 'Log-normal', 'Log-normal'], ['loglogistic', 'Log-logístico', 'Log-logistic'], ['exponential', 'Exponencial', 'Exponential']], 'auto')}${UI.num('b3sP', 'Rechazo tolerado (%)', 'Tolerated rejection (%)', 10, { min: 1, max: 99 })}</div></div>
    <div id="b3sOut" hidden><div class="card"><h2>${L2('Curvas de supervivencia', 'Survival curves')}</h2><div id="b3sTiles"></div><div id="b3sRead"></div><div id="b3sFig"></div><div id="b3sTab"></div><h3>${L2('Modelos paramétricos', 'Parametric models')}</h3><div id="b3sAIC"></div><div id="b3sPar"></div><div id="b3sCite"></div></div></div>` },
];

/* ---------------- kinetics ---------------- */
function kinRun(D) {
  const m = D.map, conf = +UI.s('b3kConf'), meth = UI.s('b3kMeth'), sel = UI.s('b3kOrder');
  const keyG = m.group || null;
  const groups = keyG ? Trial.levelsOf(D.rows.filter(r => r[m.y] != null && r[m.t] != null), keyG) : ['—'];
  const res = groups.map(gq => {
    const sub = D.rows.filter(r => (!keyG || String(r[keyG]) === gq) && r[m.t] != null && r[m.y] != null && isFinite(r[m.t]) && isFinite(r[m.y]));
    const t = sub.map(r => +r[m.t]), y = sub.map(r => +r[m.y]);
    const cmp = Kin.compare(t, y, { conf });
    const order = sel === 'auto' ? (cmp.best >= 0 ? cmp.best : 1) : +sel;
    const fit = meth === 'linear' ? Kin.fit(t, y, { order, method: 'linear', conf }) : cmp.fits[order];
    const lim = UI.s('b3kLim') === '' ? NaN : UI.v('b3kLim');
    const tl = isFinite(lim) ? Kin.timeToLimit(fit, lim, { conf }) : null;
    return { group: gq, t, y, cmp, order, fit, tl };
  });
  S.k = { res, keyG, map: m, conf, meth };
  el('b3kOut').hidden = false;
  const lim = UI.s('b3kLim') === '' ? NaN : UI.v('b3kLim');
  const best = res.filter(r => r.tl && isFinite(r.tl.t));
  statTiles('b3kTiles', [
    [T('Grupos', 'Groups'), res.length, keyG ? esc(keyG) : ''],
    [T('Orden elegido', 'Chosen order'), [...new Set(res.map(r => r.order))].map(o => ordName(o)).join(', '), sel === 'auto' ? T('por AIC', 'by AIC') : T('fijado por ti', 'set by you')],
    [T('R² medio', 'Mean R²'), Fmt.num(Num.mean(res.map(r => r.fit.r2)), 3), meth === 'linear' ? T('en la escala linealizada', 'on the linearised scale') : ''],
    isFinite(lim) ? [T('Vida al límite', 'Life to the limit'), best.length ? best.map(r => Fmt.num(r.tl.t, 1)).join(' · ') : '—', T('límite ', 'limit ') + Fmt.num(lim), 'hi'] : null,
  ]);
  /* reading */
  const lines = res.map(r => {
    const f = r.fit, nm = keyG ? esc(keyG + ' ' + r.group) : '';
    const hl = isFinite(f.halfLife) ? L2(`; vida media ${Fmt.num(f.halfLife, 1)}`, `; half-life ${Fmt.num(f.halfLife, 1)}`) : '';
    const tl = r.tl ? (isFinite(r.tl.t) ? L2(`; llega a ${Fmt.num(lim)} en <b>${Fmt.num(r.tl.t, 1)}</b> ${Fmt.ci(r.tl.lo, r.tl.hi, 1)}`, `; reaches ${Fmt.num(lim)} at <b>${Fmt.num(r.tl.t, 1)}</b> ${Fmt.ci(r.tl.lo, r.tl.hi, 1)}`) : L2('; no alcanza el límite', '; does not reach the limit')) : '';
    return `<li>${nm ? '<b>' + nm + '</b>: ' : ''}${ordName(r.order)}, k = ${Fmt.sig(r.fit.k, 4)} ${ciSig(f.ci.k[0], f.ci.k[1])}${hl}${tl}.</li>`;
  }).join('');
  const ks = res.map(r => r.fit.k).filter(v => isFinite(v) && v !== 0);
  const ratio = ks.length > 1 ? Math.max(...ks.map(Math.abs)) / Math.min(...ks.map(Math.abs)) : NaN;
  const agreeOrder = new Set(res.map(r => r.cmp.best)).size === 1;
  el('b3kRead').innerHTML = `<div class="reading"><ul style="margin:0 0 6px;padding-left:18px">${lines}</ul><p>${L2(`${agreeOrder ? 'El AIC elige el mismo orden en todos los grupos.' : 'El AIC no elige el mismo orden en todos los grupos: conviene usar uno solo para comparar sus k.'}${isFinite(ratio) ? ` La constante más rápida es ${Fmt.num(ratio, 1)} veces la más lenta.` : ''} Los intervalos son de Wald con la t de Student (${Math.round(S.k.conf * 100)} %).`, `${agreeOrder ? 'AIC picks the same order in every group.' : 'AIC does not pick the same order in every group: better use a single one to compare their k.'}${isFinite(ratio) ? ` The fastest constant is ${Fmt.num(ratio, 1)} times the slowest.` : ''} The intervals are Wald intervals with Student's t (${Math.round(S.k.conf * 100)} %).`)}</p>${res.some(r => r.fit.k < 0) ? `<p>${L2('k negativa: el atributo aumenta con el tiempo (formación).', 'Negative k: the attribute increases with time (formation).')}</p>` : ''}${kinNotes(res, keyG)}</div>`;
  /* figure */
  const tMax = Math.max(...res.flatMap(r => r.t));
  const grid = Array.from({ length: 61 }, (_, i) => tMax * i / 60);
  const series = [];
  res.forEach((r, i) => {
    const pr = r.fit.predictCI(grid).filter(p => isFinite(p.fit));
    series.push({ name: (keyG ? keyG + ' ' + r.group : T('datos', 'data')), x: r.t, y: r.y, line: false, color: Plot.color(i), r: 3, alpha: 0.75 });
    series.push({ name: (keyG ? keyG + ' ' + r.group : '') + ' · ' + T('modelo', 'model'), x: pr.map(p => p.t), y: pr.map(p => p.fit), points: false, color: Plot.color(i), band: { x: pr.map(p => p.t), lo: pr.map(p => p.lo), hi: pr.map(p => p.hi) } });
  });
  el('b3kFig').innerHTML = '';
  Fig.put('b3kFig', Plot.lines({ name: 'b3-cinetica', series, xlab: m.t, ylab: m.y, hlines: isFinite(lim) ? [{ y: lim, label: T('límite', 'limit'), at: 'start' }] : [], legend: true }),
    { name: 'b3-cinetica', title: L2('Cinética de ', 'Kinetics of ') + esc(m.y), caption: L2('Puntos: datos; líneas: modelo ajustado con su banda de confianza de la media.', 'Points: data; lines: fitted model with the confidence band of the mean.'), block: 3,
      data: { header: ['grupo', 't', 'y'], rows: res.flatMap(r => r.t.map((t, i) => [r.group, t, r.y[i]])) } });
  buildTable('b3kTab', [
    keyG ? { key: 'group', label: esc(keyG) } : null,
    { key: 'order', label: L2('Orden', 'Order'), get: r => ordName(r.order) },
    { key: 'C0', label: 'C₀', num: true, get: r => Fmt.sig(r.fit.C0, 4) + ' ± ' + Fmt.sig(r.fit.se.C0, 2) },
    { key: 'k', label: 'k', num: true, get: r => Fmt.sig(r.fit.k, 4) + ' ± ' + Fmt.sig(r.fit.se.k, 2) },
    { key: 'kci', label: L2('IC de k', 'CI of k'), num: true, get: r => ciSig(r.fit.ci.k[0], r.fit.ci.k[1]) },
    { key: 'hl', label: L2('Vida media', 'Half-life'), num: true, get: r => Fmt.num(r.fit.halfLife, 1) },
    { key: 'r2', label: 'R²', num: true, get: r => Fmt.num(r.fit.r2, 4) },
    { key: 'n', label: 'n', num: true, get: r => r.fit.n },
    { key: 'tl', label: L2('Tiempo al límite', 'Time to limit'), num: true, get: r => (r.tl ? Fmt.num(r.tl.t, 1) : '—') },
    { key: 'tlci', label: L2('IC', 'CI'), num: true, get: r => (r.tl && isFinite(r.tl.t) ? Fmt.ci(r.tl.lo, r.tl.hi, 1) : '—') },
  ].filter(Boolean), res, { csvName: 'cinetica' });
  const cmpRows = [];
  res.forEach(r => r.cmp.fits.forEach((f, o) => cmpRows.push({ group: r.group, o, f, d: r.cmp.deltaAIC[o], w: r.cmp.weights[o], lin: r.cmp.linearR2[o], _class: o === r.cmp.best ? 'best' : '' })));
  buildTable('b3kCmp', [
    keyG ? { key: 'group', label: esc(keyG) } : null,
    { key: 'o', label: L2('Orden', 'Order'), get: r => ordName(r.o) + ' · ' + EQ[r.o] },
    { key: 'k', label: 'k', num: true, get: r => Fmt.sig(r.f.k, 4) },
    { key: 'rss', label: L2('SCE', 'RSS'), num: true, get: r => Fmt.sig(r.f.rss, 4) },
    { key: 'aic', label: 'AIC', num: true, get: r => Fmt.num(r.f.aic, 2) },
    { key: 'd', label: 'ΔAIC', num: true, get: r => Fmt.num(r.d, 2) },
    { key: 'w', label: L2('Peso de Akaike', 'Akaike weight'), num: true, get: r => Fmt.num(r.w, 3) },
    { key: 'lin', label: L2('R² linealizado', 'Linearised R²'), num: true, get: r => Fmt.num(r.lin, 4) },
  ].filter(Boolean), cmpRows, { csvName: 'cinetica_ordenes' });
  el('b3kCite').innerHTML = '';
  citeMethod('b3kCite', [Refs.short('labuza1984'), Refs.short('vanboekel2008'), [T('Mínimos cuadrados no lineales: ', 'Nonlinear least squares: ') + Refs.short('bates1988'), T('Nonlinear least squares: ', 'Nonlinear least squares: ') + Refs.short('bates1988')], 'AIC: ' + Refs.short('burnham2002')]);
  state.kinetics = Object.assign(state.kinetics || {}, { fits: res.map(r => ({ group: r.group, order: r.order, C0: r.fit.C0, k: r.fit.k, se: r.fit.se.k, t: r.tl ? r.tl.t : null })) });
  Report.set('kinetics:fit', { order: 30, title: ['Cinética de deterioro', 'Deterioration kinetics'], html: () => el('b3kRead').innerHTML + PHRep.fig('b3-cinetica') + PHRep.table('b3kTab') + PHRep.table('b3kCmp') });
}

/* the notes of the chosen fit in every group (the reading already says when the limit is
   never reached) and the orders that could not be fitted for the comparison */
function kinNotes(res, keyG) {
  const list = [];
  res.forEach(r => {
    const pre = keyG ? esc(keyG + ' ' + r.group) : '';
    r.fit.notes.filter(n => !/^k < 0/.test(n.es)).forEach(n => list.push({ pre, n }));
    r.cmp.fits.forEach((f, o) => { if (o !== r.order && !isFinite(f.aic)) list.push({ pre, n: { es: ORD[o][0] + ': no se pudo ajustar y queda fuera de la comparación.', en: ORD[o][1] + ': could not be fitted and is left out of the comparison.' } }); });
  });
  return notesHTML(list);
}

/* ---------------- temperature ---------------- */
let tTable;
function tempRun() {
  const rows = tTable.get().filter(r => isFinite(r.T) && r.T !== null && isFinite(r.k) && r.k !== null && r.k > 0);
  if (rows.length < 2) { el('b3tOut').hidden = true; return; }
  const Tc = rows.map(r => +r.T), k = rows.map(r => +r.k), se = rows.map(r => +r.se);
  const useW = UI.on('b3tW') && se.every(v => v > 0);
  const tref = UI.s('b3tTref') === '' ? undefined : UI.v('b3tTref');
  const A = Kin.arrhenius(Tc, k, { Tref: tref, se: useW ? se : undefined });
  const B = Tc.length >= 3 ? Kin.belehradek(Tc, k) : null;
  const ord = Tc.map((_, i) => i).sort((a, b) => Tc[a] - Tc[b]);
  const q10s = [];
  for (let i = 1; i < ord.length; i++) { const a = ord[i - 1], b = ord[i]; if (Tc[a] !== Tc[b]) q10s.push({ T1: Tc[a], T2: Tc[b], q: Kin.q10(k[a], Tc[a], k[b], Tc[b]) }); }
  S.t = { A, B, Tc, k, q10s };
  el('b3tOut').hidden = false;
  const q20 = Kin.q10FromEa(A.Ea, 20);
  statTiles('b3tTiles', [
    [T('Energía de activación', 'Activation energy'), Fmt.num(A.EaKJ, 1) + ' kJ/mol', Fmt.ci(A.ci.Ea[0] / 1000, A.ci.Ea[1] / 1000, 1), 'hi'],
    ['k (' + Fmt.num(A.TrefC, 1) + ' °C)', Fmt.sig(A.kRef, 4), ciSig(A.ci.kRef[0], A.ci.kRef[1])],
    ['Q10 (20–30 °C)', Fmt.num(q20, 2), T('desde Eₐ', 'from Eₐ')],
    ['R² Arrhenius', Fmt.num(A.r2, 4), A.weighted ? T('ponderado', 'weighted') : ''],
    B ? [T('Tmín (raíz cuadrada)', 'Tmin (square root)'), Fmt.num(B.Tmin, 1) + ' °C', 'R² ' + Fmt.num(B.r2, 4)] : null,
  ]);
  el('b3tRead').innerHTML = `<div class="reading"><p>${L2(`Con Eₐ = <b>${Fmt.num(A.EaKJ, 1)} kJ/mol</b>, cada 10 °C más multiplican la velocidad de deterioro por ${Fmt.num(Kin.q10FromEa(A.Ea, 5), 2)} cerca de 5 °C y por ${Fmt.num(Kin.q10FromEa(A.Ea, 25), 2)} cerca de 25 °C: Q10 no es constante.${q10s.length ? ' Entre las temperaturas medidas: ' + q10s.map(q => `${q.T1}→${q.T2} °C Q10 = ${Fmt.num(q.q, 2)}`).join('; ') + '.' : ''}${B ? ` El modelo de raíz cuadrada pone la temperatura mínima biológica en ${Fmt.num(B.Tmin, 1)} °C ${Fmt.ci(B.ci.Tmin[0], B.ci.Tmin[1], 1)}.` : ''}`, `With Eₐ = <b>${Fmt.num(A.EaKJ, 1)} kJ/mol</b>, every 10 °C more multiplies the deterioration rate by ${Fmt.num(Kin.q10FromEa(A.Ea, 5), 2)} near 5 °C and by ${Fmt.num(Kin.q10FromEa(A.Ea, 25), 2)} near 25 °C: Q10 is not constant.${q10s.length ? ' Between the measured temperatures: ' + q10s.map(q => `${q.T1}→${q.T2} °C Q10 = ${Fmt.num(q.q, 2)}`).join('; ') + '.' : ''}${B ? ` The square-root model puts the minimum biological temperature at ${Fmt.num(B.Tmin, 1)} °C ${Fmt.ci(B.ci.Tmin[0], B.ci.Tmin[1], 1)}.` : ''}`)}</p>${A.notes.map(n => `<p>${L2(n.es, n.en)}</p>`).join('')}${B ? notesHTML(B.notes.map(n => ({ pre: T('Raíz cuadrada', 'Square root'), n }))) : ''}</div>`;
  /* Arrhenius plot: ln k against 1000/T */
  const lo = Math.min(...Tc) - 3, hi = Math.max(...Tc) + 3;
  const tg = Array.from({ length: 41 }, (_, i) => lo + (hi - lo) * i / 40);
  const pr = A.predict(tg);
  el('b3tFigA').innerHTML = ''; el('b3tFigB').innerHTML = '';
  Fig.put('b3tFigA', Plot.lines({ name: 'b3-arrhenius', w: 520, h: 340, series: [
    { name: T('ajuste', 'fit'), x: tg.map(t => 1000 / (t + 273.15)), y: pr.map(p => p.lnk), points: false, band: { x: tg.map(t => 1000 / (t + 273.15)), lo: pr.map(p => Math.log(p.lo)), hi: pr.map(p => Math.log(p.hi)) } },
    { name: T('datos', 'data'), x: Tc.map(t => 1000 / (t + 273.15)), y: k.map(Math.log), line: false }], xlab: '1000 / T (K⁻¹)', ylab: 'ln k', legend: false }),
  { name: 'b3-arrhenius', title: L2('Gráfica de Arrhenius', 'Arrhenius plot'), caption: L2('La pendiente es −Eₐ/R.', 'The slope is −Eₐ/R.'), block: 3 });
  const series = [{ name: 'Arrhenius', x: tg, y: pr.map(p => p.k), points: false }, { name: T('datos', 'data'), x: Tc, y: k, line: false }];
  if (B) { const pb = B.predict(tg); series.splice(1, 0, { name: T('raíz cuadrada', 'square root'), x: tg, y: pb.map(p => p.k), points: false, dash: '6 3' }); }
  Fig.put('b3tFigB', Plot.lines({ name: 'b3-k-temperatura', w: 520, h: 340, series, xlab: T('Temperatura (°C)', 'Temperature (°C)'), ylab: 'k', yZero: true }), { name: 'b3-k-temperatura', title: L2('k contra la temperatura', 'k against temperature'), block: 3 });
  buildTable('b3tTab', [{ key: 'T', label: 'T (°C)', num: true }, { key: 'k', label: 'k', num: true, fmt: v => Fmt.sig(v, 4) }, { key: 'kA', label: L2('k (Arrhenius)', 'k (Arrhenius)'), num: true, get: r => Fmt.sig(A.predict(+r.T).k, 4) }, { key: 'q', label: L2('Q10 en T', 'Q10 at T'), num: true, get: r => Fmt.num(A.q10At(+r.T), 2) }], rows, { csvName: 'arrhenius' });
  shelfPaint();
  state.kinetics = Object.assign(state.kinetics || {}, { arrhenius: { Ea: A.EaKJ, r2: A.r2 } });
  Report.set('kinetics:temperature', { order: 31, title: ['Dependencia de la temperatura', 'Temperature dependence'], html: () => el('b3tRead').innerHTML + PHRep.fig('b3-arrhenius') + PHRep.fig('b3-k-temperatura') + el('b3tSL').innerHTML + PHRep.fig('b3-vida-temperatura') });
}
function shelfPaint() {
  if (!S.t) return;
  const A = S.t.A, ord = +UI.s('b3tOrd'), C0 = UI.v('b3tC0'), L = UI.v('b3tLim'), Tt = UI.v('b3tT'), intv = UI.s('b3tInt');
  const sign = L > C0 ? -1 : 1;
  const one = Kin.shelfLifeAt(A, Tt, L, { order: ord, C0, sign, interval: intv }).result;
  const tmin = Math.min(...S.t.Tc), tmax = Math.max(...S.t.Tc);
  const extra = Tt < tmin || Tt > tmax;
  statTiles('b3tSL', [
    [T('Vida de anaquel a ', 'Shelf life at ') + Fmt.num(Tt, 1) + ' °C', Fmt.num(one.t, 1), Fmt.ci(one.lo, one.hi, 1), extra ? 'warn' : 'good'],
    ['k (' + Fmt.num(Tt, 1) + ' °C)', Fmt.sig(one.k, 4), ciSig(one.kLo, one.kHi)],
    extra ? [T('Cuidado', 'Caution'), `<span class="sv-word">${T('extrapolación', 'extrapolation')}</span>`, T('fuera de ', 'outside ') + tmin + '–' + tmax + ' °C', 'warn'] : null,
  ]);
  const grid = Array.from({ length: 31 }, (_, i) => Math.max(-1, tmin - 8) + (tmax + 5 - Math.max(-1, tmin - 8)) * i / 30);
  const rr = Kin.shelfLifeAt(A, grid, L, { order: ord, C0, sign, interval: intv }).result.filter(r => isFinite(r.t));
  el('b3tFigC').innerHTML = '';
  if (rr.length) Fig.put('b3tFigC', Plot.lines({ name: 'b3-vida-temperatura', series: [{ name: T('vida de anaquel', 'shelf life'), x: rr.map(r => r.Tc), y: rr.map(r => r.t), points: false, band: { x: rr.map(r => r.Tc), lo: rr.map(r => r.lo), hi: rr.map(r => r.hi) } }],
    xlab: T('Temperatura (°C)', 'Temperature (°C)'), ylab: T('Vida de anaquel', 'Shelf life'), vlines: [{ x: tmin, label: T('medido', 'measured') }, { x: tmax }], legend: false, yZero: true }),
  { name: 'b3-vida-temperatura', title: L2('Vida de anaquel predicha', 'Predicted shelf life'), caption: L2('Banda: intervalo elegido. Fuera de las líneas punteadas, la predicción extrapola.', 'Band: the chosen interval. Outside the dotted lines the prediction extrapolates.'), block: 3 });
  el('b3tCite').innerHTML = '';
  citeMethod('b3tCite', ['Arrhenius: ' + Refs.short('arrhenius1889'), 'Q10: ' + Refs.short('taoukis1989'), [T('Raíz cuadrada: ', 'Square root: ') + Refs.short('ratkowsky1982'), 'Square root: ' + Refs.short('ratkowsky1982')]]);
}

/* ---------------- accelerated test ---------------- */
let aTable;
function asltRun() {
  const rows = aTable.get().filter(r => isFinite(r.T) && r.T !== null && r.th > 0);
  if (rows.length < 3) { el('b3aOut').hidden = true; return; }
  const model = UI.s('b3aModel'), Tt = UI.v('b3aT');
  const R = Kin.aslt({ Tc: rows.map(r => +r.T), shelfLife: rows.map(r => +r.th), Ttarget: Tt, model });
  S.a = R;
  el('b3aOut').hidden = false;
  statTiles('b3aTiles', [
    [T('Vida a ', 'Life at ') + Fmt.num(Tt, 1) + ' °C', Fmt.num(R.estimate, 1), T('predicción ', 'prediction ') + Fmt.ci(R.lo, R.hi, 1), 'hi'],
    ['Q10', Fmt.num(R.Q10, 2), model === 'q10' ? T('constante en el modelo', 'constant in the model') : T('a la temperatura de almacén', 'at the storage temperature')],
    [T('Eₐ', 'Eₐ'), Fmt.num(R.EaKJ, 1) + ' kJ/mol'], ['R²', Fmt.num(R.r2, 4)],
  ]);
  el('b3aRead').innerHTML = `<div class="reading"><p>${L2(`La recta de ln θ predice <b>${Fmt.num(R.estimate, 1)}</b> a ${Fmt.num(Tt, 1)} °C; el intervalo de predicción, ${Fmt.ci(R.lo, R.hi, 1)}, es el de una nueva prueba a esa temperatura y casi siempre es ancho, porque extrapola desde pocas temperaturas. La predicción supone que el mecanismo de deterioro es el mismo a las temperaturas altas y a la de almacén (Mizrahi 2004).`, `The line of ln θ predicts <b>${Fmt.num(R.estimate, 1)}</b> at ${Fmt.num(Tt, 1)} °C; the prediction interval, ${Fmt.ci(R.lo, R.hi, 1)}, is that of a new test at that temperature and it is almost always wide, because it extrapolates from few temperatures. The prediction assumes that the deterioration mechanism is the same at the high temperatures and at the storage one (Mizrahi 2004).`)}</p>${R.notes.map(n => `<p><b>${L2(n.es, n.en)}</b></p>`).join('')}</div>`;
  const lo = Math.min(Tt, ...R.Tc) - 2, hi = Math.max(Tt, ...R.Tc) + 2;
  const g = Array.from({ length: 41 }, (_, i) => lo + (hi - lo) * i / 40), P = g.map(R.predict);
  el('b3aFig').innerHTML = '';
  Fig.put('b3aFig', Plot.lines({ name: 'b3-aslt', series: [
    { name: T('modelo', 'model'), x: g, y: P.map(p => p.estimate), points: false, band: { x: g, lo: P.map(p => p.lo), hi: P.map(p => p.hi) } },
    { name: T('prueba acelerada', 'accelerated test'), x: R.Tc, y: R.shelfLife, line: false },
    { name: T('predicción', 'prediction'), x: [Tt], y: [R.estimate], lo: [R.lo], hi: [R.hi], line: false, shape: 'diamond', r: 5 }],
  xlab: T('Temperatura (°C)', 'Temperature (°C)'), ylab: T('Vida de anaquel', 'Shelf life'), yZero: true }), { name: 'b3-aslt', title: L2('Prueba acelerada de vida de anaquel', 'Accelerated shelf-life test'), caption: L2('Banda: intervalo de predicción.', 'Band: prediction interval.'), block: 3 });
  el('b3aCite').innerHTML = '';
  citeMethod('b3aCite', [Refs.short('mizrahi2004'), Refs.short('labuza1984')]);
  state.kinetics = Object.assign(state.kinetics || {}, { aslt: { T: Tt, estimate: R.estimate } });
  Report.set('kinetics:aslt', { order: 32, title: ['Prueba acelerada', 'Accelerated test'], html: () => el('b3aRead').innerHTML + PHRep.fig('b3-aslt') });
}

/* ---------------- time to rejection ---------------- */
function survRun(D) {
  const m = D.map, keyG = m.group || null;
  const rows = D.rows.filter(r => isFinite(r[m.time]) && r[m.time] !== null && r[m.status] != null && (!keyG || (r[keyG] != null && r[keyG] !== '')));
  const time = rows.map(r => +r[m.time]), status = rows.map(r => +r[m.status]);
  const group = keyG ? rows.map(r => String(r[keyG])) : null;
  const levels = keyG ? Trial.levelsOf(rows, keyG) : null;
  const ciType = UI.s('b3sCI'), p = Math.min(0.99, Math.max(0.01, UI.v('b3sP') / 100));
  const K = keyG ? Surv.kmGroups(time, status, group, { levels, confType: ciType }) : { levels: ['—'], groups: [Surv.km(time, status, { confType: ciType })], logrank: null };
  const cmp = Surv.compare(time, status, group, { levels });
  const dsel = UI.s('b3sDist'), dist = dsel === 'auto' ? cmp.best : dsel;
  const fit = cmp.fits[cmp.rows.findIndex(r => r.dist === dist)];
  S.s = { K, cmp, dist, fit, levels, keyG, p };
  el('b3sOut').hidden = false;
  const ev = status.filter(v => v === 1).length;
  /* the notes of Kaplan–Meier in each group, of the chosen model and the models that did not converge */
  const sNotes = notesHTML(K.groups.flatMap((g0, i) => (g0.notes || []).map(n => ({ pre: keyG ? esc(keyG + ' ' + K.levels[i]) : '', n }))).concat(
    fit ? fit.notes.map(n => ({ pre: esc(distName(dist, true)), n })) : [],
    cmp.fits.filter(f => f !== fit && isFinite(f.aic) && !f.converged).map(f => ({ pre: esc(distName(f.dist, true)), n: { es: 'la máxima verosimilitud no convergió; su AIC es aproximado.', en: 'maximum likelihood did not converge; its AIC is approximate.' } }))));
  if (!fit || !cmp.best) {
    /* no model could be fitted (no rejections, or too few): only the counts and why */
    statTiles('b3sTiles', [[T('Frutos', 'Fruit'), time.length], [T('Rechazados', 'Rejected'), ev], [T('Censurados', 'Censored'), time.length - ev]]);
    el('b3sRead').innerHTML = `<div class="reading"><p>${L2('Ningún modelo paramétrico pudo ajustarse: hacen falta frutos rechazados (estado 1).', 'No parametric model could be fitted: rejected fruit (status 1) are needed.')}</p>${notesHTML((cmp.fits[0] ? cmp.fits[0].notes : []).map(n => ({ pre: '', n })))}</div>`;
    ['b3sFig', 'b3sTab', 'b3sAIC', 'b3sPar', 'b3sCite'].forEach(id => { el(id).innerHTML = ''; });
    delete Report.sections['kinetics:survival'];
    return;
  }
  statTiles('b3sTiles', [
    [T('Frutos', 'Fruit'), time.length], [T('Rechazados', 'Rejected'), ev, Fmt.pct(100 * ev / time.length) ], [T('Censurados', 'Censored'), time.length - ev, T('aún aceptables al terminar', 'still acceptable at the end')],
    K.logrank ? [T('Rango logarítmico', 'Log-rank'), 'χ² = ' + Fmt.num(K.logrank.chisq, 2), Fmt.pEq(K.logrank.p) + T(' (gl ', ' (df ') + K.logrank.df + ')', K.logrank.p < 0.05 ? 'hi' : ''] : null,
    [T('Mejor modelo', 'Best model'), distName(cmp.best, true), 'AIC'],
  ]);
  const grp = K.groups.map((g0, i) => {
    const lv = K.levels[i], q = fit.quantile(p, keyG ? lv : undefined), md = fit.quantile(0.5, keyG ? lv : undefined);
    return { name: lv, n: g0.n, events: g0.events, median: g0.median, mlo: g0.medianCI[0], mhi: g0.medianCI[1], rmean: g0.rmean, rmeanSE: g0.rmeanSE, q, md };
  });
  const bestG = grp.slice().sort((a, b) => b.q.est - a.q.est)[0];
  el('b3sRead').innerHTML = `<div class="reading"><p>${L2(`Con el modelo ${DISTS[dist][0]}, el ${Fmt.num(p * 100, 0)} % de los frutos se rechaza hacia el día ` + grp.map(g0 => `${keyG ? '<b>' + esc(g0.name) + '</b> ' : ''}${Fmt.num(g0.q.est, 1)} ${Fmt.ci(g0.q.lo, g0.q.hi, 1)}`).join(', ') + '.', `With the ${DISTS[dist][1]} model, ${Fmt.num(p * 100, 0)} % of the fruit are rejected around day ` + grp.map(g0 => `${keyG ? '<b>' + esc(g0.name) + '</b> ' : ''}${Fmt.num(g0.q.est, 1)} ${Fmt.ci(g0.q.lo, g0.q.hi, 1)}`).join(', ') + '.')}</p>` +
    (K.logrank ? `<p>${K.logrank.p < 0.05 ? L2(`Las curvas difieren (rango logarítmico ${Fmt.pEq(K.logrank.p)}): <b>${esc(bestG.name)}</b> conserva los frutos aceptables por más tiempo.`, `The curves differ (log-rank ${Fmt.pEq(K.logrank.p)}): <b>${esc(bestG.name)}</b> keeps the fruit acceptable longest.`) : L2(`Las curvas no difieren con claridad (rango logarítmico ${Fmt.pEq(K.logrank.p)}).`, `The curves do not clearly differ (log-rank ${Fmt.pEq(K.logrank.p)}).`)}</p>` : '') +
    `<p>${L2('Los frutos censurados cuentan mientras estuvieron en observación; descartarlos acortaría la vida estimada.', 'Censored fruit count while they were observed; discarding them would shorten the estimated life.')}</p>${sNotes}</div>`;
  /* figure: KM steps with censor marks and the parametric curves */
  const curves = K.groups.map((g0, i) => {
    const ev = g0.time.map((t, j) => [t, g0.surv[j], g0.lower[j], g0.upper[j], g0.nEvent[j], g0.nCensor[j]]).filter(r => r[4] > 0);
    return { name: keyG ? keyG + ' ' + K.levels[i] : T('todos', 'all'), time: ev.map(r => r[0]), surv: ev.map(r => r[1]), lower: ev.map(r => r[2]), upper: ev.map(r => r[3]), censor: g0.time.filter((t, j) => g0.nCensor[j] > 0) };
  });
  el('b3sFig').innerHTML = '';
  let svg = Plot.km({ name: 'b3-kaplan-meier', curves, xlab: T('Tiempo', 'Time') + ' (' + m.time + ')', ylab: T('Fracción aceptable', 'Fraction acceptable'), hline: 1 - p });
  /* overlay of the parametric survival */
  const tMax = Math.max(...time) * 1.04;
  const W = 620, H = 360, x0 = 62, x1 = W - 16 - Math.min(190, 34 + Math.max(...curves.map(c => c.name.length)) * 6.2), y1 = 18, y0 = H - 46;
  let over = '';
  K.levels.forEach((lv, i) => {
    let d = '';
    for (let j = 0; j <= 60; j++) { const t = tMax * j / 60, sv = fit.surv(Math.max(1e-6, t), keyG ? lv : undefined); if (isFinite(sv)) d += (d ? 'L' : 'M') + (x0 + (x1 - x0) * t / tMax).toFixed(2) + ' ' + (y0 - (y0 - y1) * sv / 1.02).toFixed(2); }
    over += `<path d="${d}" fill="none" stroke="${Plot.color(i)}" stroke-width="1.3" stroke-dasharray="1.5 3" opacity=".9"/>`;
  });
  svg = svg.replace('</svg>', over + '</svg>');
  Fig.put('b3sFig', svg, { name: 'b3-kaplan-meier', title: L2('Kaplan–Meier y modelo ' + esc(DISTS[dist][0]), 'Kaplan–Meier and the ' + esc(DISTS[dist][1]) + ' model'), caption: L2('Escalones: Kaplan–Meier; marcas verticales: censuras; punteado fino: modelo paramétrico; línea de guiones: el rechazo tolerado.', 'Steps: Kaplan–Meier; vertical ticks: censorings; fine dots: parametric model; dashed line: the tolerated rejection.'), block: 3 });
  buildTable('b3sTab', [
    { key: 'name', label: keyG ? esc(keyG) : L2('Grupo', 'Group') }, { key: 'n', label: 'n', num: true }, { key: 'events', label: L2('Rechazos', 'Rejections'), num: true },
    { key: 'median', label: L2('Mediana (KM)', 'Median (KM)'), num: true, get: r => Fmt.num(r.median, 1) }, { key: 'mci', label: L2('IC', 'CI'), num: true, get: r => (isFinite(r.mlo) || isFinite(r.mhi) ? Fmt.ci(r.mlo, r.mhi, 1).replace('—', '∞') : '—') },
    { key: 'rmean', label: L2('Media restringida', 'Restricted mean'), num: true, get: r => Fmt.num(r.rmean, 1) + ' ± ' + Fmt.num(r.rmeanSE, 1) },
    { key: 'q', label: L2('Tiempo al ', 'Time to ') + Fmt.num(p * 100, 0) + ' %', num: true, get: r => Fmt.num(r.q.est, 1) + ' ' + Fmt.ci(r.q.lo, r.q.hi, 1) },
    { key: 'md', label: L2('Mediana (modelo)', 'Median (model)'), num: true, get: r => Fmt.num(r.md.est, 1) + ' ' + Fmt.ci(r.md.lo, r.md.hi, 1) },
  ], grp, { csvName: 'tiempo_hasta_rechazo' });
  buildTable('b3sAIC', [{ key: 'dist', label: L2('Modelo', 'Model'), get: r => distName(r.dist, true) }, { key: 'loglik', label: L2('Log-verosimilitud', 'Log-likelihood'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'df', label: L2('Parámetros', 'Parameters'), num: true }, { key: 'aic', label: 'AIC', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'deltaAIC', label: 'ΔAIC', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'weight', label: L2('Peso', 'Weight'), num: true, fmt: v => Fmt.num(v, 3) }],
    cmp.rows.map(r => Object.assign({ _class: r.dist === cmp.best ? 'best' : '' }, r)), { csvName: 'modelos_supervivencia' });
  if (fit.timeRatio && fit.timeRatio.length) {
    buildTable('b3sPar', [{ key: 'name', label: L2('Contra la referencia', 'Against the reference'), get: r => esc(String(r.name).replace(/^group:?/, '')) + ' / ' + esc(levels[0]) }, { key: 'est', label: L2('Razón de tiempos', 'Time ratio'), num: true, fmt: v => Fmt.num(v, 3) }, { key: 'ci', label: L2('IC 95 %', '95 % CI'), num: true, get: r => Fmt.ci(r.lo, r.hi, 3) }], fit.timeRatio);
    el('b3sPar').insertAdjacentHTML('afterbegin', `<p class="hint">${L2('Una razón de tiempos de 1.4 quiere decir que ese tratamiento alarga en 40 % el tiempo hasta el rechazo respecto al grupo de referencia.', 'A time ratio of 1.4 means that the treatment lengthens the time to rejection by 40 % compared with the reference group.')}</p>`);
  } else el('b3sPar').innerHTML = '';
  el('b3sCite').innerHTML = '';
  citeMethod('b3sCite', ['Kaplan–Meier: ' + Refs.short('kaplan1958') + '; Greenwood 1926', [T('Rango logarítmico: ', 'Log-rank: ') + Refs.short('mantel1966'), 'Log-rank: ' + Refs.short('mantel1966')], [T('Modelos de tiempo de falla: ', 'Failure-time models: ') + Refs.short('lawless2003'), 'Failure-time models: ' + Refs.short('lawless2003')], Refs.short('hough2003')]);
  state.kinetics = Object.assign(state.kinetics || {}, { survival: { n: time.length, best: cmp.best } });
  Report.set('kinetics:survival', { order: 33, title: ['Tiempo hasta el rechazo', 'Time to rejection'], html: () => el('b3sRead').innerHTML + PHRep.fig('b3-kaplan-meier') + PHRep.table('b3sTab') + PHRep.table('b3sAIC') });
}

/* the k of the mango example (firmness against day by temperature) */
function exampleK() {
  const R = Datasets.rows('mango'), ok = r => r.dia != null && r.firmeza_N != null && isFinite(r.dia) && isFinite(r.firmeza_N);
  const res = Trial.levelsOf(R.filter(ok), 'temperatura').map(g => {
    const sub = R.filter(r => ok(r) && String(r.temperatura) === g);
    const cmp = Kin.compare(sub.map(r => +r.dia), sub.map(r => +r.firmeza_N), { conf: 0.95 }), order = cmp.best >= 0 ? cmp.best : 1;
    return { group: g, order, fit: cmp.fits[order] };
  });
  return { rows: kRows(res), order: res.length ? res[0].order : 1, C0: res.length ? +Num.mean(res.map(r => r.fit.C0)).toFixed(3) : 125 };
}

/* ---------------- start ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const P = el('panel-3');
  P.innerHTML = UI.panel(3, 'Cinética y vida de anaquel', 'Kinetics and shelf life', 'Órdenes de reacción, temperatura, pruebas aceleradas y tiempo hasta el rechazo', 'Reaction orders, temperature, accelerated tests and time to rejection', tools);
  if (window.I18N) I18N.apply(P);
  const k = DataIn.mount('b3kIn', {
    id: 'b3k',
    roles: [
      { key: 't', es: 'Tiempo', en: 'Time', type: 'num', match: ['dia', 'dias', 'tiempo', 'day', 'days', 'time', 'semana', 'hora'] },
      { key: 'y', es: 'Atributo', en: 'Attribute', type: 'num', match: ['firmeza_n', 'firmeza', 'firmness', 'vitamina', 'color'] },
      { key: 'group', es: 'Grupo', en: 'Group', optional: true, match: ['temperatura', 'temperature', 'tratamiento', 'treatment', 'grupo', 'group'] },
    ],
    examples: [{ id: 'mango' }],
    onData: kinRun,
  });
  window.PHLoad.b3k = () => k.load(0);
  ['b3kOrder', 'b3kMeth', 'b3kLim', 'b3kConf'].forEach(id => el(id).addEventListener('change', () => k.refire()));
  el('b3kToT').addEventListener('click', () => {
    if (!S.k) return;
    const rows = kRows(S.k.res);
    if (rows.length < 2) { if (window.LABG) LABG.toast(T('Para Arrhenius el grupo debe ser la temperatura (números).', 'For Arrhenius the group must be the temperature (numbers).'), { type: 'warning' }); return; }
    /* the order, C₀ and limit first: setting the table recomputes everything, shelf life included */
    el('b3tOrd').value = String(S.k.res[0].order); el('b3tC0').value = +Num.mean(S.k.res.map(r => r.fit.C0)).toFixed(3);
    if (UI.s('b3kLim') !== '') el('b3tLim').value = UI.s('b3kLim');
    tTable.set(rows);
    Tabs.go(3, 'temperatura');
  });
  /* the temperature tab opens with the k of the mango example, fitted as «Kinetic
     models» fits it by default (order by AIC, nonlinear, 95 %): the same rows,
     order and C₀ that «Take the k values…» brings, so both roads give one Eₐ */
  const ex = exampleK();
  tTable = EditTable.mount('b3tTable', {
    id: 'b3t',
    /* k and its SE are shown with the digits of the kinetic table (4 and 2 significant);
       the full values stay in the rows and go into the fit */
    columns: [{ key: 'T', es: 'Temperatura (°C)', en: 'Temperature (°C)', type: 'num' }, { key: 'k', es: 'k', en: 'k', type: 'num', show: v => +(+v).toPrecision(4) }, { key: 'se', es: 'EE de k (opcional)', en: 'SE of k (optional)', type: 'num', show: v => +(+v).toPrecision(2) }],
    rows: ex.rows,
    blank: () => ({ T: null, k: null, se: null }),
    onChange: tempRun,
  });
  el('b3tOrd').value = String(ex.order); el('b3tC0').value = ex.C0;
  ['b3tW', 'b3tTref'].forEach(id => el(id).addEventListener('change', tempRun));
  ['b3tOrd', 'b3tC0', 'b3tLim', 'b3tT', 'b3tInt'].forEach(id => { el(id).addEventListener('input', shelfPaint); el(id).addEventListener('change', shelfPaint); });
  tempRun();
  aTable = EditTable.mount('b3aTable', {
    id: 'b3a',
    columns: [{ key: 'T', es: 'Temperatura (°C)', en: 'Temperature (°C)', type: 'num' }, { key: 'th', es: 'Vida de anaquel observada', en: 'Observed shelf life', type: 'num' }],
    rows: [{ T: 30, th: 4.8 }, { T: 35, th: 3.1 }, { T: 40, th: 2.1 }, { T: 30, th: 5.3 }, { T: 35, th: 2.8 }, { T: 40, th: 1.9 }],
    blank: () => ({ T: null, th: null }),
    onChange: asltRun,
  });
  ['b3aModel', 'b3aT'].forEach(id => { el(id).addEventListener('change', asltRun); el(id).addEventListener('input', asltRun); });
  asltRun();
  const s = DataIn.mount('b3sIn', {
    id: 'b3s',
    roles: [
      { key: 'time', es: 'Tiempo hasta el rechazo o la censura', en: 'Time to rejection or censoring', type: 'num', match: ['dias', 'tiempo', 'time', 'days', 'dia'] },
      { key: 'status', es: 'Rechazado (1) o censurado (0)', en: 'Rejected (1) or censored (0)', type: 'num', match: ['rechazado', 'estado', 'status', 'evento', 'event', 'rejected'] },
      { key: 'group', es: 'Tratamiento', en: 'Treatment', optional: true, match: ['tratamiento', 'treatment', 'grupo', 'group', 'recubrimiento'] },
    ],
    examples: [{ id: 'chayoteRechazo' }],
    onData: survRun,
  });
  window.PHLoad.b3s = () => s.load(0);
  ['b3sCI', 'b3sDist', 'b3sP'].forEach(id => el(id).addEventListener('change', () => s.refire()));
});
document.addEventListener('langchange', () => {
  ['b3k', 'b3s'].forEach(id => { const d = DataIn.registry[id]; if (d && d.get()) d.refire(); });
  if (S.t) tempRun(); if (S.a) asltRun();
});
})();
