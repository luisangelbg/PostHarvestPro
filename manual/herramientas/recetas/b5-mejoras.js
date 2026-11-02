// ventana 1400x1000
/* Capítulo 5: Simular mejoras sobre la cadena del jitomate de ejemplo (Transporte, 50 %): controles, mosaicos, lectura y barras */
(async () => {
  await ejemplo('b5c');
  Tabs.go(5, 'mejoras'); await listo();
  const a = tarjeta(0);
  irA(a, 120); await W(500);
  return caja([a, porId('b5mTiles'), porId('b5mRead'), porId('b5mFig')], 8);
})()
