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

/* PostHarvestPro — Block 9, report and project: a self-contained HTML report
   (cover, summary, every section the blocks left, handling recommendations
   drawn from the results, methods and references, how to cite), printable to
   PDF; and the project file (JSON) that saves the tables, the choices of
   columns, the edited tables and the settings, and opens them again. */
(function () {
'use strict';
const VERSION = '1.0.0';
const BLOCK_OF = { quality: 2, kinetics: 3, resp: 4, losses: 5, sensory: 6, trials: 7, logistics: 8 };
const html = `
  <div class="panel-title"><div class="pt-num">9</div><div><h2>${L2('Informe y proyecto', 'Report and project')}</h2><p>${L2('Todo lo que calculaste, en un documento para compartir; y tu trabajo, en un archivo para seguir después', 'Everything you computed, in a document to share; and your work, in a file to continue later')}</p></div></div>
  <div class="card"><h2>${L2('El informe', 'The report')}</h2>
    <p class="hint">${L2('Reúne las secciones que dejaron los bloques, con sus gráficas (en SVG, con los colores del tema claro), tablas, interpretación, recomendaciones de manejo, métodos y referencias. Es un solo archivo HTML que se abre en cualquier navegador y se imprime a PDF.', 'It gathers the sections the blocks left, with their charts (SVG, in the light-theme colors), tables, interpretation, handling recommendations, methods and references. It is a single HTML file that opens in any browser and prints to PDF.')}</p>
    <div class="form-grid tight">${UI.text('b9Title', 'Título', 'Title', 'Ensayo de poscosecha')}${UI.text('b9Author', 'Autor o responsable', 'Author or person in charge', '')}${UI.text('b9Crop', 'Producto o cultivo', 'Produce or crop', '')}${UI.text('b9Date', 'Fecha', 'Date', new Date().toISOString().slice(0, 10))}</div>
    <div class="field"><label for="b9Notes">${L2('Resumen o notas del ensayo (opcional)', 'Summary or notes of the trial (optional)')}</label><textarea id="b9Notes" rows="3"></textarea></div>
    <h3>${L2('Secciones disponibles', 'Available sections')}</h3><div id="b9Secs" class="check-list"></div>
    <div class="btn-row"><button type="button" class="btn btn-primary" id="b9Go">${L2('Generar el informe', 'Generate the report')}</button><button type="button" class="btn btn-secondary" id="b9Dl" disabled>${L2('⤓ Descargar HTML', '⤓ Download HTML')}</button><button type="button" class="btn btn-secondary" id="b9Print" disabled>${L2('Imprimir o guardar PDF', 'Print or save PDF')}</button></div>
    <div class="messages" id="b9Msg"></div>
    <iframe id="b9Frame" class="report-frame" title="${T('Vista previa del informe', 'Report preview')}" hidden></iframe></div>
  <div class="card"><h2>${L2('Recomendaciones de manejo', 'Handling recommendations')}</h2><p class="hint">${L2('Salen de los resultados de las secciones marcadas arriba, con reglas explícitas; revísalas con tu criterio antes de usarlas.', 'They come from the results of the sections ticked above, through explicit rules; check them with your own judgment before using them.')}</p><div id="b9Rec"></div></div>
  <div class="card"><h2>${L2('Proyecto', 'Project')}</h2>
    <p class="hint">${L2('Guarda en un archivo JSON las tablas que cargaste, las columnas que elegiste, las tablas editadas y los ajustes. Al abrirlo, la app recalcula todo. El archivo se queda en tu equipo.', 'Saves into a JSON file the tables you loaded, the columns you chose, the edited tables and the settings. When you open it, the app recomputes everything. The file stays on your computer.')}</p>
    <div class="btn-row"><button type="button" class="btn btn-primary" id="b9Save">${L2('⤓ Guardar proyecto', '⤓ Save project')}</button><label class="btn btn-secondary" for="b9Open">${L2('Abrir proyecto…', 'Open project…')}</label><input type="file" id="b9Open" accept=".json,application/json" class="sr-only"></div>
    <div class="messages" id="b9PMsg"></div></div>
  <div class="card"><h2>${L2('Cómo citar PostHarvestPro', 'How to cite PostHarvestPro')}</h2><div class="cite-box"><div class="cite-ref" id="b9Apa"></div><div class="cite-ref" id="b9Bib"></div></div></div>`;

/* ---------------- sections the person used ----------------
   Several tools open with example values already written in their fields and leave a section at start-up.
   Those sections are not the person's work: they stay out of the report and of the recommendations
   unless the person ticks them. A section counts as used when a block leaves it after the person worked
   in that block (loaded data, edited a table, changed a setting: state.touched) or right after a click
   inside one of its tools; not when the app only redraws it in the other language. A project file keeps
   the list. */
const used = new Set();
/* the tools (panes) the person worked in, for the rules that read a tool without a section */
const panes = new Set();
let replaying = false, lastClick = 0;
document.addEventListener('langchange', () => { replaying = true; setTimeout(() => { replaying = false; }, 0); }, true);
['click', 'input', 'change'].forEach(t => document.addEventListener(t, e => {
  const pane = e.isTrusted && e.target.closest && e.target.closest('.tool-pane');
  if (!pane) return;
  panes.add(pane.id);
  if (t === 'click') lastClick = Date.now();
}, true));
const setSection = Report.set;
Report.set = function (key, sec) {
  if (!replaying && (state.touched[BLOCK_OF[key.split(':')[0]]] || Date.now() - lastClick < 1500)) used.add(key);
  return setSection.call(Report, key, sec);
};
/* what the person chose to leave in or out of the report (by default, in when used and out when not) */
const choice = new Map();
const included = () => Report.list().map(([k]) => k).filter(k => (choice.has(k) ? choice.get(k) : used.has(k)));

/* ---------------- recommendations ----------------
   Each rule reads the result of one section and applies only when that section is among `keys`
   (the sections used, or the ones in the report). */
function recommendations(keys) {
  const R = [], st = state, on = new Set(keys || [...used]);
  const add = (es, en) => R.push(T(es, en));
  const K = st.kinetics || {};
  if (K.fits && K.fits.length && on.has('kinetics:fit')) {
    const withT = K.fits.filter(f => isFinite(f.t) && f.t > 0);
    if (withT.length) add('Vida al límite de calidad: ' + withT.map(f => (f.group !== '—' ? f.group + ': ' : '') + Fmt.num(f.t, 1)).join('; ') + '. Programa la venta antes de esos tiempos, con margen para la distribución.', 'Life to the quality limit: ' + withT.map(f => (f.group !== '—' ? f.group + ': ' : '') + Fmt.num(f.t, 1)).join('; ') + '. Schedule sales before those times, with a margin for distribution.');
  }
  if (K.arrhenius && isFinite(K.arrhenius.Ea) && on.has('kinetics:temperature')) add(`Con Eₐ ≈ ${Fmt.num(K.arrhenius.Ea, 0)} kJ/mol, cada grado de más acorta la vida de anaquel en torno a ${Fmt.num(100 * (1 - Math.exp(-K.arrhenius.Ea * 1000 / 8.314 * (1 / 283.15 - 1 / 284.15))), 0)} %: la cadena de frío continua es la medida más rentable.`, `With Eₐ ≈ ${Fmt.num(K.arrhenius.Ea, 0)} kJ/mol, each extra degree shortens shelf life by about ${Fmt.num(100 * (1 - Math.exp(-K.arrhenius.Ea * 1000 / 8.314 * (1 / 283.15 - 1 / 284.15))), 0)} %: an unbroken cold chain is the most profitable measure.`);
  const Rp = st.resp || {};
  if (Rp.climacteric === 'climacteric' && on.has('resp:climacteric')) add('Producto climatérico: coséchalo en madurez fisiológica, enfríalo pronto y mantenlo lejos del etileno (o usa un absorbedor) hasta la maduración controlada.', 'Climacteric produce: harvest at physiological maturity, cool it early and keep it away from ethylene (or use a scrubber) until controlled ripening.');
  if (Rp.static && isFinite(Rp.static.co2) && Rp.static.co2 > 40 && on.has('resp:static')) add('La respiración es alta: el producto genera mucho calor; dimensiona el preenfriamiento y la refrigeración con ese calor vital.', 'Respiration is high: the produce generates much heat; size precooling and refrigeration including that vital heat.');
  if (Rp.map && on.has('resp:map')) add(Rp.map.inWin ? 'El empaque elegido llega a la atmósfera recomendada; verifica con lecturas reales de O₂ y CO₂ en el empaque.' : 'El empaque elegido no llega a la atmósfera recomendada: cambia película, espesor, área o masa (ver el Bloque 4).', Rp.map.inWin ? 'The chosen package reaches the recommended atmosphere; check with real O₂ and CO₂ readings inside the package.' : 'The chosen package does not reach the recommended atmosphere: change film, thickness, area or mass (see Block 4).');
  const L = st.losses || {};
  if (L.chain && on.has('losses:chain') && S0.chain()) { const c = S0.chain(); add(`Concentra la inversión en «${c.byValue[0].name}», donde se pierde más valor (${Fmt.pct(c.byValue[0].share)} del total).`, `Focus investment on «${c.byValue[0].name}», where most value is lost (${Fmt.pct(c.byValue[0].share)} of the total).`); }
  /* the drop height that bruises 10 % of the fruit (logistic regression of Block 5), with its unit */
  const D = L.damage;
  if (D && isFinite(D.e10) && on.has('losses:damage')) {
    const h = v => Fmt.num(v, 1) + (D.unit ? ' ' + D.unit : ''), at50 = isFinite(D.e50) && D.e50 > 0;
    if (D.e10 > 0) add(`Limita las caídas en la línea de empaque y en la carga por debajo de ${h(D.e10)}, la altura que daña al 10 % de los frutos${at50 ? ` (al 50 % los daña una caída de ${h(D.e50)})` : ''}; acolcha los puntos de transferencia.`, `Keep drops on the packing line and when loading below ${h(D.e10)}, the height that bruises 10 % of the fruit${at50 ? ` (a drop of ${h(D.e50)} bruises 50 %)` : ''}; pad the transfer points.`);
    else add('Aun las caídas más bajas del ensayo dañan a más del 10 % de los frutos: acolcha los puntos de transferencia y evita cualquier caída libre.', 'Even the lowest drops of the trial bruise more than 10 % of the fruit: pad the transfer points and avoid any free fall.');
  }
  const Sn = st.sensory || {};
  if (Sn.hedonic && Sn.hedonic.best && on.has('sensory:hedonic')) add(`En agrado destaca «${Sn.hedonic.best}»; usa el análisis de penalidades para ajustar a los demás.`, `«${Sn.hedonic.best}» stands out in liking; use the penalty analysis to adjust the others.`);
  const Lg = st.logistics || {};
  if (Lg.air && isFinite(Lg.air.loss) && Lg.air.loss * 7 > 2 && on.has('logistics:air')) add('La pérdida de agua estimada pasa de 2 % por semana: sube la humedad relativa, baja la temperatura del producto o usa un empaque que frene la transpiración.', 'The estimated water loss exceeds 2 % per week: raise relative humidity, lower the produce temperature or use packaging that slows transpiration.');
  /* box venting leaves no section: it counts when the person worked in its tool */
  if (Lg.vents && (Lg.vents.long < 5 || Lg.vents.short < 5) && panes.has('b8-ventilacion')) add('Las cajas tienen menos de 5 % de área abierta en alguna cara: el enfriamiento con aire forzado será lento.', 'The boxes have less than 5 % open area on some face: forced-air cooling will be slow.');
  if (Lg.compat && Lg.compat.bad && on.has('logistics:compat')) add('Hay productos incompatibles en la misma cámara: sepáralos (temperatura o etileno).', 'There are incompatible products in the same room: separate them (temperature or ethylene).');
  return R;
}
const S0 = { chain: () => { try { const t = EditTable.registry.b5c; if (!t) return null; const st = t.get().filter(s => s.name && (isFinite(s.pct) || isFinite(s.kg))); return st.length ? Loss.chain(st, UI.v('b5cIni')) : null; } catch (e) { return null; } } };
function paintRec() {
  const R = recommendations(included());
  el('b9Rec').innerHTML = R.length ? '<ul>' + R.map(r => `<li>${esc(r)}</li>`).join('') + '</ul>' : `<p class="hint">${L2('Aún no hay resultados de los que sacar recomendaciones.', 'There are no results yet to draw recommendations from.')}</p>`;
}

/* ---------------- sections ---------------- */
/* the sections the person used, ticked; below them, unticked, the ones that only hold the example values
   a tool opens with */
function paintSecs() {
  const host = el('b9Secs'), on = new Set(included());
  const box = ([k, s]) => `<label class="checkbox-label"><input type="checkbox" value="${esc(k)}"${on.has(k) ? ' checked' : ''}><span>${L2(s.title[0], s.title[1])} <small class="hint sec-block">· ${L2('Bloque ', 'Block ')}${BLOCK_OF[k.split(':')[0]]}</small></span></label>`;
  const mine = Report.list().filter(([k]) => used.has(k)), rest = Report.list().filter(([k]) => !used.has(k));
  host.innerHTML = (mine.length ? mine.map(box).join('') : `<p class="hint">${L2('Todavía no hay secciones: corre algún análisis en los bloques 2 a 8.', 'No sections yet: run some analysis in Blocks 2 to 8.')}</p>`) +
    (rest.length ? `<p class="check-group">${L2('Con los valores de ejemplo con que abre la herramienta (no los has usado; márcalos si quieres que entren):', 'With the example values the tool opens with (you have not used them; tick them if you want them in):')}</p>` + rest.map(box).join('') : '');
  paintRec();
}

/* ---------------- the report ---------------- */
const RCSS = `body{font-family:system-ui,"Segoe UI",sans-serif;color:#1C150E;margin:0;background:#fff;line-height:1.5}main{max-width:900px;margin:0 auto;padding:28px 34px 60px}
.cover{border-radius:18px;padding:34px 36px;margin:0 0 26px;background:linear-gradient(150deg,#FFF8EC,#FFE7C7);border:1px solid #F0DCC2}
.cover .k{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7D5B14;font-weight:700}.cover h1{font-size:30px;margin:8px 0 6px;line-height:1.15}.cover p{margin:2px 0;color:#5D5247}
.cover .logo{float:right;width:64px;height:64px}h2{font-size:21px;border-bottom:2px solid #EF6C00;padding-bottom:4px;margin:30px 0 10px;page-break-after:avoid}h3{font-size:16px}
.reading{background:#FFF3E0;border-left:4px solid #7CB342;border-radius:8px;padding:10px 14px;margin:10px 0}.reading p{margin:0 0 6px}.hint{color:#5D5247;font-size:13px}
figure{margin:12px 0;page-break-inside:avoid}figure svg{width:100%;height:auto;max-height:520px}figcaption{font-size:12px;color:#5D5247}
table{border-collapse:collapse;width:100%;font-size:12.5px;margin:8px 0;page-break-inside:auto}th{background:#F3ECE2;text-align:left;padding:5px 8px;border-bottom:1px solid #CDBDAA}td{padding:4px 8px;border-bottom:1px solid #EADFD1}td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}tr.best td{background:#EEF5E4}
.letters{font-weight:700;color:#4E7A1E}.tbl{overflow-x:auto}.refs li{font-size:12.5px;margin-bottom:4px}.cite{font-family:ui-monospace,monospace;font-size:12px;background:#F3ECE2;padding:10px 12px;border-radius:8px;white-space:pre-wrap}
.toc li{margin:2px 0}footer{margin-top:40px;font-size:11px;color:#5D5247;border-top:1px solid #EADFD1;padding-top:8px}@media print{main{padding:0 6mm}.cover{break-after:avoid}h2{break-after:avoid}}@page{margin:16mm 14mm}`;
function buildReport() {
  const keys = [...el('b9Secs').querySelectorAll('input:checked')].map(c => c.value);
  const list = Report.list().filter(([k]) => keys.includes(k));
  if (!list.length) { clearMessages('b9Msg'); showMessage('b9Msg', 'warn', T('Elige al menos una sección (o corre algún análisis).', 'Pick at least one section (or run some analysis).')); return null; }
  clearMessages('b9Msg');
  const lang = I18N.lang, t = (es, en) => (lang === 'en' ? en : es);
  const blocks = [...new Set(list.map(([k]) => BLOCK_OF[k.split(':')[0]]))];
  const refKeys = [...new Set(Refs.METHODS.filter(m => blocks.includes(m[0])).flatMap(m => m[3]))].sort((a, b) => Refs.REFS[a].localeCompare(Refs.REFS[b], 'es'));
  const sec = list.map(([k, s], i) => {
    let body = '';
    try { body = s.html(); } catch (e) { body = '<p class="hint">' + esc(e.message) + '</p>'; }
    return `<section id="s${i + 1}"><h2>${i + 1}. ${esc(t(s.title[0], s.title[1]))}</h2>${body}</section>`;
  }).join('');
  const rec = recommendations(list.map(([k]) => k));
  const notes = UI.s('b9Notes');
  const logo = Art.logo(64).replace('<svg ', '<svg class="logo" ');
  const doc = `<!DOCTYPE html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(UI.s('b9Title'))}</title><meta name="generator" content="PostHarvestPro ${VERSION}"><style>${RCSS}</style></head><body><main>
    <div class="cover">${logo}<div class="k">${t('Informe de poscosecha', 'Postharvest report')}</div><h1>${esc(UI.s('b9Title'))}</h1>${UI.s('b9Crop') ? `<p><b>${t('Producto', 'Produce')}:</b> ${esc(UI.s('b9Crop'))}</p>` : ''}${UI.s('b9Author') ? `<p><b>${t('Responsable', 'Prepared by')}:</b> ${esc(UI.s('b9Author'))}</p>` : ''}<p><b>${t('Fecha', 'Date')}:</b> ${esc(UI.s('b9Date'))}</p><p class="hint">${t('Generado con PostHarvestPro', 'Generated with PostHarvestPro')} ${VERSION} · LABG Suite</p></div>
    <h2>${t('Resumen', 'Summary')}</h2>${notes ? `<p>${esc(notes)}</p>` : ''}<ol class="toc">${list.map(([k, s], i) => `<li><a href="#s${i + 1}">${esc(t(s.title[0], s.title[1]))}</a></li>`).join('')}</ol>
    ${sec}
    <section><h2>${list.length + 1}. ${t('Recomendaciones de manejo poscosecha', 'Postharvest handling recommendations')}</h2>${rec.length ? '<ul>' + rec.map(r => `<li>${esc(r)}</li>`).join('') + '</ul>' : `<p class="hint">${t('Sin recomendaciones automáticas para estas secciones.', 'No automatic recommendations for these sections.')}</p>`}<p class="hint">${t('Las recomendaciones salen de reglas aplicadas a los resultados; deben revisarse con el conocimiento del cultivo y del mercado.', 'The recommendations come from rules applied to the results; they must be checked against knowledge of the crop and the market.')}</p></section>
    <section><h2>${list.length + 2}. ${t('Métodos y referencias', 'Methods and references')}</h2><p class="hint">${t('Todos los cálculos se hicieron en el navegador con PostHarvestPro, cuyos métodos se validaron contra implementaciones independientes (las comparaciones y sus tolerancias están en la carpeta tests/ del programa).', 'All computations were done in the browser with PostHarvestPro, whose methods were validated against independent implementations (the comparisons and their tolerances are in the program\'s tests/ folder).')}</p><ul>${Refs.METHODS.filter(m => blocks.includes(m[0])).map(m => `<li>${esc(t(m[1], m[2]))} — ${m[3].map(k => esc(Refs.short(k))).join('; ')}</li>`).join('')}</ul><ol class="refs">${refKeys.map(k => `<li>${esc(Refs.REFS[k])}</li>`).join('')}</ol></section>
    <section><h2>${t('Cómo citar', 'How to cite')}</h2><div class="cite">${esc(t(CITE.apa, CITE.apaEn))}</div><div class="cite" style="margin-top:8px">${esc(CITE.bib)}</div></section>
    <footer>PostHarvestPro ${VERSION} · Luis Ángel Barrera-Guzmán · GPL-3.0 · https://luisangelbg.github.io/PostHarvestPro/</footer></main></body></html>`;
  return doc;
}
let lastDoc = null;
function showReport() {
  const doc = buildReport();
  if (!doc) return;
  lastDoc = doc;
  const f = el('b9Frame');
  f.hidden = false;
  f.srcdoc = doc;
  el('b9Dl').disabled = false; el('b9Print').disabled = false;
  if (window.LABG) LABG.toast(T('Informe listo.', 'Report ready.'), { type: 'success' });
}

/* ---------------- project file ---------------- */
const SKIP_ID = /(File|PasteText|Sheet|Open)$|R_|^b9/;
function projectSave() {
  const forms = {};
  els('.step-panel input[id], .step-panel select[id], .step-panel textarea[id]').forEach(n => {
    if (SKIP_ID.test(n.id) || n.closest('.data-in') || n.type === 'file') return;
    forms[n.id] = n.type === 'checkbox' ? n.checked : n.value;
  });
  const edits = {};
  Object.entries(EditTable.registry).forEach(([id, t]) => { edits[id] = t.get(); });
  const P = { app: 'PostHarvestPro', version: VERSION, saved: new Date().toISOString(), lang: I18N.lang, inputs: state.inputs, edits, forms, report: { title: UI.s('b9Title'), author: UI.s('b9Author'), crop: UI.s('b9Crop'), notes: UI.s('b9Notes'), used: [...used], panes: [...panes], choice: [...choice] } };
  download(JSON.stringify(P, null, 1), 'proyecto_postharvestpro_' + new Date().toISOString().slice(0, 10) + '.json', 'application/json');
}
async function projectOpen(file) {
  clearMessages('b9PMsg');
  let P;
  try { P = JSON.parse(await file.text()); } catch (e) { showMessage('b9PMsg', 'error', T('El archivo no es un JSON válido.', 'The file is not valid JSON.')); return; }
  if (!P || P.app !== 'PostHarvestPro') { showMessage('b9PMsg', 'error', T('El archivo no es un proyecto de PostHarvestPro.', 'The file is not a PostHarvestPro project.')); return; }
  let nf = 0, ne = 0, ni = 0;
  /* while the project is restored, the sections it recomputes are not marked as used one by one: the
     project says which were (older files without the list: every section the project recomputes) */
  const redone = new Set(), set0 = Report.set;
  Report.set = function (key, sec) { redone.add(key); return setSection.call(Report, key, sec); };
  try {
    Object.entries(P.forms || {}).forEach(([id, v]) => {
      const n = el(id);
      if (!n) return;
      if (n.type === 'checkbox') n.checked = !!v; else n.value = v;
      n.dispatchEvent(new Event('change', { bubbles: true }));
      nf++;
    });
    Object.entries(P.edits || {}).forEach(([id, rows]) => { const t = EditTable.registry[id]; if (t && Array.isArray(rows)) { t.set(rows); ne++; } });
    for (const [id, saved] of Object.entries(P.inputs || {})) {
      const d = DataIn.registry[id];
      if (d && saved && saved.rows) { try { d.restore(saved); ni++; } catch (e) { console.error(e); } await new Promise(r => setTimeout(r, 30)); }
    }
  } finally { Report.set = set0; }
  const R = P.report || {};
  used.clear(); choice.clear();
  (Array.isArray(R.used) ? R.used : [...redone]).forEach(k => used.add(k));
  (Array.isArray(R.panes) ? R.panes : []).forEach(k => panes.add(k));
  if (Array.isArray(R.choice)) R.choice.forEach(([k, v]) => choice.set(k, !!v));
  if (P.report) { el('b9Title').value = P.report.title || el('b9Title').value; el('b9Author').value = P.report.author || ''; el('b9Crop').value = P.report.crop || ''; el('b9Notes').value = P.report.notes || ''; }
  showMessage('b9PMsg', 'success', T(`Proyecto abierto: ${ni} tablas de datos, ${ne} tablas editadas y ${nf} ajustes.`, `Project opened: ${ni} data tables, ${ne} edited tables and ${nf} settings.`));
  paintSecs();
}

document.addEventListener('DOMContentLoaded', () => {
  const P = el('panel-9');
  P.innerHTML = html;
  if (window.I18N) I18N.apply(P);
  el('b9Apa').textContent = T(CITE.apa, CITE.apaEn);
  el('b9Bib').textContent = CITE.bib;
  el('b9Go').addEventListener('click', () => { paintSecs(); showReport(); });
  el('b9Secs').addEventListener('change', e => { if (e.target.type === 'checkbox') { choice.set(e.target.value, e.target.checked); paintRec(); } });
  el('b9Dl').addEventListener('click', () => { if (lastDoc) download(lastDoc, 'informe_postharvestpro.html', 'text/html;charset=utf-8'); });
  el('b9Print').addEventListener('click', () => { const f = el('b9Frame'); if (f.contentWindow) { f.contentWindow.focus(); f.contentWindow.print(); } });
  el('b9Save').addEventListener('click', projectSave);
  el('b9Open').addEventListener('change', e => { if (e.target.files[0]) projectOpen(e.target.files[0]); e.target.value = ''; });
  paintSecs();
});
document.addEventListener('resultchange', () => { if (el('b9Secs')) paintSecs(); });
document.addEventListener('stepchange', e => { if (e.detail.step === 9) paintSecs(); });
document.addEventListener('langchange', () => { el('b9Apa').textContent = T(CITE.apa, CITE.apaEn); paintSecs(); });
window.PHProject = { save: projectSave, open: projectOpen, report: buildReport, recommendations };
})();
