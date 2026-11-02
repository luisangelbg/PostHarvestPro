# PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
#
# Genera los datos de ejemplo de la app. TODOS son simulados: se construyen con
# modelos y parámetros del orden de los publicados para cada cultivo, con una
# semilla fija, para que cualquiera pueda reproducirlos. No son mediciones reales.
#
# Escribe los CSV en data/ (para descargarlos o abrirlos en una hoja de cálculo)
# y el paquete js/datasets.js (para que la app los cargue con doble clic, sin servidor).
#
#   Rscript tools/generar_datos.R      (desde la carpeta de la app)

set.seed(20261004)
root <- normalizePath(file.path(dirname(sub("--file=", "", grep("--file=", commandArgs(FALSE), value = TRUE))), ".."))
if (!dir.exists(file.path(root, "data"))) root <- getwd()
out <- function(df, name) {
  write.csv(df, file.path(root, "data", paste0(name, ".csv")), row.names = FALSE, fileEncoding = "UTF-8", na = "")
  invisible(df)
}
R_GAS <- 8.314462618
arr <- function(k20, Ea, Tc) k20 * exp(-Ea / R_GAS * (1 / (Tc + 273.15) - 1 / 293.15))

# ---------------------------------------------------------------------------
# (a) Mango 'Ataulfo' almacenado a 13, 20 y 25 °C: muestreo destructivo de 4 frutos
#     por temperatura y día. Firmeza de primer orden con Arrhenius (Ea 85 kJ/mol),
#     color (L*, C*, h° hacia el amarillo), SST, AT, pH, pérdida de peso y antracnosis.
# ---------------------------------------------------------------------------
days <- list(`13` = c(0, 3, 6, 9, 12, 15, 18, 21), `20` = c(0, 3, 6, 9, 12), `25` = c(0, 3, 6, 9, 12))
wl_rate <- c(`13` = 0.22, `20` = 0.45, `25` = 0.62)            # % por día
mango <- do.call(rbind, lapply(names(days), function(Tn) {
  Tc <- as.numeric(Tn)
  kF <- arr(0.15, 85000, Tc); kC <- arr(0.13, 80000, Tc); kS <- arr(0.22, 75000, Tc)
  do.call(rbind, lapply(days[[Tn]], function(d) {
    n <- 4
    w0 <- round(rnorm(n, 300, 38))
    firm <- 125 * exp(-kF * d) * exp(rnorm(n, 0, 0.09))
    h <- 70 + 38 * exp(-kC * d) + rnorm(n, 0, 1.6)
    C <- 38 + 22 * (1 - exp(-kC * d)) + rnorm(n, 0, 1.8)
    L <- 61 + 8 * (1 - exp(-kC * d)) + rnorm(n, 0, 1.2)
    sst <- 8 + 10 / (1 + exp(-(kS * d * 4 - 2.4))) + rnorm(n, 0, 0.5)
    at <- 0.22 + 1.0 * exp(-kS * d) + rnorm(n, 0, 0.05)
    ph <- 3.0 + 1.2 * (1 - exp(-kS * d)) + rnorm(n, 0, 0.06)
    wl <- pmax(0, wl_rate[Tn] * d + rnorm(n, 0, 0.12 + 0.02 * d) * (d > 0))
    risk <- pmin(0.95, pmax(0, 0.012 * d * (Tc - 10) / 5))
    antr <- sapply(seq_len(n), function(i) sum(runif(4) < risk))
    data.frame(temperatura = Tc, dia = d, fruto = seq_len(n), peso_inicial_g = w0,
               firmeza_N = round(firm, 1), L = round(L, 1),
               a = round(C * cos(h * pi / 180), 1), b = round(C * sin(h * pi / 180), 1),
               sst = round(sst, 1), at = round(pmax(0.08, at), 2), ph = round(ph, 2),
               perdida_peso = round(wl, 2), antracnosis = antr)
  }))
}))
out(mango, "mango_temperaturas")

