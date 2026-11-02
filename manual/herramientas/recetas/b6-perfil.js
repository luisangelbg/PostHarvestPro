// ventana 1400x1000
/* Capítulo 6: Perfil descriptivo con el panel del café: mosaicos, lectura, araña y mapa de productos */
(async () => {
  await ejemplo('b6q');
  const t = tarjeta(L('Perfil de los productos', 'Product profile'));
  irA(t, 120); await W(500);
  return caja([t.querySelector('h2'), porId('b6qTiles'), porId('b6qRead'), porId('b6qFig1').parentElement], 8);
})()
