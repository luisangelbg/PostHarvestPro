// ventana 1400x1000
/* Capítulo 9: la vista previa del informe después de «Generar el informe», con el mango de ejemplo (calidad y cinética) */
(async () => {
  for (const k of ['b2q', 'b3k']) await ejemplo(k);
  await herramienta(9);
  const set = (id, v) => { const n = porId(id); n.value = v; n.dispatchEvent(new Event('input', { bubbles: true })); };
  set('b9Title', L('Vida de anaquel del mango de ejemplo', 'Shelf life of the example mango'));
  set('b9Crop', L('Mango «Ataulfo» (datos simulados)', '“Ataulfo” mango (simulated data)'));
  set('b9Date', '2026-11-02');
  porId('b9Go').click(); await W(2500);
  const f = porId('b9Frame');
  const btns = porId('b9Go').parentElement;
  irA(btns, 300); await W(800);
  return caja([btns, f], 8);
})()
