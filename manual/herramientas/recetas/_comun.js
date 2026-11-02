/* PostHarvestPro — manual: ayudantes que captura.js antepone a cada receta.
   W(ms)                 espera
   EN, L(es, en)         true si la interfaz está en inglés; el texto del idioma activo
   listo(ms)             espera a que la app termine de dibujar (dos cuadros y, si la hubiera, que se cierre la capa
                         de espera de la suite, .lw-backdrop). Los cálculos de la app son síncronos: basta con esto
   vis(sel, txt)         el primer elemento visible que coincide (y cuyo texto empieza con txt)
   irA(nodo, margen)     lleva el nodo a la vista, debajo de las barras fijas
   caja(nodos, p)        el recorte que envuelve a los nodos, con p píxeles de aire, en coordenadas del documento
   porId(id)             document.getElementById, con error claro si no existe
   seccion(id)           los nodos de una sección de la portada (Bloque 1): su título h2.section-title y lo que sigue
                         hasta el siguiente título; id es el del título (examples, methods, refs, cite) o el comienzo
                         de su texto en el idioma activo («Cómo funciona», «Los nueve bloques», «La poscosecha…»)
   herramienta(n, tab)   abre el bloque n y, si se da, su pestaña (Tabs.go: calidad, color, calc, escalas, calibres;
                         cinetica, temperatura, aslt, rechazo; estatico, flujo, climaterio, map, enfriamiento; cadena,
                         mejoras, dano; discrim, hedonica, jar, cata, qda, fichas; factorial, repetidas, pendientes,
                         aleatorizacion; tarima, ventilacion, ambiente, costos, compat, unidades)
   ejemplo(clave)        abre la herramienta con su ejemplo, como los botones «Abrir en …» de la portada
                         (window.PHLoad[clave] de cada js/bN.js). Claves, conjunto y dónde se abre:
                           b2q  mango (Bloque 2 › Resumen de calidad)      b2c  mango (2 › Color, «El color de tus datos»)
                           b2g  mango, antracnosis (2 › Escalas)            b2k  mango (2 › Calibres)
                           b3k  mango, firmeza (3 › Modelos cinéticos)      b3s  chayote, rechazo (3 › Tiempo hasta rechazo)
                           b4s  aguacate, frascos (4 › Sistema estático)    b4c  aguacate, climaterio (4 › Climaterio)
                           b5c  jitomate, cadena (5 › Pérdidas por etapa)   b5d  jitomate, caídas (5 › Daño mecánico)
                           b6d  café, discriminativas (6 › Discriminativas) b6h  café, 80 consumidores (6 › Hedónica)
                           b6j  café, punto justo (6 › Punto justo)         b6c  café, CATA (6 › CATA)
                           b6q  café, perfil descriptivo (6 › Perfil descriptivo)
                           b7f  mango (7 › Factorial)  b7r  chayote, peso (7 › Medidas repetidas)  b7p  chayote (7 › Pendientes)
                         Las herramientas sin entrada de datos (Temperatura, Prueba acelerada, Flujo continuo,
                         Atmósfera modificada, Preenfriamiento, Simular mejoras, Fichas de cata, Aleatorización y todo
                         el Bloque 8) ya abren con valores de ejemplo escritos en sus campos: basta herramienta(n, tab)
   tarjeta(txt)          la tarjeta (.card) visible cuyo título h2 empieza con txt (en el idioma activo); con un número,
                         la i-ésima tarjeta visible del bloque abierto
   figura(nombre)        el recuadro de una figura de la app (.fig-box[data-fig="nombre"]), con su título
   Los textos se comparan con innerText (sólo el idioma visible: la app escribe los dos y esconde uno con CSS).
   La interfaz sale en el idioma que captura.js deja guardado (postharvestpro:lang); los textos que se buscan con
   vis() o tarjeta() deben estar en ese idioma —L('Resultados', 'Results')— o buscarse por id.
   Todos los datos de ejemplo son SIMULADOS (tools/generar_datos.R, semilla 20261004): ninguna receta abre
   archivos del disco. */
