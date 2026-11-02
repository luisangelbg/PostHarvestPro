// ventana 1400x1000
/* Capítulo 1: «Referencias» y «Cómo citar», al final de la portada, con la cita, el BibTeX y los dos botones de copiar */
(async () => {
  await W(2200);
  const r = seccion('refs'), c = seccion('cite');
  irA(r[0], 300); await W(600);
  return caja(r.concat(c), 8);
})()
