// ventana 1400x1000
/* Capítulo 3: la tabla por tratamiento (medianas de Kaplan–Meier, media restringida, tiempo al 10 % y mediana del
   modelo), la comparación de los cuatro modelos paramétricos por AIC y las razones de tiempos, con el chayote */
(async () => {
  await ejemplo('b3s');
  irA(porId('b3sTab'), 120); await W(500);
  return caja([porId('b3sTab'), porId('b3sAIC'), porId('b3sPar'), porId('b3sCite')], 8);
})()
