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
