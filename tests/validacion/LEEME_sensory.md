# Validación del motor de evaluación sensorial (`js/sensory.js`)

Notas internas de desarrollo. Este documento sí nombra los paquetes de R contra los que se comparó; el motor y sus pruebas no lo hacen.

## Cómo se reproduce

```
"C:/Program Files/R/R-4.4.2/bin/Rscript.exe" tests/validacion/sensory.R
"C:/Program Files/RStudio/resources/app/bin/node/node.exe" tests/run-node.js sensory
```

`sensory.R` (semilla `set.seed(20261004)`) simula todos los conjuntos de datos, llama a los paquetes y escribe `ref_sensory.json` y `ref_sensory.js` con `jsonlite::toJSON(digits = NA, auto_unbox = TRUE, na = "string")`. Versiones: R 4.4.2, sensR 1.5.3, SensoMineR 1.28, FactoMineR 2.11, agricolae 1.3.7, DescTools 0.99.60. Los datos simulados viajan dentro del JSON, así que JS analiza exactamente los mismos datos que R.

Resultado actual: **30 pruebas, 11 657 comparaciones, 0 fallas** (unas 11 340 contra referencias de R y 317 de propiedades). Tarda menos de 2 s.

## Qué se comparó contra qué

| Función de `Sens` | Referencia en R | Casos | Comparaciones |
|---|---|---|---|
| `pc`, `pcDeriv` | `sensR::psyfun`, `sensR::psyderiv` y recálculo preciso con `integrate(rel.tol = 1e-12)` | 5 métodos × 16 valores de d′ | 316 |
| `pc` (barrido fino) | `psyfun` contra el recálculo preciso en d′ = 0.05…8.5 cada 0.005 (3 métodos con integral) | 10 puntos donde el paquete se equivoca > 1e-6 | 22 |
| `dprime` | `sensR::psyinv` y raíz precisa (`uniroot(tol = 1e-14)` sobre la Pc precisa) | 61 | 123 |
| `discrim` | `sensR::discrim` (estimaciones, errores estándar, intervalos, p) con `statistic = "exact"`, `"likelihood"`, `"score"`, `"Wald"`; diferencia y similitud; `pd0` y `d.prime0`; niveles 0.90, 0.95, 0.99 | 375 (225 exactos, 50 de cada otro estadístico); incluye x = 0, x = n y x/n < pGuess | 6 401 |
| `critical` | `sensR::findcr` | 510 (17 tamaños × 2 pGuess × 3 α × 5 hipótesis) | 511 |
| `power` | `sensR::discrimPwr(statistic = "exact")` y `sensR::d.primePwr` | 331 | 565 |
| `sampleSize` | `sensR::discrimSS(statistic = "exact")` y `sensR::d.primeSS` | 74 | 75 |
| `aNotA` | `sensR::AnotA` | 7 | 22 |
| `binomTest`, `preference` | `stats::binom.test` (tres alternativas, dos niveles) | 66 + 10 | 239 |
| `hedonic` | `aov(score ~ product + consumer)`, `anova(lm(score ~ consumer + product))`, `TukeyHSD(…, "product")`, `agricolae::HSD.test` (letras, EE, CV, MSD) | 4 conjuntos: balanceado 5×40, con 15 % de faltantes 6×30, pequeño 3×12 con decimales, α = 0.10 | 302 |
| `jar` | cálculo directo en R: conteos, porcentajes, medias, penalidades y `t.test(var.equal = TRUE)` | 3 conjuntos (5, 3 y 7 niveles; umbral 20 y 25 %) | 290 |
| `cochranQ`, `mcnemar` | `DescTools::CochranQTest`, `stats::mcnemar.test` (con y sin corrección; caso b = c = 0) | 4 + 5 | 33 |
| `cata` | `colSums`, `CochranQTest` por atributo, `mcnemar.test` por par, `p.adjust(…, "holm")`, `FactoMineR::CA` de la tabla de conteos | 40 consumidores × 4 productos × 6 atributos | 301 |
| `ca` | `FactoMineR::CA` (eig, coord, contrib, cos2, inercia) y `chisq.test` | 3 tablas (5×4, 3×6, 7×6) | 419 |
| `friedman` | `stats::friedman.test` y `agricolae::friedman` (χ² con empates, F, LSD de sumas de rangos, letras, p por par) | 4 (puntuaciones con empates, rangos sin empates, muchos empates, α = 0.10) | 141 |
| `qda` | `aov` secuencial por atributo; F mixto (producto contra la interacción); `agricolae::LSD.test` y `HSD.test` con el error de la interacción; `SensoMineR::panelperf(random = TRUE)` (p, DE residual, R², variabilidad) y `SensoMineR::paneliperf` (discriminación, repetibilidad, acuerdo por juez) | 3: 5 prod × 8 jueces × 2 sesiones; 4 × 6 × 3 repeticiones con 6 % de faltantes; sin repeticiones 4 × 10 | 675 |
| `pca` | `FactoMineR::PCA` (estandarizado y sin estandarizar; n < p) | 4 | 905 |
| `williams`, `codes`, `servingPlan` | propiedades (no hay función equivalente que haga falta): cuadrado latino, balance de arrastre de primer orden, códigos únicos de 3 dígitos | t = 1…10 | 118 |

