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

/* PostHarvestPro — the figure kit.

   Every figure is an SVG string: curves over time with error bars and
   confidence bands, bars with letters, survival steps, spider charts, maps of
   products and attributes, the Sankey of a value chain, the psychrometric
   chart, the O₂–CO₂ plane of a package and the top view of a pallet.

   The conventions the suite's figure studio and editor (✎) read are written
   into the markup: data-plot ("left top width height" of the plotting area)
   with data-xr and data-yr on the <svg>, data-role on grid, axes, ticks,
   labels and legend, data-li on each legend entry; data-name names the
   figure. Ink, grid and background come from CSS variables, so they follow the
   light and dark themes; series colours are var(--s1)…var(--s8). */
(function (g) {
'use strict';
const Plot = {};
const f = v => (Math.round(v * 100) / 100).toString();
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
Plot.esc = esc;
Plot.color = i => 'var(--s' + ((i % 8) + 1) + ')';
const DASH = ['', '6 3', '2 3', '8 3 2 3', '4 2', '1 2'];
const SHAPES = ['circle', 'square', 'triangle', 'diamond', 'down', 'cross'];

/* ---------------- numbers on axes ---------------- */
Plot.ticks = function (lo, hi, count) {
  count = count || 5;
  if (!(hi > lo)) { hi = lo + 1; lo = lo - 1; }
  const nice = (x, round) => {
    const e = Math.floor(Math.log10(x)), fr = x / Math.pow(10, e);
    let nf;
    if (round) nf = fr < 1.5 ? 1 : fr < 3 ? 2 : fr < 7 ? 5 : 10;
    else nf = fr <= 1 ? 1 : fr <= 2 ? 2 : fr <= 5 ? 5 : 10;
    return nf * Math.pow(10, e);
  };
  const range = nice(hi - lo, false), step = nice(range / Math.max(1, count - 1), true);
  const t0 = Math.ceil(lo / step - 1e-9) * step, out = [];
  for (let v = t0; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
  return { ticks: out, step };
};
Plot.tickLabel = function (v, step) {
  const d = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  const s = v.toFixed(Math.min(6, d));
  const dec = g.Fmt && g.Fmt.dec ? g.Fmt.dec() : '.';
  return s.replace('-', '−').replace('.', dec);
};
Plot.scale = (d0, d1, r0, r1) => { const k = (r1 - r0) / ((d1 - d0) || 1); const s = v => r0 + (v - d0) * k; s.inv = p => d0 + (p - r0) / k; return s; };
Plot.extent = function (arrs, pad, zero) {
  let lo = Infinity, hi = -Infinity;
  arrs.forEach(a => (a || []).forEach(v => { if (v != null && isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } }));
  if (!isFinite(lo)) return [0, 1];
  if (zero) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  if (hi === lo) { lo -= 1; hi += 1; }
  const p = (hi - lo) * (pad == null ? 0.06 : pad);
  return [zero && lo === 0 ? 0 : lo - p, hi + p];
};

/* ---------------- frame ---------------- */
Plot.open = function (W, H, o, g0, label) {
  const mark = g0 ? ` data-plot="${f(g0.x0)} ${f(g0.y1)} ${f(g0.x1 - g0.x0)} ${f(g0.y0 - g0.y1)}" data-xr="${+g0.ex[0].toPrecision(10)} ${+g0.ex[1].toPrecision(10)}" data-yr="${+g0.ey[0].toPrecision(10)} ${+g0.ey[1].toPrecision(10)}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="pl${o.cls ? ' ' + o.cls : ''}"${mark} data-name="${esc(o.name || 'figure')}" role="img" aria-label="${esc(label || o.title || '')}"><rect class="pl-bg" x="0" y="0" width="${W}" height="${H}"/>`;
};
Plot.frame = function (o) {
  const { x0, x1, y0, y1, sx, sy, xt, yt, xlab, ylab } = o;
  let s = '';
  if (o.grid !== false) {
    s += `<g data-role="grid" class="pl-grid">`;
    if (xt) xt.ticks.forEach(v => { const X = sx(v); if (X >= x0 - 0.5 && X <= x1 + 0.5) s += `<line x1="${f(X)}" y1="${f(y0)}" x2="${f(X)}" y2="${f(y1)}"/>`; });
    yt.ticks.forEach(v => { const Y = sy(v); if (Y <= y0 + 0.5 && Y >= y1 - 0.5) s += `<line x1="${f(x0)}" y1="${f(Y)}" x2="${f(x1)}" y2="${f(Y)}"/>`; });
    s += `</g>`;
  }
  s += `<g data-role="axis" class="pl-axis"><line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y0)}"/><line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x0)}" y2="${f(y1)}"/></g>`;
  if (xt) {
    s += `<g class="pl-tick" data-role="xtick">`;
    xt.ticks.forEach(v => { const X = sx(v); if (X >= x0 - 0.5 && X <= x1 + 0.5) s += `<line x1="${f(X)}" y1="${f(y0)}" x2="${f(X)}" y2="${f(y0 + 4)}"/><text x="${f(X)}" y="${f(y0 + 15)}" text-anchor="middle">${xt.label ? esc(xt.label(v)) : Plot.tickLabel(v, xt.step)}</text>`; });
    s += `</g>`;
  }
  s += `<g class="pl-tick" data-role="ytick">`;
  yt.ticks.forEach(v => { const Y = sy(v); if (Y <= y0 + 0.5 && Y >= y1 - 0.5) s += `<line x1="${f(x0 - 4)}" y1="${f(Y)}" x2="${f(x0)}" y2="${f(Y)}"/><text x="${f(x0 - 7)}" y="${f(Y + 3.5)}" text-anchor="end">${Plot.tickLabel(v, yt.step)}</text>`; });
  s += `</g>`;
  if (xlab) s += `<text class="pl-lab" data-role="xlab" x="${f((x0 + x1) / 2)}" y="${f(y0 + 32)}" text-anchor="middle">${esc(xlab)}</text>`;
  if (ylab) s += `<text class="pl-lab" data-role="ylab" transform="translate(${f(x0 - (o.ylabGap || 40))} ${f((y0 + y1) / 2)}) rotate(-90)" text-anchor="middle">${esc(ylab)}</text>`;
  if (o.title) s += `<text class="pl-title" data-role="title" x="${f(x0)}" y="18">${esc(o.title)}</text>`;
  return s;
};
/* a marker of one of six shapes (also legible in grey) */
Plot.marker = function (shape, x, y, r, color, extra) {
  const st = `fill="${color}" class="pl-pt"${extra || ''}`;
  if (shape === 'square') return `<rect x="${f(x - r)}" y="${f(y - r)}" width="${f(2 * r)}" height="${f(2 * r)}" ${st}/>`;
  if (shape === 'triangle') return `<path d="M${f(x)} ${f(y - r * 1.2)}L${f(x + r * 1.1)} ${f(y + r * 0.8)}L${f(x - r * 1.1)} ${f(y + r * 0.8)}Z" ${st}/>`;
  if (shape === 'down') return `<path d="M${f(x)} ${f(y + r * 1.2)}L${f(x + r * 1.1)} ${f(y - r * 0.8)}L${f(x - r * 1.1)} ${f(y - r * 0.8)}Z" ${st}/>`;
  if (shape === 'diamond') return `<path d="M${f(x)} ${f(y - r * 1.3)}L${f(x + r * 1.3)} ${f(y)}L${f(x)} ${f(y + r * 1.3)}L${f(x - r * 1.3)} ${f(y)}Z" ${st}/>`;
  if (shape === 'cross') return `<path d="M${f(x - r)} ${f(y - r)}L${f(x + r)} ${f(y + r)}M${f(x + r)} ${f(y - r)}L${f(x - r)} ${f(y + r)}" stroke="${color}" stroke-width="2" fill="none"${extra || ''}/>`;
  return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" ${st}/>`;
};
/* a legend in a column or a row; items [{name, color, shape?, dash?, kind:'line'|'pt'|'box'}] */
Plot.legend = function (items, x, y, o) {
  o = o || {};
  let s = `<g data-role="legend" class="pl-legend">`;
  if (o.title) { s += `<text class="pl-legend-title" x="${f(x)}" y="${f(y)}">${esc(o.title)}</text>`; y += 14; }
  let cx = x;
  items.forEach((it, i) => {
    const X = o.row ? cx : x, Y = o.row ? y : y + i * 16;
    s += `<g data-li="${i}">`;
    if (it.kind === 'box') s += `<rect x="${f(X)}" y="${f(Y - 8)}" width="12" height="10" rx="2" fill="${it.color}"/>`;
    else {
      if (it.kind !== 'pt') s += `<line x1="${f(X)}" y1="${f(Y - 3)}" x2="${f(X + 18)}" y2="${f(Y - 3)}" stroke="${it.color}" stroke-width="2"${it.dash ? ` stroke-dasharray="${it.dash}"` : ''}/>`;
      if (it.shape) s += Plot.marker(it.shape, X + 9, Y - 3, 3.4, it.color);
    }
    s += `<text x="${f(X + 24)}" y="${f(Y + 1)}">${esc(it.name)}</text></g>`;
    if (o.row) cx += 34 + String(it.name).length * 6.2;
  });
  return s + `</g>`;
};
function legendWidth(items) { return 34 + Math.max(...items.map(it => String(it.name).length)) * 6.2; }

/* ---------------- curves over a numeric x ----------------
   o: { series: [{name, x[], y[], lo?[], hi?[], color?, dash?, shape?, line?:bool, points?:bool,
                  band?:{x[], lo[], hi[]}}], xlab, ylab, w, h, title, name, label,
        hlines?: [{y, label, at?: 'start'|'end' (where the label goes; end by default)}], vlines?: [{x, label}], zones?: [{y0, y1, cls}], yZero?, xMin?, legend?:bool } */
Plot.lines = function (o) {
  const W = o.w || 620, H = o.h || 360;
  const S = o.series.filter(s => s && s.x && s.x.length);
  const hasLeg = o.legend !== false && S.length > 1 || o.legend === true;
  const items = S.map((s, i) => ({ name: s.name, color: s.color || Plot.color(i), shape: s.points === false ? null : (s.shape || SHAPES[i % 6]), dash: s.dash != null ? s.dash : '', kind: s.legendKind || (s.line === false ? 'pt' : 'line') }));
  /* a series with noLegend (a fitted line next to its points) is drawn but not listed */
  const legItems = items.filter((it, i) => !S[i].noLegend);
  const legW = hasLeg ? Math.min(190, legendWidth(legItems)) : 0;
  const x0 = 62, x1 = W - 16 - legW, y1 = o.title ? 32 : 18, y0 = H - 46;
  const xs = [], ys = [];
  S.forEach(s => { xs.push(s.x); ys.push(s.y, s.lo, s.hi); if (s.band) { xs.push(s.band.x); ys.push(s.band.lo, s.band.hi); } });
  (o.hlines || []).forEach(h => ys.push([h.y]));
  (o.vlines || []).forEach(v => xs.push([v.x]));
  const ex = o.xr || Plot.extent(xs, 0.04), ey = o.yr || Plot.extent(ys, 0.08, o.yZero);
  if (o.xMin != null) ex[0] = o.xMin;
  const sx = Plot.scale(ex[0], ex[1], x0, x1), sy = Plot.scale(ey[0], ey[1], y0, y1);
  const xt = Plot.ticks(ex[0], ex[1], 6), yt = Plot.ticks(ey[0], ey[1], 6);
  let s = Plot.open(W, H, o, { x0, x1, y0, y1, ex, ey }, o.label);
  (o.zones || []).forEach(z => { const a = sy(Math.min(ey[1], Math.max(ey[0], z.y1))), b = sy(Math.max(ey[0], Math.min(ey[1], z.y0))); s += `<rect class="${z.cls || 'pl-zone-ok'}" x="${f(x0)}" y="${f(a)}" width="${f(x1 - x0)}" height="${f(Math.max(0, b - a))}"/>`; });
  s += Plot.frame({ x0, x1, y0, y1, sx, sy, xt, yt, xlab: o.xlab, ylab: o.ylab, title: o.title });
  s += `<defs><clipPath id="${esc(o.name || 'pl')}-clip"><rect x="${f(x0)}" y="${f(y1)}" width="${f(x1 - x0)}" height="${f(y0 - y1)}"/></clipPath></defs><g clip-path="url(#${esc(o.name || 'pl')}-clip)">`;
  S.forEach((ser, i) => {
    const c = items[i].color;
    if (ser.band) {
      let d = '';
      ser.band.x.forEach((x, k) => { d += (k ? 'L' : 'M') + f(sx(x)) + ' ' + f(sy(ser.band.hi[k])); });
      for (let k = ser.band.x.length - 1; k >= 0; k--) d += 'L' + f(sx(ser.band.x[k])) + ' ' + f(sy(ser.band.lo[k]));
      s += `<path d="${d}Z" fill="${c}" fill-opacity="0.13" stroke="none"/>`;
    }
  });
  (o.hlines || []).forEach(h => { const Y = sy(h.y); s += `<line class="pl-ref" x1="${f(x0)}" y1="${f(Y)}" x2="${f(x1)}" y2="${f(Y)}"/>${h.label ? `<text class="pl-note" x="${f(h.at === 'start' ? x0 + 4 : x1 - 4)}" y="${f(Y - 4)}" text-anchor="${h.at === 'start' ? 'start' : 'end'}">${esc(h.label)}</text>` : ''}`; });
  (o.vlines || []).forEach(v => { const X = sx(v.x); s += `<line class="pl-ref" x1="${f(X)}" y1="${f(y0)}" x2="${f(X)}" y2="${f(y1)}"/>${v.label ? `<text class="pl-note" x="${f(X + 4)}" y="${f(y1 + 12)}">${esc(v.label)}</text>` : ''}`; });
  S.forEach((ser, i) => {
    const c = items[i].color;
    if (ser.lo && ser.hi) ser.x.forEach((x, k) => { if (isFinite(ser.lo[k]) && isFinite(ser.hi[k])) { const X = sx(x); s += `<path class="pl-err" stroke="${c}" d="M${f(X)} ${f(sy(ser.lo[k]))}V${f(sy(ser.hi[k]))}M${f(X - 3.5)} ${f(sy(ser.lo[k]))}H${f(X + 3.5)}M${f(X - 3.5)} ${f(sy(ser.hi[k]))}H${f(X + 3.5)}"/>`; } });
    if (ser.line !== false) {
      let d = '';
      ser.x.forEach((x, k) => { if (isFinite(x) && isFinite(ser.y[k])) d += (d ? 'L' : 'M') + f(sx(x)) + ' ' + f(sy(ser.y[k])); });
      s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="${ser.width || 2}" stroke-linejoin="round"${items[i].dash ? ` stroke-dasharray="${items[i].dash}"` : ''}/>`;
    }
    if (ser.points !== false) ser.x.forEach((x, k) => { if (isFinite(x) && isFinite(ser.y[k])) s += Plot.marker(items[i].shape, sx(x), sy(ser.y[k]), ser.r || 3.6, c, ser.alpha ? ` fill-opacity="${ser.alpha}"` : ''); });
  });
  s += `</g>`;
  if (hasLeg) s += Plot.legend(legItems, x1 + 14, y1 + 10, { title: o.legendTitle });
  return s + `</svg>`;
};

/* ---------------- bars ----------------
   o: { cats[], groups?[] (names of the series), values: [[...per cat] per group] or [...] ,
        err?: same shape (half-width), letters?: same shape (strings), xlab, ylab, w, h, horizontal?,
        stacked?, colors?, valueLabels?, yr? } */
Plot.bars = function (o) {
  const W = o.w || 620, H = o.h || 340;
  const V = Array.isArray(o.values[0]) ? o.values : [o.values];
  const E = o.err ? (Array.isArray(o.err[0]) ? o.err : [o.err]) : null;
  const Lt = o.letters ? (Array.isArray(o.letters[0]) ? o.letters : [o.letters]) : null;
  const G = V.length, C = o.cats.length;
  const names = o.groups || (G > 1 ? V.map((_, i) => 'S' + (i + 1)) : null);
  const items = names ? names.map((n, i) => ({ name: n, color: (o.colors && o.colors[i]) || Plot.color(i), kind: 'box' })) : [];
  const legW = items.length > 1 ? Math.min(180, legendWidth(items)) : 0;
  const labW = o.horizontal ? Math.min(170, 14 + Math.max(...o.cats.map(c => String(c).length)) * 6.4) : 0;
  const x0 = o.horizontal ? labW + 10 : 62, x1 = W - 16 - legW, y1 = o.title ? 32 : 18, y0 = H - (o.horizontal ? 40 : 52);
  let lo = 0, hi = 0;
  if (o.stacked) for (let c = 0; c < C; c++) { let p = 0, n = 0; V.forEach(r => { const v = +r[c] || 0; if (v >= 0) p += v; else n += v; }); hi = Math.max(hi, p); lo = Math.min(lo, n); }
  else V.forEach((r, gi) => r.forEach((v, c) => { const e = E ? +E[gi][c] || 0 : 0; hi = Math.max(hi, v + e); lo = Math.min(lo, v - e); }));
  const ey = o.yr || [lo, hi + (hi - lo) * (Lt || o.valueLabels ? 0.14 : 0.06)];
  const band = ((o.horizontal ? y0 - y1 : x1 - x0)) / C, inner = band * 0.78, bw = o.stacked ? inner : inner / G;
  const vs = o.horizontal ? Plot.scale(ey[0], ey[1], x0, x1) : Plot.scale(ey[0], ey[1], y0, y1);
  const vt = Plot.ticks(ey[0], ey[1], 6);
  let s = Plot.open(W, H, o, { x0, x1, y0, y1, ex: o.horizontal ? ey : [0, C], ey: o.horizontal ? [0, C] : ey }, o.label);
  if (o.horizontal) {
    s += `<g data-role="grid" class="pl-grid">` + vt.ticks.map(v => `<line x1="${f(vs(v))}" y1="${f(y1)}" x2="${f(vs(v))}" y2="${f(y0)}"/>`).join('') + `</g>`;
    s += `<g data-role="axis" class="pl-axis"><line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y0)}"/><line x1="${f(vs(0))}" y1="${f(y1)}" x2="${f(vs(0))}" y2="${f(y0)}"/></g>`;
    s += `<g class="pl-tick" data-role="xtick">` + vt.ticks.map(v => `<line x1="${f(vs(v))}" y1="${f(y0)}" x2="${f(vs(v))}" y2="${f(y0 + 4)}"/><text x="${f(vs(v))}" y="${f(y0 + 15)}" text-anchor="middle">${Plot.tickLabel(v, vt.step)}</text>`).join('') + `</g>`;
    s += `<g class="pl-tick" data-role="ytick">` + o.cats.map((c, i) => `<text x="${f(x0 - 6)}" y="${f(y1 + band * (i + 0.5) + 4)}" text-anchor="end">${esc(c)}</text>`).join('') + `</g>`;
    if (o.ylab) s += `<text class="pl-lab" data-role="xlab" x="${f((x0 + x1) / 2)}" y="${f(y0 + 32)}" text-anchor="middle">${esc(o.ylab)}</text>`;
  } else {
    s += Plot.frame({ x0, x1, y0, y1, sx: null, sy: vs, xt: null, yt: vt, ylab: o.ylab, title: o.title });
    s += `<g class="pl-tick" data-role="xtick">` + o.cats.map((c, i) => { const X = x0 + band * (i + 0.5); return `<text x="${f(X)}" y="${f(y0 + 15)}" text-anchor="middle">${esc(c)}</text>`; }).join('') + `</g>`;
    if (o.xlab) s += `<text class="pl-lab" data-role="xlab" x="${f((x0 + x1) / 2)}" y="${f(y0 + 36)}" text-anchor="middle">${esc(o.xlab)}</text>`;
  }
  for (let c = 0; c < C; c++) {
    let accP = 0, accN = 0;
    V.forEach((row, gi) => {
      const v = +row[c];
      if (!isFinite(v)) return;
      const col = names ? items[gi].color : (o.colors && o.colors[c]) || Plot.color(0);
      let a, b, pos;
      if (o.stacked) { if (v >= 0) { a = accP; b = accP + v; accP = b; } else { a = accN + v; b = accN; accN = a; } pos = band * c + (band - inner) / 2; }
      else { a = Math.min(0, v); b = Math.max(0, v); pos = band * c + (band - inner) / 2 + gi * bw; }
      if (o.horizontal) {
        const Y = y1 + pos;
        s += `<rect x="${f(vs(a))}" y="${f(Y)}" width="${f(Math.max(0.5, vs(b) - vs(a)))}" height="${f(bw - 1)}" rx="2" fill="${col}"><title>${esc(o.cats[c] + (names ? ' · ' + names[gi] : '') + ': ' + v)}</title></rect>`;
        if (E && isFinite(E[gi][c]) && !o.stacked) { const e = +E[gi][c], cy = Y + bw / 2; s += `<path class="pl-err" stroke="var(--fig-ink)" d="M${f(vs(v - e))} ${f(cy)}H${f(vs(v + e))}M${f(vs(v - e))} ${f(cy - 3)}V${f(cy + 3)}M${f(vs(v + e))} ${f(cy - 3)}V${f(cy + 3)}"/>`; }
        if (o.valueLabels) s += `<text class="pl-txt" x="${f(vs(b) + 4)}" y="${f(Y + bw / 2 + 4)}">${esc(o.valueLabels(v, c, gi))}</text>`;
      } else {
        const X = x0 + pos;
        s += `<rect x="${f(X)}" y="${f(vs(b))}" width="${f(bw - 1)}" height="${f(Math.max(0.5, vs(a) - vs(b)))}" rx="2" fill="${col}"><title>${esc(o.cats[c] + (names ? ' · ' + names[gi] : '') + ': ' + v)}</title></rect>`;
        let top = vs(b);
        if (E && isFinite(E[gi][c]) && !o.stacked) { const e = +E[gi][c], cx = X + (bw - 1) / 2; top = vs(v + e); s += `<path class="pl-err" stroke="var(--fig-ink)" d="M${f(cx)} ${f(vs(v - e))}V${f(vs(v + e))}M${f(cx - 3)} ${f(vs(v + e))}H${f(cx + 3)}M${f(cx - 3)} ${f(vs(v - e))}H${f(cx + 3)}"/>`; }
        if (Lt && Lt[gi] && Lt[gi][c]) s += `<text class="pl-txt-b" x="${f(X + (bw - 1) / 2)}" y="${f(top - 5)}" text-anchor="middle">${esc(Lt[gi][c])}</text>`;
        else if (o.valueLabels) s += `<text class="pl-txt" x="${f(X + (bw - 1) / 2)}" y="${f(top - 5)}" text-anchor="middle">${esc(o.valueLabels(v, c, gi))}</text>`;
      }
    });
  }
  if (items.length > 1) s += Plot.legend(items, x1 + 14, y1 + 10, { title: o.legendTitle });
  return s + `</svg>`;
};

/* ---------------- survival steps (Kaplan–Meier) ----------------
   curves: [{name, time[], surv[], lower?[], upper?[], censor?[] (times)}] */
Plot.km = function (o) {
  const W = o.w || 620, H = o.h || 360;
  const items = o.curves.map((c, i) => ({ name: c.name, color: Plot.color(i), dash: DASH[i % 6], kind: 'line' }));
  const legW = Math.min(190, legendWidth(items));
  const x0 = 62, x1 = W - 16 - legW, y1 = o.title ? 32 : 18, y0 = H - 46;
  const tMax = o.tMax || Math.max(...o.curves.map(c => Math.max(...c.time, ...(c.censor || [0])))) * 1.04;
  const ex = [0, tMax], ey = [0, 1.02];
  const sx = Plot.scale(0, tMax, x0, x1), sy = Plot.scale(0, 1.02, y0, y1);
  const xt = Plot.ticks(0, tMax, 7), yt = { ticks: [0, 0.2, 0.4, 0.6, 0.8, 1], step: 0.2 };
  let s = Plot.open(W, H, o, { x0, x1, y0, y1, ex, ey }, o.label);
  s += Plot.frame({ x0, x1, y0, y1, sx, sy, xt, yt, xlab: o.xlab, ylab: o.ylab, title: o.title });
  if (o.hline != null) { const Y = sy(o.hline); s += `<line class="pl-ref" x1="${f(x0)}" y1="${f(Y)}" x2="${f(x1)}" y2="${f(Y)}"/>`; }
  const step = (t, v) => { let d = 'M' + f(sx(0)) + ' ' + f(sy(1)); let prev = 1; t.forEach((ti, k) => { d += 'H' + f(sx(ti)) + 'V' + f(sy(v[k])); prev = v[k]; }); void prev; return d; };
  o.curves.forEach((c, i) => {
    const col = items[i].color;
    if (o.ci !== false && c.lower && c.upper) {
      let d = 'M' + f(sx(0)) + ' ' + f(sy(1)), lo = 'M' + f(sx(0)) + ' ' + f(sy(1));
      c.time.forEach((t, k) => { if (isFinite(c.upper[k])) d += 'H' + f(sx(t)) + 'V' + f(sy(c.upper[k])); if (isFinite(c.lower[k])) lo += 'H' + f(sx(t)) + 'V' + f(sy(c.lower[k])); });
      s += `<path d="${d}H${f(sx(tMax))}" fill="none" stroke="${col}" stroke-opacity=".45" stroke-width="1" stroke-dasharray="2 2"/><path d="${lo}H${f(sx(tMax))}" fill="none" stroke="${col}" stroke-opacity=".45" stroke-width="1" stroke-dasharray="2 2"/>`;
    }
    const last = c.surv.length ? c.surv[c.surv.length - 1] : 1;
    s += `<path d="${step(c.time, c.surv)}H${f(sx(Math.max(...c.time, ...(c.censor || [0]))))}" fill="none" stroke="${col}" stroke-width="2.2"${items[i].dash ? ` stroke-dasharray="${items[i].dash}"` : ''}/>`;
    (c.censor || []).forEach(t => {
      let v = 1;
      c.time.forEach((ti, k) => { if (ti <= t) v = c.surv[k]; });
      s += `<line x1="${f(sx(t))}" y1="${f(sy(v) - 4)}" x2="${f(sx(t))}" y2="${f(sy(v) + 4)}" stroke="${col}" stroke-width="1.6"/>`;
    });
    void last;
  });
  s += Plot.legend(items, x1 + 14, y1 + 10, { title: o.legendTitle });
  return s + `</svg>`;
};

/* ---------------- spider (radar) ----------------
   axes[], series [{name, values[]}], min, max */
Plot.radar = function (o) {
  const W = o.w || 560, H = o.h || 420;
  const items = o.series.map((sr, i) => ({ name: sr.name, color: Plot.color(i), shape: SHAPES[i % 6], kind: 'line' }));
  const legW = Math.min(180, legendWidth(items));
  const cx = (W - legW) / 2, cy = H / 2 + 6, R = Math.min(cx - 70, H / 2 - 44);
  const n = o.axes.length, lo = o.min == null ? 0 : o.min, hi = o.max == null ? Math.max(...o.series.flatMap(s => s.values)) : o.max;
  const ang = k => -Math.PI / 2 + 2 * Math.PI * k / n, rad = v => R * (v - lo) / ((hi - lo) || 1);
  let s = Plot.open(W, H, o, null, o.label);
  if (o.title) s += `<text class="pl-title" x="12" y="18">${esc(o.title)}</text>`;
  const ticks = Plot.ticks(lo, hi, 5).ticks.filter(v => v > lo && v <= hi);
  s += `<g data-role="grid" class="pl-grid">`;
  ticks.forEach(v => { s += `<polygon points="${o.axes.map((_, k) => f(cx + rad(v) * Math.cos(ang(k))) + ',' + f(cy + rad(v) * Math.sin(ang(k)))).join(' ')}" fill="none" stroke="var(--fig-grid)"/>`; });
  o.axes.forEach((_, k) => { s += `<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(cx + R * Math.cos(ang(k)))}" y2="${f(cy + R * Math.sin(ang(k)))}"/>`; });
  s += `</g><g class="pl-tick" data-role="ytick">` + ticks.map(v => `<text x="${f(cx + 3)}" y="${f(cy - rad(v) - 2)}">${Plot.tickLabel(v, 1)}</text>`).join('') + `</g>`;
  s += `<g class="pl-lab-ax">` + o.axes.map((a, k) => { const X = cx + (R + 14) * Math.cos(ang(k)), Y = cy + (R + 14) * Math.sin(ang(k)); const anc = Math.abs(Math.cos(ang(k))) < 0.2 ? 'middle' : Math.cos(ang(k)) > 0 ? 'start' : 'end'; return `<text class="pl-lab" x="${f(X)}" y="${f(Y + 4)}" text-anchor="${anc}">${esc(a)}</text>`; }).join('') + `</g>`;
  o.series.forEach((sr, i) => {
    const c = items[i].color, pts = sr.values.map((v, k) => [cx + rad(v) * Math.cos(ang(k)), cy + rad(v) * Math.sin(ang(k))]);
    s += `<polygon points="${pts.map(p => f(p[0]) + ',' + f(p[1])).join(' ')}" fill="${c}" fill-opacity="0.08" stroke="${c}" stroke-width="2"/>`;
    pts.forEach(p => { s += Plot.marker(items[i].shape, p[0], p[1], 3.2, c); });
  });
  s += Plot.legend(items, W - legW + 4, 30, { title: o.legendTitle });
  return s + `</svg>`;
};

/* ---------------- a map of two sets of points (PCA, correspondence analysis) ----------------
   rows: {names[], x[], y[]}, cols?: {names[], x[], y[]} (drawn as arrows when arrows:true) */
Plot.biplot = function (o) {
  const W = o.w || 620, H = o.h || 460;
  const x0 = 54, x1 = W - 20, y1 = o.title ? 32 : 18, y0 = H - 46;
  const allX = [o.rows.x, o.cols ? o.cols.x : [], [0]], allY = [o.rows.y, o.cols ? o.cols.y : [], [0]];
  let ex = Plot.extent(allX, 0.18), ey = Plot.extent(allY, 0.14);
  /* the same scale on both axes: distances must read the same in every direction */
  const kx = (x1 - x0) / (ex[1] - ex[0]), ky = (y0 - y1) / (ey[1] - ey[0]), k = Math.min(kx, ky);
  const cxm = (ex[0] + ex[1]) / 2, cym = (ey[0] + ey[1]) / 2;
  ex = [cxm - (x1 - x0) / (2 * k), cxm + (x1 - x0) / (2 * k)]; ey = [cym - (y0 - y1) / (2 * k), cym + (y0 - y1) / (2 * k)];
  const sx = Plot.scale(ex[0], ex[1], x0, x1), sy = Plot.scale(ey[0], ey[1], y0, y1);
  let s = Plot.open(W, H, o, { x0, x1, y0, y1, ex, ey }, o.label);
  s += Plot.frame({ x0, x1, y0, y1, sx, sy, xt: Plot.ticks(ex[0], ex[1], 6), yt: Plot.ticks(ey[0], ey[1], 6), xlab: o.xlab, ylab: o.ylab, title: o.title });
  s += `<line class="pl-ref" x1="${f(sx(0))}" y1="${f(y0)}" x2="${f(sx(0))}" y2="${f(y1)}"/><line class="pl-ref" x1="${f(x0)}" y1="${f(sy(0))}" x2="${f(x1)}" y2="${f(sy(0))}"/>`;
  if (o.cols) o.cols.names.forEach((nm, i) => {
    const X = sx(o.cols.x[i]), Y = sy(o.cols.y[i]);
    if (o.arrows) s += `<line x1="${f(sx(0))}" y1="${f(sy(0))}" x2="${f(X)}" y2="${f(Y)}" stroke="var(--s2)" stroke-width="1.4"/>`;
    else s += Plot.marker('triangle', X, Y, 3.6, 'var(--s2)');
    s += `<text class="pl-note" x="${f(X + 5)}" y="${f(Y - 4)}" fill="var(--s2)" style="fill:var(--s2)">${esc(nm)}</text>`;
  });
  o.rows.names.forEach((nm, i) => {
    const X = sx(o.rows.x[i]), Y = sy(o.rows.y[i]);
    s += Plot.marker('circle', X, Y, 5, 'var(--s1)');
    s += `<text class="pl-txt-b" x="${f(X + 7)}" y="${f(Y + 4)}">${esc(nm)}</text>`;
  });
  const items = [{ name: o.rowsName || 'rows', color: 'var(--s1)', shape: 'circle', kind: 'pt' }].concat(o.cols ? [{ name: o.colsName || 'cols', color: 'var(--s2)', shape: o.arrows ? null : 'triangle', kind: o.arrows ? 'line' : 'pt' }] : []);
  s += Plot.legend(items, x0 + 8, y1 + 12, {});
  return s + `</svg>`;
};

/* ---------------- labelled scatter (penalty analysis) ----------------
   pts [{x, y, label, color?}], xline, yline */
Plot.labelled = function (o) {
  const W = o.w || 620, H = o.h || 380;
  const x0 = 58, x1 = W - 20, y1 = o.title ? 32 : 18, y0 = H - 46;
  const ex = o.xr || Plot.extent([o.pts.map(p => p.x), o.xline != null ? [o.xline] : []], 0.1, true);
  const ey = o.yr || Plot.extent([o.pts.map(p => p.y), o.yline != null ? [o.yline] : []], 0.12, true);
  const sx = Plot.scale(ex[0], ex[1], x0, x1), sy = Plot.scale(ey[0], ey[1], y0, y1);
  let s = Plot.open(W, H, o, { x0, x1, y0, y1, ex, ey }, o.label);
  if (o.xline != null && o.yline != null) s += `<rect class="pl-zone-bad" x="${f(sx(o.xline))}" y="${f(y1)}" width="${f(x1 - sx(o.xline))}" height="${f(sy(o.yline) - y1)}"/>`;
  s += Plot.frame({ x0, x1, y0, y1, sx, sy, xt: Plot.ticks(ex[0], ex[1], 6), yt: Plot.ticks(ey[0], ey[1], 6), xlab: o.xlab, ylab: o.ylab, title: o.title });
  if (o.xline != null) s += `<line class="pl-ref" x1="${f(sx(o.xline))}" y1="${f(y0)}" x2="${f(sx(o.xline))}" y2="${f(y1)}"/>`;
  if (o.yline != null) s += `<line class="pl-ref" x1="${f(x0)}" y1="${f(sy(o.yline))}" x2="${f(x1)}" y2="${f(sy(o.yline))}"/>`;
  o.pts.forEach((p, i) => {
    const X = sx(p.x), Y = sy(p.y);
    s += Plot.marker(p.shape || 'circle', X, Y, 4.5, p.color || Plot.color(i));
    s += `<text class="pl-note" x="${f(X + 6)}" y="${f(Y - 5)}">${esc(p.label)}</text>`;
  });
  if (o.items) s += Plot.legend(o.items, x0 + 8, y1 + 12, {});
  return s + `</svg>`;
};

/* ---------------- Sankey of a value chain (layout from Loss.sankey) ---------------- */
Plot.sankey = function (o) {
  const W = o.w || 760, H = o.h || 380, L = o.layout;
  let s = Plot.open(W, H, o, null, o.label);
  if (o.title) s += `<text class="pl-title" x="12" y="18">${esc(o.title)}</text>`;
  const ribbon = (xa, ya, xb, yb, h) => { const m = (xa + xb) / 2; return `M${f(xa)} ${f(ya)}C${f(m)} ${f(ya)} ${f(m)} ${f(yb)} ${f(xb)} ${f(yb)}V${f(yb + h)}C${f(m)} ${f(yb + h)} ${f(m)} ${f(ya + h)} ${f(xa)} ${f(ya + h)}Z`; };
  L.links.forEach(l => { s += `<path d="${ribbon(l.x0, l.y0, l.x1, l.y1, l.h)}" fill="var(--s3)" fill-opacity=".38"/>`; });
  L.losses.forEach((l, i) => {
    if (l.h < 0.3) return;
    const xb = l.x1 - l.h / 2, yb = l.y1;
    const m = (l.y0 + yb) / 2;
    const d = `M${f(l.x0)} ${f(l.y0)}C${f(xb)} ${f(l.y0)} ${f(xb)} ${f(l.y0)} ${f(xb)} ${f(m)}V${f(yb)}H${f(xb + l.h)}V${f(m)}C${f(xb + l.h)} ${f(l.y0 + l.h)} ${f(xb + l.h)} ${f(l.y0 + l.h)} ${f(l.x0)} ${f(l.y0 + l.h)}Z`;
    s += `<path d="${d}" fill="var(--s7)" fill-opacity="${o.critical && o.critical.includes(i) ? 0.75 : 0.42}"><title>${esc(l.name + ': ' + (o.fmtKg ? o.fmtKg(l.v) : l.v))}</title></path>`;
    s += `<text class="pl-note" x="${f(xb + l.h / 2)}" y="${f(yb + 14)}" text-anchor="middle">${esc(o.fmtKg ? o.fmtKg(l.v) : Math.round(l.v))}</text>`;
    s += `<text class="pl-note" x="${f(xb + l.h / 2)}" y="${f(yb + 26)}" text-anchor="middle">${esc(o.fmtPct ? o.fmtPct(l.pct) : l.pct.toFixed(1) + ' %')}</text>`;
  });
  L.nodes.forEach((n, i) => {
    s += `<rect x="${f(n.x)}" y="${f(n.y)}" width="${f(n.w)}" height="${f(Math.max(1, n.h))}" rx="2" fill="var(--s1)"/>`;
    const lab = i === 0 ? (o.startName || '') : n.name;
    s += `<text class="pl-txt-b" x="${f(n.x + n.w / 2)}" y="${f(n.y - 14)}" text-anchor="middle">${esc(lab)}</text>`;
    s += `<text class="pl-note" x="${f(n.x + n.w / 2)}" y="${f(n.y - 3)}" text-anchor="middle">${esc(o.fmtKg ? o.fmtKg(n.v) : Math.round(n.v))}</text>`;
  });
  return s + `</svg>`;
};

/* ---------------- psychrometric chart ----------------
   pws(t) in Pa (from Logi), p in Pa, tRange, points [{t, W (kg/kg), label}] */
Plot.psychro = function (o) {
  const W = o.w || 640, H = o.h || 420;
  const x0 = 54, x1 = W - 74, y1 = o.title ? 32 : 18, y0 = H - 46;
  const t0 = o.tRange[0], t1 = o.tRange[1], p = o.p || 101325;
  const Wof = (t, rh) => { const pw = rh / 100 * o.pws(t); return 0.621945 * pw / (p - pw) * 1000; };
  const wMax = Math.max(Wof(t1, 100) * 1.05, ...(o.points || []).map(q => q.W * 1000 * 1.1));
  const ex = [t0, t1], ey = [0, wMax];
  const sx = Plot.scale(t0, t1, x0, x1), sy = Plot.scale(0, wMax, y0, y1);
  let s = Plot.open(W, H, o, { x0, x1, y0, y1, ex, ey }, o.label);
  s += Plot.frame({ x0, x1, y0, y1, sx, sy, xt: Plot.ticks(t0, t1, 8), yt: Plot.ticks(0, wMax, 6), xlab: o.xlab, ylab: o.ylab, title: o.title });
  [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(rh => {
    let d = '';
    for (let k = 0; k <= 60; k++) { const t = t0 + (t1 - t0) * k / 60, w = Wof(t, rh); if (w <= wMax) d += (d ? 'L' : 'M') + f(sx(t)) + ' ' + f(sy(w)); }
    s += `<path d="${d}" fill="none" stroke="${rh === 100 ? 'var(--s2)' : 'var(--fig-muted)'}" stroke-width="${rh === 100 ? 2 : 0.8}" stroke-opacity="${rh === 100 ? 1 : 0.55}"/>`;
    /* the label at the end of its curve: in the right margin when the curve reaches the last temperature,
       else just under the top where the curve leaves the chart (beside a curve, the steep upper ones
       would put it next to the curve below) */
    const wl = Wof(t1, rh);
    if (wl <= wMax) s += `<text class="pl-note" x="${f(x1 + 4)}" y="${f(sy(wl) + 3)}">${rh} %</text>`;
    else {
      let a = t0, b = t1;
      for (let k = 0; k < 40; k++) { const mid = (a + b) / 2; if (Wof(mid, rh) > wMax) b = mid; else a = mid; }
      s += `<text class="pl-note" x="${f(sx(a))}" y="${f(y1 - 3)}" text-anchor="middle">${rh} %</text>`;
    }
  });
  (o.points || []).forEach((q, i) => {
    const X = sx(q.t), Y = sy(q.W * 1000);
    s += Plot.marker(SHAPES[i % 6], X, Y, 5, Plot.color(i)) + `<text class="pl-txt-b" x="${f(X + 8)}" y="${f(Y - 6)}">${esc(q.label || '')}</text>`;
    if (q.dew != null) s += `<path class="pl-ref" d="M${f(X)} ${f(Y)}H${f(sx(q.dew))}"/>`;
  });
  return s + `</svg>`;
};

/* ---------------- the O₂–CO₂ plane of a package ----------------
   lines: [{name, beta, rq}], window: {o2:[lo,hi], co2:[lo,hi]}, point: {o2, co2, label} */
Plot.mapPlane = function (o) {
  /* the legend of the films goes in its own column at the right, outside the plane, so neither is cut nor covered */
  const legW = (o.lines || []).length ? Math.ceil(legendWidth(o.lines)) + 10 : 0;
  const W = (o.w || 560) + legW, H = o.h || 400;
  const x0 = 56, x1 = W - 18 - legW, y1 = o.title ? 32 : 18, y0 = H - 46;
  const ex = [0, 21], ey = [0, o.co2Max || 20];
  const sx = Plot.scale(0, 21, x0, x1), sy = Plot.scale(0, ey[1], y0, y1);
  let s = Plot.open(W, H, o, { x0, x1, y0, y1, ex, ey }, o.label);
  if (o.window) s += `<rect class="pl-zone-ok" x="${f(sx(o.window.o2[0]))}" y="${f(sy(o.window.co2[1]))}" width="${f(sx(o.window.o2[1]) - sx(o.window.o2[0]))}" height="${f(sy(o.window.co2[0]) - sy(o.window.co2[1]))}" stroke="var(--accent)" stroke-width="1.2"/>`;
  s += Plot.frame({ x0, x1, y0, y1, sx, sy, xt: Plot.ticks(0, 21, 8), yt: Plot.ticks(0, ey[1], 6), xlab: o.xlab, ylab: o.ylab, title: o.title });
  /* below about 1 % O₂ respiration turns anaerobic */
  s += `<rect class="pl-zone-bad" x="${f(sx(0))}" y="${f(y1)}" width="${f(sx(o.o2Min == null ? 1 : o.o2Min) - sx(0))}" height="${f(y0 - y1)}"/>`;
  const items = [];
  (o.lines || []).forEach((l, i) => {
    const c = Plot.color(i + 1);
    const yA = 0.04 + l.rq / l.beta * (20.95 - 0);
    const xEnd = yA > ey[1] ? 20.95 - (ey[1] - 0.04) * l.beta / l.rq : 0;
    s += `<line x1="${f(sx(20.95))}" y1="${f(sy(0.04))}" x2="${f(sx(xEnd))}" y2="${f(sy(Math.min(yA, ey[1])))}" stroke="${c}" stroke-width="1.8"${DASH[i % 6] ? ` stroke-dasharray="${DASH[i % 6]}"` : ''}/>`;
    items.push({ name: l.name, color: c, dash: DASH[i % 6], kind: 'line' });
  });
  if (o.point && isFinite(o.point.o2) && isFinite(o.point.co2)) {
    /* the label goes on the side away from the film lines (they fan out from air, at the right) and
       with a halo of the background, so the lines and the window frame do not cross it */
    const X = sx(Math.max(0, o.point.o2)), Y = sy(Math.min(ey[1], o.point.co2)), left = o.point.o2 > 6;
    s += Plot.marker('diamond', X, Y, 6, 'var(--s1)') + `<text class="pl-txt-b" x="${f(X + (left ? -10 : 10))}" y="${f(Y < y1 + 16 ? Y + 16 : Y - 9)}" text-anchor="${left ? 'end' : 'start'}" style="paint-order:stroke;stroke:var(--fig-bg);stroke-width:4px;stroke-linejoin:round">${esc(o.point.label || '')}</text>`;
  }
  if (items.length) s += Plot.legend(items, x1 + 14, y1 + 10, {});
  return s + `</svg>`;
};

/* ---------------- top view of a pallet or a container ----------------
   L, W (outer), blocks [{x, y, L, W, a, b}] (as Logi.layer gives them) */
Plot.layout = function (o) {
  const Wd = o.w || 420, Hd = o.h || 340;
  const pad = 24, k = Math.min((Wd - 2 * pad) / o.L, (Hd - 2 * pad - 14) / o.W);
  const ox = (Wd - o.L * k) / 2, oy = 16 + (Hd - 16 - o.W * k) / 2;
  let s = Plot.open(Wd, Hd, o, null, o.label);
  if (o.title) s += `<text class="pl-title" x="12" y="16">${esc(o.title)}</text>`;
  s += `<rect x="${f(ox)}" y="${f(oy)}" width="${f(o.L * k)}" height="${f(o.W * k)}" fill="var(--crema-2)" stroke="var(--fig-axis)" stroke-width="1.4"/>`;
  let n = 0;
  (o.blocks || []).forEach((b, bi) => {
    const nx = Math.floor(b.L / b.a), ny = Math.floor(b.W / b.b);
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      n++;
      s += `<rect x="${f(ox + (b.x + i * b.a) * k + 1)}" y="${f(oy + (b.y + j * b.b) * k + 1)}" width="${f(b.a * k - 2)}" height="${f(b.b * k - 2)}" rx="2" fill="${bi ? 'var(--s3)' : 'var(--s1)'}" fill-opacity=".75" stroke="var(--fig-bg)"/>`;
    }
  });
  s += `<text class="pl-note" x="${f(ox + o.L * k / 2)}" y="${f(oy + o.W * k + 14)}" text-anchor="middle">${esc(o.caption || (o.L + ' × ' + o.W + ' · ' + n))}</text>`;
  return s + `</svg>`;
};

g.Plot = Plot;
})(typeof window !== 'undefined' ? window : globalThis);
