// ventana 1700x1000
/* Capítulo 3: la tabla de los ajustes por temperatura y la de «Los tres órdenes» (k, SCE, AIC, ΔAIC, peso de Akaike,
   R² linealizado) con el mango, hasta el botón «Llevar las k al análisis de temperatura →» y la línea de métodos */
(async () => {
  await ejemplo('b3k');
  const t = tarjeta(L('Ajuste y vida de anaquel', 'Fit and shelf life'));
  irA(porId('b3kTab'), 120); await W(500);
  return caja([porId('b3kTab'), porId('b3kCmp'), porId('b3kToT'), porId('b3kCite')], 8);
})()
