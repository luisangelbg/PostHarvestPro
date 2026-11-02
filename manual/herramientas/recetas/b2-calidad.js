// ventana 1400x1000
/* Capítulo 2: «Resumen por grupo y tiempo» con el mango de ejemplo: controles, mosaicos, lectura y la figura de la firmeza
   (la tabla queda fuera; el texto la describe) */
(async () => {
  await ejemplo('b2q');
  const t = tarjeta(L('Resumen por grupo y tiempo', 'Summary by group and time'));
  irA(t, 300); await W(600);
  return caja([t.querySelector('h2'), porId('b2qTiles'), porId('b2qRead'), figura('b2-calidad')], 12);
})()
