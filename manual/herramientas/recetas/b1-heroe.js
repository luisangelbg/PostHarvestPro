// ventana 1400x1000
/* Capítulo 1: el héroe de la portada (lema, botones, insignias e ilustración), con las marcas numeradas de la figura 1.1 */
(async () => {
  await W(2200);
  window.scrollTo(0, 0); await W(400);
  const h = document.querySelector('#panel-1 .hero');
  irA(h, 300); await W(500);
  const clip = caja([h], 6);
  const [cx, cy, cw, ch] = clip.split(',').map(Number);
  const m = (n, node, dx, dy) => { const r = node.getBoundingClientRect(); return [n, +((r.left + scrollX + (dx || 0) - cx) / cw * 100).toFixed(1), +((r.top + scrollY + r.height / 2 + (dy || 0) - cy) / ch * 100).toFixed(1)]; };
  const q = s => document.querySelector(s);
  window.__marcas = [
    m(1, q('#startBtn'), -4), m(2, q('#examplesBtn'), -4), m(3, q('#methodsBtn'), -4), m(4, q('#citeBtn'), -4),
    m(5, q('#panel-1 .badge-row'), -14), m(6, q('#heroArt'), 10, -q('#heroArt').getBoundingClientRect().height / 2 + 20),
  ];
  return clip;
})()
