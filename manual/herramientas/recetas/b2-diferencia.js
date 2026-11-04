// ventana 1400x1000
/* Capítulo 2: Bloque 2 › Color, «Diferencia entre dos colores» con los valores de partida */
(async () => {
  await herramienta(2, 'color');
  const t = tarjeta(L('Diferencia entre dos colores', 'Difference between two colors'));
  irA(t, 300); await W(500);
  return caja([t], 6);
})()
