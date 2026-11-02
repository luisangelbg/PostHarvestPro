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

/* PostHarvestPro — the drawings of the app, all vector and original.

   · the logo: a fruit whose skin ripens from unripe green to fruit orange,
     with its leaf, crossed by a decay curve (firmness falling with time);
   · the illustration of the home page: the same fruit at five stages and
     the firmness of three lots stored at three temperatures, with the limit
     that ends their shelf life; a marker walks the time axis;
   · the small pictures of the block cards. */
(function (g) {
'use strict';
let uid = 0;
const id = p => p + (++uid);
const f = v => (Math.round(v * 10) / 10).toString();
const Art = {};
const STAGES = ['#5E8F2A', '#8DB33C', '#C4C23A', '#F2A51C', '#EF6C00', '#C8461A'];

/* the shape of the fruit: an asymmetric drupe (a mango in profile), centered on (cx, cy), height h */
function fruitPath(cx, cy, h) {
  const k = h / 100;
  const P = (x, y) => f(cx + x * k) + ' ' + f(cy + y * k);
  return `M${P(-4, -50)}C${P(22, -52)} ${P(42, -30)} ${P(40, 2)}C${P(38, 30)} ${P(18, 50)} ${P(-6, 50)}C${P(-30, 50)} ${P(-42, 30)} ${P(-40, 6)}C${P(-38, -22)} ${P(-30, -48)} ${P(-4, -50)}Z`;
}
function leafPath(cx, cy, h) {
  const k = h / 100;
  const P = (x, y) => f(cx + x * k) + ' ' + f(cy + y * k);
  return `M${P(-4, -50)}C${P(-2, -64)} ${P(14, -76)} ${P(34, -74)}C${P(30, -60)} ${P(14, -50)} ${P(-4, -50)}Z`;
}

/* ---------------- logo ---------------- */
Art.logo = function (size, o) {
  o = o || {};
  const s = size || 64, gr = id('phg'), sh = id('phs');
  return `<svg viewBox="0 0 64 64" width="${s}" height="${s}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="PostHarvestPro">` +
    `<defs><linearGradient id="${gr}" x1="0.12" y1="0.08" x2="0.9" y2="0.95"><stop offset="0" stop-color="#7CB342"/><stop offset="0.42" stop-color="#C4C23A"/><stop offset="0.7" stop-color="#F2A51C"/><stop offset="1" stop-color="#EF6C00"/></linearGradient>` +
    `<radialGradient id="${sh}" cx="0.35" cy="0.3" r="0.5"><stop offset="0" stop-color="#FFF3E0" stop-opacity=".7"/><stop offset="1" stop-color="#FFF3E0" stop-opacity="0"/></radialGradient></defs>` +
    (o.bg ? `<rect width="64" height="64" rx="14" fill="${o.bg}"/>` : '') +
    `<path d="${leafPath(32, 38, 47)}" fill="#7CB342"/><path d="M30.5 14.5c1-3 4-5.5 8-6" stroke="#4E7A1E" stroke-width="1.6" fill="none" stroke-linecap="round"/>` +
    `<path d="${fruitPath(32, 38, 47)}" fill="url(#${gr})"/><path d="${fruitPath(32, 38, 47)}" fill="url(#${sh})"/>` +
    /* the decay curve: firmness against time, falling as the skin turns orange */
    `<path d="M14 29C21 30 24 36 29 41C34 46 39 49.5 49 50.5" fill="none" stroke="#FFF3E0" stroke-width="3.2" stroke-linecap="round"/>` +
    `<circle cx="14" cy="29" r="2.6" fill="#FFF3E0"/><circle cx="49" cy="50.5" r="2.6" fill="#D4A848"/>` +
    `</svg>`;
};
/* the browser-tab icon: the logo on the black of the brand */
Art.favicon = function () {
  const svg = Art.logo(32, { bg: '#111111' }).replace(/ role="img" aria-label="PostHarvestPro"/, '');
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
};

/* ---------------- the home illustration ---------------- */
Art.Hero = {
  mount(host) {
    if (!host) return;
    const W = 560, H = 420, T = g.T || ((a) => a);
    const gx0 = 70, gx1 = 530, gy0 = 360, gy1 = 190;
    const days = 21, sx = d => gx0 + (gx1 - gx0) * d / days, F0 = 125, sy = v => gy0 - (gy0 - gy1) * v / 130;
    const Ks = [[0.065, '13 °C', 'var(--s2)'], [0.15, '20 °C', 'var(--s3)'], [0.27, '25 °C', 'var(--s1)']];
    const limit = 25;
    const curve = k => { let d = ''; for (let i = 0; i <= 60; i++) { const t = days * i / 60; d += (i ? 'L' : 'M') + f(sx(t)) + ' ' + f(sy(F0 * Math.exp(-k * t))); } return d; };
    const gid = id('hg');
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" class="pl ph-hero" role="img" aria-hidden="true"><defs>` +
      STAGES.map((c, i) => `<radialGradient id="${gid}${i}" cx="0.34" cy="0.28" r="0.8"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".38"/><stop offset=".32" stop-color="${c}"/><stop offset="1" stop-color="${c}"/></radialGradient>`).join('') +
      `</defs><rect x="0" y="0" width="${W}" height="${H}" rx="22" fill="var(--card-bg)" fill-opacity=".72"/>`;
    /* five fruits at five stages, with their stage name */
    const names = [[T('Verde maduro', 'Mature green'), 0], [T('Rayado', 'Breaker'), 1], [T('Pintón', 'Turning'), 2], [T('Maduro', 'Ripe'), 4], [T('Sobremaduro', 'Overripe'), 5]];
    names.forEach(([nm, st], i) => {
      const cx = 72 + i * 104, cy = 92;
      s += `<g class="ph-fruit" style="--d:${i}">` +
        `<ellipse cx="${cx}" cy="${cy + 46}" rx="30" ry="5" fill="var(--fig-ink)" opacity=".08"/>` +
        `<path d="${leafPath(cx, cy, 78)}" fill="#7CB342"/>` +
        `<path d="${fruitPath(cx, cy, 78)}" fill="url(#${gid}${st})"/>` +
        (st === 5 ? `<circle cx="${cx - 9}" cy="${cy + 8}" r="3.4" fill="#5A2A10" opacity=".55"/><circle cx="${cx + 8}" cy="${cy + 18}" r="2.4" fill="#5A2A10" opacity=".5"/><circle cx="${cx + 12}" cy="${cy - 4}" r="1.8" fill="#5A2A10" opacity=".45"/>` : '') +
        `<text class="art-mut" x="${cx}" y="${cy + 64}" text-anchor="middle" font-size="11">${nm}</text></g>`;
    });
    /* the firmness of three lots */
    s += `<g class="pl-grid">` + [0, 25, 50, 75, 100, 125].map(v => `<line x1="${gx0}" y1="${f(sy(v))}" x2="${gx1}" y2="${f(sy(v))}" stroke="var(--fig-grid)"/>`).join('') + `</g>`;
    s += `<line x1="${gx0}" y1="${gy0}" x2="${gx1}" y2="${gy0}" stroke="var(--fig-axis)"/><line x1="${gx0}" y1="${gy0}" x2="${gx0}" y2="${gy1 - 6}" stroke="var(--fig-axis)"/>`;
    [0, 50, 100].forEach(v => { s += `<text class="art-mut" x="${gx0 - 6}" y="${f(sy(v) + 4)}" text-anchor="end" font-size="10">${v}</text>`; });
    [0, 7, 14, 21].forEach(d => { s += `<text class="art-mut" x="${f(sx(d))}" y="${gy0 + 15}" text-anchor="middle" font-size="10">${d}</text>`; });
    s += `<text class="art-txt" x="${(gx0 + gx1) / 2}" y="${gy0 + 32}" text-anchor="middle" font-size="11.5" font-weight="600">${T('Días de almacenamiento', 'Days in storage')}</text>`;
    s += `<text class="art-txt" transform="translate(${gx0 - 34} ${(gy0 + gy1) / 2}) rotate(-90)" text-anchor="middle" font-size="11.5" font-weight="600">${T('Firmeza (N)', 'Firmness (N)')}</text>`;
    s += `<rect x="${gx0}" y="${f(sy(limit))}" width="${gx1 - gx0}" height="${f(gy0 - sy(limit))}" fill="var(--rojo-fruto)" fill-opacity=".08"/>`;
    s += `<line x1="${gx0}" y1="${f(sy(limit))}" x2="${gx1}" y2="${f(sy(limit))}" stroke="var(--rojo-fruto)" stroke-dasharray="5 3" stroke-width="1.3"/>`;
    /* at the left, inside the shaded band: on the right the 13 °C curve runs over the line */
    s += `<text class="art-mut" x="${gx0 + 6}" y="${f(sy(limit) + 14)}" text-anchor="start" font-size="10">${T('límite comercial', 'market limit')}</text>`;
    Ks.forEach(([k, lab, col], i) => {
      const tl = Math.log(F0 / limit) / k;
      s += `<path class="ph-curve" style="--d:${i}" d="${curve(k)}" fill="none" stroke="${col}" stroke-width="2.6" pathLength="100"/>`;
      if (tl <= days) s += `<g class="ph-tl" style="--d:${i}"><line x1="${f(sx(tl))}" y1="${f(sy(limit))}" x2="${f(sx(tl))}" y2="${gy0}" stroke="${col}" stroke-width="1.2" stroke-dasharray="2 2"/><circle cx="${f(sx(tl))}" cy="${f(sy(limit))}" r="4.2" fill="${col}"/></g>`;
      s += `<g><rect x="${gx1 - 70}" y="${gy1 - 2 + i * 17}" width="12" height="4" rx="2" fill="${col}"/><text class="art-txt" x="${gx1 - 52}" y="${gy1 + 4 + i * 17}" font-size="11">${lab}</text></g>`;
    });
    /* the marker that walks the time axis */
    s += `<g class="ph-walker"><line x1="${gx0}" y1="${gy1 - 8}" x2="${gx0}" y2="${gy0}" stroke="var(--btn-oro-texto)" stroke-width="1.4"/><circle cx="${gx0}" cy="${gy1 - 8}" r="3.5" fill="var(--btn-oro-texto)"/></g>`;
    s += `<style>
      .ph-hero .ph-curve{stroke-dasharray:100;stroke-dashoffset:0}
      .ph-hero .ph-walker{transform:translateX(0)}
      @media (prefers-reduced-motion: no-preference){
        html:not(.lfx-still) .ph-hero .ph-curve{animation:phDraw 2.4s cubic-bezier(.3,.6,.3,1) both;animation-delay:calc(var(--d)*.25s)}
        html:not(.lfx-still) .ph-hero .ph-tl{animation:phIn .5s ease both;animation-delay:calc(2.2s + var(--d)*.25s)}
        html:not(.lfx-still) .ph-hero .ph-fruit{animation:phIn .6s ease both;animation-delay:calc(var(--d)*.12s)}
        html:not(.lfx-still) .ph-hero .ph-walker{animation:phWalk 9s linear 2.6s infinite}
      }
      @keyframes phDraw{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
      @keyframes phIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
      @keyframes phWalk{0%{transform:translateX(0)}90%{transform:translateX(${gx1 - gx0}px)}100%{transform:translateX(${gx1 - gx0}px);opacity:0}}
    </style></svg>`;
    host.innerHTML = s + `<div class="ha-caption">${T('Simulado: la firmeza cae con cinética de primer orden; a más temperatura, la vida de anaquel termina antes.', 'Simulated: firmness falls with first-order kinetics; the warmer the store, the sooner shelf life ends.')}</div>`;
  },
};

/* ---------------- block cards (240 × 112) ---------------- */
const card = inner => `<svg viewBox="0 0 240 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
Art.cards = {
  1: () => card(`<g transform="translate(88 6) scale(1.5)">${Art.logo(64).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`),
  2: () => {
    const gid = id('c2');
    let s = `<defs><radialGradient id="${gid}" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#FFF3E0" stop-opacity=".6"/><stop offset=".5" stop-color="#F2A51C"/></radialGradient></defs>`;
    s += `<path d="${leafPath(58, 60, 70)}" fill="#7CB342"/><path d="${fruitPath(58, 60, 70)}" fill="url(#${gid})"/>`;
    STAGES.forEach((c, i) => { s += `<rect x="${118 + i * 18}" y="20" width="15" height="26" rx="3" fill="${c}"/>`; });
    s += `<text class="art-mut" x="118" y="62" font-size="10">L* a* b* · h° · ΔE</text>`;
    [0.55, 0.8, 0.4].forEach((v, i) => { s += `<rect x="118" y="${70 + i * 12}" width="${f(100 * v)}" height="7" rx="3.5" fill="${['var(--s1)', 'var(--s3)', 'var(--s2)'][i]}"/>`; });
    return card(s);
  },
  3: () => {
    let s = `<line x1="24" y1="96" x2="224" y2="96" stroke="var(--fig-axis)"/><line x1="24" y1="96" x2="24" y2="12" stroke="var(--fig-axis)"/>`;
    s += `<line x1="24" y1="78" x2="224" y2="78" stroke="var(--rojo-fruto)" stroke-dasharray="4 3"/>`;
    [[0.012, 'var(--s2)'], [0.025, 'var(--s3)'], [0.045, 'var(--s1)']].forEach(([k, c]) => { let d = ''; for (let i = 0; i <= 40; i++) { const x = 24 + 200 * i / 40, y = 96 - 80 * Math.exp(-k * 200 * i / 40); d += (i ? 'L' : 'M') + f(x) + ' ' + f(y); } s += `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.4"/>`; });
    return card(s);
  },
  4: () => {
    let s = `<rect x="22" y="30" width="44" height="62" rx="8" fill="none" stroke="var(--fig-axis)" stroke-width="2"/><rect x="28" y="22" width="32" height="10" rx="3" fill="var(--fig-axis)"/>`;
    s += `<path d="${fruitPath(44, 68, 34)}" fill="#3F5E2A"/>`;
    s += `<line x1="84" y1="96" x2="224" y2="96" stroke="var(--fig-axis)"/>`;
    let d = '', e = '';
    for (let i = 0; i <= 40; i++) { const x = 84 + 140 * i / 40, t = i / 40; d += (i ? 'L' : 'M') + f(x) + ' ' + f(86 - 10 * Math.exp(-(((t - 0.1) / 0.1) ** 2)) - 52 * Math.exp(-(((t - 0.55) / 0.13) ** 2))); e += (i ? 'L' : 'M') + f(x) + ' ' + f(92 - 64 * Math.exp(-(((t - 0.6) / 0.11) ** 2))); }
    return card(s + `<path d="${d}" fill="none" stroke="var(--s1)" stroke-width="2.4"/><path d="${e}" fill="none" stroke="var(--s2)" stroke-width="2" stroke-dasharray="5 3"/>`);
  },
  5: () => {
    let s = '', x = 14, h = 60;
    [0.05, 0.08, 0.03, 0.04, 0.06].forEach((p, i) => {
      const lost = h * p * 3, out = h - lost;
      s += `<rect x="${x}" y="22" width="8" height="${f(h)}" rx="2" fill="var(--s1)"/>`;
      s += `<path d="M${x + 8} 22C${x + 26} 22 ${x + 26} 22 ${x + 44} 22V${f(22 + out)}C${x + 26} ${f(22 + out)} ${x + 26} ${f(22 + out)} ${x + 8} ${f(22 + out)}Z" fill="var(--s3)" fill-opacity=".4"/>`;
      s += `<path d="M${x + 8} ${f(22 + out)}C${x + 20} ${f(22 + out)} ${x + 20} ${f(22 + out)} ${x + 20} ${f(22 + out + 12)}V100H${f(x + 20 + lost)}V${f(22 + out + 12)}C${f(x + 20 + lost)} ${f(22 + h)} ${f(x + 20 + lost)} ${f(22 + h)} ${x + 8} ${f(22 + h)}Z" fill="var(--s7)" fill-opacity=".55"/>`;
      x += 44; h = out;
    });
    return card(s + `<rect x="${x}" y="22" width="8" height="${f(h)}" rx="2" fill="var(--s1)"/>`);
  },
  6: () => {
    const cx = 70, cy = 58, R = 40, n = 6, ang = k => -Math.PI / 2 + 2 * Math.PI * k / n;
    let s = `<polygon points="${[0, 1, 2, 3, 4, 5].map(k => f(cx + R * Math.cos(ang(k))) + ',' + f(cy + R * Math.sin(ang(k)))).join(' ')}" fill="none" stroke="var(--fig-grid)" stroke-width="1.5"/>`;
    [[0.9, 0.6, 0.7, 0.4, 0.8, 0.5, 'var(--s1)'], [0.5, 0.8, 0.4, 0.8, 0.5, 0.7, 'var(--s2)']].forEach(v => { s += `<polygon points="${v.slice(0, 6).map((r, k) => f(cx + R * r * Math.cos(ang(k))) + ',' + f(cy + R * r * Math.sin(ang(k)))).join(' ')}" fill="${v[6]}" fill-opacity=".15" stroke="${v[6]}" stroke-width="2"/>`; });
    ['482', '157', '736'].forEach((c, i) => { s += `<rect x="134" y="${18 + i * 28}" width="84" height="22" rx="6" fill="var(--card-bg)" stroke="var(--fig-axis)"/><text class="art-txt" x="176" y="${34 + i * 28}" text-anchor="middle" font-size="14" font-weight="700" font-family="ui-monospace, monospace">${c}</text>`; });
    return card(s);
  },
  7: () => {
    let s = `<line x1="20" y1="96" x2="224" y2="96" stroke="var(--fig-axis)"/>`;
    [[54, 'a'], [38, 'b'], [66, 'a'], [30, 'c']].forEach(([h, l], i) => { const x = 40 + i * 46; s += `<rect x="${x}" y="${96 - h}" width="28" height="${h}" rx="3" fill="${['var(--s1)', 'var(--s3)', 'var(--s2)', 'var(--s4)'][i]}"/><path d="M${x + 14} ${96 - h - 8}V${96 - h + 6}M${x + 10} ${96 - h - 8}H${x + 18}" stroke="var(--fig-ink)" stroke-width="1.4"/><text class="art-txt" x="${x + 14}" y="${96 - h - 12}" text-anchor="middle" font-size="12" font-weight="700">${l}</text>`; });
    return card(s);
  },
  8: () => {
    let s = `<rect x="18" y="16" width="120" height="84" rx="4" fill="var(--crema-2)" stroke="var(--fig-axis)"/>`;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) s += `<rect x="${21 + i * 38}" y="${19 + j * 26}" width="36" height="24" rx="2" fill="var(--s1)" fill-opacity=".75"/>`;
    for (let i = 0; i < 4; i++) s += `<rect x="${21 + i * 29}" y="71" width="27" height="26" rx="2" fill="var(--s3)" fill-opacity=".75"/>`;
    s += `<rect x="172" y="18" width="14" height="66" rx="7" fill="none" stroke="var(--fig-axis)" stroke-width="2"/><circle cx="179" cy="90" r="11" fill="var(--s2)"/><rect x="176" y="44" width="6" height="40" fill="var(--s2)"/>`;
    s += `<text class="art-txt" x="198" y="50" font-size="13" font-weight="700">4 °C</text><text class="art-mut" x="198" y="66" font-size="11">${T('90 %', '90%')}</text>`;
    return card(s);
  },
  9: () => {
    let s = `<rect x="70" y="8" width="100" height="98" rx="6" fill="var(--card-bg)" stroke="var(--fig-axis)"/>`;
    s += `<rect x="80" y="18" width="50" height="6" rx="3" fill="var(--s1)"/>`;
    [30, 38, 46].forEach(y => { s += `<rect x="80" y="${y}" width="80" height="3.5" rx="1.75" fill="var(--fig-grid)"/>`; });
    let d = ''; for (let i = 0; i <= 20; i++) { const x = 82 + 76 * i / 20; d += (i ? 'L' : 'M') + f(x) + ' ' + f(94 - 34 * Math.exp(-3 * i / 20)); }
    s += `<path d="${d}" fill="none" stroke="var(--s3)" stroke-width="2"/><g transform="translate(176 66) scale(.5)">${Art.logo(64).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`;
    return card(s);
  },
};

g.Art = Art;
})(typeof window !== 'undefined' ? window : globalThis);