Propiedades además: Pc(0) = pGuess y Pc creciente; d′(Pc(d)) = d; Pc′ contra diferencias centrales; colas de diferencia + similitud = 1 + P(X = x); definición del valor crítico; tamaño de la prueba ≤ α; potencia en el tamaño de muestra > objetivo; simetría de la prueba binomial; Cochran con dos tratamientos = McNemar sin corrección; Friedman sobre 0/1 = Cochran; letras en casos hechos a mano; sumas de cuadrados que suman el total; identidades del AC (χ² = n·Σλ, contribuciones que suman 100, cos² que suman 1) y del ACP.

Signos de los ejes (AC, ACP): están definidos salvo signo. El motor fija un convenio (en cada eje, la columna o variable con la mayor carga absoluta va positiva); las pruebas alinean el signo eje por eje con el producto escalar y aplican **el mismo** signo a filas y columnas (individuos y variables), de modo que se verifica también la coherencia entre ambos.

## Tolerancias y por qué

Las referencias se escriben con 15 cifras significativas (`digits = NA`), así que nada puede compararse por debajo de ~5e-16 relativo. Entre paréntesis, la mayor diferencia medida.

| Qué | Tolerancia | Por qué |
|---|---|---|
| Sumas binomiales e hipergeométricas, Clopper–Pearson, Wilson, Wald, McNemar, Cochran, medias, DE, conteos, penalidades | 1e-12 abs. (1e-10 en cuantiles beta) | aritmética de doble precisión (máx. 1.4e-14) |
| Sumas de cuadrados, F, p de F, AC y ACP | 1e-9 a 1e-10 rel.; contribuciones (escala 0–100) 1e-8 abs. | álgebra lineal (Gram–Schmidt, Jacobi) (máx. 1.2e-13 rel.; 1.6e-12 en contribuciones) |
| Pc(d′) contra el recálculo preciso | 1e-12 | ambos lados integran a ~1e-15 (máx. 2.1e-15) |
| Pc(d′) contra sensR | 1e-8 | sensR evalúa la triangular con una F no central (error de hasta 1e-9) y las otras integrales con `integrate` por defecto (máx. 4.6e-9 fuera de los puntos malos; ver errores) |
| Pc′ contra sensR | 1e-8 | la tétrada usa derivada numérica (`numDeriv`) de una integral aproximada (máx. 6.7e-9) |
| d′ contra la raíz precisa | 1e-8 (1e-7 en extremos de intervalos) | Brent a 1e-14 (máx. 4.9e-13) |
| d′ contra sensR | 2e-4 | sensR invierte con `uniroot` de tolerancia por defecto `.Machine$double.eps^0.25 = 1.22e-4` (máx. 3.0e-5) |
| se(d′) contra sensR | 5e-4 relativo | hereda el error de su d′ por el cociente Pc″/Pc′ (máx. 2.9e-5) |
| Intervalo de verosimilitud contra sensR | 5e-5 | sensR interpola el perfil con `spline` sobre 100 puntos; el motor resuelve las raíces exactas (contra la raíz exacta: 1e-9, máx. 6e-16) (máx. 7.4e-6) |
| p con d′0 contra sensR | 1e-7 (contra el p preciso: 1e-12) | sensR pasa d′0 a pc0 con su Pc aproximada (máx. 1.8e-8) |
| Potencia con dA contra sensR | 1e-7 | ídem, dA → pdA con la Pc aproximada (máx. 1.1e-8) |
| Límites de Tukey y HSD | 1e-6 | `qtukey` de R usa secante con `eps = 1e-4`: se comprobó que sus cuantiles están errados hasta 2e-7 (p. ej. k = 3, gl = 22: 3.5525937857 contra 3.5525939922 de la raíz exacta, que el motor reproduce a 1e-10) (máx. 7.3e-8) |
| p de Tukey | 1e-9 | mismo algoritmo de Copenhaver y Holland en ambos lados (máx. 1.1e-13) |
| se de A–Not A | 1e-6 relativo | `glm` toma los pesos de la última iteración de IRLS (máx. 7.5e-8); d′ a 1e-10 (máx. 7.3e-14) |
| p por par de `agricolae::friedman` | 5e-5 | agricolae los redondea a 4 decimales |
| p(F) de `agricolae::friedman` | 1e-14 abs.; contra `pf(…, lower.tail = FALSE)`: 1e-10 rel. | agricolae calcula `1 - pf(...)` y pierde dígitos cuando p es pequeño (rel. 1.3e-9 en p = 3.8e-8) |
| Letras, valores críticos, tamaños de muestra, gl | exactas | |

