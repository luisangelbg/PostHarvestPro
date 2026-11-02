// ventana 1400x1100
/* Capítulo 6: «Planear: número de jueces y potencia» con sus valores de partida (triangular, d′ 1.5, α 0.05, potencia 0.8, 30 jueces) */
(async () => {
  await herramienta(6, 'discrim');
  const t = tarjeta(L('Planear', 'Plan'));
  irA(t, 120); await W(500);
  return caja([t], 8);
})()
