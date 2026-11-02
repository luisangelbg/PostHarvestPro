// ventana 1400x1000
/* Capítulo 3: «Ajuste y vida de anaquel» con el mango: mosaicos, lectura y la figura b3-cinetica (firmeza contra el
   día a 13, 20 y 25 °C, curvas de primer orden con su banda y el límite de 25 N) */
(async () => {
  await ejemplo('b3k');
  const t = tarjeta(L('Ajuste y vida de anaquel', 'Fit and shelf life'));
  irA(t, 120); await W(500);
  return caja([t.querySelector('h2'), porId('b3kTiles'), porId('b3kRead'), porId('b3kFig')], 8);
})()
