// ventana 1400x1000
/* Capítulo 3: Temperatura después de «Llevar las k al análisis de temperatura →» desde el mango: la tarjeta
   «Arrhenius, Q10 y raíz cuadrada» con los mosaicos, la lectura y las dos figuras (Arrhenius y k contra la temperatura) */
(async () => {
  await ejemplo('b3k');
  porId('b3kToT').click(); await listo();
  const h = porId('b3tOut').querySelector('h2');
  irA(h, 120); await W(500);
  return caja([h, porId('b3tTiles'), porId('b3tRead'), porId('b3tFigA'), porId('b3tFigB')], 8);
})()
