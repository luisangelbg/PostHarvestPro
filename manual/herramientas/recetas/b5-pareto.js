// ventana 1400x1000
/* Capítulo 5: puntos críticos (Pareto) del jitomate de ejemplo y el botón para EconomicsPro */
(async () => {
  await ejemplo('b5c');
  const p = porId('b5cPar'), h = p.previousElementSibling, b = porId('b5cSend'), c = porId('b5cCite');
  irA(h, 120); await W(500);
  return caja([h, p, b, c], 8);
})()
