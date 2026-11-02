// ventana 1400x900
/* Capítulo 6: las tarjetas «A–no A» y «Preferencia pareada» con sus valores de partida */
(async () => {
  await herramienta(6, 'discrim');
  const t1 = tarjeta(L('A–no A', 'A–not A')), t2 = tarjeta(L('Preferencia pareada', 'Paired preference'));
  irA(t1, 120); await W(500);
  return caja([t1, t2], 8);
})()
