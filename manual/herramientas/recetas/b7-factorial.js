// ventana 1400x1000
/* Capítulo 7: «Análisis de varianza» del factorial con el mango (temperatura × día, días 0 a 12): mosaicos, lectura,
   tabla del ANOVA y la figura b7-factorial */
(async () => {
  await ejemplo('b7f');
  const t = tarjeta(L('Análisis de varianza', 'Analysis of variance'));
  irA(t, 120); await W(500);
  return caja([t.querySelector('h2'), porId('b7fTiles'), porId('b7fRead'), porId('b7fAnova'), porId('b7fFig')], 8);
})()