## Errores que atrapó la validación

En el motor:

1. **Diseño de Williams con t = 1.** Para t impar se añade el cuadrado espejo; con t = 1 eso daba dos filas `[[0],[0]]`. Lo atrapó la prueba de propiedades; ahora el espejo sólo se añade para t impar > 1.
2. **Derivada de la 3-AFC para d′ grande.** La forma directa Pc′ = ∫(z − d)φ(z − d)Φ(z)² dz se cancela (positivos y negativos casi iguales); el recálculo preciso en R falló con «roundoff error» en d′ = 6 y descubrió el problema. Se cambió, en el motor y en el guion, por la forma integrada por partes Pc′ = 2∫φ(z)φ(z − d)Φ(z) dz, de integrando positivo. Las integrales de las derivadas (3-AFC y tétrada) se centran ahora en d/2, donde está la masa de φ(z)φ(z − d).
3. **`discrim` lanzaba una excepción** con datos no válidos (correctas > total); ahora devuelve NaN con una nota `{es, en}`, como el resto del motor.

En la referencia (no son errores del motor; se documentan porque la interfaz no debe «corregir» hacia esos valores):

4. **Pc de la tétrada y de la 3-AFC en sensR tiene errores locales.** Con `integrate` sobre (−∞, ∞) a la tolerancia por defecto, el barrido fino encontró 10 puntos con error > 1e-6: tétrada −2.84e-4 en d′ = 2.16, ±4–5e-6 en 3.41 y 5.37; 3-AFC +1.21e-4 en d′ = 0.46. También 2.2e-7 en la tétrada para d′ = 6. El motor coincide en todos con el recálculo preciso a 1e-12. Consecuencia visible: en `discrim(12, 20, "tetrad", statistic = "Wald")` el límite superior de d′ de sensR es 2.16093 y el correcto 2.16029 (diferencia 6.4e-4). Las pruebas usan el valor preciso como árbitro cuando la propia referencia se aleja de él más que la tolerancia (3 comparaciones).
5. **d′ de sensR sólo tiene ~4 cifras** (tolerancia de `uniroot` 1.22e-4).
6. **Potencia de similitud sin región de rechazo.** Cuando con n evaluadores la prueba de similitud no puede rechazar (valor crítico −1), `discrimPwr` acota el crítico a 0 y devuelve P(X ≤ 0 | pcA): 0.296 para la triangular con n = 3, 0.125 para el dúo-trío. El motor devuelve 0 (la potencia real); las pruebas verifican ambos valores.
7. **`agricolae` redondea los p a 4 decimales antes de asignar letras** y calcula `1 - pf()`. El motor no redondea; las letras sólo podrían diferir si |p − α| < 5e-5.
8. **`qtukey` de R** tiene errores de hasta 2e-7 (punto ya dicho en tolerancias).

