# Validación del motor de tiempo de falla (`js/survival.js`)

Guion: `tests/validacion/survival.R` (R 4.4.2; `survival` 3.7.0, `flexsurv` 2.3.2, `jsonlite` 2.0.0).
Escribe `ref_survival.json` y `ref_survival.js`; las pruebas están en `tests/unit_survival.js`.

```
"C:/Program Files/R/R-4.4.2/bin/Rscript.exe" tests/validacion/survival.R
"C:/Program Files/RStudio/resources/app/bin/node/node.exe" tests/run-node.js survival
```

## Conjuntos

- **8 diseñados:** dos tratamientos (Weibull) con censura del 0 %, 28 % y 62 %; un grupo (lognormal, 30 %);
  tres grupos (log-logístico, 35 %); una covariable numérica (temperatura de almacenamiento, 38 %); un caso
  pequeño sin censura con S = ½ exactamente en un intervalo y la última observación como evento (S = 0);
  inspecciones semanales (muchos empates, también entre eventos y censuras).
- **30 de estrés:** tamaños de 8 a 60, 1 a 3 grupos, tres distribuciones, formas de 0.6 a 3, censura de 0 %
  a 86 %, unidades de 0.1, 1 o 7 días. Tres de ellos (`stress-08`, `-24`, `-25`) tienen un grupo **sin
  eventos**.

## Qué se comparó y contra qué

| Motor | Referencia en R | Casos |
|---|---|---|
| `Surv.km` con intervalos `log`, `log-log` y `plain`: tiempos, en riesgo, eventos, censuras, Ŝ, EE de Greenwood (de log Ŝ y de Ŝ), límites | `survival::survfit` (`$std.err`, `summary(fit, censored = TRUE)$std.err`, `$lower`, `$upper`) | 69 curvas × 3 tipos |
| mediana y su IC; media restringida al último tiempo y su EE | `summary(survfit)$table` (`median`, `0.95LCL`, `0.95UCL`, `rmean`, `se(rmean)`) | 207 |
| cuartiles 0.25, 0.5 y 0.75 con IC | `quantile(survfit)` | 207 |
| `Surv.logrank` ρ = 0 (log-rank) y ρ = 1 (Peto–Peto–Prentice): χ², gl, p, observados, esperados, covarianza | `survival::survdiff` | 23 conjuntos × 2 |
| `Surv.reg` weibull, lognormal, loglogistic, exponential (con grupo, sin grupo o con covariable): coeficientes, EE, z, p, escala, EE de log(escala), vcov, log-verosimilitud, AIC, gl | `survival::survreg` (`rel.tolerance = 1e-12`), `vcov`, `summary()$table`, `AIC` | 152 ajustes |
| cuantiles 0.1, 0.5, 0.9 por nivel: estimación, EE, y en escala log | `predict(survreg, type = "quantile" / "uquantile", se.fit = TRUE)` | 152 × niveles |
| S(t) por nivel | `1 − psurvreg(t, lp, scale, dist)` | 152 × niveles × 3 tiempos |
| log-verosimilitud (segunda referencia) | `flexsurv::flexsurvreg` (`weibull`, `lnorm`, `llogis`, `exp`) | 152 |
| `Surv.compare`: AIC, ΔAIC, pesos, mejor distribución | `AIC(survreg)` | 38 |
| niveles sin eventos: términos estimables, cuantiles y S(t) | `survreg` reajustado sin esos registros (el límite de la verosimilitud) | 3 conjuntos × 4 distribuciones |

**Comparaciones contra R: 38 433** (de 38 488 en el área; las otras 55 son casos de libro y propiedades:
la leucemia 6-MP / placebo de Freireich et al. 1963 tal como la publican Kleinbaum y Klein 2012 —S(t),
EE de Greenwood, medianas 23 y 8 semanas, log-rank χ² = 16.79—, la exponencial sin censura cuya EMV de la
media es la media muestral, Ŝ(t_p) = 1 − p en el Weibull ajustado y convergencia con 90 % de censura).

## Tolerancias y por qué

- **Kaplan–Meier, Greenwood, intervalos, mediana, cuantiles, media restringida y log-rank**: sumas y
  productos finitos de los mismos conteos: absoluta 1e-12–1e-14 en probabilidades, relativa 1e-10–1e-12
  en χ², varianzas y EE; exacta en conteos y tiempos. Observado: ≤ 6e-16 en Ŝ y límites, 7e-15 en χ².
