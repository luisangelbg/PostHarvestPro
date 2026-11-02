// ventana 1400x1000
/* Capítulo 1: «La poscosecha en breve», los nueve desplegables con el primero abierto */
(async () => {
  await W(2200);
  const s = seccion(L('La poscosecha en breve', 'Postharvest in brief'));
  irA(s[0], 300); await W(600);
  return caja(s, 8);
})()
