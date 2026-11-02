// ventana 1400x1000
/* Capítulo 5: mosaicos, lectura y diagrama de Sankey de la cadena del jitomate de ejemplo */
(async () => {
  await ejemplo('b5c');
  const t = tarjeta(L('Pérdidas en cantidad y valor', 'Losses in quantity and value'));
  irA(t, 120); await W(500);
  return caja([t.querySelector('h2'), porId('b5cTiles'), porId('b5cRead'), porId('b5cSankey')], 8);
})()
