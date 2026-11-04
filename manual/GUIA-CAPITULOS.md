# Guía para escribir los capítulos del manual de PostHarvestPro

Encargo breve para quien escriba los capítulos 1 a 9 y los apéndices. Antes de empezar, lee `LEEME.md` (carpetas,
herramientas, colores), mira `es/00b-introduccion.html` (el índice general ya trae los títulos y los `id` propuestos,
y la introducción ya dice lo general —la entrada de datos, la interfaz, los diez ejemplos, la validación—: no lo
repitas) y, como modelo de forma y de tono, los capítulos de PalynoPro (`..\..\PalynoPro\manual\es\03-bloque3.html`)
y de ForestPro (`..\..\ForestPro\manual\es\`), que tiene, como esta app, bloques con varias pestañas y ejemplos por
pestaña. La **fuente de contenido** es la app misma: **comprueba cada cifra y cada texto en ella** (ver el
capítulo 3).
Todo en español, de tú, en lenguaje llano y con precisión técnica.

## 0. Regla: sólo los datos de ejemplo simulados

Todas las capturas y todas las cifras salen de los diez conjuntos de ejemplo (`ejemplo(clave)` en
`recetas/_comun.js`) o de los valores que traen escritos las herramientas sin entrada de datos. Son simulados:
«el mango del ejemplo», «el chayote del ejemplo», «el café Honey del ejemplo», nunca como un lote o un panel reales.
Ninguna receta abre archivos del disco.

## 1. Las partes y lo que hay en cada bloque

Los títulos de sección (h2) son una propuesta; los rótulos entre comillas son los de la app y se citan **exactamente**
como aparecen en pantalla en español. El subtítulo de cada bloque es el que muestra la app bajo su título. Las
pestañas se abren con `herramienta(n, 'id')`; las que tienen ejemplo, con `ejemplo('clave')`. Las cifras de abajo
salen de la app con los valores por omisión (2 nov 2026); vuelve a comprobarlas en tu captura.

Lo común a todas las tarjetas de resultados: mosaicos (`.results-summary`), la lectura en palabras, figuras con
botones SVG/PNG y ✎, tablas con `⤓ CSV` y `⤓ XLSX`, y la línea «Método y fuente:». Explícalo una vez en el capítulo 2
(2.1) y después sólo remite.

### Capítulo 1 · Inicio (`01-bloque1.html`, `--b1`, sin ejemplo)

Portada: rótulo «Fisiología y tecnología poscosecha», título «Mide la calidad, predice la vida de anaquel y decide con
datos», botones «Empezar con un ejemplo →» (abre Bloque 2 › Resumen de calidad con el mango), «Ver los datos de
ejemplo», «Métodos y fuentes», «Cómo citar»; cuatro insignias («Funciona completo en tu navegador», «Validado contra
implementaciones independientes», «Español e inglés», «Figuras SVG y PNG a 300 ppp»); la ilustración (`Art`, cinco
estados de madurez —Verde maduro, Rayado, Pintón, Maduro, Sobremaduro— y la firmeza a 13, 20 y 25 °C con su
«límite comercial»).

| h2 propuesto | Lo que lleva | Capturas sugeridas |
|---|---|---|
| 1.1 La portada | lo de arriba; qué hace cada botón | `b1-heroe` (ilustración y botones) |
| 1.2 Cómo funciona: la ruta en siete pasos | Medir, Modelar, Respirar, Cuantificar, Evaluar, Comparar, Publicar (la introducción ya trae `i-flujo`: aquí basta remitir y explicar la ruta del producto) | — |
| 1.3 Los nueve bloques | las ocho tarjetas (2–9) con su etiqueta (Medir, Predecir, Controlar, Cuantificar, Evaluar, Comparar, Planear, Publicar) y su dibujo | `b1-bloques` |
| 1.4 Datos de ejemplo | las diez tarjetas, «Abrir en …», «⤓ CSV»; remite a la tabla de I.7 | — (ya está `i-ejemplo`) |
| 1.5 Métodos y fuentes | las 28 tarjetas de `Refs.METHODS` por bloque | `b1-metodos` |
| 1.6 La poscosecha en breve | los 9 desplegables de `THEORY` (madurez fisiológica y de consumo; climatéricos; cinética; Arrhenius y Q10; vida de anaquel y rechazo; atmósferas; el agua; pérdidas; medir con personas) | `b1-teoria` (el primero abierto) |
| 1.7 Lo que no hace | las 4 tarjetas (la introducción ya las tabula: aquí, con más detalle o remitiendo) | — |
| 1.8 Referencias y cómo citar | «Ver las 78 referencias», «Cómo citar» con «Copiar la cita» y «Copiar BibTeX»; con el DOI de concepto | `b1-cita` |

### Capítulo 2 · Calidad y madurez (`02-bloque2.html`, `--b2`)

Subtítulo: «Índices de calidad, color CIELAB, calculadoras de laboratorio, escalas y calibres». Pestañas: «Resumen de
calidad» (`calidad`), «Color» (`color`), «Acidez, humedad y firmeza» (`calc`), «Escalas de madurez y daño»
(`escalas`), «Calibres» (`calibres`).

| h2 propuesto | Tarjeta, controles y ejemplo | Capturas |
|---|---|---|
| 2.1 La entrada de datos de cada herramienta | la franja del ejemplo (nombre, sello «SIMULADO», descripción, «Cargar ejemplo», «⤓ CSV del ejemplo»), «Abrir archivo (CSV, TXT, XLSX, ODS)», «Pegar una tabla», «…o suelta aquí el archivo», el selector de hoja, los papeles con «(opcional)» y «— ninguna —», «Ver los datos (72 × 13)», mensajes de columnas que faltan; y lo común de los resultados | `b2-entrada` |
| 2.2 Resumen de calidad | «Datos del ensayo» (`ejemplo('b2q')`): Grupo, Tiempo, Sólidos solubles (°Brix), Acidez titulable (%), L*, a*, b* (todos opcionales) y «Atributos para resumir». «Resumen por grupo y tiempo»: «Mostrar» (media ± DE / ± EE / IC 95 %), «Variable de la figura». Ejemplo: 72 observaciones, 3 grupos, 8 tiempos, 11 variables; la firmeza pasa de 115.8 a 31.95 N a 13 °C (−72.4 %), de 129.4 a 21.70 a 20 °C, de 121.5 a 4.75 a 25 °C (−96.1 %); figura `b2-calidad` | `b2-calidad` |
| 2.3 Color: conversor e índices | «Conversor de color»: L*, a*, b*, R, G, B, Hexadecimal, Elegir; valores de partida L* 62, a* 8, b* 48 = #BA8F3E: C* 48.66, h° 80.5° (amarillo), a*/b* 0.167, CCI 2.69, BI 138.8, WI 38.3, YI 110.6, TCI 5.3; aviso de fuera de gama | `b2-conversor` |
| 2.4 Diferencia entre dos colores y el color de tus datos | «Diferencia entre dos colores» (L* 64, a* −11, b* 36 contra 67, 9, 52): ΔE*ab 25.79, ΔE94 14.66, ΔE00 15.45, ΔL* 3.00, ΔC* 15.13, ΔH° −26.8; «Usar el color del conversor como color 2»; umbrales orientativos. «El color de tus datos» (`ejemplo('b2c')`): figuras `b2-tira-color`, `b2-deltaE`, `b2-tono`; a 13 °C el tono baja de 109.2° a 79.8° y ΔE00 llega a 16.96 el día 21 | `b2-diferencia`, `b2-color-datos` |
| 2.5 Acidez, humedad, firmeza y pérdida de peso | cuatro calculadoras con valores escritos: acidez (NaOH 8.2 mL, 0.1 N, muestra 10, cítrico, 14.5 °Brix → 0.525 %, SST/AT 27.6, BrimA 13.45; como otros ácidos: málico 0.549 %…); humedad (32.415 / 37.418 / 33.212 g → 84.07 % b.h., materia seca 15.93 %, 527.7 % b.s.); firmeza (12.5 kgf, émbolo 8 mm → 122.58 N, 27.558 lbf, 2438.7 kPa); pérdida de peso (312.4 → 298.7 g en 9 d → 4.39 %, 0.487 % d⁻¹) | `b2-calculadoras` |
| 2.6 Escalas de madurez y daño | «La escala» (plantillas «Daño 0–4», «Madurez 1–5», «Pudrición 0–3»; «Tolerancia comercial (clase máxima aceptada)» = 1), «Los datos» (`ejemplo('b2g')`: la antracnosis del mango; o «…o escribe conteos por lote» y «Usar los conteos»), «Índices de la escala»: 18 lotes o grupos, 72 unidades, mayor índice 50.0 (25 °C · día 12), comercializable de 50.0 % a 100.0 %; figuras `b2-escala`, `b2-indice`; McKinney | `b2-escalas` |
| 2.7 Calibres | «Las clases» (plantillas «Por peso (g)», «Frutos por caja de 4 kg», «Por diámetro (mm)»), «Los frutos» (`ejemplo('b2k')`: peso inicial del mango), «Distribución por calibre»: 72 frutos, media 298.9 g (DE 36.8), más frecuente Grande (59.7 %), Mediano 36.1 %, Extra grande 4.2 %, 0 fuera de las clases; figura `b2-calibres` | `b2-calibres` |

Fórmulas: SST/AT, BrimA = SST − 2·AT (Jordan et al. 2001), acidez = V·N·meq·(aforo/alícuota)·100/muestra, C* y h°,
CCI = 1000·a*/(L*·b*), McKinney = 100·Σ(clase·n)/(N·clase máx.).

### Capítulo 3 · Cinética y vida de anaquel (`03-bloque3.html`, `--b3`)

Subtítulo: «Órdenes de reacción, temperatura, pruebas aceleradas y tiempo hasta el rechazo». Pestañas: «Modelos
cinéticos» (`cinetica`), «Temperatura» (`temperatura`), «Prueba acelerada» (`aslt`), «Tiempo hasta rechazo»
(`rechazo`).

| h2 propuesto | Tarjeta, controles y ejemplo | Capturas |
|---|---|---|
| 3.1 Modelos cinéticos: los tres órdenes | «Datos» (`ejemplo('b3k')`): Tiempo `dia`, Atributo `firmeza_N`, Grupo `temperatura`; «Orden» (El de menor AIC), «Método» (No lineal (escala original) / lineal), «Límite de aceptación» 25 («vacío: sin límite»), «Confianza» 95 %. Tabla «Los tres órdenes» (k, SCE, AIC, ΔAIC, peso de Akaike, R² linealizado): a 13 °C el primer orden pesa 0.971 | `b3-ordenes` |
| 3.2 Ajuste y vida al límite | mosaicos: 3 grupos, Primer orden por AIC, R² medio 0.969, vida al límite 25.9 · 10.4 · 6.3; tabla: 13 °C C₀ 121.9, k 0.06119 [0.0557, 0.0666], vida media 11.33, 25.89 [24.00, 27.78]; 20 °C k 0.1569, 10.36 [9.24, 11.47]; 25 °C k 0.2508, 6.33 [5.90, 6.76]; figura `b3-cinetica`; «Llevar las k al análisis de temperatura →» | `b3-cinetica` |
| 3.3 Temperatura: Arrhenius, Q10 y raíz cuadrada | «Constantes de velocidad a varias temperaturas» (tabla editable; «Ponderar por el error estándar de k», «Temperatura de referencia (°C)» 20). **Ojo:** la pestaña abre con k escritas de antemano (0.0622, 0.1494, 0.2765) que no son las del ajuste: dan Eₐ 88.1 kJ/mol [80.6, 95.7], Q10 3.50 y 3.43, Tmín 2.4 °C. Con «Llevar las k…» desde 3.1 salen Eₐ ≈ 84.2 kJ/mol y Q10 ≈ 3.8 (13→20 °C) y 2.6 (20→25 °C), las del manual viejo. Usa en el texto el flujo con «Llevar las k» y comprueba sus cifras en la app. Figuras `b3-arrhenius`, `b3-k-temperatura` | `b3-arrhenius` (después de «Llevar las k») |
| 3.4 Vida de anaquel a cualquier temperatura | «Orden», «Valor inicial C₀», «Límite», «Temperatura de almacén (°C)» 10, «Intervalo» (De la media / de predicción); mosaicos con el aviso «extrapolación · fuera de 13–25 °C»; figura `b3-vida-temperatura` | `b3-vida-temperatura` |
| 3.5 Prueba acelerada | «Vidas de anaquel a temperaturas altas» (tabla escrita), «Modelo» (Arrhenius (ln θ contra 1/T) / Q10), «Temperatura de almacén» 20 °C → 13.3 [9.0, 19.5], Q10 2.69, Eₐ 73.2 kJ/mol, R² 0.9761; figura `b3-aslt`; supuesto de Mizrahi (2004) | `b3-aslt` |
| 3.6 Tiempo hasta el rechazo: Kaplan–Meier | «Datos» (`ejemplo('b3s')`: tiempo, estado 1/0, tratamiento), «Intervalo de Kaplan–Meier» (Logarítmico), «Modelo paramétrico» (El de menor AIC), «Rechazo tolerado (%)» 10. Mosaicos: 90 frutos, 75 rechazados (83.3 %), 15 censurados, rango logarítmico χ² = 22.48, p < 0.001 (gl 2). Tabla: medianas KM 18.0, 26.5 y 29.5 d [23.0, ∞]; figura `b3-kaplan-meier` | `b3-kaplan-meier` |
| 3.7 Modelos paramétricos y razones de tiempos | Weibull (AIC 581.92, peso 0.916) contra log-normal, log-logística, exponencial; 10 % rechazado: Testigo 8.4 [6.6, 10.7], Cera vegetal 11.7, Quitosano 14.0; razones de tiempos 1.391 [1.129, 1.714] y 1.671 [1.333, 2.094] | `b3-parametricos` |

### Capítulo 4 · Respiración, etileno y atmósferas (`04-bloque4.html`, `--b4`)

Subtítulo: «Tasas de respiración, climaterio, empaque en atmósfera modificada y preenfriamiento». Pestañas: «Sistema
estático» (`estatico`), «Flujo continuo» (`flujo`), «Climaterio» (`climaterio`), «Atmósfera modificada» (`map`),
«Preenfriamiento y carga térmica» (`enfriamiento`).

| h2 propuesto | Tarjeta, controles y ejemplo | Capturas |
|---|---|---|
| 4.1 Sistema estático | «Lecturas en frasco cerrado» (`ejemplo('b4s')`): masa 0.65 kg y volumen 3.8 L si no hay columna, densidad 1, 20 °C, 101.325 kPa. Mosaicos: CO₂ 59.4 mg kg⁻¹ h⁻¹ (± 3.2, 3 frascos), 32.5 mL, O₂ 35.0, CR 0.93, etileno 0.597 µL kg⁻¹ h⁻¹ (clase baja), 176 W/t; tabla por frasco (R² > 0.999); figuras `b4-co2`, `b4-o2` | `b4-estatico` |
| 4.2 Flujo continuo | «Cámaras con flujo de aire» (tabla escrita, 3 cámaras, 20 °C): CO₂ 29.8 mg, O₂ 17.1 mL, CR 0.95, etileno 1.340 | `b4-flujo` |
| 4.3 Climaterio | «Curvas de respiración y etileno» (`ejemplo('b4c')`): «Alza respiratoria mínima (×)» 1.5, «Alza de etileno mínima (×)» 10, «Etileno pico mínimo» 1. Resultado: Climatérico, alza × 3.14 (42.3 → 133.0), pico de respiración el día 6, de etileno 83.22 el día 7 (× 554.8); figuras `b4-respiracion`, `b4-etileno-curva` | `b4-climaterio` |
| 4.4 Atmósfera modificada: producto y empaque | «Producto y empaque»: Producto (ventana recomendada) Aguacate 2–5 % O₂ y 3–10 % CO₂, consumo de O₂ 4, CR 0.9, 0.5 kg, bolsa 30 × 25 cm, 8 °C, «Película» Polietileno de baja densidad, 40 µm, «Respiración limitada por el O₂ (Michaelis–Menten)» con Km 2 y Ki 15; desplegable «Permeabilidades de las películas (editables)» | `b4-empaque` |
| 4.5 La atmósfera de equilibrio y el espesor de la película | Con los valores de partida queda **fuera** de la ventana: O₂ 4.64 %, CO₂ 2.73 %, área 0.150 m², β 5.45 (necesaria ≈ 2.43), espesor para 3.5 % O₂ 43 µm; las películas que sí llegan (LLDPE 40 µm, HDPE 13, PP colado 20, BOPP 8, EVA 71, OPS 36); figura `b4-atmosfera` (plano O₂–CO₂) | `b4-atmosfera` |
| 4.6 Preenfriamiento | «Curva de enfriamiento» (tabla escrita; medio 1 °C, objetivo 5 °C): medio enfriamiento 1.33 h, siete octavos 3.78 h, hasta 5 °C 3.48 h, j 1.063, C 0.566 h⁻¹; figura `b4-enfriamiento` | `b4-enfriamiento` |
| 4.7 Carga de refrigeración | 10 000 kg de 28 a 8 °C en 6 h, agua 85 %, 800 kg de empaque: calor de campo 737 MJ (cp 3.68), empaque 22, respiración 38.4, total 957 MJ, 44.3 kW = 12.6 t de refrigeración | `b4-carga` |

### Capítulo 5 · Pérdidas y cadena de valor (`05-bloque5.html`, `--b5`)

Subtítulo: «Cantidad y valor perdidos por etapa, puntos críticos, simulación y daño mecánico». Pestañas: «Pérdidas
por etapa» (`cadena`), «Simular mejoras» (`mejoras`), «Daño mecánico» (`dano`).

| h2 propuesto | Tarjeta, controles y ejemplo | Capturas |
|---|---|---|
| 5.1 La cadena: etapas, pérdida y precio | «La cadena» (`ejemplo('b5c')`, botón «Cargar ejemplo» propio): Etapa, Pérdida (% de lo que entra) o pérdida (kg), Precio por kg; «Cantidad que entra a la cadena (kg)» 10 000, «Moneda» $ | `b5-cadena` |
| 5.2 Pérdidas en cantidad y valor | llegan 7144 kg (71.4 %), se pierden 2856 (índice 28.6 %), valor perdido $ 34 450, al precio final $ 62 834; tabla por etapa; figuras `b5-sankey`, `b5-perdida-kg`, `b5-perdida-valor`; «Enviar a EconomicsPro →» | `b5-sankey` |
| 5.3 Puntos críticos | Pareto: en kilos, Selección y empaque 26.1 %; en valor, Venta al menudeo 36.5 %; las etapas que suman el 80 % | `b5-pareto` |
| 5.4 Simular mejoras | «Etapa» Transporte, «Reducción de su pérdida (%)» 50 → 157 kg más, $ 3445, índice 27.0 % (antes 28.6 %); la que más rinde: Selección y empaque ($ 6648); figura `b5-sensibilidad` | `b5-mejoras` |
| 5.5 Daño mecánico: curvas y umbral | (`ejemplo('b5d')`): 60 frutos; mejor curva Lineal (R² 0.923, AIC 533.41) contra cuadrática, potencia y exponencial; umbral 3.5 cm; susceptibilidad 237 mm² por joule; figura `b5-dano` | `b5-dano` |
| 5.6 Incidencia y regresión logística | daña al 50 % a 26.9 cm [21.5, 32.1] (Fieller), al 10 % a 15.3 cm [1.4, 20.9]; figura `b5-incidencia` | `b5-incidencia` |

### Capítulo 6 · Evaluación sensorial (`06-bloque6.html`, `--b6`)

Subtítulo: «Pruebas discriminativas, afectivas y descriptivas, con el diseño de las catas». Bajo el título, una línea
remite a SensorialPro para pruebas avanzadas (desde el 10 oct 2026). Pestañas: «Discriminativas» (`discrim`),
«Hedónica» (`hedonica`), «Punto justo (JAR)» (`jar`), «CATA» (`cata`), «Perfil descriptivo» (`qda`), «Fichas de
cata» (`fichas`). Es el capítulo más largo: puede partirse en dos redactores (6.1–6.5 y 6.6–6.9).

| h2 propuesto | Tarjeta, controles y ejemplo | Capturas |
|---|---|---|
| 6.1 Pruebas discriminativas y d′ | «Resultados de las pruebas» (`ejemplo('b6d')`: Prueba, Método, Correctas, Total, Tipo Diferencia/Similitud, pd₀), «Confianza», «Estadístico» (Binomial exacto…). Triangular 21/42: p = 0.019, d′ = 1.47 [0.31, 2.28], pd 25 %; dúo-trío 27/40: d′ 1.57; 2-AFC 31/40: d′ 1.07, p < 0.001 | `b6-discriminativas` |
| 6.2 Planear: jueces y potencia | «Método» Triangular, «d′ que quieres detectar» 1.5, «α» 0.05, «Potencia deseada» 0.8, «Jueces disponibles» 30 → 53 jueces; con 30, potencia 0.600; tabla de los cinco métodos (3-AFC: 9 jueces); figuras `b6-psicometricas`, `b6-potencia` (dientes de sierra) | `b6-planear` |
| 6.3 A–no A y preferencia pareada | A–no A (33/40 y 18/40): d′ 1.060 [0.460, 1.661], p < 0.001; preferencia 38 contra 22 (5 sin preferencia, se excluyen): 63.3 % [49.9, 75.4], p = 0.052 | `b6-anoa` |
| 6.4 Hedónica | (`ejemplo('b6h')`): 80 consumidores, 4 productos, F = 56.31, CV 21.1 %; Altura lavado 6.51 a, Honey 6.45 ab, Natural 5.99 b, Comercial 4.31 c; Friedman χ² = 90.87; figura `b6-hedonica` | `b6-hedonica` |
| 6.5 Punto justo y penalidades | (`ejemplo('b6j')`): «Niveles de la escala» 5, «Umbral de consumidores (%)» 20; penalidades (Altura lavado · amargor muy poco 31 %, −0.83, p = 0.008…); figuras `b6-penalidades`, `b6-jar-dist` | `b6-penalidades` |
| 6.6 CATA | (`ejemplo('b6c')`): 80 consumidores completos, 10 términos, los 10 discriminan (Q de Cochran), inercia en el plano 94.6 %; pares por McNemar con Holm; figuras `b6-cata-ac`, `b6-cata-frec` | `b6-cata` |
| 6.7 Perfil descriptivo | (`ejemplo('b6q')`): 8 jueces, 4 productos, 7/7 atributos discriminan (producto contra la interacción), ACP 97.3 %; «Comparación de medias» LSD de Fisher; figuras `b6-arana`, `b6-mapa-productos`; «Enviar a PCAPro (mapa de preferencias) →» | `b6-perfil` |
| 6.8 Desempeño del panel | revisar a J4 (discrimina poco, repite poco), J6 (ídem; DE residual 2.30) y J8 (discrimina poco); «Detalle del atributo» | `b6-panel` |
| 6.9 Fichas de cata | «Prueba» Hedónica de 9 puntos, productos, 12 jueces, semilla 2026, atributos, título; «Un código distinto por juez para cada producto»; «Generar el plan», «Imprimir las fichas», «⤓ Plan de servicio (CSV)»; órdenes de Williams | `b6-fichas` (después de «Generar el plan») |

### Capítulo 7 · Ensayos poscosecha (`07-bloque7.html`, `--b7`)

Subtítulo: «Factoriales tratamiento × tiempo, medidas repetidas, pendientes y aleatorización». Pestañas: «Factorial
tratamiento × tiempo» (`factorial`), «Medidas repetidas» (`repetidas`), «Pendientes» (`pendientes`),
«Aleatorización» (`aleatorizacion`).

| h2 propuesto | Tarjeta, controles y ejemplo | Capturas |
|---|---|---|
| 7.1 Factorial tratamiento × tiempo | «Muestreo destructivo» (`ejemplo('b7f')`: firmeza del mango, tratamiento = temperatura, tiempo = día): «Sumas de cuadrados» Tipo III, «Usar sólo los tiempos medidos en todos los tratamientos» (deja fuera 15, 18 y 21), «Comparación de medias» Tukey (HSD), «Testigo (Dunnett)» 13, «α» 0.05. ANOVA: tratamiento F = 211.21, tiempo 385.30, interacción 19.91 (todos p < 0.001), CV 10.3 %, R² 0.979; figura `b7-factorial` | `b7-factorial` |
| 7.2 Comparar los tratamientos dentro de cada tiempo | tabla de letras por tiempo (día 3: 107.65 a, 73.30 b, 60.33 c); cuándo no resumir con promedios generales | `b7-letras` |
| 7.3 Medidas repetidas | «Los mismos frutos a lo largo del tiempo» (`ejemplo('b7r')`: pérdida de peso del chayote, unidad = fruto): 18 unidades; tratamiento F = 18.09 contra las unidades; tiempo 795.45; interacción 16.49; se deja fuera el día 0; figura `b7-repetidas` | `b7-repetidas` |
| 7.4 Esfericidad y correcciones | Mauchly p < 0.001, ε GG 0.280 / HF 0.286; comparaciones dentro de cada tiempo con Satterthwaite (día 10: Testigo 4.50 a, Cera 2.98 b, Quitosano 3.03 b) | — |
| 7.5 Pendientes | (`ejemplo('b7p')`): pendientes iguales F = 39.05, p < 0.001; Testigo 0.4473 por día, Cera vegetal 0.2924, Quitosano 0.3078; Testigo 1.53 veces más rápido; pares con Holm (Cera–Quitosano p = 0.428); figura `b7-pendientes`; el aviso de que son optimistas | `b7-pendientes` |
| 7.6 Aleatorización y libro de campo | tratamientos, tiempos 0, 5, 10, 15, 20, 4 repeticiones, «Diseño» Completamente al azar, semilla 2026, variables, «Medidas repetidas…»; «Generar», CSV/XLSX, «Abrir el programa de diseño experimental →» (AgriDesign) | `b7-libro` |

### Capítulo 8 · Empaque y logística (`08-bloque8.html`, `--b8`, sin entrada de datos)

Subtítulo: «Carga, ventilación, ambiente de la cámara, costos, compatibilidad y unidades». Pestañas: «Tarima y
contenedor» (`tarima`), «Ventilación de cajas» (`ventilacion`), «Ambiente del almacén» (`ambiente`), «Costo de
almacenamiento» (`costos`), «Compatibilidad» (`compat`), «Unidades» (`unidades`). Todas abren con valores escritos.

| h2 propuesto | Tarjeta, controles y ejemplo | Capturas |
|---|---|---|
| 8.1 Tarima y contenedor | ISO 120 × 100, caja 40 × 30 × 20 cm de 10 kg, altura máx. 210, 1000 kg, «Refrigerado de 40 pies, cubo alto»: 10 cajas por cama (100 %), 9 camas, 90 cajas, 900 kg; 20 tarimas, 1800 cajas, 18 500 kg, 90.5 % del piso; figuras `b8-tarima`, `b8-contenedor` | `b8-tarima` |
| 8.2 Ventilación de cajas | cara larga 50 × 25, corta 30 × 25, orificios: 6.0 % y 6.2 % (suficiente; 5–8 %) | `b8-ventilacion` |
| 8.3 Ambiente del almacén | 5 °C, 85 % HR, 0 m, producto a 6 °C, Tomate (coeficiente 140): 101.3 kPa, 5.78 g/m³, rocío 2.7 °C, bulbo húmedo 3.9 °C, entalpía 16.5 kJ/kg, déficit del aire 0.131 kPa, producto–aire 0.194 kPa | `b8-ambiente` |
| 8.4 La carta psicrométrica y la pérdida de agua | 0.234 % d⁻¹ = 1.64 % por semana; aire exterior 28 °C y 55 %; figura `b8-psicrometrica` | `b8-psicrometrica` |
| 8.5 Costo de almacenamiento | costo diario 2805, 45 tarimas, 62.33 por tarima y día + merma 14.40 = 76.73 (19 % es merma) | `b8-costos` |
| 8.6 Compatibilidad | botones de 38 productos, «Tabla de productos (editable)», «Diagnóstico» (4 productos: 5 pares incompatibles), figura `b8-compatibilidad`; Kader, Gross et al., McGregor | `b8-compatibilidad` |
| 8.7 Unidades | «Magnitud», «Valor», «De»: 40 °C = 104 °F = 313.15 K; presión, masa, fuerza, longitud (µm, mil), gases (%, ppm, ppb) | — |

### Capítulo 9 · Informe y proyecto (`09-bloque9.html`, `--b9`)

Subtítulo: «Todo lo que calculaste, en un documento para compartir; y tu trabajo, en un archivo para seguir después».
Tarjetas (sin pestañas): «El informe», «Recomendaciones de manejo», «Proyecto», «Cómo citar PostHarvestPro».

| h2 propuesto | Lo que lleva | Capturas |
|---|---|---|
| 9.1 Datos del informe y secciones | «Título», «Autor o responsable», «Producto o cultivo», «Fecha», «Resumen o notas del ensayo (opcional)»; «Secciones disponibles» (hasta 27, una por análisis corrido, con su bloque) | `b9-informe` (con varios ejemplos cargados) |
| 9.2 Generar, descargar e imprimir | «Generar el informe», «⤓ Descargar HTML», «Imprimir o guardar PDF»; vista previa | `b9-vista` |
| 9.3 Lo que lleva el informe | portada, resumen con índice, secciones con figuras (SVG en colores del tema claro), tablas y lectura, recomendaciones, métodos y referencias de los bloques usados, cita | — |
| 9.4 Recomendaciones de manejo | reglas explícitas: vida al límite (13: 25.9; 20: 10.4; 25: 6.3), cadena de frío según Eₐ (≈ 88 kJ/mol → ~12 % menos vida por grado, con las k de partida de 3.3), climatérico, respiración alta, empaque fuera de ventana, invertir en «Venta al menudeo», alturas de caída, agrado, incompatibles | `b9-recomendaciones` |
| 9.5 Las figuras, el estudio y el editor | botones SVG y PNG (170 mm, 300 ppp), estudio de figuras (`Ctrl + K` o botón de la figura; PNG, SVG, PDF, TIFF a 300/600/1200 ppp), editor ✎ | `b9-estudio` |
| 9.6 Guardar y abrir el proyecto | «⤓ Guardar proyecto», «Abrir proyecto…»: tablas cargadas, columnas elegidas, tablas editadas y ajustes; al abrirlo recalcula. No hay `Ctrl + S` | — |
| 9.7 Cómo citar PostHarvestPro | cita y BibTeX de la app (con el DOI de concepto) | — |

En el título de las capturas del informe usa datos neutros («Vida de anaquel del mango de ejemplo»).

### Apéndices (`10-apendices.html`, `--bx`, `id="apendices"`, `data-pestana="Ap"`, `data-orden="10"`)

A archivos que lee y escribe (CSV/TSV/TXT con separadores y coma decimal, XLSX/XLSM/ODS, formato largo, faltantes;
los diez CSV de `data/` con sus columnas; proyecto JSON; CSV/XLSX de resultados; plan de servicio; libro de campo;
informe HTML); B reglas y fórmulas reunidas (las de los motores de la app, más umbrales: ΔE 1/2–3.5/5,
alza respiratoria 1.5×, etileno 10× o 1 µL kg⁻¹ h⁻¹, O₂ < 1 % anaerobiosis, espesor fabricable 8–150 µm, ventilación
5–8 %, pérdida de agua 2 %/semana, panel p > 0.20 / acuerdo < 0.5 / repetibilidad 1.5×, JAR 20 %, Pareto 80 %);
C glosario (vida de anaquel, límite, orden de reacción, Eₐ, Q10, Tmín, censura, Kaplan–Meier, razón de tiempos,
climatérico, CR, β, estado estacionario, j y C del enfriamiento, índice de pérdidas, susceptibilidad, d′, pd, pc,
JAR, penalidad, CATA, Q de Cochran, esfericidad, ε, BrimA, CCI, McKinney…); D cuando algo no sale; E licencia
(GPL-3.0-or-later) y cita (con el DOI de concepto 10.5281/zenodo.23935616 y el de la versión 1.0.0); F referencias, escritas por
`genera-referencias.js` entre `<!-- REFERENCIAS -->` y `<!-- /REFERENCIAS -->` (81 obras en siete temas).

## 2. Cómo se marca

Cada parte copia el `<head>` de `00b-introduccion.html` (tipografías, `../interior.css`, `../paginar.js`; un
`<style>` propio sólo si hace falta) y pone **una sola** `<section>`:

```html
<section class="capitulo" id="cap-3" data-pestana="3" data-orden="3" style="--acento: var(--b3)">
  <div class="cap-apertura">
    <div class="cap-num">3</div>
    <div class="cap-etiqueta">Capítulo tres · Bloque 3</div>
    <h1 data-corto="Cinética y vida de anaquel">Cinética y vida de anaquel</h1>
    <div class="cap-regla"></div>
    <p class="cap-resumen">Qué resuelve el bloque en el manejo de un producto, en tres o cuatro renglones.</p>
    <div class="cap-franja"><span class="k2"></span><span class="k3"></span><span class="k3"></span><span class="k4"></span></div>
    <ul class="cap-contenido">
      <li><b>3.1</b>Modelos cinéticos: los tres órdenes</li>
      …
    </ul>
  </div>

  <h2 id="s3-1"><span class="num">3.1</span>Modelos cinéticos: los tres órdenes</h2>
  <p class="lead">Primer párrafo de la sección, un poco más grande.</p>
  <p>Texto. Los rótulos de la app van así: <span class="ui">Cargar ejemplo</span>; una ruta,
     <span class="ruta">Bloque 3<span class="sep">›</span>Temperatura</span>; un archivo, una columna o una tecla, <code>firmeza_N</code>.</p>
  <h3>Subtítulo</h3>
  …
</section>
```

- `data-orden` es el número del bloque (In = 0, Ap = 10); los apéndices usan `id="apendices"`, `data-pestana="Ap"`,
  `--acento: var(--bx)`, `cap-num` «A» y h2 `id="ap-a"` … `ap-f` con `<span class="num">A</span>`.
- La etiqueta de apertura dice el número con letra: «Capítulo uno · Bloque 1», … «Capítulo nueve · Bloque 9».
- h2 siempre numerados (`N.M`), con `id="sN-M"` igual al del índice; h3 sin número; h4 para un rótulo menor en
  versalitas. Si cambias un h2, corrígelo también en el índice de `00b-introduccion.html`.

**Figuras**, numeradas por capítulo (Figura 3.1, 3.2…), con la imagen en `../img/` y, si lleva marcas, la lista justo
después (ver `i-interfaz` en la introducción):

```html
<figure class="w80">
  <div class="marco"><img src="../img/b3-cinetica.png" alt="Descripción para lector de pantalla">
    <span class="marca" style="left:12.5%;top:8%">1</span>
  </div>
  <figcaption><b>Figura 3.2.</b> Qué se ve y qué números importan.</figcaption>
</figure>
<ul class="leyenda-marcas">
  <li><span class="n">1</span><b>Mosaicos.</b> …</li>
</ul>
```

Las posiciones de las marcas salen de la receta (`window.__marcas`), no a ojo.

**Recuadros:** `caja nota`, `caja importante`, `caja teoria`, `caja ejemplo`, `caja regla` (con `table.compacta` y
`p.regla-pie`), `caja error`, `caja dato` (con `dato-cifra`), y también `caja idea` y `caja aviso`; la forma exacta
está en `00b-introduccion.html` («Cómo leer este manual»). Además: `ol.pasos`, `table.compacta` (con `<caption>`),
`.formula`, `.dos`, chips `<span class="chip k3">3</span>`, `td.num`, `tr.total`. Cada capítulo cierra con una «Regla
de decisión» o una tabla de lectura y un «Cuando algo sale mal».

## 3. Las capturas

- Una receta por imagen en `herramientas/recetas/`, con nombre `bN-que.js` (por ejemplo `b3-cinetica.js`) y la
  ventana en la primera línea. Se apoyan en `_comun.js`:

  ```js
  // ventana 1400x1000
  /* Capítulo 3: Ajuste y vida de anaquel con el mango (mosaicos, lectura y figura) */
  (async () => {
    await ejemplo('b3k');
    const t = tarjeta(L('Ajuste y vida de anaquel', 'Fit and shelf life'));
    irA(t, 120); await W(500);
    return caja([t], 8);
  })()
  ```

  Los rótulos que busques con `tarjeta()` o `vis()` deben estar en el idioma de la captura (`L('…', '…')`); con un
  id (`porId('b3kOrder')`) o un nombre de figura (`figura('b3-cinetica')`) no hay problema de idioma. Para cambiar un
  control: `porId(id).value = …; porId(id).dispatchEvent(new Event('change', { bubbles: true })); await listo();`.
- Sacar: `node manual/herramientas/captura.js b3-cinetica` desde la raíz de la app, con el node de
  `C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe`. **Mirar cada imagen** antes de citarla.
  Agrupa varias recetas en una llamada (`captura.js b3-ordenes b3-cinetica b3-arrhenius`).
- Revisar: `node manual/herramientas/revisar.js manual/es/03-bloque3.html --huecos 1.2`. Cero desbordes y cero
  imágenes sin cargar; si una figura deja un hueco grande, angostarla con `anchos.js` (no menos de `w70` si la
  captura tiene mucho texto) o reordenar. Las tarjetas de resultados son altas: recorta por partes (mosaicos y lectura
  en una captura, la figura en otra, la tabla en texto del manual si hace falta).
- Las herramientas borran sus perfiles temporales (`postharvestpro-manual-*` en `%TEMP%`); si algo se interrumpe,
  bórralos a mano, y no cierres ventanas de Edge que no sean de esos perfiles.

## 4. Las cifras

**Todas las cifras del texto salen de la app con los datos de ejemplo**, con los valores por omisión salvo que el
texto diga qué se cambió, y se comprueban en la captura o en la app misma (con la receta, o en la consola:
`state.inputs`, `state.kinetics`, `state.sensory`, `DataIn.registry.b3k.get()`). Nada se copia de la literatura sin
comprobarlo en la app, ni se calcula a mano aparte. Los nombres de columna van tal como vienen en los
CSV (`firmeza_N`, `dia`, `temperatura`) porque así los muestra la app.

## 5. Si encuentras un error de la app

**No lo corrijas.** Anótalo al final de tu entrega con el bloque, cómo reproducirlo, qué esperabas y qué salió (con
la captura si ayuda), y escribe el capítulo con lo que la app hace hoy, sin presentar el error como correcto.
Anotados al preparar el manual (sin corregir):

1. **Esperas animadas que nunca aparecen.** `afterPaint()` (`js/core.js`) abre la capa de espera de la suite
   (`LABG.work`, con la escena `postharvestpro` de `labg-fx.js`), pero ningún bloque la llama: los cálculos corren
   síncronos y la animación del fruto que madura no se ve nunca. El CHANGELOG, `PUBLICAR.md` y el manual viejo la
   anuncian. El manual nuevo no la menciona.
2. **Bloque 3 › Temperatura** abre con k escritas de antemano (0.0622, 0.1494, 0.2765) que no son las que el mismo
   mango da en «Modelos cinéticos» (0.06119, 0.1569, 0.2508): con las de partida, Eₐ = 88.1 kJ/mol, Q10 3.50 y 3.43,
   Tmín 2.4 °C; con «Llevar las k…», Eₐ ≈ 84.2 kJ/mol, Q10 ≈ 3.8 y 2.6. Las recomendaciones del Bloque 9 usan
   las de partida («Eₐ ≈ 88 kJ/mol»). El manual viejo cita 84 kJ/mol, 3.8 y 2.6, y Tmín ≈ 1.3 °C.
3. **Bloque 6 › Discriminativas › Planear:** la lectura escribe el método en minúsculas: «el método más eficiente…
   es **3-afc (tres alternativas)**» (`mName(...).toLowerCase()` en `js/b6.js`); también «2-afc» y, en inglés,
   «the 3-afc (three alternatives)».
4. **Bloque 4 › Climaterio:** la lectura dice «el etileno alcanza su pico **1.0** después que la respiración», sin
   unidad (días), y los mosaicos usan el nombre crudo de la columna («6.0 · dia»).
5. **Bloque 8 › Compatibilidad:** los intervalos se escriben «Lechuga pide **0–0 °C**», «Manzana pide **-1–4 °C**»
   (guion en vez de signo menos, y un intervalo de un solo valor); el mosaico «Pares con riesgo» dice 0 mientras la
   lectura enumera varios «Riesgo por etileno» (van dentro de pares ya incompatibles).
6. **Ejemplo del perfil descriptivo:** la descripción del conjunto dice «El juez J6 repite mal y el J8 discrimina
   poco», pero el desempeño del panel señala también a J4 («discrimina poco, repite poco»).
7. **Bloque 5 › Daño mecánico:** la lectura da el umbral sin unidad («por debajo de 3.5 no se espera daño visible»)
   y nombra la columna cruda («altura_cm»).
8. **Portada:** en la ilustración, el rótulo «límite comercial» se encima con el final de la curva de 13 °C; y a
   1400 px los siete pasos de «Cómo funciona» quedan en 6 + 1.
9. La app no enlaza al manual (ni al viejo ni al nuevo): ver `LEEME.md`, «El enlace desde la app».

## 6. Tamaño y reparto

Los capítulos ocuparán **entre 6 y 16 hojas**: el 6 (seis pestañas, nueve secciones) y el 3 y el 4 hacia arriba; el
8 y el 9 hacia abajo. La introducción tiene 18 hojas (6 de preliminares y 12 de texto). Los apéndices, con las 78
referencias, rondarán 12 a 14 hojas.

Reparto sugerido entre cuatro redactores, por peso parecido:

| Redactor | Partes | Por qué juntas |
|---|---|---|
| (a) | Capítulos 1, 2 y 9 | La portada, la calidad (con la entrada de datos común, 2.1) y el informe que lo reúne todo |
| (b) | Capítulos 3 y 7 | Los modelos en el tiempo: cinética, supervivencia, ensayos factoriales y de medidas repetidas (el mango y el chayote) |
| (c) | Capítulos 4, 5 y 8 | La fisiología y la tecnología: respiración, atmósferas, frío, pérdidas, daño, empaque y almacén |
| (d) | Capítulo 6 y apéndices | La evaluación sensorial completa; los apéndices al final, cuando (a), (b) y (c) hayan entregado sus reglas y su glosario |

Con tres redactores: (a) 1, 2, 3 y 9; (b) 4, 5, 7 y 8; (c) 6 y apéndices.
