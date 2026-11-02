// ventana 1400x1100
/* Capítulo 6: Discriminativas con el café del ejemplo: la tarjeta «Resultados de las pruebas» (tabla editable, confianza y estadístico) */
(async () => {
  await ejemplo('b6d');
  const t1 = tarjeta(L('Resultados de las pruebas', 'Test results'));
  irA(t1, 120); await W(500);
  return caja([t1], 8);
})()
