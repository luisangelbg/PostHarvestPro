// ventana 1400x1000
/* Capítulo 4: Flujo continuo con las tres cámaras escritas de partida (tabla editable, mosaicos y tasas) */
(async () => {
  await herramienta(4, 'flujo');
  const a = tarjeta(L('Cámaras con flujo de aire', 'Chambers with air flow')), b = porId('b4fOut');
  irA(a, 120); await W(500);
  return caja([a, b], 8);
})()
