/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.

   The example datasets: what each one is, in both languages, and helpers to
   turn the packed tables of js/datasets_data.js into rows (objects keyed by
   column). Every dataset is simulated (tools/generar_datos.R, seed 20261004)
   with models and parameters of the order published for each crop, and the
   app says so wherever it offers one. */
(function (g) {
'use strict';
const D = g.PH_DATA || {};
const INFO = {
  mango: {
    es: 'Mango «Ataulfo» almacenado a 13, 20 y 25 °C', en: '“Ataulfo” mango stored at 13, 20 and 25 °C',
    d: ['Muestreo destructivo de 4 frutos por temperatura y día: firmeza (N), color L*a*b*, sólidos solubles (°Brix), acidez titulable (% de ácido cítrico), pH, pérdida de peso (%) y antracnosis (escala 0–4). La firmeza baja con cinética de primer orden y su constante sigue a Arrhenius.',
      'Destructive sampling of 4 fruit per temperature and day: firmness (N), L*a*b* color, soluble solids (°Brix), titratable acidity (% citric acid), pH, weight loss (%) and anthracnose (0–4 scale). Firmness falls with first-order kinetics whose rate constant follows Arrhenius.'],
  },
  chayoteRechazo: {
    es: 'Chayote con dos recubrimientos: días hasta el rechazo', en: 'Chayote with two coatings: days to rejection',
    d: ['30 frutos por tratamiento (testigo, cera vegetal, quitosano) a 10 °C; el ensayo terminó a los 35 días, así que los frutos aún sanos ese día están censurados por la derecha (rechazado = 0).',
      '30 fruit per treatment (control, vegetable wax, chitosan) at 10 °C; the trial ended at day 35, so fruit still sound that day are right-censored (rechazado = 0).'],
  },
  chayotePeso: {
    es: 'Chayote con dos recubrimientos: pérdida de peso en los mismos frutos', en: 'Chayote with two coatings: weight loss of the same fruit',
    d: ['6 frutos marcados por tratamiento, pesados cada 5 días hasta el día 25: medidas repetidas.',
      '6 tagged fruit per treatment, weighed every 5 days up to day 25: repeated measures.'],
  },
  cafeQDA: {
    es: 'Café: perfil descriptivo cuantitativo', en: 'Coffee: quantitative descriptive profile',
    d: ['8 jueces evalúan 4 cafés en 2 sesiones, 7 atributos en escala de 0 a 10. El juez J6 se simuló con más ruido (repite mal) y el J8 casi sin diferencias entre cafés (discrimina poco); por azar, J4 también salió débil. El desempeño del panel señala a los tres.',
      '8 judges rate 4 coffees in 2 sessions, 7 attributes on a 0–10 scale. Judge J6 was simulated with more noise (repeats poorly) and J8 with hardly any differences between coffees (barely discriminates); by chance, J4 also came out weak. The panel performance flags all three.'],
  },
  cafeConsumidores: {
    es: 'Café: 80 consumidores (agrado, punto justo y CATA)', en: 'Coffee: 80 consumers (liking, just-about-right and CATA)',
    d: ['Agrado en escala hedónica de 9 puntos, punto justo (JAR, 1–5) de acidez, amargor y cuerpo, y 10 términos de «marque todo lo que aplique».',
      'Liking on the 9-point hedonic scale, just-about-right (1–5) for acidity, bitterness and body, and 10 check-all-that-apply terms.'],
  },
  cafeDiscriminativas: {
    es: 'Café: pruebas discriminativas', en: 'Coffee: discrimination tests',
    d: ['Triangular, dúo-trío y dos alternativas forzadas entre dos cafés: aciertos y total de jueces.',
      'Triangle, duo-trio and two-alternative forced choice between two coffees: correct answers and number of judges.'],
  },
  jitomateCadena: {
    es: 'Cadena de jitomate saladette: pérdidas por etapa', en: 'Saladette tomato chain: losses by stage',
    d: ['Seis etapas, de la cosecha a la venta al menudeo, con el porcentaje que se pierde de lo que entra a cada una y el precio por kilogramo en ella.',
      'Six stages, from harvest to retail, with the percentage lost of what enters each and the price per kilogram there.'],
  },
  jitomateCaidas: {
    es: 'Jitomate: ensayo de caídas (daño mecánico)', en: 'Tomato: drop test (mechanical damage)',
    d: ['10 frutos por altura (10 a 60 cm): masa, energía del impacto, área y volumen del daño, y si el fruto quedó dañado (0/1).',
      '10 fruit per height (10 to 60 cm): mass, impact energy, bruise area and volume, and whether the fruit was bruised (0/1).'],
  },
  aguacateEstatico: {
    es: 'Aguacate «Hass»: respiración en sistema estático', en: '“Hass” avocado: respiration in a static system',
    d: ['3 frascos de 3.8 L a 20 °C con lecturas de CO₂ (%), O₂ (%) y etileno (µL/L) cada 30 minutos.',
      '3 jars of 3.8 L at 20 °C with CO₂ (%), O₂ (%) and ethylene (µL/L) read every 30 minutes.'],
  },
  aguacateClimaterico: {
    es: 'Aguacate «Hass»: curva climatérica', en: '“Hass” avocado: climacteric curve',
    d: ['Respiración (mg CO₂ kg⁻¹ h⁻¹) y etileno (µL kg⁻¹ h⁻¹) diarios durante 12 días a 20 °C.',
      'Daily respiration (mg CO₂ kg⁻¹ h⁻¹) and ethylene (µL kg⁻¹ h⁻¹) over 12 days at 20 °C.'],
  },
};
const Datasets = {
  INFO,
  ids: () => Object.keys(INFO).filter(k => D[k]),
  /* rows as objects keyed by column */
  rows(id) {
    const d = D[id];
    if (!d) return [];
    return d.rows.map(r => { const o = {}; d.columns.forEach((c, i) => { o[c] = r[i]; }); return o; });
  },
  columns: id => (D[id] ? D[id].columns.slice() : []),
  file: id => (D[id] ? D[id].file + '.csv' : ''),
  /* the table as CSV text (comma, quotes where needed), for download */
  csv(id) {
    const d = D[id];
    if (!d) return '';
    const q = v => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return [d.columns.map(q).join(',')].concat(d.rows.map(r => r.map(q).join(','))).join('\n') + '\n';
  },
};
g.Datasets = Datasets;
})(typeof window !== 'undefined' ? window : globalThis);
