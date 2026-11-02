# Inventario de la suite (paso 0)

Notas internas sobre cómo están hechas las apps de la LABG Suite. Se revisaron AgriDesign (publicada), CorrelationPro (la más reciente) y la carpeta común LABG-Design. SoilPro aún no existía al empezar.

| Pieza | Cómo es en la suite | En PostHarvestPro |
|---|---|---|
| Estructura | `index.html`, `css/`, `js/`, `data/`, `tests/`, manual, `server.ps1`, `Open <App>.bat` | Igual, más `img/`, `docs/` y `tools/` |
| Licencia y metadatos | `LICENSE` (GPL-3.0), `CITATION.cff`, `codemeta.json`, `README.md`, `CHANGELOG.md`, `LICENSES-TERCEROS.md` | Igual (sin correo institucional) |
| `index.html` | Armado por un guion a partir de partes (barra común, portada, paneles) | `tools/armar_index.js` con `tools/partes/` |
| Barra común | `labg-base.css` + `labg-core.js`: logo con `#brandLogo`, enlace a la suite, ES/EN, tema, ayuda «?», «Reportar un problema» | Igual; logo de `Art.logo()` en `#brandLogo`; `LABG.REPO = 'PostHarvestPro'` |
| Identidad | Cada app redefine sólo `--primary`, `--primary-dark`, `--accent` (claro y oscuro); botones en el oro de la marca | Naranja fruto #EF6C00 (texto #B85000), verde inmaduro #7CB342 (texto #4E7A1E), crema #FFF3E0 |
| Módulos | Navegador LABG, Estudio de figuras, editor ✎, Efectos LABG (`LABGfx.loading`, escena por app) | Los cuatro; escena `postharvestpro` nueva en `labg-fx.js` |
| Idioma | `<span data-l="es">…</span><span data-l="en">…</span>`, `data-es`/`data-en`, `T(es, en)` | Igual (`js/i18n.js`, claves `postharvestpro:`) |
| Datos | Lector propio de CSV/XLSX/ODS, ejemplos incrustados en JS (doble clic) | `js/sheets.js` (de AgriDesign) + entrada común `DataIn` |
| Figuras | SVG en texto con `data-plot`, `data-xr`, `data-yr`, `data-role`, `data-li`; colores con variables CSS | `js/plot.js` con las mismas marcas |
| Pruebas | Arnés propio, `tests/index.html`, referencias de R | `tests/harness.js`, `run.html`, `run-node.js`, `validacion/` |
| Terceros | Nada de bibliotecas, CDN ni letras de otros; letras del sistema | Igual |

## Decisiones

- **Sin CDN.** El encargo permitía bibliotecas por CDN, pero ninguna app de la suite las usa y sus registros declaran «sin peticiones a internet». Todo es código propio.
- **Marca oro y negro.** La identidad esmeralda se retiró el 30 de septiembre de 2026; los botones y la barra de bloques van en oro.
- **Datos simulados.** Se declaran como tales en la app, el manual y el README.
- **Escena de espera.** La animación del fruto que madura se agregó al módulo común `labg-fx.js`, en la copia de la app y en LABG-Design. Falta llevarla a la fuente del portal (`shared/fx/`).
