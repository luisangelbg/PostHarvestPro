/* PostHarvestPro — manual de usuario: escribe las referencias del apéndice F a partir del catálogo de la app.
   Lee js/refs.js (Refs.REFS: las 81 obras que la app muestra en Bloque 1 › Referencias, y Refs.METHODS: qué
   métodos de qué bloque cita cada una) y reemplaza lo que hay entre las marcas <!-- REFERENCIAS --> y
   <!-- /REFERENCIAS --> de es/10-apendices.html: un apartado por tema, con las obras en orden alfabético. El tema
   de cada obra es el del primer bloque que la cita en METHODS (calidad y color, cinética y vida de anaquel,
   respiración y atmósferas, pérdidas y daño mecánico, evaluación sensorial, ensayos, empaque y almacén); una obra
   que ningún método cite sale en «Otras» con un aviso. Así el manual y el programa citan exactamente lo mismo.
   Uso, desde la carpeta de la app:
          node manual/herramientas/genera-referencias.js              (es/10-apendices.html)
          node manual/herramientas/genera-referencias.js --idioma en  (en/10-apendices.html: los títulos de los temas en
                                                                        inglés; las referencias se dejan como las
                                                                        escribe la app, que ya están en inglés) */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const raiz = path.resolve(__dirname, '..', '..');
/* refs.js se registra en window (o globalThis) y no necesita nada más para cargarse */
const caja = { console };
caja.window = caja;
caja.globalThis = caja;
vm.createContext(caja);
vm.runInContext(fs.readFileSync(path.join(raiz, 'js', 'refs.js'), 'utf8'), caja);
const { REFS, METHODS } = caja.Refs;
const iIdioma = process.argv.indexOf('--idioma'), en = iIdioma > 0 && process.argv[iIdioma + 1] === 'en';
const lang = en ? 'en' : 'es';

/* el tema de cada obra: el primer bloque que la cita */
const TEMAS = [
  [2, 'Calidad, madurez y color', 'Quality, ripeness and color'],
  [3, 'Cinética, vida de anaquel y tiempo hasta el rechazo', 'Kinetics, shelf life and time to rejection'],
  [4, 'Respiración, etileno, atmósferas y enfriamiento', 'Respiration, ethylene, atmospheres and cooling'],
  [5, 'Pérdidas y daño mecánico', 'Losses and mechanical damage'],
  [6, 'Evaluación sensorial', 'Sensory evaluation'],
  [7, 'Diseño y análisis de ensayos', 'Design and analysis of trials'],
  [8, 'Empaque, almacén y psicrometría', 'Packaging, storage and psychrometrics'],
];
const bloqueDe = {};
METHODS.forEach(m => m[3].forEach(k => { if (!(k in bloqueDe)) bloqueDe[k] = m[0]; }));
const temaDe = k => (TEMAS.some(T => T[0] === bloqueDe[k]) ? bloqueDe[k] : 'otr');
const clave = s => s.replace(/<[^>]+>/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const escHtml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const grupos = TEMAS.map(T => [T[0], en ? T[2] : T[1]]).concat([['otr', en ? 'Other' : 'Otras']]);
let total = 0, html = '\n', n = 0;
grupos.forEach(([t, nombre]) => {
  const lista = Object.keys(REFS).filter(k => temaDe(k) === t).map(k => REFS[k]).sort((a, b) => clave(a).localeCompare(clave(b), lang));
  if (!lista.length) return;
  if (t === 'otr') console.warn('Aviso: ' + lista.length + ' referencia(s) que ningún método cita: ' + lista.map(r => r.slice(0, 30)).join(' | '));
  total += lista.length; n++;
  html += `  <h3>F.${n} · ${nombre}</h3>\n  <ul class="refs">\n` + lista.map(r => `    <li>${escHtml(r)}</li>`).join('\n') + '\n  </ul>\n';
});

const archivo = path.join(raiz, 'manual', lang, '10-apendices.html');
if (!fs.existsSync(archivo)) { console.log(`${total} referencias en ${n} temas; todavía no existe ${path.relative(raiz, archivo)}`); process.exit(0); }
const texto = fs.readFileSync(archivo, 'utf8');
const a = texto.indexOf('<!-- REFERENCIAS -->'), b = texto.indexOf('<!-- /REFERENCIAS -->');
if (a < 0 || b < 0) throw new Error('No encontré las marcas de las referencias en ' + archivo);
fs.writeFileSync(archivo, texto.slice(0, a + '<!-- REFERENCIAS -->'.length) + html + '  ' + texto.slice(b));
console.log(`${total} referencias en ${n} temas escritas en ${path.relative(raiz, archivo)}`);
