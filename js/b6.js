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

/* PostHarvestPro — Block 6, sensory evaluation: discrimination tests with
   Thurstonian d′, power and sample size; hedonic scale with Tukey and
   Friedman; just-about-right with penalty analysis; CATA with Cochran's Q and
   correspondence analysis; descriptive profile with panel performance and the
   product map; and ballots with balanced presentation orders. */
(function () {
'use strict';
const S = {};
const MNAME = { triangle: ['Triangular', 'Triangle'], duotrio: ['Dúo-trío', 'Duo-trio'], twoAFC: ['2-AFC (dos alternativas)', '2-AFC (two alternatives)'], threeAFC: ['3-AFC (tres alternativas)', '3-AFC (three alternatives)'], tetrad: ['Tétrada', 'Tetrad'] };
const mName = m => T(MNAME[m][0], MNAME[m][1]);
/* the name inside a sentence: «la prueba triangular», «la prueba 3-AFC» (the acronyms keep their capitals) */
const MPROSE = { triangle: ['triangular', 'triangle'], duotrio: ['dúo-trío', 'duo-trio'], twoAFC: ['2-AFC', '2-AFC'], threeAFC: ['3-AFC', '3-AFC'], tetrad: ['de tétrada', 'tetrad'] };
const METH_OPTS = Sens.METHODS.map(m => [m, MNAME[m][0], MNAME[m][1]]);
const HEDONIC = [['Me gusta muchísimo', 'Like extremely'], ['Me gusta mucho', 'Like very much'], ['Me gusta moderadamente', 'Like moderately'], ['Me gusta un poco', 'Like slightly'], ['No me gusta ni me disgusta', 'Neither like nor dislike'], ['Me disgusta un poco', 'Dislike slightly'], ['Me disgusta moderadamente', 'Dislike moderately'], ['Me disgusta mucho', 'Dislike very much'], ['Me disgusta muchísimo', 'Dislike extremely']];

const tools = [
  { id: 'discrim', es: 'Discriminativas', en: 'Discrimination', html: `
    <div class="card"><h2>${L2('Resultados de las pruebas', 'Test results')}</h2>
      <p class="hint">${L2('Una fila por prueba: el método, las respuestas correctas y el total de jueces. La prueba de diferencia pregunta si las muestras se distinguen; la de similitud, si la proporción de discriminadores es menor que pd₀.', 'One row per test: the method, the correct answers and the number of judges. The difference test asks whether the samples can be told apart; the similarity test, whether the proportion of discriminators is below pd₀.')}</p>
      <div class="ex-strip"><div class="ex-t"><b>${L2(Datasets.INFO.cafeDiscriminativas.es, Datasets.INFO.cafeDiscriminativas.en)}</b><span class="ex-sim">${L2('simulado', 'simulated')}</span></div><div class="btn-row" style="margin:0"><button type="button" class="btn btn-secondary btn-sm" id="b6dEx">${L2('Cargar ejemplo', 'Load example')}</button></div></div>
      <div id="b6dTable"></div><div class="form-grid tight">${UI.sel('b6dConf', 'Confianza', 'Confidence', [['0.9', '90 %', '90 %'], ['0.95', '95 %', '95 %'], ['0.99', '99 %', '99 %']], '0.95')}${UI.sel('b6dStat', 'Estadístico', 'Statistic', [['exact', 'Binomial exacto', 'Exact binomial'], ['likelihood', 'Razón de verosimilitudes', 'Likelihood ratio'], ['score', 'Puntuación', 'Score'], ['Wald', 'Wald', 'Wald']], 'exact')}</div></div>
    <div class="card" id="b6dOut" hidden><h2>${L2('Diferencia y su tamaño (d′)', 'Difference and its size (d′)')}</h2><div id="b6dRead"></div><div id="b6dTab"></div><div id="b6dCite"></div></div>
    <div class="card"><h2>${L2('Planear: número de jueces y potencia', 'Plan: number of judges and power')}</h2>
      <div class="form-grid tight">${UI.sel('b6pM', 'Método', 'Method', METH_OPTS, 'triangle')}${UI.num('b6pD', 'd′ que quieres detectar', 'd′ you want to detect', 1.5, { step: 0.1 })}${UI.num('b6pA', 'α', 'α', 0.05, { step: 0.01 })}${UI.num('b6pPow', 'Potencia deseada', 'Desired power', 0.8, { step: 0.05 })}${UI.num('b6pN', 'Jueces disponibles', 'Judges available', 30)}</div>
      <div id="b6pTiles"></div><div id="b6pRead"></div><div class="figs-2"><div id="b6pFig1"></div><div id="b6pFig2"></div></div><div id="b6pTab"></div></div>
    <div class="cols-2">
      <div class="card"><h2>${L2('A–no A', 'A–not A')}</h2><div class="form-grid tight">${UI.num('b6aX1', '«A» ante muestras A', '«A» to A samples', 33)}${UI.num('b6aN1', 'Muestras A', 'A samples', 40)}${UI.num('b6aX2', '«A» ante muestras no A', '«A» to not-A samples', 18)}${UI.num('b6aN2', 'Muestras no A', 'Not-A samples', 40)}</div><div id="b6aOut"></div></div>
      <div class="card"><h2>${L2('Preferencia pareada', 'Paired preference')}</h2><div class="form-grid tight">${UI.num('b6fA', 'Prefieren A', 'Prefer A', 38)}${UI.num('b6fB', 'Prefieren B', 'Prefer B', 22)}${UI.num('b6fN', 'Sin preferencia', 'No preference', 5)}${UI.sel('b6fT', 'Los «sin preferencia»', 'The «no preference»', [['ignore', 'se excluyen', 'are excluded'], ['split', 'se reparten mitad y mitad', 'are split half and half']], 'ignore')}</div><div id="b6fOut"></div><div id="b6fNote"></div></div>
    </div>` },
  { id: 'hedonica', es: 'Hedónica', en: 'Hedonic', html: `
    <div class="card"><h2>${L2('Agrado de los consumidores', 'Consumer liking')}</h2><p class="hint">${L2('Una fila por consumidor y producto, con la calificación en la escala hedónica (1 = me disgusta muchísimo … 9 = me gusta muchísimo).', 'One row per consumer and product, with the score on the hedonic scale (1 = dislike extremely … 9 = like extremely).')}</p><div id="b6hIn"></div></div>
    <div id="b6hOut" hidden><div class="card"><h2>${L2('Análisis de varianza y comparación de productos', 'Analysis of variance and product comparison')}</h2><div id="b6hTiles"></div><div id="b6hRead"></div><div id="b6hFig"></div><div id="b6hAnova"></div><div id="b6hMeans"></div><h3>${L2('Alternativa por rangos (Friedman)', 'Rank alternative (Friedman)')}</h3><div id="b6hFr"></div><div id="b6hCite"></div></div></div>` },
  { id: 'jar', es: 'Punto justo (JAR)', en: 'Just-about-right', html: `
    <div class="card"><h2>${L2('Escalas de punto justo', 'Just-about-right scales')}</h2><p class="hint">${L2('Una fila por consumidor y producto: el agrado y una columna por atributo en escala de punto justo (1 = muy poco … centro = justo … máximo = demasiado).', 'One row per consumer and product: liking and one column per attribute on a just-about-right scale (1 = far too little … center = just right … top = far too much).')}</p><div id="b6jIn"></div><div class="form-grid tight">${UI.num('b6jL', 'Niveles de la escala', 'Scale levels', 5, { step: 2, min: 3 })}${UI.num('b6jTh', 'Umbral de consumidores (%)', 'Consumer threshold (%)', 20)}</div><div class="messages" id="b6jMsg"></div></div>
    <div id="b6jOut" hidden><div class="card"><h2>${L2('Análisis de penalidades', 'Penalty analysis')}</h2><div id="b6jRead"></div><div id="b6jFig"></div><div id="b6jFig2"></div><div id="b6jTab"></div><div id="b6jCite"></div></div></div>` },
  { id: 'cata', es: 'CATA', en: 'CATA', html: `
    <div class="card"><h2>${L2('Marque todo lo que aplique', 'Check all that apply')}</h2><p class="hint">${L2('Una fila por consumidor y producto, con 1 en cada término que el consumidor marcó y 0 en los demás.', 'One row per consumer and product, with 1 in each term the consumer checked and 0 in the others.')}</p><div id="b6cIn"></div></div>
    <div id="b6cOut" hidden><div class="card"><h2>${L2('Frecuencias, diferencias y mapa', 'Frequencies, differences and map')}</h2><div id="b6cTiles"></div><div id="b6cRead"></div><div id="b6cFig"></div><div id="b6cTab"></div><div id="b6cFig2"></div><div id="b6cCite"></div></div></div>` },
  { id: 'qda', es: 'Perfil descriptivo', en: 'Descriptive profile', html: `
    <div class="card"><h2>${L2('Panel entrenado', 'Trained panel')}</h2><p class="hint">${L2('Una fila por juez, producto y sesión, con una columna por atributo (intensidad en escala continua).', 'One row per judge, product and session, with one column per attribute (intensity on a continuous scale).')}</p><div id="b6qIn"></div><div class="form-grid tight">${UI.sel('b6qMC', 'Comparación de medias', 'Mean comparison', [['LSD', 'LSD de Fisher', 'Fisher\'s LSD'], ['HSD', 'Tukey', 'Tukey']], 'LSD')}</div></div>
    <div id="b6qOut" hidden>
      <div class="card"><h2>${L2('Perfil de los productos', 'Product profile')}</h2><div id="b6qTiles"></div><div id="b6qRead"></div><div class="figs-2"><div id="b6qFig1"></div><div id="b6qFig2"></div></div><div id="b6qTab"></div><div class="btn-row"><button type="button" class="btn btn-accent btn-sm" id="b6qSend">${L2('Enviar a PCAPro (mapa de preferencias) →', 'Send to PCAPro (preference map) →')}</button></div></div>
      <div class="card"><h2>${L2('Desempeño del panel', 'Panel performance')}</h2><div id="b6qPRead"></div><div id="b6qPTab"></div><div class="form-grid tight">${UI.sel('b6qAttr', 'Detalle del atributo', 'Detail of the attribute', [], '')}</div><div id="b6qPDet"></div><div id="b6qCite"></div></div>
    </div>` },
  { id: 'fichas', es: 'Fichas de cata', en: 'Ballots', html: `
    <div class="card"><h2>${L2('Diseño de la sesión', 'Session design')}</h2><p class="hint">${L2('Órdenes de presentación de Williams (balanceados por posición y por arrastre de primer orden) y códigos de tres dígitos al azar. Para que el balance sea completo, el número de jueces debe ser múltiplo del número de órdenes.', 'Williams presentation orders (balanced for position and first-order carry-over) and random three-digit codes. For a complete balance the number of judges must be a multiple of the number of orders.')}</p>
      <div class="form-grid">${UI.sel('b6bType', 'Prueba', 'Test', [['hedonic', 'Hedónica de 9 puntos', '9-point hedonic'], ['qda', 'Perfil (atributos)', 'Profile (attributes)'], ['triangle', 'Triangular', 'Triangle']], 'hedonic')}${UI.num('b6bN', 'Jueces', 'Judges', 12)}${UI.num('b6bSeed', 'Semilla', 'Seed', 2026)}${UI.text('b6bTitle', 'Título de la ficha', 'Ballot title', 'Evaluación de café')}</div>
      <div class="form-grid b6-lists">${UI.text('b6bProds', 'Productos (separados por coma)', 'Products (comma separated)', 'Altura lavado, Natural, Honey, Comercial')}${UI.text('b6bAttrs', 'Atributos (perfil)', 'Attributes (profile)', 'Fragancia, Acidez, Amargor, Cuerpo, Dulzor')}</div>
      ${UI.check('b6bPer', 'Un código distinto por juez para cada producto', 'A different code per judge for each product', false)}
      <div class="btn-row"><button type="button" class="btn btn-primary btn-sm" id="b6bGo">${L2('Generar el plan', 'Generate the plan')}</button><button type="button" class="btn btn-secondary btn-sm" id="b6bPrint" disabled>${L2('Imprimir las fichas', 'Print the ballots')}</button><button type="button" class="btn btn-ghost btn-sm" id="b6bCSV" disabled>${L2('⤓ Plan de servicio (CSV)', '⤓ Serving plan (CSV)')}</button></div></div>
    <div class="card" id="b6bOut" hidden><h2>${L2('Plan de servicio', 'Serving plan')}</h2><div id="b6bRead"></div><div id="b6bTab"></div><div class="ballot-grid" id="b6bPrev"></div><div id="b6bCite"></div></div>` },
];

/* ---------------- 1. discrimination ---------------- */
let dTable;
function discrimRun() {
  const conf = +UI.s('b6dConf'), stat = UI.s('b6dStat');
  const rows = dTable.get().filter(r => Sens.METHODS.includes(r.method) && Number.isInteger(+r.x) && Number.isInteger(+r.n) && +r.n > 0);
  if (!rows.length) { el('b6dOut').hidden = true; if (Report.sections['sensory:discrim']) { delete Report.sections['sensory:discrim']; blockDone('sensory'); } return; }
  const res = rows.map(r => Object.assign({ name: r.name }, Sens.discrim(r.method, +r.x, +r.n, { conf, statistic: stat, test: r.test || 'difference', pd0: r.test === 'similarity' ? (+r.pd0 || 0.2) : 0 })));
  S.d = res;
  el('b6dOut').hidden = false;
  el('b6dRead').innerHTML = `<div class="reading">${res.map(r => {
    const sig = r.p < 1 - conf;
    const crit = Sens.critical(r.method, r.total, 1 - conf, r.test, r.pd0);
    if (r.test === 'similarity') return `<p><b>${esc(r.name || mName(r.method))}</b>: ${sig ? L2(`se demuestra <b>similitud</b>: la proporción de discriminadores es menor que ${Fmt.num(r.pd0, 2)} (${Fmt.pEq(r.p)}).`, `<b>similarity</b> is shown: the proportion of discriminators is below ${Fmt.num(r.pd0, 2)} (${Fmt.pEq(r.p)}).`) : L2(`no se puede afirmar la similitud con pd₀ = ${Fmt.num(r.pd0, 2)} (${Fmt.pEq(r.p)}).`, `similarity cannot be claimed with pd₀ = ${Fmt.num(r.pd0, 2)} (${Fmt.pEq(r.p)}).`)}</p>`;
    return `<p><b>${esc(r.name || mName(r.method))}</b> (${mName(r.method)}): ${r.correct} ${L2('de', 'of')} ${r.total} ${L2('aciertos', 'correct')}; ${sig ? L2('las muestras <b>se distinguen</b>', 'the samples <b>can be told apart</b>') : L2('<b>no se demuestra</b> diferencia', 'no difference is <b>shown</b>')} (${Fmt.pEq(r.p)}; ${L2('hacían falta', 'needed')} ${crit}). d′ = <b>${Fmt.num(r.d, 2)}</b> ${Fmt.ci(r.ci.d[0], r.ci.d[1], 2)}, ${L2('discriminadores', 'discriminators')} pd = ${Fmt.pct(100 * r.pd, 0)}.</p>`;
  }).join('')}<p class="hint">${L2('d′ mide el tamaño de la diferencia en una escala común a todos los métodos: un d′ cercano a 1 es una diferencia pequeña que pocos notan; mayor de 2, clara.', 'd′ measures the size of the difference on a scale common to every method: a d′ near 1 is a small difference few notice; above 2, a clear one.')}</p></div>`;
  buildTable('b6dTab', [{ key: 'name', label: L2('Prueba', 'Test'), get: r => r.name || mName(r.method) }, { key: 'm', label: L2('Método', 'Method'), get: r => mName(r.method) }, { key: 'xn', label: L2('Aciertos', 'Correct'), num: true, get: r => r.correct + ' / ' + r.total },
    { key: 'pc', label: 'pc', num: true, get: r => Fmt.num(r.pc, 3) + ' ' + Fmt.ci(r.ci.pc[0], r.ci.pc[1], 3) }, { key: 'pd', label: 'pd', num: true, get: r => Fmt.num(r.pd, 3) + ' ' + Fmt.ci(r.ci.pd[0], r.ci.pd[1], 3) },
    { key: 'd', label: 'd′', num: true, get: r => Fmt.num(r.d, 3) + ' ± ' + Fmt.num(r.se.d, 3) }, { key: 'dci', label: L2('IC de d′', 'CI of d′'), num: true, get: r => Fmt.ci(r.ci.d[0], r.ci.d[1], 3) }, { key: 'p', label: 'p', num: true, get: r => Fmt.p(r.p) }], res, { csvName: 'discriminativas' });
  el('b6dCite').innerHTML = '';
  citeMethod('b6dCite', [[T('Modelos de Thurstone: ', 'Thurstonian models: ') + Refs.short('ennis1993') + '; ' + Refs.short('brockhoff2010'), 'Thurstonian models: ' + Refs.short('ennis1993') + '; ' + Refs.short('brockhoff2010')], Refs.short('bi2006'), 'Clopper–Pearson']);
  state.sensory = Object.assign(state.sensory || {}, { discrim: res.length });
  Report.set('sensory:discrim', { order: 60, title: ['Pruebas discriminativas', 'Discrimination tests'], html: () => el('b6dRead').innerHTML + PHRep.table('b6dTab') });
}
function planRun() {
  const m = UI.s('b6pM'), d = UI.v('b6pD'), a = UI.v('b6pA'), pw = UI.v('b6pPow'), nAv = UI.v('b6pN');
  const pd = Sens.pc2pd(m, Sens.pc(m, d));
  const need = Sens.sampleSize(m, pw, { dA: d }, a);
  const powNow = Sens.power(m, nAv, { dA: d }, a);
  statTiles('b6pTiles', [[T('Jueces necesarios', 'Judges needed'), isFinite(need) ? need : '—', T('para potencia ', 'for power ') + Fmt.num(pw, 2), 'hi'], [T('Potencia con ', 'Power with ') + nAv, Fmt.num(powNow, 3), powNow < 0.8 ? T('baja', 'low') : '', powNow < 0.8 ? 'warn' : 'good'], [T('Aciertos críticos con ', 'Critical correct with ') + nAv, Sens.critical(m, nAv, a)], ['pc / pd', Fmt.num(Sens.pc(m, d), 3) + ' / ' + Fmt.num(pd, 3)]]);
  const others = Sens.METHODS.map(mm => ({ m: mm, n: Sens.sampleSize(mm, pw, { dA: d }, a) }));
  const best = others.filter(o => isFinite(o.n)).sort((x, y) => x.n - y.n)[0];
  el('b6pRead').innerHTML = `<div class="reading"><p>${L2(`Para detectar d′ = ${Fmt.num(d, 1)} con α = ${a} y potencia ${pw}, con la prueba ${MPROSE[m][0]} hacen falta <b>${need}</b> jueces. El método más eficiente para esta diferencia es ${best ? `la prueba <b>${MPROSE[best.m][0]}</b>` : '<b>—</b>'} (${best ? best.n : '—'} jueces). La potencia exacta sube en dientes de sierra: un juez más no siempre la aumenta.`, `To detect d′ = ${Fmt.num(d, 1)} with α = ${a} and power ${pw}, the ${MPROSE[m][1]} test needs <b>${need}</b> judges. The most efficient method for this difference is ${best ? `the <b>${MPROSE[best.m][1]}</b> test` : '<b>—</b>'} (${best ? best.n : '—'} judges). Exact power rises in a saw-tooth: one more judge does not always raise it.`)}</p></div>`;
  buildTable('b6pTab', [{ key: 'm', label: L2('Método', 'Method'), get: o => mName(o.m) }, { key: 'n', label: L2('Jueces para la potencia deseada', 'Judges for the desired power'), num: true }, { key: 'p', label: L2('Potencia con ', 'Power with ') + nAv, num: true, get: o => Fmt.num(Sens.power(o.m, nAv, { dA: d }, a), 3) }], others);
  const dg = Array.from({ length: 41 }, (_, i) => 3.5 * i / 40);
  el('b6pFig1').innerHTML = ''; el('b6pFig2').innerHTML = '';
  Fig.put('b6pFig1', Plot.lines({ name: 'b6-psicometricas', w: 520, h: 330, series: Sens.METHODS.map(mm => ({ name: mName(mm), x: dg, y: dg.map(v => Sens.pc(mm, v)), points: false })), xlab: 'd′', ylab: T('Proporción de aciertos (pc)', 'Proportion correct (pc)'), vlines: [{ x: d }], yr: [0.3, 1.02] }), { name: 'b6-psicometricas', title: L2('Funciones psicométricas', 'Psychometric functions'), block: 6 });
  const ng = Array.from({ length: 40 }, (_, i) => 6 + i * 3);
  Fig.put('b6pFig2', Plot.lines({ name: 'b6-potencia', w: 520, h: 330, series: Sens.METHODS.map(mm => ({ name: mName(mm), x: ng, y: ng.map(n => Sens.power(mm, n, { dA: d }, a)), points: false })), xlab: T('Jueces', 'Judges'), ylab: T('Potencia', 'Power'), hlines: [{ y: pw }], yr: [0, 1.02] }), { name: 'b6-potencia', title: L2('Potencia contra número de jueces', 'Power against number of judges'), block: 6 });
}
function aNotARun() {
  const r = Sens.aNotA(UI.v('b6aX1'), UI.v('b6aN1'), UI.v('b6aX2'), UI.v('b6aN2'));
  statTiles('b6aOut', [['d′', Fmt.num(r.d, 3), Fmt.ci(r.ci[0], r.ci[1], 3), r.p < 0.05 ? 'hi' : ''], [T('Aciertos / falsas alarmas', 'Hits / false alarms'), Fmt.num(r.hit, 3) + ' / ' + Fmt.num(r.fa, 3)], ['p', Fmt.p(r.p)]]);
}
function prefRun() {
  const r = Sens.preference(UI.v('b6fA'), UI.v('b6fB'), { noPref: UI.v('b6fN'), ties: UI.s('b6fT') });
  statTiles('b6fOut', [[T('Prefieren A', 'Prefer A'), Fmt.pct(100 * r.estimate), Fmt.ci(100 * r.ci[0], 100 * r.ci[1], 1) + ' %', r.p < 0.05 ? 'hi' : ''], [T('Prueba binomial bilateral', 'Two-sided binomial test'), Fmt.pEq(r.p), r.x + ' / ' + r.n]]);
  /* the engine's notes: what happened to the «no preference» answers */
  el('b6fNote').innerHTML = (r.notes || []).map(n => `<p class="hint">${L2(n.es, n.en)}</p>`).join('');
}

/* ---------------- 2. hedonic ---------------- */
function hedRun(D) {
  const m = D.map;
  const rows = D.rows.map(r => ({ consumer: r[m.consumer], product: r[m.product], score: r[m.score] == null ? NaN : +r[m.score] }));
  const H = Sens.hedonic(rows, { alpha: 0.05 });
  /* Friedman on the consumers who scored every product */
  const cons = H.consumers.filter(c => H.products.every(p => rows.some(r => String(r.consumer) === c && String(r.product) === p && isFinite(r.score))));
  const M = cons.map(c => H.products.map(p => rows.find(r => String(r.consumer) === c && String(r.product) === p).score));
  const F = M.length > 1 ? Sens.friedman(M, { names: H.products }) : null;
  S.h = { H, F };
  el('b6hOut').hidden = false;
  const aP = H.productAdjusted || H.anova.find(r => r.source === 'product');
  const top = H.means.slice().sort((a, b) => b.mean - a.mean);
  statTiles('b6hTiles', [[T('Consumidores', 'Consumers'), H.consumers.length], [T('Productos', 'Products'), H.products.length], [T('Efecto de producto', 'Product effect'), 'F = ' + Fmt.num(aP.F, 2), Fmt.pEq(aP.p), aP.p < 0.05 ? 'hi' : ''], [T('Más agradable', 'Most liked'), esc(top[0].product), Fmt.num(top[0].mean, 2) + ' · ' + H.tukey.letters[top[0].product]], ['CV', Fmt.pct(H.cv)]]);
  const word = v => T(HEDONIC[Math.max(0, Math.min(8, Math.round(9 - v)))][0], HEDONIC[Math.max(0, Math.min(8, Math.round(9 - v)))][1]).toLowerCase();
  el('b6hRead').innerHTML = `<div class="reading"><p>${aP.p < 0.05 ? L2(`Los productos <b>difieren en agrado</b> (${Fmt.pEq(aP.p)}). <b>${esc(top[0].product)}</b> tiene la media más alta (${Fmt.num(top[0].mean, 2)}, «${word(top[0].mean)}») y <b>${esc(top[top.length - 1].product)}</b> la más baja (${Fmt.num(top[top.length - 1].mean, 2)}, «${word(top[top.length - 1].mean)}»). Productos con la misma letra no difieren (Tukey, α = 0.05).`, `The products <b>differ in liking</b> (${Fmt.pEq(aP.p)}). <b>${esc(top[0].product)}</b> has the highest mean (${Fmt.num(top[0].mean, 2)}, «${word(top[0].mean)}») and <b>${esc(top[top.length - 1].product)}</b> the lowest (${Fmt.num(top[top.length - 1].mean, 2)}, «${word(top[top.length - 1].mean)}»). Products sharing a letter do not differ (Tukey, α = 0.05).`) : L2(`No se demuestran diferencias de agrado entre productos (${Fmt.pEq(aP.p)}).`, `No liking differences between products are shown (${Fmt.pEq(aP.p)}).`)}${F ? ' ' + L2(`La prueba de Friedman sobre los rangos da χ² = ${Fmt.num(F.chi2, 2)} (${Fmt.pEq(F.p)}), útil si la escala no se considera de intervalo.`, `Friedman's test on the ranks gives χ² = ${Fmt.num(F.chi2, 2)} (${Fmt.pEq(F.p)}), useful if the scale is not taken as interval.`) : ''}</p>${H.notes.map(n => `<p class="hint">${L2(n.es, n.en)}</p>`).join('')}</div>`;
  el('b6hFig').innerHTML = '';
  Fig.put('b6hFig', Plot.bars({ name: 'b6-hedonica', cats: H.means.map(x => x.product), values: H.means.map(x => x.mean), err: H.means.map(x => x.se), letters: H.means.map(x => H.tukey.letters[x.product]), ylab: T('Agrado medio (1–9)', 'Mean liking (1–9)'), yr: [0, 9.6] }),
    { name: 'b6-hedonica', title: L2('Agrado por producto', 'Liking by product'), caption: L2('Media ± error estándar (del ANOVA); letras distintas, diferencia de Tukey al 5 %.', 'Mean ± standard error (from the ANOVA); different letters, Tukey difference at 5 %.'), block: 6 });
  /* unbalanced: the product effect adjusted for consumers (the one the tiles and the reading use) joins the
     sequential table, just above the error */
  const aov = H.anova.slice();
  if (H.productAdjusted) aov.splice(aov.length - 1, 0, Object.assign({}, H.productAdjusted, { source: 'productAdjusted' }));
  buildTable('b6hAnova', [{ key: 'source', label: L2('Fuente', 'Source'), get: r => ({ product: T('Producto', 'Product'), consumer: T('Consumidor', 'Consumer'), productAdjusted: T('Producto, ajustado por consumidor', 'Product, adjusted for consumers'), residual: T('Error', 'Error'), Residuals: T('Error', 'Error') }[r.source] || r.source) }, { key: 'df', label: 'gl', num: true }, { key: 'ss', label: 'SC', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'ms', label: 'CM', num: true, fmt: v => Fmt.num(v, 3) }, { key: 'F', label: 'F', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'p', label: 'p', num: true, fmt: Fmt.p }], aov);
  buildTable('b6hMeans', [{ key: 'product', label: L2('Producto', 'Product') }, { key: 'n', label: 'n', num: true }, { key: 'mean', label: L2('Media', 'Mean'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'sd', label: 'DE', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'se', label: 'EE', num: true, fmt: v => Fmt.num(v, 3) }, { key: 'l', label: L2('Grupo', 'Group'), html: true, get: r => `<span class="letters">${H.tukey.letters[r.product]}</span>` }], H.means, { csvName: 'hedonica' });
  if (F) buildTable('b6hFr', [{ key: 'p', label: L2('Producto', 'Product') }, { key: 'rs', label: L2('Suma de rangos', 'Rank sum'), num: true }, { key: 'mr', label: L2('Rango medio', 'Mean rank'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'l', label: L2('Grupo', 'Group'), html: true, get: r => `<span class="letters">${F.letters[r.p]}</span>` }], F.names.map(p => ({ p, rs: F.rankSums[p], mr: F.meanRanks[p] })));
  el('b6hCite').innerHTML = '';
  citeMethod('b6hCite', [Refs.short('peryam1957'), 'Tukey–Kramer: ' + Refs.short('kramer1956'), 'Friedman: ' + Refs.short('friedman1937')]);
  state.sensory = Object.assign(state.sensory || {}, { hedonic: { best: top[0].product } });
  Report.set('sensory:hedonic', { order: 61, title: ['Prueba hedónica', 'Hedonic test'], html: () => el('b6hRead').innerHTML + PHRep.fig('b6-hedonica') + PHRep.table('b6hAnova') + PHRep.table('b6hMeans') });
}

/* ---------------- 3. just about right ---------------- */
function jarRun(D) {
  const m = D.map, levels = UI.v('b6jL') || 5, th = UI.v('b6jTh');
  const long = [];
  D.rows.forEach(r => (m.attrs || []).forEach(a => { if (r[a] != null && isFinite(r[a]) && r[m.liking] != null) long.push({ consumer: r[m.consumer], product: r[m.product], attribute: a.replace(/^jar_/i, ''), jar: +r[a], liking: +r[m.liking] }); }));
  let J;
  /* the warning has its own box (clearing the data loader's host would wipe the loader) and the results of
     the previous scale are hidden and leave the report: they no longer answer the settings on screen */
  clearMessages('b6jMsg');
  try { J = Sens.jar(long, { levels, threshold: th }); } catch (e) {
    showMessage('b6jMsg', 'warn', T('Con un número par de niveles no hay centro: usa 3, 5, 7 o 9.', 'With an even number of levels there is no center: use 3, 5, 7 or 9.'));
    el('b6jOut').hidden = true; S.j = null;
    if (state.sensory) delete state.sensory.jar;
    if (Report.sections['sensory:jar']) { delete Report.sections['sensory:jar']; blockDone('sensory'); }
    return;
  }
  S.j = J;
  el('b6jOut').hidden = false;
  const flagged = [];
  J.results.forEach(r => {
    if (r.flagLow && r.dropLow > 0) flagged.push({ r, side: 'low', pct: r.pctLow, drop: r.dropLow, pen: r.penaltyLow, p: r.pLow });
    if (r.flagHigh && r.dropHigh > 0) flagged.push({ r, side: 'high', pct: r.pctHigh, drop: r.dropHigh, pen: r.penaltyHigh, p: r.pHigh });
  });
  flagged.sort((a, b) => b.pen - a.pen);
  const sideW = s => (s === 'low' ? T('muy poco', 'too little') : T('demasiado', 'too much'));
  el('b6jRead').innerHTML = `<div class="reading"><p>${flagged.length ? L2('Penalidades que importan (al menos ' + th + ' % de consumidores fuera del punto justo, con caída de agrado): ', 'Penalties that matter (at least ' + th + ' % of consumers off the just-right point, with a drop in liking): ') + flagged.slice(0, 6).map(f => `<b>${esc(f.r.product)}</b> · ${esc(f.r.attribute)} ${sideW(f.side)} (${Fmt.pct(f.pct, 0)}, −${Fmt.num(f.drop, 2)} ${L2('puntos', 'points')}${isFinite(f.p) ? ', ' + Fmt.pEq(f.p) : ''})`).join('; ') + '.' : L2('Ningún atributo tiene una penalidad que importe con este umbral.', 'No attribute has a penalty that matters at this threshold.')}</p><p class="hint">${L2('La caída es el agrado medio del grupo «en el punto justo» menos el del grupo fuera de él; la penalidad ponderada multiplica esa caída por la proporción de consumidores. Arriba a la derecha de la gráfica están los ajustes que más agrado recuperarían.', 'The drop is the mean liking of the «just right» group minus that of the group off it; the weighted penalty multiplies that drop by the share of consumers. Top right in the chart are the adjustments that would recover most liking.')}</p></div>`;
  const pts = [];
  J.results.forEach((r, i) => {
    const pi = J.products.indexOf(r.product);
    if (isFinite(r.dropLow) && r.nLow) pts.push({ x: r.pctLow, y: r.dropLow, label: r.product + ' · ' + r.attribute + ' −', color: Plot.color(pi), shape: 'down' });
    if (isFinite(r.dropHigh) && r.nHigh) pts.push({ x: r.pctHigh, y: r.dropHigh, label: r.product + ' · ' + r.attribute + ' +', color: Plot.color(pi), shape: 'triangle' });
    void i;
  });
  el('b6jFig').innerHTML = ''; el('b6jFig2').innerHTML = '';
  Fig.put('b6jFig', Plot.labelled({ name: 'b6-penalidades', pts, xlab: T('% de consumidores', '% of consumers'), ylab: T('Caída del agrado (puntos)', 'Drop in liking (points)'), xline: th, yline: 1, items: J.products.map((p, i) => ({ name: p, color: Plot.color(i), shape: 'circle', kind: 'pt' })), w: 760, h: 480 }),
    { name: 'b6-penalidades', title: L2('Gráfica de penalidades', 'Penalty plot'), caption: L2('▲ demasiado · ▼ muy poco. Zona sombreada: mucha gente y mucha caída.', '▲ too much · ▼ too little. Shaded zone: many people and a large drop.'), block: 6 });
  const cats = J.results.map(r => r.product + ' · ' + r.attribute);
  Fig.put('b6jFig2', Plot.bars({ name: 'b6-jar-dist', cats, groups: [T('Muy poco', 'Too little'), T('Justo', 'Just right'), T('Demasiado', 'Too much')], values: [J.results.map(r => r.pctLow), J.results.map(r => r.pctJar), J.results.map(r => r.pctHigh)], stacked: true, horizontal: true, ylab: '%', colors: ['var(--s2)', 'var(--s3)', 'var(--s1)'], h: Math.max(300, 26 * cats.length + 80) }),
    { name: 'b6-jar-dist', title: L2('Distribución de las respuestas de punto justo', 'Distribution of just-about-right answers'), block: 6 });
  buildTable('b6jTab', [{ key: 'product', label: L2('Producto', 'Product') }, { key: 'attribute', label: L2('Atributo', 'Attribute') }, { key: 'pctLow', label: L2('% poco', '% low'), num: true, fmt: v => Fmt.num(v, 1) }, { key: 'pctJar', label: L2('% justo', '% JAR'), num: true, fmt: v => Fmt.num(v, 1) }, { key: 'pctHigh', label: L2('% mucho', '% high'), num: true, fmt: v => Fmt.num(v, 1) },
    { key: 'dropLow', label: L2('Caída (poco)', 'Drop (low)'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'pLow', label: 'p', num: true, fmt: Fmt.p }, { key: 'dropHigh', label: L2('Caída (mucho)', 'Drop (high)'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'pHigh', label: 'p', num: true, fmt: Fmt.p },
    { key: 'pen', label: L2('Penalidad ponderada', 'Weighted penalty'), num: true, get: r => Fmt.num(Math.max(isFinite(r.penaltyLow) ? r.penaltyLow : 0, isFinite(r.penaltyHigh) ? r.penaltyHigh : 0), 3) }], J.results, { csvName: 'penalidades_jar' });
  el('b6jCite').innerHTML = '';
  citeMethod('b6jCite', [Refs.short('xiong2006'), Refs.short('lawless2010')]);
  state.sensory = Object.assign(state.sensory || {}, { jar: flagged.length });
  Report.set('sensory:jar', { order: 62, title: ['Punto justo y penalidades', 'Just-about-right and penalties'], html: () => el('b6jRead').innerHTML + PHRep.fig('b6-penalidades') + PHRep.table('b6jTab') });
}

/* ---------------- 4. CATA ---------------- */
function cataRun(D) {
  const m = D.map;
  const rows = D.rows.map(r => { const o = { consumer: r[m.consumer], product: r[m.product] }; (m.attrs || []).forEach(a => { o[a] = +r[a] === 1 ? 1 : 0; }); return o; });
  const C = Sens.cata(rows, { attributes: m.attrs });
  S.c = C;
  el('b6cOut').hidden = false;
  const sig = C.perAttribute.filter(a => a.p < 0.05);
  statTiles('b6cTiles', [[T('Consumidores completos', 'Complete consumers'), C.consumersComplete], [T('Términos', 'Terms'), C.attributes.length], [T('Discriminan productos', 'Discriminate products'), sig.length, 'Q ' + T('de Cochran', 'Cochran\'s') + ', p < 0.05', 'hi'], C.ca ? [T('Inercia en el plano', 'Inertia on the plane'), Fmt.pct(C.ca.cum[Math.min(1, C.ca.cum.length - 1)]), 'χ² ' + Fmt.num(C.ca.chi2, 1)] : null]);
  const prof = C.products.map((p, i) => ({ p, top: C.attributes.map((a, j) => [a, C.pct[i][j]]).sort((x, y) => y[1] - x[1]).slice(0, 3) }));
  el('b6cRead').innerHTML = `<div class="reading"><p>${L2(`Discriminan entre productos: <b>${sig.map(a => esc(a.attribute)).join(', ') || 'ninguno'}</b> (Q de Cochran, p < 0.05). Lo más marcado en cada producto: `, `Discriminating between products: <b>${sig.map(a => esc(a.attribute)).join(', ') || 'none'}</b> (Cochran's Q, p < 0.05). Most checked in each product: `)}${prof.map(x => `<b>${esc(x.p)}</b> ${x.top.map(t => esc(t[0]) + ' ' + Fmt.num(t[1], 0) + ' %').join(', ')}`).join('; ')}.</p></div>`;
  el('b6cFig').innerHTML = ''; el('b6cFig2').innerHTML = '';
  if (C.ca && C.ca.eig.length >= 2) {
    const ca = C.ca;
    Fig.put('b6cFig', Plot.biplot({ name: 'b6-cata-ac', rows: { names: ca.row.names, x: ca.row.coord.map(r => r[0]), y: ca.row.coord.map(r => r[1]) }, cols: { names: ca.col.names, x: ca.col.coord.map(r => r[0]), y: ca.col.coord.map(r => r[1]) }, xlab: T('Dimensión 1', 'Dimension 1') + ' (' + Fmt.num(ca.pct[0], 1) + ' %)', ylab: T('Dimensión 2', 'Dimension 2') + ' (' + Fmt.num(ca.pct[1], 1) + ' %)', rowsName: T('productos', 'products'), colsName: T('términos', 'terms') }),
      { name: 'b6-cata-ac', title: L2('Análisis de correspondencias de las frecuencias', 'Correspondence analysis of the frequencies'), caption: L2('Mapa simétrico: un producto cerca de un término se describe con él más que el promedio.', 'Symmetric map: a product near a term is described by it more than average.'), block: 6 });
  }
  Fig.put('b6cFig2', Plot.bars({ name: 'b6-cata-frec', cats: C.attributes, groups: C.products, values: C.pct, ylab: T('% de consumidores que lo marcaron', '% of consumers who checked it'), h: 360 }), { name: 'b6-cata-frec', title: L2('Frecuencia de cada término', 'Frequency of each term'), block: 6 });
  buildTable('b6cTab', [{ key: 'attribute', label: L2('Término', 'Term') }].concat(C.products.map((p, i) => ({ key: 'p' + i, label: esc(p), num: true, get: a => Fmt.num(C.pct[i][C.attributes.indexOf(a.attribute)], 1) + ' %' }))).concat([{ key: 'Q', label: 'Q', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'p', label: 'p', num: true, fmt: Fmt.p }, { key: 'pairs', label: L2('Pares que difieren (Holm)', 'Differing pairs (Holm)'), get: a => a.pairs.filter(q => q.pAdj < 0.05).map(q => q.a + '–' + q.b).join(', ') || '—' }]),
    C.perAttribute.map(a => Object.assign({ _class: a.p < 0.05 ? 'best' : '' }, a)), { csvName: 'cata' });
  el('b6cCite').innerHTML = '';
  citeMethod('b6cCite', [Refs.short('meyners2013'), 'Q: ' + Refs.short('cochran1950'), 'McNemar: ' + Refs.short('mcnemar1947'), [T('Correspondencias: ', 'Correspondence analysis: ') + Refs.short('greenacre2007'), 'Correspondence analysis: ' + Refs.short('greenacre2007')]]);
  state.sensory = Object.assign(state.sensory || {}, { cata: sig.length });
  Report.set('sensory:cata', { order: 63, title: ['CATA', 'CATA'], html: () => el('b6cRead').innerHTML + PHRep.fig('b6-cata-ac') + PHRep.table('b6cTab') });
}

/* ---------------- 5. descriptive profile ---------------- */
function qdaRun(D) {
  const m = D.map;
  const rows = D.rows.map(r => { const o = { panelist: r[m.panelist], product: r[m.product] }; if (m.session) o.session = r[m.session]; (m.attrs || []).forEach(a => { o[a] = r[a] == null ? NaN : +r[a]; }); return o; });
  const Q = Sens.qda(rows, { attributes: m.attrs, multcomp: UI.s('b6qMC') });
  S.q = Q;
  el('b6qOut').hidden = false;
  const disc = Q.results.filter(r => r.pProductMixed < 0.05);
  const meansM = Q.products.map(p => Q.results.map(r => r.means.find(x => x.product === p).mean));
  const pca = Q.products.length >= 3 ? Sens.pca(meansM, { rowNames: Q.products, colNames: Q.attributes }) : null;
  S.q.pca = pca; S.q.meansM = meansM;
  statTiles('b6qTiles', [[T('Jueces', 'Judges'), Q.panelists.length], [T('Productos', 'Products'), Q.products.length], [T('Atributos que discriminan', 'Discriminating attributes'), disc.length + ' / ' + Q.attributes.length, T('producto contra la interacción', 'product against the interaction'), 'hi'], pca ? [T('ACP: dos primeras dimensiones', 'PCA: first two dimensions'), Fmt.pct(pca.cum[Math.min(1, pca.cum.length - 1)])] : null]);
  el('b6qRead').innerHTML = `<div class="reading"><p>${L2(`Los productos difieren en <b>${disc.map(r => esc(r.attribute)).join(', ') || 'ningún atributo'}</b>. Con repeticiones, el efecto de producto se prueba contra la interacción producto × juez, que trata a los jueces como una muestra de jueces posibles: así la conclusión vale para el panel, no sólo para estos ${Q.panelists.length} jueces.`, `The products differ in <b>${disc.map(r => esc(r.attribute)).join(', ') || 'no attribute'}</b>. With replicates, the product effect is tested against the product × judge interaction, which treats the judges as a sample of possible judges: the conclusion then holds for the panel, not only for these ${Q.panelists.length} judges.`)}</p></div>`;
  el('b6qFig1').innerHTML = ''; el('b6qFig2').innerHTML = '';
  Fig.put('b6qFig1', Plot.radar({ name: 'b6-arana', w: 560, h: 420, axes: Q.attributes, series: Q.products.map((p, i) => ({ name: p, values: meansM[i] })), min: 0, max: Math.ceil(Math.max(...meansM.flat()) + 0.5) }), { name: 'b6-arana', title: L2('Perfil sensorial (gráfica de araña)', 'Sensory profile (spider chart)'), block: 6 });
  if (pca && pca.eig.length >= 2) {
    const sc = Math.max(...pca.ind.coord.flat().map(Math.abs)) / Math.max(...pca.var.coord.flat().map(Math.abs));
    Fig.put('b6qFig2', Plot.biplot({ name: 'b6-mapa-productos', w: 560, h: 420, arrows: true, rows: { names: Q.products, x: pca.ind.coord.map(r => r[0]), y: pca.ind.coord.map(r => r[1]) }, cols: { names: Q.attributes, x: pca.var.coord.map(r => r[0] * sc * 0.9), y: pca.var.coord.map(r => r[1] * sc * 0.9) }, xlab: 'CP1 (' + Fmt.num(pca.pct[0], 1) + ' %)', ylab: 'CP2 (' + Fmt.num(pca.pct[1], 1) + ' %)', rowsName: T('productos', 'products'), colsName: T('atributos', 'attributes') }),
      { name: 'b6-mapa-productos', title: L2('Mapa de productos (ACP de las medias)', 'Product map (PCA of the means)'), caption: L2('Flechas: correlación de cada atributo con los componentes, reescaladas.', 'Arrows: correlation of each attribute with the components, rescaled.'), block: 6 });
  }
  buildTable('b6qTab', [{ key: 'attribute', label: L2('Atributo', 'Attribute') }, { key: 'F', label: L2('F producto', 'F product'), num: true, get: r => Fmt.num(r.fProductMixed, 2) }, { key: 'p', label: 'p', num: true, get: r => Fmt.p(r.pProductMixed) }].concat(Q.products.map(p => ({ key: p, label: esc(p), num: true, html: true, get: r => Fmt.num(r.means.find(x => x.product === p).mean, 2) + ' <span class="letters">' + (r.letters[p] || '') + '</span>' }))),
    Q.results.map(r => Object.assign({ _class: r.pProductMixed < 0.05 ? 'best' : '' }, r)), { csvName: 'perfil_descriptivo' });
  /* panel performance */
  const ps = Q.panelSummary;
  /* flags relative to the panel: few replicates give each judge's own ANOVA little power, so the cut-offs are lenient
     (median p above 0.20), absolute for agreement (median r below 0.5) and relative for repeatability (above 1.5 times
     the panel's median) */
  const repMed = Num.median(ps.map(p => p.meanRepeatability).filter(isFinite));
  ps.forEach(p => { p.flags = []; if (p.medianP > 0.2) p.flags.push(T('discrimina poco', 'discriminates little')); if (p.medianAgreement < 0.5) p.flags.push(T('no coincide con el panel', 'disagrees with the panel')); if (p.meanRepeatability > 1.5 * repMed) p.flags.push(T('repite poco', 'repeats poorly')); });
  const weak = ps.filter(p => p.flags.length);
  const noisy = ps.slice().sort((a, b) => b.meanRepeatability - a.meanRepeatability)[0];
  el('b6qPRead').innerHTML = `<div class="reading"><p>${L2(`Un buen juez <b>discrimina</b> (su ANOVA por producto es significativo), <b>repite</b> (su desviación residual es baja) y <b>coincide</b> con el panel (correlación alta entre sus medias y las del panel). ${weak.length ? 'Conviene reentrenar o revisar a: ' + weak.map(p => '<b>' + esc(p.panelist) + '</b> (' + p.flags.join(', ') + ')').join('; ') + '.' : 'Ningún juez se aparta claramente.'} El menos repetible es <b>${esc(noisy.panelist)}</b> (DE residual media ${Fmt.num(noisy.meanRepeatability, 2)}).`, `A good judge <b>discriminates</b> (their ANOVA by product is significant), <b>repeats</b> (low residual deviation) and <b>agrees</b> with the panel (high correlation between their means and the panel's). ${weak.length ? 'Consider retraining or checking: ' + weak.map(p => '<b>' + esc(p.panelist) + '</b> (' + p.flags.join(', ') + ')').join('; ') + '.' : 'No judge clearly departs.'} The least repeatable is <b>${esc(noisy.panelist)}</b> (mean residual SD ${Fmt.num(noisy.meanRepeatability, 2)}).`)}</p></div>`;
  buildTable('b6qPTab', [{ key: 'panelist', label: L2('Juez', 'Judge') }, { key: 'nDiscriminating', label: L2('Atributos que discrimina', 'Attributes discriminated'), num: true, get: p => p.nDiscriminating + ' / ' + p.attributes }, { key: 'medianP', label: L2('p mediano', 'Median p'), num: true, get: p => Fmt.p(p.medianP) }, { key: 'meanRepeatability', label: L2('Repetibilidad (DE residual)', 'Repeatability (residual SD)'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'medianAgreement', label: L2('Acuerdo (r mediano)', 'Agreement (median r)'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'flags', label: L2('Revisar', 'Check'), get: p => p.flags.join(', ') || '—' }],
    ps.map(p => Object.assign({ _class: weak.includes(p) ? 'bad' : '' }, p)), { csvName: 'desempeno_panel' });
  const sel = el('b6qAttr'), v = sel.value;
  sel.innerHTML = Q.attributes.map(a => `<option value="${esc(a)}">${esc(a)}</option>`).join('');
  sel.value = Q.attributes.includes(v) ? v : Q.attributes[0];
  qdaDetail();
  el('b6qCite').innerHTML = '';
  citeMethod('b6qCite', [Refs.short('stone1974'), Refs.short('naes2010'), [T('ACP: ', 'PCA: ') + Refs.short('jolliffe2002'), 'PCA: ' + Refs.short('jolliffe2002')]]);
  state.sensory = Object.assign(state.sensory || {}, { qda: disc.length });
  Report.set('sensory:qda', { order: 64, title: ['Perfil descriptivo', 'Descriptive profile'], html: () => el('b6qRead').innerHTML + PHRep.fig('b6-arana') + PHRep.fig('b6-mapa-productos') + PHRep.table('b6qTab') + el('b6qPRead').innerHTML + PHRep.table('b6qPTab') });
}
function qdaDetail() {
  if (!S.q) return;
  const r = S.q.results.find(x => x.attribute === UI.s('b6qAttr'));
  if (!r) return;
  el('b6qPDet').innerHTML = '';
  const host = mk('div');
  el('b6qPDet').appendChild(host);
  buildTable(host, [{ key: 'source', label: L2('Fuente', 'Source'), get: q => ({ product: T('Producto', 'Product'), panelist: T('Juez', 'Judge'), session: T('Sesión', 'Session'), 'product:panelist': T('Producto × juez', 'Product × judge'), residual: T('Error', 'Error'), Residuals: T('Error', 'Error') }[q.source] || q.source) }, { key: 'df', label: 'gl', num: true }, { key: 'ss', label: 'SC', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'ms', label: 'CM', num: true, fmt: v => Fmt.num(v, 3) }, { key: 'F', label: 'F', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'p', label: 'p', num: true, fmt: Fmt.p }], r.anova);
  const host2 = mk('div');
  el('b6qPDet').appendChild(host2);
  buildTable(host2, [{ key: 'panelist', label: L2('Juez', 'Judge') }, { key: 'fProduct', label: L2('F producto', 'F product'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'pProduct', label: 'p', num: true, fmt: Fmt.p }, { key: 'repeatability', label: L2('DE residual', 'Residual SD'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'agreement', label: L2('Acuerdo (r)', 'Agreement (r)'), num: true, fmt: v => Fmt.num(v, 2) }], r.panelists);
}

/* ---------------- 6. ballots ---------------- */
function ballotRun() {
  const prods = UI.s('b6bProds').split(',').map(s => s.trim()).filter(Boolean);
  const nJ = Math.max(1, Math.round(UI.v('b6bN'))), seed = Math.round(UI.v('b6bSeed')) || 1, type = UI.s('b6bType');
  let plan, rows = [];
  if (type === 'triangle') {
    if (prods.length < 2) return;
    const A = prods[0], B = prods[1], combos = ['AAB', 'ABA', 'BAA', 'BBA', 'BAB', 'ABB'];
    const rng = Num.rng(seed), codes = Sens.codes(Math.min(900, 3 * nJ), seed + 1);
    const order = rng.shuffle(combos.slice());
    plan = Array.from({ length: nJ }, (_, a) => ({ assessor: a + 1, combo: order[a % 6], order: order[a % 6].split('').map((c, k) => ({ position: k + 1, product: c === 'A' ? A : B, code: codes[(3 * a + k) % codes.length] })) }));
    plan.balanced = nJ % 6 === 0;
  } else {
    plan = Sens.servingPlan(nJ, prods, seed, { codePerAssessor: UI.on('b6bPer') });
  }
  plan.forEach(p => p.order.forEach(o => rows.push([p.assessor, o.position, o.product, o.code])));
  S.b = { plan, type, prods };
  el('b6bOut').hidden = false; el('b6bPrint').disabled = false; el('b6bCSV').disabled = false;
  const nRows = type === 'triangle' ? 6 : (prods.length % 2 ? 2 * prods.length : prods.length);
  el('b6bRead').innerHTML = `<div class="reading"><p>${plan.balanced ? L2(`El plan está <b>balanceado</b>: ${nJ} jueces es múltiplo de los ${nRows} órdenes.`, `The plan is <b>balanced</b>: ${nJ} judges is a multiple of the ${nRows} orders.`) : L2(`Con ${nJ} jueces el balance no es completo: usa un múltiplo de ${nRows} (por ejemplo ${Math.ceil(nJ / nRows) * nRows}).`, `With ${nJ} judges the balance is not complete: use a multiple of ${nRows} (for instance ${Math.ceil(nJ / nRows) * nRows}).`)}</p></div>`;
  buildTable('b6bTab', [{ key: 'assessor', label: L2('Juez', 'Judge'), num: true }].concat((plan[0] ? plan[0].order : []).map((_, k) => ({ key: 'p' + k, label: L2('Posición ', 'Position ') + (k + 1), get: p => p.order[k].code + ' · ' + p.order[k].product }))), plan, { csvName: 'plan_de_servicio' });
  el('b6bPrev').innerHTML = plan.slice(0, 4).map(p => `<div class="ballot"><h4>${esc(UI.s('b6bTitle'))} · ${L2('Juez', 'Judge')} ${p.assessor}</h4><div class="codes">${p.order.map(o => `<span class="code">${o.code}</span>`).join('')}</div></div>`).join('');
  el('b6bCite').innerHTML = '';
  citeMethod('b6bCite', [Refs.short('williams1949'), Refs.short('macfie1989')]);
  S.b.csv = Out.csvText([T('juez', 'judge'), T('posicion', 'position'), T('producto', 'product'), T('codigo', 'code')], rows);
}
function ballotPrint() {
  if (!S.b) return;
  const { plan, type } = S.b, title = UI.s('b6bTitle'), attrs = UI.s('b6bAttrs').split(',').map(s => s.trim()).filter(Boolean);
  const scale = HEDONIC.map((h, i) => `<tr><td class="box"></td><td>${9 - i}</td><td>${esc(T(h[0], h[1]))}</td></tr>`).join('');
  const body = plan.map(p => {
    let inner;
    if (type === 'triangle') inner = `<p>${T('Pruebe las tres muestras de izquierda a derecha. Dos son iguales y una es diferente. Encierre en un círculo el código de la muestra diferente. Si no está seguro, elija una.', 'Taste the three samples from left to right. Two are identical and one is different. Circle the code of the different sample. If unsure, choose one.')}</p><div class="codes">${p.order.map(o => `<span class="code">${o.code}</span>`).join('')}</div>`;
    else if (type === 'qda') inner = p.order.map(o => `<h3>${T('Muestra', 'Sample')} <span class="code">${o.code}</span></h3>` + attrs.map(a => `<div class="line"><span class="lab">${esc(a)}</span><span class="scale"><i>${T('poco', 'low')}</i><b></b><i>${T('mucho', 'high')}</i></span></div>`).join('')).join('');
    else inner = `<p>${T('Pruebe las muestras en el orden indicado y marque cuánto le gusta cada una. Enjuague su boca con agua entre muestras.', 'Taste the samples in the order shown and mark how much you like each one. Rinse your mouth with water between samples.')}</p>` + p.order.map(o => `<h3>${T('Muestra', 'Sample')} <span class="code">${o.code}</span></h3><table>${scale}</table>`).join('');
    return `<section class="ballot"><header><b>${esc(title)}</b><span>${T('Juez', 'Judge')} ${p.assessor} · ${T('Fecha', 'Date')}: ____________</span></header>${inner}<p class="cm">${T('Comentarios', 'Comments')}: ______________________________________________</p></section>`;
  }).join('');
  const css = 'body{font-family:system-ui,sans-serif;color:#111;margin:0}.ballot{page-break-after:always;padding:18mm 16mm}header{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:6px;margin-bottom:12px;font-size:14px}.code{font-family:ui-monospace,monospace;font-weight:700;font-size:20px;border:2px solid #111;border-radius:8px;padding:4px 12px;margin-right:12px;display:inline-block}h3{font-size:15px;margin:16px 0 6px}table{border-collapse:collapse}td{padding:3px 8px;font-size:13px}td.box{width:14px;height:14px;border:1.5px solid #111}.line{display:flex;align-items:center;gap:12px;margin:8px 0;font-size:13px}.lab{width:120px}.scale{display:flex;align-items:center;gap:6px;flex:1}.scale b{flex:1;height:0;border-top:1.5px solid #111;position:relative}.scale i{font-size:11px;color:#444}.cm{margin-top:18px;font-size:13px}@page{size:letter;margin:0}';
  const w = window.open('', '_blank');
  if (!w) { if (window.LABG) LABG.toast(T('El navegador bloqueó la ventana: permite ventanas emergentes para imprimir.', 'The browser blocked the window: allow pop-ups to print.'), { type: 'warning' }); return; }
  w.document.write(`<!doctype html><html lang="${I18N.lang}"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body>${body}<script>setTimeout(()=>print(),300)<\/script></body></html>`);
  w.document.close();
}

/* ---------------- start ---------------- */
document.addEventListener('DOMContentLoaded', () => {
  const P = el('panel-6');
  P.innerHTML = UI.panel(6, 'Evaluación sensorial', 'Sensory evaluation', 'Pruebas discriminativas, afectivas y descriptivas, con el diseño de las catas', 'Discrimination, affective and descriptive tests, with the design of the tastings', tools);
  P.querySelector('.panel-title').insertAdjacentHTML('afterend', `<p class="hint">${L2('Para pruebas avanzadas, paneles y mapas de preferencia, ver <b>SensorialPro</b>, de la misma suite: abre sin cambios los CSV que se exportan aquí.', 'For advanced tests, panels and preference maps, see <b>SensorialPro</b>, of the same suite: it opens the CSV files exported here without changes.')}</p>`);
  if (window.I18N) I18N.apply(P);
  dTable = EditTable.mount('b6dTable', {
    id: 'b6d',
    columns: [{ key: 'name', es: 'Prueba', en: 'Test', type: 'text', width: 215 }, { key: 'method', es: 'Método', en: 'Method', type: 'select', options: METH_OPTS }, { key: 'x', es: 'Correctas', en: 'Correct', type: 'num', step: 1 }, { key: 'n', es: 'Total', en: 'Total', type: 'num', step: 1 }, { key: 'test', es: 'Tipo', en: 'Kind', type: 'select', options: [['difference', 'Diferencia', 'Difference'], ['similarity', 'Similitud', 'Similarity']] }, { key: 'pd0', es: 'pd₀ (similitud)', en: 'pd₀ (similarity)', type: 'num' }],
    rows: [{ name: T('Prueba 1', 'Test 1'), method: 'triangle', x: 21, n: 42, test: 'difference', pd0: 0.2 }],
    blank: () => ({ name: '', method: 'triangle', x: null, n: null, test: 'difference', pd0: 0.2 }),
    onChange: discrimRun,
  });
  const mapM = { 'Triangular': 'triangle', 'Dúo-trío': 'duotrio', 'Dos alternativas (2-AFC)': 'twoAFC' };
  const loadD = () => { dTable.set(Datasets.rows('cafeDiscriminativas').map(r => ({ name: r.muestras, method: mapM[r.prueba] || 'triangle', x: r.correctas, n: r.total, test: 'difference', pd0: 0.2 }))); discrimRun(); };
  el('b6dEx').addEventListener('click', loadD);
  window.PHLoad.b6d = loadD;
  ['b6dConf', 'b6dStat'].forEach(id => el(id).addEventListener('change', discrimRun));
  ['b6pM', 'b6pD', 'b6pA', 'b6pPow', 'b6pN'].forEach(id => el(id).addEventListener('change', planRun));
  ['b6aX1', 'b6aN1', 'b6aX2', 'b6aN2'].forEach(id => el(id).addEventListener('input', aNotARun));
  ['b6fA', 'b6fB', 'b6fN', 'b6fT'].forEach(id => { el(id).addEventListener('input', prefRun); el(id).addEventListener('change', prefRun); });
  discrimRun(); planRun(); aNotARun(); prefRun();
  const cons = ['consumidor', 'consumer', 'panelista', 'id'], prod = ['cafe', 'café', 'producto', 'product', 'muestra', 'sample', 'tratamiento'];
  const h = DataIn.mount('b6hIn', { id: 'b6h', roles: [{ key: 'consumer', es: 'Consumidor', en: 'Consumer', match: cons }, { key: 'product', es: 'Producto', en: 'Product', match: prod }, { key: 'score', es: 'Agrado', en: 'Liking', type: 'num', match: ['agrado', 'liking', 'hedonica', 'score', 'gusto'] }], examples: [{ id: 'cafeConsumidores' }], onData: hedRun });
  window.PHLoad.b6h = () => h.load(0);
  const j = DataIn.mount('b6jIn', { id: 'b6j', roles: [{ key: 'consumer', es: 'Consumidor', en: 'Consumer', match: cons }, { key: 'product', es: 'Producto', en: 'Product', match: prod }, { key: 'liking', es: 'Agrado', en: 'Liking', type: 'num', match: ['agrado', 'liking', 'score'] }, { key: 'attrs', es: 'Atributos de punto justo', en: 'Just-about-right attributes', multi: true, auto: cols => cols.filter(c => /^jar[_ ]/i.test(c)) }], examples: [{ id: 'cafeConsumidores' }], onData: jarRun });
  window.PHLoad.b6j = () => j.load(0);
  ['b6jL', 'b6jTh'].forEach(id => el(id).addEventListener('change', () => j.refire()));
  const binCols = (cols, rows, used) => cols.filter(c => !used.includes(c) && !/^jar[_ ]/i.test(c) && rows.every(r => r[c] === 0 || r[c] === 1 || r[c] == null) && rows.some(r => r[c] === 1));
  const c = DataIn.mount('b6cIn', { id: 'b6c', roles: [{ key: 'consumer', es: 'Consumidor', en: 'Consumer', match: cons }, { key: 'product', es: 'Producto', en: 'Product', match: prod }, { key: 'attrs', es: 'Términos (0/1)', en: 'Terms (0/1)', multi: true, auto: binCols }], examples: [{ id: 'cafeConsumidores' }], onData: cataRun });
  window.PHLoad.b6c = () => c.load(0);
  const q = DataIn.mount('b6qIn', { id: 'b6q', roles: [{ key: 'panelist', es: 'Juez', en: 'Judge', match: ['juez', 'panelista', 'judge', 'panelist', 'assessor', 'evaluador'] }, { key: 'product', es: 'Producto', en: 'Product', match: prod }, { key: 'session', es: 'Sesión o repetición', en: 'Session or replicate', optional: true, match: ['sesion', 'session', 'rep', 'repeticion', 'replicate'] }, { key: 'attrs', es: 'Atributos', en: 'Attributes', multi: true }], examples: [{ id: 'cafeQDA' }], onData: qdaRun });
  window.PHLoad.b6q = () => q.load(0);
  el('b6qMC').addEventListener('change', () => q.refire());
  el('b6qAttr').addEventListener('change', qdaDetail);
  el('b6qSend').addEventListener('click', () => {
    if (!S.q) return;
    Send.to('PCAPro', { kind: 'sensory-profile', name: 'perfil_medias_productos', csv: Out.csvText([T('producto', 'product')].concat(S.q.attributes), S.q.products.map((p, i) => [p].concat(S.q.meansM[i]))), note: 'Product × attribute means of a descriptive panel' });
  });
  el('b6bGo').addEventListener('click', ballotRun);
  el('b6bPrint').addEventListener('click', ballotPrint);
  el('b6bCSV').addEventListener('click', () => { if (S.b) download(S.b.csv, 'plan_de_servicio.csv', 'text/csv;charset=utf-8'); });
});
document.addEventListener('langchange', () => {
  ['b6h', 'b6j', 'b6c', 'b6q'].forEach(id => { const d = DataIn.registry[id]; if (d && d.get()) d.refire(); });
  discrimRun(); planRun(); aNotARun(); prefRun();
});
})();
