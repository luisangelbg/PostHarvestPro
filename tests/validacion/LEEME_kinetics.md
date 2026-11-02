# Validación del motor de cinética y vida de anaquel (`js/kinetics.js`)

Guion: `tests/validacion/kinetics.R` (R 4.4.2; paquetes `stats`, `minpack.lm` 1.2.4 y `jsonlite` 2.0.0).
Escribe `ref_kinetics.json` y `ref_kinetics.js`; las pruebas están en `tests/unit_kinetics.js`.

```
"C:/Program Files/R/R-4.4.2/bin/Rscript.exe" tests/validacion/kinetics.R
"C:/Program Files/RStudio/resources/app/bin/node/node.exe" tests/run-node.js kinetics
```

## Qué se comparó y contra qué

| Motor | Referencia en R | Conjuntos |
|---|---|---|
| `Kin.fit(…, {method: 'nls'})`, órdenes 0, 1 y 2: C0, k, EE, IC de Wald (t de Student), vcov, RSS, σ, gl, AIC, AICc, BIC, r², ajustados, residuos, vida media | `stats::nls` con el gradiente analítico de `stats::deriv` y `tol = 1e-8`; `AIC()`, `BIC()`; cuando Gauss–Newton se atasca, `minpack.lm::nlsLM` con el mismo gradiente (3 de 159 ajustes) | 13 diseñados (3 órdenes × ruido 1 % y 5 % × atributo que baja y que sube, más uno pequeño de 6 puntos) + 40 aleatorios de estrés (5–20 tiempos irregulares, ruido 0.5–15 %), cada uno ajustado con los tres órdenes: 159 ajustes |
| `predictCI(t)`: media ajustada y su IC por el método delta | `deriv()` (gradiente exacto) con `vcov(nls)` | los mismos 159 ajustes, 2–3 tiempos cada uno |
| `Kin.timeToLimit`: t_L, EE, IC | `nls` **reparametrizado con t_L como parámetro** (su EE de Wald es exactamente el del método delta: comprobación independiente de las derivadas) | 159 |
| `Kin.fit(…, {method: 'linear'})`: regresión de C, ln C y 1/C contra t, C0 y k retransformados, IC transformados extremo a extremo | `stats::lm`, `confint`, `AIC` | 159 |
| `Kin.compare`: AIC, ΔAIC, pesos de Akaike, mejor orden | `AIC(nls)` y la fórmula de los pesos | 53 |
| `Kin.arrhenius` (T_ref = media armónica o 25 °C; ponderado con EE de k): Ea, EE, IC, k_ref, ln A, r², σ, predicción de k(T) con IC de la media y de predicción, Q10 a cada T | `lm(log(k) ~ I(1/T − 1/Tref))`, con `weights = k²/EE²`; `predict(…, interval = "confidence" / "prediction", se.fit = TRUE)` | 3 |
| `Kin.q10`, `Kin.q10FromEa` | fórmula directa en R | 4 |
| `Kin.belehradek` (raíz cuadrada de Ratkowsky): b, Tmin, EE de Tmin por el método delta, IC, predicción | `lm(sqrt(k) ~ T)` y `nls(sqrt(k) ~ b·(T − Tmin))` (el EE de Tmin de nls es el del delta); `predict(lm, interval = "confidence")` | 1 (13 temperaturas) |
| `Kin.aslt` (Arrhenius y Q10, a 5 y 20 °C): estimación, intervalo de **predicción**, IC de la media, Ea, Q10, pendiente | `lm(log θ ~ 1/T)` y `lm(log θ ~ T)`, `predict(…, interval = "prediction")` | 4 |
| `Kin.shelfLifeAt`: ajustes de orden 1 a cuatro temperaturas + Arrhenius (sin y con pesos) → k(T), θ(T) e intervalos | `nls` por temperatura, `lm` ponderado y `predict` | 2 |

**Comparaciones contra R: 17 970** (de 18 932 en el área; las otras 962 son casos de libro y propiedades,
entre ellas 900 de la prueba de robustez: 300 conjuntos con hasta 25 % de ruido, cada orden debe
terminar convergido en un mínimo: ningún paso de 1e-4 en C0 o k reduce la suma de cuadrados).

## Tolerancias y por qué

- **Estimaciones no lineales** (C0, k, t_L): relativa 1e-7 o una millonésima de su error estándar, lo que
  sea mayor. La referencia se detiene cuando el desplazamiento relativo de Bates y Watts baja de 1e-8
  (queda a unas centésimas de millonésima de EE del óptimo); el motor, por debajo de 1e-11. Observado:
  como mucho 5e-8 EE (1.4e-8 relativo, en un k cuyo EE es el 65 % de su valor). Valores ajustados y
  medias predichas: relativa 1e-7.
