// ventana 1400x1000
/* Capítulo 3: «Vida de anaquel a cualquier temperatura» con las k del mango llevadas desde Modelos cinéticos (C₀
   123.736, límite 25, primer orden, 10 °C); «Llevar las k…» ya recalcula la vida con esos valores */
(async () => {
  await ejemplo('b3k');
  porId('b3kToT').click(); await listo();
  const h = [...document.querySelectorAll('#b3tOut h3')][0];
  irA(h, 120); await W(500);
  return caja([h, porId('b3tOrd').closest('.form-grid'), porId('b3tSL'), porId('b3tFigC'), porId('b3tCite')], 8);
})()
