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

/* PostHarvestPro — global state and the shared pieces of the interface.

   No ES modules: everything hangs from window so the app also works when
   index.html is opened with a double click (file://).

   · navigation between the nine blocks, with the common bar of the suite;
   · tools (tabs) inside a block, remembered and announced to the navigator;
   · a data entry used by every tool: example, file (CSV, TSV, TXT, XLSX, ODS),
     pasted table, and the choice of the column for each role;
   · editable tables for manual entry;
   · figures: the box the figure studio of the suite recognises, with quick
     SVG and 300 ppi PNG downloads (colours of the light theme written in);
   · the record each block leaves for the report and the project file;
   · sending a table to another app of the suite. */

const state = {
  quality: null, kinetics: null, resp: null, losses: null, sensory: null, trials: null, logistics: null,
  figures: {},
  inputs: {},
  /* blocks the person has worked in (loaded data, edited a table or changed a setting) */
  touched: {},
};
window.state = state;

const STEPS = [
  { n: 1, es: 'Inicio', en: 'Home' },
  { n: 2, es: 'Calidad y madurez', en: 'Quality and maturity' },
  { n: 3, es: 'Vida de anaquel', en: 'Shelf life' },
  { n: 4, es: 'Respiración y atmósferas', en: 'Respiration and atmospheres' },
  { n: 5, es: 'Pérdidas', en: 'Losses' },
  { n: 6, es: 'Sensorial', en: 'Sensory' },
  { n: 7, es: 'Ensayos', en: 'Trials' },
  { n: 8, es: 'Empaque y logística', en: 'Packaging and logistics' },
  { n: 9, es: 'Informe y proyecto', en: 'Report and project' },
];
const STEP_RESULT = { 2: 'quality', 3: 'kinetics', 4: 'resp', 5: 'losses', 6: 'sensory', 7: 'trials', 8: 'logistics' };

