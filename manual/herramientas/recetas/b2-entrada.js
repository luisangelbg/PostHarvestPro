// ventana 1400x1000
/* Capítulo 2: la entrada de datos común, en Bloque 2 › Resumen de calidad con el mango de ejemplo cargado,
   con las marcas numeradas de la figura 2.1 */
(async () => {
  await ejemplo('b2q');
  const t = tarjeta(L('Datos del ensayo', 'Trial data'));
  irA(t, 300); await W(500);
  const clip = caja([t], 6);
  const [cx, cy, cw, ch] = clip.split(',').map(Number);
  const m = (n, node, dx, dy) => { if (!node) throw new Error('falta la marca ' + n); const r = node.getBoundingClientRect(); return [n, +((r.left + scrollX + (dx || 0) - cx) / cw * 100).toFixed(1), +((r.top + scrollY + r.height / 2 + (dy || 0) - cy) / ch * 100).toFixed(1)]; };
  const q = s => t.querySelector(s);
  window.__marcas = [
    m(1, q('.ex-t'), -14, -8), m(2, q('[data-ex="0"]'), -12), m(3, q('[data-excsv]'), -12),
    m(4, q('label[for="b2qFile"]'), -12), m(5, q('[data-paste]'), -12), m(6, q('#b2qDrop'), -12),
    m(7, q('#b2qR_group'), -14, -18), m(8, q('#b2qR_vars'), -14, -22), m(9, q('#b2qPrevBox'), -14),
  ];
  return clip;
})()
