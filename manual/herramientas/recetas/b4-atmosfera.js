// ventana 1400x1000
/* Capítulo 4: Atmósfera de equilibrio con los valores de partida (mosaicos, lectura y plano O2-CO2; la tabla de películas va en el texto) */
(async () => {
  await herramienta(4, 'map');
  const t = porId('b4mOut');
  irA(t, 120); await W(500);
  return caja([t.querySelector('h2'), porId('b4mTiles'), porId('b4mRead'), porId('b4mFig')], 8);
})()
