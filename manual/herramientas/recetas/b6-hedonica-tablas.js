// ventana 1400x1000
/* Capítulo 6: Hedónica: las tablas del ANOVA, de las medias con sus letras de Tukey y de Friedman */
(async () => {
  await ejemplo('b6h');
  const fr = porId('b6hFr');
  irA(porId('b6hAnova'), 120); await W(500);
  return caja([porId('b6hAnova'), porId('b6hMeans'), fr.previousElementSibling, fr, porId('b6hCite')], 8);
})()
