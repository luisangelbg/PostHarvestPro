# PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.
# Referencias de R para el motor de ensayos (js/trials.js): ANOVA factorial (tipos I y III),
# bloques, medidas repetidas (parcelas divididas en el tiempo, Greenhouse–Geisser, Huynh–Feldt,
# Mauchly), Tukey–Kramer, LSD, Bonferroni, Dunnett y comparación de pendientes.
#   Rscript tests/validacion/trials.R   (desde la carpeta de la app)
suppressPackageStartupMessages({ library(jsonlite); library(car); library(multcomp); library(emmeans); library(agricolae) })
here <- "tests/validacion"
set.seed(7)
ref <- list()
aovTab <- function(tab) {
  tab <- as.data.frame(tab)
  list(source = rownames(tab), df = unname(tab[["Df"]]), ss = unname(tab[["Sum Sq"]]), F = unname(tab[["F value"]]), p = unname(tab[["Pr(>F)"]]))
}

# ---- 1. factorial CRD: mango, días comunes a las tres temperaturas
m <- read.csv("data/mango_temperaturas.csv")
m <- m[m$dia <= 12, ]
m$temperatura <- factor(m$temperatura); m$dia <- factor(m$dia)
options(contrasts = c("contr.sum", "contr.poly"))
f1 <- lm(firmeza_N ~ temperatura * dia, data = m)
ref$crd <- list(rows = m[, c("temperatura", "dia", "firmeza_N")], type1 = aovTab(anova(f1)), type3 = aovTab(Anova(f1, type = 3)))
# desbalanceado: se quitan 7 filas
mu <- m[-c(3, 11, 20, 26, 37, 48, 55), ]
f2 <- lm(firmeza_N ~ temperatura * dia, data = mu)
ref$crdUnbal <- list(rows = mu[, c("temperatura", "dia", "firmeza_N")], type1 = aovTab(anova(f2)), type3 = aovTab(Anova(f2, type = 3)))

# ---- 2. factorial en bloques completos al azar (simulado)
d <- expand.grid(bloque = factor(1:4), trt = factor(c("T", "A", "B")), tiempo = factor(c(0, 7, 14)))
d$y <- 20 + as.integer(d$bloque) + c(0, 2, 3)[as.integer(d$trt)] - c(0, 3, 7)[as.integer(d$tiempo)] + rnorm(nrow(d))
f3 <- lm(y ~ bloque + trt * tiempo, data = d)
ref$rcbd <- list(rows = d, type1 = aovTab(anova(f3)), type3 = aovTab(Anova(f3, type = 3)))
options(contrasts = c("contr.treatment", "contr.poly"))

# ---- 3. comparaciones de medias en una vía (balanceado y desbalanceado)
oneway <- function(dd) {
  a <- aov(y ~ g, data = dd)
  tk <- TukeyHSD(a, "g")$g
  mse <- deviance(a) / df.residual(a)
  lsd <- pairwise.t.test(dd$y, dd$g, pool.sd = TRUE, p.adjust.method = "none")$p.value
  bon <- pairwise.t.test(dd$y, dd$g, pool.sd = TRUE, p.adjust.method = "bonferroni")$p.value
  dn <- summary(glht(a, linfct = mcp(g = "Dunnett")))
  set.seed(11)
  dn2 <- summary(glht(a, linfct = mcp(g = "Dunnett"), alternative = "greater"))
  hs <- HSD.test(a, "g", group = TRUE)$groups
  means <- tapply(dd$y, dd$g, mean); ns <- tapply(dd$y, dd$g, length)
  list(rows = dd, levels = levels(dd$g), means = unname(means), n = unname(ns), mse = mse, dfe = df.residual(a),
       tukey = list(pair = rownames(tk), diff = unname(tk[, "diff"]), lwr = unname(tk[, "lwr"]), upr = unname(tk[, "upr"]), p = unname(tk[, "p adj"])),
       lsd = list(rn = rownames(lsd), cn = colnames(lsd), p = unname(lsd)), bonf = list(rn = rownames(bon), cn = colnames(bon), p = unname(bon)),
       dunnett = list(est = unname(dn$test$coefficients), p = unname(dn$test$pvalues), pGreater = unname(dn2$test$pvalues)),
       hsdGroups = list(level = rownames(hs), groups = trimws(as.character(hs$groups))))
}
b <- data.frame(g = factor(rep(c("Testigo", "Cera", "Quitosano", "Ozono"), each = 6), levels = c("Testigo", "Cera", "Quitosano", "Ozono")))
b$y <- c(10, 13, 14, 11)[as.integer(b$g)] + rnorm(nrow(b), 0, 1.4)
ref$oneBal <- oneway(b)
u <- b[-c(2, 9, 10, 23), ]
ref$oneUnbal <- oneway(u)