# ---------------------------------------------------------------------------
# (b) Chayote con dos recubrimientos a 10 °C.
#  b1: días hasta el rechazo (deshidratación, brotación o pudrición), 30 frutos por
#      tratamiento, Weibull; el ensayo termina a los 35 días (censura por la derecha).
#  b2: pérdida de peso de 6 frutos marcados por tratamiento, medidos cada 5 días
#      (medidas repetidas).
# ---------------------------------------------------------------------------
trt <- c("Testigo", "Cera vegetal", "Quitosano")
shape <- c(2.6, 2.4, 2.8); scl <- c(21, 29, 33)
chay <- do.call(rbind, lapply(seq_along(trt), function(i) {
  t <- rweibull(30, shape[i], scl[i])
  st <- as.integer(t <= 35)
  data.frame(fruto = sprintf("%s-%02d", substr(trt[i], 1, 1), 1:30), tratamiento = trt[i],
             dias = ifelse(st == 1, pmax(1, ceiling(t)), 35), rechazado = st)
}))
out(chay, "chayote_rechazo")
rate <- c(0.42, 0.29, 0.31)
chw <- do.call(rbind, lapply(seq_along(trt), function(i) {
  do.call(rbind, lapply(1:6, function(f) {
    b <- rate[i] * exp(rnorm(1, 0, 0.12))
    d <- seq(0, 25, 5)
    data.frame(fruto = sprintf("%s%d", substr(trt[i], 1, 1), f), tratamiento = trt[i], dia = d,
               perdida_peso = round(pmax(0, b * d + rnorm(length(d), 0, 0.15) * (d > 0)), 2))
  }))
}))
out(chw, "chayote_peso")

# ---------------------------------------------------------------------------
# (c) Café: perfil descriptivo (8 jueces × 4 cafés × 2 sesiones, escala 0–10),
#     agrado de 80 consumidores (escala hedónica de 9 puntos), punto justo (JAR, 5 puntos),
#     CATA (10 términos) y una prueba triangular.
# ---------------------------------------------------------------------------
cafes <- c("Altura lavado", "Natural", "Honey", "Comercial")
attrs <- c("Fragancia", "Acidez", "Amargor", "Cuerpo", "Dulzor", "Astringencia", "Residual")
mu <- rbind(`Altura lavado` = c(7.6, 7.0, 4.2, 5.6, 5.8, 2.8, 6.9),
            Natural         = c(7.0, 4.6, 4.8, 7.2, 6.6, 3.2, 6.2),
            Honey           = c(7.2, 5.8, 4.0, 6.4, 7.0, 2.6, 6.6),
            Comercial       = c(4.6, 3.4, 7.4, 6.0, 3.4, 5.4, 4.2))
panel <- sprintf("J%d", 1:8)
noise <- c(0.7, 0.8, 0.7, 0.9, 0.8, 1.9, 0.7, 0.8)            # J6 es el juez menos repetible
offs <- rnorm(8, 0, 0.6)
qda <- do.call(rbind, lapply(1:8, function(j) do.call(rbind, lapply(1:2, function(s) do.call(rbind, lapply(cafes, function(p) {
  inter <- rnorm(length(attrs), 0, 0.35)
  v <- mu[p, ] + offs[j] + inter + rnorm(length(attrs), 0, noise[j])
  if (j == 8) v <- mean(mu[p, ]) + 0.3 * (mu[p, ] - mean(mu[p, ])) + rnorm(length(attrs), 0, 0.7)   # J8 discrimina poco
  d <- as.data.frame(as.list(round(pmin(10, pmax(0, v)), 1)))
  names(d) <- attrs
  cbind(data.frame(juez = panel[j], sesion = s, cafe = p), d)
}))))))
out(qda, "cafe_descriptivo")

