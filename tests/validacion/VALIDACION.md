# Validación de PostHarvestPro 1.0.0

Cada motor de cálculo se programó desde la fórmula publicada y se comparó con una implementación independiente: R 4.4.2 y sus paquetes, tablas publicadas o cálculos a mano escritos en la prueba. Esta carpeta es la única parte del programa que nombra paquetes de software. La app y su manual describen los métodos y citan los artículos.

## Cómo se reproduce

```
"C:/Program Files/R/R-4.4.2/bin/Rscript.exe" tests/validacion/<area>.R      (vuelve a calcular las referencias)
node tests/run-node.js [area]                                                (compara, en la consola)
tests/run.html                                                               (compara, en el navegador; abre con doble clic)
```

Cada guion `.R` escribe `ref_<area>.json` y `ref_<area>.js`. El `.js` existe para que `run.html` lea las referencias con doble clic. Las pruebas están en `tests/unit_<area>.js`. **Cada comparación lleva su tolerancia escrita en la prueba.**

## Resultado (2 nov 2026)

**448 pruebas, 71 273 comparaciones, 0 fallas**, tanto en node como en el navegador (10 s).

| Área | Motor | Pruebas | Comparaciones | Referencia | Detalle |
|---|---|---:|---:|---|---|
| Núcleo numérico | `js/num.js` | 6 | 534 | `stats` (qt, qchisq, qf, qbeta, pbinom, qbinom, ptukey, qtukey, lm, eigen, svd, nls, p.adjust), `mvtnorm::qmvt/pmvt` | [LEEME_num.md](LEEME_num.md) |
| Color | `js/color.js` | 6 | 1 115 | `farver` (sRGB → Lab, ΔE94, ΔE00); 22 pares publicados de Sharma, Wu y Dalal (2005) | [LEEME_color_losses.md](LEEME_color_losses.md) |
| Calidad | `js/quality.js` | 4 | 28 | cálculos a mano (acidez, humedad, McKinney, calibres; escala que empieza en 1, frutos fuera de todos los calibres) | ídem |
| Respiración y atmósferas | `js/resp.js` | 3 | 19 | cálculos a mano (balances de gas, estado estacionario, enfriamiento) | ídem |
| Pérdidas y daño | `js/losses.js` | 3 | 45 | `lm`, `glm(binomial)` e intervalo de Fieller escrito en R | ídem |
| Logística | `js/logistics.js` | 3 | 33 | tablas de saturación de ASHRAE (2017), identidades psicrométricas | ídem |
| Cinética | `js/kinetics.js` | 233 | 18 932 | `nls` con gradiente analítico, `minpack.lm::nlsLM`, `lm`, `predict` | [LEEME_kinetics.md](LEEME_kinetics.md) |
| Tiempo de falla | `js/survival.js` | 143 | 38 488 | `survival::survfit/survdiff/survreg`, `flexsurv::flexsurvreg` | [LEEME_survival.md](LEEME_survival.md) |
| Sensorial | `js/sensory.js` | 32 | 11 669 | `sensR`, `SensoMineR`, `FactoMineR`, `agricolae`, `DescTools`, `stats` | [LEEME_sensory.md](LEEME_sensory.md) |
| Ensayos | `js/trials.js` | 8 | 242 | `lm`/`anova`, `car::Anova` (tipo III), `TukeyHSD`, `pairwise.t.test`, `multcomp::glht` (Dunnett), `agricolae::HSD.test`, `aov` con `Error()`, `anova.mlm` y `mauchly.test`, `emmeans::emtrends` | [LEEME_trials.md](LEEME_trials.md) |
| Referencias | `js/refs.js` | 2 | 96 | coherencia interna: cada fuente que nombra el catálogo de métodos está en la lista de obras; índices de color con sus fuentes | — |
| Figuras | `js/plot.js` | 5 | 72 | geometría escrita en la prueba: miles en los ejes, rótulos sin encimarse ni cruzar líneas, nombres de la araña dentro de la figura, trazos distintos en el plano O₂–CO₂ | — |

## Errores que atrapó la validación

1. **Rango estudentizado (Tukey).** El `ptukey` se tomó de la suite y anulaba probabilidades reales con 5 o más medias: cortaba con exp(−30/k) en lugar de exp(−30). Con 10 medias y 5 gl, qtukey(0.95) daba 7.003 en vez de 6.995. Se corrigió aquí; la misma corrección queda propuesta para la app de origen.
2. **Regresión logística (daño mecánico).** Los errores estándar se calculaban con los pesos de la iteración anterior a la convergencia (≈ 2·10⁻⁵ relativo). Ahora se recalculan con las estimaciones finales. La referencia de R también se corrió con una convergencia más estricta.
3. **Saturación del vapor de agua.** La fórmula de Hyland y Wexler se aparta hasta 0.02 % de las tablas de 2017, que siguen a la formulación de 1995. Se cambió a las ecuaciones de Wagner y Pruss (2002) y de Wagner et al. (2011).
4. **Optimizador no lineal.** Declaraba convergencia cuando ningún paso bajaba la suma de cuadrados, aunque el gradiente no fuera cero; pasa junto al polo de una curva de segundo orden. Ahora exige un gradiente casi nulo. Lo encontró la validación de cinética.
5. **Supervivencia con un grupo sin eventos.** El ajuste paramétrico daba coeficientes enormes con errores estándar de ~10¹⁶ marcados como convergidos. Ahora ese nivel queda fuera del ajuste, que es el límite de la verosimilitud, y se avisa.
6. **Sensorial.** El diseño de Williams con un solo producto daba dos filas. La derivada de la 3-AFC perdía dígitos con d′ grande. `discrim` lanzaba un error con datos no válidos en vez de avisar.
7. **Referencias que no servían.** El ΔE «euclidiano» de una biblioteca de color no se calcula en Lab y la conversión sRGB → Lab de `grDevices` difiere hasta 0.3 unidades: se usó el cálculo directo y `farver`. La función psicométrica de `sensR` tiene errores locales de hasta 2.8·10⁻⁴: el motor se comparó además con una integración precisa. La potencia de similitud de `discrimPwr` no es 0 cuando la prueba no puede rechazar. Detalles en cada LEEME.
