// ventana 1400x900
/* Capítulo 9: la curva de firmeza del mango (Bloque 3 › Modelos cinéticos, figura b3-cinetica) abierta en el estudio de
   figuras: la ventana entera */
(async () => {
  await ejemplo('b3k');
  const f = figura('b3-cinetica');
  irA(f, 200); await W(500);
  f.querySelector('.lfs-open').click(); await W(4500);
  return null;
})()