/* ---------------- DOM ---------------- */
function el(id) { return document.getElementById(id); }
function els(sel, root) { return [...(root || document).querySelectorAll(sel)]; }
function mk(tag, attrs, html) {
  const n = document.createElement(tag);
  if (attrs) for (const k in attrs) {
    if (k === 'class') n.className = attrs[k];
    else if (k === 'style') n.setAttribute('style', attrs[k]);
    else if (k.startsWith('on') && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] != null) n.setAttribute(k, attrs[k]);
  }
  if (html != null) n.innerHTML = html;
  return n;
}
function esc(s) { return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function L2(es, en) { return `<span data-l="es">${es}</span><span data-l="en">${en}</span>`; }
function showMessage(container, type, text, fix) {
  if (typeof container === 'string') container = el(container);
  if (!container) return null;
  type = { warn: 'warning', ok: 'success' }[type] || type;
  const div = mk('div', { class: 'msg msg-' + type }, text + (fix ? `<span class="msg-fix">${fix}</span>` : ''));
  if (window.LABG) LABG.messageRole(div, type);
  container.appendChild(div);
  return div;
}
function clearMessages(container) { if (typeof container === 'string') container = el(container); if (container) container.innerHTML = ''; }

/* ---------------- numbers ----------------
   Point as the decimal mark in both languages (Mexican usage and the
   journals); the true minus sign; thousands with a thin space. */
const Fmt = {
  dec: () => '.',
  num(v, d) {
    if (v == null || v === '' || (typeof v === 'number' && !isFinite(v))) return '—';
    const x = +v;
    if (d == null) d = Number.isInteger(x) || Math.abs(x) >= 1000 ? 0 : Math.abs(x) >= 100 ? 1 : Math.abs(x) >= 1 ? 2 : 3;
    let s = x.toFixed(d);
    if (/^-0\.?0*$/.test(s)) s = s.slice(1);
    const [i, f] = s.replace('-', '').split('.');
    const ii = i.length > 4 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : i;
    return (x < 0 && !/^0\.?0*$/.test(s.replace('-', '')) ? '−' : '') + ii + (f ? '.' + f : '');
  },
  sig(v, n) { if (!isFinite(v)) return '—'; if (v === 0) return '0'; const d = Math.max(0, (n || 3) - 1 - Math.floor(Math.log10(Math.abs(v)))); return Fmt.num(v, Math.min(d, 8)); },
  p(p) { if (p == null || !isFinite(p)) return '—'; if (p < 0.001) return '< 0.001'; return Fmt.num(p, 3); },
  /* «p = 0.023» or «p < 0.001», ready for a sentence */
  pEq(p) { const s = Fmt.p(p); return 'p ' + (s.charAt(0) === '<' ? s : '= ' + s); },
  pct(v, d) { return isFinite(v) ? Fmt.num(v, d == null ? 1 : d) + ' %' : '—'; },
  ci(lo, hi, d) { return '[' + Fmt.num(lo, d) + ', ' + Fmt.num(hi, d) + ']'; },
};
window.Fmt = Fmt;
const fmtNum = (v, d) => Fmt.num(v, d);
const fmtP = p => Fmt.p(p);
const stars = p => (p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : 'ns');

/* ---------------- result pieces ---------------- */
function statTiles(container, tiles) {
  if (typeof container === 'string') container = el(container);
  if (!container) return;
  container.innerHTML = '';
  container.classList.add('results-summary');
  tiles.filter(Boolean).forEach(t => {
    const [label, value, sub, level] = Array.isArray(t) ? t : [t.label, t.value, t.sub, t.level];
    const d = mk('div', { class: 'stat-tile' + (level ? ' ' + level : '') });
    d.innerHTML = `<div class="stat-label">${label}</div><div class="stat-value">${value}</div>` + (sub ? `<div class="stat-sub">${sub}</div>` : '');
    container.appendChild(d);
  });
}
/* columns: [{key, label, get?, fmt?, num?, html?}] */
function buildTable(container, columns, rows, opts) {
  opts = opts || {};
  if (typeof container === 'string') container = el(container);
  if (!container) return null;
  container.innerHTML = '';
  const wrap = mk('div', { class: 'table-scroll' });
  const table = mk('table');
  if (opts.caption) table.appendChild(mk('caption', null, opts.caption));
  const thead = mk('thead'), trh = mk('tr');
  columns.forEach(c => { const th = mk('th', { class: c.num ? 'num' : null }); th.innerHTML = c.label != null ? c.label : c.key; trh.appendChild(th); });
  thead.appendChild(trh); table.appendChild(thead);
  const tbody = mk('tbody');
  rows.forEach(r => {
    const tr = mk('tr');
    if (r && r._class) tr.className = r._class;
    columns.forEach(c => {
      const td = mk('td', { class: c.num ? 'num' : null });
      let v = c.get ? c.get(r) : r[c.key];
      if (c.html) { td.innerHTML = v == null ? '—' : v; tr.appendChild(td); return; }
      if (c.fmt && v != null && v !== '') v = c.fmt(v);
      td.textContent = (v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v))) ? '—' : v;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  container.appendChild(wrap);
  if (opts.csvName) {
    const row = mk('div', { class: 'out-row' });
    row.appendChild(mk('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => Out.tableCSV(columns, rows, opts.csvName) }, L2('⤓ CSV', '⤓ CSV')));
    row.appendChild(mk('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => Out.tableXLSX(columns, rows, opts.csvName) }, L2('⤓ XLSX', '⤓ XLSX')));
    container.appendChild(row);
  }
  return table;
}
/* the method and its source, under a result */
function citeMethod(container, items) {
  if (typeof container === 'string') container = el(container);
  if (!container) return;
  const d = mk('div', { class: 'cite-method' });
  d.innerHTML = '<b>' + L2('Método y fuente:', 'Method and source:') + '</b> ' + items.map(i => (Array.isArray(i) ? L2(i[0], i[1]) : i)).join(' · ');
  container.appendChild(d);
}

/* ---------------- downloads ---------------- */
function download(content, filename, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = mk('a', { href: url, download: filename });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const Out = {
  csvText(header, rows) {
    const q = v => { const s = v == null ? '' : typeof v === 'number' ? (isFinite(v) ? String(+v.toPrecision(12)) : '') : String(v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return '﻿' + [header.map(q).join(',')].concat(rows.map(r => r.map(q).join(','))).join('\r\n') + '\r\n';
  },
  plain(columns, rows) {
    const header = columns.map(c => String(c.label != null ? c.label : c.key).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' '));
    const body = rows.map(r => columns.map(c => { const v = c.get ? c.get(r) : r[c.key]; return typeof v === 'string' ? v.replace(/<[^>]+>/g, '') : v; }));
    return { header, body };
  },
  tableCSV(columns, rows, name) { const p = Out.plain(columns, rows); download(Out.csvText(p.header, p.body), name + '.csv', 'text/csv;charset=utf-8'); },
  async tableXLSX(columns, rows, name) {
    const p = Out.plain(columns, rows);
    const blob = await Sheets.write([{ name: name.slice(0, 31), rows: [p.header].concat(p.body) }]);
    download(blob, name + '.xlsx');
  },
};
window.Out = Out;

/* ---------------- block navigation ---------------- */
function goStep(n) {
  n = String(n);
  els('.step-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + n));
  els('.step-btn').forEach(b => b.classList.toggle('active', b.dataset.step === n));
  document.body.classList.toggle('on-home', n === '1');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  const btn = stepBtn(n);
  if (window.LABG) {
    LABG.setCurrentStep(n);
    if (btn) LABG.announce(T('Bloque ', 'Block ') + stepName(n));
  }
  refreshStepMarks();
  refreshStepFooters();
  document.dispatchEvent(new CustomEvent('stepchange', { detail: { step: Number(n) } }));
}
const stepBtn = n => document.querySelector('.step-btn[data-step="' + n + '"]');
const stepOn = n => { const b = stepBtn(n); return !!b && !b.disabled; };
function stepName(n) { const s = STEPS.find(x => String(x.n) === String(n)); return s ? s.n + ' · ' + T(s.es, s.en) : String(n); }
function refreshStepMarks() {
  if (!window.LABG) return;
  STEPS.forEach(s => { const k = STEP_RESULT[s.n]; if (k) LABG.markStep(s.n, state.touched[s.n] && state[k] && Object.keys(state[k]).length ? 'done' : null); });
}
function refreshStepFooters() {
  if (!window.LABG) return;
  els('.step-panel').forEach(p => {
    const n = Number(p.id.replace('panel-', ''));
    const i = STEPS.findIndex(s => s.n === n);
    if (i < 0) return;
    let f = p.querySelector(':scope > .step-footer');
    if (!f) {
      f = mk('nav', { class: 'step-footer no-print' });
      f.innerHTML = '<button type="button" class="btn btn-secondary prev"></button><button type="button" class="btn btn-primary next"></button>';
      f.addEventListener('click', e => { const b = e.target.closest('button[data-target]'); if (b && !b.disabled) goStep(b.dataset.target); });
      p.appendChild(f);
    }
    f.setAttribute('aria-label', T('Bloques', 'Blocks'));
    const prev = STEPS[i - 1], next = STEPS[i + 1];
    const label = s => L2(s.n + ' · ' + s.es, s.n + ' · ' + s.en);
    const bp = f.querySelector('.prev'), bn = f.querySelector('.next');
    bp.hidden = !prev;
    if (prev) { bp.dataset.target = prev.n; bp.innerHTML = `← <span><small>${L2('Anterior', 'Previous')}</small>${label(prev)}</span>`; }
    bn.hidden = !next;
    if (next) { bn.dataset.target = next.n; bn.innerHTML = `<span><small>${L2('Siguiente', 'Next')}</small>${label(next)}</span> →`; }
  });
}
function paintCommonBar() {
  if (!window.LABG) return;
  LABG.theme.key = 'postharvestpro:theme';
  LABG.theme.paint();
  const nav = el('stepper');
  if (nav) nav.setAttribute('aria-label', T('Bloques', 'Blocks'));
}
/* a block reports that its result changed (marks, report, project) */
function blockDone(key) {
  refreshStepMarks();
  document.dispatchEvent(new CustomEvent('resultchange', { detail: { key } }));
}

/* ---------------- preferences ---------------- */
const Prefs = {
  get(k, d) { try { const v = localStorage.getItem('postharvestpro:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('postharvestpro:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};

/* ---------------- tools inside a block ----------------
   <div class="tool-tabs" role="tablist" data-block="2"> <button role="tab" data-tab="color" aria-controls="b2-color">…
   <section class="tool-pane" id="b2-color" role="tabpanel">…
   The open tool is remembered per block and announced to the navigator. */
const Tabs = {
  lists: {},
  mount(list) {
    const n = list.dataset.block;
    Tabs.lists[n] = list;
    const tabs = els('[role="tab"]', list);
    const open = id => {
      tabs.forEach(t => {
        const on = t.dataset.tab === id;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        const pane = el(t.getAttribute('aria-controls'));
        if (pane) pane.hidden = !on;
      });
      Prefs.set('tab' + n, id);
      document.dispatchEvent(new CustomEvent('tabchange', { detail: { block: n, tab: id } }));
    };
    list.addEventListener('click', e => { const b = e.target.closest('[role="tab"]'); if (b) open(b.dataset.tab); });
    list.addEventListener('keydown', e => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0; else if (e.key === 'End') j = tabs.length - 1;
      if (j != null) { e.preventDefault(); tabs[j].focus(); open(tabs[j].dataset.tab); }
    });
    const saved = Prefs.get('tab' + n, null);
    open(tabs.some(t => t.dataset.tab === saved) ? saved : tabs[0].dataset.tab);
    list._open = open;
  },
  of(n) { const l = Tabs.lists[n]; return l ? els('[role="tab"]', l).map(t => ({ id: t.dataset.tab, label: (t.innerText || t.textContent).trim() })) : null; },
  go(n, id) { if (String(n) !== String((document.querySelector('.step-btn.active') || {}).dataset?.step)) goStep(n); const l = Tabs.lists[n]; if (l && l._open) l._open(id); },
};
window.Tabs = Tabs;
/* the navigator of the suite shows the tools of each block as tabs */
window.LABG_NAV = Object.assign(window.LABG_NAV || {}, {
  tabs: '.tool-tabs[role="tablist"]',
  tabsOf: n => Tabs.of(n),
  goTab: (n, id) => Tabs.go(n, id),
});

/* ---------------- reading tables ----------------
   Text (CSV, TSV, semicolons, pasted cells) and spreadsheets (via Sheets).
   Decimal commas are understood when the separator is not a comma. */
const Table = {
  parseText(text) {
    text = String(text || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    const lines = text.split('\n').filter(l => l.trim() !== '');
    if (!lines.length) return { columns: [], rows: [] };
    const cand = ['\t', ';', ','];
    const count = (l, d) => { let n = 0, q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === d && !q) n++; } return n; };
    let sep = ',';
    let best = -1;
    cand.forEach(d => { const c = lines.slice(0, 20).map(l => count(l, d)); const ok = c.every(v => v === c[0]) && c[0] > 0 ? c[0] + 100 : Math.min(...c); if (ok > best) { best = ok; sep = d; } });
    const split = l => {
      const out = []; let cur = '', q = false;
      for (let i = 0; i < l.length; i++) {
        const ch = l[i];
        if (q) { if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
        else if (ch === '"') q = true; else if (ch === sep) { out.push(cur); cur = ''; } else cur += ch;
      }
      out.push(cur);
      return out.map(s => s.trim());
    };
    const grid = lines.map(split);
    return Table.fromGrid(grid, sep !== ',');
  },
  /* first row = names; numbers recognised (with decimal comma when allowed) */
  fromGrid(grid, commaDecimal) {
    const head = (grid[0] || []).map((h, i) => String(h == null || h === '' ? 'col' + (i + 1) : h).trim());
    const seen = {};
    const columns = head.map(h => { let k = h, j = 2; while (seen[k]) k = h + '_' + j++; seen[k] = true; return k; });
    const toVal = v => {
      if (v == null) return null;
      if (typeof v === 'number') return v;
      const s = String(v).trim();
      if (s === '' || /^(na|n\/a|nan|null|-|—)$/i.test(s)) return null;
      const t = commaDecimal ? s.replace(/\s/g, '').replace(',', '.') : s.replace(/\s/g, '');
      return /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t) ? +t : s;
    };
    const rows = grid.slice(1).filter(r => r && r.some(v => v != null && String(v).trim() !== '')).map(r => { const o = {}; columns.forEach((c, i) => { o[c] = toVal(r[i]); }); return o; });
    return { columns, rows };
  },
  async readFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (Sheets.isOldFormat(ext)) throw new Error(T('Ese formato antiguo de hoja de cálculo no se puede abrir; guárdala como .xlsx, .ods o .csv.', 'That old spreadsheet format cannot be opened; save it as .xlsx, .ods or .csv.'));
    if (Sheets.canRead(ext)) {
      const book = await Sheets.read(await file.arrayBuffer(), ext);
      const sheets = book.names.map(n => ({ name: n, table: Table.fromGrid(book.sheets[n].grid, false) }));
      return { name: file.name, sheets };
    }
    const text = await file.text();
    return { name: file.name, sheets: [{ name: file.name, table: Table.parseText(text) }] };
  },
  numeric(rows, key) { return rows.length && rows.filter(r => r[key] != null).every(r => typeof r[key] === 'number'); },
  /* best column for a role: by name (several spellings) or by kind */
  guess(columns, rows, role) {
    const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
    const names = (role.match || []).map(norm);
    let hit = columns.find(c => names.includes(norm(c)));
    if (!hit) hit = columns.find(c => names.some(n => n && norm(c).includes(n)));
    if (!hit && role.type === 'num') hit = null;
    return hit || '';
  },
};
window.Table = Table;

/* ---------------- the data entry of a tool ----------------
   opts: { id, roles: [{key, es, en, type:'num'|'cat'|'any', match:[…], optional}],
           examples: [{id (Datasets), es, en, prep?(rows) → rows}], onData(D) }
   D = { rows, columns, map: {role → column}, source } */
const DataIn = {
  mount(host, opts) {
    if (typeof host === 'string') host = el(host);
    const id = opts.id;
    host.classList.add('data-in');
    const ex = opts.examples || [];
    host.innerHTML =
      (ex.length ? `<div class="ex-strip"><div class="ex-t" id="${id}ExT"></div><div class="btn-row" style="margin:0">${ex.map((e, i) => `<button type="button" class="btn btn-secondary btn-sm" data-ex="${i}">${L2('Cargar ejemplo', 'Load example')}${ex.length > 1 ? ' ' + (i + 1) : ''}</button>`).join('')}<button type="button" class="btn btn-ghost btn-sm" data-excsv="1">${L2('⤓ CSV del ejemplo', '⤓ Example CSV')}</button></div></div>` : '') +
      `<div class="src-row"><label class="btn btn-secondary btn-sm" for="${id}File">${L2('Abrir archivo (CSV, TXT, XLSX, ODS)', 'Open file (CSV, TXT, XLSX, ODS)')}</label><input type="file" id="${id}File" accept=".csv,.tsv,.txt,.xlsx,.xlsm,.ods" class="sr-only">` +
      `<button type="button" class="btn btn-ghost btn-sm" data-paste="1" aria-expanded="false" aria-controls="${id}Paste">${L2('Pegar una tabla', 'Paste a table')}</button>` +
      `<span class="src-drop" id="${id}Drop">${L2('…o suelta aquí el archivo', '…or drop the file here')}</span><select id="${id}Sheet" hidden aria-label="${T('Hoja', 'Sheet')}"></select></div>` +
      `<div class="paste-box" id="${id}Paste" hidden><textarea id="${id}PasteText" rows="6" data-es-ph="Pega aquí las celdas copiadas de una hoja de cálculo, con los nombres de las columnas en la primera fila" data-en-ph="Paste here the cells copied from a spreadsheet, with the column names in the first row" aria-label="${T('Tabla pegada', 'Pasted table')}"></textarea><div class="btn-row"><button type="button" class="btn btn-primary btn-sm" data-usepaste="1">${L2('Usar la tabla pegada', 'Use the pasted table')}</button></div></div>` +
      `<div class="messages" id="${id}Msg"></div>` +
      `<div id="${id}Map" class="form-grid tight" hidden></div>` +
      `<details id="${id}PrevBox" hidden><summary class="hint" style="cursor:pointer">${L2('Ver los datos', 'See the data')} <span id="${id}N"></span></summary><div class="data-preview" id="${id}Prev"></div></details>`;
    if (window.I18N) I18N.apply(host);
    const S = { table: null, book: null, source: '' };
    const msg = el(id + 'Msg');
    const paintEx = i => {
      const t = el(id + 'ExT');
      if (!t) return;
      const e = ex[i || 0], info = Datasets.INFO[e.id] || {};
      t.innerHTML = `<b>${L2(e.es || info.es, e.en || info.en)}</b><span class="ex-sim">${L2('simulado', 'simulated')}</span><br>${L2((info.d || ['', ''])[0], (info.d || ['', ''])[1])}`;
    };
    paintEx(0);
    const mapHost = el(id + 'Map');
    const setTable = (tab, source) => {
      S.table = tab; S.source = source;
      const pn = host.closest('.step-panel');
      if (pn) state.touched[pn.id.replace('panel-', '')] = true;
      clearMessages(msg);
      if (!tab.rows.length) { showMessage(msg, 'warn', T('La tabla no tiene filas con datos.', 'The table has no rows with data.')); return; }
      const roles = opts.roles || [];
      mapHost.hidden = !roles.length;
      mapHost.innerHTML = roles.map(r => r.multi
        ? `<fieldset class="field" style="grid-column:1/-1;border:0;padding:0;margin:0"><legend class="field-label">${L2(r.es, r.en)}</legend><div class="btn-row" style="margin:4px 0 0" id="${id}R_${r.key}" data-multi="1">${tab.columns.map(c => `<label class="chip"><input type="checkbox" value="${esc(c)}" style="margin-right:5px">${esc(c)}</label>`).join('')}</div></fieldset>`
        : `<div class="field"><label for="${id}R_${r.key}">${L2(r.es, r.en)}${r.optional ? ' <small>' + L2('(opcional)', '(optional)') + '</small>' : ''}</label><select id="${id}R_${r.key}" data-role="${r.key}">${r.optional ? `<option value="">${T('— ninguna —', '— none —')}</option>` : ''}${tab.columns.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></div>`).join('');
      roles.filter(r => !r.multi).forEach(r => { const s = el(id + 'R_' + r.key); const gsel = Table.guess(tab.columns, tab.rows, r); if (gsel) s.value = gsel; else if (!r.optional) { const c = tab.columns.find(cc => (r.type === 'num') === Table.numeric(tab.rows, cc)); if (c) s.value = c; } });
      /* several columns for one role (sensory attributes): the ones the tool proposes, or the numeric ones left free */
      roles.filter(r => r.multi).forEach(r => {
        const used = roles.filter(q => !q.multi).map(q => el(id + 'R_' + q.key).value);
        const pick = r.auto ? r.auto(tab.columns, tab.rows, used) : tab.columns.filter(c => !used.includes(c) && Table.numeric(tab.rows, c));
        el(id + 'R_' + r.key).querySelectorAll('input').forEach(cb => { cb.checked = pick.includes(cb.value); });
      });
      if (S.restoreMap) { const m = S.restoreMap; S.restoreMap = null; roles.forEach(r => { const s = el(id + 'R_' + r.key); if (!s || m[r.key] == null) return; if (r.multi) s.querySelectorAll('input').forEach(cb => { cb.checked = m[r.key].includes(cb.value); }); else s.value = m[r.key]; }); }
      el(id + 'PrevBox').hidden = false;
      el(id + 'N').textContent = '(' + tab.rows.length + ' × ' + tab.columns.length + ')';
      const prev = el(id + 'Prev');
      prev.innerHTML = '<table><thead><tr>' + tab.columns.map(c => `<th>${esc(c)}</th>`).join('') + '</tr></thead><tbody>' +
        tab.rows.slice(0, 200).map(r => '<tr>' + tab.columns.map(c => `<td class="${typeof r[c] === 'number' ? 'num' : ''}">${r[c] == null ? '<span class="hint">·</span>' : esc(typeof r[c] === 'number' ? +r[c].toPrecision(10) : r[c])}</td>`).join('') + '</tr>').join('') + '</tbody></table>' +
        (tab.rows.length > 200 ? `<p class="hint" style="padding:6px 10px">${L2('Se muestran las primeras 200 filas.', 'Showing the first 200 rows.')}</p>` : '');
      fire();
    };
    const fire = () => {
      if (!S.table) return;
      const map = {};
      (opts.roles || []).forEach(r => { const s = el(id + 'R_' + r.key); map[r.key] = r.multi ? (s ? [...s.querySelectorAll('input:checked')].map(c => c.value) : []) : (s ? s.value : ''); });
      const miss = (opts.roles || []).filter(r => !r.optional && (r.multi ? !map[r.key].length : !map[r.key]));
      if (miss.length) { showMessage(msg, 'warn', T('Falta elegir la columna de: ', 'Choose the column for: ') + miss.map(r => T(r.es, r.en)).join(', ')); return; }
      state.inputs[id] = { columns: S.table.columns, rows: S.table.rows, map, source: S.source };
      try { opts.onData({ rows: S.table.rows, columns: S.table.columns, map, source: S.source }); }
      catch (e) { console.error(e); showMessage(msg, 'error', T('No se pudo analizar: ', 'Could not analyse: ') + esc(e.message || e)); }
    };
    mapHost.addEventListener('change', fire);
    host.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.ex != null) {
        const i = +b.dataset.ex, eo = ex[i];
        paintEx(i);
        const rows = Datasets.rows(eo.id);
        const tab = { columns: Datasets.columns(eo.id), rows: eo.prep ? eo.prep(rows) : rows };
        setTable(tab, 'example:' + eo.id);
      } else if (b.dataset.excsv) {
        const eo = ex[0];
        download('﻿' + Datasets.csv(eo.id), Datasets.file(eo.id), 'text/csv;charset=utf-8');
      } else if (b.dataset.paste) {
        const box = el(id + 'Paste'); box.hidden = !box.hidden; b.setAttribute('aria-expanded', String(!box.hidden));
        if (!box.hidden) el(id + 'PasteText').focus();
      } else if (b.dataset.usepaste) {
        setTable(Table.parseText(el(id + 'PasteText').value), 'paste');
      }
    });
    const openFile = async file => {
      try {
        const book = await Table.readFile(file);
        S.book = book;
        const sel = el(id + 'Sheet');
        sel.hidden = book.sheets.length < 2;
        sel.innerHTML = book.sheets.map((s, i) => `<option value="${i}">${esc(s.name)}</option>`).join('');
        setTable(book.sheets[0].table, 'file:' + file.name);
      } catch (e) { clearMessages(msg); showMessage(msg, 'error', esc(e.message || String(e))); }
    };
    el(id + 'File').addEventListener('change', e => { if (e.target.files[0]) openFile(e.target.files[0]); e.target.value = ''; });
    el(id + 'Sheet').addEventListener('change', e => { if (S.book) setTable(S.book.sheets[+e.target.value].table, 'file:' + S.book.name); });
    const drop = el(id + 'Drop');
    ['dragenter', 'dragover'].forEach(k => drop.addEventListener(k, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(k => drop.addEventListener(k, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => { const fl = e.dataTransfer.files[0]; if (fl) openFile(fl); });
    const api = {
      load(i) { const b = host.querySelector(`[data-ex="${i || 0}"]`); if (b) b.click(); },
      get: () => S.table,
      refire: fire,
      /* a table saved in a project file, with its choice of columns */
      restore(saved) { S.restoreMap = saved.map || null; setTable({ columns: saved.columns, rows: saved.rows }, saved.source || 'project'); },
    };
    DataIn.registry[id] = api;
    return api;
  },
  registry: {},
};
window.DataIn = DataIn;
/* the values of a role as numbers (null where missing) */
const colNum = (rows, key) => rows.map(r => (r[key] == null || r[key] === '' ? null : +r[key]));

/* ---------------- editable tables ----------------
   columns: [{key, es, en, type:'num'|'text'|'select', options?:[[value, es, en]], step?, width?}] */
const EditTable = {
  registry: {},
  mount(host, o) {
    if (typeof host === 'string') host = el(host);
    let rows = (o.rows || []).map(r => Object.assign({}, r));
    const draw = () => {
      const colsH = o.columns.map(c => `<th>${L2(c.es, c.en)}</th>`).join('');
      host.innerHTML = `<div class="edit-wrap"><table class="edit-table"><thead><tr><th>#</th>${colsH}<th><span class="sr-only">${T('Quitar', 'Remove')}</span></th></tr></thead><tbody>` +
        rows.map((r, i) => `<tr data-i="${i}"><td class="rn">${i + 1}</td>` + o.columns.map(c => {
          const lab = esc(T(c.es, c.en) + ' · ' + (i + 1));
          if (c.type === 'select') return `<td><select data-k="${c.key}" aria-label="${lab}">${c.options.map(op => `<option value="${esc(op[0])}"${String(r[c.key]) === String(op[0]) ? ' selected' : ''}>${esc(T(op[1], op[2] || op[1]))}</option>`).join('')}</select></td>`;
          return `<td><input data-k="${c.key}" type="${c.type === 'num' ? 'number' : 'text'}"${c.step ? ` step="${c.step}"` : ' step="any"'} value="${esc(r[c.key] == null ? '' : r[c.key])}" aria-label="${lab}"${c.width ? ` style="min-width:${c.width}px"` : ''}></td>`;
        }).join('') + `<td class="del"><button type="button" data-del="${i}" aria-label="${T('Quitar la fila ', 'Remove row ') + (i + 1)}">×</button></td></tr>`).join('') +
        `</tbody></table></div><div class="btn-row"><button type="button" class="btn btn-ghost btn-sm" data-add="1">${L2('+ Agregar fila', '+ Add row')}</button>${o.extraButtons || ''}</div>`;
    };
    const read = () => rows;
    host.addEventListener('input', e => {
      const inp = e.target.closest('[data-k]');
      if (!inp) return;
      const i = +inp.closest('tr').dataset.i, c = o.columns.find(x => x.key === inp.dataset.k);
      rows[i][c.key] = c.type === 'num' ? (inp.value === '' ? null : +inp.value) : inp.value;
      if (o.onChange) o.onChange(rows);
    });
    host.addEventListener('change', e => { if (e.target.closest('select[data-k]')) { const s = e.target; const i = +s.closest('tr').dataset.i; rows[i][s.dataset.k] = s.value; if (o.onChange) o.onChange(rows); } });
    host.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.add) { rows.push(o.blank ? o.blank(rows) : {}); draw(); if (o.onChange) o.onChange(rows); }
      else if (b.dataset.del != null) { rows.splice(+b.dataset.del, 1); draw(); if (o.onChange) o.onChange(rows); }
    });
    draw();
    document.addEventListener('langchange', draw);
    const api = { get: read, set(r) { rows = r.map(x => Object.assign({}, x)); const pn = host.closest('.step-panel'); if (pn) state.touched[pn.id.replace('panel-', '')] = true; draw(); if (o.onChange) o.onChange(rows); }, redraw: draw };
    if (o.id) EditTable.registry[o.id] = api;
    return api;
  },
};
window.EditTable = EditTable;

/* ---------------- figures ----------------
   Fig.put(host, svg, {name, title (bilingual html), caption, data?: {header, rows}})
   The box is the one the figure studio of the suite recognises (.fig-box). */
const Fig = {
  put(host, svg, o) {
    if (typeof host === 'string') host = el(host);
    if (!host) return null;
    o = o || {};
    const box = mk('figure', { class: 'fig-box', 'data-fig': o.name || '' });
    box.innerHTML = (o.title ? `<div class="fig-title">${o.title}</div>` : '') + svg + (o.caption ? `<figcaption>${o.caption}</figcaption>` : '');
    const tools = mk('div', { class: 'fig-tools no-print' });
    tools.innerHTML = `<button type="button" class="icon-btn" data-svg="1" title="${T('Descargar SVG', 'Download SVG')}" aria-label="${T('Descargar SVG', 'Download SVG')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg></button>` +
      `<button type="button" class="icon-btn" data-png="1" title="${T('Descargar PNG a 300 ppp', 'Download PNG at 300 ppi')}" aria-label="${T('Descargar PNG a 300 ppp', 'Download PNG at 300 ppi')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M5 17l5-5 4 4 2-2 4 4"/></svg></button>` +
      (o.data ? `<button type="button" class="icon-btn" data-csv="1" title="${T('Datos de la figura (CSV)', 'Figure data (CSV)')}" aria-label="${T('Datos de la figura (CSV)', 'Figure data (CSV)')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16"/></svg></button>` : '');
    box.appendChild(tools);
    tools.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const s = box.querySelector('svg.pl');
      const nm = (o.name || 'figura');
      if (b.dataset.svg) download(Fig.svgText(s), nm + '.svg', 'image/svg+xml');
      else if (b.dataset.png) Fig.png(s, nm + '.png');
      else if (b.dataset.csv) download(Out.csvText(o.data.header, o.data.rows), nm + '.csv', 'text/csv;charset=utf-8');
    });
    host.appendChild(box);
    if (o.name) state.figures[o.name] = { title: o.titleText || (o.title || '').replace(/<[^>]+>/g, ''), block: o.block || null, at: Date.now() };
    return box;
  },
  /* a copy of the SVG with the computed colours and fonts written in (light theme) */
  bake(svg) {
    const root = document.documentElement, had = root.getAttribute('data-theme');
    /* no colour transitions while the light colours are read */
    const still = document.createElement('style');
    still.textContent = '*{transition:none!important;animation:none!important}';
    document.head.appendChild(still);
    root.setAttribute('data-theme', 'light');
    const clone = svg.cloneNode(true);
    const src = [svg, ...svg.querySelectorAll('*')], dst = [clone, ...clone.querySelectorAll('*')];
    const P = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-opacity', 'fill-opacity', 'opacity', 'font-size', 'font-weight', 'font-family', 'text-anchor', 'letter-spacing', 'text-transform'];
    src.forEach((n, i) => {
      if (!(n instanceof Element)) return;
      const cs = getComputedStyle(n), d = dst[i];
      P.forEach(p => {
        let v = cs.getPropertyValue(p);
        if (!v) return;
        if (p === 'text-transform' && v === 'uppercase' && d.tagName === 'text') { d.textContent = d.textContent.toUpperCase(); return; }
        if (p === 'text-transform') return;
        d.style.setProperty(p, v);
      });
      d.removeAttribute('class');
    });
    if (had == null) root.removeAttribute('data-theme'); else root.setAttribute('data-theme', had);
    still.remove();
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    return clone;
  },
  svgText(svg) { return '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(Fig.bake(svg)); },
  /* PNG at 300 ppi, 170 mm wide by default (a full page column), with its physical size written in */
  png(svg, name, wmm, ppi) {
    wmm = wmm || 170; ppi = ppi || 300;
    const vb = svg.viewBox.baseVal, Wpx = Math.round(wmm / 25.4 * ppi), Hpx = Math.round(Wpx * vb.height / vb.width);
    const text = Fig.svgText(svg);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = Wpx; c.height = Hpx;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, Wpx, Hpx);
      ctx.drawImage(img, 0, 0, Wpx, Hpx);
      c.toBlob(async blob => { download(await Fig.withPPI(blob, ppi), name); }, 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
  },
  /* insert the pHYs chunk (pixels per metre) right after IHDR */
  async withPPI(blob, ppi) {
    const b = new Uint8Array(await blob.arrayBuffer());
    const ppm = Math.round(ppi / 0.0254);
    const chunk = new Uint8Array(21);
    const dv = new DataView(chunk.buffer);
    dv.setUint32(0, 9); chunk.set([112, 72, 89, 115], 4); dv.setUint32(8, ppm); dv.setUint32(12, ppm); chunk[16] = 1;
    dv.setUint32(17, Zip.crc32(chunk.subarray(4, 17)));
    const out = new Uint8Array(b.length + 21);
    out.set(b.subarray(0, 33), 0); out.set(chunk, 33); out.set(b.subarray(33), 54);
    return new Blob([out], { type: 'image/png' });
  },
};
window.Fig = Fig;

/* ---------------- report registry ----------------
   Each block leaves a section: Report.set(key, {order, title: [es, en], html: () => string (in the
   active language), figs: [names]}). Block 9 assembles them. */
const Report = {
  sections: {},
  set(key, sec) { Report.sections[key] = sec; blockDone(key.split(':')[0]); },
  list() { return Object.entries(Report.sections).sort((a, b) => (a[1].order || 0) - (b[1].order || 0)); },
};
window.Report = Report;
/* ---------------- for the report: a figure and a table as they are now ---------------- */
function reportFig(name) {
  const box = document.querySelector(`.fig-box[data-fig="${name}"]`);
  if (!box) return '';
  const svg = box.querySelector('svg.pl');
  const t = box.querySelector('.fig-title');
  return `<figure>${new XMLSerializer().serializeToString(Fig.bake(svg))}<figcaption>${t ? esc(t.innerText) : ''}</figcaption></figure>`;
}
function reportTable(id) {
  const t = el(id) && el(id).querySelector('table');
  return t ? `<div class="tbl">${t.outerHTML}</div>` : '';
}
window.PHRep = { fig: reportFig, table: reportTable };


/* ---------------- to another app of the suite ----------------
   The table goes as a CSV (downloaded) and, for the apps that read it, in a
   hand-off record in this browser (same origin in the suite's site). */
const Send = {
  APPS: { PCAPro: 'https://luisangelbg.github.io/PCAPro/', EconomicsPro: 'https://luisangelbg.github.io/EconomicsPro/', AgriDesign: 'https://luisangelbg.github.io/AgriDesign/' },
  to(app, o) {
    const rec = { from: 'PostHarvestPro', to: app, kind: o.kind, name: o.name, date: new Date().toISOString(), csv: o.csv, note: o.note || '' };
    try { localStorage.setItem('labg:handoff', JSON.stringify(rec)); } catch (e) { /* private mode */ }
    download(o.csv, o.name + '.csv', 'text/csv;charset=utf-8');
    if (window.LABG) LABG.toast(T('Se descargó «', 'Downloaded «') + o.name + T('.csv»: ábrelo en ', '.csv»: open it in ') + app + T(' (Bloque de datos).', ' (data block).'), { type: 'success', timeout: 6000 });
    window.open(Send.APPS[app], '_blank', 'noopener');
  },
};
window.Send = Send;

/* a setting changed by hand marks its block as worked on */
['input', 'change'].forEach(k => document.addEventListener(k, e => {
  if (!e.isTrusted) return;
  const p = e.target && e.target.closest && e.target.closest('.step-panel');
  if (p && p.id !== 'panel-1' && p.id !== 'panel-9') { state.touched[p.id.replace('panel-', '')] = true; refreshStepMarks(); }
}, true));

/* ---------------- start ---------------- */
document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
  els('.tool-tabs[role="tablist"]').forEach(l => Tabs.mount(l));
  if (!window.LABG) return;
  if (LABG.work) LABG.work.tips = [
    ['La firmeza de primer orden pierde la misma fracción cada día: su vida media no depende de dónde empiezas.', 'First-order firmness loses the same fraction each day: its half-life does not depend on where you start.'],
    ['Q10 cambia con la temperatura: si lo usas lejos del intervalo donde se midió, la vida de anaquel se aleja de la real.', 'Q10 changes with temperature: used far from the range where it was measured, the predicted shelf life drifts.'],
    ['En una prueba triangular, 1 de cada 3 aciertos llega por azar; d′ corrige eso y permite comparar métodos.', 'In a triangle test one correct answer in three comes by chance; d′ corrects for it and lets methods be compared.'],
  ];
  const hb = el('helpBtn');
  if (hb) hb.addEventListener('click', () => LABG.showShortcuts());
  LABG.shortcuts([]);
  LABG.bindStepKeys(goStep);
  LABG.guardUnload(() => Object.keys(state.touched).length > 0);
  LABG.setCurrentStep((document.querySelector('.step-btn.active') || {}).dataset?.step || '1');
  document.addEventListener('themechange', paintCommonBar);
  document.addEventListener('langchange', () => { paintCommonBar(); refreshStepFooters(); });
  paintCommonBar();
  refreshStepMarks();
  refreshStepFooters();
}, 0));

/* run a computation after the browser paints, inside the suite's waiting layer */
function afterPaint(title, fn) {
  const w = window.LABG && LABG.work ? LABG.work({ title }) : null;
  return (window.LABG ? LABG.nextPaint() : new Promise(r => setTimeout(r, 30)))
    .then(fn)
    .then(r => { if (w && !w.ended) w.done(); return r; }, e => { if (w && !w.ended) w.fail(e && e.message ? e.message : String(e)); console.error(e); throw e; });
}
const cssVar = (name, fb) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fb || '';

/* ---------------- small form helpers for the panels ---------------- */
const UI = {
  num: (id, es, en, v, o) => { o = o || {}; return `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="number" id="${id}" value="${v}" step="${o.step || 'any'}"${o.min != null ? ` min="${o.min}"` : ''}${o.max != null ? ` max="${o.max}"` : ''}>${o.help ? `<small>${o.help}</small>` : ''}</div>`; },
  text: (id, es, en, v, o) => { o = o || {}; return `<div class="field"><label for="${id}">${L2(es, en)}</label><input type="text" id="${id}" value="${esc(v)}">${o.help ? `<small>${o.help}</small>` : ''}</div>`; },
  sel: (id, es, en, opts, v, o) => { o = o || {}; return `<div class="field"><label for="${id}">${L2(es, en)}</label><select id="${id}">${opts.map(op => `<option value="${esc(op[0])}"${String(op[0]) === String(v) ? ' selected' : ''} data-es="${esc(op[1])}" data-en="${esc(op[2] || op[1])}">${esc(op[1])}</option>`).join('')}</select>${o.help ? `<small>${o.help}</small>` : ''}</div>`; },
  check: (id, es, en, on) => `<label class="checkbox-label"><input type="checkbox" id="${id}"${on ? ' checked' : ''}> ${L2(es, en)}</label>`,
  v: id => { const n = el(id); return n ? +n.value : NaN; },
  s: id => { const n = el(id); return n ? n.value : ''; },
  on: id => { const n = el(id); return !!(n && n.checked); },
  /* the panel of a block from its parts: title line and the tool tabs with their panes */
  panel(n, es, en, subEs, subEn, tools) {
    return `<div class="panel-title"><div class="pt-num">${n}</div><div><h2>${L2(es, en)}</h2><p>${L2(subEs, subEn)}</p></div></div>` +
      `<div class="tool-tabs" role="tablist" data-block="${n}" aria-label="${esc(es)}">` +
      tools.map(t => `<button type="button" role="tab" class="tool-tab" id="b${n}t-${t.id}" data-tab="${t.id}" aria-controls="b${n}-${t.id}" aria-selected="false">${L2(t.es, t.en)}</button>`).join('') + `</div>` +
      tools.map(t => `<section class="tool-pane" id="b${n}-${t.id}" role="tabpanel" aria-labelledby="b${n}t-${t.id}" hidden>${t.html}</section>`).join('');
  },
};
window.UI = UI;

Object.assign(window, {
  STEPS, el, els, mk, esc, L2, showMessage, clearMessages, statTiles, buildTable, citeMethod, fmtNum, fmtP, stars,
  download, goStep, stepOn, stepName, Prefs, blockDone, colNum, afterPaint, cssVar, refreshStepMarks,
});
