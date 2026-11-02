// ventana 1400x1000
/* Capítulo 8: Compatibilidad con los cuatro productos elegidos de partida (botones, mosaicos y lectura del diagnóstico) */
(async () => {
  await herramienta(8, 'compat');
  const a = tarjeta(0);
  irA(a, 120); await W(500);
  return caja([a, porId('b8xTiles'), porId('b8xRead')], 8);
})()
