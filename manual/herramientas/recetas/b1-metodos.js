// ventana 1400x1000
/* Capítulo 1: «Métodos y fuentes», el título y las tarjetas de los métodos de los bloques 2 a 4 (las catorce primeras
   de las 28; el texto del manual enumera las demás) */
(async () => {
  await W(2200);
  const s = seccion('methods');
  irA(s[0], 300); await W(600);
  const cards = [...document.querySelectorAll('#methodGallery .method-card')].slice(0, 15);
  return caja([s[0], s[1]].concat(cards), 8);
})()
