/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   Tests of the figures (js/plot.js) that need no page: numbers on the axes, the placement of labels and the
   traces of the modified-atmosphere plane. The SVG is read as text. */
(function () {
'use strict';
const P = () => window.Plot;
/* the boxes of two labels overlap */
const meet = (a, b) => Math.min(a[2], b[2]) > Math.max(a[0], b[0]) && Math.min(a[3], b[3]) > Math.max(a[1], b[1]);

TEST('plot', 'axis numbers: thousands with a thin space from five digits on', a => {
  const t = P().tickLabel;
  a.eq(t(10000, 2000), '10 000', '10 000');
  a.eq(t(125000, 25000), '125 000', '125 000');
  a.eq(t(2000, 500), '2000', 'four digits without a space (as Fmt.num)');
  a.eq(t(-12000, 2000), '−12 000', 'negative');
  a.eq(t(12500.5, 0.5), '12 500.5', 'with decimals');
  a.eq(t(0.25, 0.05), '0.25', 'small');
});

TEST('plot', 'labels: none crosses a line it can avoid, none on another', a => {
  /* three points next to a vertical line: the label of each must not cross it */
  const items = [0, 1, 2].map(i => ({ X: 200 - 1, Y: 100 + 30 * i, w: 60, th: 11, r: 4.5 }));
  const segs = [[200, 20, 200, 300]];
  const res = P().placeLabels(items, items.map(q => [q.X - 5, q.Y - 6, q.X + 5, q.Y + 6]), segs, [20, 20, 400, 300]);
  res.forEach((b, i) => a.ok(!(b.box[0] < 200 && b.box[2] > 200), 'label ' + i + ' does not cross the line'));
  for (let i = 0; i < res.length; i++) for (let j = i + 1; j < res.length; j++) a.ok(!meet(res[i].box, res[j].box), 'labels ' + i + ' and ' + j + ' apart');
  res.forEach((b, i) => a.ok(b.box[0] >= 20 && b.box[2] <= 400 && b.box[1] >= 20 && b.box[3] <= 300, 'label ' + i + ' inside'));
});

TEST('plot', 'biplot: labels apart, off the arrows', a => {
  /* a product map where the products sit near the arrows (as in the coffee profile) */
  const svg = P().biplot({ w: 560, h: 420, arrows: true, rows: { names: ['Honey', 'Comercial', 'Lavado', 'Natural'], x: [1.2, -1.5, 0.3, 0.1], y: [0.4, -0.2, 1.1, -1.2] }, cols: { names: ['Dulzor', 'Residual', 'Fragancia', 'Astringencia', 'Acidez'], x: [1.0, 0.9, 1.1, -1.2, 0.2], y: [0.5, 0.35, 0.6, -0.1, 1.0] }, rowsName: 'productos', colsName: 'atributos' });
  const txt = [...svg.matchAll(/<text class="(pl-note|pl-txt-b)" x="([-\d.]+)" y="([-\d.]+)"(?: text-anchor="(\w+)")?[^>]*>([^<]*)<\/text>/g)].map(m => {
    const x = +m[2], y = +m[3], w = m[5].length * (m[1] === 'pl-note' ? 5.5 : 6.6), l = m[4] === 'end' ? x - w : m[4] === 'middle' ? x - w / 2 : x;
    return { t: m[5], box: [l, y - 9, l + w, y + 2] };
  });
  a.eq(txt.length, 9, 'nine labels');
  for (let i = 0; i < txt.length; i++) for (let j = i + 1; j < txt.length; j++) a.ok(!meet(txt[i].box, txt[j].box), txt[i].t + ' and ' + txt[j].t + ' apart');
  const W = +svg.match(/viewBox="0 0 (\d+)/)[1];
  txt.forEach(q => a.ok(q.box[0] >= 0 && q.box[2] <= W, q.t + ' inside the figure'));
});

TEST('plot', 'radar: the names of the axes fit in the figure', a => {
  const axes = ['Fragancia', 'Acidez', 'Cuerpo', 'Dulzor', 'Amargor', 'Astringencia', 'Residual'];
  const svg = P().radar({ w: 560, h: 420, axes, series: [{ name: 'Natural de altura', values: axes.map(() => 6) }, { name: 'Comercial', values: axes.map(() => 4) }], min: 0, max: 8 });
  const labs = [...svg.matchAll(/<text class="pl-lab" x="([-\d.]+)" y="[-\d.]+" text-anchor="(\w+)">([^<]*)<\/text>/g)];
  a.eq(labs.length, axes.length, 'one name per axis');
  labs.forEach(m => { const x = +m[1], w = m[3].length * 6.9; const l = m[2] === 'end' ? x - w : m[2] === 'middle' ? x - w / 2 : x; a.ok(l >= 0, m[3] + ' not cut at the left'); });
});

TEST('plot', 'modified atmosphere: every film with its own color and trace', a => {
  const lines = ['ldpe', 'lldpe', 'hdpe', 'pp', 'bopp', 'pvc', 'eva', 'ps', 'pet'].map((n, i) => ({ name: n, beta: 2 + i, rq: 1 }));
  const svg = P().mapPlane({ lines, window: { o2: [2, 5], co2: [3, 8] } });
  const st = [...svg.matchAll(/<line x1="[-\d.]+" y1="[-\d.]+" x2="[-\d.]+" y2="[-\d.]+" stroke="(var\(--s\d\))" stroke-width="1.8"(?: stroke-dasharray="([^"]+)")?\/>/g)].map(m => m[1] + '|' + (m[2] || ''));
  a.eq(st.length, 9, 'nine films');
  a.eq(new Set(st).size, 9, 'no two films alike');
  /* close tones (blue s2, teal s8, green s3) never share a trace */
  const tr = c => st.filter(s => s.startsWith('var(--' + c + ')')).map(s => s.split('|')[1]);
  const near = tr('s2').concat(tr('s8'), tr('s3'));
  a.eq(new Set(near).size, near.length, 'blue, teal and green with different traces');
});
})();
