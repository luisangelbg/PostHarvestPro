# PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
# Referencias de R para el color (js/color.js) y para las pérdidas y el daño mecánico (js/losses.js).
#   Rscript tests/validacion/color_losses.R   (desde la carpeta de la app)
suppressPackageStartupMessages({ library(jsonlite); library(farver) })
here <- "tests/validacion"
set.seed(3)
ref <- list()

# ---- color: sRGB → Lab (D65) con dos implementaciones independientes, y ΔE
rgb <- matrix(sample(0:255, 3 * 60, replace = TRUE), ncol = 3)
rgb <- rbind(rgb, c(255, 255, 255), c(0, 0, 0), c(255, 0, 0), c(0, 255, 0), c(0, 0, 255), c(128, 128, 128))
lab_f <- convert_colour(rgb, "rgb", "lab", white_from = "D65", white_to = "D65")
lab_g <- convertColor(rgb / 255, from = "sRGB", to = "Lab", from.ref.white = "D65", to.ref.white = "D65")
lab1 <- cbind(runif(40, 20, 90), runif(40, -40, 40), runif(40, -10, 70))
lab2 <- lab1 + cbind(rnorm(40, 0, 4), rnorm(40, 0, 6), rnorm(40, 0, 6))
de76 <- sqrt(rowSums((lab1 - lab2)^2))
de94 <- sapply(1:40, function(i) compare_colour(lab1[i, , drop = FALSE], lab2[i, , drop = FALSE], "lab", method = "cie94"))
de00 <- sapply(1:40, function(i) compare_colour(lab1[i, , drop = FALSE], lab2[i, , drop = FALSE], "lab", method = "cie2000"))
lch <- cbind(lab1[, 1], sqrt(lab1[, 2]^2 + lab1[, 3]^2), (atan2(lab1[, 3], lab1[, 2]) * 180 / pi) %% 360)
ref$color <- list(rgb = rgb, labF = lab_f, labG = lab_g, lab1 = lab1, lab2 = lab2, de76 = de76, de94 = de94, de00 = de00, lch = lch)

# ---- pérdidas: ensayo de caídas
d <- read.csv("data/jitomate_caidas.csv")
fl <- lm(area_mm2 ~ altura_cm, d)
fq <- lm(area_mm2 ~ altura_cm + I(altura_cm^2), d)
pos <- d[d$area_mm2 > 0, ]
fp <- lm(log(area_mm2) ~ log(altura_cm), pos)
fe <- lm(log(area_mm2) ~ altura_cm, pos)
aicN <- function(rss, n, k) n * (log(2 * pi) + 1 + log(rss / n)) + 2 * (k + 1)
gl <- glm(danado ~ altura_cm, family = binomial, data = d, control = glm.control(epsilon = 1e-14, maxit = 100))
V <- vcov(gl); b <- coef(gl); z <- qnorm(0.975)
fieller <- function(p) {
  th <- (qlogis(p) - b[1]) / b[2]
  v00 <- V[1, 1]; v11 <- V[2, 2]; v01 <- V[1, 2]
  # raíces de (N − θD)² = z²(v00 + 2θ v01 + θ² v11), N = logit p − b0, D = b1
  A <- b[2]^2 - z^2 * v11; B <- -2 * ((qlogis(p) - b[1]) * b[2] + z^2 * v01); C <- (qlogis(p) - b[1])^2 - z^2 * v00
  r <- sort(c((-B - sqrt(B^2 - 4 * A * C)) / (2 * A), (-B + sqrt(B^2 - 4 * A * C)) / (2 * A)))
  c(th, r)
}
ref$damage <- list(x = d$altura_cm, y = d$area_mm2, inc = d$danado,
                   linear = list(coef = unname(coef(fl)), se = unname(sqrt(diag(vcov(fl)))), r2 = summary(fl)$r.squared, aic = AIC(fl)),
                   quadratic = list(coef = unname(coef(fq)), r2 = summary(fq)$r.squared, aic = AIC(fq)),
                   power = list(coef = unname(coef(fp))), exponential = list(coef = unname(coef(fe))),
                   glm = list(coef = unname(b), se = unname(sqrt(diag(V))), deviance = deviance(gl), ed50 = unname(fieller(0.5)), ed10 = unname(fieller(0.1))))

j <- toJSON(ref, auto_unbox = TRUE, digits = NA, matrix = "rowmajor")
writeLines(j, file.path(here, "ref_color_losses.json"))
writeLines(paste0("window.REF = window.REF || {}; window.REF.colorLosses = ", j, ";"), file.path(here, "ref_color_losses.js"))
cat("ref_color_losses listo\n")
