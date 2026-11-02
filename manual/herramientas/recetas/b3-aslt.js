// ventana 1400x1000
/* Capítulo 3: Prueba acelerada con los valores que trae escritos (30, 35 y 40 °C, dos pruebas en cada una), modelo de
   Arrhenius y almacén a 20 °C: la tarjeta «Predicción» (mosaicos, lectura y figura) */
(async () => {
  await herramienta(3, 'aslt');
  const t = porId('b3aOut');
  irA(t, 120); await W(500);
  return caja([t], 8);
})()
