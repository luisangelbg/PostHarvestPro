# Validación de color, calidad, respiración, pérdidas y logística

Guion de R: `color_losses.R` (R 4.4.2; `farver`, `grDevices`, `stats`, `jsonlite`). Pruebas: `tests/unit_quality.js` (áreas `color`, `quality`, `resp`, `losses`, `logistics`). **13 pruebas, 1 203 comparaciones, 0 fallas.**

## Color (`js/color.js`) — 1 100 comparaciones

| Qué | Referencia | Tolerancia y por qué |
|---|---|---|
| sRGB → CIELAB (D65, 2°), 66 colores, incluidos blanco, negro y primarios | `farver::convert_colour` | 0.02 unidades: la norma da la matriz sRGB con 4 decimales (la app la usa así, y su inversa exacta), las bibliotecas con más |
| ΔE*ab y LCh | fórmula directa en R | 1e-9 |
| ΔE94 y ΔE00 en 40 pares | `farver::compare_colour` | 1e-5 (la biblioteca trabaja en precisión simple en algún paso) |
| ΔE00 en los 22 pares de prueba publicados por Sharma, Wu y Dalal (2005), en los dos órdenes | valores del artículo (4 decimales) | 5e-5 |
| Ida y vuelta sRGB → Lab → sRGB (216 colores), hexadecimal, detección de colores fuera de la gama, índices (CCI, a*/b*, pardeamiento, tono) | valores exactos escritos en la prueba | 1e-6 a 1e-12 |

**Referencias descartadas**: `grDevices::convertColor` difiere hasta 0.3 unidades de a* en la misma conversión (otro blanco de referencia y otra matriz); el método «euclidiano» de `farver::compare_colour` no mide la distancia en Lab. Ninguna de las dos mide lo mismo que la definición de CIE, así que no se usan.

## Calidad (`js/quality.js`) — 22 comparaciones

Acidez titulable con y sin dilución, conversión entre ácidos, SST/AT, BrimA, humedad en base húmeda y seca, materia seca, conversión de fuerza y presión del émbolo, pérdida de peso y su tasa (por el origen), índice de McKinney, incidencia, fruta comercializable, calibres y clases por cuenta de caja: cada valor esperado está calculado a mano en la prueba (tolerancia 1e-9 a 1e-12).

## Respiración y atmósferas (`js/resp.js`) — 19 comparaciones

Tasas en sistema estático (mL y mg de CO₂, O₂, cociente respiratorio, etileno) y de flujo continuo, calor de respiración (10.67 J/mg CO₂), atmósfera de equilibrio y espesor que alcanza el O₂ objetivo (se comprueba que el espesor calculado da exactamente ese O₂), recta β, respiración de Michaelis–Menten (el resultado satisface los dos balances), tiempos de medio y siete octavos de enfriamiento en una curva exponencial exacta, calor específico de Siebel y carga de refrigeración. Clasificación climatérica del ejemplo de aguacate y de una curva plana. Tolerancias de 1e-6 a 1e-12.

## Pérdidas y daño mecánico (`js/losses.js`) — 35 comparaciones

- Cadena (pérdidas por % y por kg, índice, valor, Pareto) y simulación: a mano, 1e-12.
- Curvas de daño lineal, cuadrática, de potencia y exponencial (coeficientes, EE, R², AIC) contra `lm`: 1e-9.
- Regresión logística contra `glm(family = binomial)` con convergencia de 1e-14: coeficientes, EE y devianza a 1e-6. Dosis del 50 % y del 10 % con el intervalo de Fieller, cuyas raíces se escribieron en R: 1e-5.

**Error atrapado**: el motor calculaba la covarianza de la logística con los pesos de la iteración anterior a la convergencia; los errores estándar diferían de R en ~2·10⁻⁵ relativo. Ahora se recalcula en las estimaciones finales. Al comparar se vio además que `glm` se detiene con su criterio de 1e-8, así que la referencia se corrió con 1e-14.

## Logística (`js/logistics.js`) — 27 comparaciones

- Presión de saturación a 0, 5, 20 y 30 °C sobre agua y a −10 °C sobre hielo, contra las tablas de ASHRAE (2017, cap. 1): relativa 2e-4 (las tablas tienen 4 decimales).
- Razón de humedad a saturación (exacta con el gas ideal; 0.6 % contra la tabla, que incluye el factor de mejora del aire húmedo real).
- Punto de rocío y bulbo húmedo a saturación (iguales al bulbo seco, 1e-9) y a 25 °C y 50 % (13.86 °C y 17.9 °C).
- Pérdida de agua, cajas por cama (40 × 30 en tarimas de 120 × 100 y 120 × 80), camas limitadas por peso, área de orificios, conversiones y costo: a mano.
- Compatibilidad (manzana con lechuga, plátano con lechuga, lechuga con brócoli): reglas.

**Cambio por la validación**: la saturación usaba las ecuaciones de Hyland y Wexler (1983). Se apartaban hasta 0.02 % de las tablas de 2017, calculadas con la formulación IAPWS. Ahora se usan las ecuaciones de Wagner y Pruss (2002) sobre agua y de Wagner et al. (2011) sobre hielo.
