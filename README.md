# PostHarvestPro

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Use it online](https://img.shields.io/badge/Use%20it%20online-luisangelbg.github.io%2FPostHarvestPro-EF6C00)](https://luisangelbg.github.io/PostHarvestPro/)

**Postharvest physiology and technology, quality, shelf life and sensory evaluation — in your browser.**
Part of the LABG Suite. Version 1.0.0: all nine blocks are complete.

A self-contained web platform (HTML + CSS + JavaScript, no installation, no server, no internet, no third-party
libraries) that follows the produce from harvest to the consumer: quality and colour, deterioration kinetics and
shelf life, respiration and modified atmospheres, losses along the chain, sensory evaluation, trials, packaging
and cold storage, and a report. Every computation runs in the browser; **your data never leave your computer**.
Interface in Spanish and English (Spanish by default), light and dark themes.

## How to use

- **Online:** <https://luisangelbg.github.io/PostHarvestPro/>
- **Offline:** download the repository and **double-click `index.html`**. The example data are built in, so
  everything works from `file://` without a server.
- **Local server (optional):** `Open PostHarvestPro.bat` (Windows) or
  `powershell -ExecutionPolicy Bypass -File server.ps1` → `http://localhost:9970`.
- **Manual (Spanish):** [`docs/manual.html`](docs/manual.html) (printable) and [`docs/manual.md`](docs/manual.md).

## The blocks

| Block | Content |
|---|---|
| 1 Home | Animated ripening/firmness illustration, workflow, block cards, gallery of the ten example datasets (each opens its tool with the data loaded), methods with sources, postharvest in brief, references, how to cite |
| 2 Quality and maturity | Quality summary by group and time (SSC/TA, BrimA, derived colour); sRGB ↔ CIELAB ↔ hex converter with swatch, ΔE\*ab/ΔE94/ΔE00, colour indices (CCI, browning, whiteness, yellowness, tomato) and the mean colour of the data; titratable acidity, moisture, firmness and weight-loss calculators; ripeness and damage scales (McKinney index, incidence, marketable fruit); size grades |
| 3 Kinetics and shelf life | Zero-, first- and second-order kinetics by nonlinear least squares with AIC and time to an acceptance limit (delta-method interval); Arrhenius, Q10 and square-root (Ratkowsky) temperature models and shelf life at any temperature; accelerated shelf-life tests with prediction interval; time to rejection with right censoring: Kaplan–Meier (Greenwood), log-rank, Weibull/log-normal/log-logistic/exponential models, percentiles and time ratios |
| 4 Respiration, ethylene and atmospheres | Static (closed jar, slope by least squares) and flow-through respiration, respiratory quotient, ethylene, heat of respiration; climacteric classification by an explicit rule; steady-state modified-atmosphere design (optional Michaelis–Menten respiration), thickness per film, O₂–CO₂ plane with β lines; half and seven-eighths cooling times and refrigeration load |
| 5 Losses and value chain | Losses by stage in quantity and value, loss index, Sankey diagram, Pareto critical points, what-if of improving a stage, send to EconomicsPro; mechanical damage curves (linear, quadratic, power, exponential), threshold, susceptibility and logistic dose with Fieller interval |
| 6 Sensory evaluation | Triangle, duo-trio, 2-AFC, 3-AFC and tetrad with Thurstonian d′, power and sample size; A–not A; paired preference; hedonic (ANOVA, Tukey, Friedman); just-about-right penalty analysis; CATA (Cochran's Q, McNemar, correspondence analysis); descriptive profile (panelist × product ANOVA, panel performance, spider chart, PCA product map, send to PCAPro); ballots with Williams orders and random three-digit codes |
| 7 Postharvest trials | Treatment × time factorial (types I and III) with Tukey–Kramer, LSD, Bonferroni and Dunnett within each time and compact letters; repeated measures (split plot in time, Greenhouse–Geisser, Huynh–Feldt, Mauchly); slope comparison; randomised field book compatible with AgriDesign |
| 8 Packaging and logistics | Boxes per pallet (one- and two-block patterns), pallets per container, box vent area, store psychrometrics (IAPWS saturation), vapour-pressure deficit and water loss, psychrometric chart, storage cost, product compatibility (temperature, humidity, ethylene, odours), unit conversion |
| 9 Report and project | Self-contained HTML report (cover, sections with SVG charts and tables, handling recommendations, methods, references, citation) printable to PDF; JSON project file that saves and restores everything |

All figures download as SVG or 300 ppi PNG and open in the suite's figure studio (PNG, SVG, PDF, TIFF up to 1200 ppi);
all result tables download as CSV or XLSX.

## Validation

**431 tests and 71,042 comparisons, 0 failures** against independent reference implementations, published tables and hand
calculations, each with an explicit tolerance. Run them in the browser with [`tests/run.html`](tests/run.html)
(double click works) or with `node tests/run-node.js`. The reference scripts, the reference values and one report per area
(what was compared, the tolerances and the errors the comparison caught) are in [`tests/validacion/`](tests/validacion/VALIDACION.md).

## Example data

Ten **simulated** datasets (`tools/generar_datos.R`, seed 20261004), built with models and parameters of the
order published for each crop — they are not measurements: «Ataulfo» mango at three temperatures, chayote with two
coatings (time to rejection and weight loss), coffee panel (descriptive, hedonic, just-about-right, CATA,
discrimination tests), losses along a saladette tomato chain and a drop test, and «Hass» avocado respiration
(static system and climacteric curve). CSV copies are in `data/`.

## Architecture

```
index.html            assembled by tools/armar_index.js (topbar + home + one shell per block + scripts)
css/                  labg-base.css (suite), style.css (identity and own components), suite modules
js/num.js             numerical core: distributions, studentized range, many-to-one, quadrature, linear algebra, lm, optimisers
js/color.js           colour science          js/quality.js     quality indices
js/kinetics.js        kinetics and shelf life js/survival.js    time to failure with censoring
js/resp.js            respiration, atmospheres, cooling
js/losses.js          value-chain losses, Sankey layout, mechanical damage
js/sensory.js         sensory evaluation      js/trials.js      trial analysis and field book
js/logistics.js       pallets, vents, psychrometrics, cost, compatibility
js/plot.js            SVG figure kit          js/art.js         logo and drawings
js/core.js            state, navigation, data entry, editable tables, figures, report registry
js/home.js, b2.js … b9.js   the nine blocks
js/datasets*.js, refs.js    example data, references and methods
js/sheets.js, zip.js  spreadsheet reader/writer written for the suite
js/labg-*.js          LABG Suite modules (common bar, navigator, figure studio, figure editor, effects)
tests/                harness, unit tests, run.html, run-node.js, validacion/ (reference scripts and values)
tools/                index, tests and manual builders, example-data generator, share image
docs/                 manual (Markdown and printable HTML) and screenshots
```

No build step is needed to use the app: `index.html`, `tests/run.html` and `docs/manual.html` are committed as
generated. After editing their sources, run `node tools/armar_index.js`, `node tools/armar_pruebas.js` or
`node tools/armar_manual.js`.

## How to cite

Barrera-Guzmán, L. Á. (2026). *PostHarvestPro: postharvest physiology and technology, quality, shelf life and
sensory evaluation in the browser* (Version 1.0.0) [Computer software]. https://luisangelbg.github.io/PostHarvestPro/

See [`CITATION.cff`](CITATION.cff).

## License

GPL-3.0-or-later (see [`LICENSE`](LICENSE)). Third-party pieces (the line icons of the suite modules, ISC/MIT) are
declared in [`LICENSES-TERCEROS.md`](LICENSES-TERCEROS.md).

Author: Luis Ángel Barrera-Guzmán · ORCID [0000-0001-8057-2583](https://orcid.org/0000-0001-8057-2583)
