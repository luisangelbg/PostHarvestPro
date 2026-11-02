# Validación del núcleo numérico (`js/num.js`)

Guion: `num.R` (R 4.4.2; `stats`, `mvtnorm`, `jsonlite`). Pruebas: `tests/unit_num.js`. **6 pruebas, 534 comparaciones, 0 fallas.**

| Función | Referencia | Casos | Tolerancia y por qué |
|---|---|---|---|
| `qt`, `qchisq` | `qt`, `qchisq` | 7 probabilidades × 6 gl (incluye 1 y 2.5) | relativa 1e-9 (Newton protegido por bisección; R da ~1e-15) |
| `qf`, `qbeta` | `qf`, `qbeta` | 36 y 36 | relativa 1e-9 |
| `pbinom` (ambas colas), `dbinom`, `qbinom` | `pbinom`, `dbinom`, `qbinom` | 30 + 18 | relativa 1e-10 (por la beta incompleta); exacta en cuantiles |
| `ptukey` | `ptukey` | q ∈ {0.5, 1, 2, 3, 4.5, 7}, k ∈ {2, 3, 5, 10, 20}, ν ∈ {2, 5, 10, 30, 120} | absoluta 1e-7: mismo algoritmo de integración, mismos nodos |
| `qtukey` | `qtukey` | 60 | relativa 1e-4: la referencia busca con secante y se detiene en ~1e-4 |
| `qDunnett`, `pDunnett` | `mvtnorm::qmvt`, `pmvt` con correlación de un factor | 4 diseños (iguales y desiguales) × bilateral y unilateral | absoluta 2e-3 en cuantiles y 5e-4 en p: la referencia integra de forma aleatorizada (Genz–Bretz) |
| `lm` | `lm` (coeficientes, EE, R², σ) | 1 (cuadrático) | 1e-10 |
| `mat.eigSym`, `mat.svd` | `eigen`, `svd` | matriz 5×5 y 6×4 | 1e-10 |
| `levMar` | `nls` (exponencial) | 1 | 1e-6 en coeficientes, relativa 1e-9 en la suma de cuadrados |
| `padjust` | `p.adjust` (holm, BH, hochberg, bonferroni) | 5 p | 1e-14 |
| `integrate`, `glIntegrate`, `brent`, `nelderMead`, `mat.chol`, `mat.solve` | valores exactos escritos en la prueba | 7 | 1e-12 a 1e-5 (Nelder–Mead) |

## Errores atrapados

- **`ptukey`** (código heredado de otra app de la suite): el corte final de `wprob` era exp(−30/k) en lugar de exp(−30), y el inicial no aplicaba exp(−50/k). Con k ≥ 5 y q pequeño anulaba probabilidades reales: ptukey(1, 10, 5) daba 0 en lugar de 0.00233, y qtukey(0.95, 10, 5) daba 7.0026 en lugar de 6.9947. Corregido; ahora coincide con R a 1e-7 en toda la rejilla.
- **`levMar`** (lo encontró la validación de cinética): declaraba convergencia cuando ningún paso reducía la suma de cuadrados, aunque el gradiente no fuera cero. Ahora la declara sólo si el gradiente es casi nulo.
