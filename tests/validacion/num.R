# PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
# Referencias de R para el núcleo numérico (js/num.js): cuantiles, binomial,
# rango estudentizado, comparaciones con un testigo (Dunnett), regresión,
# valores propios, valores singulares y mínimos cuadrados no lineales.
#   Rscript tests/validacion/num.R   (desde la carpeta de la app)
suppressPackageStartupMessages({ library(jsonlite); library(mvtnorm) })
here <- "tests/validacion"
set.seed(1)
ref <- list()

g <- expand.grid(p = c(0.001, 0.025, 0.1, 0.5, 0.9, 0.975, 0.999), df = c(1, 2.5, 5, 12, 40, 300))
ref$qt <- list(p = g$p, df = g$df, v = qt(g$p, g$df))
ref$qchisq <- list(p = g$p, df = g$df, v = qchisq(g$p, g$df))
g2 <- expand.grid(p = c(0.01, 0.5, 0.95, 0.999), d1 = c(1, 3, 7), d2 = c(2, 12, 60))
ref$qf <- list(p = g2$p, d1 = g2$d1, d2 = g2$d2, v = qf(g2$p, g2$d1, g2$d2))
g3 <- expand.grid(p = c(0.01, 0.3, 0.5, 0.95), a = c(0.5, 2, 9), b = c(0.7, 3, 20))
ref$qbeta <- list(p = g3$p, a = g3$a, b = g3$b, v = qbeta(g3$p, g3$a, g3$b))
g4 <- expand.grid(k = c(0, 3, 10, 17, 29), n = c(30, 60), p = c(1/3, 1/2, 0.8))
g4 <- g4[g4$k <= g4$n, ]
ref$pbinom <- list(k = g4$k, n = g4$n, p = g4$p, lower = pbinom(g4$k, g4$n, g4$p), upper = pbinom(g4$k, g4$n, g4$p, lower.tail = FALSE), d = dbinom(g4$k, g4$n, g4$p))
g5 <- expand.grid(q = c(0.95, 0.99, 0.5), n = c(12, 42, 100), p = c(1/3, 1/2))
ref$qbinom <- list(q = g5$q, n = g5$n, p = g5$p, v = qbinom(g5$q, g5$n, g5$p))
g6 <- expand.grid(q = c(0.5, 1, 2, 3, 4.5, 7), k = c(2, 3, 5, 10, 20), df = c(2, 5, 10, 30, 120))
ref$ptukey <- list(q = g6$q, k = g6$k, df = g6$df, v = ptukey(g6$q, g6$k, g6$df))
g7 <- expand.grid(p = c(0.9, 0.95, 0.99), k = c(2, 3, 5, 10), df = c(3, 5, 10, 30, 120))
ref$qtukey <- list(p = g7$p, k = g7$k, df = g7$df, v = qtukey(g7$p, g7$k, g7$df))

# Dunnett: cuantiles de la t multivariada con correlación de un factor (algoritmo
# aleatorizado de Genz–Bretz, por eso la tolerancia en la prueba es 2e-3)
dun <- list()
for (cfg in list(list(n = c(5, 5, 5, 5), df = 16), list(n = c(4, 6, 8, 5), df = 19), list(n = c(10, 10, 10), df = 27), list(n = c(3, 3, 3, 3, 3, 3), df = 12))) {
  n0 <- cfg$n[1]; ni <- cfg$n[-1]
  lam <- sqrt(ni / (ni + n0))
  R <- outer(lam, lam); diag(R) <- 1
  q2 <- qmvt(0.95, tail = "both.tails", df = cfg$df, corr = R, abseps = 1e-5)$quantile
  q1 <- qmvt(0.95, tail = "lower.tail", df = cfg$df, corr = R, abseps = 1e-5)$quantile
  p2 <- 1 - pmvt(lower = rep(-2.4, length(lam)), upper = rep(2.4, length(lam)), df = cfg$df, corr = R, abseps = 1e-6)[1]
  dun[[length(dun) + 1]] <- list(lambda = lam, df = cfg$df, q2 = q2, q1 = q1, p2_at_2.4 = p2)
}
ref$dunnett <- dun

# regresión
x <- 1:12; y <- 3 + 0.8 * x + rnorm(12)
X <- cbind(1, x, x^2)
f <- lm(y ~ x + I(x^2))
ref$lm <- list(X = X, y = y, coef = unname(coef(f)), se = unname(sqrt(diag(vcov(f)))), r2 = summary(f)$r.squared, sigma = summary(f)$sigma)
S <- crossprod(matrix(rnorm(30), 6, 5))
e <- eigen(S, symmetric = TRUE)
ref$eig <- list(S = S, values = e$values)
A <- matrix(rnorm(24), 6, 4)
ref$svd <- list(A = A, d = svd(A)$d)
tt <- c(0, 2, 4, 6, 8, 10, 12); yy <- c(125, 92, 70, 50, 39, 28, 21)
fn <- nls(yy ~ a * exp(-k * tt), start = list(a = 120, k = 0.1))
ref$nls <- list(t = tt, y = yy, coef = unname(coef(fn)), se = unname(sqrt(diag(vcov(fn)))), rss = deviance(fn))
ref$padjust <- list(p = c(0.01, 0.04, 0.03, 0.2, 0.005), holm = p.adjust(c(0.01, 0.04, 0.03, 0.2, 0.005), "holm"),
                    BH = p.adjust(c(0.01, 0.04, 0.03, 0.2, 0.005), "BH"), hochberg = p.adjust(c(0.01, 0.04, 0.03, 0.2, 0.005), "hochberg"),
                    bonferroni = p.adjust(c(0.01, 0.04, 0.03, 0.2, 0.005), "bonferroni"))

j <- toJSON(ref, auto_unbox = TRUE, digits = NA, matrix = "rowmajor")
writeLines(j, file.path(here, "ref_num.json"))
writeLines(paste0("window.REF = window.REF || {}; window.REF.num = ", j, ";"), file.path(here, "ref_num.js"))
cat("ref_num listo\n")