En el guion de R (corregidos antes de fijar las referencias): la simulación CATA podía generar probabilidades negativas (NA); el primer conjunto de Friedman sumaba `outer(rep(0, …))`, es decir, ningún efecto de tratamiento (se cambió a `rep(1, …)` para tener letras distintas). En las pruebas: el total de la tabla de la identidad χ² = n·Σλ estaba escrito a mano y mal.

Sobre `js/num.js`: no se encontró ningún error. `pnorm`, `qnorm`, `pbinom`, `dbinom`, `qbeta`, `pt`, `pf`, `pchisq`, `ptukey` y `glIntegrate` coincidieron con R a ≤ 1e-13; `qtukey` es más exacto que el de R.

## Diferencias de convenio que la interfaz debe explicar

- **pc reportada.** Si x/n < pGuess, pc = pGuess, pd = 0 y d′ = 0 (igual que sensR), con una nota. Los errores estándar sólo existen si pGuess < x/n < 1. Por encima de 1 − ε (ε = 1e-8; 1e-10 en dúo-trío) d′ = ∞.
- **Prueba de similitud** sin `pd0 > 0` (o `d0`): el motor calcula, pero deja una nota (sensR se detiene).
- **Intervalo de verosimilitud**: raíces exactas del perfil (sensR interpola; difieren < 1e-5).
- **Potencia** 0 cuando la prueba de similitud no puede rechazar (sensR da P(X ≤ 0)).
- **Tamaño de muestra**: el menor n por encima de la cota normal inferior cuya potencia exacta supera el objetivo, como sensR («exact»); la potencia exacta es en diente de sierra, así que un n mayor puede tener menos potencia.
- **Hedónica desbalanceada**: la tabla es secuencial con producto primero (como `aov`); `productAdjusted` da el efecto de producto ajustado por consumidor, que es el que conviene interpretar. Tukey–Kramer sobre medias observadas (como `TukeyHSD`). `se` = √(CME/n) (como agricolae); `seSample` = DE/√n.
- **QDA**: con repeticiones, producto contra la interacción producto × juez (juez aleatorio, como `panelperf(random = TRUE)`) y las comparaciones de medias usan ese mismo error. Sin repeticiones no hay interacción y todo va contra el residual. Las medias del panel para el acuerdo son el promedio de las medias de celda juez × producto (coinciden con `averagetable` del modelo con interacción también con faltantes).
- **Letras**: algoritmo secuencial de agricolae, que no siempre da el conjunto mínimo de letras.
- **CATA**: Cochran y McNemar usan sólo consumidores que probaron todos los productos; McNemar con corrección de continuidad (sólo si b ≠ c); Holm dentro de cada atributo; los atributos nunca marcados se excluyen del AC.
- **JAR**: con número par de niveles hay que dar `center`. Los p de penalidad son NaN si el grupo o el grupo JAR tienen menos de 2 consumidores.
- **Signos de los ejes** de AC y ACP: convenio propio (ver arriba); otros programas pueden mostrar ejes reflejados.
- **Williams**: productos numerados 0…t−1; con t impar hay 2t órdenes. El plan está balanceado sólo si el número de evaluadores es múltiplo del número de filas (`plan.balanced`, nota).
