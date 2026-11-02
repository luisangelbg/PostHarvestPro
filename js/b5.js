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

/* PostHarvestPro — Block 5, postharvest losses and the value chain: losses by
   stage in quantity and value with the Sankey of the chain and its critical
   points, the what-if of improving a stage, and mechanical damage curves. */
(function () {
'use strict';
const S = { ch: null, d: null };
const tools = [
  { id: 'cadena', es: 'Pérdidas por etapa', en: 'Losses by stage', html: `
    <div class="card"><h2>${L2('La cadena', 'The chain')}</h2>
      <p class="hint">${L2('Las etapas en orden, con lo que se pierde en cada una (en % de lo que entra a esa etapa, o en kg) y el precio del kilo en esa etapa. Lo perdido en una etapa ya no llega a la siguiente.', 'The stages in order, with what is lost at each (in % of what enters that stage, or in kg) and the price of a kilogram at that stage. What is lost at one stage never reaches the next.')}</p>
      <div class="ex-strip"><div class="ex-t"><b>${L2(Datasets.INFO.jitomateCadena.es, Datasets.INFO.jitomateCadena.en)}</b><span class="ex-sim">${L2('simulado', 'simulated')}</span><br>${L2(Datasets.INFO.jitomateCadena.d[0], Datasets.INFO.jitomateCadena.d[1])}</div><div class="btn-row" style="margin:0"><button type="button" class="btn btn-secondary btn-sm" id="b5cEx">${L2('Cargar ejemplo', 'Load example')}</button></div></div>
      <div id="b5cTable"></div>
      <div class="form-grid tight">${UI.num('b5cIni', 'Cantidad que entra a la cadena (kg)', 'Quantity entering the chain (kg)', 10000)}${UI.text('b5cCur', 'Moneda', 'Currency', '$')}</div></div>
    <div id="b5cOut" hidden><div class="card"><h2>${L2('Pérdidas en cantidad y valor', 'Losses in quantity and value')}</h2><div id="b5cTiles"></div><div id="b5cRead"></div><div id="b5cSankey"></div><div class="figs-2"><div id="b5cFig1"></div><div id="b5cFig2"></div></div><div id="b5cTab"></div><h3>${L2('Puntos críticos (Pareto)', 'Critical points (Pareto)')}</h3><div id="b5cPar"></div>
      <div class="btn-row"><button type="button" class="btn btn-accent btn-sm" id="b5cSend">${L2('Enviar a EconomicsPro →', 'Send to EconomicsPro →')}</button></div><div id="b5cCite"></div></div></div>` },
  { id: 'mejoras', es: 'Simular mejoras', en: 'Simulate improvements', html: `
    <div class="card"><h2>${L2('¿Qué pasa si se reduce la pérdida de una etapa?', 'What if the loss of one stage falls?')}</h2>
      <p class="hint">${L2('Usa la cadena de «Pérdidas por etapa». La reducción es relativa: 50 % quiere decir perder la mitad de lo que se pierde hoy en esa etapa.', 'It uses the chain of «Losses by stage». The reduction is relative: 50 % means losing half of what is lost today at that stage.')}</p>
      <div class="form-grid tight">${UI.sel('b5mStage', 'Etapa', 'Stage', [], '')}${UI.num('b5mRed', 'Reducción de su pérdida (%)', 'Reduction of its loss (%)', 50, { min: 0, max: 100 })}</div>
      <div id="b5mMsg" class="messages"></div></div>
    <div class="card" id="b5mOut" hidden><h2>${L2('Resultado de la simulación', 'Result of the simulation')}</h2><div id="b5mTiles"></div><div id="b5mRead"></div><div id="b5mFig"></div><div id="b5mTab"></div></div>` },
  { id: 'dano', es: 'Daño mecánico', en: 'Mechanical damage', html: `
    <div class="card"><h2>${L2('Ensayo de impacto o compresión', 'Impact or compression test')}</h2>
      <p class="hint">${L2('Una fila por fruto: la altura de caída (o la energía, o la fuerza) y el tamaño del daño; opcionalmente si quedó dañado (0/1) y su masa, para calcular la energía del impacto.', 'One row per fruit: the drop height (or the energy, or the force) and the size of the bruise; optionally whether it was bruised (0/1) and its mass, to compute the impact energy.')}</p>
      <div id="b5dIn"></div></div>
    <div id="b5dOut" hidden><div class="card"><h2>${L2('Curvas de daño', 'Damage curves')}</h2><div id="b5dTiles"></div><div id="b5dRead"></div><div class="figs-2"><div id="b5dFig1"></div><div id="b5dFig2"></div></div><div id="b5dTab"></div><div id="b5dCite"></div></div></div>` },
];

let cTable;
const cur = () => UI.s('b5cCur') || '$';
const money = v => cur() + ' ' + Fmt.num(v, 0);
const stages = () => cTable.get().filter(s => s.name && (isFinite(s.pct) || isFinite(s.kg))).map(s => ({ name: s.name, pct: s.pct, kg: s.kg === null || s.kg === '' ? null : s.kg, price: s.price }));
function chainRun() {
  const st = stages(), ini = UI.v('b5cIni');
  if (!st.length || !(ini > 0)) { el('b5cOut').hidden = true; return; }
  const ch = Loss.chain(st, ini);
  S.ch = { ch, st, ini };
  el('b5cOut').hidden = false;
  statTiles('b5cTiles', [
    [T('Entra a la cadena', 'Enters the chain'), Fmt.num(ini, 0) + ' kg'], [T('Llega al final', 'Reaches the end'), Fmt.num(ch.delivered, 0) + ' kg', Fmt.pct(100 * ch.delivered / ini), 'good'],
    [T('Se pierde', 'Is lost'), Fmt.num(ch.lost, 0) + ' kg', T('índice de pérdidas ', 'loss index ') + Fmt.pct(ch.lossIndex), 'bad'],
    [T('Valor perdido', 'Value lost'), money(ch.value), T('a precio de cada etapa', 'at the price of each stage'), 'warn'],
    [T('Valor al precio final', 'Value at the final price'), money(ch.valueAtMarket), T('lo que el mercado habría pagado', 'what the market would have paid')],
  ]);
  const ck = ch.criticalKg.map(i => ch.rows[i].name), cv = ch.criticalValue.map(i => ch.rows[i].name);
  const topKg = ch.byKg[0], topV = ch.byValue[0];
  el('b5cRead').innerHTML = `<div class="reading"><p>${L2(`De cada 100 kg que entran, llegan al final <b>${Fmt.num(100 * ch.delivered / ini, 1)}</b>. La etapa que más kilos pierde es <b>${esc(topKg.name)}</b> (${Fmt.pct(topKg.share)} de la pérdida); la que más dinero pierde es <b>${esc(topV.name)}</b> (${Fmt.pct(topV.share)} del valor perdido)${topKg.name !== topV.name ? ', porque ahí cada kilo ya vale más' : ''}.`, `Of every 100 kg that enter, <b>${Fmt.num(100 * ch.delivered / ini, 1)}</b> reach the end. The stage that loses most kilograms is <b>${esc(topKg.name)}</b> (${Fmt.pct(topKg.share)} of the loss); the one that loses most money is <b>${esc(topV.name)}</b> (${Fmt.pct(topV.share)} of the value lost)${topKg.name !== topV.name ? ', because there each kilogram is already worth more' : ''}.`)}</p><p>${L2(`Puntos críticos (las etapas que juntas suman el 80 %): en cantidad, ${ck.map(esc).join(', ')}; en valor, ${cv.map(esc).join(', ')}.`, `Critical points (the stages that together add up to 80 %): in quantity, ${ck.map(esc).join(', ')}; in value, ${cv.map(esc).join(', ')}.`)}</p></div>`;
  const W = 760, H = 320;
  const lay = Loss.sankey(ch, W, H, { top: 46, band: 0.4, padL: 30, padR: 40 });
  el('b5cSankey').innerHTML = '';
  Fig.put('b5cSankey', Plot.sankey({ name: 'b5-sankey', layout: lay, w: W, h: H, critical: ch.criticalValue, startName: T('Entrada', 'Input'), fmtKg: v => Fmt.num(v, 0) + ' kg', fmtPct: v => Fmt.num(v, 1) + ' %' }),
    { name: 'b5-sankey', title: L2('Flujo de producto en la cadena', 'Flow of produce along the chain'), caption: L2('Verde: lo que pasa a la siguiente etapa; rojo: lo que se pierde (más oscuro en los puntos críticos de valor).', 'Green: what moves to the next stage; red: what is lost (darker at the critical points by value).'), block: 5 });
  el('b5cFig1').innerHTML = ''; el('b5cFig2').innerHTML = '';
  Fig.put('b5cFig1', Plot.bars({ name: 'b5-perdida-kg', w: 520, h: 330, cats: ch.rows.map(r => r.name), values: ch.rows.map(r => r.lost), ylab: T('Pérdida (kg)', 'Loss (kg)'), horizontal: true, colors: ch.rows.map(() => 'var(--s7)'), valueLabels: v => Fmt.num(v, 0) }), { name: 'b5-perdida-kg', title: L2('Pérdida por etapa (kg)', 'Loss by stage (kg)'), block: 5 });
  Fig.put('b5cFig2', Plot.bars({ name: 'b5-perdida-valor', w: 520, h: 330, cats: ch.rows.map(r => r.name), values: ch.rows.map(r => r.value), ylab: T('Valor perdido', 'Value lost') + ' (' + cur() + ')', horizontal: true, colors: ch.rows.map(() => 'var(--s5)'), valueLabels: v => Fmt.num(v, 0) }), { name: 'b5-perdida-valor', title: L2('Valor perdido por etapa', 'Value lost by stage'), block: 5 });
  buildTable('b5cTab', [{ key: 'name', label: L2('Etapa', 'Stage') }, { key: 'input', label: L2('Entra (kg)', 'In (kg)'), num: true, fmt: v => Fmt.num(v, 0) }, { key: 'lost', label: L2('Pierde (kg)', 'Lost (kg)'), num: true, fmt: v => Fmt.num(v, 0) }, { key: 'pct', label: L2('% de lo que entra', '% of input'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'pctOfInitial', label: L2('% del total inicial', '% of the initial total'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'cumPct', label: L2('% acumulado', 'Cumulative %'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'price', label: L2('Precio', 'Price'), num: true, fmt: v => Fmt.num(v, 2) }, { key: 'value', label: L2('Valor perdido', 'Value lost'), num: true, fmt: v => Fmt.num(v, 0) }, { key: 'output', label: L2('Sale (kg)', 'Out (kg)'), num: true, fmt: v => Fmt.num(v, 0) }], ch.rows, { csvName: 'perdidas_por_etapa' });
  buildTable('b5cPar', [{ key: 'name', label: L2('Etapa', 'Stage') }, { key: 'v', label: L2('Kilos perdidos', 'Kilograms lost'), num: true, get: r => Fmt.num(r.v, 0) }, { key: 'share', label: L2('Parte', 'Share'), num: true, get: r => Fmt.pct(r.share) }, { key: 'cum', label: L2('Acumulado', 'Cumulative'), num: true, get: r => Fmt.pct(r.cum) }, { key: 'vv', label: L2('Etapa por valor', 'Stage by value') }],
    ch.byKg.map((r, i) => Object.assign({}, r, { vv: ch.byValue[i].name + ' · ' + Fmt.pct(ch.byValue[i].share) })).map(r => Object.assign(r, { _class: ch.criticalKg.includes(r.i) ? 'best' : '' })));
  el('b5cCite').innerHTML = '';
  citeMethod('b5cCite', [Refs.short('fao2019'), Refs.short('lagra2016')]);
  paintStages();
  simRun();
  state.losses = Object.assign(state.losses || {}, { chain: { index: ch.lossIndex, value: ch.value } });
  Report.set('losses:chain', { order: 50, title: ['Pérdidas en la cadena', 'Losses along the chain'], html: () => el('b5cRead').innerHTML + PHRep.fig('b5-sankey') + PHRep.table('b5cTab') });
}
function paintStages() {
  const sel = el('b5mStage'), v = sel.value, st = stages();
  sel.innerHTML = st.map((s, i) => `<option value="${i}">${esc(s.name)}</option>`).join('');
  sel.value = v && +v < st.length ? v : String(S.ch ? S.ch.ch.byValue[0].i : 0);
}
function simRun() {
  if (!S.ch) { el('b5mOut').hidden = true; clearMessages('b5mMsg'); showMessage('b5mMsg', 'info', T('Primero arma la cadena en «Pérdidas por etapa».', 'First build the chain in «Losses by stage».')); return; }
  clearMessages('b5mMsg');
  const k = +UI.s('b5mStage'), red = Math.max(0, Math.min(100, UI.v('b5mRed')));
  const r = Loss.simulate(S.ch.st, S.ch.ini, k, red), sens = Loss.sensitivity(S.ch.st, S.ch.ini, red);
  el('b5mOut').hidden = false;
  statTiles('b5mTiles', [[T('Llegan además', 'Extra arriving'), Fmt.num(r.gainKg, 0) + ' kg', '', 'good'], [T('Valor ganado al precio final', 'Value gained at the final price'), money(r.gainValue), '', 'hi'], [T('Nuevo índice de pérdidas', 'New loss index'), Fmt.pct(r.newIndex), T('antes ', 'before ') + Fmt.pct(r.base.lossIndex)]]);
  const best = sens.slice().sort((a, b) => b.gainValue - a.gainValue)[0];
  el('b5mRead').innerHTML = `<div class="reading"><p>${L2(`Reducir ${Fmt.num(red, 0)} % la pérdida de <b>${esc(S.ch.st[k].name)}</b> hace llegar ${Fmt.num(r.gainKg, 0)} kg más al final, que valen ${money(r.gainValue)}. Con la misma reducción relativa, la etapa que más rinde es <b>${esc(best.name)}</b> (${money(best.gainValue)}): ahí conviene invertir primero, si el costo de la mejora es parecido.`, `Reducing the loss of <b>${esc(S.ch.st[k].name)}</b> by ${Fmt.num(red, 0)} % brings ${Fmt.num(r.gainKg, 0)} kg more to the end, worth ${money(r.gainValue)}. With the same relative reduction, the stage that pays most is <b>${esc(best.name)}</b> (${money(best.gainValue)}): invest there first, if the cost of the improvement is similar.`)}</p></div>`;
  el('b5mFig').innerHTML = '';
  Fig.put('b5mFig', Plot.bars({ name: 'b5-sensibilidad', cats: sens.map(s => s.name), values: sens.map(s => s.gainValue), ylab: T('Valor ganado', 'Value gained') + ' (' + cur() + ')', horizontal: true, colors: sens.map((s, i) => (i === k ? 'var(--s1)' : 'var(--s3)')), valueLabels: v => Fmt.num(v, 0) }),
    { name: 'b5-sensibilidad', title: L2('Valor ganado al reducir ', 'Value gained by reducing ') + Fmt.num(red, 0) + L2(' % la pérdida de cada etapa', ' % the loss of each stage'), block: 5 });
  buildTable('b5mTab', [{ key: 'name', label: L2('Etapa', 'Stage') }, { key: 'gainKg', label: L2('Kilos que llegan además', 'Extra kilograms arriving'), num: true, fmt: v => Fmt.num(v, 0) }, { key: 'gainValue', label: L2('Valor ganado', 'Value gained'), num: true, fmt: v => Fmt.num(v, 0) }, { key: 'newIndex', label: L2('Nuevo índice (%)', 'New index (%)'), num: true, fmt: v => Fmt.num(v, 2) }], sens, { csvName: 'simulacion_mejoras' });
  Report.set('losses:sim', { order: 51, title: ['Simulación de mejoras', 'Improvement what-if'], html: () => el('b5mRead').innerHTML + PHRep.fig('b5-sensibilidad') });
}

/* ---------------- mechanical damage ---------------- */
function damageRun(D) {
  const m = D.map;
  const rows = D.rows.filter(r => isFinite(r[m.x]) && r[m.x] !== null);
  const x = rows.map(r => +r[m.x]);
  const res = { models: m.y ? Loss.damageModels(x, colNum(rows, m.y)) : [], logit: null, rows, map: m };
  if (m.inc) { const inc = colNum(rows, m.inc); const ok = inc.every(v => v === 0 || v === 1); if (ok) res.logit = Loss.logistic(x, inc); }
  if (m.mass && m.y) {
    const E = rows.map(r => Loss.dropEnergy(+r[m.mass] / 1000, +r[m.x]));
    const pairs = rows.map((r, i) => [E[i], +r[m.y]]).filter(p => p[0] > 0 && p[1] > 0);
    res.bs = pairs.length ? Num.mean(pairs.map(p => p[1] / p[0])) : NaN;
  }
  S.d = res;
  el('b5dOut').hidden = false;
  const best = res.models.length ? res.models.slice().sort((a, b) => a.aic - b.aic)[0] : null;
  const lin = res.models.find(q => q.id === 'linear');
  const NAMES = { linear: [T('Lineal', 'Linear'), 'y = a + b·x'], quadratic: [T('Cuadrático', 'Quadratic'), 'y = a + b·x + c·x²'], power: [T('Potencia', 'Power'), 'y = a·xᵇ'], exponential: [T('Exponencial', 'Exponential'), 'y = a·e^(b·x)'] };
  const e50 = res.logit ? res.logit.dose(0.5) : null, e10 = res.logit ? res.logit.dose(0.1) : null;
  statTiles('b5dTiles', [
    [T('Frutos', 'Fruit'), rows.length],
    best ? [T('Mejor curva (AIC)', 'Best curve (AIC)'), NAMES[best.id][0], 'R² ' + Fmt.num(best.r2, 3)] : null,
    lin && isFinite(lin.threshold) ? [T('Umbral de daño', 'Damage threshold'), Fmt.num(lin.threshold, 1), esc(m.x) + T(' donde la recta cruza 0', ' where the line crosses 0')] : null,
    e50 ? [T('Daña al 50 %', 'Bruises 50 %'), Fmt.num(e50.est, 1), 'Fieller ' + Fmt.ci(e50.lo, e50.hi, 1), 'hi'] : null,
    e10 ? [T('Daña al 10 %', 'Bruises 10 %'), Fmt.num(e10.est, 1), 'Fieller ' + Fmt.ci(e10.lo, e10.hi, 1)] : null,
    isFinite(res.bs) ? [T('Susceptibilidad', 'Susceptibility'), Fmt.num(res.bs, 0), esc(m.y) + T(' por joule', ' per joule')] : null,
  ]);
  el('b5dRead').innerHTML = `<div class="reading"><p>${best ? L2(`El daño crece con ${esc(m.x)}; la curva con menor AIC es la <b>${NAMES[best.id][0].toLowerCase()}</b> (${NAMES[best.id][1]}).`, `Damage grows with ${esc(m.x)}; the curve with the lowest AIC is the <b>${NAMES[best.id][0].toLowerCase()}</b> one (${NAMES[best.id][1]}).`) : ''} ${lin && isFinite(lin.threshold) ? L2(`Por la recta, por debajo de ${Fmt.num(lin.threshold, 1)} no se espera daño visible.`, `By the line, below ${Fmt.num(lin.threshold, 1)} no visible damage is expected.`) : ''}</p>${e50 ? `<p>${L2(`La regresión logística dice que la mitad de los frutos se daña a ${Fmt.num(e50.est, 1)} ${Fmt.ci(e50.lo, e50.hi, 1)} y el 10 % a ${Fmt.num(e10.est, 1)}: alturas de caída menores que esa en la línea de empaque mantienen el daño por debajo del 10 %.`, `Logistic regression says half of the fruit bruise at ${Fmt.num(e50.est, 1)} ${Fmt.ci(e50.lo, e50.hi, 1)} and 10 % at ${Fmt.num(e10.est, 1)}: drops lower than that on the packing line keep damage below 10 %.`)}</p>` : ''}</div>`;
  el('b5dFig1').innerHTML = ''; el('b5dFig2').innerHTML = '';
  if (res.models.length) {
    const xg = Array.from({ length: 50 }, (_, i) => Math.min(...x) * 0 + (Math.max(...x) * 1.05) * i / 49);
    const ser = [{ name: T('frutos', 'fruit'), x, y: colNum(rows, m.y), line: false, alpha: 0.7 }];
    [lin, best].filter((q, i, a) => q && a.indexOf(q) === i).forEach(q => ser.push({ name: NAMES[q.id][0], x: xg.filter(v => !q.logScale || v > 0), y: xg.filter(v => !q.logScale || v > 0).map(q.predict).map(v => Math.max(0, v)), points: false }));
    Fig.put('b5dFig1', Plot.lines({ name: 'b5-dano', w: 520, h: 340, series: ser, xlab: m.x, ylab: m.y, yZero: true }), { name: 'b5-dano', title: L2('Daño contra ', 'Damage against ') + esc(m.x), block: 5 });
  }
  if (res.logit) {
    const lv = [...new Set(x)].sort((a, b) => a - b), inc = colNum(rows, m.inc);
    const prop = lv.map(v => { const k = x.map((xx, i) => (xx === v ? inc[i] : null)).filter(q => q !== null); return k.reduce((s, q) => s + q, 0) / k.length; });
    const xg = Array.from({ length: 60 }, (_, i) => Math.max(...x) * 1.1 * i / 59);
    Fig.put('b5dFig2', Plot.lines({ name: 'b5-incidencia', w: 520, h: 340, series: [{ name: T('proporción observada', 'observed proportion'), x: lv, y: prop, line: false }, { name: T('logística', 'logistic'), x: xg, y: xg.map(res.logit.predict), points: false }], xlab: m.x, ylab: T('Proporción de frutos dañados', 'Proportion of bruised fruit'), yr: [0, 1.02], hlines: [{ y: 0.5 }, { y: 0.1 }] }), { name: 'b5-incidencia', title: L2('Incidencia de daño', 'Bruise incidence'), block: 5 });
  }
  buildTable('b5dTab', [{ key: 'id', label: L2('Curva', 'Curve'), get: q => NAMES[q.id][0] + ' · ' + NAMES[q.id][1] }, { key: 'coef', label: L2('Coeficientes', 'Coefficients'), get: q => q.coef.map(c => Fmt.sig(c, 4)).join(' · ') }, { key: 'r2', label: 'R²', num: true, fmt: v => Fmt.num(v, 4) }, { key: 'aic', label: 'AIC', num: true, fmt: v => Fmt.num(v, 2) }, { key: 'n', label: 'n', num: true, get: q => q.nUsed || q.n }],
    res.models.map(q => Object.assign({ _class: best && q.id === best.id ? 'best' : '' }, q)), { csvName: 'curvas_de_dano' });
  el('b5dCite').innerHTML = '';
  citeMethod('b5dCite', [Refs.short('mohsenin1986'), [T('Susceptibilidad: ', 'Susceptibility: ') + Refs.short('bajema1998'), 'Susceptibility: ' + Refs.short('bajema1998')], [T('Intervalo de Fieller: ', 'Fieller interval: ') + Refs.short('finney1971'), 'Fieller interval: ' + Refs.short('finney1971')]]);
  state.losses = Object.assign(state.losses || {}, { damage: { e50: e50 ? e50.est : null } });
  Report.set('losses:damage', { order: 52, title: ['Daño mecánico', 'Mechanical damage'], html: () => el('b5dRead').innerHTML + PHRep.fig('b5-dano') + PHRep.fig('b5-incidencia') + PHRep.table('b5dTab') });
}

document.addEventListener('DOMContentLoaded', () => {
  const P = el('panel-5');
  P.innerHTML = UI.panel(5, 'Pérdidas y cadena de valor', 'Losses and value chain', 'Cantidad y valor perdidos por etapa, puntos críticos, simulación y daño mecánico', 'Quantity and value lost by stage, critical points, what-if and mechanical damage', tools);
  if (window.I18N) I18N.apply(P);
  cTable = EditTable.mount('b5cTable', {
    id: 'b5c',
    columns: [{ key: 'name', es: 'Etapa', en: 'Stage', type: 'text', width: 180 }, { key: 'pct', es: 'Pérdida (% de lo que entra)', en: 'Loss (% of input)', type: 'num' }, { key: 'kg', es: 'o pérdida (kg)', en: 'or loss (kg)', type: 'num' }, { key: 'price', es: 'Precio por kg', en: 'Price per kg', type: 'num' }],
    rows: [{ name: T('Cosecha', 'Harvest'), pct: 5, kg: null, price: 6 }, { name: T('Empaque', 'Packing'), pct: 8, kg: null, price: 8 }, { name: T('Transporte', 'Transport'), pct: 4, kg: null, price: 10 }, { name: T('Venta', 'Retail'), pct: 7, kg: null, price: 20 }],
    blank: () => ({ name: '', pct: null, kg: null, price: null }),
    onChange: chainRun,
  });
  const loadEx = () => { cTable.set(Datasets.rows('jitomateCadena').map(r => ({ name: r.etapa, pct: r.perdida_pct, kg: null, price: r.precio_kg }))); el('b5cIni').value = 10000; chainRun(); };
  el('b5cEx').addEventListener('click', loadEx);
  window.PHLoad.b5c = loadEx;
  ['b5cIni', 'b5cCur'].forEach(id => el(id).addEventListener('input', chainRun));
  el('b5cSend').addEventListener('click', () => {
    if (!S.ch) return;
    const h = ['etapa', 'entra_kg', 'pierde_kg', 'perdida_pct', 'precio_kg', 'valor_perdido', 'sale_kg'];
    const rows = S.ch.ch.rows.map(r => [r.name, r.input, r.lost, r.pct, r.price, r.value, r.output]);
    Send.to('EconomicsPro', { kind: 'chain-losses', name: 'perdidas_cadena', csv: Out.csvText(h, rows), note: 'Losses by stage of a postharvest chain' });
  });
  ['b5mStage', 'b5mRed'].forEach(id => { el(id).addEventListener('change', simRun); el(id).addEventListener('input', simRun); });
  chainRun();
  const d = DataIn.mount('b5dIn', {
    id: 'b5d',
    roles: [
      { key: 'x', es: 'Altura, energía o fuerza', en: 'Height, energy or force', type: 'num', match: ['altura_cm', 'altura', 'height', 'energia_j', 'energia', 'fuerza'] },
      { key: 'y', es: 'Tamaño del daño', en: 'Bruise size', optional: true, match: ['area_mm2', 'area', 'volumen_mm3', 'volumen', 'dano_mm', 'bruise'] },
      { key: 'inc', es: 'Dañado (0/1)', en: 'Bruised (0/1)', optional: true, match: ['danado', 'dañado', 'dano', 'bruised', 'incidencia'] },
      { key: 'mass', es: 'Masa del fruto (g)', en: 'Fruit mass (g)', optional: true, match: ['masa_g', 'masa', 'peso', 'mass'] },
    ],
    examples: [{ id: 'jitomateCaidas' }],
    onData: damageRun,
  });
  window.PHLoad.b5d = () => d.load(0);
});
document.addEventListener('langchange', () => { chainRun(); const d = DataIn.registry.b5d; if (d && d.get()) d.refire(); });
})();
