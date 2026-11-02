// ventana 1400x1000
/* Capítulo 1: «Los nueve bloques», las ocho tarjetas de los bloques 2 a 9 con su etiqueta y su dibujo */
(async () => {
  await W(2200);
  const s = seccion(L('Los nueve bloques', 'The nine blocks'));
  irA(s[0], 300); await W(600);
  return caja(s, 8);
})()
