// ventana 1400x1000
/* Capítulo 7: Aleatorización con los valores escritos (3 tratamientos, 5 tiempos, 4 repeticiones, completamente al
   azar, semilla 2026) después de «Generar»: los controles, los mosaicos y las primeras filas del libro de campo */
(async () => {
  await herramienta(7, 'aleatorizacion');
  porId('b7aGo').click(); await listo();
  const t = tarjeta(L('Libro de campo del ensayo', 'Field book of the trial'));
  irA(t, 120); await W(500);
  const filas = [...porId('b7aTab').querySelectorAll('tbody tr')].slice(0, 10);
  return caja([t, porId('b7aTiles'), porId('b7aOut').querySelector('h2'), porId('b7aTab').querySelector('thead')].concat(filas), 8);
})()
