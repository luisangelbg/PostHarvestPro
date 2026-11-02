// ventana 1400x1000
/* Capítulo 1: «Referencias» y «Cómo citar», al final de la portada, con la cita, el BibTeX, los dos botones de copiar
   y la nota del pie con el enlace al manual de usuario */
(async () => {
  await W(2200);
  const r = seccion('refs'), c = seccion('cite'), pie = document.querySelector('#panel-1 .footer-note');
  irA(r[0], 300); await W(600);
  return caja(r.concat(c, pie ? [pie] : []), 8);
})()
