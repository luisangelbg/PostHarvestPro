// ventana 1400x1000
/* Capítulo 3: Bloque 3 › Modelos cinéticos con el mango de ejemplo: la tarjeta «Datos» con la franja del ejemplo, los
   papeles de las columnas (dia, firmeza_N, temperatura) y los controles Orden, Método, Límite y Confianza */
(async () => {
  await ejemplo('b3k');
  const t = tarjeta(L('Datos', 'Data'));
  irA(t, 120); await W(500);
  return caja([t], 8);
})()
