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

/* PostHarvestPro — colour science for produce.

   Conversions between sRGB (and its hexadecimal code), CIE XYZ, CIELAB and
   CIELCh(ab), with the D65 illuminant and the 2° observer of the colorimeters
   used on fruit; colour differences ΔE*ab (CIE 1976), ΔE*94 and ΔE00 (CIEDE2000);
   and the colour indices of the postharvest literature.

   Sources: CIE 15:2018 Colorimetry, 4th ed. (Lab, LCh, ΔE76); IEC 61966-2-1
   (1999) for sRGB, with its matrix written to 4 decimals as in the standard;
   CIE 116-1995 (ΔE94); Sharma, Wu and Dalal 2005, Color Res. Appl. 30:21–30
   (ΔE00, with their test data); McGuire 1992, HortScience 27:1254–1255 (chroma
   and hue angle for horticulture); Jiménez-Cuesta, Cuquerella and Martínez-
   Jávega 1981, Proc. Int. Soc. Citriculture 2:750–753 (citrus colour index);
   Palou et al. 1999, J. Food Sci. 64:42–45 (browning index); ASTM E313 (whiteness
   and yellowness indices, written here as formulas). */
function ColorCore(g) {
'use strict';
const { abs, sqrt, pow, atan2, cos, sin, exp, round, PI, min, max } = Math;
const Color = {};

/* reference white D65, 2° observer, Y = 100 */
Color.WHITE = {
  D65: [95.047, 100, 108.883],
  C: [98.074, 100, 118.232],
  D50: [96.422, 100, 82.521],
};
const DEG = 180 / PI;

/* ---------------- sRGB ↔ XYZ ---------------- */
/* sRGB companding (IEC 61966-2-1) */
const lin = c => (c <= 0.04045 ? c / 12.92 : pow((c + 0.055) / 1.055, 2.4));
const gam = c => (c <= 0.0031308 ? 12.92 * c : 1.055 * pow(c, 1 / 2.4) - 0.055);
const M_RGB2XYZ = [[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]];
/* the exact inverse of the 4-decimal matrix, so a round trip returns the same colour */
const M_XYZ2RGB = (function () {
  const m = M_RGB2XYZ;
  const det = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const c = (a, b, d, e) => a * e - b * d;
  return [
    [c(m[1][1], m[1][2], m[2][1], m[2][2]) / det, -c(m[0][1], m[0][2], m[2][1], m[2][2]) / det, c(m[0][1], m[0][2], m[1][1], m[1][2]) / det],
    [-c(m[1][0], m[1][2], m[2][0], m[2][2]) / det, c(m[0][0], m[0][2], m[2][0], m[2][2]) / det, -c(m[0][0], m[0][2], m[1][0], m[1][2]) / det],
    [c(m[1][0], m[1][1], m[2][0], m[2][1]) / det, -c(m[0][0], m[0][1], m[2][0], m[2][1]) / det, c(m[0][0], m[0][1], m[1][0], m[1][1]) / det],
  ];
})();
/* r, g, b in 0–255 → X, Y, Z (Y of white = 100) */
Color.rgbToXyz = function (r, gg, b) {
  const R = lin(r / 255), G = lin(gg / 255), B = lin(b / 255);
  return [100 * (M_RGB2XYZ[0][0] * R + M_RGB2XYZ[0][1] * G + M_RGB2XYZ[0][2] * B),
    100 * (M_RGB2XYZ[1][0] * R + M_RGB2XYZ[1][1] * G + M_RGB2XYZ[1][2] * B),
    100 * (M_RGB2XYZ[2][0] * R + M_RGB2XYZ[2][1] * G + M_RGB2XYZ[2][2] * B)];
};
/* X, Y, Z → r, g, b in 0–255 (not rounded, not clipped) and whether it falls inside the sRGB gamut */
Color.xyzToRgb = function (X, Y, Z) {
  const x = X / 100, y = Y / 100, z = Z / 100;
  const l = [M_XYZ2RGB[0][0] * x + M_XYZ2RGB[0][1] * y + M_XYZ2RGB[0][2] * z,
    M_XYZ2RGB[1][0] * x + M_XYZ2RGB[1][1] * y + M_XYZ2RGB[1][2] * z,
    M_XYZ2RGB[2][0] * x + M_XYZ2RGB[2][1] * y + M_XYZ2RGB[2][2] * z];
  const inGamut = l.every(v => v >= -1e-9 && v <= 1 + 1e-9);
  const rgb = l.map(v => 255 * (v < 0 ? -gam(-v) : gam(v)));
  return { rgb, inGamut };
};

/* ---------------- XYZ ↔ CIELAB ---------------- */
const EPS = 216 / 24389, KAPPA = 24389 / 27;
const fLab = t => (t > EPS ? Math.cbrt(t) : (KAPPA * t + 16) / 116);
const fInv = f => (f * f * f > EPS ? f * f * f : (116 * f - 16) / KAPPA);
Color.xyzToLab = function (X, Y, Z, white) {
  const W = white || Color.WHITE.D65;
  const fx = fLab(X / W[0]), fy = fLab(Y / W[1]), fz = fLab(Z / W[2]);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
};
Color.labToXyz = function (L, a, b, white) {
  const W = white || Color.WHITE.D65;
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const yr = L > KAPPA * EPS ? fy * fy * fy : L / KAPPA;
  return [W[0] * fInv(fx), W[1] * yr, W[2] * fInv(fz)];
};

/* ---------------- CIELAB ↔ LCh ----------------
   Chroma C* = √(a*² + b*²) and hue angle h° = atan2(b*, a*) in 0–360°
   (McGuire 1992: the tangent alone confuses opposite quadrants). */
Color.chroma = (a, b) => sqrt(a * a + b * b);
Color.hue = function (a, b) {
  if (a === 0 && b === 0) return 0;
  let h = atan2(b, a) * DEG;
  if (h < 0) h += 360;
  return h;
};
Color.labToLch = (L, a, b) => [L, Color.chroma(a, b), Color.hue(a, b)];
Color.lchToLab = (L, C, h) => [L, C * cos(h / DEG), C * sin(h / DEG)];

/* ---------------- the whole chain ---------------- */
Color.rgbToLab = (r, gg, b, white) => Color.xyzToLab(...Color.rgbToXyz(r, gg, b), white);
Color.labToRgb = (L, a, b, white) => Color.xyzToRgb(...Color.labToXyz(L, a, b, white));
Color.hexToRgb = function (hex) {
  let h = String(hex || '').trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
Color.rgbToHex = function (r, gg, b) {
  const c = v => max(0, min(255, round(v))).toString(16).padStart(2, '0').toUpperCase();
  return '#' + c(r) + c(gg) + c(b);
};
/* a displayable colour for any L*a*b*: out-of-gamut colours are brought in
   by reducing chroma at constant L* and h° (bisection), which keeps the
   lightness and the hue the eye judges first */
Color.labToHex = function (L, a, b) {
  const first = Color.labToRgb(L, a, b);
  if (first.inGamut) return { hex: Color.rgbToHex(...first.rgb), inGamut: true, rgb: first.rgb.map(v => max(0, min(255, round(v)))) };
  const C = Color.chroma(a, b), h = Color.hue(a, b);
  const Lc = max(0, min(100, L));
  let lo = 0, hi = C;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2, [, aa, bb] = Color.lchToLab(Lc, m, h);
    if (Color.labToRgb(Lc, aa, bb).inGamut) lo = m; else hi = m;
  }
  const [, aa, bb] = Color.lchToLab(Lc, lo, h);
  const rgb = Color.labToRgb(Lc, aa, bb).rgb.map(v => max(0, min(255, round(v))));
  return { hex: Color.rgbToHex(...rgb), inGamut: false, rgb };
};
Color.hexToLab = function (hex) {
  const c = Color.hexToRgb(hex);
  return c ? Color.rgbToLab(...c) : null;
};

/* ---------------- colour differences ---------------- */
Color.dE76 = (L1, a1, b1, L2, a2, b2) => sqrt((L1 - L2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
/* CIE94, graphic-arts weights by default (kL = 1, K1 = 0.045, K2 = 0.015);
   the first colour is the reference */
Color.dE94 = function (L1, a1, b1, L2, a2, b2, o) {
  o = o || {};
  const kL = o.kL || 1, K1 = o.K1 || 0.045, K2 = o.K2 || 0.015;
  const C1 = Color.chroma(a1, b1), C2 = Color.chroma(a2, b2);
  const dL = L1 - L2, dC = C1 - C2;
  const dH2 = max(0, (a1 - a2) ** 2 + (b1 - b2) ** 2 - dC * dC);
  const SL = 1, SC = 1 + K1 * C1, SH = 1 + K2 * C1;
  return sqrt((dL / (kL * SL)) ** 2 + (dC / SC) ** 2 + dH2 / (SH * SH));
};
/* CIEDE2000, following Sharma, Wu and Dalal (2005) line by line */
Color.dE00 = function (L1, a1, b1, L2, a2, b2, o) {
  o = o || {};
  const kL = o.kL || 1, kC = o.kC || 1, kH = o.kH || 1;
  const C1 = Color.chroma(a1, b1), C2 = Color.chroma(a2, b2), Cb = (C1 + C2) / 2;
  const G = 0.5 * (1 - sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = sqrt(a1p * a1p + b1 * b1), C2p = sqrt(a2p * a2p + b2 * b2);
  const hp = (aa, bb) => { if (aa === 0 && bb === 0) return 0; let h = atan2(bb, aa) * DEG; return h < 0 ? h + 360 : h; };
  const h1p = hp(a1p, b1), h2p = hp(a2p, b2);
  const dLp = L2 - L1, dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
  const dHp = 2 * sqrt(C1p * C2p) * sin(dhp / 2 / DEG);
  const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
  let hbp;
  if (C1p * C2p === 0) hbp = h1p + h2p;
  else if (abs(h1p - h2p) <= 180) hbp = (h1p + h2p) / 2;
  else hbp = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
  const T = 1 - 0.17 * cos((hbp - 30) / DEG) + 0.24 * cos(2 * hbp / DEG) + 0.32 * cos((3 * hbp + 6) / DEG) - 0.20 * cos((4 * hbp - 63) / DEG);
  const dTh = 30 * exp(-(((hbp - 275) / 25) ** 2));
  const RC = 2 * sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const SL = 1 + 0.015 * (Lbp - 50) ** 2 / sqrt(20 + (Lbp - 50) ** 2);
  const SC = 1 + 0.045 * Cbp, SH = 1 + 0.015 * Cbp * T;
  const RT = -sin(2 * dTh / DEG) * RC;
  return sqrt((dLp / (kL * SL)) ** 2 + (dCp / (kC * SC)) ** 2 + (dHp / (kH * SH)) ** 2 + RT * (dCp / (kC * SC)) * (dHp / (kH * SH)));
};
/* how the eye reads a ΔE (common rule of thumb in the colour-measurement literature;
   Mokrzycki and Tatol 2011, Mach. Graph. Vis. 20:383–411) */
Color.dEReading = function (dE) {
  if (!(dE >= 0)) return null;
  /* es, en: the reading on its own (a tile); isEs, isEn: what follows «the difference is» in a sentence */
  if (dE < 1) return { k: 'none', es: 'imperceptible', en: 'not perceptible', isEs: 'imperceptible', isEn: 'not perceptible' };
  if (dE < 2) return { k: 'expert', es: 'perceptible sólo para un observador entrenado', en: 'perceptible only to a trained observer', isEs: 'perceptible sólo para un observador entrenado', isEn: 'perceptible only to a trained observer' };
  if (dE < 3.5) return { k: 'unskilled', es: 'perceptible para cualquier observador', en: 'perceptible to any observer', isEs: 'perceptible para cualquier observador', isEn: 'perceptible to any observer' };
  if (dE < 5) return { k: 'clear', es: 'diferencia clara', en: 'clear difference', isEs: 'clara', isEn: 'clear' };
  return { k: 'different', es: 'se perciben como colores distintos', en: 'perceived as different colours', isEs: 'tan grande que se perciben como colores distintos', isEn: 'so large that they are seen as different colors' };
};

/* ---------------- colour indices of the postharvest literature ----------------
   Each takes L*, a*, b* (and, where it needs them, X, Y, Z). */
Color.indices = function (L, a, b) {
  const C = Color.chroma(a, b), h = Color.hue(a, b);
  const [X, Y, Z] = Color.labToXyz(L, a, b);
  const x = (a + 1.75 * L) / (5.645 * L + a - 3.012 * b);
  return {
    C, h,
    /* a* ∕ b*: from green (negative) to red; widely used for tomato and mango */
    aOverB: b !== 0 ? a / b : NaN,
    /* citrus colour index, CCI = 1000·a* ∕ (L*·b*) (Jiménez-Cuesta et al. 1981):
       negative green, around 0 the turning stage, positive orange */
    cci: L !== 0 && b !== 0 ? 1000 * a / (L * b) : NaN,
    /* browning index, BI = 100(x − 0.31)/0.17 with x = (a* + 1.75L*)/(5.645L* + a* − 3.012b*) (Palou et al. 1999) */
    bi: 100 * (x - 0.31) / 0.17,
    /* whiteness in the Lab form used for cut produce: WI = 100 − √((100 − L*)² + a*² + b*²) (Judd and Wyszecki 1975) */
    whiteness: 100 - sqrt((100 - L) ** 2 + a * a + b * b),
    /* yellowness index, YI = 142.86·b* ∕ L* (Francis and Clydesdale 1975, for Lab data) */
    yellowness: L !== 0 ? 142.86 * b / L : NaN,
    /* tomato colour index, TCI = 2000·a* ∕ (L*·√(a*² + b*²)) (Hobson et al. 1983) */
    tci: L !== 0 && C !== 0 ? 2000 * a / (L * C) : NaN,
    X, Y, Z,
  };
};
/* the classical ripeness reading of the hue angle in fruit that turn from
   green to yellow, orange or red (an orientation only; each crop has its own
   scale) */
Color.hueStage = function (h) {
  if (!(h >= 0)) return null;
  if (h >= 105) return { es: 'verde', en: 'green' };
  if (h >= 85) return { es: 'verde-amarillo', en: 'green-yellow' };
  if (h >= 70) return { es: 'amarillo', en: 'yellow' };
  if (h >= 50) return { es: 'naranja', en: 'orange' };
  if (h >= 25) return { es: 'rojo-naranja', en: 'red-orange' };
  return { es: 'rojo', en: 'red' };
};

g.Color = Color;
return Color;
}
if (typeof window !== 'undefined') ColorCore(window);
