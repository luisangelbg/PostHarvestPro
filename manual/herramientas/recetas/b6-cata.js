// ventana 1400x1000
/* Capítulo 6: CATA con el café: mosaicos, lectura y mapa de correspondencias */
(async () => {
  await ejemplo('b6c');
  const t = tarjeta(L('Frecuencias', 'Frequencies'));
  irA(t, 120); await W(500);
  return caja([t.querySelector('h2'), porId('b6cTiles'), porId('b6cRead'), porId('b6cFig')], 8);
})()
