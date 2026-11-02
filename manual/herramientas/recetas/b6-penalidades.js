// ventana 1400x1000
/* Capítulo 6: Punto justo con el café: lectura y gráfica de penalidades */
(async () => {
  await ejemplo('b6j');
  const t = tarjeta(L('Análisis de penalidades', 'Penalty analysis'));
  irA(t, 120); await W(500);
  return caja([t.querySelector('h2'), porId('b6jRead'), porId('b6jFig')], 8);
})()
