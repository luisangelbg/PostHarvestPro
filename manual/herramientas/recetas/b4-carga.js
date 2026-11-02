// ventana 1400x1000
/* Capítulo 4: Carga de refrigeración con los valores de partida */
(async () => {
  await herramienta(4, 'enfriamiento');
  const t = tarjeta(L('Carga de refrigeración', 'Refrigeration load'));
  irA(t, 120); await W(500);
  return caja([t], 8);
})()
