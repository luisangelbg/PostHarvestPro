# PostHarvestPro

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.XXXXXXX.svg)](https://doi.org/10.5281/zenodo.XXXXXXX)

**From the field to the consumer: quality, shelf life and sensory evaluation with data** · *Español: [LEEME.md](LEEME.md)*

Postharvest physiology and technology in the browser, without writing code.
PostHarvestPro follows the produce from harvest to the consumer: quality,
maturity and CIELAB colour; deterioration kinetics, the effect of temperature
and shelf life, including the time to rejection of each fruit with censoring;
respiration, ethylene, modified atmospheres and precooling; losses along the
value chain and mechanical damage; discrimination, affective and descriptive
sensory evaluation; factorial and repeated-measures postharvest trials;
packaging and cold-storage calculators; and a report with the methods. It is
meant for theses, postharvest laboratories, packhouses and teaching. The
interface is in Spanish and English, with light and dark themes. There is
nothing to install, and everything is computed on your own computer: your data
never leave it.

## Statement of need

A postharvest study usually spreads over several programs: a spreadsheet for
the quality indices and the colour, a statistics package for the kinetic fits
and the survival curves, a sensory package for the discrimination tests and
the panel, hand calculations for the modified atmosphere, the refrigeration
load or the pallet, and a word processor for the report. Every transfer is a
chance for error, and the methods (Arrhenius, Q10, Kaplan–Meier with censoring,
Thurstonian d′, penalty analysis) are rarely written out next to the numbers.
PostHarvestPro puts the whole chain in one page that opens with a double
click; every result names its method and its source, and every engine was
compared against independent implementations.

## Open it

- **On line:** https://luisangelbg.github.io/PostHarvestPro/
- **On your computer:** download the repository and double-click
  `index.html`. No server, no installation, no build step and no internet
  connection; the ten examples are built in and work offline. Any current
  browser works.

To open it from another device on the same network, run
`Open PostHarvestPro.bat` (Windows; it starts `server.ps1`, a minimal local
server on port 9970, at `http://localhost:9970`).

## The nine blocks

1. **Home** — an animated illustration of ripening and firmness at three
   temperatures, the workflow, a gallery of the ten example sets (each one
   opens its tool with the data loaded), the methods with their sources,
   postharvest in brief, what the app does not do, the references and how to
   cite.
2. **Quality and maturity** — quality summary by group and time (SSC/TA,
   BrimA, derived colour); sRGB ↔ CIELAB ↔ hexadecimal converter with swatch,
   ΔE\*ab, ΔE94 and ΔE00, colour indices (citrus colour index, browning, whiteness,
   yellowness, tomato colour index) and the mean colour of the data;
   titratable acidity, moisture, firmness and weight-loss calculators;
   ripeness and damage scales (McKinney index, incidence, marketable fruit);
   size grades.
3. **Kinetics and shelf life** — zero-, first- and second-order kinetics by
   nonlinear least squares with AIC and the time to an acceptance limit
   (delta-method interval); Arrhenius, Q10 and square-root (Ratkowsky)
   temperature models and the shelf life at any temperature; accelerated
   shelf-life tests with a prediction interval; time to rejection with right
   censoring: Kaplan–Meier (Greenwood), log-rank, Weibull, log-normal,
   log-logistic and exponential models, percentiles and time ratios.
4. **Respiration, ethylene and atmospheres** — static (closed jar) and
   flow-through respiration, respiratory quotient, ethylene and heat of
   respiration; climacteric classification by an explicit rule;
   steady-state modified-atmosphere design (with optional Michaelis–Menten
   respiration), thickness per film and the O₂–CO₂ plane; half and
   seven-eighths cooling times and the refrigeration load.
5. **Losses and value chain** — losses by stage in quantity and value, loss
   index, Sankey diagram, Pareto critical points, what-if of improving a
   stage, sending to EconomicsPro; mechanical damage curves (linear,
   quadratic, power, exponential), threshold, susceptibility and logistic dose
   with Fieller's interval.
6. **Sensory evaluation** — triangle, duo-trio, 2-AFC, 3-AFC and tetrad with
   Thurstonian d′, power and sample size; A–not A; paired preference; hedonic
   (analysis of variance, Tukey, Friedman); just-about-right penalty analysis;
   CATA (Cochran's Q, McNemar, correspondence analysis); descriptive profile
   (panelist × product analysis of variance, panel performance, spider chart,
   principal-component product map, sending to PCAPro); ballots with Williams
   serving orders and random three-digit codes.
7. **Postharvest trials** — treatment × time factorial (types I and III) with
   Tukey–Kramer, LSD, Bonferroni and Dunnett within each time and compact
   letters; repeated measures (split plot in time, Greenhouse–Geisser,
   Huynh–Feldt, Mauchly); comparison of slopes; randomised field book
   compatible with AgriDesign.
8. **Packaging and logistics** — boxes per pallet, pallets per container, box
   vent area, store psychrometrics with a psychrometric chart,
   vapour-pressure deficit and water loss, storage cost, product
   compatibility (temperature, humidity, ethylene, odours) and unit
   conversion.
9. **Report and project** — a self-contained HTML report (cover, the sections
   that were used with their figures and tables, handling recommendations,
   methods, references and citation), printable to PDF; a JSON project file
   that saves and restores everything.

Every figure downloads as SVG or as PNG at 300 ppi and opens in the suite's
figure studio; every result table downloads as CSV or XLSX. Data come in as
CSV, TSV, TXT, XLSX or ODS, or pasted from a spreadsheet.

## The examples are simulated

Ten **simulated** data sets let you go through every block without data of
your own: «Ataulfo» mango at three temperatures; chayote with two coatings
(time to rejection and weight loss); a coffee panel (descriptive profile,
hedonic, just-about-right, CATA and discrimination tests); losses along a
saladette tomato chain and a drop test; and «Hass» avocado respiration (static
system and climacteric curve). They were generated by
`tools/generar_datos.R` (seed 20261004) with models and parameters of the
order published for each crop; they are **not measurements** of real lots,
orchards or panels. They are built into the app (`js/datasets_data.js`) and
copied as CSV in `data/`.

## Tests and validation

Every engine was written from the published formula and compared against an
independent implementation: R 4.4.2 and its packages, published tables or
hand calculations written out in the test, each comparison with its own
tolerance. Open `tests/run.html` with a double click, or run
`node tests/run-node.js`: **443 tests and 71,199 comparisons, none failed**.

| Area | Engine | Tests | Comparisons | Reference |
|---|---|---:|---:|---|
| Numerical core (distributions, studentized range, Dunnett, linear algebra, optimisers) | `js/num.js` | 6 | 534 | R 4.4.2 |
| Colour (sRGB → CIELAB, ΔE94, ΔE00, indices) | `js/color.js` | 6 | 1,115 | R; the 22 published pairs of Sharma, Wu and Dalal (2005); hand calculations |
| Quality (acidity, moisture, McKinney index, size grades) | `js/quality.js` | 4 | 28 | hand calculations |
| Respiration and atmospheres | `js/resp.js` | 3 | 19 | hand calculations (gas balances, steady state, cooling) |
| Losses and mechanical damage | `js/losses.js` | 3 | 45 | R (linear and logistic regression, Fieller's interval) |
| Packaging and logistics | `js/logistics.js` | 3 | 33 | ASHRAE (2017) saturation tables, psychrometric identities |
| Kinetics and shelf life | `js/kinetics.js` | 233 | 18,932 | R (nonlinear and linear least squares, prediction) |
| Time to failure with censoring | `js/survival.js` | 143 | 38,488 | R (Kaplan–Meier, log-rank, parametric survival models) |
| Sensory evaluation | `js/sensory.js` | 32 | 11,669 | R (Thurstonian models, panel performance, ANOVA, CATA, correspondence and principal components) |
| Postharvest trials | `js/trials.js` | 8 | 240 | R (types I and III, Tukey, LSD, Dunnett, repeated measures, slopes) |
| Catalogue of methods and references | `js/refs.js` | 2 | 96 | every source cited in the methods is in the reference list |
| **Total** | | **443** | **71,199** | **0 failed** |

The reference scripts in R, the reference values and one report per area
(what was compared, the tolerances, the largest differences and the errors the
comparison caught and that were corrected) are in
[`tests/validacion/`](tests/validacion/) (in Spanish). To repeat a reference:

```
Rscript tests/validacion/<area>.R
node tests/run-node.js [area]
```

## Documentation

| Document | Language | What it is |
|---|---|---|
| `manual/PostHarvestPro_Manual_de_usuario_ES.pdf` | Spanish | User manual: introduction, one chapter per block and appendices |
| `manual/en/PostHarvestPro User's Manual (English).pdf` | English | The same manual in English |
| `manual/es/manual-completo.html`, `manual/en/manual-completo.html` | Spanish, English | The manuals in HTML; the separate parts are in the same folders, and `manual/LEEME.md` explains how they are built |
| Home page of the app (Block 1) and the method notes of every tool | Spanish and English | What each block does, the methods with their sources |
| [`CHANGELOG.md`](CHANGELOG.md) | Spanish | What changed in each version |

## Data and third-party material

The numerical core, the statistics, the colour science, the kinetic and
survival engines, the sensory engine, the spreadsheet reader and writer, the
figures and the report are the author's own code; the program uses no
libraries, fonts or services of others and requests nothing from the
internet. It implements published methods, each one cited to its original
source in the code, in the app and in the manual. What comes from third
parties is listed with its licence in
[`LICENSES-TERCEROS.md`](LICENSES-TERCEROS.md): the line icons of the shared
modules of the suite (navigator, figure studio and effects), from the Lucide
project under the ISC licence (those derived from Feather also under MIT).

## Good to know

- The models summarise data: extrapolating far from the temperatures, times
  or cultivars measured is the user's responsibility, and the app warns when
  it happens.
- The tables of sizes, film permeabilities and product compatibility are
  orientative and editable: use those of your standard, your film and your
  cultivar.
- Predictions of shelf life are at constant temperature; variable temperature
  histories are not modelled.
- Nothing is uploaded: there is no server, account or connection, and what
  you save is a project file on your computer.

## How to cite

Barrera-Guzmán, L. Á. (2026). PostHarvestPro: postharvest physiology and
technology, quality, shelf life and sensory evaluation in the browser
(Version 1.0.0) [Computer software]. Zenodo.
https://doi.org/10.5281/zenodo.XXXXXXX

The DOI above always resolves to the latest version; each version has its own
DOI on the Zenodo page. Cite the version you used. Code:
https://github.com/luisangelbg/PostHarvestPro

The **Home** page of the app gives the citation ready to copy, and every
report ends with it. `CITATION.cff` has the same data for reference managers.
Cite also the methods you used: every result names them.

## Contributing and support

Problems and proposals go to
https://github.com/luisangelbg/PostHarvestPro/issues.

## Licence

GNU General Public License, version 3 or later (`LICENSE`). Copyright (C) 2026
Luis Ángel Barrera-Guzmán.
