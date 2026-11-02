# Cambios

## Sin versión nueva — 10 de octubre de 2026

- **Bloque 6. Evaluación sensorial:** una línea bajo el título remite a SensorialPro, de la misma suite, para pruebas avanzadas, paneles y mapas de preferencia. SensorialPro abre sin cambios los CSV que se exportan de este bloque.

## 1.0.0 — 4 de octubre de 2026

Primera versión completa: los nueve bloques.

- **Bloque 1. Inicio:** ilustración animada de la madurez y la firmeza a tres temperaturas, ruta de trabajo, tarjetas de los bloques, galería de los diez conjuntos de ejemplo (abre cada herramienta con su ejemplo), métodos con sus fuentes, la poscosecha en breve, lo que la app no hace, 78 referencias y cómo citar.
- **Bloque 2. Calidad y madurez:**
  - resumen de calidad por grupo y tiempo, con SST/AT, BrimA y color derivado;
  - conversor sRGB ↔ Lab ↔ hexadecimal con muestra, ΔE\*ab, ΔE94 y ΔE00, índices de color y el color medio de los datos;
  - calculadoras de acidez titulable, humedad, firmeza y pérdida de peso;
  - escalas de madurez y daño (índice de McKinney, incidencia, fruta comercializable);
  - calibres.
- **Bloque 3. Cinética y vida de anaquel:**
  - órdenes 0, 1 y 2 por mínimos cuadrados no lineales con AIC y tiempo al límite;
  - Arrhenius, Q10 y raíz cuadrada, con la vida de anaquel a cualquier temperatura;
  - prueba acelerada con intervalo de predicción;
  - tiempo hasta el rechazo con censura: Kaplan–Meier, rango logarítmico, modelos Weibull, log-normal, log-logístico y exponencial, percentiles y razones de tiempos.
- **Bloque 4. Respiración, etileno y atmósferas:**
  - sistema estático y de flujo continuo, cociente respiratorio y calor de respiración;
  - climaterio por una regla explícita;
  - atmósfera modificada en estado estacionario (con respiración de Michaelis–Menten opcional), espesor por película y plano O₂–CO₂;
  - preenfriamiento (medio y siete octavos) y carga de refrigeración.
- **Bloque 5. Pérdidas y cadena de valor:**
  - pérdidas por etapa en cantidad y valor, Sankey, Pareto y puntos críticos;
  - simulación de mejoras;
  - envío a EconomicsPro;
  - curvas de daño mecánico y regresión logística con intervalo de Fieller.
- **Bloque 6. Evaluación sensorial:**
  - triangular, dúo-trío, 2-AFC, 3-AFC y tétrada con d′, potencia y tamaño de muestra;
  - A–no A y preferencia pareada;
  - hedónica con Tukey y Friedman;
  - punto justo con penalidades;
  - CATA con Q de Cochran, McNemar y correspondencias;
  - perfil descriptivo con desempeño del panel, araña y mapa de productos (ACP), con envío a PCAPro;
  - fichas de cata con órdenes de Williams y códigos de tres dígitos.
- **Bloque 7. Ensayos poscosecha:**
  - factorial tratamiento × tiempo (tipos I y III) con Tukey–Kramer, LSD, Bonferroni y Dunnett dentro de cada tiempo;
  - medidas repetidas (parcelas divididas en el tiempo, Greenhouse–Geisser, Huynh–Feldt, Mauchly);
  - comparación de pendientes;
  - libro de campo aleatorizado compatible con AgriDesign.
- **Bloque 8. Empaque y logística:** tarima y contenedor, ventilación de cajas, ambiente del almacén con carta psicrométrica y pérdida de agua, costo de almacenamiento, compatibilidad de productos y conversión de unidades.
- **Bloque 9. Informe y proyecto:** informe HTML autocontenido (portada, secciones, recomendaciones de manejo, métodos, referencias y cita) imprimible a PDF, y proyecto JSON que se guarda y se vuelve a abrir.
- **Común:**
  - barra, navegador, estudio de figuras y editor ✎ de la LABG Suite;
  - esperas con una animación propia: el fruto madura mientras se traza su curva de firmeza;
  - español e inglés, tema claro y oscuro;
  - figuras SVG y PNG a 300 ppp; tablas en CSV y XLSX;
  - todo funciona con doble clic, sin servidor ni conexión.
