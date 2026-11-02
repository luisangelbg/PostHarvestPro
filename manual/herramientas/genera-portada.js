/* PostHarvestPro — manual de usuario: dibuja la portada (es/00a-portada.html; con --idioma en, en/00a-portada.html).
   Una sola ilustración vectorial original, hecha con los propios motores de la app sobre sus datos de ejemplo
   SIMULADOS (js/datasets_data.js, tools/generar_datos.R, semilla 20261004; no son mediciones de ningún lote real),
   para que la portada no sea un adorno sino una figura correcta:
     – arriba del dibujo, cinco frutos con la silueta del logo de la app (Art.logo, js/art.js) pintados con el color
       medio MEDIDO del mango de ejemplo a 20 °C en los días 0, 3, 6, 9 y 12: L*a*b* promedio convertido a sRGB con
       Color.labToHex (js/color.js), como lo hace la tira de color del Bloque 2;
     – al centro, la vida de anaquel: la firmeza de los 72 mangos a 13, 20 y 25 °C, la curva que elige el AIC en
       cada temperatura (Kin.compare, mínimos cuadrados no lineales, js/kinetics.js), el límite de 25 N y el tiempo
       en que cada curva lo cruza (Kin.timeToLimit), como en Bloque 3 › Modelos cinéticos;
     – la franja de los nueve colores de los bloques, los mismos del manual (interior.css, --b1 a --b9);
     – al pie, tres viñetas: la recta de Arrhenius de esas tres constantes (Kin.arrhenius), las curvas de
       Kaplan–Meier del chayote con dos recubrimientos (Surv.kmGroups, js/survival.js) y la tira del color medio de
       cada temperatura en cada día de muestreo.
   Fondo blanco, como las demás portadas de la suite (regla del autor). Sin azar: todo sale de los datos fijos.
   Uso, desde la carpeta de la app (tarda un par de segundos):
     node manual/herramientas/genera-portada.js
     node manual/herramientas/genera-portada.js --idioma en   (el mismo dibujo con los textos en inglés) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const APP = path.resolve(__dirname, '..', '..');

/* the app's engines, loaded as tests/run-node.js loads them */
const box = { console };
box.window = box;
vm.createContext(box);
['js/num.js', 'js/kinetics.js', 'js/survival.js', 'js/color.js', 'js/datasets_data.js', 'js/datasets.js', 'js/art.js']
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(APP, f), 'utf8'), box, { filename: f }));
const { Kin, Surv, Color, Datasets, Art } = box;

const EN = process.argv.includes('--idioma') && process.argv[process.argv.indexOf('--idioma') + 1] === 'en';
const L = (es, en) => (EN ? en : es);
const f1 = v => (Math.round(v * 10) / 10).toFixed(1);
const dec = (v, d) => v.toFixed(d);

/* ---------------- palette (css/style.css of the app, on white paper) ---------------- */
const PB = { tinta: '#1a1108', gris: '#6a5d50', naranja: '#EF6C00', naranjaTxt: '#B85000', verde: '#7CB342', verdeTxt: '#4E7A1E', crema: '#FFF3E0', oro: '#8f6a1c', oroLin: '#b98d2c', limite: '#C0392B' };
const TEMP = { 13: '#2E7D99', 20: '#6B9E2F', 25: '#EF6C00' };          /* the colours of the home illustration */
const TRAT = { Testigo: '#C8461A', 'Cera vegetal': '#8C6D1F', Quitosano: '#2E7D99' };
const BLOQUES = ['#b85000', '#4e7a1e', '#2a6f88', '#2f7a68', '#b0362a', '#943871', '#5050a6', '#8a5a2b', '#94701c'];

/* ---------------- the data and the engines ---------------- */
const mango = Datasets.rows('mango');
const temps = [13, 20, 25];
const LIM = 25;
const ajustes = temps.map(T => {
  const r = mango.filter(x => +x.temperatura === T);
  const cmp = Kin.compare(r.map(x => +x.dia), r.map(x => +x.firmeza_N));
  const fit = cmp.bestFit;
  return { T, r, fit, order: cmp.best, tl: Kin.timeToLimit(fit, LIM) };
});
const A = Kin.arrhenius(temps, ajustes.map(a => Math.abs(a.fit.k)));
const media = (rows, k) => rows.reduce((s, x) => s + +x[k], 0) / rows.length;
const colorDe = rows => Color.labToHex(media(rows, 'L'), media(rows, 'a'), media(rows, 'b')).hex;
const dias = [...new Set(mango.map(x => +x.dia))].sort((a, b) => a - b);
const chay = Datasets.rows('chayoteRechazo');
const KM = Surv.kmGroups(chay.map(x => +x.dias), chay.map(x => +x.rechazado), chay.map(x => x.tratamiento));

