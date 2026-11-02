# Validación del motor de ensayos (`js/trials.js`)

Guion: `trials.R` (R 4.4.2; `stats`, `car`, `multcomp`, `emmeans`, `agricolae`, `jsonlite`). Pruebas: `tests/unit_trials.js`. **6 pruebas, 228 comparaciones, 0 fallas.**

| Motor | Referencia | Conjunto | Tolerancia |
|---|---|---|---|
| `Trial.factorial`, tipos I y III, completamente al azar | `anova(lm)` y `car::Anova(type = 3)` con `contr.sum` | mango (días comunes a las tres temperaturas), balanceado y sin 7 filas | gl exactos; SC y F relativa 1e-9; p relativa 1e-6 |
| `Trial.factorial` en bloques | ídem con el bloque en el modelo | simulado 4 bloques × 3 × 3 | ídem |
| `Trial.compare` Tukey–Kramer | `TukeyHSD` | una vía balanceada (4 × 6) y desbalanceada (sin 4 filas) | diferencias 1e-10; límites 1e-5 (cuantil de R a ~1e-4 relativo); p 1e-6 |
| LSD y Bonferroni | `pairwise.t.test(pool.sd = TRUE)` | ídem | 1e-9 |
| Dunnett bilateral y unilateral, tamaños iguales y desiguales | `multcomp::glht(mcp(g = "Dunnett"))` | ídem | 2e-3 (la referencia integra de forma aleatorizada) |
| Letras | `agricolae::HSD.test` | balanceado | la misma relación «comparten letra» para cada par |
| `Trial.repeated`: SC, F y p de tratamiento, tiempo e interacción | `aov(y ~ trt * tiempo + Error(fruto))` | chayote, pérdida de peso días 5–25 | relativa 1e-9 (p 1e-6) |
| épsilon de Greenhouse–Geisser y Huynh–Feldt (corrección de Lecoutre), p corregidos, W de Mauchly y su p | `anova.mlm(X = ~1, test = "Spherical")`, `mauchly.test` y la fórmula con la covarianza residual | ídem | 1e-10 en ε y W, 1e-8 en p de Mauchly |
| `Trial.slopes`: rectas por tratamiento, F de pendientes iguales y de interceptos, pares de pendientes y Holm | `lm`, `anova(paralelas, separadas)`, `emmeans::emtrends` + `pairs(adjust = "none")` + `p.adjust("holm")` | chayote, todos los días | 1e-12 en coeficientes, 1e-9 en F, 1e-6 en p |
| `Trial.fieldBook` | propiedades (tamaños, balance por bloque, misma semilla = mismo libro, unidades de medidas repetidas) | 4 casos | exacta |

## Notas

- Para las medidas repetidas, los tiempos en que todas las unidades valen lo mismo (pérdida de peso del día 0) no aportan nada y vuelven singular la covarianza. La app los deja fuera y lo avisa; la referencia también los excluye.
- Dentro de cada tiempo, las parcelas divididas usan el error combinado (Ea + (b − 1)Eb)/b con los grados de libertad de Satterthwaite: es el error clásico de Steel, Torrie y Dickey (1997) para comparar tratamientos a un tiempo fijo.
