// ventana 1400x1000
/* Capítulo 4: Atmósfera modificada, tarjeta Producto y empaque con los valores de partida y la tabla de películas abierta */
(async () => {
  await herramienta(4, 'map');
  const t = tarjeta(L('Producto y empaque', 'Produce and package'));
  t.querySelector('details').open = true; await listo();
  irA(t, 120); await W(500);
  return caja([t], 8);
})()
