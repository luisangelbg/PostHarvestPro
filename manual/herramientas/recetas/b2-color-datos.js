// ventana 1400x1000
/* Capítulo 2: «El color de tus datos» con el mango de ejemplo: la tira de colores medios, ΔE00 desde el inicio y el tono
   (sin la tabla ni la entrada de datos) */
(async () => {
  await ejemplo('b2c');
  const f = figura('b2-tira-color');
  irA(f, 300); await W(600);
  return caja([f, figura('b2-deltaE'), figura('b2-tono')], 10);
})()
