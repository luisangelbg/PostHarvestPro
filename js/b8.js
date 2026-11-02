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

/* PostHarvestPro — Block 8, packaging and logistics: pallet and container
   loads, box venting, the air of the cold room (psychrometrics, deficits and
   water loss), the cost of storage, storage compatibility and unit
   conversion. */
(function () {
'use strict';
const S = {};
const UNIT_KINDS = { temperature: ['Temperatura', 'Temperature'], pressure: ['Presión', 'Pressure'], mass: ['Masa', 'Mass'], force: ['Fuerza (firmeza)', 'Force (firmness)'], length: ['Longitud (espesor)', 'Length (thickness)'], concentration: ['Concentración de gas', 'Gas concentration'] };
const UNIT_NAMES = { C: '°C', F: '°F', K: 'K', pct: '%', ppm: 'ppm (µL/L)', ppb: 'ppb', ulL: 'µL/L', um: 'µm', mil: 'mil (milésima de pulgada)' };
const tools = [
  { id: 'tarima', es: 'Tarima y contenedor', en: 'Pallet and container', html: `
    <div class="card"><h2>${L2('Cajas por tarima', 'Boxes per pallet')}</h2>
      <div class="form-grid tight">${UI.sel('b8pT', 'Tarima', 'Pallet', Logi.PALLETS.map(p => [p.id, p.es, p.en]).concat([['custom', 'Otra medida', 'Other size']]), 'iso')}${UI.num('b8pL', 'Largo de la tarima (cm)', 'Pallet length (cm)', 120)}${UI.num('b8pW', 'Ancho de la tarima (cm)', 'Pallet width (cm)', 100)}${UI.num('b8pH', 'Altura de la tarima (cm)', 'Pallet height (cm)', 15)}</div>
      <div class="form-grid tight">${UI.num('b8bL', 'Largo de la caja (cm)', 'Box length (cm)', 40)}${UI.num('b8bW', 'Ancho de la caja (cm)', 'Box width (cm)', 30)}${UI.num('b8bH', 'Alto de la caja (cm)', 'Box height (cm)', 20)}${UI.num('b8bKg', 'Peso de la caja llena (kg)', 'Full box weight (kg)', 10)}${UI.num('b8mH', 'Altura máxima de la carga (cm)', 'Maximum load height (cm)', 210)}${UI.num('b8mKg', 'Peso máximo por tarima (kg)', 'Maximum weight per pallet (kg)', 1000)}</div>
      <div id="b8pTiles"></div><div class="figs-2"><div id="b8pFig"></div><div id="b8cFig"></div></div>
      <h3>${L2('Tarimas por contenedor', 'Pallets per container')}</h3>
      <div class="form-grid tight">${UI.sel('b8cT', 'Contenedor', 'Container', Logi.CONTAINERS.map(c => [c.id, c.es, c.en]), 'rf40')}</div>${UI.check('b8cStack', 'Estibar tarimas (dos niveles si caben)', 'Stack pallets (two tiers if they fit)', false)}
      <div id="b8cTiles"></div><div id="b8pRead"></div><div id="b8pCite"></div></div>` },
  { id: 'ventilacion', es: 'Ventilación de cajas', en: 'Box venting', html: `
    <div class="card"><h2>${L2('Área abierta de las caras', 'Open area of the faces')}</h2><p class="hint">${L2('Para el enfriamiento con aire forzado, las caras por donde pasa el aire necesitan al menos 5 % de área abierta, con orificios alineados entre cajas.', 'For forced-air cooling, the faces the air goes through need at least 5 % open area, with holes aligned between boxes.')}</p>
      <div class="form-grid tight">${UI.num('b8vLa', 'Cara larga: largo (cm)', 'Long face: length (cm)', 50)}${UI.num('b8vLb', 'Cara larga: alto (cm)', 'Long face: height (cm)', 25)}${UI.num('b8vSa', 'Cara corta: ancho (cm)', 'Short face: width (cm)', 30)}${UI.num('b8vSb', 'Cara corta: alto (cm)', 'Short face: height (cm)', 25)}</div>
      <div id="b8vTable"></div><div id="b8vTiles"></div><div id="b8vRead"></div></div>` },
  { id: 'ambiente', es: 'Ambiente del almacén', en: 'Store environment', html: `
    <div class="card"><h2>${L2('Aire, producto y pérdida de agua', 'Air, produce and water loss')}</h2>
      <div class="form-grid tight">${UI.num('b8aT', 'Temperatura del aire (°C)', 'Air temperature (°C)', 5)}${UI.num('b8aRH', 'Humedad relativa (%)', 'Relative humidity (%)', 85)}${UI.num('b8aAlt', 'Altitud (m)', 'Altitude (m)', 0)}${UI.num('b8aTp', 'Temperatura del producto (°C)', 'Produce temperature (°C)', 6)}${UI.sel('b8aProd', 'Producto (coeficiente de transpiración)', 'Produce (transpiration coefficient)', Logi.TRANSPIRATION.map((p, i) => [String(i), p.es + ' · ' + p.k, p.en + ' · ' + p.k]).concat([['custom', 'Otro (escríbelo)', 'Other (type it)']]), '8')}${UI.num('b8aK', 'Coeficiente (mg kg⁻¹ s⁻¹ MPa⁻¹)', 'Coefficient (mg kg⁻¹ s⁻¹ MPa⁻¹)', 140)}${UI.num('b8aOT', 'Aire exterior (°C)', 'Outside air (°C)', 28)}${UI.num('b8aORH', 'HR exterior (%)', 'Outside RH (%)', 55)}</div>
      <div id="b8aTiles"></div><div id="b8aRead"></div><div id="b8aFig"></div><div id="b8aCite"></div></div>` },
  { id: 'costos', es: 'Costo de almacenamiento', en: 'Storage cost', html: `
    <div class="card"><h2>${L2('Costo por día y por tarima', 'Cost per day and per pallet')}</h2>
      <div class="form-grid tight">${UI.num('b8kE', 'Energía (kWh por día)', 'Energy (kWh per day)', 180)}${UI.num('b8kT', 'Tarifa por kWh', 'Tariff per kWh', 2.8)}${UI.num('b8kL', 'Mano de obra por día', 'Labour per day', 900)}${UI.num('b8kO', 'Otros gastos por día', 'Other costs per day', 250)}${UI.num('b8kC', 'Depreciación y renta por año', 'Depreciation and rent per year', 420000)}${UI.num('b8kCap', 'Capacidad (tarimas)', 'Capacity (pallets)', 60)}${UI.num('b8kOcc', 'Ocupación (%)', 'Occupancy (%)', 75)}${UI.num('b8kLoss', 'Merma por día (% del peso)', 'Shrink per day (% of weight)', 0.08)}${UI.num('b8kP', 'Valor de una tarima', 'Value of one pallet', 18000)}</div>
      <div id="b8kTiles"></div><div id="b8kRead"></div></div>` },
  { id: 'compat', es: 'Compatibilidad', en: 'Compatibility', html: `
    <div class="card"><h2>${L2('¿Pueden compartir la cámara?', 'Can they share the room?')}</h2><p class="hint">${L2('Elige los productos que piensas almacenar o transportar juntos. Los valores son orientativos y se pueden editar abajo.', 'Pick the products you plan to store or ship together. The values are orientative and can be edited below.')}</p>
      <div class="btn-row" id="b8xChips"></div>
      <details style="margin-top:10px"><summary class="hint" style="cursor:pointer">${L2('Tabla de productos (editable)', 'Table of products (editable)')}</summary><p class="hint">${L2('Temperatura y HR recomendadas; producción de etileno a 20 °C (VL < 0.1, L 0.1–1, M 1–10, H 10–100, VH > 100 µL kg⁻¹ h⁻¹); sensibilidad al etileno (L, M, H); daño por frío (0 no, 1 moderado, 2 sensible); olor («p» desprende, «a» absorbe).', 'Recommended temperature and RH; ethylene production at 20 °C (VL < 0.1, L 0.1–1, M 1–10, H 10–100, VH > 100 µL kg⁻¹ h⁻¹); ethylene sensitivity (L, M, H); chilling injury (0 none, 1 moderate, 2 sensitive); odour («p» gives off, «a» absorbs).')}</p><div id="b8xTable"></div></details></div>
    <div class="card" id="b8xOut" hidden><h2>${L2('Diagnóstico', 'Diagnosis')}</h2><div id="b8xTiles"></div><div id="b8xRead"></div><div id="b8xFig"></div><div id="b8xCite"></div></div>` },
  { id: 'unidades', es: 'Unidades', en: 'Units', html: `
    <div class="card"><h2>${L2('Conversión de unidades', 'Unit conversion')}</h2>
      <div class="form-grid tight">${UI.sel('b8uK', 'Magnitud', 'Quantity', Object.keys(UNIT_KINDS).map(k => [k, UNIT_KINDS[k][0], UNIT_KINDS[k][1]]), 'temperature')}${UI.num('b8uV', 'Valor', 'Value', 40)}${UI.sel('b8uF', 'De', 'From', [], '')}</div>
      <div id="b8uOut"></div></div>` },
];

/* ---------------- pallets ---------------- */
function palletRun() {
  const pt = Logi.PALLETS.find(p => p.id === UI.s('b8pT'));
  if (pt) { el('b8pL').value = pt.L; el('b8pW').value = pt.W; el('b8pH').value = pt.H; }
  const pallet = { L: UI.v('b8pL'), W: UI.v('b8pW'), H: UI.v('b8pH') }, box = { l: UI.v('b8bL'), w: UI.v('b8bW'), h: UI.v('b8bH'), kg: UI.v('b8bKg') };
  if (![pallet.L, pallet.W, box.l, box.w, box.h].every(v => v > 0)) return;
  const r = Logi.pallet({ pallet, box, maxHeight: UI.v('b8mH'), maxKg: UI.v('b8mKg') });
  const cont = Logi.CONTAINERS.find(c => c.id === UI.s('b8cT'));
  const c = Logi.container({ container: cont, pallet, palletHeight: r.height, palletKg: r.kg + 25, stack: UI.on('b8cStack'), boxesPerPallet: r.boxes });
  S.p = { r, c };
  statTiles('b8pTiles', [[T('Cajas por cama', 'Boxes per layer'), r.perLayer, T('aprovecha ', 'uses ') + Fmt.pct(r.areaUse) + T(' del área', ' of the area')], [T('Camas', 'Layers'), r.layers, r.limitedByWeight ? T('limitado por peso', 'limited by weight') : T('limitado por altura', 'limited by height'), r.limitedByWeight ? 'warn' : ''], [T('Cajas por tarima', 'Boxes per pallet'), r.boxes, '', 'hi'], [T('Peso de la carga', 'Load weight'), Fmt.num(r.kg, 0) + ' kg', T('altura ', 'height ') + Fmt.num(r.height, 0) + ' cm']]);
  statTiles('b8cTiles', [[T('Tarimas por contenedor', 'Pallets per container'), c.pallets, c.limitedByWeight ? T('limitado por peso', 'limited by weight') : c.perFloor + T(' por piso', ' per floor'), 'hi'], [T('Cajas por contenedor', 'Boxes per container'), Fmt.num(c.boxes, 0)], [T('Carga', 'Payload'), Fmt.num(c.kg, 0) + ' kg'], [T('Piso aprovechado', 'Floor used'), Fmt.pct(c.areaUse)]]);
  el('b8pRead').innerHTML = `<div class="reading"><p>${L2(`El mejor acomodo pone <b>${r.perLayer}</b> cajas por cama${r.blocks.length > 1 ? ' combinando dos orientaciones' : ''}, con ${Fmt.pct(r.areaUse)} del área de la tarima. Un aprovechamiento bajo (menos de 85 %) sugiere cambiar la medida de la caja; las cajas no deben sobresalir de la tarima. Deja pasillos para el aire entre las tarimas y la pared del contenedor.`, `The best arrangement puts <b>${r.perLayer}</b> boxes per layer${r.blocks.length > 1 ? ' combining two orientations' : ''}, using ${Fmt.pct(r.areaUse)} of the pallet area. A low use (below 85 %) suggests changing the box size; boxes must not overhang the pallet. Leave air channels between pallets and the container wall.`)}</p></div>`;
  el('b8pFig').innerHTML = ''; el('b8cFig').innerHTML = '';
  Fig.put('b8pFig', Plot.layout({ name: 'b8-tarima', L: pallet.L, W: pallet.W, blocks: r.blocks, caption: pallet.L + ' × ' + pallet.W + ' cm · ' + r.perLayer + T(' cajas por cama', ' boxes per layer'), w: 460, h: 380 }), { name: 'b8-tarima', title: L2('Una cama vista desde arriba', 'One layer seen from above'), block: 8 });
  const cl = Logi.layer(cont.L, cont.W, pallet.L, pallet.W);
  Fig.put('b8cFig', Plot.layout({ name: 'b8-contenedor', L: cont.L, W: cont.W, blocks: cl.blocks, caption: T(cont.es, cont.en) + ' · ' + cl.n + T(' tarimas por piso', ' pallets per floor'), w: 460, h: 380 }), { name: 'b8-contenedor', title: L2('Piso del contenedor', 'Container floor'), block: 8 });
  el('b8pCite').innerHTML = '';
  citeMethod('b8pCite', [Refs.short('steudel1979'), Refs.short('smith1980'), [T('Medidas de contenedores orientativas: verifica la ficha del transportista.', 'Orientative container sizes: check the carrier\'s sheet.'), 'Orientative container sizes: check the carrier\'s sheet.']]);
  state.logistics = Object.assign(state.logistics || {}, { pallet: { boxes: r.boxes, pallets: c.pallets } });
  Report.set('logistics:pallet', { order: 80, title: ['Carga por tarima y contenedor', 'Pallet and container load'], html: () => el('b8pRead').innerHTML + PHRep.fig('b8-tarima') + PHRep.fig('b8-contenedor') });
}

/* ---------------- vents ---------------- */
let vTable;
function ventRun() {
  const holes = vTable.get().filter(h => h.a > 0 && h.count > 0);
  const faces = { long: { a: UI.v('b8vLa'), b: UI.v('b8vLb') }, short: { a: UI.v('b8vSa'), b: UI.v('b8vSb') } };
  const pl = Logi.ventPct(holes.filter(h => h.face === 'long'), faces.long), ps = Logi.ventPct(holes.filter(h => h.face === 'short'), faces.short);
  const lv = v => (v >= 5 ? 'good' : v >= 3 ? 'warn' : 'bad');
  statTiles('b8vTiles', [[T('Cara larga', 'Long face'), Fmt.pct(pl), pl >= 5 ? T('suficiente', 'enough') : T('insuficiente', 'not enough'), lv(pl)], [T('Cara corta', 'Short face'), Fmt.pct(ps), ps >= 5 ? T('suficiente', 'enough') : T('insuficiente', 'not enough'), lv(ps)]]);
  el('b8vRead').innerHTML = `<div class="reading"><p>${L2('Con menos de 5 % de área abierta el enfriamiento con aire forzado se alarga mucho; por encima de 8 % la caja pierde resistencia a la compresión. Varias ranuras alargadas cerca de las esquinas reparten mejor el aire que un solo orificio grande (Thompson et al. 2008).', 'With less than 5 % open area forced-air cooling takes much longer; above 8 % the box loses compression strength. Several elongated slots near the corners distribute the air better than one large hole (Thompson et al. 2008).')}</p></div>`;
  state.logistics = Object.assign(state.logistics || {}, { vents: { long: pl, short: ps } });
}

/* ---------------- store air ---------------- */
function airRun() {
  const alt = UI.v('b8aAlt') || 0, kPa = 101.325 * Math.pow(1 - 2.25577e-5 * alt, 5.2559);
  const A = Logi.air(UI.v('b8aT'), UI.v('b8aRH'), kPa), O = Logi.air(UI.v('b8aOT'), UI.v('b8aORH'), kPa);
  const sel = UI.s('b8aProd');
  if (sel !== 'custom') el('b8aK').value = Logi.TRANSPIRATION[+sel].k;
  const k = UI.v('b8aK');
  const vpdP = Logi.productVPD(UI.v('b8aTp'), UI.v('b8aT'), UI.v('b8aRH'));
  const loss = Logi.waterLoss(k, Math.max(0, vpdP));
  S.a = { A, O, kPa, loss };
  statTiles('b8aTiles', [
    [T('Presión', 'Pressure'), Fmt.num(kPa, 1) + ' kPa', T('por la altitud', 'from the altitude')], [T('Humedad absoluta', 'Absolute humidity'), Fmt.num(A.absHum, 2) + ' g/m³', Fmt.num(A.Wg, 2) + T(' g/kg de aire seco', ' g/kg dry air')],
    [T('Punto de rocío', 'Dew point'), Fmt.num(A.dew, 1) + ' °C', A.dew > UI.v('b8aTp') ? T('el producto se condensará', 'the produce will sweat') : '', A.dew > UI.v('b8aTp') ? 'warn' : ''], [T('Bulbo húmedo', 'Wet bulb'), Fmt.num(A.wet, 1) + ' °C'], [T('Entalpía', 'Enthalpy'), Fmt.num(A.h, 1) + ' kJ/kg'],
    [T('Déficit del aire', 'Air deficit'), Fmt.num(A.vpd / 1000, 3) + ' kPa'], [T('Déficit producto–aire', 'Produce–air deficit'), Fmt.num(vpdP / 1000, 3) + ' kPa', '', 'hi'],
    [T('Pérdida de agua', 'Water loss'), Fmt.num(loss, 3) + ' % d⁻¹', Fmt.num(loss * 7, 2) + T(' % por semana', ' % per week'), loss * 7 > 3 ? 'warn' : 'good'],
  ]);
  el('b8aRead').innerHTML = `<div class="reading"><p>${L2(`A ${Fmt.num(UI.v('b8aT'), 1)} °C y ${Fmt.num(UI.v('b8aRH'), 0)} % de HR, con el producto a ${Fmt.num(UI.v('b8aTp'), 1)} °C, el déficit que impulsa la pérdida de agua es ${Fmt.num(vpdP / 1000, 3)} kPa: se pierde alrededor de <b>${Fmt.num(loss * 7, 2)} % del peso por semana</b>. ${vpdP > A.vpd ? 'El producto está más caliente que el aire: terminar el preenfriamiento antes de almacenar reduce mucho la pérdida.' : ''} Subir la HR de 85 a 95 % reduce el déficit del aire a un tercio.`, `At ${Fmt.num(UI.v('b8aT'), 1)} °C and ${Fmt.num(UI.v('b8aRH'), 0)} % RH, with the produce at ${Fmt.num(UI.v('b8aTp'), 1)} °C, the deficit that drives water loss is ${Fmt.num(vpdP / 1000, 3)} kPa: about <b>${Fmt.num(loss * 7, 2)} % of the weight is lost per week</b>. ${vpdP > A.vpd ? 'The produce is warmer than the air: finishing precooling before storage greatly reduces the loss.' : ''} Raising RH from 85 to 95 % cuts the air deficit to a third.`)}</p></div>`;
  el('b8aFig').innerHTML = '';
  Fig.put('b8aFig', Plot.psychro({ name: 'b8-psicrometrica', pws: Logi.pws, p: kPa * 1000, tRange: [Math.min(-2, UI.v('b8aT') - 3), Math.max(35, UI.v('b8aOT') + 3)], points: [{ t: A.t, W: A.W, label: T('cámara', 'room'), dew: A.dew }, { t: O.t, W: O.W, label: T('exterior', 'outside') }], xlab: T('Temperatura de bulbo seco (°C)', 'Dry-bulb temperature (°C)'), ylab: T('Razón de humedad (g/kg de aire seco)', 'Humidity ratio (g/kg dry air)') }),
    { name: 'b8-psicrometrica', title: L2('Carta psicrométrica', 'Psychrometric chart'), caption: L2('Curvas de humedad relativa del 10 al 100 % a la presión del sitio; la raya va del punto al rocío.', 'Relative humidity curves from 10 to 100 % at the site pressure; the dash runs from the point to its dew point.'), block: 8 });
  el('b8aCite').innerHTML = '';
  citeMethod('b8aCite', [Refs.short('ashrae2017'), [T('Saturación: ', 'Saturation: ') + Refs.short('wagner2002') + '; ' + Refs.short('wagner2011'), 'Saturation: ' + Refs.short('wagner2002') + '; ' + Refs.short('wagner2011')], [T('Transpiración: ', 'Transpiration: ') + Refs.short('sastry1978'), 'Transpiration: ' + Refs.short('sastry1978')]]);
  state.logistics = Object.assign(state.logistics || {}, { air: { loss } });
  Report.set('logistics:air', { order: 81, title: ['Ambiente del almacén', 'Store environment'], html: () => el('b8aRead').innerHTML + PHRep.fig('b8-psicrometrica') });
}

/* ---------------- cost ---------------- */
function costRun() {
  const c = Logi.storageCost({ kWhDay: UI.v('b8kE'), tariff: UI.v('b8kT'), labourDay: UI.v('b8kL'), otherDay: UI.v('b8kO'), capitalYear: UI.v('b8kC'), capacity: UI.v('b8kCap'), occupancy: UI.v('b8kOcc'), lossPctDay: UI.v('b8kLoss'), price: UI.v('b8kP') });
  statTiles('b8kTiles', [[T('Costo diario de la cámara', 'Daily room cost'), Fmt.num(c.total, 0)], [T('Tarimas ocupadas', 'Pallets stored'), Fmt.num(c.used, 0)], [T('Por tarima y día', 'Per pallet and day'), Fmt.num(c.perUnit, 2), T('operación', 'operation'), 'hi'], [T('Merma por tarima y día', 'Shrink per pallet and day'), Fmt.num(c.shrinkPerUnit, 2)], [T('Costo total por tarima y día', 'Total cost per pallet and day'), Fmt.num(c.fullPerUnit, 2), '', 'warn']]);
  el('b8kRead').innerHTML = `<div class="reading"><p>${L2(`Guardar una tarima cuesta ${Fmt.num(c.fullPerUnit, 2)} por día, de los que ${Fmt.num(100 * c.shrinkPerUnit / c.fullPerUnit, 0)} % es merma de peso. Almacenar sólo conviene si el precio esperado sube más que eso por día de espera; una ocupación baja encarece cada tarima.`, `Storing one pallet costs ${Fmt.num(c.fullPerUnit, 2)} per day, ${Fmt.num(100 * c.shrinkPerUnit / c.fullPerUnit, 0)} % of it weight shrink. Storage only pays if the expected price rises more than that per day of waiting; low occupancy makes each pallet dearer.`)}</p></div>`;
  state.logistics = Object.assign(state.logistics || {}, { cost: { perUnit: c.fullPerUnit } });
}

/* ---------------- compatibility ---------------- */
let xTable;
const picked = new Set(['manzana', 'lechuga', 'zanahoria', 'platano']);
function compatRun() {
  const list = xTable.get().filter(p => picked.has(p.id)).map(p => ({ id: p.id, es: p.es, en: p.en || p.es, tMin: +p.tMin, tMax: +p.tMax, rhMin: +p.rhMin, rhMax: +p.rhMax, eth: p.eth, sens: p.sens, chill: +p.chill, odor: p.odor || '' }));
  el('b8xChips').innerHTML = xTable.get().map(p => `<button type="button" class="chip" data-id="${esc(p.id)}" aria-pressed="${picked.has(p.id)}">${esc(T(p.es, p.en || p.es))}</button>`).join('');
  if (list.length < 2) { el('b8xOut').hidden = true; return; }
  const C = Logi.compatibility(list);
  S.x = { C, list };
  el('b8xOut').hidden = false;
  const nBad = C.pairs.filter(p => p.issues.some(i => i.level === 'bad')).length, nWarn = C.pairs.filter(p => p.issues.length && !p.issues.some(i => i.level === 'bad')).length;
  statTiles('b8xTiles', [[T('Productos', 'Products'), list.length], [T('Pares incompatibles', 'Incompatible pairs'), nBad, '', nBad ? 'bad' : 'good'], [T('Pares con riesgo', 'Pairs at risk'), nWarn, '', nWarn ? 'warn' : ''], [T('Temperatura común', 'Shared temperature'), C.shared.tOk ? Fmt.num(C.shared.tLo, 1) + '–' + Fmt.num(C.shared.tHi, 1) + ' °C' : T('no hay', 'none'), '', C.shared.tOk ? 'good' : 'bad'], [T('HR común', 'Shared RH'), C.shared.hOk ? C.shared.hLo + '–' + C.shared.hHi + ' %' : T('no hay', 'none')]]);
  const issues = C.pairs.flatMap(p => p.issues.map(i => ({ i, a: list[p.i], b: list[p.j] })));
  el('b8xRead').innerHTML = `<div class="reading">${issues.length ? '<ul style="margin:0;padding-left:18px">' + issues.map(x => `<li><b>${x.i.level === 'bad' ? T('Incompatible', 'Incompatible') : T('Riesgo', 'Risk')}</b>: ${esc(T(x.i.es, x.i.en))}</li>`).join('') + '</ul>' : `<p>${L2('Estos productos pueden compartir la cámara.', 'These products can share the room.')}</p>`}${C.bad ? `<p>${L2('Sepáralos en cámaras distintas o, para el etileno, ventila o usa un absorbedor; para las temperaturas no hay arreglo: la que protege a uno daña al otro.', 'Separate them into different rooms or, for ethylene, ventilate or use a scrubber; for temperatures there is no fix: what protects one harms the other.')}</p>` : ''}</div>`;
  /* the matrix of pairs */
  const n = list.length, cell = 34, lab = 150, W = lab + n * cell + 20, H = lab + n * cell + 20;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="pl" data-name="b8-compatibilidad" role="img" aria-label="${esc(T('Matriz de compatibilidad', 'Compatibility matrix'))}"><rect class="pl-bg" x="0" y="0" width="${W}" height="${H}"/>`;
  list.forEach((p, i) => {
    s += `<text class="pl-txt" x="${lab - 6}" y="${lab + i * cell + cell / 2 + 4}" text-anchor="end">${esc(T(p.es, p.en))}</text>`;
    s += `<text class="pl-txt" transform="translate(${lab + i * cell + cell / 2 + 4} ${lab - 6}) rotate(-50)">${esc(T(p.es, p.en))}</text>`;
  });
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const pr = C.pairs.find(q => (q.i === i && q.j === j) || (q.i === j && q.j === i));
    const lv = i === j ? 'self' : pr.issues.some(x => x.level === 'bad') ? 'bad' : pr.issues.length ? 'warn' : 'ok';
    const col = { self: 'var(--fig-grid)', bad: 'var(--s7)', warn: '#E8B21F', ok: 'var(--s3)' }[lv];
    s += `<rect x="${lab + j * cell + 1}" y="${lab + i * cell + 1}" width="${cell - 2}" height="${cell - 2}" rx="4" fill="${col}" fill-opacity="${lv === 'self' ? 1 : 0.8}"><title>${esc(lv === 'self' ? '' : (pr.issues.map(x => T(x.es, x.en)).join(' ') || T('compatibles', 'compatible')))}</title></rect>`;
    if (lv === 'bad' || lv === 'warn') s += `<text class="pl-txt-b" x="${lab + j * cell + cell / 2}" y="${lab + i * cell + cell / 2 + 4}" text-anchor="middle" fill="#fff" style="fill:#fff">${lv === 'bad' ? '✕' : '!'}</text>`;
  }
  s += `<g data-role="legend" class="pl-legend">${[['ok', 'var(--s3)', T('compatibles', 'compatible')], ['warn', '#E8B21F', T('riesgo', 'risk')], ['bad', 'var(--s7)', T('incompatibles', 'incompatible')]].map((L, k) => `<g data-li="${k}"><rect x="${10}" y="${12 + k * 18}" width="12" height="12" rx="3" fill="${L[1]}"/><text x="28" y="${22 + k * 18}">${L[2]}</text></g>`).join('')}</g></svg>`;
  el('b8xFig').innerHTML = '';
  Fig.put('b8xFig', s, { name: 'b8-compatibilidad', title: L2('Matriz de compatibilidad', 'Compatibility matrix'), block: 8 });
  el('b8xCite').innerHTML = '';
  citeMethod('b8xCite', [[T('Valores orientativos: ', 'Orientative values: ') + Refs.short('kader2002') + '; ' + Refs.short('gross2016') + '; ' + Refs.short('mcgregor1989'), 'Orientative values: ' + Refs.short('kader2002') + '; ' + Refs.short('gross2016') + '; ' + Refs.short('mcgregor1989')]]);
  state.logistics = Object.assign(state.logistics || {}, { compat: { bad: nBad } });
  Report.set('logistics:compat', { order: 82, title: ['Compatibilidad en almacén', 'Storage compatibility'], html: () => el('b8xRead').innerHTML + PHRep.fig('b8-compatibilidad') });
}

/* ---------------- units ---------------- */
function unitsPaint(rebuild) {
  const k = UI.s('b8uK'), U = Logi.UNITS[k], sel = el('b8uF');
  if (rebuild) { sel.innerHTML = Object.keys(U).map(u => `<option value="${u}">${esc(UNIT_NAMES[u] || u)}</option>`).join(''); }
  const v = UI.v('b8uV'), from = sel.value;
  statTiles('b8uOut', Object.keys(U).filter(u => u !== from).map(u => [UNIT_NAMES[u] || u, Fmt.sig(Logi.convert(k, v, from, u), 6)]));
}

document.addEventListener('DOMContentLoaded', () => {
  const P = el('panel-8');
  P.innerHTML = UI.panel(8, 'Empaque y logística', 'Packaging and logistics', 'Carga, ventilación, ambiente de la cámara, costos, compatibilidad y unidades', 'Loads, venting, room environment, costs, compatibility and units', tools);
  if (window.I18N) I18N.apply(P);
  ['b8pT', 'b8pL', 'b8pW', 'b8pH', 'b8bL', 'b8bW', 'b8bH', 'b8bKg', 'b8mH', 'b8mKg', 'b8cT', 'b8cStack'].forEach(id => { el(id).addEventListener('change', palletRun); el(id).addEventListener('input', () => { if (id !== 'b8pT' && ['b8pL', 'b8pW', 'b8pH'].includes(id)) el('b8pT').value = 'custom'; palletRun(); }); });
  palletRun();
  vTable = EditTable.mount('b8vTable', { id: 'b8v', columns: [{ key: 'face', es: 'Cara', en: 'Face', type: 'select', options: [['long', 'Larga', 'Long'], ['short', 'Corta', 'Short']] }, { key: 'shape', es: 'Forma', en: 'Shape', type: 'select', options: [['oblong', 'Ranura redondeada', 'Rounded slot'], ['rect', 'Rectángulo', 'Rectangle'], ['circle', 'Círculo', 'Circle']] }, { key: 'a', es: 'Largo o diámetro (cm)', en: 'Length or diameter (cm)', type: 'num' }, { key: 'b', es: 'Ancho (cm)', en: 'Width (cm)', type: 'num' }, { key: 'count', es: 'Cantidad', en: 'Count', type: 'num', step: 1 }],
    rows: [{ face: 'long', shape: 'oblong', a: 8, b: 2.5, count: 4 }, { face: 'short', shape: 'oblong', a: 7, b: 2.5, count: 2 }, { face: 'short', shape: 'circle', a: 3, b: null, count: 2 }], blank: () => ({ face: 'long', shape: 'oblong', a: null, b: null, count: 1 }), onChange: ventRun });
  ['b8vLa', 'b8vLb', 'b8vSa', 'b8vSb'].forEach(id => el(id).addEventListener('input', ventRun));
  ventRun();
  ['b8aT', 'b8aRH', 'b8aAlt', 'b8aTp', 'b8aProd', 'b8aK', 'b8aOT', 'b8aORH'].forEach(id => { el(id).addEventListener('change', airRun); el(id).addEventListener('input', () => { if (id === 'b8aK') el('b8aProd').value = 'custom'; airRun(); }); });
  airRun();
  ['b8kE', 'b8kT', 'b8kL', 'b8kO', 'b8kC', 'b8kCap', 'b8kOcc', 'b8kLoss', 'b8kP'].forEach(id => el(id).addEventListener('input', costRun));
  costRun();
  xTable = EditTable.mount('b8xTable', { id: 'b8x', columns: [{ key: 'es', es: 'Producto', en: 'Product', type: 'text', width: 200 }, { key: 'tMin', es: 'T mín (°C)', en: 'T min (°C)', type: 'num' }, { key: 'tMax', es: 'T máx (°C)', en: 'T max (°C)', type: 'num' }, { key: 'rhMin', es: 'HR mín', en: 'RH min', type: 'num' }, { key: 'rhMax', es: 'HR máx', en: 'RH max', type: 'num' }, { key: 'eth', es: 'Etileno', en: 'Ethylene', type: 'select', options: [['VL', 'VL'], ['L', 'L'], ['M', 'M'], ['H', 'H'], ['VH', 'VH']] }, { key: 'sens', es: 'Sensibilidad', en: 'Sensitivity', type: 'select', options: [['L', 'L'], ['M', 'M'], ['H', 'H']] }, { key: 'chill', es: 'Frío', en: 'Chilling', type: 'select', options: [['0', '0'], ['1', '1'], ['2', '2']] }, { key: 'odor', es: 'Olor', en: 'Odour', type: 'select', options: [['', '—'], ['p', 'p'], ['a', 'a']] }],
    rows: Logi.PRODUCTS.map(p => Object.assign({}, p, { chill: String(p.chill) })), blank: rows => ({ id: 'p' + rows.length, es: '', en: '', tMin: 0, tMax: 5, rhMin: 90, rhMax: 95, eth: 'VL', sens: 'L', chill: '0', odor: '' }), onChange: rows => { rows.forEach(r => { if (!r.id) r.id = 'p' + Math.random().toString(36).slice(2, 7); }); compatRun(); } });
  el('b8xChips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; const id = b.dataset.id; if (picked.has(id)) picked.delete(id); else picked.add(id); compatRun(); });
  compatRun();
  el('b8uK').addEventListener('change', () => unitsPaint(true));
  ['b8uV', 'b8uF'].forEach(id => { el(id).addEventListener('input', () => unitsPaint(false)); el(id).addEventListener('change', () => unitsPaint(false)); });
  unitsPaint(true);
});
document.addEventListener('langchange', () => { palletRun(); ventRun(); airRun(); costRun(); compatRun(); unitsPaint(true); });
})();
