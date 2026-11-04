# PostHarvestPro

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23935616.svg)](https://doi.org/10.5281/zenodo.23935616)

**Del campo al consumidor: calidad, vida de anaquel y sensorial con datos** · *English: [README.md](README.md)*

Fisiología y tecnología poscosecha en el navegador, sin escribir código.
PostHarvestPro sigue al producto desde la cosecha hasta el consumidor: calidad,
madurez y color CIELAB; cinética de deterioro, efecto de la temperatura y vida
de anaquel, incluido el tiempo hasta el rechazo de cada fruto con censura;
respiración, etileno, atmósferas modificadas y preenfriamiento; pérdidas en la
cadena de valor y daño mecánico; evaluación sensorial discriminativa, afectiva
y descriptiva; ensayos poscosecha factoriales y de medidas repetidas;
calculadoras de empaque y almacenamiento en frío; y un informe con los métodos
redactados. Sirve para tesis, laboratorios de poscosecha, empacadoras y
docencia. Español e inglés, tema claro y oscuro, sin instalar nada; todo se
calcula en el propio equipo y los datos no salen de él.


## Cómo abrirla

En línea: https://luisangelbg.github.io/PostHarvestPro/

Doble clic en `index.html`: no necesita servidor, instalación ni internet, y
los diez ejemplos vienen dentro y funcionan sin conexión. Para abrirla desde
otro equipo de la red, ejecuta `Open PostHarvestPro.bat` (arranca
`server.ps1`, un servidor local en el puerto 9970, en
`http://localhost:9970`).


## Los nueve bloques

1. **Inicio** — ilustración animada de la madurez y la firmeza a tres
   temperaturas, ruta de trabajo, galería de los diez ejemplos (cada uno abre
   su herramienta con los datos cargados), los métodos con sus fuentes, la
   poscosecha en breve, lo que la app no hace, las referencias y cómo citarla.
2. **Calidad y madurez** — resumen de calidad por grupo y tiempo (SST/AT,
   BrimA, color derivado); conversor sRGB ↔ CIELAB ↔ hexadecimal con muestra,
   ΔE\*ab, ΔE94 y ΔE00, índices de color (índice de color de cítricos,
   pardeamiento, blancura, amarillez, índice de color del jitomate) y el color
   medio de los datos; calculadoras de acidez titulable, humedad, firmeza y
   pérdida de peso; escalas de madurez y daño (índice de McKinney, incidencia,
   fruta comercializable); calibres.
3. **Cinética y vida de anaquel** — órdenes cero, uno y dos por mínimos
   cuadrados no lineales con AIC y tiempo hasta un límite de aceptación
   (intervalo por el método delta); modelos de Arrhenius, Q10 y raíz cuadrada
   (Ratkowsky) con la vida de anaquel a cualquier temperatura; pruebas
   aceleradas con intervalo de predicción; tiempo hasta el rechazo con censura
   por la derecha: Kaplan–Meier (Greenwood), prueba de rango logarítmico,
   modelos Weibull, log-normal, log-logístico y exponencial, percentiles y
   razones de tiempos.
4. **Respiración, etileno y atmósferas** — sistema estático (frasco cerrado) y
   de flujo continuo, cociente respiratorio, etileno y calor de respiración;
   clasificación climatérica por una regla explícita; diseño de atmósfera
   modificada en estado estacionario (con respiración de Michaelis–Menten
   opcional), espesor por película y plano O₂–CO₂; tiempos de medio y siete
   octavos de enfriamiento y carga de refrigeración.
5. **Pérdidas y cadena de valor** — pérdidas por etapa en cantidad y valor,
   índice de pérdidas, diagrama de Sankey, puntos críticos de Pareto,
   simulación de mejoras, envío a EconomicsPro; curvas de daño mecánico
   (lineal, cuadrática, de potencia, exponencial), umbral, susceptibilidad y
   dosis logística con intervalo de Fieller.
6. **Evaluación sensorial** — triangular, dúo-trío, 2-AFC, 3-AFC y tétrada con
   d′ de Thurstone, potencia y tamaño de muestra; A–no A; preferencia pareada;
   hedónica (análisis de varianza, Tukey, Friedman); punto justo con análisis
   de penalidades; CATA (Q de Cochran, McNemar, correspondencias); perfil
   descriptivo (análisis de varianza juez × producto, desempeño del panel,
   gráfica de araña, mapa de productos por componentes principales, envío a
   PCAPro); fichas de cata con órdenes de Williams y códigos aleatorios de tres
   dígitos.
7. **Ensayos poscosecha** — factorial tratamiento × tiempo (tipos I y III) con
   Tukey–Kramer, DMS, Bonferroni y Dunnett dentro de cada tiempo y letras;
   medidas repetidas (parcelas divididas en el tiempo, Greenhouse–Geisser,
   Huynh–Feldt, Mauchly); comparación de pendientes; libro de campo
   aleatorizado compatible con AgriDesign.
8. **Empaque y logística** — cajas por tarima, tarimas por contenedor, área de
   ventilación de la caja, ambiente del almacén con carta psicrométrica,
   déficit de presión de vapor y pérdida de agua, costo de almacenamiento,
   compatibilidad de productos (temperatura, humedad, etileno, olores) y
   conversión de unidades.
9. **Informe y proyecto** — informe HTML autocontenido (portada, las secciones
   que se usaron con sus figuras y cuadros, recomendaciones de manejo,
   métodos, referencias y cita), imprimible a PDF; proyecto JSON que guarda y
   restaura todo.

Cada figura se descarga en SVG o en PNG a 300 ppp y se abre en el estudio de
figuras de la suite; cada cuadro de resultados, en CSV o XLSX. Los datos
entran como CSV, TSV, TXT, XLSX u ODS, o pegados desde una hoja de cálculo.


## Los ejemplos son simulados

Diez conjuntos **simulados** permiten recorrer todos los bloques sin datos
propios: mango «Ataulfo» a tres temperaturas; chayote con dos recubrimientos
(tiempo hasta el rechazo y pérdida de peso); un panel de café (perfil
descriptivo, hedónica, punto justo, CATA y pruebas discriminativas); pérdidas
en una cadena de jitomate saladette y una prueba de caídas; y respiración de
aguacate «Hass» (sistema estático y curva climatérica). Los generó
`tools/generar_datos.R` (semilla 20261004) con modelos y parámetros del orden
de los publicados para cada cultivo; **no son mediciones** de lotes, huertos ni
paneles reales. Vienen dentro de la app (`js/datasets_data.js`) y, como CSV, en
`data/`.


## Manuales

- `manual/PostHarvestPro_Manual_de_usuario_ES.pdf` — manual de usuario en
  español: introducción, un capítulo por bloque y apéndices.
- `manual/en/PostHarvestPro User's Manual (English).pdf` — el mismo manual en
  inglés.

Los manuales en HTML son `manual/es/manual-completo.html` y
`manual/en/manual-completo.html`; las partes sueltas están en las mismas
carpetas y `manual/LEEME.md` explica cómo se arman.


## Validación

Cada motor se programó desde la fórmula publicada y se comparó con una
implementación independiente: R 4.4.2 y sus paquetes, tablas publicadas o
cálculos a mano escritos en la prueba, cada comparación con su tolerancia.
Abre `tests/run.html` con doble clic, o corre `node tests/run-node.js`:
**450 pruebas y 71 283 comparaciones, ninguna falla**.

| Área | Motor | Pruebas | Comparaciones | Referencia |
|---|---|---:|---:|---|
| Núcleo numérico (distribuciones, rango estudentizado, Dunnett, álgebra lineal, optimizadores) | `js/num.js` | 6 | 534 | R 4.4.2 |
| Color (sRGB → CIELAB, ΔE94, ΔE00, índices) | `js/color.js` | 6 | 1 115 | R; los 22 pares publicados por Sharma, Wu y Dalal (2005); cálculos a mano |
| Calidad (acidez, humedad, índice de McKinney, calibres) | `js/quality.js` | 4 | 28 | cálculos a mano |
| Respiración y atmósferas | `js/resp.js` | 3 | 19 | cálculos a mano (balances de gases, estado estacionario, enfriamiento) |
| Pérdidas y daño mecánico | `js/losses.js` | 3 | 45 | R (regresión lineal y logística, intervalo de Fieller) |
| Empaque y logística | `js/logistics.js` | 3 | 36 | tablas de saturación de ASHRAE (2017), identidades psicrométricas |
| Cinética y vida de anaquel | `js/kinetics.js` | 233 | 18 932 | R (mínimos cuadrados no lineales y lineales, predicción) |
| Tiempo de falla con censura | `js/survival.js` | 143 | 38 488 | R (Kaplan–Meier, rango logarítmico, modelos paramétricos de supervivencia) |
| Evaluación sensorial | `js/sensory.js` | 32 | 11 669 | R (modelos de Thurstone, desempeño del panel, ANOVA, CATA, correspondencias y componentes principales) |
| Ensayos poscosecha | `js/trials.js` | 8 | 242 | R (tipos I y III, Tukey, DMS, Dunnett, medidas repetidas, pendientes) |
| Catálogo de métodos y referencias | `js/refs.js` | 2 | 96 | toda fuente citada en los métodos está en la lista de referencias |
| Figuras (números de los ejes, rótulos, signo de porcentaje) | `js/plot.js` | 7 | 79 | geometría y texto escritos en la prueba: miles en los ejes, rótulos que no se enciman ni cruzan líneas, trazos distintos en el plano O₂–CO₂, «90 %» en español y «90%» en inglés |
| **Total** | | **450** | **71 283** | **0 fallas** |

Los guiones de R, los valores de referencia y un informe por área (qué se
comparó, las tolerancias, las diferencias máximas y los errores que la
comparación encontró y se corrigieron) están en
[`tests/validacion/`](tests/validacion/). Para repetir una referencia:

```
Rscript tests/validacion/<area>.R
node tests/run-node.js [area]
```


## Datos y material de terceros

El núcleo numérico, la estadística, la ciencia del color, los motores de
cinética y de supervivencia, el motor sensorial, el lector y escritor de hojas
de cálculo, las figuras y el informe son código propio; el programa no usa
bibliotecas, tipografías ni servicios de otros y no pide nada a internet. Cada
método publicado se cita a su fuente original en el código, en la app y en el
manual. Lo que viene de terceros se declara con su licencia en
[`LICENSES-TERCEROS.md`](LICENSES-TERCEROS.md): los íconos de línea de los
módulos comunes de la suite (navegador, estudio de figuras y efectos), del
proyecto Lucide con licencia ISC (los derivados de Feather, también MIT).


## Lo que conviene saber

- Los modelos resumen datos: extrapolar lejos de las temperaturas, los tiempos
  o los cultivares medidos es responsabilidad de quien los usa, y la app avisa
  cuando ocurre.
- Las tablas de calibres, permeabilidades de películas y compatibilidad de
  productos son orientativas y editables: usa las de tu norma, tu película y
  tu cultivar.
- La vida de anaquel se predice a temperatura constante; las historias de
  temperatura variable no se modelan.
- No se sube nada: no hay servidor, cuenta ni conexión, y lo que guardas es un
  archivo de proyecto en tu equipo.


## Cómo citar

Barrera-Guzmán, L. Á. (2026). *PostHarvestPro: fisiología y tecnología
poscosecha, calidad, vida de anaquel y evaluación sensorial en el navegador*
(versión 1.0.0) [Programa de cómputo]. Zenodo.
https://doi.org/10.5281/zenodo.23935616

El DOI de arriba lleva siempre a la versión más reciente; cada versión tiene
además el suyo en la página de Zenodo. Cita la versión que usaste. Código:
https://github.com/luisangelbg/PostHarvestPro

La sección **Cómo citar** de la portada de la app da la cita lista para
copiar, y todos los informes terminan con ella; `CITATION.cff` tiene los
mismos datos para los gestores de referencias. Cita además los métodos que
usaste: cada resultado los nombra.


## Licencia

Licencia Pública General de GNU, versión 3 o posterior (`LICENSE`). Copyright
(C) 2026 Luis Ángel Barrera-Guzmán.


## Cómo contribuir

Los errores y las propuestas se reciben en
https://github.com/luisangelbg/PostHarvestPro/issues.
