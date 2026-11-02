// ventana 1400x1000
/* Capítulo 7: el factorial del mango con «Usar sólo los tiempos medidos en todos los tratamientos» desmarcada (días 0 a
   21; 20 y 25 °C sin los días 15, 18 y 21) y el tipo III: el aviso de las celdas vacías, los mosaicos y la tabla del
   análisis con el tratamiento y el tiempo «no estimable» */
(async () => {
  await ejemplo('b7f');
  const c = porId('b7fCommon'); c.checked = false; c.dispatchEvent(new Event('change', { bubbles: true })); await listo();
  const t = tarjeta(L('Análisis de varianza', 'Analysis of variance'));
  irA(t, 120); await W(500);
  return caja([t.querySelector('h2'), porId('b7fWarn'), porId('b7fTiles'), porId('b7fRead'), porId('b7fAnova')], 8);
})()
