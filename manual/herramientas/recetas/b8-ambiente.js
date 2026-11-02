// ventana 1400x1000
/* Capítulo 8: Ambiente del almacén con los valores de partida (campos, mosaicos y lectura) */
(async () => {
  await herramienta(8, 'ambiente');
  const t = tarjeta(0);
  irA(t, 120); await W(500);
  return caja([t.querySelector('h2'), t.querySelector('.form-grid'), porId('b8aTiles'), porId('b8aRead')], 8);
})()
