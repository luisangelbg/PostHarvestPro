/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
   Block 2 corrections that can be checked without the page: the colour indices
   of the converter with their sources (js/color.js, js/refs.js), the reading of a
   colour difference in a sentence, the range of the weighted index of a scale
   that does not start at 0 and the size grades when no fruit falls in a class
   (js/quality.js). Every expected value is written out by hand. */
(function () {
'use strict';

TEST('color', 'Whiteness, yellowness and tomato colour index written out for L* 62, a* 8, b* 48', a => {
  const I = Color.indices(62, 8, 48);
  /* WI = 100 − √(38² + 8² + 48²) = 100 − √3812 */
  a.close(I.whiteness, 100 - Math.sqrt(3812), 1e-12, 'WI');
  /* YI = 142.86 · 48 / 62 */
  a.close(I.yellowness, 142.86 * 48 / 62, 1e-12, 'YI');
  /* TCI = 2000 · 8 / (62 · √(8² + 48²)) = 16000 / (62 · √2368) */
  a.close(I.tci, 16000 / (62 * Math.sqrt(2368)), 1e-12, 'TCI');
});

TEST('color', 'The reading of ΔE00 fits the sentence «the difference is …» at every level', a => {
  [0.5, 1.5, 3, 4, 7].forEach(d => {
    const R = Color.dEReading(d);
    a.ok(typeof R.isEs === 'string' && R.isEs.length > 0 && typeof R.isEn === 'string' && R.isEn.length > 0, 'phrase at ' + d);
    a.ok(!/^(se |diferencia )/.test(R.isEs), 'no «es se …» nor «es diferencia …» at ' + d);
  });
  a.eq(Color.dEReading(4).isEs, 'clara', 'clear');
  a.eq(Color.dEReading(7).isEn, 'so large that they are seen as different colors', 'different colours');
});

TEST('refs', 'Every source named in the catalogue of methods is in the reference list', a => {
  Refs.METHODS.forEach(m => m[3].forEach(k => a.ok(!!Refs.REFS[k], 'block ' + m[0] + ': ' + k)));
});

TEST('refs', 'Whiteness, yellowness and the tomato index carry their sources (Judd and Wyszecki 1975, Francis and Clydesdale 1975, Hobson et al. 1983)', a => {
  const row = Refs.METHODS.find(m => m[0] === 2 && /blancura/.test(m[1]));
  a.ok(!!row, 'colour indices row');
  ['judd1975', 'francis1975', 'hobson1983'].forEach(k => a.ok(row && row[3].includes(k), k + ' in the row'));
  a.eq(Refs.short('judd1975'), 'Judd y Wyszecki 1975', 'short citation WI');
  a.eq(Refs.short('francis1975'), 'Francis y Clydesdale 1975', 'short citation YI');
  a.eq(Refs.short('hobson1983'), 'Hobson et al. 1983', 'short citation TCI');
});

TEST('quality', 'Weighted index of a 1–5 scale: everything in class 1 gives 20, not 0; everything in class 5 gives 100', a => {
  const cl = [1, 2, 3, 4, 5].map(v => ({ value: v }));
  a.close(Quality.scaleIndex(cl, [10, 0, 0, 0, 0], 2).index, 20, 1e-12, 'all in class 1');
  a.close(Quality.scaleIndex(cl, [0, 0, 0, 0, 10], 2).index, 100, 1e-12, 'all in class 5');
  a.ok(!isFinite(Quality.scaleIndex(cl, [0, 0, 0, 0, 0], 2).index), 'a lot with no grade has no index');
});

TEST('quality', 'Size grades: when every fruit falls outside the classes there is no most frequent grade', a => {
  const cls = [{ name: '< 57 mm', min: 0, max: 57 }, { name: '57–67 mm', min: 57, max: 67 }];
  const r = Quality.calibre([250, 310, 280], cls);
  a.eq(r.out, 3, 'all outside');
  a.eq(r.mode, null, 'no mode');
  a.eq(Quality.calibre([50, 60, 61], cls).mode, '57–67 mm', 'mode when there are fruit inside');
});
})();
