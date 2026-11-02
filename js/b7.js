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

/* PostHarvestPro — Block 7, postharvest trials: the treatment × storage time
   factorial (destructive sampling), repeated measures on the same units,
   slopes over time by treatment, and the randomization of the trial with a
   field book the suite's experimental-design app reads back. */
(function () {
'use strict';
const S = {};
const MC = [['tukey', 'Tukey (HSD)', 'Tukey (HSD)'], ['lsd', 'LSD de Fisher', 'Fisher\'s LSD'], ['bonferroni', 'Bonferroni', 'Bonferroni'], ['dunnett', 'Dunnett (contra el testigo)', 'Dunnett (against the control)']];
const TRT_M = ['tratamiento', 'treatment', 'temperatura', 'temperature', 'recubrimiento', 'trt', 'grupo'];
const TIME_M = ['dia', 'dias', 'tiempo', 'day', 'days', 'time', 'semana', 'week'];
const opts = id => `<div class="form-grid tight">${UI.sel(id + 'MC', 'Comparación de medias', 'Mean comparison', MC, 'tukey')}${UI.sel(id + 'Ctl', 'Testigo (Dunnett)', 'Control (Dunnett)', [], '')}${UI.sel(id + 'A', 'α', 'α', [['0.05', '0.05', '0.05'], ['0.01', '0.01', '0.01'], ['0.1', '0.10', '0.10']], '0.05')}</div>`;
const tools = [
  { id: 'factorial', es: 'Factorial tratamiento × tiempo', en: 'Treatment × time factorial', html: `
    <div class="card"><h2>${L2('Muestreo destructivo', 'Destructive sampling')}</h2><p class="hint">${L2('Cada tiempo de muestreo usa frutos distintos (se destruyen al medirlos): el ensayo es un factorial tratamiento × tiempo, completamente al azar o en bloques.', 'Each sampling time uses different fruit (destroyed when measured): the trial is a treatment × time factorial, completely randomized or in blocks.')}</p>
      <div id="b7fIn"></div><div class="form-grid tight">${UI.sel('b7fSS', 'Sumas de cuadrados', 'Sums of squares', [['3', 'Tipo III (cada efecto al final)', 'Type III (each effect last)'], ['1', 'Tipo I (secuenciales)', 'Type I (sequential)']], '3')}</div>${UI.check('b7fCommon', 'Usar sólo los tiempos medidos en todos los tratamientos', 'Use only the times measured in every treatment', true)}${opts('b7f')}</div>
    <div id="b7fOut" hidden><div class="card"><h2>${L2('Análisis de varianza', 'Analysis of variance')}</h2><div id="b7fWarn"></div><div id="b7fTiles"></div><div id="b7fRead"></div><div id="b7fAnova"></div><div id="b7fFig"></div><h3>${L2('Tratamientos dentro de cada tiempo', 'Treatments within each time')}</h3><div id="b7fMeans"></div><div id="b7fCite"></div></div></div>` },
  { id: 'repetidas', es: 'Medidas repetidas', en: 'Repeated measures', html: `
    <div class="card"><h2>${L2('Los mismos frutos a lo largo del tiempo', 'The same fruit over time')}</h2><p class="hint">${L2('Peso, color u otra medida no destructiva tomada en los mismos frutos (unidades) en cada tiempo: parcelas divididas en el tiempo, con la corrección de los grados de libertad cuando las mediciones de una unidad no tienen la misma correlación entre sí.', 'Weight, color or another non-destructive measure taken on the same fruit (units) at each time: a split plot in time, with the correction of the degrees of freedom when the measurements of a unit are not equally correlated.')}</p>
      <div id="b7rIn"></div>${opts('b7r')}</div>
    <div id="b7rOut" hidden><div class="card"><h2>${L2('Parcelas divididas en el tiempo', 'Split plot in time')}</h2><div id="b7rTiles"></div><div id="b7rRead"></div><div id="b7rAnova"></div><div id="b7rFig"></div><h3>${L2('Tratamientos dentro de cada tiempo', 'Treatments within each time')}</h3><div id="b7rMeans"></div><div id="b7rCite"></div></div></div>` },
  { id: 'pendientes', es: 'Pendientes', en: 'Slopes', html: `
    <div class="card"><h2>${L2('Velocidad de cambio por tratamiento', 'Rate of change by treatment')}</h2><p class="hint">${L2('Una recta del atributo contra el tiempo para cada tratamiento y la prueba de si las pendientes (las velocidades) son iguales: análisis de covarianza.', 'A straight line of the attribute against time for each treatment and the test of whether the slopes (the rates) are equal: analysis of covariance.')}</p><div id="b7pIn"></div></div>
    <div id="b7pOut" hidden><div class="card"><h2>${L2('Rectas y comparación de pendientes', 'Lines and comparison of slopes')}</h2><div id="b7pTiles"></div><div id="b7pRead"></div><div id="b7pFig"></div><div id="b7pTab"></div><div id="b7pPairs"></div><div id="b7pCite"></div></div></div>` },
  { id: 'aleatorizacion', es: 'Aleatorización', en: 'Randomization', html: `
    <div class="card"><h2>${L2('Libro de campo del ensayo', 'Field book of the trial')}</h2><p class="hint">${L2('Genera la asignación al azar de los tratamientos (y de los tiempos de muestreo) a las unidades, con una semilla para repetirla. Las columnas llevan los nombres que el bloque de datos del programa de diseño experimental de la suite reconoce.', 'Generates the random assignment of treatments (and sampling times) to the units, with a seed to repeat it. The columns carry the names the data block of the suite\'s experimental-design app recognizes.')}</p>
      <div class="form-grid tight b7a-grid">${UI.text('b7aT', 'Tratamientos (separados por coma)', 'Treatments (comma separated)', 'Testigo, Cera vegetal, Quitosano')}${UI.text('b7aTi', 'Tiempos de muestreo', 'Sampling times', '0, 5, 10, 15, 20')}${UI.num('b7aR', 'Repeticiones', 'Replicates', 4, { min: 1, step: 1 })}${UI.sel('b7aD', 'Diseño', 'Design', [['crd', 'Completamente al azar', 'Completely randomized'], ['rcbd', 'Bloques completos al azar', 'Randomized complete blocks']], 'crd')}${UI.num('b7aS', 'Semilla', 'Seed', 2026, { step: 1 })}${UI.text('b7aY', 'Variables a medir', 'Variables to measure', 'firmeza_N, perdida_peso, sst')}</div>
      ${UI.check('b7aRep', 'Medidas repetidas: la misma unidad se mide en todos los tiempos', 'Repeated measures: the same unit is measured at every time', false)}
      <div class="btn-row"><button type="button" class="btn btn-primary btn-sm" id="b7aGo">${L2('Generar', 'Generate')}</button><button type="button" class="btn btn-secondary btn-sm" id="b7aCSV" disabled>⤓ CSV</button><button type="button" class="btn btn-secondary btn-sm" id="b7aXLSX" disabled>⤓ XLSX</button><button type="button" class="btn btn-ghost btn-sm" id="b7aAgri">${L2('Abrir el programa de diseño experimental →', 'Open the experimental-design app →')}</button></div></div>
    <div class="card" id="b7aOut" hidden><h2>${L2('Libro de campo', 'Field book')}</h2><div id="b7aTiles"></div><div id="b7aTab"></div></div>` },
];

/* treatment levels in the control selector */
function paintControl(id, levels) {
  const sel = el(id + 'Ctl'), v = sel.value;
  sel.innerHTML = levels.map(l => `<option value="${esc(l)}">${esc(l)}</option>`).join('');
  const guess = levels.find(l => /testigo|control|check/i.test(l));
  sel.value = levels.includes(v) ? v : (guess || levels[0]);
}
/* an interval with 3 significant figures of its larger bound (as the k of Block 3) */
const ciSig = (lo, hi) => { const m = Math.max(Math.abs(lo), Math.abs(hi)); return Fmt.ci(lo, hi, isFinite(m) && m > 0 ? Math.min(8, Math.max(0, 2 - Math.floor(Math.log10(m)))) : 4); };
const cmpOpts = id => ({ method: UI.s(id + 'MC'), alpha: +UI.s(id + 'A'), control: UI.s(id + 'Ctl') });
/* the table of treatment means within each time, with their letters or the Dunnett stars */
function withinTable(host, slices, trts, o) {
  const cols = [{ key: 'time', label: L2('Tiempo', 'Time'), num: true }].concat(trts.map(tr => ({ key: tr, label: esc(tr), num: true, html: true, get: s => {
    const g = s.groups.find(x => x.name === tr);
    if (!g) return '—';
    let mark = '';
    if (s.cmp && s.cmp.letters) mark = s.cmp.letters[s.groups.indexOf(g)];
    else if (s.cmp && s.cmp.method === 'dunnett') { const p = s.cmp.pairs.find(q => q.a === tr); mark = p ? (p.sig ? '*' : '') : ''; }
    return Fmt.num(g.mean, 2) + ' <span class="letters">' + mark + '</span>';
  } })));
  buildTable(host, cols, slices, { csvName: T('medias_por_tiempo', 'means_by_time') });
  el(host).insertAdjacentHTML('beforeend', `<p class="hint">${o.method === 'dunnett' ? L2('* difiere del testigo (Dunnett, ', '* differs from the control (Dunnett, ') + 'α = ' + o.alpha + ').' : L2('En cada tiempo, tratamientos con la misma letra no difieren (', 'At each time, treatments sharing a letter do not differ (') + MC.find(m => m[0] === o.method)[1] + ', α = ' + o.alpha + ').'}</p>`);
}

/* ---------------- factorial ---------------- */
function factRun(D) {
  const m = D.map;
  let rows = D.rows.filter(r => r[m.y] != null && isFinite(r[m.y]) && r[m.trt] != null && r[m.time] != null);
  const trts = Trial.levelsOf(rows, m.trt);
  let dropped = [];
  if (UI.on('b7fCommon')) {
    const times = [...new Set(rows.map(r => String(r[m.time])))];
    const common = times.filter(t => trts.every(tr => rows.some(r => String(r[m.trt]) === tr && String(r[m.time]) === t)));
    dropped = times.filter(t => !common.includes(t));
    rows = rows.filter(r => common.includes(String(r[m.time])));
  }
  rows = rows.map(r => Object.assign({}, r, { [m.trt]: String(r[m.trt]), [m.time]: String(r[m.time]) }));
  const an = Trial.factorial(rows, { y: m.y, factors: [m.trt, m.time], block: m.block || null, type: +UI.s('b7fSS') });
  paintControl('b7f', an.LV[m.trt]);
  const o = cmpOpts('b7f');
  const ctlIdx = Math.max(0, an.LV[m.trt].indexOf(o.control));
  const slices = Trial.withinTime(an, { method: o.method, alpha: o.alpha, control: ctlIdx });
  /* times sorted as numbers when they are */
  const num = an.LV[m.time].every(t => isFinite(+t));
  if (num) slices.sort((a, b) => +a.time - +b.time);
  S.f = { an, slices, map: m, dropped };
  el('b7fOut').hidden = false;
  const R = s => an.table.find(r => r.source === s);
  const rT = R(m.trt), rTi = R(m.time), rI = R(m.trt + ':' + m.time);
  /* empty treatment × time cells (when not every time is kept): say what is lost */
  clearMessages('b7fWarn');
  if (an.empty.length) {
    const ec = an.empty.map(c => esc(c[0]) + ' × ' + esc(c[1])).join(', '), ne = an.empty.length;
    const lost = (an.LV[m.trt].length - 1) * (an.LV[m.time].length - 1) - (rI ? rI.df : 0);
    if (an.type === 3) showMessage('b7fWarn', 'warn', L2(`${ne === 1 ? 'Una combinación' : ne + ' combinaciones'} de ${esc(m.trt)} y ${esc(m.time)} no ${ne === 1 ? 'tiene' : 'tienen'} datos (${ec}). Con celdas vacías, las sumas de cuadrados del tipo III no pueden probar los efectos principales de ${esc(m.trt)} ni de ${esc(m.time)}: cada uno se promediaría sobre celdas que no existen, así que esas filas quedan sin gl, SC, CM, F ni p. La interacción (con menos grados de libertad) y las comparaciones dentro de cada tiempo siguen siendo válidas.`,
      `${ne === 1 ? 'One combination' : ne + ' combinations'} of ${esc(m.trt)} and ${esc(m.time)} ${ne === 1 ? 'has' : 'have'} no data (${ec}). With empty cells, type III sums of squares cannot test the main effects of ${esc(m.trt)} and ${esc(m.time)}: each would be averaged over cells that do not exist, so those rows are left without df, SS, MS, F or p. The interaction (with fewer degrees of freedom) and the comparisons within each time remain valid.`),
      L2('Para probar los efectos principales, vuelve a marcar «Usar sólo los tiempos medidos en todos los tratamientos» o elige el tipo I.', 'To test the main effects, tick «Use only the times measured in every treatment» again or choose type I.'));
    else showMessage('b7fWarn', 'info', L2(`${ne === 1 ? 'Una combinación' : ne + ' combinaciones'} de ${esc(m.trt)} y ${esc(m.time)} no ${ne === 1 ? 'tiene' : 'tienen'} datos (${ec}). Con el tipo I cada efecto se prueba en orden (${esc(m.time)} ajustado por ${esc(m.trt)}) y la interacción pierde ${lost} grado${lost === 1 ? '' : 's'} de libertad.`,
      `${ne === 1 ? 'One combination' : ne + ' combinations'} of ${esc(m.trt)} and ${esc(m.time)} ${ne === 1 ? 'has' : 'have'} no data (${ec}). With type I each effect is tested in order (${esc(m.time)} adjusted for ${esc(m.trt)}) and the interaction loses ${lost} degree${lost === 1 ? '' : 's'} of freedom.`));
  }
  const fTile = (lab, r, lev) => (r.estimable === false ? [lab, 'F = —', T('no estimable (celdas vacías)', 'not estimable (empty cells)'), 'warn'] : [lab, 'F = ' + Fmt.num(r.F, 2), Fmt.pEq(r.p), r.p < 0.05 ? lev : '']);
  statTiles('b7fTiles', [
    fTile(T('Tratamiento', 'Treatment'), rT, 'hi'),
    fTile(T('Tiempo', 'Time'), rTi, 'hi'),
    rI ? [T('Interacción', 'Interaction'), 'F = ' + Fmt.num(rI.F, 2), Fmt.pEq(rI.p), rI.p < 0.05 ? 'warn' : ''] : null,
    ['CV', Fmt.pct(an.cv)], ['R²', Fmt.num(an.r2, 3)],
  ]);
  el('b7fRead').innerHTML = `<div class="reading"><p>${rI && rI.p < 0.05 ? L2(`La <b>interacción es significativa</b> (${Fmt.pEq(rI.p)}): el efecto de ${esc(m.trt)} cambia con el tiempo de almacenamiento, así que los tratamientos se comparan dentro de cada tiempo (tabla de abajo) y no con sus promedios generales.`, `The <b>interaction is significant</b> (${Fmt.pEq(rI.p)}): the effect of ${esc(m.trt)} changes with storage time, so treatments are compared within each time (table below), not by their overall averages.`) : L2(`La interacción no es significativa${rI ? ' (' + Fmt.pEq(rI.p) + ')' : ''}: el efecto de ${esc(m.trt)} es parecido en todos los tiempos y puede resumirse con sus promedios.`, `The interaction is not significant${rI ? ' (' + Fmt.pEq(rI.p) + ')' : ''}: the effect of ${esc(m.trt)} is similar at every time and can be summarized by its averages.`)} ${L2(`El coeficiente de variación es ${Fmt.pct(an.cv)}.`, `The coefficient of variation is ${Fmt.pct(an.cv)}.`)}</p>${dropped.length ? `<p class="hint">${L2('Se dejaron fuera los tiempos que no tienen todos los tratamientos: ', 'Times lacking some treatment were left out: ') + dropped.map(esc).join(', ')}.</p>` : ''}</div>`;
  const name = s => ({ residual: T('Error', 'Error'), total: T('Total', 'Total') }[s] || s);
  buildTable('b7fAnova', [{ key: 'source', label: L2('Fuente', 'Source'), get: r => name(r.source) }, { key: 'df', label: L2('gl', 'df'), num: true, fmt: v => (isFinite(v) ? v : '—') }, { key: 'ss', label: L2('SC', 'SS'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'ms', label: L2('CM', 'MS'), num: true, fmt: v => Fmt.num(v, 3) }, { key: 'F', label: 'F', num: true, get: r => (r.estimable === false ? T('no estimable', 'not estimable') : r.F), fmt: v => (typeof v === 'number' ? Fmt.num(v, 2) : v) }, { key: 'p', label: 'p', num: true, fmt: Fmt.p }], an.table, { csvName: T('anova_factorial', 'factorial_anova') });
  const cells = an.cells.cells;
  el('b7fFig').innerHTML = '';
  Fig.put('b7fFig', Plot.lines({ name: 'b7-factorial', series: an.LV[m.trt].map(tr => { const cs = cells.filter(c => String(c[m.trt]) === tr).sort((a, b) => (num ? +a[m.time] - +b[m.time] : 0)); return { name: m.trt + ' ' + tr, x: cs.map(c => (num ? +c[m.time] : an.LV[m.time].indexOf(String(c[m.time])))), y: cs.map(c => c.mean), lo: cs.map(c => c.mean - c.se), hi: cs.map(c => c.mean + c.se) }; }), xlab: m.time, ylab: m.y }),
    { name: 'b7-factorial', title: L2('Evolución por tratamiento', 'Course by treatment'), caption: L2('Media ± error estándar de cada celda.', 'Mean ± standard error of each cell.'), block: 7 });
  withinTable('b7fMeans', slices, an.LV[m.trt], o);
  el('b7fCite').innerHTML = '';
  citeMethod('b7fCite', [Refs.short('steel1997'), 'Tukey–Kramer: ' + Refs.short('kramer1956') + '; ' + Refs.short('copenhaver1988'), 'Dunnett: ' + Refs.short('dunnett1955'), [T('Letras: ', 'Letters: ') + Refs.short('piepho2004'), 'Letters: ' + Refs.short('piepho2004')]]);
  state.trials = Object.assign(state.trials || {}, { factorial: { y: m.y } });
  Report.set('trials:factorial', { order: 70, title: ['Ensayo factorial', 'Factorial trial'], html: () => el('b7fWarn').innerHTML + el('b7fRead').innerHTML + PHRep.table('b7fAnova') + PHRep.fig('b7-factorial') + PHRep.table('b7fMeans') });
}

/* ---------------- repeated measures ---------------- */
function repRun(D) {
  const m = D.map;
  let rows = D.rows.filter(r => r[m.y] != null && isFinite(r[m.y]) && r[m.trt] != null && r[m.time] != null && r[m.unit] != null);
  /* times at which every unit has the same value (weight loss at day 0) carry no information */
  const times = [...new Set(rows.map(r => String(r[m.time])))];
  const flat = times.filter(t => { const v = rows.filter(r => String(r[m.time]) === t).map(r => +r[m.y]); return v.length > 1 && Math.max(...v) - Math.min(...v) < 1e-12; });
  rows = rows.filter(r => !flat.includes(String(r[m.time])));
  const an = Trial.repeated(rows, { y: m.y, treatment: m.trt, time: m.time, unit: m.unit, block: m.block || null });
  paintControl('b7r', an.treatments);
  const o = cmpOpts('b7r');
  const slices = Trial.withinTime(an, { method: o.method, alpha: o.alpha, control: Math.max(0, an.treatments.indexOf(o.control)) });
  if (an.times.every(t => isFinite(+t))) slices.sort((a, b) => +a.time - +b.time);
  S.r = { an, slices };
  el('b7rOut').hidden = false;
  const R = s => an.table.find(r => r.source === s);
  const rT = R('treatment'), rTi = R('time'), rI = R('treatment:time');
  const sph = an.sph;
  statTiles('b7rTiles', [
    [T('Tratamiento', 'Treatment'), 'F = ' + Fmt.num(rT.F, 2), Fmt.pEq(rT.p) + T(' (contra las unidades)', ' (against the units)'), rT.p < 0.05 ? 'hi' : ''],
    [T('Tiempo', 'Time'), 'F = ' + Fmt.num(rTi.F, 2), 'GG ' + Fmt.pEq(rTi.pGG), rTi.pGG < 0.05 ? 'hi' : ''],
    [T('Interacción', 'Interaction'), 'F = ' + Fmt.num(rI.F, 2), 'GG ' + Fmt.pEq(rI.pGG), rI.pGG < 0.05 ? 'warn' : ''],
    ['ε GG / HF', Fmt.num(sph.gg, 3) + ' / ' + Fmt.num(sph.hf, 3), 'Mauchly ' + Fmt.pEq(sph.p)],
    [T('Unidades', 'Units'), an.units, an.dropped ? an.dropped + T(' incompletas fuera', ' incomplete left out') : ''],
  ]);
  el('b7rRead').innerHTML = `<div class="reading"><p>${L2(`Las mediciones de una misma unidad están correlacionadas; la prueba de Mauchly ${sph.p < 0.05 ? '<b>rechaza la esfericidad</b>' : 'no rechaza la esfericidad'} (${Fmt.pEq(sph.p)}), así que conviene leer los valores p corregidos de Greenhouse–Geisser (ε = ${Fmt.num(sph.gg, 3)}) o de Huynh–Feldt. ${rI.pGG < 0.05 ? `La <b>interacción tratamiento × tiempo es significativa</b> (${Fmt.pEq(rI.pGG)}): los tratamientos cambian a velocidades distintas; compara sus pendientes en la pestaña «Pendientes».` : `La interacción no es significativa (${Fmt.pEq(rI.pGG)}).`}`, `Measurements on the same unit are correlated; Mauchly's test ${sph.p < 0.05 ? '<b>rejects sphericity</b>' : 'does not reject sphericity'} (${Fmt.pEq(sph.p)}), so read the Greenhouse–Geisser (ε = ${Fmt.num(sph.gg, 3)}) or Huynh–Feldt corrected p-values. ${rI.pGG < 0.05 ? `The <b>treatment × time interaction is significant</b> (${Fmt.pEq(rI.pGG)}): treatments change at different rates; compare their slopes in the «Slopes» tab.` : `The interaction is not significant (${Fmt.pEq(rI.pGG)}).`}`)}</p>${flat.length ? `<p class="hint">${L2('Se dejaron fuera los tiempos en que todas las unidades valen lo mismo (no aportan información): ', 'Times at which every unit has the same value were left out (they carry no information): ') + flat.map(esc).join(', ')}.</p>` : ''}</div>`;
  const name = s => ({ treatment: T('Tratamiento', 'Treatment'), errorA: T('Error a (unidades)', 'Error a (units)'), time: T('Tiempo', 'Time'), 'treatment:time': T('Tratamiento × tiempo', 'Treatment × time'), errorB: T('Error b', 'Error b'), block: T('Bloque', 'Block'), total: 'Total' }[s] || s);
  buildTable('b7rAnova', [{ key: 'source', label: L2('Fuente', 'Source'), get: r => name(r.source) }, { key: 'df', label: L2('gl', 'df'), num: true }, { key: 'ss', label: L2('SC', 'SS'), num: true, fmt: v => Fmt.num(v, 3) }, { key: 'ms', label: L2('CM', 'MS'), num: true, fmt: v => Fmt.num(v, 4) }, { key: 'F', label: 'F', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'p', label: 'p', num: true, fmt: Fmt.p }, { key: 'pGG', label: 'p (GG)', num: true, fmt: Fmt.p }, { key: 'pHF', label: 'p (HF)', num: true, fmt: Fmt.p }], an.table, { csvName: T('anova_medidas_repetidas', 'repeated_measures_anova') });
  el('b7rFig').innerHTML = '';
  const num = an.times.every(t => isFinite(+t));
  Fig.put('b7rFig', Plot.lines({ name: 'b7-repetidas', series: an.treatments.map(tr => { const cs = an.cells.cells.filter(c => c.trt === tr).sort((a, b) => +a.time - +b.time); return { name: tr, x: cs.map(c => (num ? +c.time : an.times.indexOf(c.time))), y: cs.map(c => c.mean), lo: cs.map(c => c.mean - c.se), hi: cs.map(c => c.mean + c.se) }; }), xlab: m.time, ylab: m.y }),
    { name: 'b7-repetidas', title: L2('Perfiles de los tratamientos', 'Treatment profiles'), caption: L2('Media ± error estándar.', 'Mean ± standard error.'), block: 7 });
  withinTable('b7rMeans', slices, an.treatments, o);
  el('b7rMeans').insertAdjacentHTML('beforeend', `<p class="hint">${L2('Dentro de cada tiempo se usa el error combinado de las dos estratas, con los grados de libertad de Satterthwaite.', 'Within each time the pooled error of the two strata is used, with Satterthwaite degrees of freedom.')}</p>`);
  el('b7rCite').innerHTML = '';
  citeMethod('b7rCite', [Refs.short('steel1997'), 'Greenhouse–Geisser 1959', 'Huynh–Feldt 1976; Lecoutre 1991', 'Mauchly 1940', 'Satterthwaite 1946']);
  state.trials = Object.assign(state.trials || {}, { repeated: { y: m.y } });
  Report.set('trials:repeated', { order: 71, title: ['Medidas repetidas', 'Repeated measures'], html: () => el('b7rRead').innerHTML + PHRep.table('b7rAnova') + PHRep.fig('b7-repetidas') + PHRep.table('b7rMeans') });
}

/* ---------------- slopes ---------------- */
function slopeRun(D) {
  const m = D.map;
  const rows = D.rows.filter(r => r[m.y] != null && isFinite(r[m.y]) && r[m.x] != null && isFinite(r[m.x]) && r[m.trt] != null).map(r => Object.assign({}, r, { [m.trt]: String(r[m.trt]) }));
  const s = Trial.slopes(rows, { y: m.y, x: m.x, group: m.trt });
  S.p = s;
  el('b7pOut').hidden = false;
  const fast = s.per.slice().sort((a, b) => Math.abs(b.b) - Math.abs(a.b));
  statTiles('b7pTiles', [[T('Pendientes iguales', 'Equal slopes'), 'F = ' + Fmt.num(s.equalSlopes.F, 2), Fmt.pEq(s.equalSlopes.p), s.equalSlopes.p < 0.05 ? 'hi' : ''], [T('Más rápido', 'Fastest'), esc(fast[0].group), Fmt.sig(fast[0].b, 4) + ' ' + T('por unidad de tiempo', 'per time unit')], [T('Más lento', 'Slowest'), esc(fast[fast.length - 1].group), Fmt.sig(fast[fast.length - 1].b, 4)]]);
  el('b7pRead').innerHTML = `<div class="reading"><p>${s.equalSlopes.p < 0.05 ? L2(`Las <b>velocidades difieren</b> (${Fmt.pEq(s.equalSlopes.p)}): ${esc(fast[0].group)} cambia ${Fmt.num(Math.abs(fast[0].b / fast[fast.length - 1].b), 2)} veces más rápido que ${esc(fast[fast.length - 1].group)}.`, `The <b>rates differ</b> (${Fmt.pEq(s.equalSlopes.p)}): ${esc(fast[0].group)} changes ${Fmt.num(Math.abs(fast[0].b / fast[fast.length - 1].b), 2)} times faster than ${esc(fast[fast.length - 1].group)}.`) : L2(`No se demuestra que las velocidades difieran (${Fmt.pEq(s.equalSlopes.p)}); con una pendiente común (${Fmt.sig(s.equalIntercepts.commonSlope, 4)}), los niveles ${s.equalIntercepts.p < 0.05 ? 'sí' : 'no'} difieren (${Fmt.pEq(s.equalIntercepts.p)}).`, `It is not shown that the rates differ (${Fmt.pEq(s.equalSlopes.p)}); with a common slope (${Fmt.sig(s.equalIntercepts.commonSlope, 4)}), the levels ${s.equalIntercepts.p < 0.05 ? 'do' : 'do not'} differ (${Fmt.pEq(s.equalIntercepts.p)}).`)}</p><p class="hint">${L2('Si las mismas unidades se midieron en cada tiempo, las observaciones no son independientes: estas pruebas son optimistas y la de medidas repetidas es la referencia.', 'If the same units were measured at every time, the observations are not independent: these tests are optimistic and the repeated-measures one is the reference.')}</p></div>`;
  const xs = rows.map(r => +r[m.x]), xmin = Math.min(...xs), xmax = Math.max(...xs);
  const ser = [];
  s.per.forEach((p, i) => {
    const sub = rows.filter(r => r[m.trt] === p.group);
    ser.push({ name: p.group, x: sub.map(r => +r[m.x]), y: sub.map(r => +r[m.y]), line: false, color: Plot.color(i), alpha: 0.6, r: 3 });
    ser.push({ name: p.group + ' · ' + T('recta', 'line'), x: [xmin, xmax], y: [p.a + p.b * xmin, p.a + p.b * xmax], points: false, color: Plot.color(i) });
  });
  el('b7pFig').innerHTML = '';
  Fig.put('b7pFig', Plot.lines({ name: 'b7-pendientes', series: ser, xlab: m.x, ylab: m.y }), { name: 'b7-pendientes', title: L2('Rectas por tratamiento', 'Lines by treatment'), block: 7 });
  buildTable('b7pTab', [{ key: 'group', label: L2('Tratamiento', 'Treatment') }, { key: 'n', label: 'n', num: true }, { key: 'a', label: L2('Intercepto', 'Intercept'), num: true, fmt: v => Fmt.sig(v, 4) }, { key: 'b', label: L2('Pendiente', 'Slope'), num: true, get: p => Fmt.sig(p.b, 4) + ' ± ' + Fmt.sig(p.seB, 2) }, { key: 'ci', label: L2('IC 95 %', '95% CI'), num: true, get: p => ciSig(p.lo, p.hi) }, { key: 'r2', label: 'R²', num: true, fmt: v => Fmt.num(v, 3) }], s.per, { csvName: T('pendientes', 'slopes') });
  buildTable('b7pPairs', [{ key: 'ab', label: L2('Par', 'Pair'), get: q => q.a + ' − ' + q.b }, { key: 'diff', label: L2('Diferencia de pendientes', 'Slope difference'), num: true, fmt: v => Fmt.sig(v, 4) }, { key: 't', label: 't', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'p', label: 'p', num: true, fmt: Fmt.p }, { key: 'pAdj', label: 'p (Holm)', num: true, fmt: Fmt.p }], s.pairs.map(q => Object.assign({ _class: q.pAdj < 0.05 ? 'best' : '' }, q)));
  el('b7pCite').innerHTML = '';
  citeMethod('b7pCite', [Refs.short('snedecor1989'), 'Holm: ' + Refs.short('holm1979')]);
  state.trials = Object.assign(state.trials || {}, { slopes: { p: s.equalSlopes.p } });
  Report.set('trials:slopes', { order: 72, title: ['Comparación de pendientes', 'Comparison of slopes'], html: () => el('b7pRead').innerHTML + PHRep.fig('b7-pendientes') + PHRep.table('b7pTab') + PHRep.table('b7pPairs') });
}

/* ---------------- randomization ---------------- */
function bookRun() {
  const list = id => UI.s(id).split(',').map(s => s.trim()).filter(Boolean);
  const b = Trial.fieldBook({ treatments: list('b7aT'), times: list('b7aTi'), reps: Math.max(1, Math.round(UI.v('b7aR'))), design: UI.s('b7aD'), repeated: UI.on('b7aRep'), seed: Math.round(UI.v('b7aS')) || 1, responses: list('b7aY'), lang: I18N.lang });
  S.a = b;
  el('b7aOut').hidden = false; el('b7aCSV').disabled = false; el('b7aXLSX').disabled = false;
  const units = new Set(b.rows.map(r => r[0])).size;
  statTiles('b7aTiles', [[T('Unidades', 'Units'), units], [T('Mediciones', 'Measurements'), b.n], [T('Diseño', 'Design'), UI.s('b7aD') === 'rcbd' ? T('Bloques', 'Blocks') : T('Al azar', 'Randomized'), UI.on('b7aRep') ? T('medidas repetidas', 'repeated measures') : T('muestreo destructivo', 'destructive sampling')]]);
  const cols = b.header.map((h, i) => ({ key: 'c' + i, label: esc(h), num: i === 0, get: r => r[i] }));
  buildTable('b7aTab', cols, b.rows.slice(0, 300));
}

document.addEventListener('DOMContentLoaded', () => {
  const P = el('panel-7');
  P.innerHTML = UI.panel(7, 'Ensayos poscosecha', 'Postharvest trials', 'Factoriales tratamiento × tiempo, medidas repetidas, pendientes y aleatorización', 'Treatment × time factorials, repeated measures, slopes and randomization', tools);
  if (window.I18N) I18N.apply(P);
  const f = DataIn.mount('b7fIn', { id: 'b7f', roles: [{ key: 'y', es: 'Variable de respuesta', en: 'Response variable', type: 'num', match: ['firmeza_n', 'firmeza', 'sst', 'peso', 'respuesta'] }, { key: 'trt', es: 'Tratamiento', en: 'Treatment', match: TRT_M }, { key: 'time', es: 'Tiempo', en: 'Time', match: TIME_M }, { key: 'block', es: 'Bloque', en: 'Block', optional: true, match: ['bloque', 'block'] }], examples: [{ id: 'mango' }], onData: factRun });
  window.PHLoad.b7f = () => f.load(0);
  ['b7fSS', 'b7fCommon', 'b7fMC', 'b7fCtl', 'b7fA'].forEach(id => el(id).addEventListener('change', () => f.refire()));
  const r = DataIn.mount('b7rIn', { id: 'b7r', roles: [{ key: 'y', es: 'Variable de respuesta', en: 'Response variable', type: 'num', match: ['perdida_peso', 'peso', 'respuesta', 'color'] }, { key: 'trt', es: 'Tratamiento', en: 'Treatment', match: TRT_M }, { key: 'time', es: 'Tiempo', en: 'Time', match: TIME_M }, { key: 'unit', es: 'Unidad (fruto)', en: 'Unit (fruit)', match: ['fruto', 'unidad', 'unit', 'id', 'parcela', 'fruit'] }, { key: 'block', es: 'Bloque', en: 'Block', optional: true, match: ['bloque', 'block'] }], examples: [{ id: 'chayotePeso' }], onData: repRun });
  window.PHLoad.b7r = () => r.load(0);
  ['b7rMC', 'b7rCtl', 'b7rA'].forEach(id => el(id).addEventListener('change', () => r.refire()));
  const p = DataIn.mount('b7pIn', { id: 'b7p', roles: [{ key: 'y', es: 'Atributo', en: 'Attribute', type: 'num', match: ['perdida_peso', 'peso', 'firmeza', 'respuesta'] }, { key: 'x', es: 'Tiempo (numérico)', en: 'Time (numeric)', type: 'num', match: TIME_M }, { key: 'trt', es: 'Tratamiento', en: 'Treatment', match: TRT_M }], examples: [{ id: 'chayotePeso' }], onData: slopeRun });
  window.PHLoad.b7p = () => p.load(0);
  el('b7aGo').addEventListener('click', bookRun);
  el('b7aCSV').addEventListener('click', () => { if (S.a) download(Out.csvText(S.a.header, S.a.rows), T('libro_de_campo.csv', 'field_book.csv'), 'text/csv;charset=utf-8'); });
  el('b7aXLSX').addEventListener('click', async () => { if (S.a) download(await Sheets.write([{ name: T('Libro de campo', 'Field book'), rows: [S.a.header].concat(S.a.rows) }]), T('libro_de_campo.xlsx', 'field_book.xlsx')); });
  el('b7aAgri').addEventListener('click', () => window.open(Send.APPS.AgriDesign, '_blank', 'noopener'));
});
document.addEventListener('langchange', () => { ['b7f', 'b7r', 'b7p'].forEach(id => { const d = DataIn.registry[id]; if (d && d.get()) d.refire(); }); if (S.a) bookRun(); });
})();
