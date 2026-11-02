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

/* PostHarvestPro — Block 4, respiration, ethylene and atmospheres: closed and
   flow-through systems, the climacteric, modified-atmosphere packaging and
   precooling with the heat load of a cooling job. */
(function () {
'use strict';
const S = { s: null, f: null, c: null, m: null, k: null };
/* Kader (2002): respiration classes at 5 °C (mg CO₂ kg⁻¹ h⁻¹) and ethylene classes at 20 °C (µL kg⁻¹ h⁻¹) */
const RESP_CLASS = [[5, 'muy baja', 'very low'], [10, 'baja', 'low'], [20, 'moderada', 'moderate'], [40, 'alta', 'high'], [60, 'muy alta', 'very high'], [Infinity, 'extremadamente alta', 'extremely high']];
const ETH_CLASS = [[0.1, 'muy baja', 'very low'], [1, 'baja', 'low'], [10, 'moderada', 'moderate'], [100, 'alta', 'high'], [Infinity, 'muy alta', 'very high']];
const cls = (C, v) => { const c = C.find(x => v < x[0]); return c ? T(c[1], c[2]) : '—'; };
/* units of the climacteric series: [id, es, en, es singular, en singular] and the respiration rate */
const TIME_UNITS = [['d', 'días', 'days', 'día', 'day'], ['h', 'horas', 'hours', 'hora', 'hour']];
const RESP_UNITS = [['mg', 'mg CO₂ kg⁻¹ h⁻¹'], ['ml', 'mL CO₂ kg⁻¹ h⁻¹']];
const ETH_UNIT = 'µL kg⁻¹ h⁻¹';
/* recommended modified/controlled atmospheres (% O₂, % CO₂), Kader 2002, for the usual temperature of each crop */
const WINDOWS = [
  ['aguacate', 'Aguacate', 'Avocado', [2, 5], [3, 10]], ['mango', 'Mango', 'Mango', [3, 5], [5, 8]], ['papaya', 'Papaya', 'Papaya', [2, 5], [5, 8]],
  ['platano', 'Plátano', 'Banana', [2, 5], [2, 5]], ['jitomate', 'Jitomate verde maduro', 'Mature-green tomato', [3, 5], [2, 3]], ['fresa', 'Fresa', 'Strawberry', [5, 10], [15, 20]],
  ['zarzamora', 'Arándano', 'Blueberry', [2, 5], [12, 20]], ['cereza', 'Cereza', 'Sweet cherry', [3, 10], [10, 15]], ['brocoli', 'Brócoli', 'Broccoli', [1, 2], [5, 10]],
  ['manzana', 'Manzana', 'Apple', [1, 3], [1, 5]], ['custom', 'Otra (escribe la ventana)', 'Other (type the window)', [3, 5], [5, 10]],
];

const tools = [
  { id: 'estatico', es: 'Sistema estático', en: 'Static system', html: `
    <div class="card"><h2>${L2('Lecturas en frasco cerrado', 'Readings in a closed jar')}</h2>
      <p class="hint">${L2('Se cierra el producto en un frasco y se lee CO₂ (y, si se tiene, O₂ y etileno) a varios tiempos. La tasa sale de la pendiente de cada gas contra el tiempo, por mínimos cuadrados, y del volumen libre del frasco.', 'The produce is sealed in a jar and CO₂ (and, if available, O₂ and ethylene) is read at several times. The rate comes from the slope of each gas against time, by least squares, and from the free volume of the jar.')}</p>
      <div id="b4sIn"></div>
      <div class="form-grid tight">${UI.num('b4sMass', 'Masa (kg), si no hay columna', 'Mass (kg), if there is no column', 0.65)}${UI.num('b4sVol', 'Volumen del frasco (L), si no hay columna', 'Jar volume (L), if there is no column', 3.8)}${UI.num('b4sDen', 'Densidad del producto (kg/L)', 'Produce density (kg/L)', 1.0)}${UI.num('b4sT', 'Temperatura (°C)', 'Temperature (°C)', 20)}${UI.num('b4sP', 'Presión (kPa)', 'Pressure (kPa)', 101.325)}</div></div>
    <div class="card" id="b4sOut" hidden><h2>${L2('Tasa de respiración y producción de etileno', 'Respiration rate and ethylene production')}</h2><div id="b4sTiles"></div><div id="b4sRead"></div><div class="figs-2"><div id="b4sFig1"></div><div id="b4sFig2"></div></div><div id="b4sTab"></div><div id="b4sCite"></div></div>` },
  { id: 'flujo', es: 'Flujo continuo', en: 'Flow-through', html: `
    <div class="card"><h2>${L2('Cámaras con flujo de aire', 'Chambers with air flow')}</h2>
      <p class="hint">${L2('Concentraciones a la entrada y a la salida de cada cámara en estado estable, con el flujo de aire y la masa de producto.', 'Concentrations at the inlet and the outlet of each chamber at steady state, with the air flow and the mass of produce.')}</p>
      <div id="b4fTable"></div><div class="form-grid tight">${UI.num('b4fT', 'Temperatura (°C)', 'Temperature (°C)', 20)}</div></div>
    <div class="card" id="b4fOut" hidden><h2>${L2('Tasas por cámara', 'Rates by chamber')}</h2><div id="b4fTiles"></div><div id="b4fTab"></div><div id="b4fCite"></div></div>` },
  { id: 'climaterio', es: 'Climaterio', en: 'Climacteric', html: `
    <div class="card"><h2>${L2('Curvas de respiración y etileno', 'Respiration and ethylene curves')}</h2>
      <p class="hint">${L2('Respiración y etileno de los mismos frutos a lo largo de la maduración. La clasificación sigue una regla explícita (abajo): es una orientación, no un veredicto.', 'Respiration and ethylene of the same fruit along ripening. The classification follows an explicit rule (below): it is a guide, not a verdict.')}</p>
      <div id="b4cIn"></div>
      <div class="form-grid tight">${UI.sel('b4cTU', 'Unidad del tiempo', 'Time unit', TIME_UNITS.map(u => [u[0], u[1], u[2]]), 'd')}${UI.sel('b4cRU', 'Unidad de la respiración', 'Respiration unit', RESP_UNITS.map(u => [u[0], u[1], u[1]]), 'mg')}${UI.num('b4cRise','Alza respiratoria mínima (×)', 'Minimum respiratory rise (×)', 1.5)}${UI.num('b4cER', 'Alza de etileno mínima (×)', 'Minimum ethylene rise (×)', 10)}${UI.num('b4cEM', 'Etileno pico mínimo (µL kg⁻¹ h⁻¹)', 'Minimum ethylene peak (µL kg⁻¹ h⁻¹)', 1)}</div></div>
    <div class="card" id="b4cOut" hidden><h2>${L2('Patrón de maduración', 'Ripening pattern')}</h2><div id="b4cTiles"></div><div id="b4cRead"></div><div class="figs-2"><div id="b4cFig1"></div><div id="b4cFig2"></div></div><div id="b4cCite"></div></div>` },
  { id: 'map', es: 'Atmósfera modificada', en: 'Modified atmosphere', html: `
    <div class="card"><h2>${L2('Producto y empaque', 'Produce and package')}</h2>
      <p class="hint">${L2('La respiración debe ser la del producto a la temperatura del empaque. La atmósfera de equilibrio es aquella en que el O₂ que consume el producto iguala al que entra por la película, y lo mismo con el CO₂.', 'Respiration must be that of the produce at the package temperature. The equilibrium atmosphere is the one at which the O₂ the produce consumes equals the O₂ entering through the film, and likewise for CO₂.')}</p>
      <div class="form-grid tight">${UI.sel('b4mProd', 'Producto (ventana recomendada)', 'Produce (recommended window)', WINDOWS.map(w => [w[0], w[1], w[2]]), 'aguacate')}${UI.num('b4mO2a', 'O₂ mínimo (%)', 'O₂ minimum (%)', 2)}${UI.num('b4mO2b', 'O₂ máximo (%)', 'O₂ maximum (%)', 5)}${UI.num('b4mCa', 'CO₂ mínimo (%)', 'CO₂ minimum (%)', 3)}${UI.num('b4mCb', 'CO₂ máximo (%)', 'CO₂ maximum (%)', 10)}</div>
      <div class="form-grid tight">${UI.num('b4mR', 'Consumo de O₂ (mL kg⁻¹ h⁻¹)', 'O₂ uptake (mL kg⁻¹ h⁻¹)', 4)}${UI.num('b4mRQ', 'Cociente respiratorio', 'Respiratory quotient', 0.9)}${UI.num('b4mW', 'Masa por empaque (kg)', 'Mass per package (kg)', 0.5)}${UI.num('b4mL', 'Largo de la bolsa (cm)', 'Bag length (cm)', 30)}${UI.num('b4mWd', 'Ancho de la bolsa (cm)', 'Bag width (cm)', 25)}${UI.num('b4mTemp', 'Temperatura (°C)', 'Temperature (°C)', 8)}</div>
      <div class="form-grid tight">${UI.sel('b4mFilm', 'Película', 'Film', Resp.FILMS.map(f => [f.id, f.es, f.en]), 'ldpe', { wide: true })}${UI.num('b4mTh', 'Espesor (µm)', 'Thickness (µm)', 40)}${UI.check('b4mMM', 'Respiración limitada por el O₂ (Michaelis–Menten)', 'O₂-limited respiration (Michaelis–Menten)', false)}${UI.num('b4mKm', 'Km (% O₂)', 'Km (% O₂)', 2)}${UI.num('b4mKi', 'Ki del CO₂ (%)', 'CO₂ Ki (%)', 15)}</div>
      <details style="margin-top:6px"><summary class="hint" style="cursor:pointer">${L2('Permeabilidades de las películas (editables)', 'Film permeabilities (editable)')}</summary><p class="hint">${L2('mL·µm m⁻² d⁻¹ atm⁻¹ a 23 °C y energía de activación en kJ/mol. Son valores orientativos: usa los de la ficha técnica de tu película.', 'mL·µm m⁻² d⁻¹ atm⁻¹ at 23 °C and activation energy in kJ/mol. Orientative values: use those of your film\'s data sheet.')}</p><div id="b4mFilms"></div></details></div>
    <div class="card" id="b4mOut" hidden><h2>${L2('Atmósfera de equilibrio', 'Equilibrium atmosphere')}</h2><div id="b4mTiles"></div><div id="b4mRead"></div><div id="b4mFig"></div><div id="b4mTab"></div><div id="b4mCite"></div></div>` },
  { id: 'enfriamiento', es: 'Preenfriamiento y carga térmica', en: 'Precooling and heat load', html: `
    <div class="card"><h2>${L2('Curva de enfriamiento', 'Cooling curve')}</h2>
      <p class="hint">${L2('Temperatura de la pulpa a lo largo del enfriamiento (aire forzado, agua, hielo o vacío) y la del medio. El ejemplo es una curva simulada de aire forzado.', 'Pulp temperature along cooling (forced air, water, ice or vacuum) and that of the medium. The example is a simulated forced-air curve.')}</p>
      <div id="b4kTable"></div><div class="form-grid tight">${UI.num('b4kTm', 'Temperatura del medio (°C)', 'Medium temperature (°C)', 1)}${UI.num('b4kTt', 'Temperatura objetivo (°C)', 'Target temperature (°C)', 5)}</div></div>
    <div class="card" id="b4kOut" hidden><h2>${L2('Tiempos de enfriamiento', 'Cooling times')}</h2><div id="b4kTiles"></div><div id="b4kRead"></div><div id="b4kFig"></div></div>
    <div class="card"><h2>${L2('Carga de refrigeración', 'Refrigeration load')}</h2>
      <div class="form-grid tight">${UI.num('b4hM', 'Producto (kg)', 'Produce (kg)', 10000)}${UI.num('b4hW', 'Agua del producto (%)', 'Water content (%)', 85)}${UI.num('b4hTi', 'Temperatura inicial (°C)', 'Initial temperature (°C)', 28)}${UI.num('b4hTf', 'Temperatura final (°C)', 'Final temperature (°C)', 8)}${UI.num('b4hH', 'Tiempo disponible (h)', 'Time available (h)', 6)}${UI.num('b4hR', 'Respiración (mg CO₂ kg⁻¹ h⁻¹)', 'Respiration (mg CO₂ kg⁻¹ h⁻¹)', 60)}${UI.num('b4hPM', 'Empaque (kg)', 'Packaging (kg)', 800)}${UI.num('b4hPC', 'Calor específico del empaque (kJ kg⁻¹ K⁻¹)', 'Packaging specific heat (kJ kg⁻¹ K⁻¹)', 1.4)}${UI.num('b4hX', 'Otras cargas (%)', 'Other loads (%)', 20)}</div>
      <div id="b4hTiles"></div><div id="b4hRead"></div><div id="b4hCite"></div></div>` },
];

/* ---------------- closed system ---------------- */
function staticRun(D) {
  const m = D.map;
  const jarKey = m.jar || null;
  const jars = jarKey ? Trial.levelsOf(D.rows, jarKey) : ['1'];
  const den = UI.v('b4sDen') || 1, temp = UI.v('b4sT'), kPa = UI.v('b4sP') || 101.325;
  const res = jars.map(j => {
    const sub = D.rows.filter(r => !jarKey || String(r[jarKey]) === j).filter(r => isFinite(r[m.t]) && r[m.t] !== null).sort((a, b) => a[m.t] - b[m.t]);
    const mass = m.mass && isFinite(sub[0][m.mass]) ? +sub[0][m.mass] : UI.v('b4sMass');
    const vol = m.vol && isFinite(sub[0][m.vol]) ? +sub[0][m.vol] : UI.v('b4sVol');
    const free = Resp.freeVolume(vol, mass, den);
    const r = Resp.closed({ t: sub.map(x => +x[m.t]), co2: colNum(sub, m.co2), o2: m.o2 ? colNum(sub, m.o2) : null, c2h4: m.c2h4 ? colNum(sub, m.c2h4) : null, mass, free, temp, kPa });
    return { jar: j, mass, vol, free, r, sub };
  });
  S.s = { res, map: m };
  el('b4sOut').hidden = false;
  const avg = f => { const v = res.map(f).filter(isFinite); return { m: v.length ? Num.mean(v) : NaN, se: v.length > 1 ? Num.sd(v) / Math.sqrt(v.length) : NaN }; };
  const co2 = avg(x => x.r.co2 ? x.r.co2.mgKgH : NaN), co2ml = avg(x => x.r.co2 ? x.r.co2.mlKgH : NaN), o2 = avg(x => x.r.o2 ? x.r.o2.mlKgH : NaN), rq = avg(x => x.r.rq), eth = avg(x => x.r.c2h4 ? x.r.c2h4.ulKgH : NaN);
  const heat = Resp.respHeat(co2.m);
  statTiles('b4sTiles', [
    ['CO₂ (mg kg⁻¹ h⁻¹)', Fmt.num(co2.m, 1), isFinite(co2.se) ? '± ' + Fmt.num(co2.se, 1) + T(' EE · ', ' SE · ') + res.length + T(' frascos', ' jars') : '', 'hi'],
    ['CO₂ (mL kg⁻¹ h⁻¹)', Fmt.num(co2ml.m, 1)],
    isFinite(o2.m) ? ['O₂ (mL kg⁻¹ h⁻¹)', Fmt.num(o2.m, 1)] : null,
    isFinite(rq.m) ? [T('Cociente respiratorio', 'Respiratory quotient'), Fmt.num(rq.m, 2), rq.m > 1.3 ? T('posible respiración anaerobia', 'possible anaerobic respiration') : '', rq.m > 1.3 ? 'warn' : ''] : null,
    isFinite(eth.m) ? [T('Etileno (µL kg⁻¹ h⁻¹)', 'Ethylene (µL kg⁻¹ h⁻¹)'), Fmt.num(eth.m, 3), T('clase ', 'class ') + cls(ETH_CLASS, eth.m)] : null,
    [T('Calor de respiración', 'Heat of respiration'), Fmt.num(heat.wPerT, 0) + ' W/t', Fmt.num(heat.kjPerTDay, 0) + ' kJ t⁻¹ d⁻¹'],
  ]);
  el('b4sRead').innerHTML = `<div class="reading"><p>${L2(`El producto produce <b>${Fmt.num(co2.m, 1)} mg de CO₂ por kg y hora</b> a ${Fmt.num(UI.v('b4sT'), 1)} °C${isFinite(rq.m) ? `, con un cociente respiratorio de ${Fmt.num(rq.m, 2)} (cerca de 1 con azúcares como sustrato; por encima de 1.3 sugiere fermentación)` : ''}. La clasificación de Kader (2002) se define a 5 °C: compárala con una medición a esa temperatura. Cada tonelada libera ${Fmt.num(heat.wPerT, 0)} W de calor que la cámara debe retirar.${isFinite(eth.m) ? ` La producción de etileno, ${Fmt.num(eth.m, 3)} µL kg⁻¹ h⁻¹, es ${cls(ETH_CLASS, eth.m)} (clases a 20 °C).` : ''}`, `The produce gives off <b>${Fmt.num(co2.m, 1)} mg of CO₂ per kg and hour</b> at ${Fmt.num(UI.v('b4sT'), 1)} °C${isFinite(rq.m) ? `, with a respiratory quotient of ${Fmt.num(rq.m, 2)} (near 1 with sugars as substrate; above 1.3 it suggests fermentation)` : ''}. Kader's (2002) classification is defined at 5 °C: compare it with a measurement at that temperature. Each metric ton releases ${Fmt.num(heat.wPerT, 0)} W of heat the room must remove.${isFinite(eth.m) ? ` Ethylene production, ${Fmt.num(eth.m, 3)} µL kg⁻¹ h⁻¹, is ${cls(ETH_CLASS, eth.m)} (classes at 20 °C).` : ''}`)}</p>${res.some(x => x.r.co2 && x.r.co2.r2 < 0.95) ? `<p><b>${L2('Alguna recta de CO₂ tiene R² < 0.95: revisa fugas o lecturas atípicas.', 'Some CO₂ line has R² < 0.95: check for leaks or outlying readings.')}</b></p>` : ''}</div>`;
  const ser = (key, k) => res.map((x, i) => { const f = x.r[k] && x.r[k].fit; return f ? [{ name: T('frasco ', 'jar ') + x.jar, x: x.sub.map(s => +s[m.t]), y: x.sub.map(s => +s[key]), line: false, legendKind: 'line', color: Plot.color(i) }, { name: T('frasco ', 'jar ') + x.jar + ' · ' + T('recta', 'line'), noLegend: true, x: [0, Math.max(...x.sub.map(s => +s[m.t]))], y: [f.a, f.a + f.b * Math.max(...x.sub.map(s => +s[m.t]))], points: false, color: Plot.color(i) }] : []; }).flat();
  el('b4sFig1').innerHTML = ''; el('b4sFig2').innerHTML = '';
  Fig.put('b4sFig1', Plot.lines({ name: 'b4-co2', w: 520, h: 330, series: ser(m.co2, 'co2'), xlab: T('Tiempo (h)', 'Time (h)'), ylab: 'CO₂ (%)', legend: true }), { name: 'b4-co2', title: L2('Acumulación de CO₂', 'CO₂ build-up'), block: 4 });
  if (m.o2) Fig.put('b4sFig2', Plot.lines({ name: 'b4-o2', w: 520, h: 330, series: ser(m.o2, 'o2'), xlab: T('Tiempo (h)', 'Time (h)'), ylab: 'O₂ (%)', legend: true }), { name: 'b4-o2', title: L2('Consumo de O₂', 'O₂ depletion'), block: 4 });
  else if (m.c2h4) Fig.put('b4sFig2', Plot.lines({ name: 'b4-etileno', w: 520, h: 330, series: ser(m.c2h4, 'c2h4'), xlab: T('Tiempo (h)', 'Time (h)'), ylab: T('Etileno (µL/L)', 'Ethylene (µL/L)'), legend: true }), { name: 'b4-etileno', title: L2('Acumulación de etileno', 'Ethylene build-up'), block: 4 });
  buildTable('b4sTab', [
    { key: 'jar', label: L2('Frasco', 'Jar') }, { key: 'mass', label: L2('Masa (kg)', 'Mass (kg)'), num: true, fmt: v => Fmt.num(v, 3) }, { key: 'free', label: L2('Volumen libre (L)', 'Free volume (L)'), num: true, fmt: v => Fmt.num(v, 3) },
    { key: 'co2', label: 'CO₂ mg kg⁻¹ h⁻¹', num: true, get: x => (x.r.co2 ? Fmt.num(x.r.co2.mgKgH, 2) : '—') }, { key: 'r2', label: 'R² CO₂', num: true, get: x => (x.r.co2 ? Fmt.num(x.r.co2.r2, 4) : '—') },
    { key: 'o2', label: 'O₂ mL kg⁻¹ h⁻¹', num: true, get: x => (x.r.o2 ? Fmt.num(x.r.o2.mlKgH, 2) : '—') }, { key: 'rq', label: L2('CR', 'RQ'), num: true, get: x => Fmt.num(x.r.rq, 3) },
    { key: 'eth', label: L2('Etileno µL kg⁻¹ h⁻¹', 'Ethylene µL kg⁻¹ h⁻¹'), num: true, get: x => (x.r.c2h4 ? Fmt.num(x.r.c2h4.ulKgH, 4) : '—') },
  ], res, { csvName: T('respiracion_estatico', 'respiration_static') });
  el('b4sCite').innerHTML = '';
  citeMethod('b4sCite', [Refs.short('fonseca2002'), [T('Clases de respiración y etileno: ', 'Respiration and ethylene classes: ') + Refs.short('kader2002'), 'Respiration and ethylene classes: ' + Refs.short('kader2002')], [T('Calor: 10.7 J por mg de CO₂', 'Heat: 10.7 J per mg of CO₂'), 'Heat: 10.7 J per mg of CO₂']]);
  state.resp = Object.assign(state.resp || {}, { static: { co2: co2.m, rq: rq.m, eth: eth.m } });
  Report.set('resp:static', { order: 40, title: ['Respiración (sistema estático)', 'Respiration (static system)'], html: () => el('b4sRead').innerHTML + PHRep.fig('b4-co2') + PHRep.fig('b4-o2') + PHRep.table('b4sTab') });
}

/* ---------------- flow-through ---------------- */
let fTable;
function flowRun() {
  const rows = fTable.get().filter(r => isFinite(r.mass) && r.mass > 0 && isFinite(r.flow) && r.flow > 0);
  if (!rows.length) { el('b4fOut').hidden = true; return; }
  const temp = UI.v('b4fT');
  const res = rows.map(r => Object.assign({ name: r.name }, Resp.flow({ co2In: r.co2In, co2Out: r.co2Out, o2In: r.o2In, o2Out: r.o2Out, c2h4In: r.eIn, c2h4Out: r.eOut, flow: r.flow, mass: r.mass, temp })));
  S.f = res;
  el('b4fOut').hidden = false;
  const mean = k => Num.mean(res.map(k).filter(isFinite));
  statTiles('b4fTiles', [['CO₂ (mg kg⁻¹ h⁻¹)', Fmt.num(mean(r => r.co2 ? r.co2.mgKgH : NaN), 1), T('media de ', 'mean of ') + res.length], ['O₂ (mL kg⁻¹ h⁻¹)', Fmt.num(mean(r => r.o2 ? r.o2.mlKgH : NaN), 1)], [T('Cociente respiratorio', 'Respiratory quotient'), Fmt.num(mean(r => r.rq), 2)], [T('Etileno (µL kg⁻¹ h⁻¹)', 'Ethylene (µL kg⁻¹ h⁻¹)'), Fmt.num(mean(r => (r.c2h4 ? r.c2h4.ulKgH : NaN)), 3)]]);
  buildTable('b4fTab', [{ key: 'name', label: L2('Cámara', 'Chamber') }, { key: 'co2', label: 'CO₂ mg kg⁻¹ h⁻¹', num: true, get: r => (r.co2 ? Fmt.num(r.co2.mgKgH, 2) : '—') }, { key: 'co2ml', label: 'CO₂ mL kg⁻¹ h⁻¹', num: true, get: r => (r.co2 ? Fmt.num(r.co2.mlKgH, 2) : '—') }, { key: 'o2', label: 'O₂ mL kg⁻¹ h⁻¹', num: true, get: r => (r.o2 ? Fmt.num(r.o2.mlKgH, 2) : '—') }, { key: 'rq', label: L2('CR', 'RQ'), num: true, get: r => Fmt.num(r.rq, 3) }, { key: 'eth', label: L2('Etileno µL kg⁻¹ h⁻¹', 'Ethylene µL kg⁻¹ h⁻¹'), num: true, get: r => (r.c2h4 ? Fmt.num(r.c2h4.ulKgH, 4) : '—') }, { key: 'heat', label: 'W/t', num: true, get: r => (r.heat ? Fmt.num(r.heat.wPerT, 0) : '—') }], res, { csvName: T('respiracion_flujo', 'respiration_flow') });
  el('b4fCite').innerHTML = '';
  citeMethod('b4fCite', [Refs.short('fonseca2002'), Refs.short('saltveit2016')]);
  state.resp = Object.assign(state.resp || {}, { flow: { n: res.length } });
  Report.set('resp:flow', { order: 41, title: ['Respiración (flujo continuo)', 'Respiration (flow-through)'], html: () => PHRep.table('b4fTab') });
}

/* ---------------- climacteric ---------------- */
function climRun(D) {
  const m = D.map;
  /* a new time or respiration column proposes its unit from the name (dia → days, hora or _h → hours; mL or mg) */
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (m.t !== S.cT) { S.cT = m.t; const k = norm(m.t); if (/(^|_)(h|hr|hrs|hora|horas|hour|hours)$/.test(k)) el('b4cTU').value = 'h'; else if (/(^|_)(d|dia|dias|day|days)$/.test(k) || /^(dia|day)/.test(k)) el('b4cTU').value = 'd'; }
  if (m.resp !== S.cR) { S.cR = m.resp; const k = norm(m.resp); if (/ml/.test(k)) el('b4cRU').value = 'ml'; else if (/mg/.test(k)) el('b4cRU').value = 'mg'; }
  const tu = TIME_UNITS.find(u => u[0] === UI.s('b4cTU')) || TIME_UNITS[0], ru = (RESP_UNITS.find(u => u[0] === UI.s('b4cRU')) || RESP_UNITS[0])[1];
  /* a time with its unit: «6 días», «1 día», «1.5 días» */
  const tFmt = v => { const d = Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1, s = Fmt.num(v, d); return s + ' ' + (s === '1' ? T(tu[3], tu[4]) : T(tu[1], tu[2])); };
  /* a moment of the series: «día 6», «day 6» */
  const tAt = v => T(tu[3], tu[4]) + ' ' + Fmt.num(v, Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 1);
  const rows = D.rows.filter(r => isFinite(r[m.t]) && r[m.t] !== null).sort((a, b) => a[m.t] - b[m.t]);
  const t = rows.map(r => +r[m.t]), resp = colNum(rows, m.resp), eth = m.eth ? colNum(rows, m.eth) : null;
  const C = Resp.climacteric(t, resp, eth, { riseMin: UI.v('b4cRise'), ethRise: UI.v('b4cER'), ethMin: UI.v('b4cEM') });
  S.c = C;
  el('b4cOut').hidden = false;
  const name = { climacteric: [T('Climatérico', 'Climacteric'), 'good'], nonclimacteric: [T('No climatérico', 'Non-climacteric'), ''], uncertain: [T('Incierto', 'Uncertain'), 'warn'] }[C.type];
  statTiles('b4cTiles', [
    [T('Patrón', 'Pattern'), name[0], '', name[1] || 'hi'],
    C.resp ? [T('Alza respiratoria', 'Respiratory rise'), '× ' + Fmt.num(C.resp.rise, 2), T('mínimo ', 'minimum ') + Fmt.num(C.resp.min, 1) + ' → ' + T('pico ', 'peak ') + Fmt.num(C.resp.peak, 1) + ' ' + ru] : null,
    C.resp ? [T('Pico de respiración', 'Respiration peak'), tAt(C.resp.tPeak), Fmt.num(C.resp.peak, 1) + ' ' + ru] : null,
    C.eth ? [T('Pico de etileno', 'Ethylene peak'), tAt(C.eth.tPeak), Fmt.num(C.eth.peak, 2) + ' ' + ETH_UNIT + ' · × ' + Fmt.num(C.eth.rise, 1)] : null,
  ]);
  const lead = C.resp && C.eth ? C.eth.tPeak - C.resp.tPeak : NaN;
  el('b4cRead').innerHTML = `<div class="reading"><p>${L2('Regla: hay alza respiratoria si el pico, después de un mínimo previo, lo supera al menos ' + Fmt.num(C.opts.riseMin, 1) + ' veces y no es la última lectura; hay estallido de etileno si su pico supera ' + Fmt.num(C.opts.ethRise, 0) + ' veces su mínimo previo o llega a ' + Fmt.num(C.opts.ethMin, 1) + ' ' + ETH_UNIT + '. Climatérico = ambos; no climatérico = ninguno.', 'Rule: there is a respiratory rise if the peak, after an earlier minimum, exceeds it at least ' + Fmt.num(C.opts.riseMin, 1) + ' times and is not the last reading; there is an ethylene burst if its peak exceeds ' + Fmt.num(C.opts.ethRise, 0) + ' times its earlier minimum or reaches ' + Fmt.num(C.opts.ethMin, 1) + ' ' + ETH_UNIT + '. Climacteric = both; non-climacteric = neither.')}</p><p>${C.type === 'climacteric' ? L2(`El patrón es <b>climatérico</b>${isFinite(lead) ? (Math.abs(lead) < 0.5 ? ': el etileno y la respiración alcanzan su pico juntos' : lead > 0 ? `: el etileno alcanza su pico ${tFmt(lead)} después que la respiración` : `: el etileno alcanza su pico ${tFmt(-lead)} antes que la respiración, como corresponde a la producción autocatalítica`) : ''}. Estos frutos pueden cosecharse en madurez fisiológica y madurarse en destino; el frío y la remoción de etileno retrasan el pico.`, `The pattern is <b>climacteric</b>${isFinite(lead) ? (Math.abs(lead) < 0.5 ? ': ethylene and respiration peak together' : lead > 0 ? `: ethylene peaks ${tFmt(lead)} after respiration` : `: ethylene peaks ${tFmt(-lead)} before respiration, as autocatalytic production does`) : ''}. Such fruit can be harvested at physiological maturity and ripened at destination; cold and ethylene removal delay the peak.`) : C.type === 'nonclimacteric' ? L2('El patrón es <b>no climatérico</b>: la respiración baja o se mantiene y no hay estallido de etileno. La calidad de consumo no mejora después de la cosecha.', 'The pattern is <b>non-climacteric</b>: respiration falls or stays flat and there is no ethylene burst. Eating quality will not improve after harvest.') : L2('El patrón es <b>incierto</b> con estos datos (por ejemplo, la respiración sigue subiendo en la última lectura o falta el etileno): alarga la serie.', 'The pattern is <b>uncertain</b> with these data (for instance, respiration is still rising at the last reading or ethylene is missing): extend the series.')}</p></div>`;
  el('b4cFig1').innerHTML = ''; el('b4cFig2').innerHTML = '';
  const mark = (p) => (p ? [{ x: p.tMin, label: T('mínimo', 'minimum') }, { x: p.tPeak, label: T('pico', 'peak') }] : []);
  const xlab = T('Tiempo', 'Time') + ' (' + T(tu[1], tu[2]) + ')';
  Fig.put('b4cFig1', Plot.lines({ name: 'b4-respiracion', w: 520, h: 330, series: [{ name: T('respiración', 'respiration'), x: t, y: resp }], xlab, ylab: T('Respiración', 'Respiration') + ' (' + ru + ')', vlines: mark(C.resp), legend: false, yZero: true }), { name: 'b4-respiracion', title: L2('Respiración', 'Respiration'), block: 4 });
  if (eth) Fig.put('b4cFig2', Plot.lines({ name: 'b4-etileno-curva', w: 520, h: 330, series: [{ name: T('etileno', 'ethylene'), x: t, y: eth, color: 'var(--s2)' }], xlab, ylab: T('Etileno', 'Ethylene') + ' (' + ETH_UNIT + ')', vlines: mark(C.eth), legend: false, yZero: true }), { name: 'b4-etileno-curva', title: L2('Producción de etileno', 'Ethylene production'), block: 4 });
  el('b4cCite').innerHTML = '';
  citeMethod('b4cCite', [Refs.short('biale1964'), Refs.short('lelievre1997')]);
  state.resp = Object.assign(state.resp || {}, { climacteric: C.type });
  Report.set('resp:climacteric', { order: 42, title: ['Climaterio', 'Climacteric'], html: () => el('b4cRead').innerHTML + PHRep.fig('b4-respiracion') + PHRep.fig('b4-etileno-curva') });
}

/* ---------------- modified atmosphere ---------------- */
let filmTable;
function mapRun() {
  const films = filmTable.get().filter(f => f.o2 > 0 && f.co2 > 0);
  const temp = UI.v('b4mTemp');
  const film0 = films.find(f => f.id === UI.s('b4mFilm')) || films[0];
  if (!film0) return;
  const area = 2 * UI.v('b4mL') * UI.v('b4mWd') / 10000;
  const rO2 = UI.v('b4mR'), rq = UI.v('b4mRQ'), W = UI.v('b4mW'), th = UI.v('b4mTh');
  const win = { o2: [UI.v('b4mO2a'), UI.v('b4mO2b')], co2: [UI.v('b4mCa'), UI.v('b4mCb')] };
  const mm = UI.on('b4mMM') ? { vm: rO2 * (UI.v('b4mKm') + 20.95) / 20.95, km: UI.v('b4mKm'), ki: UI.v('b4mKi') } : null;
  const at = f => Resp.filmAt(f, temp, 23);
  const base = { rO2, rCO2: rO2 * rq, rq, mass: W, area };
  const cur = Resp.mapSteady(Object.assign({}, base, { film: at(film0), thickness: th, mm }));
  const target = (win.o2[0] + win.o2[1]) / 2;
  const rows = films.map(f => {
    const F = at(f), L = Resp.mapThickness({ rO2, mass: W, area, film: F, targetO2: target });
    const st = Resp.mapSteady(Object.assign({}, base, { film: F, thickness: L, mm }));
    /* a thickness outside 8–150 µm cannot be made or sealed as a bag film */
    const practical = L >= 8 && L <= 150;
    const ok = practical && st.o2In >= win.o2[0] - 1e-9 && st.o2In <= win.o2[1] + 1e-9 && st.co2In >= win.co2[0] && st.co2In <= win.co2[1];
    return { f, F, beta: F.co2 / F.o2, L, st, ok, practical };
  });
  S.m = { cur, rows, win, area };
  el('b4mOut').hidden = false;
  const inWin = cur.o2In >= win.o2[0] && cur.o2In <= win.o2[1] && cur.co2In >= win.co2[0] && cur.co2In <= win.co2[1];
  const needBeta = Resp.betaNeeded(rq, target, (win.co2[0] + win.co2[1]) / 2);
  statTiles('b4mTiles', [
    ['O₂ ' + T('interno', 'inside'), Fmt.num(cur.o2In, 2) + Fmt.pcs(), T('ventana ', 'window ') + win.o2.join('–') + Fmt.pcs(), cur.anaerobic ? 'bad' : inWin ? 'good' : 'warn'],
    ['CO₂ ' + T('interno', 'inside'), Fmt.num(cur.co2In, 2) + Fmt.pcs(), T('ventana ', 'window ') + win.co2.join('–') + Fmt.pcs(), inWin ? 'good' : 'warn'],
    [T('Área de la bolsa', 'Bag area'), Fmt.num(area, 3) + ' m²', T('dos caras', 'two faces')],
    ['β ' + T('de la película', 'of the film'), Fmt.num(cur.beta, 2), T('β necesaria ≈ ', 'β needed ≈ ') + Fmt.num(needBeta, 2)],
    [T('Espesor para ', 'Thickness for ') + Fmt.num(target, 1) + Fmt.pcs() + ' O₂', Fmt.num(rows.find(r => r.f.id === film0.id).L, 0) + ' µm', T(film0.es, film0.en)],
  ]);
  const good = rows.filter(r => r.ok);
  el('b4mRead').innerHTML = `<div class="reading"><p>${cur.anaerobic ? L2('<b>Riesgo de anaerobiosis</b>: el O₂ interno queda por debajo de 1 %. Usa una película más permeable, menos espesor, más área o menos producto.', '<b>Risk of anaerobiosis</b>: inner O₂ falls below 1%. Use a more permeable film, less thickness, more area or less produce.') : inWin ? L2('Con esta película y este espesor la atmósfera de equilibrio cae <b>dentro de la ventana</b> recomendada.', 'With this film and thickness the equilibrium atmosphere falls <b>inside the recommended window</b>.') : L2('Con esta película y este espesor la atmósfera de equilibrio <b>queda fuera de la ventana</b>.', 'With this film and thickness the equilibrium atmosphere <b>falls outside the window</b>.')}</p>` +
    `<p>${L2(`Para llegar a ${Fmt.num(target, 1)} % de O₂, ${good.length ? 'dejan el CO₂ dentro de la ventana: <b>' + good.map(r => esc(r.f.es) + ' de ' + Fmt.num(r.L, 0) + ' µm').join(', ') + '</b>.' : 'ninguna película de la tabla deja el CO₂ dentro de la ventana: hace falta una β cercana a ' + Fmt.num(needBeta, 1) + ' (o microperforaciones).'} Una película con β mayor que la necesaria deja menos CO₂; con β menor, más.`, `To reach ${Fmt.num(target, 1)}% O₂, ${good.length ? 'these keep CO₂ inside the window: <b>' + good.map(r => esc(r.f.en) + ' at ' + Fmt.num(r.L, 0) + ' µm').join(', ') + '</b>.' : 'no film of the table keeps CO₂ inside the window: a β near ' + Fmt.num(needBeta, 1) + ' is needed (or microperforations).'} A film with a larger β than needed leaves less CO₂; with a smaller β, more.`)}</p><p class="hint">${L2('Supone respiración constante (o de Michaelis–Menten si lo marcaste), película sin perforaciones, sello perfecto y estado estacionario; la permeabilidad se corrige a la temperatura con su energía de activación.', 'It assumes constant respiration (or Michaelis–Menten if checked), an unperforated film, a perfect seal and steady state; permeability is corrected to the temperature with its activation energy.')}</p></div>`;
  el('b4mFig').innerHTML = '';
  Fig.put('b4mFig', Plot.mapPlane({ name: 'b4-atmosfera', lines: rows.map(r => ({ name: T(r.f.es, r.f.en) + ' (β ' + Fmt.num(r.beta, 1) + ')', beta: r.beta, rq })), window: win, point: { o2: cur.o2In, co2: cur.co2In, label: T('este empaque', 'this package') }, xlab: 'O₂ (%)', ylab: 'CO₂ (%)', co2Max: Math.max(20, win.co2[1] * 1.3, cur.co2In * 1.1) }),
    { name: 'b4-atmosfera', title: L2('Atmósferas posibles de cada película', 'Possible atmospheres of each film'), caption: L2('Cada recta parte del aire (20.95 % O₂) con pendiente CR/β; el recuadro verde es la ventana recomendada; la franja roja, la zona anaerobia.', 'Each line starts at air (20.95% O₂) with slope RQ/β; the green box is the recommended window; the red band, the anaerobic zone.'), block: 4 });
  buildTable('b4mTab', [{ key: 'f', label: L2('Película', 'Film'), get: r => T(r.f.es, r.f.en) }, { key: 'beta', label: 'β', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'L', label: L2('Espesor para el O₂ objetivo (µm)', 'Thickness for the target O₂ (µm)'), num: true, get: r => Fmt.num(r.L, r.L < 10 ? 1 : 0) + (r.practical ? '' : ' ' + T('(no fabricable)', '(not practical)')) }, { key: 'co2', label: L2('CO₂ resultante (%)', 'Resulting CO₂ (%)'), num: true, get: r => Fmt.num(r.st.co2In, 2) }, { key: 'ok', label: L2('Dentro de la ventana', 'Inside the window'), get: r => (r.ok ? T('sí', 'yes') : T('no', 'no')) }], rows.map(r => Object.assign({ _class: r.ok ? 'best' : '' }, r)), { csvName: T('atmosfera_peliculas', 'atmosphere_films') });
  el('b4mCite').innerHTML = '';
  citeMethod('b4mCite', [Refs.short('exama1993'), Refs.short('fishman1996'), 'Michaelis–Menten: ' + Refs.short('lee1991'), [T('Permeabilidades orientativas: ', 'Orientative permeabilities: ') + Refs.short('mangaraj2009'), 'Orientative permeabilities: ' + Refs.short('mangaraj2009')], [T('Ventanas: ', 'Windows: ') + Refs.short('kader2002'), 'Windows: ' + Refs.short('kader2002')]]);
  state.resp = Object.assign(state.resp || {}, { map: { o2: cur.o2In, co2: cur.co2In, inWin } });
  Report.set('resp:map', { order: 43, title: ['Atmósfera modificada', 'Modified atmosphere'], html: () => el('b4mRead').innerHTML + PHRep.fig('b4-atmosfera') + PHRep.table('b4mTab') });
}

/* ---------------- cooling ---------------- */
let kTable;
function coolRun() {
  const rows = kTable.get().filter(r => isFinite(r.t) && r.t !== null && isFinite(r.T) && r.T !== null).sort((a, b) => a.t - b.t);
  const Tm = UI.v('b4kTm'), Tt = UI.v('b4kTt');
  if (rows.length < 3) { el('b4kOut').hidden = true; return; }
  const C = Resp.cooling(rows.map(r => +r.t), rows.map(r => +r.T), Tm);
  S.k = C;
  el('b4kOut').hidden = false;
  const tt = C.timeTo(Tt);
  statTiles('b4kTiles', [[T('Medio enfriamiento', 'Half cooling'), Fmt.num(C.half, 2) + ' h', '', 'hi'], [T('Siete octavos', 'Seven-eighths'), Fmt.num(C.sevenEighths, 2) + ' h', T('referencia comercial', 'commercial reference')], [T('Hasta ', 'To ') + Fmt.num(Tt, 1) + ' °C', isFinite(tt) && tt > 0 ? Fmt.num(tt, 2) + ' h' : '—'], ['j · C', Fmt.num(C.j, 3) + ' · ' + Fmt.num(C.C, 3) + ' h⁻¹', 'R² ' + Fmt.num(C.r2, 4)]]);
  el('b4kRead').innerHTML = `<div class="reading"><p>${L2(`La pulpa pierde la mitad de su diferencia con el medio en <b>${Fmt.num(C.half, 2)} h</b>; los siete octavos (el punto en que suele terminar el preenfriamiento) en ${Fmt.num(C.sevenEighths, 2)} h. El retraso (j = ${Fmt.num(C.j, 2)}) mide cuánto tarda el calor en empezar a salir del centro del fruto o del empaque.`, `The pulp loses half its difference with the medium in <b>${Fmt.num(C.half, 2)} h</b>; seven-eighths (where precooling usually ends) in ${Fmt.num(C.sevenEighths, 2)} h. The lag (j = ${Fmt.num(C.j, 2)}) measures how long heat takes to start leaving the center of the fruit or the package.`)}</p></div>`;
  const tMax = Math.max(...rows.map(r => +r.t), isFinite(tt) ? tt : 0) * 1.05, g = Array.from({ length: 50 }, (_, i) => tMax * i / 49);
  el('b4kFig').innerHTML = '';
  Fig.put('b4kFig', Plot.lines({ name: 'b4-enfriamiento', series: [{ name: T('medida', 'measured'), x: rows.map(r => +r.t), y: rows.map(r => +r.T), line: false }, { name: T('ley exponencial', 'exponential law'), x: g, y: g.map(C.predict), points: false }], xlab: T('Tiempo (h)', 'Time (h)'), ylab: T('Temperatura de la pulpa (°C)', 'Pulp temperature (°C)'), hlines: [{ y: Tm, label: T('medio', 'medium') }, { y: Tt, label: T('objetivo', 'target') }], vlines: [{ x: C.half, label: '½' }, { x: C.sevenEighths, label: '⅞' }] }),
    { name: 'b4-enfriamiento', title: L2('Curva de enfriamiento', 'Cooling curve'), block: 4 });
  loadPaint();
}
function loadPaint() {
  const cp = Resp.cpSiebel(UI.v('b4hW'));
  const L = Resp.refrigLoad({ mass: UI.v('b4hM'), ti: UI.v('b4hTi'), tf: UI.v('b4hTf'), cp, hours: UI.v('b4hH'), rCO2: UI.v('b4hR'), packMass: UI.v('b4hPM'), packCp: UI.v('b4hPC'), extra: UI.v('b4hX') });
  statTiles('b4hTiles', [[T('Calor de campo', 'Field heat'), Fmt.num(L.field / 1000, 0) + ' MJ', 'cp ' + Fmt.num(cp, 2) + ' kJ kg⁻¹ K⁻¹'], [T('Empaque', 'Packaging'), Fmt.num(L.pack / 1000, 0) + ' MJ'], [T('Respiración', 'Respiration'), Fmt.num(L.resp / 1000, 1) + ' MJ'], [T('Total', 'Total'), Fmt.num(L.total / 1000, 0) + ' MJ', T('con otras cargas', 'with other loads')], [T('Capacidad necesaria', 'Capacity needed'), Fmt.num(L.kW, 1) + ' kW', Fmt.num(L.tr, 1) + T(' toneladas de refrigeración', ' tons of refrigeration'), 'hi']]);
  el('b4hRead').innerHTML = `<div class="reading"><p>${L2(`Enfriar ${Fmt.num(UI.v('b4hM'), 0)} kg de ${UI.v('b4hTi')} a ${UI.v('b4hTf')} °C en ${UI.v('b4hH')} h pide un equipo de al menos <b>${Fmt.num(L.kW, 1)} kW</b> (${Fmt.num(L.tr, 1)} t de refrigeración). El calor de campo es ${Fmt.num(100 * L.field / L.total, 0)} % de la carga; acortar el tiempo exige más capacidad en proporción inversa.`, `Cooling ${Fmt.num(UI.v('b4hM'), 0)} kg from ${UI.v('b4hTi')} to ${UI.v('b4hTf')} °C in ${UI.v('b4hH')} h needs at least <b>${Fmt.num(L.kW, 1)} kW</b> (${Fmt.num(L.tr, 1)} tons of refrigeration). Field heat is ${Fmt.num(100 * L.field / L.total, 0)}% of the load; a shorter time needs proportionally more capacity.`)}</p></div>`;
  el('b4hCite').innerHTML = '';
  citeMethod('b4hCite', [Refs.short('thompson2008'), 'cp: ' + Refs.short('siebel1892')]);
  state.resp = Object.assign(state.resp || {}, { load: { kW: L.kW } });
  Report.set('resp:cooling', { order: 44, title: ['Preenfriamiento y carga térmica', 'Precooling and heat load'], html: () => (S.k ? el('b4kRead').innerHTML + PHRep.fig('b4-enfriamiento') : '') + el('b4hRead').innerHTML });
}

/* ---------------- start ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const P = el('panel-4');
  P.innerHTML = UI.panel(4, 'Respiración, etileno y atmósferas', 'Respiration, ethylene and atmospheres', 'Tasas de respiración, climaterio, empaque en atmósfera modificada y preenfriamiento', 'Respiration rates, climacteric, modified-atmosphere packaging and precooling', tools);
  if (window.I18N) I18N.apply(P);
  const s = DataIn.mount('b4sIn', {
    id: 'b4s',
    roles: [
      { key: 't', es: 'Tiempo (h)', en: 'Time (h)', type: 'num', match: ['tiempo_h', 'tiempo', 'hora', 'horas', 'time', 'h'] },
      { key: 'co2', es: 'CO₂ (%)', en: 'CO₂ (%)', type: 'num', match: ['co2_pct', 'co2'] },
      { key: 'o2', es: 'O₂ (%)', en: 'O₂ (%)', optional: true, match: ['o2_pct', 'o2'] },
      { key: 'c2h4', es: 'Etileno (µL/L)', en: 'Ethylene (µL/L)', optional: true, match: ['etileno_ppm', 'etileno', 'c2h4', 'ethylene'] },
      { key: 'jar', es: 'Frasco o repetición', en: 'Jar or replicate', optional: true, match: ['frasco', 'jar', 'rep', 'repeticion', 'camara'] },
      { key: 'mass', es: 'Masa (kg)', en: 'Mass (kg)', optional: true, match: ['masa_kg', 'masa', 'mass', 'peso_kg'] },
      { key: 'vol', es: 'Volumen del frasco (L)', en: 'Jar volume (L)', optional: true, match: ['volumen_frasco_l', 'volumen', 'volume'] },
    ],
    examples: [{ id: 'aguacateEstatico' }],
    onData: staticRun,
  });
  window.PHLoad.b4s = () => s.load(0);
  ['b4sMass', 'b4sVol', 'b4sDen', 'b4sT', 'b4sP'].forEach(id => el(id).addEventListener('change', () => s.refire()));
  fTable = EditTable.mount('b4fTable', {
    id: 'b4f',
    columns: [{ key: 'name', es: 'Cámara', en: 'Chamber', type: 'text', width: 90 }, { key: 'mass', es: 'Masa (kg)', en: 'Mass (kg)', type: 'num' }, { key: 'flow', es: 'Flujo (mL/min)', en: 'Flow (mL/min)', type: 'num' },
      { key: 'co2In', es: 'CO₂ entrada (%)', en: 'CO₂ in (%)', type: 'num' }, { key: 'co2Out', es: 'CO₂ salida (%)', en: 'CO₂ out (%)', type: 'num' }, { key: 'o2In', es: 'O₂ entrada (%)', en: 'O₂ in (%)', type: 'num' }, { key: 'o2Out', es: 'O₂ salida (%)', en: 'O₂ out (%)', type: 'num' },
      { key: 'eIn', es: 'Etileno entrada (µL/L)', en: 'Ethylene in (µL/L)', type: 'num' }, { key: 'eOut', es: 'Etileno salida (µL/L)', en: 'Ethylene out (µL/L)', type: 'num' }],
    rows: [{ name: 'A', mass: 2.1, flow: 150, co2In: 0.04, co2Out: 0.42, o2In: 20.95, o2Out: 20.55, eIn: 0, eOut: 0.31 }, { name: 'B', mass: 2.0, flow: 150, co2In: 0.04, co2Out: 0.39, o2In: 20.95, o2Out: 20.58, eIn: 0, eOut: 0.28 }, { name: 'C', mass: 2.2, flow: 150, co2In: 0.04, co2Out: 0.45, o2In: 20.95, o2Out: 20.52, eIn: 0, eOut: 0.35 }],
    blank: () => ({ name: '', mass: null, flow: null, co2In: 0.04, co2Out: null, o2In: 20.95, o2Out: null, eIn: 0, eOut: null }),
    onChange: flowRun,
  });
  el('b4fT').addEventListener('change', flowRun);
  flowRun();
  const c = DataIn.mount('b4cIn', {
    id: 'b4c',
    roles: [
      { key: 't', es: 'Tiempo', en: 'Time', type: 'num', match: ['dia', 'dias', 'tiempo', 'day', 'time', 'hora'] },
      { key: 'resp', es: 'Respiración (CO₂ por kg y hora)', en: 'Respiration (CO₂ per kg and hour)', type: 'num', match: ['respiracion_mg', 'respiracion', 'co2', 'respiration'] },
      { key: 'eth', es: 'Etileno (µL kg⁻¹ h⁻¹)', en: 'Ethylene (µL kg⁻¹ h⁻¹)', optional: true, match: ['etileno_ul', 'etileno', 'c2h4', 'ethylene'] },
    ],
    examples: [{ id: 'aguacateClimaterico' }],
    onData: climRun,
  });
  window.PHLoad.b4c = () => c.load(0);
  ['b4cTU', 'b4cRU', 'b4cRise', 'b4cER', 'b4cEM'].forEach(id => el(id).addEventListener('change', () => c.refire()));
  filmTable = EditTable.mount('b4mFilms', {
    id: 'b4films',
    columns: [{ key: 'es', keyEn: 'en', es: 'Película', en: 'Film', type: 'text', width: 200 }, { key: 'o2', es: 'P O₂', en: 'P O₂', type: 'num' }, { key: 'co2', es: 'P CO₂', en: 'P CO₂', type: 'num' }, { key: 'eaO2', es: 'Eₐ O₂', en: 'Eₐ O₂', type: 'num' }, { key: 'eaCO2', es: 'Eₐ CO₂', en: 'Eₐ CO₂', type: 'num' }],
    rows: Resp.FILMS.map(f => Object.assign({}, f)),
    blank: rows => ({ id: 'f' + rows.length, es: '', en: '', o2: null, co2: null, eaO2: 40, eaCO2: 35 }),
    onChange: rows => { rows.forEach(r => { if (!r.en) r.en = r.es; if (!r.es) r.es = r.en; }); const sel = el('b4mFilm'), v = sel.value; sel.innerHTML = rows.map(r => `<option value="${esc(r.id)}">${esc(T(r.es, r.en))}</option>`).join(''); sel.value = v; mapRun(); },
  });
  el('b4mProd').addEventListener('change', () => { const w = WINDOWS.find(x => x[0] === UI.s('b4mProd')); if (w && w[0] !== 'custom') { el('b4mO2a').value = w[3][0]; el('b4mO2b').value = w[3][1]; el('b4mCa').value = w[4][0]; el('b4mCb').value = w[4][1]; } mapRun(); });
  ['b4mO2a', 'b4mO2b', 'b4mCa', 'b4mCb', 'b4mR', 'b4mRQ', 'b4mW', 'b4mL', 'b4mWd', 'b4mTemp', 'b4mFilm', 'b4mTh', 'b4mMM', 'b4mKm', 'b4mKi'].forEach(id => { el(id).addEventListener('input', mapRun); el(id).addEventListener('change', mapRun); });
  mapRun();
  /* a simulated forced-air curve: half-cooling 1.2 h, lag 1.1, medium 1 °C, from 28 °C */
  const sim = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5].map(t => ({ t, T: Math.round((1 + 27 * Math.min(1, 1.1 * Math.exp(-Math.LN2 * t / 1.2))) * 10) / 10 }));
  kTable = EditTable.mount('b4kTable', { id: 'b4k', columns: [{ key: 't', es: 'Tiempo (h)', en: 'Time (h)', type: 'num' }, { key: 'T', es: 'Pulpa (°C)', en: 'Pulp (°C)', type: 'num' }], rows: sim, blank: () => ({ t: null, T: null }), onChange: coolRun });
  ['b4kTm', 'b4kTt'].forEach(id => el(id).addEventListener('change', coolRun));
  ['b4hM', 'b4hW', 'b4hTi', 'b4hTf', 'b4hH', 'b4hR', 'b4hPM', 'b4hPC', 'b4hX'].forEach(id => el(id).addEventListener('input', loadPaint));
  coolRun();
});
document.addEventListener('langchange', () => {
  ['b4s', 'b4c'].forEach(id => { const d = DataIn.registry[id]; if (d && d.get()) d.refire(); });
  flowRun(); mapRun(); coolRun();
});
})();
