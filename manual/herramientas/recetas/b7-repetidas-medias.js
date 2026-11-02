// ventana 1400x1000
/* Capítulo 7: las medias de la pérdida de peso del chayote dentro de cada día, con letras de Tukey y el error
   combinado con grados de libertad de Satterthwaite */
(async () => {
  await ejemplo('b7r');
  const h = [...document.querySelectorAll('#b7rOut h3')][0];
  irA(h, 120); await W(500);
  return caja([h, porId('b7rMeans'), porId('b7rCite')], 8);
})()