- **Validación:** 431 pruebas y 71 042 comparaciones contra implementaciones independientes, tablas publicadas y cálculos a mano, sin fallas (`tests/validacion/VALIDACION.md`).

### Revisión antes de publicar — 2 de noviembre de 2026

Correcciones hechas al revisar cada bloque con el manual nuevo, sin cambiar el número de versión:

- **Común y portada** (b801347):
  - los datos nuevos (ejemplo, archivo, tabla pegada, hoja o columna) se analizan dentro de la espera animada;
  - los símbolos y unidades (α, µ, a\*, b\*, mL, pH…) conservan su caja en los rótulos en versalitas, también en las leyendas y al exportar las figuras;
  - el estudio de figuras muestra el nombre y el ícono de cada descarga;
  - la portada acomoda mejor el rótulo del límite comercial y «Cómo funciona», y enlaza al manual desde el pie.
- **Bloque 2. Calidad y madurez** (b801347):
  - frase correcta para leer el ΔE00;
  - el índice ponderado dice su rango real;
  - las escalas se recalculan al cambiar plantilla, clases o tolerancia;
  - los lotes sin calificaciones y los calibres sin frutos dentro de las clases dan aviso;
  - los índices de blancura, amarillez y color del jitomate llevan sus fuentes.
- **Bloque 3. Cinética y vida de anaquel** (013c06c):
  - la pestaña de temperatura abre con las k, el orden y el C₀ del ajuste del mango del ejemplo;
  - «Llevar las k…» fija orden, C₀ y límite antes de llenar la tabla, así que la vida al almacén se recalcula;
  - k y sus EE se ven redondeados y se guardan completos;
  - intervalos con tres cifras significativas;
  - las notas de los motores de cinética y supervivencia quedan visibles, y un caso sin modelo paramétrico ajustable ya no falla.
- **Bloques 4, 5 y 8** (0160a38):
  - unidades en el climaterio, el umbral y la dosis de daño;
  - leyendas de frascos y películas;
  - coeficiente a (no ln a) en las curvas de potencia y exponencial;
  - susceptibilidad con el volumen y la energía medidos (mm³/J) y aviso si se usa el área;
  - la simulación de mejoras propone la etapa que más valor pierde;
  - intervalos de temperatura con signo menos en la compatibilidad;
  - peso de la tarima vacía editable;
  - efecto de subir la HR calculado con la HR escrita;
  - rótulos de HR en la carta psicrométrica.
- **Bloque 6. Evaluación sensorial** (a8842dd):
  - nombres de las pruebas sin minúsculas forzadas;
  - el número real de jueces en el perfil descriptivo;
  - fila «Producto, ajustado por consumidor» en la hedónica desbalanceada;
  - aviso propio del punto justo con niveles pares;
  - notas visibles en la preferencia pareada;
  - gráfica de penalidades con rótulos completos que no se enciman.
- **Bloque 7. Ensayos poscosecha** (013c06c):
  - con celdas vacías, el motor las lista, marca como no estimables los efectos principales del tipo III y la interfaz avisa qué se pierde;
  - «Repetición» con acento (AgriDesign reconoce ambas formas).
- **Bloque 9. Informe y proyecto** (a8842dd):
  - sólo entran al informe y a las recomendaciones las secciones que se usaron; las demás se listan aparte y el proyecto guarda la lista;
  - la recomendación de daño mecánico da la altura que daña al 10 % y al 50 %, con su unidad.
- **Pruebas:** casos nuevos para estas correcciones (`tests/unit_color_refs.js` y ampliaciones de las de calidad, sensorial y ensayos). Ahora son **443 pruebas y 71 199 comparaciones, sin fallas**.
- **Documentación:**
  - manual de usuario nuevo en `manual/`, en español e inglés (HTML y PDF), que reemplaza al manual viejo de `docs/`; éste se retiró junto con `tools/armar_manual.js`, que lo armaba;
  - README en inglés y LEEME en español;
  - metadatos para Zenodo (`.zenodo.json`, `CITATION.cff`, `codemeta.json`).