like_mu <- c(6.9, 6.2, 6.6, 5.0)
jar_attrs <- c("Acidez", "Amargor", "Cuerpo")
jar_p <- list(`Altura lavado` = list(c(.05,.12,.55,.20,.08), c(.08,.22,.55,.12,.03), c(.06,.24,.58,.10,.02)),
              Natural         = list(c(.12,.30,.48,.08,.02), c(.04,.14,.60,.18,.04), c(.02,.08,.52,.28,.10)),
              Honey           = list(c(.06,.18,.60,.13,.03), c(.06,.20,.62,.10,.02), c(.04,.14,.64,.15,.03)),
              Comercial       = list(c(.10,.20,.45,.18,.07), c(.01,.04,.30,.40,.25), c(.05,.16,.50,.22,.07)))
cata_terms <- c("Afrutado", "Chocolate", "Floral", "Nuez", "Tostado", "Quemado", "Ácido", "Amargo", "Dulce", "Astringente")
cata_p <- rbind(`Altura lavado` = c(.62,.30,.48,.25,.30,.06,.58,.20,.40,.12),
                Natural         = c(.70,.40,.22,.30,.28,.08,.25,.22,.55,.15),
                Honey           = c(.55,.45,.30,.40,.32,.05,.38,.15,.62,.10),
                Comercial       = c(.12,.20,.06,.22,.70,.52,.15,.72,.12,.48))
cons <- sprintf("C%02d", 1:80)
ce <- rnorm(80, 0, 0.8)
hed <- do.call(rbind, lapply(1:80, function(i) do.call(rbind, lapply(seq_along(cafes), function(k) {
  p <- cafes[k]
  jar <- sapply(1:3, function(a) sample(1:5, 1, prob = jar_p[[p]][[a]]))
  pen <- sum(abs(jar - 3) * c(0.55, 0.6, 0.45))
  score <- round(like_mu[k] + 0.4 + ce[i] - pen + rnorm(1, 0, 1.0))
  ct <- as.integer(runif(10) < cata_p[p, ])
  d <- data.frame(consumidor = cons[i], cafe = p, agrado = min(9, max(1, score)),
                  jar_acidez = jar[1], jar_amargor = jar[2], jar_cuerpo = jar[3])
  cd <- as.data.frame(as.list(ct)); names(cd) <- cata_terms
  cbind(d, cd)
}))))
out(hed, "cafe_consumidores")
tri <- data.frame(prueba = c("Triangular", "Dúo-trío", "Dos alternativas (2-AFC)"),
                  muestras = c("Altura lavado vs Honey", "Altura lavado vs Honey", "Altura lavado vs Honey (más ácido)"),
                  correctas = c(21, 27, 31), total = c(42, 40, 40))
out(tri, "cafe_discriminativas")

# ---------------------------------------------------------------------------
# (d) Cadena de jitomate saladette: pérdidas por etapa (% de lo que entra) y precio
#     por kg en cada etapa, más un ensayo de caídas (daño mecánico).
# ---------------------------------------------------------------------------
cad <- data.frame(etapa = c("Cosecha", "Selección y empaque", "Acopio", "Transporte", "Central de abasto", "Venta al menudeo"),
                  perdida_pct = c(4.5, 7.8, 2.6, 4.2, 6.1, 7.4),
                  precio_kg = c(6.0, 8.5, 9.0, 10.5, 14.0, 22.0))
out(cad, "jitomate_cadena")
alt <- rep(c(10, 20, 30, 40, 50, 60), each = 10)
masa <- round(rnorm(length(alt), 150, 12))
E <- masa / 1000 * 9.80665 * alt / 100
area <- pmax(0, -18 + 4.1 * alt * (masa / 150) + rnorm(length(alt), 0, 14))
prof <- ifelse(area > 0, pmax(0.3, 0.035 * sqrt(area) * 3 + rnorm(length(alt), 0, 0.3)), 0)
wid <- 2 * sqrt(area / pi)
vol <- ifelse(area > 0, pi * prof * (3 * wid^2 / 4 + prof^2) / 6, 0)
dano <- as.integer(runif(length(alt)) < plogis(-3.2 + 0.13 * alt))
caida <- data.frame(altura_cm = alt, masa_g = masa, energia_J = round(E, 4), area_mm2 = round(area, 1),
                    volumen_mm3 = round(vol, 1), danado = dano)
