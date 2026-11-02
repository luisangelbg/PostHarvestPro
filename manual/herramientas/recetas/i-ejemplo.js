// ventana 1400x1000
/* Introducción: «Datos de ejemplo» de la portada (Bloque 1): el título, su explicación y las seis primeras tarjetas
   (mango, chayote, aguacate, jitomate) con los botones que abren cada herramienta con su ejemplo. La lista completa
   de las diez tablas va en la tabla de I.7 */
(async () => {
  await W(1400);
  const ns = seccion('examples'); irA(ns[0], 120); await W(600);
  const tarjetas = [...document.querySelectorAll('#exampleGrid .ex-card')].slice(0, 6);
  return caja(ns.filter(n => !n.contains(tarjetas[0])).concat(tarjetas), 8);
})()
