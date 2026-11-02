# Cómo publicar PostHarvestPro

Estado (2 de noviembre de 2026): repositorio git local en la rama `main`, sin remoto. Los metadatos ya están listos
para GitHub Pages y Zenodo: `README.md` (inglés), `LEEME.md` (español), `CITATION.cff` y `codemeta.json` sin correo,
`.zenodo.json`, `.nojekyll` y `<meta name="labg-repo" content="PostHarvestPro">` en `index.html` (lo escribe
`tools/armar_index.js`). El DOI aparece como `10.5281/zenodo.XXXXXXX` hasta que Zenodo lo asigne.

Antes de empezar: `node tests/run-node.js` debe decir «0 failed tests», y los manuales en PDF deben estar en
`manual/PostHarvestPro_Manual_de_usuario_ES.pdf` y `manual/en/PostHarvestPro User's Manual (English).pdf`, porque el
README, el LEEME y la descripción de Zenodo los mencionan.

## 1. Repositorio y GitHub Pages

```
cd "C:/Users/luisa/Documents/LABG Apps/PostHarvestPro"
gh repo create luisangelbg/PostHarvestPro --public --source . --remote origin --push
gh api -X POST repos/luisangelbg/PostHarvestPro/pages -f "source[branch]=main" -f "source[path]=/"
```

GitHub Pages publica la rama `main` desde la raíz; `.nojekyll` ya está. Tarda uno o dos minutos. La app queda en
<https://luisangelbg.github.io/PostHarvestPro/>.

Comprobación: abrir esa dirección, cargar el ejemplo de cada bloque, abrir los dos manuales desde el pie de la portada
y abrir `tests/run.html` (debe decir que todo pasa).

## 2. Zenodo (DOI)

1. En <https://zenodo.org/account/settings/github/>, activar `luisangelbg/PostHarvestPro` (antes de crear la versión).
2. Crear la versión: `gh release create v1.0.0 --title "PostHarvestPro 1.0.0" --notes-file CHANGELOG.md`. Zenodo toma
   el título, la descripción, el autor, la licencia y las palabras clave de `.zenodo.json`.
3. Cambiar `XXXXXXX` por el DOI de concepto en `README.md` y `LEEME.md` (insignia y cita), `CITATION.cff` (`doi:` y
   `preferred-citation`) y `codemeta.json` (`identifier` y `relatedLink`). La cita de la app (`js/home.js`, objeto con
   `apa`, `apaEn` y `bib`) todavía no lleva DOI: si se quiere, agregarlo ahí también y volver a correr las pruebas.
   Subir el cambio.

## 3. Ficha en el portal (`luisangelbg.github.io/data/apps.js`)

El portal aún no tiene ficha de PostHarvestPro. Va antes del cierre `];` de `LABG_APPS`, con la forma de las demás
apps publicadas (PalynoPro, ForestPro). La categoría `agronomia` es la de AgriDesign, PhenologyPro y EconomicsPro.
`manualMb` y `manualEn.mb` son los megabytes de cada PDF, redondeados.

```js
  {
    id: "PostHarvestPro", nombre: "PostHarvestPro",
    lema: "Del campo al consumidor: calidad, vida de anaquel y sensorial con datos",
    descripcion: "Fisiología y tecnología poscosecha en el navegador: índices de calidad y color CIELAB con ΔE00, cinética de deterioro con Arrhenius, Q10 y vida de anaquel, tiempo hasta el rechazo con censura, respiración, etileno y atmósferas modificadas, preenfriamiento, pérdidas en la cadena de valor con Sankey, daño mecánico, evaluación sensorial discriminativa, afectiva y descriptiva con desempeño del panel, ensayos factoriales y de medidas repetidas, calculadoras de empaque y almacén, e informe autocontenido. Tus datos no salen de tu computadora. Validada contra implementaciones independientes.",
    categoria: "agronomia", estado: "enlinea", version: "1.0.0", doi: "10.5281/zenodo.XXXXXXX", licencia: "GPL-3.0",
    manualPdf: "PostHarvestPro_Manual_de_usuario_ES.pdf", manualMb: 0, manualHtml: true, datos: true,
    manualEn: { pdf: "PostHarvestPro User's Manual (English).pdf", mb: 0, html: true },
    idiomas: ["es", "en"],
    puntos: ["Cinética de orden 0, 1 y 2 con AIC, Arrhenius, Q10 y vida de anaquel a cualquier temperatura", "Kaplan–Meier, Weibull y log-normal para el tiempo hasta el rechazo", "Respiración, climaterio, atmósfera modificada y carga de refrigeración", "Sensorial con d′ de Thurstone, penalidades JAR, CATA y desempeño del panel"],
    destacada: false
  }
```

El portal necesita además dos imágenes, que `scripts/build.mjs` da por hechas, y la ilustración propia de la app
(regla de las portadas: cada app con la suya):

- `assets/apps/postharvestpro.webp`, la tarjeta de 1200 × 750: la portada de la app en línea capturada a
  1600 × 1000 con escala 0.75;
- `assets/og/postharvestpro.jpg`, la imagen para compartir de 1200 × 630, con el diseño de las demás.

La app trae su propia imagen para compartir en `img/og.png`. Al empujar `data/**`, el flujo `build.yml` regenera las
páginas. Antes de poner `estado: "enlinea"`, la app debe estar ya en GitHub Pages; si se agrega antes, conviene
`estado: "proximamente"`.

## 4. Módulo común de efectos

La escena `postharvestpro` (el fruto que madura mientras se traza su curva de firmeza) está en `js/labg-fx.js` de la
app y en `LABG-Design/labg-fx.js`. Falta copiarla a la fuente del portal (`shared/fx/labg-fx.js`) para que las tres
copias sean iguales. Las demás apps no la necesitan, porque cada una usa su propia escena.

## 5. Manuales

Los manuales viven en `manual/` (`manual/LEEME.md` explica cómo se arman); el manual viejo de `docs/` se retiró del
repositorio el 2 de noviembre de 2026 y sigue en la historia de git. Los PDF se imprimen sólo al final, cuando las
partes estén terminadas.