- **Máxima verosimilitud**: la referencia itera Newton–Raphson hasta un cambio relativo de la
  log-verosimilitud < 1e-12; el motor termina con un paso de Newton sobre la función score. Estimaciones,
  escala y cuantiles: relativa 1e-7; EE, vcov, z y EE de cuantiles: relativa 1e-6; S(t): absoluta 1e-8;
  log-verosimilitud y AIC: absoluta 1e-8. Observado: 4e-12 en coeficientes, 3e-12 en EE, 5e-13 en la
  log-verosimilitud (márgenes de 10⁴ a 10⁵).
- **Segunda referencia** (`flexsurvreg`, otro optimizador con sus propias tolerancias): absoluta 1e-6
  en la log-verosimilitud. Observado: 9e-10.

## Errores que atrapó la validación

1. **Grupos sin eventos (motor).** En `stress-08`, `-24` y `-25` un grupo no tiene ningún evento; la EMV de
   su efecto está en +∞ (verosimilitud monótona). El motor devolvía coeficientes enormes (36, 14, 51…) con
   EE ~1e16 marcados como convergidos, y la exponencial ni convergía en 300 iteraciones: resultados
   engañosos. R da `NA` (o, en la lognormal, un valor arbitrario donde se detuvo, 4.74) y `predict()` da
   `NA` para **todos** los niveles. Corrección: el motor detecta los niveles sin eventos, los excluye del
   ajuste (es el límite de la verosimilitud, donde esos registros aportan log S = 0), informa su
   coeficiente como NaN con una nota, cambia el nivel de referencia si fuera el afectado y avisa de EE
   enormes (posible separación). Los demás términos coinciden con R a 1e-9 y con el reajuste sin esos
   registros a la tolerancia de máxima verosimilitud.
2. **Grados de libertad del AIC con un término no estimable (motor).** Al excluir el nivel, el AIC salía
   2 unidades por debajo del de R: R cuenta todos los términos del modelo. Se adoptó ese convenio (el
   máximo de ese término está en el infinito, pero es un parámetro del modelo).
3. **Guion de R:** `predict()` con una sola fila devuelve un vector y la matriz del JSON quedaba
   transpuesta (3 × 1); se fuerza una fila por nivel. El reajuste límite con un solo nivel restante necesita
   un modelo con sólo intercepto (`survreg` no acepta un factor de un nivel).
4. **Prueba:** la comparación relativa del arnés no acepta Inf = Inf (el EE de Greenwood de log Ŝ es
   infinito donde Ŝ = 0); se añadió un comparador que sí.

Fuera de esos casos, Kaplan–Meier, Greenwood, los tres tipos de intervalo, las reglas de la mediana y de
los cuantiles, la media restringida, el log-rank y los cuatro modelos paramétricos coincidieron con R desde
la primera corrida. Se reprodujeron a propósito los convenios de `survfit` (regla del punto medio cuando
Ŝ = ½ en un intervalo, cuantiles de Brookmeyer–Crowley con los límites de la curva, tolerancia √ε,
límites indefinidos en Ŝ = 0 y, en log-log, en Ŝ = 1).

## Convenios que la interfaz debe explicar

- La tabla de Kaplan–Meier tiene una fila por tiempo distinto, también los de sólo censura. El EE de Ŝ y
  los límites `log` no existen donde Ŝ = 0; los `log-log`, tampoco donde Ŝ = 1. Un límite de la mediana o
  de un cuantil NaN significa «no alcanzado».
- La media restringida se integra hasta el último tiempo observado (τ, configurable con `tau`).
- Grupos: el orden de los niveles es el dado o el orden ordenado de sus valores; el primero es la
  referencia. El log-rank omite el primer grupo para invertir la covarianza (el χ² no depende de cuál).
  ρ = 1 pondera con Ŝ(t−) del conjunto (más peso a las fallas tempranas).
- Modelos paramétricos: log T = x'β + σ·W. Los coeficientes son logaritmos de **razones de tiempo**
  (positivo = vida más larga; `timeRatio` da exp(β) con IC). Weibull: forma = 1/σ, escala = exp(x'β);
  su razón de riesgos sería exp(−β/σ). Exponencial: σ = 1. `z` y `p` incluyen al final la fila de
  log(σ) (salvo en la exponencial); `coef` y `se` sólo los términos.
- Tiempos ≤ 0 se excluyen de los modelos paramétricos (no de Kaplan–Meier).
- Un nivel sin eventos: coeficiente NaN, sin cuantiles ni S(t) para él, nota; los demás resultados son los
  del límite.
- Intervalos de cuantiles: método delta en la escala log, transformado (asimétricos).