# ---- 4. medidas repetidas: chayote, pérdida de peso días 5–25
ch <- read.csv("data/chayote_peso.csv")
ch <- ch[ch$dia > 0, ]
ch$tratamiento <- factor(ch$tratamiento, levels = unique(ch$tratamiento)); ch$fdia <- factor(ch$dia); ch$fruto <- factor(ch$fruto)
a <- aov(perdida_peso ~ tratamiento * fdia + Error(fruto), data = ch)
s <- summary(a)
ea <- s[["Error: fruto"]][[1]]; eb <- s[["Error: Within"]][[1]]
w <- reshape(ch[, c("fruto", "tratamiento", "dia", "perdida_peso")], idvar = c("fruto", "tratamiento"), timevar = "dia", direction = "wide")
Y <- as.matrix(w[, grep("perdida_peso", names(w))])
mlm <- lm(Y ~ tratamiento, data = w)
sph <- anova(mlm, X = ~1, test = "Spherical")
mau <- mauchly.test(mlm, X = ~1)
ref$rm <- list(rows = ch[, c("fruto", "tratamiento", "dia", "perdida_peso")],
               between = list(df = unname(ea[["Df"]]), ss = unname(ea[["Sum Sq"]]), F = unname(ea[["F value"]]), p = unname(ea[["Pr(>F)"]])),
               within = list(source = trimws(rownames(eb)), df = unname(eb[["Df"]]), ss = unname(eb[["Sum Sq"]]), F = unname(eb[["F value"]]), p = unname(eb[["Pr(>F)"]])),
               gg = unname(sph[["G-G Pr"]]), hf = unname(sph[["H-F Pr"]]), mauchlyW = unname(mau$statistic), mauchlyP = mau$p.value)
SSD <- crossprod(residuals(mlm)) / df.residual(mlm)
k <- ncol(Y); C <- contr.helmert(k); C <- t(apply(C, 2, function(v) v / sqrt(sum(v^2))))
ev <- eigen(C %*% SSD %*% t(C), symmetric = TRUE, only.values = TRUE)$values
n <- df.residual(mlm)
ref$rm$ggEps <- sum(ev)^2 / sum(ev^2) / (k - 1)
ref$rm$hfEps <- ((n + 1) * sum(ev)^2 - 2 * sum(ev^2)) / ((k - 1) * (n * sum(ev^2) - sum(ev)^2))

# ---- 5. pendientes por tratamiento (análisis de covarianza)
ch2 <- read.csv("data/chayote_peso.csv")
ch2$tratamiento <- factor(ch2$tratamiento, levels = unique(ch2$tratamiento))
sep <- lm(perdida_peso ~ tratamiento * dia, data = ch2)
par <- lm(perdida_peso ~ tratamiento + dia, data = ch2)
one <- lm(perdida_peso ~ dia, data = ch2)
an1 <- anova(par, sep); an2 <- anova(one, par)
per <- lapply(levels(ch2$tratamiento), function(l) { ff <- lm(perdida_peso ~ dia, data = ch2[ch2$tratamiento == l, ]); c(coef(ff), sqrt(diag(vcov(ff)))[2], summary(ff)$r.squared) })
et <- summary(pairs(emtrends(sep, ~ tratamiento, var = "dia"), adjust = "none"))
ref$slopes <- list(rows = ch2[, c("tratamiento", "dia", "perdida_peso")], levels = levels(ch2$tratamiento),
                   per = do.call(rbind, per), Fslope = an1$F[2], pslope = an1[["Pr(>F)"]][2], Fint = an2$F[2], pint = an2[["Pr(>F)"]][2],
                   pairs = list(contrast = as.character(et$contrast), est = et$estimate, se = et$SE, t = et$t.ratio, p = et$p.value, pHolm = p.adjust(et$p.value, "holm")))

j <- toJSON(ref, auto_unbox = TRUE, digits = NA, matrix = "rowmajor", dataframe = "rows")
writeLines(j, file.path(here, "ref_trials.json"))
writeLines(paste0("window.REF = window.REF || {}; window.REF.trials = ", j, ";"), file.path(here, "ref_trials.js"))
cat("ref_trials listo\n")