var W = ms => new Promise(r => setTimeout(r, ms));
var EN = window.I18N && I18N.lang === 'en';
var L = (es, en) => (EN ? en : es);
var cuadro = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
var listo = async ms => {
  const t0 = Date.now();
  await W(250); await cuadro();
  while (document.querySelector('.lw-backdrop') && Date.now() - t0 < (ms || 60000)) await W(200);
  await W(350);
};
var vis = (sel, txt) => [...document.querySelectorAll(sel)].find(n => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (!txt || (n.innerText || n.textContent).trim().startsWith(txt)); });
var irA = (n, margen) => { window.scrollTo({ top: n.getBoundingClientRect().top + window.scrollY - (margen == null ? 150 : margen), behavior: 'instant' }); };
var caja = (nodos, p) => {
  p = p == null ? 10 : p;
  const rs = [].concat(nodos).filter(Boolean).map(n => n.getBoundingClientRect()).filter(r => r.width > 0);
  const x = Math.min(...rs.map(r => r.left)) - p, y = Math.min(...rs.map(r => r.top)) - p;
  const w = Math.max(...rs.map(r => r.right)) + p - x, h = Math.max(...rs.map(r => r.bottom)) + p - y;
  return [Math.max(0, x + window.scrollX), Math.max(0, y + window.scrollY), w, h].map(Math.round).join(',');
};
var porId = id => { const n = document.getElementById(id); if (!n) throw new Error('No existe #' + id); return n; };
var seccion = id => {
  const h = document.getElementById(id) || vis('#panel-1 .section-title', id);
  if (!h) throw new Error('No encuentro la sección ' + id);
  const out = [h];
  let n = h.nextElementSibling;
  while (n && !n.classList.contains('section-title') && !n.classList.contains('footer-note')) { out.push(n); n = n.nextElementSibling; }
  return out;
};
var herramienta = async (n, tab) => {
  await W(700);
  goStep(n); await W(500);
  if (tab) { Tabs.go(n, tab); await W(300); }
  window.scrollTo({ top: 0, behavior: 'instant' });
  await listo();
};
/* the tool and block of each loader, as the gallery of the home page opens them (EXAMPLES in js/home.js) */
var EJEMPLOS = {
  b2q: [2, 'calidad'], b2c: [2, 'color'], b2g: [2, 'escalas'], b2k: [2, 'calibres'],
  b3k: [3, 'cinetica'], b3s: [3, 'rechazo'], b4s: [4, 'estatico'], b4c: [4, 'climaterio'],
  b5c: [5, 'cadena'], b5d: [5, 'dano'], b6d: [6, 'discrim'], b6h: [6, 'hedonica'], b6j: [6, 'jar'], b6c: [6, 'cata'], b6q: [6, 'qda'],
  b7f: [7, 'factorial'], b7r: [7, 'repetidas'], b7p: [7, 'pendientes'],
};
var ejemplo = async clave => {
  window.confirm = () => true;
  const e = EJEMPLOS[clave];
  if (!e) throw new Error('No hay ejemplo con la clave ' + clave);
  await herramienta(e[0], e[1]);
  const f = window.PHLoad && window.PHLoad[clave];
  if (!f) throw new Error('La app no registró el cargador PHLoad.' + clave);
  f();
  await listo();
  window.scrollTo({ top: 0, behavior: 'instant' });
  await W(200);
};
var tarjeta = i => {
  const panel = document.querySelector('.step-panel.active') || document;
  const cs = [...panel.querySelectorAll('.card')].filter(c => c.getBoundingClientRect().height > 0);
  if (typeof i === 'string') return cs.find(c => { const h = c.querySelector('h2'); return h && h.innerText.trim().startsWith(i); });
  return cs[i || 0];
};
var figura = nombre => {
  const f = document.querySelector(`.fig-box[data-fig="${nombre}"]`);
  if (!f) throw new Error('No existe la figura ' + nombre);
  return f;
};
/* the floating buttons of the navigator (back to top, last change) and the toasts stay out of the captures */
(() => {
  const st = document.createElement('style');
  st.textContent = '.lnav-fbtn, .lnav-float, [data-lnav="top"], [data-lnav="last"], .toast-stack, .labg-toast-host { display: none !important; }';
  document.head.appendChild(st);
})();
