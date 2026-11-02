// ventana 1400x1000
/* Capítulo 2: Bloque 2 › Color, «Conversor de color» con los valores de partida (L* 62, a* 8, b* 48) */
(async () => {
  await herramienta(2, 'color');
  const t = tarjeta(L('Conversor de color', 'Colour converter'));
  irA(t, 300); await W(500);
  return caja([t], 6);
})()