- **Errores estándar, covarianzas e intervalos que los usan**: relativa 1e-6. Se evalúan en dos puntos
  finales ligeramente distintos y el jacobiano cambia a primer orden con ellos. Observado: ≤ 3e-8.
  Los límites t ± q·EE se comparan con una tolerancia proporcional a la semiamplitud (un límite puede
  estar cerca de 0 y la cancelación haría inútil la tolerancia relativa).
- **RSS, σ, AIC, BIC, r²**: la RSS es plana en el óptimo; relativa 1e-9, AIC absoluta 1e-7. Observado: 1e-14.
- **Regresiones lineales** (linealizadas, Arrhenius, raíz cuadrada, ASLT): mínimos cuadrados cerrados en
  ambos lados: relativa 1e-9 (1e-8 en lo que pasa por el cuantil t, que ambos calculan por iteración).
- **Q10**: fórmula cerrada, relativa 1e-13.

## Errores que atrapó la validación

1. **Referencia con derivadas numéricas (guion de R).** `nls` con la fórmula tal cual usa diferencias
   hacia adelante: con `tol = 1e-10`, 11 de 39 ajustes terminaban en «factor de paso reducido por debajo
   de minFactor» y sus EE sólo tienen ~7 cifras. Se le dio el gradiente analítico (`deriv`) y `tol = 1e-8`;
   desde entonces todos convergen.
2. **Gauss–Newton atascado cerca del polo del orden 2 (referencia).** Para datos crecientes de orden 1
   ajustados con orden 2 (`o1-up-0.01`) y en dos conjuntos de estrés (`stress-08`, `stress-37`), `nls`
   no converge ni desde el óptimo. Se usa `minpack.lm::nlsLM` (Levenberg–Marquardt) con el mismo
   gradiente, marcado `via = "levenberg-marquardt"`; el motor (también Levenberg–Marquardt) converge
   en los tres y coincide a 1e-9.
3. **Guion de R:** asignar `NULL` a un elemento de lista lo borra y corría los órdenes; se usa
   `x[i] <- list(NULL)`.
4. **Prueba:** el valor «de libro» Ea ≈ 51.16 kJ/mol para Q10 = 2 entre 20 y 30 °C estaba mal calculado a
   mano; el correcto es 51.22 kJ/mol (el motor estaba bien).
5. **Prueba:** en `stress-36` el límite inferior del IC de t_L vale −0.69 y la tolerancia relativa sobre él
   era injusta (diferencia 1e-6 por cancelación). La tolerancia de los límites ahora escala con la
   semiamplitud.

En el motor mismo la validación no encontró diferencias: coincidió con R desde la primera corrida. Para no
depender de un criterio de convergencia laxo, el motor usa su propio Levenberg–Marquardt con jacobiano
analítico y el criterio de Bates y Watts, en lugar de `Num.levMar`, que declara `converged: true` cuando
ningún paso reduce la suma de cuadrados aunque el gradiente no sea cero (por ejemplo, residuos no
definidos más allá de una frontera, como el polo del orden 2).

## Convenios que la interfaz debe explicar

- k > 0: el atributo baja; k < 0: sube. La vida media sólo existe con k > 0 (NaN si no).
- Con `method: 'linear'`, r², σ, RSS y AIC son los de la escala transformada (y, ln y, 1/y), como en el
  método clásico: **no** son comparables entre órdenes. `Kin.compare` elige el orden por el AIC de los
  ajustes no lineales en la escala original y da al lado el r² de las rectas.
- El orden 2 con k < 0 tiene un polo en t = −1/(C0·k): más allá el modelo no existe (NaN).
- El IC de t_L es de Wald (simétrico) y puede tener límite inferior negativo con datos muy ruidosos.
- `Kin.shelfLifeAt` propaga sólo la incertidumbre de k(T) (no la de C0); con varias temperaturas, C0 es
  la media de los C0 ajustados salvo que se indique.
- Arrhenius: T_ref por omisión es la media armónica de las temperaturas (en K); los pesos con EE son
  k²/EE² (método delta sobre ln k); el intervalo de predicción supone peso 1 para la observación nueva.
- ASLT: la estimación es exp(media de ln θ) (media geométrica) y su intervalo es de **predicción**; se
  avisa cuando la temperatura objetivo cae fuera de las ensayadas (extrapolación).
