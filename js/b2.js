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

/* PostHarvestPro — Block 2, quality and maturity: the quality summary of a
   trial, color (conversions, differences and the color of the data), the
   laboratory calculators, ripeness and damage scales, and size grades. */
(function () {
'use strict';
const ID = s => 'b2' + s;
const GROUP_M = ['temperatura', 'tratamiento', 'grupo', 'lote', 'trt', 'temperature', 'treatment', 'group', 'lot', 'variedad', 'cultivar'];
const TIME_M = ['dia', 'dias', 'tiempo', 'day', 'days', 'time', 'semana', 'week', 'hora', 'horas'];
const NOT_VARS = ['fruto', 'rep', 'repeticion', 'id', 'unidad', 'frasco', 'parcela', 'bloque'];
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const S = { q: null, c: null, g: null, k: null };

/* ---------------- the panel ---------------- */
const tools = [
  { id: 'calidad', es: 'Resumen de calidad', en: 'Quality summary', html: `
    <div class="card"><h2>${L2('Datos del ensayo', 'Trial data')}</h2>
      <p class="hint">${L2('Una fila por fruto (o por muestra), con columnas para el grupo (temperatura, tratamiento, lote), el tiempo y cada atributo. Con sólidos solubles y acidez se calcula SST/AT y BrimA; con L*, a* y b*, el croma, el tono y los índices de color.', 'One row per fruit (or sample), with columns for the group (temperature, treatment, lot), the time and each attribute. With soluble solids and acidity, SSC/TA and BrimA are computed; with L*, a* and b*, chroma, hue and the color indices.')}</p>
      <div id="b2qIn"></div></div>
    <div id="b2qOut" hidden>
      <div class="card"><h2>${L2('Resumen por grupo y tiempo', 'Summary by group and time')}</h2>
        <div class="form-grid tight">${UI.sel('b2qShow', 'Mostrar', 'Show', [['sd', 'media ± DE', 'mean ± SD'], ['se', 'media ± EE', 'mean ± SE'], ['ci', 'media e IC 95 %', 'mean and 95% CI']], 'sd')}${UI.sel('b2qVar', 'Variable de la figura', 'Variable of the figure', [], '')}</div>
        <div id="b2qTiles"></div><div id="b2qRead"></div><div id="b2qFig"></div><div id="b2qTab"></div><div id="b2qCite"></div></div>
    </div>` },
  { id: 'color', es: 'Color', en: 'Color', html: `
    <div class="card"><h2>${L2('Conversor de color', 'Color converter')}</h2>
      <p class="hint">${L2('Escribe el color en cualquiera de sus formas: L*a*b* (iluminante D65, observador de 2°), RGB de 0 a 255 o su código hexadecimal. Las otras se actualizan y aparece la muestra.', 'Type the color in any of its forms: L*a*b* (D65 illuminant, 2° observer), RGB from 0 to 255 or its hexadecimal code. The others update and the swatch appears.')}</p>
      <div class="form-grid tight">${UI.num('b2cL', 'L*', 'L*', 62)}${UI.num('b2cA', 'a*', 'a*', 8)}${UI.num('b2cB', 'b*', 'b*', 48)}${UI.num('b2cR', 'R', 'R', '', { min: 0, max: 255, step: 1 })}${UI.num('b2cG', 'G', 'G', '', { min: 0, max: 255, step: 1 })}${UI.num('b2cBl', 'B', 'B', '', { min: 0, max: 255, step: 1 })}${UI.text('b2cHex', 'Hexadecimal', 'Hexadecimal', '')}<div class="field"><label for="b2cPick">${L2('Elegir', 'Pick')}</label><input type="color" id="b2cPick" value="#cccccc"></div></div>
      <div class="swatch-row" id="b2cSw"></div><div id="b2cTiles"></div><div id="b2cRead"></div><div id="b2cMCite"></div></div>
    <div class="card"><h2>${L2('Diferencia entre dos colores', 'Difference between two colors')}</h2>
      <p class="hint">${L2('El color 1 es el de referencia (por ejemplo, el inicial o el de un testigo).', 'Color 1 is the reference (for instance, the initial one or that of a control).')}</p>
      <div class="form-grid tight">${UI.num('b2d1L', 'L* 1', 'L* 1', 64)}${UI.num('b2d1A', 'a* 1', 'a* 1', -11)}${UI.num('b2d1B', 'b* 1', 'b* 1', 36)}${UI.num('b2d2L', 'L* 2', 'L* 2', 67)}${UI.num('b2d2A', 'a* 2', 'a* 2', 9)}${UI.num('b2d2B', 'b* 2', 'b* 2', 52)}</div>
      <div class="btn-row" style="margin-top:0"><button type="button" class="btn btn-ghost btn-sm" id="b2dUse">${L2('Usar el color del conversor como color 2', 'Use the converter color as color 2')}</button></div>
      <div class="swatch-row" id="b2dSw" style="margin-top:10px"></div><div id="b2dTiles"></div><div class="de-meter" id="b2dMeter" aria-hidden="true"><i></i></div><div id="b2dRead"></div></div>
    <div class="card"><h2>${L2('El color de tus datos', 'The color of your data')}</h2>
      <p class="hint">${L2('Columnas L*, a* y b*, con grupo y tiempo: el color medio de cada grupo en cada tiempo, su diferencia ΔE00 con el color inicial del grupo y la evolución del tono.', 'L*, a* and b* columns, with group and time: the mean color of each group at each time, its ΔE00 from the group\'s initial color and the course of hue.')}</p>
      <div id="b2cIn"></div><div id="b2cOut" hidden><div id="b2cStrip"></div><div class="figs-2"><div id="b2cDE"></div><div id="b2cHue"></div></div><div id="b2cTab"></div><div id="b2cCite"></div></div></div>` },
  { id: 'calc', es: 'Acidez, humedad y firmeza', en: 'Acidity, moisture and firmness', html: `
    <div class="cols-2">
      <div class="card"><h2>${L2('Acidez titulable', 'Titratable acidity')}</h2>
        <p class="hint">${L2('Titulación con NaOH hasta pH 8.1 (o fenolftaleína). Si diluiste la muestra y tomaste una alícuota, escribe ambos volúmenes.', 'Titration with NaOH to pH 8.1 (or phenolphthalein). If you diluted the sample and took an aliquot, write both volumes.')}</p>
        <div class="form-grid tight">${UI.num('b2aV', 'NaOH gastado (mL)', 'NaOH used (mL)', 8.2)}${UI.num('b2aN', 'Normalidad del NaOH', 'NaOH normality', 0.1)}${UI.num('b2aM', 'Muestra (g o mL)', 'Sample (g or mL)', 10)}${UI.num('b2aTot', 'Volumen aforado (mL)', 'Made-up volume (mL)', '')}${UI.num('b2aAli', 'Alícuota (mL)', 'Aliquot (mL)', '')}${UI.sel('b2aAcid', 'Ácido dominante', 'Dominant acid', Object.keys(Quality.ACIDS).map(k => [k, Quality.ACIDS[k].es, Quality.ACIDS[k].en]), 'citric')}${UI.num('b2aSSC', 'Sólidos solubles (°Brix)', 'Soluble solids (°Brix)', 14.5)}</div>
        <div id="b2aOut"></div></div>
      <div class="card"><h2>${L2('Humedad y materia seca', 'Moisture and dry matter')}</h2>
        <p class="hint">${L2('Pesadas de la cápsula vacía, con la muestra fresca y después de secar a peso constante.', 'Weights of the empty dish, with the fresh sample and after drying to constant weight.')}</p>
        <div class="form-grid tight">${UI.num('b2hT', 'Cápsula vacía (g)', 'Empty dish (g)', 32.415)}${UI.num('b2hF', 'Cápsula + fresca (g)', 'Dish + fresh (g)', 37.418)}${UI.num('b2hD', 'Cápsula + seca (g)', 'Dish + dry (g)', 33.212)}</div>
        <div id="b2hOut"></div></div>
      <div class="card"><h2>${L2('Firmeza', 'Firmness')}</h2>
        <div class="form-grid tight">${UI.num('b2fV', 'Lectura', 'Reading', 12.5)}${UI.sel('b2fU', 'Unidad', 'Unit', [['N', 'N', 'N'], ['kgf', 'kgf', 'kgf'], ['lbf', 'lbf', 'lbf'], ['gf', 'gf', 'gf']], 'kgf')}${UI.num('b2fD', 'Diámetro del émbolo (mm)', 'Plunger diameter (mm)', 8)}</div>
        <div id="b2fOut"></div></div>
      <div class="card"><h2>${L2('Pérdida de peso', 'Weight loss')}</h2>
        <div class="form-grid tight">${UI.num('b2wI', 'Peso inicial (g)', 'Initial weight (g)', 312.4)}${UI.num('b2wF', 'Peso actual (g)', 'Current weight (g)', 298.7)}${UI.num('b2wD', 'Días transcurridos', 'Days elapsed', 9)}</div>
        <div id="b2wOut"></div></div>
    </div>` },
  { id: 'escalas', es: 'Escalas de madurez y daño', en: 'Ripeness and damage scales', html: `
    <div class="card"><h2>${L2('La escala', 'The scale')}</h2>
      <p class="hint">${L2('Cada clase con su valor (0 = sano o el primer grado) y su descripción. Edítala o elige una plantilla.', 'Each class with its value (0 = sound, or the first grade) and its description. Edit it or pick a template.')}</p>
      <div class="btn-row" style="margin:0 0 8px"><button type="button" class="btn btn-ghost btn-sm" data-scale="damage">${L2('Daño 0–4', 'Damage 0–4')}</button><button type="button" class="btn btn-ghost btn-sm" data-scale="ripe">${L2('Madurez 1–5', 'Ripeness 1–5')}</button><button type="button" class="btn btn-ghost btn-sm" data-scale="decay">${L2('Pudrición 0–3', 'Decay 0–3')}</button></div>
      <div id="b2sTable"></div>
      <div class="form-grid tight">${UI.sel('b2sTol', 'Tolerancia comercial (clase máxima aceptada)', 'Market tolerance (highest class accepted)', [], '')}</div></div>
    <div class="card"><h2>${L2('Los datos', 'The data')}</h2>
      <p class="hint">${L2('Una calificación por fruto (columna con la clase), con grupo y tiempo opcionales; o, abajo, los conteos de cada lote.', 'One grade per fruit (a column with the class), with optional group and time; or, below, the counts of each lot.')}</p>
      <div id="b2gIn"></div>
      <details style="margin-top:10px"><summary class="hint" style="cursor:pointer">${L2('…o escribe conteos por lote', '…or type counts by lot')}</summary>
        <textarea id="b2gCounts" rows="4" class="code" data-es-ph="Un lote por línea: nombre: conteo de la clase 0, de la 1, … (por ejemplo «Lote A: 50, 20, 15, 10, 5»)" data-en-ph="One lot per line: name: count of class 0, of class 1, … (e.g. «Lot A: 50, 20, 15, 10, 5»)" aria-label="${T('Conteos por lote', 'Counts by lot')}"></textarea>
        <div class="btn-row"><button type="button" class="btn btn-primary btn-sm" id="b2gUse">${L2('Usar los conteos', 'Use the counts')}</button></div></details>
      <div class="messages" id="b2gMsg"></div></div>
    <div class="card" id="b2gOut" hidden><h2>${L2('Índices de la escala', 'Scale indices')}</h2><div id="b2gTiles"></div><div id="b2gRead"></div><div id="b2gFig"></div><div id="b2gFig2"></div><div id="b2gTab"></div><div id="b2gCite"></div></div>` },
  { id: 'calibres', es: 'Calibres', en: 'Size grades', html: `
    <div class="card"><h2>${L2('Las clases', 'The classes')}</h2>
      <p class="hint">${L2('Cada calibre con su mínimo (incluido) y su máximo (excluido, salvo en la última clase), en la unidad de tus datos. Las plantillas son orientativas: usa las de tu norma.', 'Each grade with its minimum (included) and maximum (excluded, except in the last class), in the unit of your data. The templates are orientative: use those of your standard.')}</p>
      <div class="btn-row" style="margin:0 0 8px"><button type="button" class="btn btn-ghost btn-sm" data-cal="weight">${L2('Por peso (g)', 'By weight (g)')}</button><button type="button" class="btn btn-ghost btn-sm" data-cal="count">${L2('Frutos por caja de 4 kg', 'Fruit per 4 kg box')}</button><button type="button" class="btn btn-ghost btn-sm" data-cal="diam">${L2('Por diámetro (mm)', 'By diameter (mm)')}</button></div>
      <div id="b2kTable"></div></div>
    <div class="card"><h2>${L2('Los frutos', 'The fruit')}</h2><div id="b2kIn"></div></div>
    <div class="card" id="b2kOut" hidden><h2>${L2('Distribución por calibre', 'Distribution by grade')}</h2><div id="b2kTiles"></div><div id="b2kRead"></div><div id="b2kFig"></div><div id="b2kTab"></div><div id="b2kCite"></div></div>` },
];

/* ---------------- 1. quality summary ---------------- */
const DERIVED = {
  ratio: ['SST/AT', 'SSC/TA'], brimA: ['BrimA', 'BrimA'], C: ['Croma C*', 'Chroma C*'], h: ['Tono h°', 'Hue h°'],
  cci: ['Índice de color de cítricos', 'Citrus color index'], bi: ['Índice de pardeamiento', 'Browning index'],
};
function qualityRun(D) {
  const m = D.map;
  const rows = D.rows.map(r => {
    const o = Object.assign({}, r);
    if (m.sst && m.at && isFinite(r[m.sst]) && isFinite(r[m.at]) && r[m.at] > 0) { o.ratio = Quality.ratio(+r[m.sst], +r[m.at]); o.brimA = Quality.brimA(+r[m.sst], +r[m.at]); }
    if (m.L && m.a && m.b && [r[m.L], r[m.a], r[m.b]].every(v => v != null && isFinite(v))) {
      const I = Color.indices(+r[m.L], +r[m.a], +r[m.b]);
      o.C = I.C; o.h = I.h; o.cci = I.cci; o.bi = I.bi;
    }
    return o;
  });
  const vars = (m.vars || []).slice();
  ['ratio', 'brimA', 'C', 'h', 'cci', 'bi'].forEach(k => { if (rows.some(r => r[k] != null)) vars.push(k); });
  const keyG = m.group || null, keyT = m.time || null;
  const groups = keyG ? Trial.levelsOf(rows, keyG) : ['—'];
  const times = keyT ? [...new Set(rows.map(r => r[keyT]).filter(v => v != null))].sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b)))) : [null];
  const cells = [];
  groups.forEach(gq => times.forEach(tq => {
    const sub = rows.filter(r => (!keyG || String(r[keyG]) === gq) && (!keyT || r[keyT] === tq));
    if (!sub.length) return;
    const c = { group: gq, time: tq, n: sub.length };
    vars.forEach(v => { c[v] = Quality.summary(sub.map(r => r[v])); });
    cells.push(c);
  }));
  S.q = { rows, vars, keyG, keyT, groups, times, cells, map: m };
  const sel = el('b2qVar');
  const prev = sel.value;
  sel.innerHTML = vars.map(v => `<option value="${esc(v)}">${esc(varName(v))}</option>`).join('');
  sel.value = vars.includes(prev) ? prev : (vars.includes('firmeza_N') ? 'firmeza_N' : vars[0]);
  qualityPaint();
}
const varName = v => (DERIVED[v] ? T(DERIVED[v][0], DERIVED[v][1]) : v);
function qualityPaint() {
  const Q = S.q;
  if (!Q) return;
  el('b2qOut').hidden = false;
  const show = el('b2qShow').value, v = el('b2qVar').value;
  const cellTxt = s => {
    if (!s || !s.n) return '—';
    if (show === 'ci') return Fmt.num(s.mean) + ' ' + Fmt.ci(s.lo, s.hi);
    return Fmt.num(s.mean) + ' ± ' + Fmt.num(show === 'se' ? s.se : s.sd);
  };
  statTiles('b2qTiles', [
    [T('Observaciones', 'Observations'), Q.rows.length],
    [T('Grupos', 'Groups'), Q.keyG ? Q.groups.length : '—', Q.keyG ? esc(Q.keyG) : ''],
    [T('Tiempos', 'Times'), Q.keyT ? Q.times.length : '—', Q.keyT ? esc(Q.keyT) : ''],
    [T('Variables', 'Variables'), Q.vars.length, Q.vars.filter(x => DERIVED[x]).length ? T('incluye las calculadas', 'includes the computed ones') : ''],
  ]);
  const cols = [];
  if (Q.keyG) cols.push({ key: 'group', label: esc(Q.keyG) });
  if (Q.keyT) cols.push({ key: 'time', label: esc(Q.keyT), num: true });
  cols.push({ key: 'n', label: 'n', num: true });
  Q.vars.forEach(x => cols.push({ key: x, label: esc(varName(x)), num: true, get: c => cellTxt(c[x]) }));
  buildTable('b2qTab', cols, Q.cells, { csvName: T('resumen_calidad', 'quality_summary') });
  /* figure: the chosen variable over time by group (mean ± SE) or by group */
  const host = el('b2qFig'); host.innerHTML = '';
  let svg;
  if (Q.keyT) {
    svg = Plot.lines({
      name: 'b2-calidad', series: Q.groups.map(gq => {
        const cs = Q.cells.filter(c => c.group === gq && c[v] && c[v].n);
        return { name: Q.keyG ? Q.keyG + ' ' + gq : varName(v), x: cs.map(c => +c.time), y: cs.map(c => c[v].mean), lo: cs.map(c => c[v].mean - c[v].se), hi: cs.map(c => c[v].mean + c[v].se) };
      }), xlab: Q.keyT, ylab: varName(v), label: varName(v),
    });
  } else {
    const cs = Q.cells;
    svg = Plot.bars({ name: 'b2-calidad', cats: cs.map(c => c.group), values: cs.map(c => c[v] ? c[v].mean : NaN), err: cs.map(c => c[v] ? c[v].se : NaN), ylab: varName(v), label: varName(v) });
  }
  Fig.put(host, svg, { name: 'b2-calidad', title: L2('Evolución de ', 'Course of ') + esc(varName(v)), caption: L2('Media ± error estándar.', 'Mean ± standard error.'), block: 2,
    data: { header: ['grupo', 'tiempo', 'n', 'media', 'de', 'ee'], rows: Q.cells.filter(c => c[v]).map(c => [c.group, c.time, c[v].n, c[v].mean, c[v].sd, c[v].se]) } });
  /* reading: change from the first to the last time of each group */
  const rd = el('b2qRead');
  if (Q.keyT) {
    const ch = Q.groups.map(gq => {
      const cs = Q.cells.filter(c => c.group === gq && c[v] && c[v].n);
      if (cs.length < 2) return null;
      const a = cs[0][v].mean, b = cs[cs.length - 1][v].mean;
      return { g: gq, a, b, t0: cs[0].time, t1: cs[cs.length - 1].time, pct: 100 * (b - a) / Math.abs(a) };
    }).filter(Boolean);
    if (ch.length) {
      const big = ch.slice().sort((x, y) => Math.abs(y.pct) - Math.abs(x.pct))[0];
      rd.innerHTML = `<div class="reading"><p>${ch.map(c => L2(`<b>${esc(Q.keyG ? Q.keyG + ' ' + c.g : varName(v))}</b>: ${esc(varName(v))} pasó de ${Fmt.num(c.a)} a ${Fmt.num(c.b)} entre ${esc(c.t0)} y ${esc(c.t1)} (${c.pct >= 0 ? '+' : '−'}${Fmt.num(Math.abs(c.pct), 1)} %).`, `<b>${esc(Q.keyG ? Q.keyG + ' ' + c.g : varName(v))}</b>: ${esc(varName(v))} went from ${Fmt.num(c.a)} to ${Fmt.num(c.b)} between ${esc(c.t0)} and ${esc(c.t1)} (${c.pct >= 0 ? '+' : '−'}${Fmt.num(Math.abs(c.pct), 1)}%).`)).join(' ')}</p>` +
        (ch.length > 1 ? `<p>${L2(`El cambio más rápido fue el de <b>${esc(big.g)}</b>. Para saber si las diferencias entre grupos son reales, analiza el ensayo en el Bloque 7; para modelar la velocidad del cambio, usa la cinética del Bloque 3.`, `The fastest change was that of <b>${esc(big.g)}</b>. To know whether the differences between groups are real, analyze the trial in Block 7; to model the rate of change, use the kinetics of Block 3.`)}</p>` : '') + `</div>`;
    } else rd.innerHTML = '';
  } else rd.innerHTML = '';
  el('b2qCite').innerHTML = '';
  citeMethod('b2qCite', [['Acidez titulable por titulación (AOAC 942.15)', 'Titratable acidity by titration (AOAC 942.15)'], 'BrimA: ' + Refs.short('jordan2001'), ['Color: ' + Refs.short('cie2018') + '; ' + Refs.short('mcguire1992'), 'Color: ' + Refs.short('cie2018') + '; ' + Refs.short('mcguire1992')], 'CCI: ' + Refs.short('jimenez1981'), 'BI: ' + Refs.short('palou1999')]);
  state.quality = Object.assign(state.quality || {}, { summary: { n: Q.rows.length, vars: Q.vars, groups: Q.groups, times: Q.times } });
  Report.set('quality:summary', {
    order: 20, title: ['Resumen de calidad', 'Quality summary'],
    html: () => `<p>${T('Observaciones', 'Observations')}: ${Q.rows.length}. ${T('Variable de la figura', 'Variable in the figure')}: <b>${esc(varName(v))}</b>.</p>` + reportFig('b2-calidad') + (el('b2qRead').innerHTML || '') + reportTable('b2qTab'),
  });
}