out(caida, "jitomate_caidas")

# ---------------------------------------------------------------------------
# (e) Aguacate 'Hass' a 20 °C: sistema estático (3 frascos de 3.8 L, lecturas cada
#     30 min) y la curva climatérica de 12 días (respiración y etileno).
# ---------------------------------------------------------------------------
Vm <- 0.0820574 * 293.15                                       # L/mol a 20 °C y 1 atm
resp <- do.call(rbind, lapply(1:3, function(f) {
  m <- round(runif(1, 0.60, 0.72), 3); Vf <- 3.8 - m / 1.0
  rco2 <- rnorm(1, 62, 5)                                     # mg CO2 / kg h
  ml <- rco2 / 44.0095 * Vm                                   # mL CO2 / kg h
  t <- seq(0, 2, 0.5)
  co2 <- 0.04 + ml * m / (Vf * 1000) * 100 * t + rnorm(5, 0, 0.012)
  o2 <- 20.95 - ml / 0.92 * m / (Vf * 1000) * 100 * t + rnorm(5, 0, 0.02)
  et <- 0.02 + 0.6 * m / Vf * t + rnorm(5, 0, 0.004)
  data.frame(frasco = f, masa_kg = m, volumen_frasco_L = 3.8, tiempo_h = t,
             co2_pct = round(co2, 3), o2_pct = round(o2, 3), etileno_ppm = round(pmax(0, et), 3))
}))
out(resp, "aguacate_estatico")
dd <- 0:12
rr <- 48 + 92 * exp(-((dd - 6.5) / 1.8)^2) - 4 * exp(-dd) + rnorm(13, 0, 3)
ee <- (0.15 + 88 * exp(-((dd - 7) / 1.6)^2)) * exp(rnorm(13, 0, 0.12))
clim <- data.frame(dia = dd, respiracion_mg = round(rr, 1), etileno_ul = round(pmax(0.05, ee), 2))
out(clim, "aguacate_climaterico")

# ---------------------------------------------------------------------------
# El paquete para la app: js/datasets.js
# ---------------------------------------------------------------------------
library(jsonlite)
pack <- list(
  mango = list(file = "mango_temperaturas", data = mango),
  chayoteRechazo = list(file = "chayote_rechazo", data = chay),
  chayotePeso = list(file = "chayote_peso", data = chw),
  cafeQDA = list(file = "cafe_descriptivo", data = qda),
  cafeConsumidores = list(file = "cafe_consumidores", data = hed),
  cafeDiscriminativas = list(file = "cafe_discriminativas", data = tri),
  jitomateCadena = list(file = "jitomate_cadena", data = cad),
  jitomateCaidas = list(file = "jitomate_caidas", data = caida),
  aguacateEstatico = list(file = "aguacate_estatico", data = resp),
  aguacateClimaterico = list(file = "aguacate_climaterico", data = clim)
)
js <- paste0(
  "/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.\n",
  "   The example data of the app, written by tools/generar_datos.R (seed 20261004).\n",
  "   ALL of them are simulated with models and parameters of the order published for each crop;\n",
  "   they are not measurements. The same tables are in data/*.csv. */\n",
  "window.PH_DATA = ", toJSON(lapply(pack, function(p) list(file = p$file, columns = names(p$data), rows = p$data)), dataframe = "values", auto_unbox = TRUE, digits = NA), ";\n")
writeLines(js, file.path(root, "js", "datasets_data.js"), useBytes = TRUE)
cat("Listo:", length(pack), "tablas\n")
