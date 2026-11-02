// ventana 1400x1000
/* Capítulo 7: Medidas repetidas con la pérdida de peso del chayote (18 frutos): mosaicos, lectura, ANOVA de parcelas
   divididas en el tiempo con p corregidas y la figura b7-repetidas */
(async () => {
  await ejemplo('b7r');
  const t = tarjeta(L('Parcelas divididas en el tiempo', 'Split plot in time'));
  irA(t, 120); await W(500);
  return caja([t.querySelector('h2'), porId('b7rTiles'), porId('b7rRead'), porId('b7rAnova'), porId('b7rFig')], 8);
})()
