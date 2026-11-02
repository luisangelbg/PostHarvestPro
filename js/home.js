/* PostHarvestPro — postharvest physiology and technology, quality, shelf life
   and sensory evaluation, in the browser.
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán

   This program is free software: you can redistribute it and/or modify it under
   the terms of the GNU General Public License as published by the Free Software
   Foundation, either version 3 of the License, or (at your option) any later
   version. It is distributed in the hope that it will be useful, but WITHOUT ANY
   WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
   A PARTICULAR PURPOSE. See the GNU General Public License, in the file LICENSE
   at the root of this program, or <https://www.gnu.org/licenses/>. */

/* PostHarvestPro — Block 1, the home page: the block bar, the route, the cards
   of the nine blocks, the example gallery, the methods with their sources,
   postharvest in brief, the references and how to cite. */
(function () {
'use strict';
const BLOCKS = [
  { n: 1, es: 'Inicio', en: 'Home', tag: ['Empezar', 'Start'], d: ['Qué hace la app, sus datos de ejemplo, sus métodos y la teoría en breve.', 'What the app does, its example data, its methods and the theory in brief.'] },
  { n: 2, es: 'Calidad y madurez', en: 'Quality and maturity', tag: ['Medir', 'Measure'], d: ['Sólidos solubles, acidez, SST/AT, pH, firmeza, pérdida de peso, humedad, color CIELAB con ΔE e índices, escalas de madurez y daño, y calibres.', 'Soluble solids, acidity, SSC/TA, pH, firmness, weight loss, moisture, CIELAB colour with ΔE and indices, ripeness and damage scales, and size grades.'] },
  { n: 3, es: 'Cinética y vida de anaquel', en: 'Kinetics and shelf life', tag: ['Predecir', 'Predict'], d: ['Órdenes cero, uno y dos con AIC; Arrhenius, Q10 y raíz cuadrada; vida de anaquel por límite y pruebas aceleradas; tiempo hasta el rechazo con Kaplan–Meier, Weibull y log-normal.', 'Zero, first and second order with AIC; Arrhenius, Q10 and square root; shelf life by limit and accelerated tests; time to rejection with Kaplan–Meier, Weibull and log-normal.'] },
  { n: 4, es: 'Respiración, etileno y atmósferas', en: 'Respiration, ethylene and atmospheres', tag: ['Controlar', 'Control'], d: ['Tasa de respiración y etileno en sistema estático y de flujo, climaterio, diseño de atmósfera modificada y preenfriamiento con su carga térmica.', 'Respiration rate and ethylene in static and flow systems, climacteric, modified-atmosphere design and precooling with its heat load.'] },
  { n: 5, es: 'Pérdidas y cadena de valor', en: 'Losses and value chain', tag: ['Cuantificar', 'Quantify'], d: ['Pérdidas por etapa en cantidad y valor, diagrama de Sankey, puntos críticos, simulación de mejoras y curvas de daño mecánico.', 'Losses by stage in quantity and value, Sankey diagram, critical points, improvement what-ifs and mechanical damage curves.'] },
  { n: 6, es: 'Evaluación sensorial', en: 'Sensory evaluation', tag: ['Evaluar', 'Evaluate'], d: ['Discriminativas con d′ y potencia, hedónica, punto justo con penalidades, CATA, perfil descriptivo con desempeño del panel, y fichas de cata con órdenes balanceados.', 'Discrimination tests with d′ and power, hedonic, just-about-right with penalties, CATA, descriptive profile with panel performance, and ballots with balanced orders.'] },
  { n: 7, es: 'Ensayos poscosecha', en: 'Postharvest trials', tag: ['Comparar', 'Compare'], d: ['Factorial tratamiento × tiempo, medidas repetidas con sus correcciones, Tukey, LSD y Dunnett, pendientes por tratamiento y la aleatorización del ensayo.', 'Treatment × time factorial, repeated measures with their corrections, Tukey, LSD and Dunnett, slopes by treatment and the randomisation of the trial.'] },
  { n: 8, es: 'Empaque y logística', en: 'Packaging and logistics', tag: ['Planear', 'Plan'], d: ['Carga por tarima y contenedor, ventilación de cajas, psicrometría y déficit de presión de vapor, costo de almacenamiento y compatibilidad de productos.', 'Pallet and container loads, box venting, psychrometrics and vapour-pressure deficit, storage cost and product compatibility.'] },
  { n: 9, es: 'Informe y proyecto', en: 'Report and project', tag: ['Publicar', 'Publish'], d: ['Informe HTML autocontenido con gráficas, tablas, interpretación y recomendaciones; proyecto JSON reimportable y cita.', 'Self-contained HTML report with charts, tables, interpretation and recommendations; re-importable JSON project and citation.'] },
];
const WORKFLOW = [
  ['Medir', 'Measure', 'calidad, color y daño', 'quality, colour and damage', '--s3'],
  ['Modelar', 'Model', 'el deterioro y la temperatura', 'deterioration and temperature', '--s1'],
  ['Respirar', 'Breathe', 'respiración y atmósfera', 'respiration and atmosphere', '--s2'],
  ['Cuantificar', 'Quantify', 'pérdidas en la cadena', 'losses along the chain', '--s7'],
  ['Evaluar', 'Evaluate', 'con jueces y consumidores', 'with judges and consumers', '--s4'],
  ['Comparar', 'Compare', 'tratamientos en el tiempo', 'treatments over time', '--s6'],
  ['Publicar', 'Publish', 'informe y proyecto', 'report and project', '--s5'],
];
/* where each example opens: [block, tool, loader id] */
const EXAMPLES = [
  ['mango', [[2, 'calidad', 'b2q', 'Resumen de calidad', 'Quality summary'], [3, 'cinetica', 'b3k', 'Cinética', 'Kinetics'], [7, 'factorial', 'b7f', 'Factorial', 'Factorial']]],
  ['chayoteRechazo', [[3, 'rechazo', 'b3s', 'Tiempo hasta rechazo', 'Time to rejection']]],
  ['chayotePeso', [[7, 'repetidas', 'b7r', 'Medidas repetidas', 'Repeated measures'], [7, 'pendientes', 'b7p', 'Pendientes', 'Slopes']]],
  ['aguacateEstatico', [[4, 'estatico', 'b4s', 'Sistema estático', 'Static system']]],
  ['aguacateClimaterico', [[4, 'climaterio', 'b4c', 'Climaterio', 'Climacteric']]],
  ['jitomateCadena', [[5, 'cadena', 'b5c', 'Pérdidas por etapa', 'Losses by stage']]],
  ['jitomateCaidas', [[5, 'dano', 'b5d', 'Daño mecánico', 'Mechanical damage']]],
  ['cafeDiscriminativas', [[6, 'discrim', 'b6d', 'Discriminativas', 'Discrimination']]],
  ['cafeConsumidores', [[6, 'hedonica', 'b6h', 'Hedónica', 'Hedonic'], [6, 'jar', 'b6j', 'Punto justo', 'JAR'], [6, 'cata', 'b6c', 'CATA', 'CATA']]],
  ['cafeQDA', [[6, 'qda', 'b6q', 'Perfil descriptivo', 'Descriptive profile']]],
];
/* open a tool and load its example: the block registers the loader (window.PHLoad[id]) */
function openExample(block, tab, loader) {
  if (window.Tabs) Tabs.go(block, tab);
  setTimeout(() => {
    const f = window.PHLoad && window.PHLoad[loader];
    if (f) f();
    const pane = el('b' + block + '-' + tab);
    if (pane) pane.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 60);
}
window.PHLoad = window.PHLoad || {};

const THEORY = [
  { h: ['Madurez fisiológica y madurez de consumo', 'Physiological and eating maturity'], tag: ['Bloque 2', 'Block 2'],
    es: '<p>Un fruto alcanza la <b>madurez fisiológica</b> cuando puede terminar su desarrollo aunque se separe de la planta; la <b>madurez de consumo</b> llega después, cuando el sabor, el aroma, la textura y el color son los que el consumidor busca. Entre una y otra cambian juntos varios índices: suben los <b>sólidos solubles</b> (°Brix) y baja la <b>acidez titulable</b>, por eso la relación SST/AT resume bien el sabor; el ablandamiento se sigue con la <b>firmeza</b> y el cambio de color con el ángulo de tono <b>h°</b>, que pasa de verde (más de 100°) a amarillo (cerca de 90°), naranja y rojo.</p><p>El color se mide en CIELAB porque sus distancias se acercan a lo que percibe el ojo: una <b>ΔE</b> menor que 1 no se nota, entre 2 y 3.5 la nota cualquiera. Reportar C* y h° en lugar de a* y b* sueltos evita confundir cuadrantes (McGuire 1992).</p>',
    en: '<p>A fruit reaches <b>physiological maturity</b> when it can complete its development off the plant; <b>eating maturity</b> comes later, when flavour, aroma, texture and colour are what the consumer wants. In between, several indices change together: <b>soluble solids</b> (°Brix) rise and <b>titratable acidity</b> falls, which is why the SSC/TA ratio summarises taste well; softening is followed with <b>firmness</b> and the colour change with the hue angle <b>h°</b>, which moves from green (above 100°) to yellow (around 90°), orange and red.</p><p>Colour is measured in CIELAB because its distances approach what the eye perceives: a <b>ΔE</b> below 1 is invisible, between 2 and 3.5 anyone notices it. Reporting C* and h° instead of loose a* and b* avoids mixing quadrants up (McGuire 1992).</p>' },
  { h: ['Climatéricos y no climatéricos', 'Climacteric and non-climacteric'], tag: ['Bloque 4', 'Block 4'],
    es: '<p>Los frutos <b>climatéricos</b> (aguacate, mango, papaya, plátano, jitomate, manzana) tienen un pico de respiración al madurar, acompañado de una producción autocatalítica de <b>etileno</b>: el etileno induce más etileno y la maduración sigue aun fuera de la planta. Los <b>no climatéricos</b> (cítricos, uva, fresa, piña, chile) no tienen ese pico y casi no cambian su calidad de consumo después de cosechados. Por eso a los primeros se les puede cosechar verdes maduros y madurar en destino, y a los segundos no.</p><p>La respiración consume reservas y libera calor: unos 10.7 J por miligramo de CO₂. A 20 °C un aguacate preclimatérico respira unos 60 mg CO₂ kg⁻¹ h⁻¹, y en el pico más del doble.</p>',
    en: '<p><b>Climacteric</b> fruit (avocado, mango, papaya, banana, tomato, apple) show a respiration peak as they ripen, together with an autocatalytic production of <b>ethylene</b>: ethylene induces more ethylene and ripening goes on off the plant. <b>Non-climacteric</b> fruit (citrus, grape, strawberry, pineapple, pepper) have no such peak and barely change their eating quality after harvest. The former can be picked mature green and ripened at destination; the latter cannot.</p><p>Respiration burns reserves and releases heat: about 10.7 J per milligram of CO₂. At 20 °C a preclimacteric avocado respires some 60 mg CO₂ kg⁻¹ h⁻¹, and at the peak more than twice that.</p>' },
  { h: ['Cinética del deterioro', 'Deterioration kinetics'], tag: ['Bloque 3', 'Block 3'],
    es: '<p>Casi todo atributo de calidad cambia con una velocidad que depende de su propio valor: <b>orden cero</b> (pierde lo mismo cada día: C = C₀ − kt), <b>primer orden</b> (pierde la misma fracción cada día: C = C₀e⁻ᵏᵗ, con vida media ln 2/k) o <b>segundo orden</b> (1/C = 1/C₀ + kt). La firmeza, la vitamina C y muchos pigmentos siguen casi siempre el primer orden. El orden no se elige por el R² de una recta linealizada, que cambia la escala del error, sino ajustando cada curva en la escala original y comparando el <b>AIC</b> (Labuza 1984; van Boekel 2008).</p>',
    en: '<p>Almost every quality attribute changes at a rate that depends on its own value: <b>zero order</b> (it loses the same amount each day: C = C₀ − kt), <b>first order</b> (the same fraction each day: C = C₀e⁻ᵏᵗ, half-life ln 2/k) or <b>second order</b> (1/C = 1/C₀ + kt). Firmness, vitamin C and many pigments usually follow first order. The order is not chosen by the R² of a linearised line, which changes the scale of the error, but by fitting each curve on the original scale and comparing the <b>AIC</b> (Labuza 1984; van Boekel 2008).</p>' },
  { h: ['La temperatura manda: Arrhenius y Q10', 'Temperature rules: Arrhenius and Q10'], tag: ['Bloque 3', 'Block 3'],
    es: '<p>La constante de velocidad crece con la temperatura según <b>Arrhenius</b>: ln k = ln A − Eₐ/(RT). Con la energía de activación Eₐ se predice k, y con ella la vida de anaquel, a cualquier temperatura del intervalo medido. El <b>Q10</b> dice cuántas veces se acelera el deterioro con 10 °C más; no es una constante: para la misma Eₐ, el Q10 es mayor a temperaturas bajas. Para productos que se enfrían cerca de su mínimo de crecimiento biológico, el modelo de <b>raíz cuadrada</b> (Ratkowsky et al. 1982) suele ajustar mejor.</p><p>Las <b>pruebas aceleradas</b> miden a temperaturas altas para predecir la vida a la temperatura de almacén; la predicción es tan buena como el supuesto de que el mecanismo no cambia con la temperatura (Mizrahi 2004).</p>',
    en: '<p>The rate constant grows with temperature following <b>Arrhenius</b>: ln k = ln A − Eₐ/(RT). With the activation energy Eₐ, k — and with it the shelf life — is predicted at any temperature of the measured range. <b>Q10</b> says how many times deterioration speeds up with 10 °C more; it is not a constant: for the same Eₐ, Q10 is larger at low temperatures. For produce cooled near its minimum biological growth temperature, the <b>square-root</b> model (Ratkowsky et al. 1982) often fits better.</p><p><b>Accelerated tests</b> measure at high temperatures to predict the life at the storage temperature; the prediction is as good as the assumption that the mechanism does not change with temperature (Mizrahi 2004).</p>' },
  { h: ['Vida de anaquel y tiempo hasta el rechazo', 'Shelf life and time to rejection'], tag: ['Bloque 3', 'Block 3'],
    es: '<p>La vida de anaquel puede definirse por un <b>límite de atributo</b> (la firmeza mínima aceptable, la pérdida de peso máxima) y entonces es el tiempo en que el modelo cinético cruza ese límite, con su intervalo de confianza. O puede definirse por el <b>rechazo</b> de cada fruto (deshidratado, brotado, podrido): es un tiempo hasta un evento, y los frutos aún sanos al terminar el ensayo están <b>censurados</b>, no se descartan. Kaplan–Meier estima la fracción aún aceptable en cada día; los modelos Weibull o log-normal dan la mediana y cualquier percentil con intervalo (Hough et al. 2003).</p>',
    en: '<p>Shelf life can be defined by an <b>attribute limit</b> (the minimum acceptable firmness, the maximum weight loss), and it is then the time at which the kinetic model crosses that limit, with its confidence interval. Or it can be defined by the <b>rejection</b> of each fruit (shrivelled, sprouted, rotten): it is a time to an event, and the fruit still sound when the trial ends are <b>censored</b>, not discarded. Kaplan–Meier estimates the fraction still acceptable each day; Weibull or log-normal models give the median and any percentile with an interval (Hough et al. 2003).</p>' },
  { h: ['Atmósferas modificadas', 'Modified atmospheres'], tag: ['Bloque 4', 'Block 4'],
    es: '<p>En un empaque cerrado, el producto consume O₂ y libera CO₂, y la película deja pasar ambos gases. Cuando lo que respira el producto iguala lo que permea la película, la atmósfera interna se estabiliza: ese <b>estado estacionario</b> depende de la masa, la tasa de respiración, el área, el espesor y la permeabilidad (Exama et al. 1993; Fishman et al. 1996). La relación <b>β = P_CO₂/P_O₂</b> de la película fija la recta de atmósferas posibles; si la ventana recomendada del producto no toca esa recta, ningún espesor la alcanza. Por debajo de 1 a 2 % de O₂ la respiración se vuelve anaerobia y aparecen sabores extraños.</p>',
    en: '<p>In a sealed package the produce consumes O₂ and releases CO₂, and the film lets both gases through. When what the produce respires equals what permeates the film, the inner atmosphere stabilises: this <b>steady state</b> depends on the mass, the respiration rate, the area, the thickness and the permeability (Exama et al. 1993; Fishman et al. 1996). The film\'s ratio <b>β = P_CO₂/P_O₂</b> fixes the line of possible atmospheres; if the recommended window of the product does not touch that line, no thickness reaches it. Below 1 to 2 % O₂ respiration turns anaerobic and off-flavours appear.</p>' },
  { h: ['El agua: transpiración y déficit de presión de vapor', 'Water: transpiration and vapour-pressure deficit'], tag: ['Bloque 8', 'Block 8'],
    es: '<p>Un fruto pierde agua en proporción al <b>déficit de presión de vapor</b> entre su superficie (saturada a su propia temperatura) y el aire del almacén. Por eso enfriar rápido y mantener una humedad relativa alta frena la deshidratación: a 0 °C y 90 % de HR el déficit es una décima parte del de 25 °C y 60 %. Una pérdida de 3 a 10 % de peso ya marchita la mayoría de las hortalizas y frutos (Kader 2002).</p>',
    en: '<p>A fruit loses water in proportion to the <b>vapour-pressure deficit</b> between its surface (saturated at its own temperature) and the store air. That is why fast cooling and high relative humidity slow down shrivelling: at 0 °C and 90 % RH the deficit is a tenth of that at 25 °C and 60 %. A loss of 3 to 10 % of the weight already wilts most vegetables and fruit (Kader 2002).</p>' },
  { h: ['Pérdidas en la cadena', 'Losses along the chain'], tag: ['Bloque 5', 'Block 5'],
    es: '<p>Lo que se pierde en una etapa ya no llega a la siguiente: las pérdidas se calculan sobre lo que <b>entra</b> a cada etapa y se acumulan. En cantidad, las primeras etapas suelen pesar más; en <b>valor</b>, las últimas, porque ahí cada kilo ya cargó con la cosecha, el empaque, el flete y el margen. Por eso la mejor inversión no siempre está donde más kilos se pierden: la simulación compara cuánto llega al mercado y cuánto vale reducir la pérdida de cada etapa (FAO 2019).</p>',
    en: '<p>What is lost at one stage never reaches the next: losses are computed on what <b>enters</b> each stage and they accumulate. In quantity the first stages usually weigh most; in <b>value</b> the last ones, because by then each kilogram has already carried harvest, packing, freight and margin. So the best investment is not always where most kilograms are lost: the what-if compares how much reaches the market and what reducing each stage\'s loss is worth (FAO 2019).</p>' },
  { h: ['Medir con personas', 'Measuring with people'], tag: ['Bloque 6', 'Block 6'],
    es: '<p>Las pruebas <b>discriminativas</b> (triangular, dúo-trío, 2-AFC, 3-AFC, tétrada) responden si hay diferencia; el <b>d′ de Thurstone</b> mide su tamaño en una escala común a todos los métodos, así que permite compararlos y planear el número de jueces. Las <b>afectivas</b> (hedónica de 9 puntos, punto justo, preferencia) preguntan cuánto gusta, a consumidores. Las <b>descriptivas</b> usan un panel entrenado que califica cada atributo; antes de interpretar el perfil conviene revisar el <b>desempeño del panel</b>: que cada juez discrimine, repita y coincida con los demás. Presentar las muestras en órdenes de <b>Williams</b> con códigos de tres dígitos al azar evita que el orden y el arrastre sesguen el resultado.</p>',
    en: '<p><b>Discrimination</b> tests (triangle, duo-trio, 2-AFC, 3-AFC, tetrad) answer whether there is a difference; <b>Thurstonian d′</b> measures its size on a scale common to every method, so methods can be compared and the number of judges planned. <b>Affective</b> tests (9-point hedonic, just-about-right, preference) ask consumers how much they like. <b>Descriptive</b> tests use a trained panel that rates each attribute; before reading the profile, check the <b>panel performance</b>: that each judge discriminates, repeats and agrees with the others. Serving samples in <b>Williams</b> orders with random three-digit codes keeps order and carry-over from biasing the result.</p>' },
];

function buildStepper() {
  const nav = el('stepper');
  if (!nav) return;
  nav.innerHTML = STEPS.map(s => `<button type="button" class="step-btn${s.n === 1 ? ' active' : ''}" data-step="${s.n}"><span class="step-num">${s.n}</span>${L2(s.es, s.en)}</button>`).join('');
  nav.addEventListener('click', e => { const b = e.target.closest('.step-btn'); if (b && !b.disabled) goStep(b.dataset.step); });
}
function buildWorkflow() {
  const host = el('workflow');
  if (host) host.innerHTML = WORKFLOW.map((w, i) => `<div class="wf-step" style="--wf:var(${w[4]})"><div class="wf-n">${L2('PASO ' + (i + 1), 'STEP ' + (i + 1))}</div><div class="wf-t">${L2(w[0], w[1])}</div><div class="wf-d">${L2(w[2], w[3])}</div></div>`).join('');
}
function buildBlocks() {
  const host = el('blockGrid');
  if (!host) return;
  host.innerHTML = BLOCKS.filter(b => b.n > 1).map(b => `<button type="button" class="feature" data-go="${b.n}"><span class="f-num">${b.n}</span><div class="f-art" data-card="${b.n}"></div>` +
    `<span class="f-tag">${L2(b.tag[0], b.tag[1])}</span><h3>${L2(b.es, b.en)}</h3><p>${L2(b.d[0], b.d[1])}</p></button>`).join('');
  host.addEventListener('click', e => { const b = e.target.closest('.feature'); if (b) goStep(b.dataset.go); });
}
function buildExamples() {
  const host = el('exampleGrid');
  if (!host) return;
  host.innerHTML = EXAMPLES.map(([id, opens]) => {
    const I = Datasets.INFO[id];
    return `<div class="ex-card"><div class="ex-h">${L2(I.es, I.en)} <span class="ex-sim">${L2('simulado', 'simulated')}</span></div><p>${L2(I.d[0], I.d[1])}</p><div class="ex-f">data/${esc(Datasets.file(id))} · ${Datasets.rows(id).length} ${L2('filas', 'rows')}</div>` +
      `<div class="btn-row">${opens.map(o => `<button type="button" class="btn btn-secondary btn-sm" data-open="${o[0]}|${o[1]}|${o[2]}">${L2('Abrir en ', 'Open in ')}${o[0]} · ${L2(o[3], o[4])}</button>`).join('')}<button type="button" class="btn btn-ghost btn-sm" data-csv="${id}">⤓ CSV</button></div></div>`;
  }).join('');
  host.addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.open) { const [n, tab, ld] = b.dataset.open.split('|'); openExample(+n, tab, ld); }
    else if (b.dataset.csv) download('﻿' + Datasets.csv(b.dataset.csv), Datasets.file(b.dataset.csv), 'text/csv;charset=utf-8');
  });
}
function buildMethods() {
  const host = el('methodGallery');
  if (!host) return;
  host.innerHTML = Refs.METHODS.map(m => `<div class="method-card"><div class="m-name">${L2(m[1], m[2])}</div><div class="m-sub">${L2('Bloque ', 'Block ')}${m[0]} · ${m[3].map(k => esc(Refs.short(k))).join('; ')}</div></div>`).join('');
}
function buildTheory() {
  const host = el('theoryHost');
  if (host) host.innerHTML = THEORY.map((t, i) => `<details class="acc"${i === 0 ? ' open' : ''}><summary>${L2(t.h[0], t.h[1])}<span class="acc-tag">${L2(t.tag[0], t.tag[1])}</span></summary><div class="acc-body">${L2(t.es, t.en)}</div></details>`).join('');
}
function buildRefs() {
  const host = el('refList');
  if (!host) return;
  const keys = Object.keys(Refs.REFS).sort((a, b) => Refs.REFS[a].localeCompare(Refs.REFS[b], 'es'));
  host.innerHTML = keys.map(k => `<li>${esc(Refs.REFS[k])}</li>`).join('');
  el('refsSummary').innerHTML = L2(`Ver las ${keys.length} referencias`, `See the ${keys.length} references`);
}
const CITE = {
  apa: 'Barrera-Guzmán, L. Á. (2026). PostHarvestPro: fisiología y tecnología poscosecha, calidad, vida de anaquel y evaluación sensorial en el navegador (versión 1.0.0) [Programa de cómputo]. https://luisangelbg.github.io/PostHarvestPro/',
  apaEn: 'Barrera-Guzmán, L. Á. (2026). PostHarvestPro: postharvest physiology and technology, quality, shelf life and sensory evaluation in the browser (Version 1.0.0) [Computer software]. https://luisangelbg.github.io/PostHarvestPro/',
  bib: '@software{barreraguzman2026postharvestpro,\n  author  = {Barrera-Guzmán, Luis Ángel},\n  title   = {PostHarvestPro: postharvest physiology and technology, quality, shelf life and sensory evaluation in the browser},\n  version = {1.0.0},\n  year    = {2026},\n  license = {GPL-3.0-or-later},\n  url     = {https://luisangelbg.github.io/PostHarvestPro/}\n}',
};
window.CITE = CITE;
function buildCite() {
  const a = el('citeApa'), b = el('citeBib');
  const paint = () => { if (a) a.textContent = T(CITE.apa, CITE.apaEn); };
  paint();
  document.addEventListener('langchange', paint);
  if (b) b.textContent = CITE.bib;
  const copy = (btn, text) => btn && btn.addEventListener('click', () => {
    const done = () => { if (window.LABG) LABG.toast(T('Copiado', 'Copied')); };
    if (navigator.clipboard) navigator.clipboard.writeText(text()).then(done, () => {}); else done();
  });
  copy(el('copyApa'), () => T(CITE.apa, CITE.apaEn));
  copy(el('copyBib'), () => CITE.bib);
}
function paintArt() {
  Art.Hero.mount(el('heroArt'));
  els('[data-card]').forEach(d => { const fn = Art.cards[d.dataset.card]; if (fn) d.innerHTML = fn(); });
}

document.addEventListener('DOMContentLoaded', () => {
  const bl = el('brandLogo');
  if (bl) bl.innerHTML = Art.logo(30);
  const brand = el('brand');
  if (brand) { brand.style.cursor = 'pointer'; brand.addEventListener('click', () => goStep(1)); }
  buildStepper();
  buildWorkflow();
  buildBlocks();
  buildExamples();
  buildMethods();
  buildTheory();
  buildRefs();
  buildCite();
  paintArt();
  const go = (id, f) => { const b = el(id); if (b) b.addEventListener('click', f); };
  const scrollTo = id => { const t = el(id); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  go('startBtn', () => openExample(2, 'calidad', 'b2q'));
  go('examplesBtn', () => scrollTo('examples'));
  go('methodsBtn', () => scrollTo('methods'));
  go('citeBtn', () => scrollTo('cite'));
});
document.addEventListener('langchange', () => { paintArt(); buildMethods(); });

window.Home = { BLOCKS, EXAMPLES, THEORY, openExample };
})();
