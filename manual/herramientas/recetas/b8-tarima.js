// ventana 1400x1000
/* Capítulo 8: Tarima y contenedor con los valores de partida (ISO 120 x 100, caja 40 x 30 x 20, contenedor de 40 pies) */
(async () => {
  await herramienta(8, 'tarima');
  const t = tarjeta(0);
  irA(t, 120); await W(500);
  return caja([t], 8);
})()
