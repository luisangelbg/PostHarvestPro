// ventana 1400x1000
/* Capítulo 8: la carta psicrométrica con la cámara (5 °C, 85 %) y el aire exterior (28 °C, 55 %) */
(async () => {
  await herramienta(8, 'ambiente');
  const f = figura('b8-psicrometrica');
  irA(f, 140); await W(500);
  return caja([f, porId('b8aCite')], 8);
})()
