// ventana 1400x1000
/* Capítulo 3: Tiempo hasta rechazo con el chayote de ejemplo: mosaicos, lectura y la figura de Kaplan–Meier con el
   modelo de Weibull y el rechazo tolerado (10 %) */
(async () => {
  await ejemplo('b3s');
  const t = tarjeta(L('Curvas de supervivencia', 'Survival curves'));
  irA(t, 120); await W(500);
  return caja([t.querySelector('h2'), porId('b3sTiles'), porId('b3sRead'), porId('b3sFig')], 8);
})()
