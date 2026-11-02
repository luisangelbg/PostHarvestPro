// ventana 1400x1000
/* Capítulo 6: Desempeño del panel con el café: lectura y tabla por juez */
(async () => {
  await ejemplo('b6q');
  const t = tarjeta(L('Desempeño del panel', 'Panel performance'));
  irA(t, 120); await W(500);
  return caja([t.querySelector('h2'), porId('b6qPRead'), porId('b6qPTab'), porId('b6qAttr').closest('.form-grid')], 8);
})()
