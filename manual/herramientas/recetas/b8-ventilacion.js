// ventana 1400x1000
/* Capítulo 8: Ventilación de cajas con los orificios de partida */
(async () => {
  await herramienta(8, 'ventilacion');
  const t = tarjeta(0);
  irA(t, 120); await W(500);
  return caja([t], 8);
})()