const W = 850, H = 1100;
let s = `<defs>
  <radialGradient id="fondo" cx="50%" cy="44%" r="74%"><stop offset="0" stop-color="#fff6ea"/><stop offset="0.6" stop-color="#fffcf8"/><stop offset="1" stop-color="#ffffff"/></radialGradient>
  <linearGradient id="oro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d6ae55"/><stop offset="0.5" stop-color="#9c7320"/><stop offset="1" stop-color="#cfa548"/></linearGradient>
  <linearGradient id="zona" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C0392B" stop-opacity="0.10"/><stop offset="1" stop-color="#C0392B" stop-opacity="0.02"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#fondo)"/>
<rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none" stroke="url(#oro)" stroke-width="2.2"/>
<rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="#b98d2c" stroke-width="0.7" opacity="0.7"/>`;

/* the logo of the app, as Art.logo draws it, placed at (x, y) with size z; a colour replaces its ripening skin */
const logo = (x, y, z, color) => {
  let svg = Art.logo(64);
  if (color) svg = svg.replace(/fill="url\(#(phg\d+)\)"/, `fill="${color}"`);
  return svg.replace(/^<svg viewBox="0 0 64 64" width="\d+" height="\d+"/, `<svg viewBox="0 0 64 64" x="${f1(x)}" y="${f1(y)}" width="${z}" height="${z}"`);
};
[[48, 48], [W - 80, 48], [48, H - 80], [W - 80, H - 80]].forEach(([x, y]) => { s += `<g opacity="0.85">${logo(x, y, 32)}</g>`; });

/* ---------------- title ---------------- */
s += `<text x="${W / 2}" y="104" text-anchor="middle" font-family="Jost" font-weight="500" font-size="12.5" letter-spacing="5.5" fill="${PB.oro}">${L('LABG SUITE · CIENCIA ABIERTA EN EL NAVEGADOR', 'LABG SUITE · OPEN SCIENCE IN THE BROWSER')}</text>
<text x="${W / 2}" y="190" text-anchor="middle" font-family="Cormorant" font-weight="600" font-size="80" fill="${PB.tinta}">PostHarvest<tspan fill="${PB.naranjaTxt}">Pro</tspan></text>
<line x1="${W / 2 - 70}" y1="214" x2="${W / 2 + 70}" y2="214" stroke="${PB.oroLin}" stroke-width="1.4"/>`;
const LEMA_ES = 'Mide la calidad, predice la vida de anaquel y decide con datos', LEMA_EN = 'Measure quality, predict shelf life and decide with data';
const t1 = EN ? 'User’s Manual' : 'Manual de usuario', t2 = EN ? 'Manual de usuario' : 'User’s Manual';
s += `
<text x="${W / 2}" y="252" text-anchor="middle" font-family="Cormorant" font-weight="600" font-size="38" fill="${PB.tinta}">${t1}</text>
<text x="${W / 2}" y="281" text-anchor="middle" font-family="Cormorant" font-style="italic" font-weight="500" font-size="25" fill="${PB.oro}">${t2}</text>
<text x="${W / 2}" y="310" text-anchor="middle" font-family="Jost" font-weight="400" font-size="15" fill="${PB.tinta}" opacity="0.9">${EN ? LEMA_EN : LEMA_ES}</text>
<text x="${W / 2}" y="329" text-anchor="middle" font-family="Cormorant" font-style="italic" font-weight="500" font-size="14" fill="${PB.gris}">${EN ? LEMA_ES : LEMA_EN}</text>`;

/* ---------------- five fruits with the colour measured at 20 °C ---------------- */
{
  const r20 = mango.filter(x => +x.temperatura === 20);
  const dd = [0, 3, 6, 9, 12];
  const x0 = 185, paso = 120;
  dd.forEach((d, i) => {
    const hex = colorDe(r20.filter(x => +x.dia === d));
    const x = x0 + i * paso;
    s += `<ellipse cx="${x + 1}" cy="447" rx="26" ry="4.5" fill="${PB.tinta}" opacity="0.08"/>`;
    s += logo(x - 39, 362, 78, hex);
    s += `<text x="${x}" y="468" text-anchor="middle" font-family="Jost" font-size="9.5" fill="${PB.gris}">${L('día', 'day')} ${d} · ${hex.toUpperCase()}</text>`;
  });
  s += `<text x="${W / 2}" y="357" text-anchor="middle" font-family="Jost" font-weight="500" font-size="8.5" letter-spacing="2" fill="${PB.oro}">${L('EL COLOR MEDIDO DEL MANGO A 20 °C', 'THE MEASURED COLOUR OF THE MANGO AT 20 °C')}</text>`;
}

