// ventana 1400x1000
/* Capítulo 9: «El informe» después de correr cinco ejemplos (calidad, cinética, respiración, cadena y hedónica del café),
   con el título «Vida de anaquel del mango de ejemplo» y el producto escrito */
(async () => {
  for (const k of ['b2q', 'b3k', 'b4s', 'b5c', 'b6h']) await ejemplo(k);
  await herramienta(9);
  const set = (id, v) => { const n = porId(id); n.value = v; n.dispatchEvent(new Event('input', { bubbles: true })); };
  set('b9Title', L('Vida de anaquel del mango de ejemplo', 'Shelf life of the example mango'));
  set('b9Author', L('Laboratorio de poscosecha', 'Postharvest laboratory'));
  set('b9Crop', L('Mango «Ataulfo» (datos simulados)', '«Ataulfo» mango (simulated data)'));
  set('b9Date', '2026-11-02');
  await listo();
  const t = tarjeta(L('El informe', 'The report'));
  irA(t, 300); await W(500);
  return caja([t], 6);
})()
