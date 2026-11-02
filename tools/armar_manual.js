/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.

   Turns docs/manual.md into docs/manual.html: a printable page (letter size,
   one chapter per page, cover and table of contents) with the app's colours.
   A small Markdown reader of our own (headings, paragraphs, lists, tables,
   code blocks, images, links, bold, italics, inline code); nothing else is
   needed for this manual.

       node tools/armar_manual.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '..');
const md = fs.readFileSync(path.join(root, 'docs', 'manual.md'), 'utf8').replace(/\r\n?/g, '\n');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const NUL = String.fromCharCode(0);
function inline(s) {
  const codes = [];
  s = s.replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return NUL + (codes.length - 1) + NUL; });
  s = esc(s).replace(/\\\*/g, '&#42;');
  s = s.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/&lt;(https?:\/\/[^&]+)&gt;/g, '<a href="$1">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<i>$2</i>');
  return s.replace(new RegExp(NUL + '(\\d+)' + NUL, 'g'), (m, i) => '<code>' + esc(codes[+i]) + '</code>');
}
const lines = md.split('\n'), out = [], toc = [];
let i = 0, title = '', subtitle = '';
const isList = t => /^\s*[-*]\s+/.test(t) || /^\s*\d+\.\s+/.test(t);
while (i < lines.length) {
  const L = lines[i];
  if (/^```/.test(L)) { const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; out.push('<pre>' + esc(buf.join('\n')) + '</pre>'); continue; }
  let m;
  if ((m = /^(#{1,4})\s+(.*)$/.exec(L))) {
    const lv = m[1].length, txt = m[2];
    if (lv === 1) { title = txt; i++; continue; }
    const id = slug(txt);
    if (lv === 2) { out.push('</section><section class="chapter">'); toc.push([id, txt]); }
    out.push(`<h${lv} id="${id}">${inline(txt)}</h${lv}>`); i++; continue;
  }
  if (/^---\s*$/.test(L)) { i++; continue; }
  if (/^\|/.test(L)) {
    const rows = [];
    while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
    const cells = r => r.replace(/^\||\|\s*$/g, '').split('|').map(c => c.trim());
    const head = cells(rows[0]), body = rows.slice(2).map(cells);
    out.push('<table><thead><tr>' + head.map(h => `<th>${inline(h)}</th>`).join('') + '</tr></thead><tbody>' + body.map(r => '<tr>' + r.map(c => `<td>${inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table>');
    continue;
  }
  if (isList(L)) {
    const ordered = /^\s*\d+\.\s+/.test(L), items = [];
    while (i < lines.length && (isList(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
      const t = lines[i];
      if (/^\s{2,}\S/.test(t) && !isList(t)) items[items.length - 1] += ' ' + t.trim();
      else items.push(t.replace(/^\s*([-*]|\d+\.)\s+/, ''));
      i++;
    }
    out.push(`<${ordered ? 'ol' : 'ul'}>` + items.map(t => `<li>${inline(t)}</li>`).join('') + `</${ordered ? 'ol' : 'ul'}>`);
    continue;
  }
  if (!L.trim()) { i++; continue; }
  const buf = [];
  while (i < lines.length && lines[i].trim() && !/^(#|\||```|---)/.test(lines[i]) && !isList(lines[i])) buf.push(lines[i++]);
  const p = buf.join(' ').trim();
  const img = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(p);
  if (img) out.push(`<figure><img src="${img[2]}" alt="${esc(img[1])}"><figcaption>${esc(img[1])}</figcaption></figure>`);
  else if (!subtitle && /^\*\*/.test(p) && !out.length) subtitle = p.replace(/\*\*/g, '');
  else if (!out.length && /Barrera-Guzmán/.test(p)) { /* the byline goes on the cover */ }
  else out.push('<p>' + inline(p) + '</p>');
}
const body = out.join('\n').replace(/^<\/section>/, '');
const box = { window: {} }; box.window.window = box.window; vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'art.js'), 'utf8'), box);
const logo = box.window.Art.logo(140);
const css = `
:root { --o: #EF6C00; --od: #B85000; --g: #7CB342; --gt: #4E7A1E; --c: #FFF3E0; --gold: #7D5B14; }
* { box-sizing: border-box; }
body { font-family: system-ui, "Segoe UI", sans-serif; color: #1C150E; margin: 0; background: #fff; line-height: 1.55; font-size: 15px; }
.cover { min-height: 96vh; display: flex; flex-direction: column; justify-content: center; padding: 60px 70px; background: radial-gradient(700px 420px at 10% 15%, rgba(124,179,66,.25), transparent 62%), radial-gradient(760px 480px at 100% 0%, rgba(239,108,0,.22), transparent 60%), linear-gradient(160deg, #FFF8EC, #FFE9CF); }
.cover .k { letter-spacing: .2em; font-weight: 700; color: var(--gold); font-size: 14px; margin-top: 18px; }
.cover h1 { font-size: 48px; margin: 12px 0 8px; line-height: 1.05; } .cover h1 b { color: var(--o); }
.cover p { font-size: 19px; color: #4A3F33; margin: 0 0 6px; max-width: 640px; }
.toc { padding: 40px 70px; page-break-after: always; } .toc h2 { border: 0; color: #1C150E; } .toc ol { columns: 2; font-size: 15px; } .toc a { color: #1C150E; text-decoration: none; }
main { max-width: 860px; margin: 0 auto; padding: 0 30px 60px; }
section.chapter { page-break-before: always; padding-top: 10px; }
h2 { font-size: 26px; color: var(--od); border-bottom: 3px solid var(--o); padding-bottom: 6px; margin: 30px 0 12px; }
h3 { font-size: 19px; margin: 24px 0 8px; color: #1C150E; } h4 { font-size: 16px; }
a { color: var(--od); } code { font-family: ui-monospace, monospace; background: #F3ECE2; padding: 0 4px; border-radius: 4px; font-size: .92em; }
pre { background: #F3ECE2; padding: 12px 14px; border-radius: 10px; overflow-x: auto; font-size: 12.5px; white-space: pre-wrap; }
table { border-collapse: collapse; width: 100%; font-size: 13.5px; margin: 10px 0 14px; page-break-inside: avoid; }
th { background: #F3ECE2; text-align: left; padding: 6px 8px; border-bottom: 2px solid #CDBDAA; } td { padding: 5px 8px; border-bottom: 1px solid #EADFD1; vertical-align: top; }
figure { margin: 12px 0 18px; page-break-inside: avoid; text-align: center; } figure img { max-width: 100%; border: 1px solid #EADFD1; border-radius: 10px; } figcaption { font-size: 12.5px; color: #5D5247; margin-top: 4px; }
ul, ol { padding-left: 22px; } li { margin: 3px 0; }
footer { text-align: center; font-size: 12px; color: #5D5247; border-top: 1px solid #EADFD1; padding: 14px; margin-top: 40px; }
@media print { body { font-size: 11pt; } .cover { min-height: 0; height: 250mm; } a { color: #1C150E; text-decoration: none; } main { padding: 0; } }
@page { size: letter; margin: 18mm 16mm; }
`;
const html = `<!DOCTYPE html>
<!-- PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
     Written by tools/armar_manual.js from docs/manual.md. -->
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title><style>${css}</style></head><body>
<div class="cover">${logo}<div class="k">LABG SUITE · MANUAL</div><h1>PostHarvest<b>Pro</b> 1.0.0</h1><p>${esc(subtitle)}</p><p>Luis Ángel Barrera-Guzmán · 2026 · Software libre GPL-3.0</p><p>https://luisangelbg.github.io/PostHarvestPro/</p></div>
<nav class="toc"><h2>Contenido</h2><ol>${toc.map(([id, t]) => `<li><a href="#${id}">${inline(t)}</a></li>`).join('')}</ol></nav>
<main><section class="chapter intro">${body}</section></main>
<footer>PostHarvestPro 1.0.0 · Manual · Luis Ángel Barrera-Guzmán · GPL-3.0</footer>
</body></html>
`;
fs.writeFileSync(path.join(root, 'docs', 'manual.html'), html);
console.log('docs/manual.html:', html.length, 'caracteres,', toc.length, 'capítulos.');