/* ---------------- the shelf-life chart ---------------- */
{
  const x0 = 175, x1 = 690, y0 = 500, y1 = 790, tMax = 27, yMax = 160;
  const gx = t => x0 + t / tMax * (x1 - x0), gy = v => y1 - v / yMax * (y1 - y0);
  let p = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="#ffffff" stroke="${PB.oroLin}" stroke-opacity="0.5" stroke-width="0.6"/>`;
  p += `<rect x="${x0}" y="${f1(gy(LIM))}" width="${x1 - x0}" height="${f1(y1 - gy(LIM))}" fill="url(#zona)"/>`;
  [0, 50, 100, 150].forEach(v => { p += `<line x1="${x0}" y1="${f1(gy(v))}" x2="${x1}" y2="${f1(gy(v))}" stroke="#efe6da" stroke-width="0.8"/><text x="${x0 - 7}" y="${f1(gy(v) + 3)}" text-anchor="end" font-family="Jost" font-size="8" fill="${PB.gris}">${v}</text>`; });
  [0, 3, 6, 9, 12, 15, 18, 21, 24, 27].forEach(t => { p += `<line x1="${f1(gx(t))}" y1="${y1}" x2="${f1(gx(t))}" y2="${y1 + 4}" stroke="${PB.tinta}" stroke-opacity="0.5"/><text x="${f1(gx(t))}" y="${y1 + 15}" text-anchor="middle" font-family="Jost" font-size="8" fill="${PB.gris}">${t}</text>`; });
  p += `<text x="${(x0 + x1) / 2}" y="${y1 + 30}" text-anchor="middle" font-family="Jost" font-size="8.5" fill="${PB.tinta}">${L('días de almacenamiento', 'days in storage')}</text>`;
  p += `<text x="${x0 - 30}" y="${(y0 + y1) / 2}" text-anchor="middle" font-family="Jost" font-size="8.5" fill="${PB.tinta}" transform="rotate(-90 ${x0 - 30} ${(y0 + y1) / 2})">${L('firmeza (N)', 'firmness (N)')}</text>`;
  p += `<line x1="${x0}" y1="${f1(gy(LIM))}" x2="${x1}" y2="${f1(gy(LIM))}" stroke="${PB.limite}" stroke-width="1.2" stroke-dasharray="6 4"/>`;
  p += `<text x="${f1(gx(16.5))}" y="${f1(gy(LIM) - 5)}" text-anchor="middle" font-family="Jost" font-size="8.5" fill="${PB.limite}">${L('límite de aceptación · 25 N', 'acceptance limit · 25 N')}</text>`;
  ajustes.forEach(a => {
    const c = TEMP[a.T];
    a.r.forEach(x => { p += `<circle cx="${f1(gx(+x.dia))}" cy="${f1(gy(+x.firmeza_N))}" r="2.4" fill="${c}" fill-opacity="0.55"/>`; });
    const tEnd = Math.max(...a.r.map(x => +x.dia));
    let d = '';
    for (let i = 0; i <= 80; i++) { const t = tEnd * i / 80; d += (i ? 'L' : 'M') + f1(gx(t)) + ' ' + f1(gy(Kin.model(a.order, t, a.fit.C0, a.fit.k))); }
    p += `<path d="${d}" fill="none" stroke="${c}" stroke-width="2.2"/>`;
    const tl = a.tl.t;
    /* beyond the last sampling day the curve goes on dotted, up to the limit: an extrapolation */
    if (isFinite(tl) && tl > tEnd && tl <= tMax) { let e = ''; for (let i = 0; i <= 20; i++) { const t = tEnd + (tl - tEnd) * i / 20; e += (i ? 'L' : 'M') + f1(gx(t)) + ' ' + f1(gy(Kin.model(a.order, t, a.fit.C0, a.fit.k))); } p += `<path d="${e}" fill="none" stroke="${c}" stroke-width="1.6" stroke-dasharray="3 3"/>`; }
    if (isFinite(tl) && tl <= tMax) {
      p += `<line x1="${f1(gx(tl))}" y1="${f1(gy(LIM))}" x2="${f1(gx(tl))}" y2="${y1}" stroke="${c}" stroke-width="1" stroke-dasharray="2 2"/>`;
      p += `<circle cx="${f1(gx(tl))}" cy="${f1(gy(LIM))}" r="4.4" fill="${c}" stroke="#fff" stroke-width="1.2"/>`;
      p += `<text x="${f1(gx(tl) + 4)}" y="${y1 - 6}" font-family="Jost" font-weight="500" font-size="9" fill="${c}">${dec(tl, 1)} ${L('d', 'd')}</text>`;
    }
  });
  /* legend */
  ajustes.forEach((a, i) => {
    const y = y0 + 16 + i * 15;
    p += `<line x1="${x1 - 132}" y1="${y}" x2="${x1 - 116}" y2="${y}" stroke="${TEMP[a.T]}" stroke-width="2.2"/><text x="${x1 - 110}" y="${y + 3}" font-family="Jost" font-size="8.5" fill="${PB.tinta}">${a.T} °C · k = ${dec(Math.abs(a.fit.k), 4)} ${L('por día', 'per day')}</text>`;
  });
  p += `<text x="${W / 2}" y="${y0 - 10}" text-anchor="middle" font-family="Jost" font-weight="500" font-size="8.5" letter-spacing="2" fill="${PB.oro}">${L('VIDA DE ANAQUEL · CINÉTICA DE PRIMER ORDEN A TRES TEMPERATURAS', 'SHELF LIFE · FIRST-ORDER KINETICS AT THREE TEMPERATURES')}</text>`;
  s += p;
}

/* ---------------- the strip of the nine block colours ---------------- */
BLOQUES.forEach((c, i) => { s += `<rect x="${f1(150 + i * 61.7)}" y="852" width="59" height="6" fill="${c}"/>`; });

/* ---------------- three vignettes ---------------- */
const vin = (x, titulo, gg) => `<g transform="translate(${x} 872)"><rect width="176" height="118" rx="6" fill="#fffaf3" stroke="#b98d2c" stroke-opacity="0.7" stroke-width="0.8"/>${gg}<text x="88" y="110" text-anchor="middle" font-family="Jost" font-weight="500" font-size="8.5" letter-spacing="2" fill="${PB.oro}">${titulo}</text></g>`;
/* 1 · Arrhenius: ln k against 1000/T */
{
  const xs = temps.map(T => 1000 / (T + Kin.K0)), ys = ajustes.map(a => Math.log(Math.abs(a.fit.k)));
  const xa = Math.min(...xs) - 0.03, xb = Math.max(...xs) + 0.03, ya = Math.min(...ys) - 0.25, yb = Math.max(...ys) + 0.25;
  const gx = v => 18 + (v - xa) / (xb - xa) * 140, gy = v => 80 - (v - ya) / (yb - ya) * 66;
  let gg = `<line x1="18" y1="80" x2="158" y2="80" stroke="${PB.tinta}" stroke-opacity="0.35" stroke-width="0.6"/><line x1="18" y1="12" x2="18" y2="80" stroke="${PB.tinta}" stroke-opacity="0.35" stroke-width="0.6"/>`;
  /* the fitted line through the predicted k at the ends of the range */
  const kA = T => A.predict(T).lnk;
  const Ta = 1000 / xa - Kin.K0, Tb = 1000 / xb - Kin.K0;
  gg += `<line x1="${f1(gx(xa))}" y1="${f1(gy(kA(Ta)))}" x2="${f1(gx(xb))}" y2="${f1(gy(kA(Tb)))}" stroke="${PB.naranja}" stroke-width="1.5"/>`;
  xs.forEach((x, i) => { gg += `<circle cx="${f1(gx(x))}" cy="${f1(gy(ys[i]))}" r="3.4" fill="${TEMP[temps[i]]}" stroke="#fff" stroke-width="0.8"/>`; });
  gg += `<text x="152" y="22" text-anchor="end" font-family="Jost" font-size="7.5" fill="${PB.tinta}">E<tspan baseline-shift="sub" font-size="5.5">a</tspan> = ${dec(A.Ea / 1000, 1)} kJ/mol</text>`;
  gg += `<text x="88" y="92" text-anchor="middle" font-family="Jost" font-size="6.8" fill="${PB.gris}">ln k ${L('contra', 'against')} 1000/T</text>`;
  s += vin(130, 'ARRHENIUS', gg);
}
/* 2 · Kaplan–Meier of the chayote */
{
  const tMax = 35, gx = t => 14 + t / tMax * 148, gy = v => 80 - v * 66;
  let gg = `<line x1="14" y1="80" x2="162" y2="80" stroke="${PB.tinta}" stroke-opacity="0.35" stroke-width="0.6"/><line x1="14" y1="14" x2="14" y2="80" stroke="${PB.tinta}" stroke-opacity="0.35" stroke-width="0.6"/>`;
  KM.groups.forEach(G => {
    let d = `M${f1(gx(0))} ${f1(gy(1))}`, S = 1;
    G.time.forEach((t, i) => { d += `L${f1(gx(t))} ${f1(gy(S))}L${f1(gx(t))} ${f1(gy(G.surv[i]))}`; S = G.surv[i]; });
    d += `L${f1(gx(tMax))} ${f1(gy(S))}`;
    gg += `<path d="${d}" fill="none" stroke="${TRAT[G.name] || PB.tinta}" stroke-width="1.5"/>`;
  });
  gg += `<text x="88" y="92" text-anchor="middle" font-family="Jost" font-size="6.8" fill="${PB.gris}">${L('chayote: aún aceptables contra días', 'chayote: still acceptable against days')}</text>`;
  s += vin(337, L('EL RECHAZO', 'REJECTION'), gg);
}
/* 3 · the mean colour of each temperature on each sampling day */
{
  let gg = '';
  const cw = 140 / dias.length;
  temps.forEach((T, j) => {
    const y = 14 + j * 22;
    gg += `<text x="16" y="${y + 12}" text-anchor="end" font-family="Jost" font-size="6.5" fill="${PB.gris}">${T}°</text>`;
    dias.forEach((d, i) => {
      const r = mango.filter(x => +x.temperatura === T && +x.dia === d);
      gg += r.length ? `<rect x="${f1(20 + i * cw)}" y="${y}" width="${f1(cw - 1.5)}" height="18" rx="2" fill="${colorDe(r)}"/>` : `<rect x="${f1(20 + i * cw)}" y="${y}" width="${f1(cw - 1.5)}" height="18" rx="2" fill="none" stroke="#e3d6c4" stroke-width="0.6" stroke-dasharray="2 2"/>`;
    });
  });
  gg += `<text x="88" y="92" text-anchor="middle" font-family="Jost" font-size="6.8" fill="${PB.gris}">${L('L*a*b* medio por día de muestreo', 'mean L*a*b* by sampling day')}</text>`;
  s += vin(544, L('EL COLOR', 'COLOUR'), gg);
}

/* ---------------- footer ---------------- */
s += `<text x="${W / 2}" y="1030" text-anchor="middle" font-family="Jost" font-weight="400" font-size="12" letter-spacing="2.5" fill="${PB.tinta}" opacity="0.9">LUIS ÁNGEL BARRERA-GUZMÁN</text>
<text x="${W / 2}" y="1049" text-anchor="middle" font-family="Jost" font-weight="400" font-size="10" letter-spacing="1.5" fill="${PB.oro}">${L('PRIMERA EDICIÓN · 2026 · VERSIÓN 1.0', 'FIRST ENGLISH EDITION · 2026 · VERSION 1.0')}</text>`;

const html = `<!doctype html>
<html lang="${L('es', 'en')}">
<head>
<meta charset="utf-8">
<title>${L('PostHarvestPro · Manual de usuario · Portada', 'PostHarvestPro · User’s Manual · Cover')}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../manual.css">
<!-- dibujada por herramientas/genera-portada.js${L('', ' --idioma en')}: no se edita a mano -->
</head>
<body>
<section class="page cover" aria-label="${L('Portada', 'Cover')}">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${L('Portada del manual de PostHarvestPro: cinco mangos con el color medido del ejemplo simulado a 20 °C, la firmeza de los mangos a 13, 20 y 25 °C con sus curvas de primer orden y el límite de aceptación, y tres viñetas (Arrhenius, el rechazo del chayote y el color por día)', 'Cover of the PostHarvestPro manual: five mangoes with the measured colour of the simulated example at 20 °C, the firmness of the mangoes at 13, 20 and 25 °C with their first-order curves and the acceptance limit, and three vignettes (Arrhenius, rejection of the chayote and colour by day)')}">
${s}
</svg>
</section>
</body>
</html>
`;
fs.writeFileSync(path.join(APP, 'manual', EN ? 'en' : 'es', '00a-portada.html'), html);
console.log('portada:', ajustes.map(a => `${a.T} °C orden ${a.order} k ${Math.abs(a.fit.k).toFixed(4)} t(25 N) ${a.tl.t.toFixed(1)}`).join(' · '),
  '· Ea', (A.Ea / 1000).toFixed(1), 'kJ/mol ·', (html.length / 1024).toFixed(0) + ' KB');
