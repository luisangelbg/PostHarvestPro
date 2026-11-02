# Cómo publicar PostHarvestPro

Nada de esto se ha hecho todavía: la app sólo vive en esta carpeta, sin repositorio git.

## 1. Repositorio y GitHub Pages

```
cd "C:/Users/luisa/Documents/LABG Apps/PostHarvestPro"
git init -b main
git add .
git commit -m "PostHarvestPro 1.0.0"
gh repo create luisangelbg/PostHarvestPro --public --source . --remote origin --push
gh api -X POST repos/luisangelbg/PostHarvestPro/pages -f "source[branch]=main" -f "source[path]=/"
```

GitHub Pages publica la rama `main` desde la raíz; `.nojekyll` ya está. Tarda uno o dos minutos. La app queda en <https://luisangelbg.github.io/PostHarvestPro/>.

Comprobación: abrir esa dirección, cargar el ejemplo de cada bloque y abrir `tests/run.html` (debe decir «Todo pasa»).

## 2. Zenodo (DOI), si se desea

1. En <https://zenodo.org/account/settings/github/>, activar `luisangelbg/PostHarvestPro`.
2. Crear la versión: `gh release create v1.0.0 --title "PostHarvestPro 1.0.0" --notes-file CHANGELOG.md`.
3. Copiar los DOI (de concepto y de versión) en `CITATION.cff` (`doi:` e `identifiers:`), `codemeta.json` (`identifier`) y `README.md` (insignia), y subir el cambio.

## 3. Ficha en el portal (`luisangelbg.github.io/data/apps.js`)

Esta ficha va antes del cierre `];` de `LABG_APPS`. La categoría `agronomia` es la de AgriDesign, PhenologyPro y EconomicsPro.

```js
  {
    id: "PostHarvestPro", nombre: "PostHarvestPro",
    lema: "Del campo al consumidor: calidad, vida de anaquel y sensorial con datos",
    descripcion: "Fisiología y tecnología poscosecha en el navegador: índices de calidad y color CIELAB con ΔE00, cinética de deterioro con Arrhenius, Q10 y vida de anaquel, tiempo hasta el rechazo con censura, respiración, etileno y atmósferas modificadas, preenfriamiento, pérdidas en la cadena de valor con Sankey, daño mecánico, evaluación sensorial discriminativa, afectiva y descriptiva con desempeño del panel, ensayos factoriales y de medidas repetidas, calculadoras de empaque y almacén, e informe autocontenido.",
    categoria: "agronomia", estado: "enlinea", version: "1.0.0", doi: "", licencia: "GPL-3.0",
    manualPdf: "", manualMb: 0, manualHtml: true, datos: true,
    puntos: ["Cinética de orden 0, 1 y 2 con AIC, Arrhenius, Q10 y vida de anaquel a cualquier temperatura", "Kaplan–Meier, Weibull y log-normal para el tiempo hasta el rechazo", "Respiración, climaterio, atmósfera modificada y carga de refrigeración", "Sensorial con d′ de Thurstone, penalidades JAR, CATA y desempeño del panel"],
    destacada: false
  }
```

El portal necesita además dos imágenes, que `scripts/build.mjs` da por hechas:

- `assets/apps/postharvestpro.webp`, la tarjeta de 1200 × 750: la portada de la app en línea capturada a 1600 × 1000 con escala 0.75;
- `assets/og/postharvestpro.jpg`, la imagen para compartir de 1200 × 630, con el diseño de las demás.

La app trae su propia imagen para compartir en `img/og.png`. Al empujar `data/**`, el flujo `build.yml` regenera las páginas.

Antes de poner `estado: "enlinea"`, la app debe estar ya en GitHub Pages. Si se agrega antes, conviene `estado: "proximamente"`.

## 4. Módulo común de efectos

Se agregó la escena `postharvestpro` (el fruto que madura mientras se traza su curva de firmeza) a `js/labg-fx.js` de la app y a `LABG-Design/labg-fx.js`. Falta copiarla a la fuente del portal (`shared/fx/labg-fx.js`) para que las tres copias sean iguales. Las demás apps no la necesitan, porque cada una usa su propia escena.

## 5. Manual en PDF

Abrir `docs/manual.html` en el navegador e imprimir a PDF (tamaño carta). Si se quiere la versión en inglés, falta traducir `docs/manual.md`.
