# Convenciones de código de PostHarvestPro

Notas internas de desarrollo: cómo se escriben los motores, las pruebas y la validación.

## Reglas de la suite LABG que aplican a todo

- **Obra propia, sin terceros.** Nada de bibliotecas, CDN, tipografías, imágenes ni datos de otros. Sin peticiones a internet. Funciona con doble clic en `index.html` (`file://`).
- **No nombrar programas ni marcas** (ni comerciales ni libres) en `js/`, `css/`, `index.html`, la interfaz ni el manual. Se describe el método y se cita el artículo: «el algoritmo de Copenhaver y Holland (1988)», no el nombre de un paquete. La única excepción es `tests/validacion/`, donde los guiones de R nombran los paquetes contra los que se compara.
- Licencia GPL-3.0-or-later, autor Luis Ángel Barrera-Guzmán. No se menciona ninguna institución.
- Interfaz bilingüe (español por omisión, inglés). Los motores no llevan texto de interfaz: devuelven números, códigos o notas `{es, en}`.

## Motores (`js/<motor>.js`)

```js
/* PostHarvestPro — <título corto>
   Copyright (C) 2026  Luis Ángel Barrera-Guzmán
   (aviso GPL de 7 líneas, igual que js/num.js) */

/* PostHarvestPro — <qué hace el motor, en inglés, con las fuentes de cada método>. */
function SensCore(g) {
'use strict';
const Num = g.Num;
const Sens = {};
// …
g.Sens = Sens;
return Sens;
}
if (typeof window !== 'undefined') SensCore(window);
```

- Sin DOM. Funciones puras: entradas y salidas en objetos simples; `NaN` cuando algo no está definido.
- Comentarios en inglés, con la fórmula y la cita (autor, año, revista) de cada método.
- Todo lo numérico de base sale de `Num` (`js/num.js`): `pnorm/qnorm`, `pt/qt`, `pchisq/qchisq`, `pf/qf`, `pbeta/qbeta`, `pbinom/dbinom/qbinom`, `ptukey/qtukey`, `pDunnett/qDunnett`, `padjust`, `integrate`, `glIntegrate`, `gaussLegendre`, `lm`, `levMar`, `nelderMead`, `brent`, `hessian`, `grad`, `mat` (`solve`, `inv`, `chol`, `eigSym`, `svd`, `mul`, `T`), `rank`, `quantile`, `rng`.
- Orden de carga (también en `tests/files.json`): `num.js` primero, luego los motores.

## Pruebas

- `tests/harness.js`: `TEST(area, nombre, a => { a.close(x, esperado, tol, 'etiqueta'); a.rel(…); a.eq(…); a.ok(…); a.arr(…); })`. Cada aserción cuenta como una comparación. **La tolerancia siempre va escrita en la prueba.**
- `tests/unit_<area>.js`: las pruebas de un área (casos de libro, propiedades y comparación con las referencias de R).
- `tests/validacion/<area>.R`: guion de R que calcula las referencias y las escribe en `tests/validacion/ref_<area>.json` **y** `tests/validacion/ref_<area>.js` (`window.REF = window.REF || {}; window.REF.<area> = {…};`, para que `tests/run.html` las lea con doble clic). `jsonlite::toJSON(x, digits = NA, auto_unbox = TRUE)`.
- `tests/validacion/LEEME_<area>.md`: en español, qué se comparó contra qué (paquete y función de R), cuántas comparaciones, tolerancias y por qué, y **los errores que atrapó la validación** (qué estaba mal y cómo se corrigió).
- Correr: `node tests/run-node.js [area]` (node: `"C:/Program Files/RStudio/resources/app/bin/node/node.exe"`); en el navegador, `tests/run.html`.
- R: `"C:/Program Files/R/R-4.4.2/bin/Rscript.exe"`; un proceso por guion.
