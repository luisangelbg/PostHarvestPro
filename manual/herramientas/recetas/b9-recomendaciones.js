// ventana 1400x1000
/* Capítulo 9: «Recomendaciones de manejo» después de cargar los dieciocho ejemplos de la app */
(async () => {
  for (const k of ['b2q', 'b2c', 'b2g', 'b2k', 'b3k', 'b3s', 'b4s', 'b4c', 'b5c', 'b5d', 'b6d', 'b6h', 'b6j', 'b6c', 'b6q', 'b7f', 'b7r', 'b7p']) await ejemplo(k);
  await herramienta(9);
  const t = tarjeta(L('Recomendaciones de manejo', 'Handling recommendations'));
  irA(t, 300); await W(500);
  return caja([t], 6);
})()
