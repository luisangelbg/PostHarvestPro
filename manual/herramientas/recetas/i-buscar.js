// ventana 1400x900
/* Introducción: la búsqueda del navegador (Ctrl K) con «vida» escrito */
(async () => {
  await W(1500);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', code: 'KeyK', ctrlKey: true, bubbles: true }));
  await W(700);
  const inp = document.activeElement && document.activeElement.tagName === 'INPUT' ? document.activeElement : vis('.lnav-pal input');
  inp.value = L('vida de anaquel', 'shelf life');
  inp.dispatchEvent(new Event('input', { bubbles: true }));
  await W(900);
  const pal = vis('.lnav-pal');
  return caja([[...pal.querySelectorAll('*')].find(n => n.getBoundingClientRect().width > 300 && n.getBoundingClientRect().width < 900) || pal], 6);
})()