/* ---------------- 2. color ---------------- */
let colorLock = false;
function colorFrom(kind) {
  if (colorLock) return;
  colorLock = true;
  let L, a, b;
  if (kind === 'lab') { L = UI.v('b2cL'); a = UI.v('b2cA'); b = UI.v('b2cB'); }
  else {
    let rgb;
    if (kind === 'rgb') rgb = [UI.v('b2cR'), UI.v('b2cG'), UI.v('b2cBl')];
    else if (kind === 'hex') rgb = Color.hexToRgb(UI.s('b2cHex'));
    else rgb = Color.hexToRgb(UI.s('b2cPick'));
    if (rgb && rgb.every(v => isFinite(v))) { [L, a, b] = Color.rgbToLab(...rgb.map(v => Math.max(0, Math.min(255, v)))); el('b2cL').value = +L.toFixed(2); el('b2cA').value = +a.toFixed(2); el('b2cB').value = +b.toFixed(2); }
  }
  if ([L, a, b].every(isFinite)) {
    const H = Color.labToHex(L, a, b);
    if (kind !== 'rgb') { el('b2cR').value = H.rgb[0]; el('b2cG').value = H.rgb[1]; el('b2cBl').value = H.rgb[2]; }
    if (kind !== 'hex') el('b2cHex').value = H.hex;
    if (kind !== 'pick') el('b2cPick').value = H.hex.toLowerCase();
    const I = Color.indices(L, a, b), st = Color.hueStage(I.h);
    el('b2cSw').innerHTML = `<div class="swatch"><div class="sw${H.inGamut ? '' : ' out'}" style="background:${H.hex}"></div><div class="sd"><b>${H.hex}</b> · L* ${Fmt.num(L, 1)} a* ${Fmt.num(a, 1)} b* ${Fmt.num(b, 1)}<br>${H.inGamut ? L2('dentro de la gama de una pantalla sRGB', 'inside the gamut of an sRGB screen') : L2('fuera de la gama sRGB: se muestra el más cercano con el mismo L* y h°', 'outside the sRGB gamut: shown is the nearest with the same L* and h°')}</div></div>`;
    statTiles('b2cTiles', [
      ['Croma C*', Fmt.num(I.C, 2)], [T('Tono h°', 'Hue h°'), Fmt.num(I.h, 1) + '°', st ? T(st.es, st.en) : ''],
      ['a*/b*', Fmt.num(I.aOverB, 3)], [T('Índice de cítricos (CCI)', 'Citrus color index (CCI)'), Fmt.num(I.cci, 2)],
      [T('Pardeamiento (BI)', 'Browning (BI)'), Fmt.num(I.bi, 1)], [T('Blancura (WI)', 'Whiteness (WI)'), Fmt.num(I.whiteness, 1)],
      [T('Amarillez (YI)', 'Yellowness (YI)'), Fmt.num(I.yellowness, 1)], [T('Índice de jitomate (TCI)', 'Tomato color index (TCI)'), Fmt.num(I.tci, 1)],
    ]);
    el('b2cRead').innerHTML = `<div class="reading"><p>${L2(`Un tono de ${Fmt.num(I.h, 1)}° se lee como <b>${st ? st.es : ''}</b> en frutos que pasan del verde al amarillo, naranja o rojo; cada cultivo tiene su propia escala. El croma (${Fmt.num(I.C, 1)}) dice qué tan intenso es el color, y L* qué tan claro.`, `A hue of ${Fmt.num(I.h, 1)}° reads as <b>${st ? st.en : ''}</b> in fruit that turn from green to yellow, orange or red; each crop has its own scale. Chroma (${Fmt.num(I.C, 1)}) says how intense the color is, and L* how light.`)}</p></div>`;
    /* the source of each index of the tiles */
    el('b2cMCite').innerHTML = '';
    citeMethod('b2cMCite', [Refs.short('cie2018') + ' (CIELAB, D65)', 'C*, h°: ' + Refs.short('mcguire1992'), 'CCI: ' + Refs.short('jimenez1981'), 'BI: ' + Refs.short('palou1999'), 'WI: ' + Refs.short('judd1975'), 'YI: ' + Refs.short('francis1975'), 'TCI: ' + Refs.short('hobson1983')]);
  }
  colorLock = false;
}
function deltaPaint() {
  const c1 = [UI.v('b2d1L'), UI.v('b2d1A'), UI.v('b2d1B')], c2 = [UI.v('b2d2L'), UI.v('b2d2A'), UI.v('b2d2B')];
  if (![...c1, ...c2].every(isFinite)) return;
  const d76 = Color.dE76(...c1, ...c2), d94 = Color.dE94(...c1, ...c2), d00 = Color.dE00(...c1, ...c2), R = Color.dEReading(d00);
  const sw = c => { const H = Color.labToHex(...c); return `<div class="swatch"><div class="sw${H.inGamut ? '' : ' out'}" style="background:${H.hex}"></div><div class="sd"><b>${H.hex}</b> · L* ${Fmt.num(c[0], 1)} a* ${Fmt.num(c[1], 1)} b* ${Fmt.num(c[2], 1)}</div></div>`; };
  el('b2dSw').innerHTML = sw(c1) + sw(c2);
  statTiles('b2dTiles', [['ΔE*ab (1976)', Fmt.num(d76, 2)], ['ΔE94', Fmt.num(d94, 2)], ['ΔE00 (CIEDE2000)', Fmt.num(d00, 2), T(R.es, R.en), d00 >= 3.5 ? 'hi' : ''], ['ΔL*', Fmt.num(c2[0] - c1[0], 2)], ['ΔC*', Fmt.num(Color.chroma(c2[1], c2[2]) - Color.chroma(c1[1], c1[2]), 2)], ['Δh°', Fmt.num(Color.hue(c2[1], c2[2]) - Color.hue(c1[1], c1[2]), 1)]]);
  el('b2dMeter').querySelector('i').style.left = Math.min(100, d00 / 8 * 100) + '%';
  el('b2dRead').innerHTML = `<div class="reading"><p>${L2(`Con ΔE00 = ${Fmt.num(d00, 2)} la diferencia es <b>${R.isEs}</b> (umbrales orientativos de Mokrzycki y Tatol 2011: menos de 1 no se percibe; de 2 a 3.5 la nota cualquiera; más de 5 son colores distintos). ΔE00 corrige las distorsiones de ΔE*ab en los azules, los grises y los colores muy saturados: es la que conviene reportar.`, `With ΔE00 = ${Fmt.num(d00, 2)} the difference is <b>${R.isEn}</b> (orientative thresholds of Mokrzycki and Tatol 2011: below 1 it is not perceived; from 2 to 3.5 anyone notices it; above 5 they are different colors). ΔE00 corrects the distortions of ΔE*ab in blues, grays and highly saturated colors: it is the one to report.`)}</p></div>`;
}
function colorDataRun(D) {
  const m = D.map;
  const rows = D.rows.filter(r => [r[m.L], r[m.a], r[m.b]].every(v => v != null && isFinite(v)));
  const keyG = m.group || null, keyT = m.time || null;
  const groups = keyG ? Trial.levelsOf(rows, keyG) : ['—'];
  const times = keyT ? [...new Set(rows.map(r => r[keyT]))].sort((x, y) => x - y) : [null];
  const cells = [];
  groups.forEach(gq => {
    let ref = null;
    times.forEach(tq => {
      const sub = rows.filter(r => (!keyG || String(r[keyG]) === gq) && (!keyT || r[keyT] === tq));
      if (!sub.length) return;
      const L = Num.mean(sub.map(r => +r[m.L])), a = Num.mean(sub.map(r => +r[m.a])), b = Num.mean(sub.map(r => +r[m.b]));
      if (!ref) ref = [L, a, b];
      cells.push({ group: gq, time: tq, n: sub.length, L, a, b, C: Color.chroma(a, b), h: Color.hue(a, b), hex: Color.labToHex(L, a, b).hex, dE: Color.dE00(...ref, L, a, b), dE76: Color.dE76(...ref, L, a, b) });
    });
  });
  S.c = { cells, groups, times, keyG, keyT };
  el('b2cOut').hidden = false;
  /* the strip of mean colors: one row per group, one column per time */
  const W = 640, cw = Math.max(26, Math.min(70, (W - 150) / times.length)), rh = 34, H = 40 + groups.length * (rh + 8) + 20;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="pl" data-name="b2-tira-color" role="img" aria-label="${esc(T('Color medio por grupo y tiempo', 'Mean color by group and time'))}"><rect class="pl-bg" x="0" y="0" width="${W}" height="${H}"/>`;
  times.forEach((tq, j) => { s += `<text class="pl-note" x="${140 + j * cw + cw / 2}" y="24" text-anchor="middle">${esc(tq == null ? '' : tq)}</text>`; });
  groups.forEach((gq, i) => {
    const y = 34 + i * (rh + 8);
    s += `<text class="pl-txt-b" x="132" y="${y + rh / 2 + 4}" text-anchor="end">${esc(keyG ? keyG + ' ' + gq : '')}</text>`;
    times.forEach((tq, j) => { const c = cells.find(x => x.group === gq && x.time === tq); if (c) s += `<rect x="${140 + j * cw + 1}" y="${y}" width="${cw - 2}" height="${rh}" rx="5" fill="${c.hex}"><title>${esc(c.hex + ' · L* ' + c.L.toFixed(1) + ' a* ' + c.a.toFixed(1) + ' b* ' + c.b.toFixed(1))}</title></rect>`; });
  });
  if (keyT) s += `<text class="pl-lab" x="${140 + times.length * cw / 2}" y="${H - 4}" text-anchor="middle">${esc(keyT)}</text>`;
  s += '</svg>';
  el('b2cStrip').innerHTML = '';
  Fig.put('b2cStrip', s, { name: 'b2-tira-color', title: L2('Color medio de cada grupo en cada tiempo', 'Mean color of each group at each time'), caption: L2('Cada celda es el promedio de L*, a* y b* convertido a sRGB.', 'Each cell is the mean of L*, a* and b* converted to sRGB.'), block: 2 });
  const ser = key => groups.map(gq => { const cs = cells.filter(c => c.group === gq); return { name: keyG ? keyG + ' ' + gq : key, x: cs.map(c => +c.time), y: cs.map(c => c[key]) }; });
  el('b2cDE').innerHTML = ''; el('b2cHue').innerHTML = '';
  if (keyT) {
    Fig.put('b2cDE', Plot.lines({ name: 'b2-deltaE', series: ser('dE'), xlab: keyT, ylab: 'ΔE00', hlines: [{ y: 3.5, label: T('perceptible para cualquiera', 'noticed by anyone') }], yZero: true, w: 520, h: 330 }), { name: 'b2-deltaE', title: L2('Cambio de color desde el inicio (ΔE00)', 'Color change from the start (ΔE00)'), block: 2 });
    Fig.put('b2cHue', Plot.lines({ name: 'b2-tono', series: ser('h'), xlab: keyT, ylab: T('Tono h° (grados)', 'Hue h° (degrees)'), w: 520, h: 330 }), { name: 'b2-tono', title: L2('Ángulo de tono', 'Hue angle'), block: 2 });
  }
  const cols = [];
  if (keyG) cols.push({ key: 'group', label: esc(keyG) });
  if (keyT) cols.push({ key: 'time', label: esc(keyT), num: true });
  cols.push({ key: 'n', label: 'n', num: true }, { key: 'L', label: 'L*', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'a', label: 'a*', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'b', label: 'b*', num: true, fmt: v => Fmt.num(v, 2) },
    { key: 'C', label: 'C*', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'h', label: 'h°', num: true, fmt: v => Fmt.num(v, 1) }, { key: 'dE', label: 'ΔE00', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'hex', label: L2('Muestra', 'Swatch'), html: true, get: c => `<span style="display:inline-block;width:34px;height:14px;border-radius:4px;background:${c.hex};vertical-align:middle;border:1px solid var(--border)"></span> <code>${c.hex}</code>` });
  buildTable('b2cTab', cols, cells, { csvName: T('color_por_grupo', 'color_by_group') });
  el('b2cCite').innerHTML = '';
  citeMethod('b2cCite', [Refs.short('cie2018') + ' (CIELAB, D65)', 'ΔE00: ' + Refs.short('sharma2005'), 'C*, h°: ' + Refs.short('mcguire1992')]);
  state.quality = Object.assign(state.quality || {}, { color: { groups, times } });
  Report.set('quality:color', { order: 21, title: ['Color', 'Color'], html: () => reportFig('b2-tira-color') + reportFig('b2-deltaE') + reportTable('b2cTab') });
}

/* ---------------- 3. laboratory calculators ---------------- */
function calcPaint() {
  const acid = UI.s('b2aAcid');
  const ta = Quality.titratableAcidity({ volume: UI.v('b2aV'), normality: UI.v('b2aN'), sample: UI.v('b2aM'), totalVolume: UI.v('b2aTot') || null, aliquot: UI.v('b2aAli') || null, acid });
  const ssc = UI.v('b2aSSC');
  const conv = Object.keys(Quality.ACIDS).filter(k => k !== acid).map(k => `${T(Quality.ACIDS[k].es, Quality.ACIDS[k].en)} ${Fmt.num(Quality.convertAcid(ta, acid, k), 3)}${Fmt.pcs()}`).join(' · ');
  statTiles('b2aOut', [[T('Acidez titulable', 'Titratable acidity'), Fmt.num(ta, 3) + Fmt.pcs(), T('como ácido ', 'as ') + T(Quality.ACIDS[acid].es, Quality.ACIDS[acid].en)], [T('SST/AT', 'SSC/TA'), isFinite(ssc) ? Fmt.num(Quality.ratio(ssc, ta), 1) : '—', T('índice de madurez', 'maturity index')], ['BrimA', isFinite(ssc) ? Fmt.num(Quality.brimA(ssc, ta), 2) : '—', T('SST − 2·AT', 'SSC − 2·TA')]]);
  el('b2aOut').insertAdjacentHTML('beforeend', `<p class="hint" style="grid-column:1/-1">${L2('Expresada como otros ácidos: ', 'Expressed as other acids: ')}${conv}</p>`);
  const m = Quality.moistureFromDish(UI.v('b2hT'), UI.v('b2hF'), UI.v('b2hD'));
  statTiles('b2hOut', [[T('Humedad (base húmeda)', 'Moisture (wet basis)'), Fmt.num(m.wetBasis, 2) + Fmt.pcs()], [T('Materia seca', 'Dry matter'), Fmt.num(m.dryMatter, 2) + Fmt.pcs()], [T('Humedad (base seca)', 'Moisture (dry basis)'), Fmt.num(m.dryBasis, 1) + Fmt.pcs(), T('g de agua por 100 g de materia seca', 'g water per 100 g dry matter')]]);
  const fv = UI.v('b2fV'), fu = UI.s('b2fU'), N = Quality.convertForce(fv, fu, 'N');
  statTiles('b2fOut', [['N', Fmt.num(N, 2)], ['kgf', Fmt.num(Quality.convertForce(fv, fu, 'kgf'), 3)], ['lbf', Fmt.num(Quality.convertForce(fv, fu, 'lbf'), 3)], [T('Presión', 'Pressure'), Fmt.num(Quality.pressure(N, UI.v('b2fD')), 1) + ' kPa', T('fuerza / área del émbolo', 'force / plunger area')]]);
  const wl = Quality.weightLoss(UI.v('b2wI'), UI.v('b2wF')), d = UI.v('b2wD');
  statTiles('b2wOut', [[T('Pérdida de peso', 'Weight loss'), Fmt.num(wl, 2) + Fmt.pcs(), wl >= 5 ? T('cerca del límite en que muchos frutos se arrugan', 'near the limit at which many fruit shrivel') : '', wl >= 5 ? 'warn' : ''], [T('Por día', 'Per day'), d > 0 ? Fmt.num(wl / d, 3) + Fmt.pcs() + ' d⁻¹' : '—']]);
}

/* ---------------- 4. scales ---------------- */
const SCALES = {
  damage: [[0, 'Sano', 'Sound'], [1, 'Leve (< 5 % de la superficie)', 'Slight (< 5% of the surface)'], [2, 'Moderado (5–15 %)', 'Moderate (5–15%)'], [3, 'Severo (15–30 %)', 'Severe (15–30%)'], [4, 'Muy severo (> 30 %)', 'Very severe (> 30%)']],
  ripe: [[1, 'Verde maduro', 'Mature green'], [2, 'Rayado', 'Breaker'], [3, 'Pintón', 'Turning'], [4, 'Maduro', 'Ripe'], [5, 'Sobremaduro', 'Overripe']],
  decay: [[0, 'Sin pudrición', 'No decay'], [1, 'Lesión incipiente', 'Incipient lesion'], [2, 'Lesión visible', 'Visible lesion'], [3, 'Fruto podrido', 'Rotten fruit']],
};
let scaleTable;
const scaleClasses = () => scaleTable.get().filter(r => r.value !== '' && r.value != null && isFinite(r.value)).map(r => ({ value: +r.value, label: r.label })).sort((a, b) => a.value - b.value);
function paintTolerance() {
  const cl = scaleClasses(), sel = el('b2sTol'), prev = sel.value;
  sel.innerHTML = cl.map(c => `<option value="${c.value}">${esc(c.value + ' · ' + c.label)}</option>`).join('');
  sel.value = cl.some(c => String(c.value) === prev) ? prev : (cl[1] ? String(cl[1].value) : String(cl[0] ? cl[0].value : ''));
}
function scaleRun(groupsData) {
  /* groupsData: [{name, counts}] */
  const cl = scaleClasses(), tol = +el('b2sTol').value;
  const all = groupsData.map(gd => Object.assign({ name: gd.name }, Quality.scaleIndex(cl, gd.counts, tol), { counts: gd.counts }));
  /* a lot without a single grade inside the classes has no index: it is left out, and said */
  const res = all.filter(r => r.N > 0), empty = all.filter(r => !(r.N > 0));
  if (empty.length) showMessage('b2gMsg', 'warn', L2(`${empty.length === 1 ? 'Un lote no tiene' : empty.length + ' lotes no tienen'} ninguna calificación dentro de las clases de la escala y se ${empty.length === 1 ? 'deja' : 'dejan'} fuera: ${empty.map(r => esc(r.name)).join(', ')}.`, `${empty.length === 1 ? 'One lot has' : empty.length + ' lots have'} no grade within the classes of the scale and ${empty.length === 1 ? 'is' : 'are'} left out: ${empty.map(r => esc(r.name)).join(', ')}.`));
  if (!res.length || !cl.length) {
    S.g = null;
    el('b2gOut').hidden = true;
    delete Report.sections['quality:scale'];
    blockDone('quality');
    if (!cl.length) showMessage('b2gMsg', 'warn', T('La escala necesita al menos una clase con su valor.', 'The scale needs at least one class with its value.'));
    return;
  }
  S.g = { res, cl, tol };
  el('b2gOut').hidden = false;
  const best = res.slice().sort((a, b) => b.marketable - a.marketable)[0], worst = res.slice().sort((a, b) => b.index - a.index)[0];
  /* the index is 100·Σ(value × count) / (N × highest value): everything in the lowest
     class gives 100 × lowest / highest, which is 0 only when the scale starts at 0 */
  const vmin = cl[0].value, vmax = cl[cl.length - 1].value, lo = vmax > 0 ? 100 * vmin / vmax : NaN;
  const loTxt = Fmt.num(lo, Math.abs(lo - Math.round(lo)) < 1e-9 ? 0 : 1);
  statTiles('b2gTiles', [[T('Lotes o grupos', 'Lots or groups'), res.length], [T('Unidades evaluadas', 'Units rated'), res.reduce((s, r) => s + r.N, 0)], [T('Mayor índice', 'Highest index'), Fmt.num(worst.index, 1), esc(worst.name), 'warn'], [T('Más comercializable', 'Most marketable'), Fmt.pct(best.marketable), esc(best.name), 'good']]);
  el('b2gRead').innerHTML = `<div class="reading"><p>${L2(`El índice ponderado (McKinney 1923) va de ${loTxt} (todo en la clase más baja, la ${vmin}) a 100 (todo en la más alta, la ${vmax}). <b>${esc(worst.name)}</b> tiene el mayor (${Fmt.num(worst.index, 1)}); con la tolerancia en la clase ${tol}, la fruta comercializable va de ${Fmt.pct(Math.min(...res.map(r => r.marketable)))} a ${Fmt.pct(Math.max(...res.map(r => r.marketable)))}.`, `The weighted index (McKinney 1923) runs from ${loTxt} (everything in the lowest class, ${vmin}) to 100 (everything in the highest, ${vmax}). <b>${esc(worst.name)}</b> has the highest (${Fmt.num(worst.index, 1)}); with the tolerance at class ${tol}, marketable fruit runs from ${Fmt.pct(Math.min(...res.map(r => r.marketable)))} to ${Fmt.pct(Math.max(...res.map(r => r.marketable)))}.`)}</p></div>`;
  el('b2gFig').innerHTML = '';
  Fig.put('b2gFig', Plot.bars({ name: 'b2-escala', cats: res.map(r => r.name), groups: cl.map(c => c.value + ' · ' + c.label), values: cl.map((c, j) => res.map(r => r.pct[j])), stacked: true, ylab: T('% de las unidades', '% of the units'), horizontal: res.length > 6, legendTitle: T('Clase', 'Class'),
    colors: cl.map((c, j) => ['#6B9E2F', '#C4C23A', '#F2A51C', '#EF6C00', '#C8461A', '#7A2E10', '#4A2010'][Math.round(j * 6 / Math.max(1, cl.length - 1))]) }),
  { name: 'b2-escala', title: L2('Distribución por clase', 'Distribution by class'), block: 2, data: { header: ['grupo'].concat(cl.map(c => 'clase_' + c.value)), rows: res.map(r => [r.name].concat(r.pct)) } });
  el('b2gFig2').innerHTML = '';
  if (S.gTimes) {
    Fig.put('b2gFig2', Plot.lines({ name: 'b2-indice', series: S.gTimes.groups.map(gq => { const rr = S.gTimes.rows.filter(r => r.group === gq && res.some(q => q.name === r.name)); return { name: gq, x: rr.map(r => +r.time), y: rr.map(r => res.find(q => q.name === r.name).index) }; }), xlab: S.gTimes.keyT, ylab: T('Índice ponderado', 'Weighted index'), yZero: true }), { name: 'b2-indice', title: L2('Índice ponderado en el tiempo', 'Weighted index over time'), block: 2 });
  }
  buildTable('b2gTab', [{ key: 'name', label: L2('Grupo', 'Group') }, { key: 'N', label: 'N', num: true }].concat(cl.map((c, j) => ({ key: 'c' + j, label: esc(String(c.value)), num: true, get: r => Fmt.pct(r.pct[j]) }))).concat([
    { key: 'index', label: L2('Índice', 'Index'), num: true, fmt: v => Fmt.num(v, 1) }, { key: 'meanGrade', label: L2('Grado medio', 'Mean grade'), num: true, fmt: v => Fmt.num(v, 2) },
    { key: 'incidence', label: L2('Incidencia', 'Incidence'), num: true, fmt: v => Fmt.pct(v) }, { key: 'marketable', label: L2('Comercializable', 'Marketable'), num: true, fmt: v => Fmt.pct(v) }]), res, { csvName: T('escala_indices', 'scale_indices') });
  el('b2gCite').innerHTML = '';
  citeMethod('b2gCite', [['Índice ponderado: ', 'Weighted index: '].map(x => x + Refs.short('mckinney1923'))]);
  state.quality = Object.assign(state.quality || {}, { scale: { n: res.length } });
  Report.set('quality:scale', { order: 22, title: ['Escala de madurez o daño', 'Ripeness or damage scale'], html: () => el('b2gRead').innerHTML + reportFig('b2-escala') + reportTable('b2gTab') });
}
function scaleFromData(D) {
  const m = D.map, cl = scaleClasses();
  const keyG = m.group || null, keyT = m.time || null;
  const rows = D.rows.filter(r => r[m.grade] != null && isFinite(r[m.grade]));
  const groups = keyG ? Trial.levelsOf(rows, keyG) : [T('Todos', 'All')];
  const times = keyT ? [...new Set(rows.map(r => r[keyT]))].sort((a, b) => a - b) : [null];
  const out = [], tl = [];
  groups.forEach(gq => times.forEach(tq => {
    const sub = rows.filter(r => (!keyG || String(r[keyG]) === gq) && (!keyT || r[keyT] === tq));
    if (!sub.length) return;
    const name = (keyG ? gq : '') + (keyT ? (keyG ? ' · ' : '') + keyT + ' ' + tq : '');
    out.push({ name, counts: cl.map(c => sub.filter(r => +r[m.grade] === c.value).length) });
    tl.push({ name, group: gq, time: tq });
  }));
  const unknown = rows.filter(r => !cl.some(c => c.value === +r[m.grade])).length;
  clearMessages('b2gMsg');
  if (unknown) showMessage('b2gMsg', 'warn', L2(`${unknown} calificaciones no corresponden a ninguna clase de la escala y no se cuentan.`, `${unknown} grades match no class of the scale and are not counted.`));
  S.gTimes = keyT && keyG ? { groups, rows: tl, keyT } : null;
  S.gSrc = 'data';
  if (!rows.length) showMessage('b2gMsg', 'warn', T('La columna de la clase no tiene ningún número.', 'The class column has no number at all.'));
  scaleRun(out);
}
function scaleFromText() {
  const cl = scaleClasses();
  const lines = UI.s('b2gCounts').split('\n').map(l => l.trim()).filter(Boolean);
  const out = lines.map((l, i) => {
    const k = l.indexOf(':');
    const name = k > 0 ? l.slice(0, k).trim() : T('Lote ', 'Lot ') + (i + 1);
    const nums = (k > 0 ? l.slice(k + 1) : l).split(/[,;\t ]+/).filter(Boolean).map(Number);
    return { name, counts: cl.map((_, j) => nums[j] || 0) };
  });
  clearMessages('b2gMsg');
  if (!out.length) { showMessage('b2gMsg', 'warn', T('Escribe al menos un lote.', 'Write at least one lot.')); return; }
  S.gTimes = null;
  S.gSrc = 'text';
  scaleRun(out);
}
/* the scale changed (a template, a class edited or the tolerance): the same data again */
function rescale() {
  if (S.gSrc === 'text') scaleFromText();
  else if (S.gSrc === 'data') { const gi = DataIn.registry.b2g; if (gi && gi.get()) gi.refire(); }
}

/* ---------------- 5. size grades ---------------- */
let calTable;
const CALS = {
  weight: [[['Pequeño', 'Small'], 0, 200], [['Mediano', 'Medium'], 200, 280], [['Grande', 'Large'], 280, 360], [['Extra grande', 'Extra large'], 360, 600]],
  diam: [['< 57 mm', 0, 57], ['57–67 mm', 57, 67], ['67–77 mm', 67, 77], ['77–87 mm', 77, 87], ['> 87 mm', 87, 150]],
};
/* the classes of each kind, named in the active language (or in lang) */
function calRows(kind, lang) {
  const t = (es, en) => ((lang || I18N.lang) === 'en' ? en : es);
  if (kind === 'count') return Quality.countClasses(4, [8, 10, 12, 14, 16, 18, 20]).map(c => ({ name: t('Calibre ', 'Count ') + c.name, min: c.min, max: c.max }));
  return CALS[kind].map(c => ({ name: Array.isArray(c[0]) ? t(c[0][0], c[0][1]) : c[0], min: c[1], max: c[2] }));
}
/* on a change of language, classes still named as the app named them follow the language; names the
   user wrote stay as they are */
function calLang() {
  if (!calTable) return;
  const cur = calTable.get(), other = I18N.lang === 'en' ? 'es' : 'en';
  ['weight', 'count'].forEach(kind => {
    const old = calRows(kind, other), now = calRows(kind);
    if (cur.length !== old.length || !cur.every((r, i) => r.name === old[i].name)) return;
    const was = Object.assign({}, state.touched);
    calTable.set(cur.map((r, i) => Object.assign({}, r, { name: now[i].name })));
    Object.keys(state.touched).forEach(key => { if (!was[key]) delete state.touched[key]; });
  });
}
function calRun(D) {
  const m = D.map;
  const cls = calTable.get().filter(c => isFinite(c.min) && isFinite(c.max) && c.max > c.min).sort((a, b) => a.min - b.min);
  const keyG = m.group || null;
  const groups = keyG ? Trial.levelsOf(D.rows, keyG) : [T('Todos', 'All')];
  const res = groups.map(gq => Object.assign({ name: gq }, Quality.calibre(D.rows.filter(r => !keyG || String(r[keyG]) === gq).map(r => r[m.value]), cls)));
  S.k = { res, cls };
  el('b2kOut').hidden = false;
  const all = Quality.calibre(D.rows.map(r => r[m.value]), cls);
  /* no fruit inside the classes: a warning, not «0.0 % … the most frequent» (a unit or limits that do not match the data) */
  const inside = all.N - all.out, xs = D.rows.map(r => r[m.value]).filter(v => v != null && v !== '' && isFinite(v)).map(Number);
  statTiles('b2kTiles', [[T('Frutos', 'Fruit'), all.N], [T('Media', 'Mean'), Fmt.num(all.mean, 1), T('DE ', 'SD ') + Fmt.num(all.sd, 1)], [T('Calibre más frecuente', 'Most frequent grade'), esc(all.mode || '—')], [T('Fuera de las clases', 'Outside the classes'), all.out, all.out ? T('revisa los límites', 'check the limits') : '', all.out ? 'warn' : '']]);
  el('b2kRead').innerHTML = '';
  el('b2kFig').innerHTML = '';
  if (!inside) {
    showMessage('b2kRead', 'warn', all.N
      ? L2(`Ningún fruto cae dentro de las clases: los datos van de ${Fmt.num(Math.min(...xs))} a ${Fmt.num(Math.max(...xs))} y las clases de ${Fmt.num(cls.length ? cls[0].min : NaN)} a ${Fmt.num(cls.length ? Math.max(...cls.map(c => +c.max)) : NaN)}. Revisa los límites y la unidad (peso o diámetro).`, `No fruit falls inside the classes: the data run from ${Fmt.num(Math.min(...xs))} to ${Fmt.num(Math.max(...xs))} and the classes from ${Fmt.num(cls.length ? cls[0].min : NaN)} to ${Fmt.num(cls.length ? Math.max(...cls.map(c => +c.max)) : NaN)}. Check the limits and the unit (weight or diameter).`)
      : T('La columna elegida no tiene ningún número.', 'The chosen column has no number at all.'));
  } else {
    el('b2kRead').innerHTML = `<div class="reading"><p>${L2(`El ${Fmt.pct(Math.max(...all.pct))} de los frutos cae en <b>${esc(all.mode)}</b>.`, `${Fmt.pct(Math.max(...all.pct))} of the fruit fall in <b>${esc(all.mode)}</b>.`)} ${cls.map((c, j) => esc(c.name) + ' ' + Fmt.pct(all.pct[j])).join(' · ')}${all.out ? L2(` · fuera de las clases ${Fmt.pct(100 * all.out / all.N)}`, ` · outside the classes ${Fmt.pct(100 * all.out / all.N)}`) : ''}</p></div>`;
    Fig.put('b2kFig', Plot.bars({ name: 'b2-calibres', cats: cls.map(c => c.name), groups: keyG ? groups.map(gq => keyG + ' ' + gq) : null, values: keyG ? res.map(r => r.pct) : [all.pct], ylab: T('% de los frutos', '% of the fruit'), valueLabels: keyG ? null : v => Fmt.num(v, 1) }),
      { name: 'b2-calibres', title: L2('Distribución por calibre', 'Distribution by grade'), block: 2, data: { header: ['calibre'].concat(keyG ? groups : ['todos']), rows: cls.map((c, j) => [c.name].concat(keyG ? res.map(r => r.pct[j]) : [all.pct[j]])) } });
  }
  buildTable('b2kTab', [{ key: 'name', label: L2('Grupo', 'Group') }, { key: 'N', label: 'N', num: true }].concat(cls.map((c, j) => ({ key: 'k' + j, label: esc(c.name), num: true, get: r => r.counts[j] + ' (' + Fmt.pct(r.pct[j]) + ')' }))).concat([{ key: 'mean', label: L2('Media', 'Mean'), num: true, fmt: v => Fmt.num(v, 1) }, { key: 'out', label: L2('Fuera', 'Outside'), num: true }]), res, { csvName: T('calibres', 'size_grades') });
  el('b2kCite').innerHTML = '';
  citeMethod('b2kCite', [['Clases editables; las plantillas son orientativas (' + Refs.short('kader2002') + ').', 'Editable classes; the templates are orientative (' + Refs.short('kader2002') + ').']]);
  state.quality = Object.assign(state.quality || {}, { calibre: { n: all.N } });
  Report.set('quality:calibre', { order: 23, title: ['Calibres', 'Size grades'], html: () => el('b2kRead').innerHTML + reportFig('b2-calibres') + reportTable('b2kTab') });
}

const reportFig = n => PHRep.fig(n), reportTable = id => PHRep.table(id);

/* ---------------- start ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const P = el('panel-2');
  P.innerHTML = UI.panel(2, 'Calidad y madurez', 'Quality and maturity', 'Índices de calidad, color CIELAB, calculadoras de laboratorio, escalas y calibres', 'Quality indices, CIELAB color, laboratory calculators, scales and size grades', tools);
  if (window.I18N) I18N.apply(P);
  const isVar = (c, rows, used) => !used.includes(c) && Table.numeric(rows, c) && !NOT_VARS.includes(norm(c)) && !['l', 'a', 'b', 'sst', 'at'].includes(norm(c));
  const q = DataIn.mount('b2qIn', {
    id: 'b2q',
    roles: [
      { key: 'group', es: 'Grupo', en: 'Group', optional: true, match: GROUP_M },
      { key: 'time', es: 'Tiempo', en: 'Time', optional: true, match: TIME_M },
      { key: 'sst', es: 'Sólidos solubles (°Brix)', en: 'Soluble solids (°Brix)', optional: true, match: ['sst', 'ssc', 'brix', 'solidos'] },
      { key: 'at', es: 'Acidez titulable (%)', en: 'Titratable acidity (%)', optional: true, match: ['at', 'ta', 'acidez', 'acidity'] },
      { key: 'L', es: 'L*', en: 'L*', optional: true, match: ['l', 'lstar'] },
      { key: 'a', es: 'a*', en: 'a*', optional: true, match: ['a', 'astar'] },
      { key: 'b', es: 'b*', en: 'b*', optional: true, match: ['b', 'bstar'] },
      { key: 'vars', es: 'Atributos para resumir', en: 'Attributes to summarize', multi: true, auto: (cols, rows, used) => cols.filter(c => isVar(c, rows, used)) },
    ],
    examples: [{ id: 'mango' }],
    onData: qualityRun,
  });
  window.PHLoad.b2q = () => q.load(0);
  el('b2qShow').addEventListener('change', qualityPaint);
  el('b2qVar').addEventListener('change', qualityPaint);
  /* color */
  [['b2cL', 'lab'], ['b2cA', 'lab'], ['b2cB', 'lab'], ['b2cR', 'rgb'], ['b2cG', 'rgb'], ['b2cBl', 'rgb'], ['b2cHex', 'hex'], ['b2cPick', 'pick']].forEach(([id, k]) => el(id).addEventListener('input', () => colorFrom(k)));
  ['b2d1L', 'b2d1A', 'b2d1B', 'b2d2L', 'b2d2A', 'b2d2B'].forEach(id => el(id).addEventListener('input', deltaPaint));
  el('b2dUse').addEventListener('click', () => { el('b2d2L').value = el('b2cL').value; el('b2d2A').value = el('b2cA').value; el('b2d2B').value = el('b2cB').value; deltaPaint(); });
  colorFrom('lab'); deltaPaint();
  const c = DataIn.mount('b2cIn', {
    id: 'b2c',
    roles: [
      { key: 'group', es: 'Grupo', en: 'Group', optional: true, match: GROUP_M },
      { key: 'time', es: 'Tiempo', en: 'Time', optional: true, match: TIME_M },
      { key: 'L', es: 'L*', en: 'L*', match: ['l', 'lstar'], type: 'num' },
      { key: 'a', es: 'a*', en: 'a*', match: ['a', 'astar'], type: 'num' },
      { key: 'b', es: 'b*', en: 'b*', match: ['b', 'bstar'], type: 'num' },
    ],
    examples: [{ id: 'mango' }],
    onData: colorDataRun,
  });
  window.PHLoad.b2c = () => c.load(0);
  /* calculators */
  ['b2aV', 'b2aN', 'b2aM', 'b2aTot', 'b2aAli', 'b2aAcid', 'b2aSSC', 'b2hT', 'b2hF', 'b2hD', 'b2fV', 'b2fU', 'b2fD', 'b2wI', 'b2wF', 'b2wD'].forEach(id => { el(id).addEventListener('input', calcPaint); el(id).addEventListener('change', calcPaint); });
  calcPaint();
  /* scales */
  scaleTable = EditTable.mount('b2sTable', {
    id: 'b2scale',
    columns: [{ key: 'value', es: 'Valor', en: 'Value', type: 'num', width: 70 }, { key: 'label', es: 'Descripción', en: 'Description', type: 'text', width: 260 }],
    rows: SCALES.damage.map(r => ({ value: r[0], label: T(r[1], r[2]) })),
    blank: rows => ({ value: rows.length, label: '' }),
    onChange: () => { paintTolerance(); rescale(); },
  });
  paintTolerance();
  P.querySelector('[data-scale]').parentElement.addEventListener('click', e => {
    const b = e.target.closest('[data-scale]');
    if (b) { scaleTable.set(SCALES[b.dataset.scale].map(r => ({ value: r[0], label: T(r[1], r[2]) }))); }
  });
  const g = DataIn.mount('b2gIn', {
    id: 'b2g',
    roles: [
      { key: 'grade', es: 'Clase de cada fruto', en: 'Class of each fruit', match: ['antracnosis', 'dano', 'daño', 'clase', 'grado', 'escala', 'pudricion', 'madurez', 'damage', 'grade', 'class'], type: 'num' },
      { key: 'group', es: 'Grupo', en: 'Group', optional: true, match: GROUP_M },
      { key: 'time', es: 'Tiempo', en: 'Time', optional: true, match: TIME_M },
    ],
    examples: [{ id: 'mango' }],
    onData: scaleFromData,
  });
  window.PHLoad.b2g = () => g.load(0);
  el('b2gUse').addEventListener('click', scaleFromText);
  el('b2sTol').addEventListener('change', rescale);
  /* size grades */
  calTable = EditTable.mount('b2kTable', {
    id: 'b2cal',
    columns: [{ key: 'name', es: 'Calibre', en: 'Grade', type: 'text', width: 140 }, { key: 'min', es: 'Mínimo', en: 'Minimum', type: 'num' }, { key: 'max', es: 'Máximo', en: 'Maximum', type: 'num' }],
    rows: calRows('weight'),
    blank: () => ({ name: '', min: null, max: null }),
    onChange: () => { const k = DataIn.registry.b2k; if (k && k.get()) k.refire(); },
  });
  P.querySelector('[data-cal]').parentElement.addEventListener('click', e => { const b = e.target.closest('[data-cal]'); if (b) calTable.set(calRows(b.dataset.cal)); });
  const k = DataIn.mount('b2kIn', {
    id: 'b2k',
    roles: [
      { key: 'value', es: 'Peso o diámetro de cada fruto', en: 'Weight or diameter of each fruit', match: ['peso_inicial_g', 'peso', 'masa', 'diametro', 'weight', 'mass', 'diameter'], type: 'num' },
      { key: 'group', es: 'Grupo', en: 'Group', optional: true, match: ['lote', 'variedad', 'cultivar', 'lot', 'origen'] },
    ],
    examples: [{ id: 'mango' }],
    onData: calRun,
  });
  window.PHLoad.b2k = () => k.load(0);
});
document.addEventListener('langchange', () => { if (S.q) qualityPaint(); calcPaint(); colorFrom('lab'); deltaPaint(); calLang(); });
})();
