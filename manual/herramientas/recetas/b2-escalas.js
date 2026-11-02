// ventana 1400x1100
/* Capítulo 2: «Índices de la escala» con la antracnosis del mango de ejemplo (escala Daño 0–4, tolerancia 1):
   mosaicos, lectura y las dos figuras (sin la tabla) */
(async () => {
  await ejemplo('b2g');
  const t = porId('b2gOut');
  irA(t, 300); await W(600);
  const n = [t.querySelector('h2'), porId('b2gTiles'), porId('b2gRead'), figura('b2-escala')];
  const f2 = document.querySelector('.fig-box[data-fig="b2-indice"]');
  if (f2) n.push(f2);
  return caja(n, 12);
})()
