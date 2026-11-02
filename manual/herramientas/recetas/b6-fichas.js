// ventana 1400x1100
/* Capítulo 6: Fichas de cata con los valores de partida, después de «Generar el plan»: el diseño de la sesión, la
   lectura y las cinco primeras filas del plan (el recorte corta la tabla después del juez 5) */
(async () => {
  await herramienta(6, 'fichas');
  porId('b6bGo').click(); await listo();
  const t1 = tarjeta(L('Diseño de la sesión', 'Session design'));
  const filas = porId('b6bTab').querySelectorAll('tbody tr');
  irA(t1, 120); await W(500);
  return caja([t1, porId('b6bOut').querySelector('h2'), porId('b6bRead'), filas[4]], 8);
})()
