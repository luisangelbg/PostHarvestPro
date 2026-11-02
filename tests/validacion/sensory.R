# PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later.
#
# Referencias para el motor de evaluación sensorial (js/sensory.js).
# Calcula con R 4.4.2 y los paquetes sensR, SensoMineR, FactoMineR, agricolae,
# DescTools y stats todos los valores contra los que se comparan las pruebas
# de tests/unit_sensory.js, y los escribe en ref_sensory.json y ref_sensory.js.
#
#   "C:/Program Files/R/R-4.4.2/bin/Rscript.exe" tests/validacion/sensory.R
#
# Además de la salida de cada función de los paquetes se guarda, cuando el
# paquete resuelve algo de forma aproximada (uniroot con tol = 1.2e-4 para d',
# chi-cuadrado no central para Pc del triangular, splines para el intervalo de
# verosimilitud), un valor «preciso» calculado aquí con integrate(rel.tol =
# 1e-12) y uniroot(tol = 1e-14): las pruebas comparan contra ambos, con
# tolerancias distintas (ver LEEME_sensory.md).

suppressWarnings(suppressMessages({
  library(sensR); library(SensoMineR); library(FactoMineR)
  library(agricolae); library(DescTools); library(jsonlite)
}))
set.seed(20261004)
args <- commandArgs(trailingOnly = FALSE)
here <- dirname(normalizePath(sub("^--file=", "", args[grep("^--file=", args)])))
REF <- list()

methods <- c("triangle", "duotrio", "twoAFC", "threeAFC", "tetrad")
PG <- c(triangle = 1/3, duotrio = 1/2, twoAFC = 1/2, threeAFC = 1/3, tetrad = 1/3)
EPSINF <- c(triangle = 1e-8, duotrio = 1e-10, twoAFC = 0, threeAFC = 1e-8, tetrad = 1e-8)

# ---------------------------------------------------------------- precisos
integ <- function(f, a, b) tryCatch(integrate(f, a, b, rel.tol = 1e-12, abs.tol = 0, subdivisions = 2000)$value,
  error = function(e) integrate(f, a, b, rel.tol = 1e-11, abs.tol = 1e-16, subdivisions = 2000)$value)
pcP <- function(method, d) {
  if (d <= 0) return(unname(PG[method]))
  if (!is.finite(d)) return(1)
  switch(method,
    twoAFC = pnorm(d / sqrt(2)),
    duotrio = { a <- pnorm(d / sqrt(2)); b <- pnorm(d / sqrt(6)); 1 - a - b + 2 * a * b },
    triangle = 2 * integ(function(z) (pnorm(-z * sqrt(3) + d * sqrt(2/3)) + pnorm(-z * sqrt(3) - d * sqrt(2/3))) * dnorm(z), 0, 12),
    threeAFC = integ(function(z) dnorm(z - d) * pnorm(z)^2, d - 12, d + 12),
    tetrad = 1 - 2 * integ(function(z) dnorm(z) * (2 * pnorm(z) * pnorm(z - d) - pnorm(z - d)^2), -12, 12))
}
derivP <- function(method, d) {
  if (d <= 0) return(NA_real_)
  if (!is.finite(d)) return(0)
  switch(method,
    twoAFC = dnorm(d / sqrt(2)) / sqrt(2),
    duotrio = psyderiv(d, "duotrio"),
    triangle = psyderiv(d, "triangle"),
    # 3-AFC integrada por partes: integrando positivo, sin cancelación para d grande
    threeAFC = 2 * integ(function(z) dnorm(z) * dnorm(z - d) * pnorm(z), d / 2 - 12, d / 2 + 12),
    tetrad = 4 * integ(function(z) dnorm(z) * dnorm(z - d) * (pnorm(z) - pnorm(z - d)), d / 2 - 12, d / 2 + 12))
}
dP <- function(method, pc) {
  pg <- PG[method]
  if (pc <= pg) return(0)
  if (pc >= 1 - EPSINF[method]) return(Inf)
  if (method == "twoAFC") return(sqrt(2) * qnorm(pc))
  uniroot(function(d) pcP(method, d) - pc, c(0, 20), tol = 1e-14)$root
}
# intervalo de verosimilitud perfil exacto (raíces de 2[l(p^) - l(p)] = z^2)
likCI <- function(x, n, conf) {
  ph <- x / n; t <- qnorm((1 + conf) / 2)^2 / 2
  ll <- function(p) dbinom(x, n, p, log = TRUE)
  l0 <- ll(ph)
  lo <- if (x == 0) 0 else uniroot(function(p) l0 - ll(p) - t, c(1e-15, ph), tol = 1e-15)$root
  hi <- if (x == n) 1 else uniroot(function(p) l0 - ll(p) - t, c(ph, 1 - 1e-15), tol = 1e-15)$root
  c(lo, hi)
}

# ---------------------------------------------------------------- Pc(d) y d(Pc)
dgrid <- c(0, 0.01, 0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6)
REF$pc <- do.call(rbind, lapply(methods, function(m) do.call(rbind, lapply(dgrid, function(d) data.frame(
  method = m, d = d, pc = psyfun(d, m), pcPrecise = pcP(m, d),
  deriv = if (d > 0) psyderiv(d, m) else NA_real_, derivPrecise = derivP(m, d))))))
# Barrido fino: dónde se aleja psyfun (sensR) del valor preciso. Se encontró
# que la integración por defecto de sensR (integrate sobre (-Inf, Inf) con
# rel.tol = 1.2e-4) da errores aislados de hasta 2.8e-4 (tetrada, d' = 2.16)
# y 1.2e-4 (3-AFC, d' = 0.46).
scan <- list()
for (m in c("triangle", "threeAFC", "tetrad")) for (d in seq(0.05, 8.5, by = 0.005)) {
  ref <- psyfun(d, m); pre <- pcP(m, d)
  if (abs(ref - pre) > 1e-6) scan[[length(scan) + 1]] <- list(method = m, d = d, pc = ref, pcPrecise = pre)
}
REF$pcScan <- scan
pcgrid <- list(c(0.3, 0.34, 0.36, 0.4, 0.45, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99, 0.999),
               c(0.45, 0.501, 0.51, 0.55, 0.6, 0.7, 0.8, 0.9, 0.95, 0.99, 0.999))
REF$dprime <- do.call(rbind, lapply(methods, function(m) {
  g <- if (PG[m] < 0.4) pcgrid[[1]] else pcgrid[[2]]
  do.call(rbind, lapply(g, function(p) data.frame(method = m, pc = p, d = psyinv(p, m), dPrecise = dP(m, p))))
}))

# ---------------------------------------------------------------- discrim
xn <- list(c(0, 20), c(5, 20), c(8, 20), c(10, 20), c(12, 20), c(15, 20), c(19, 20), c(20, 20),
           c(17, 30), c(21, 30), c(45, 100), c(55, 100), c(62, 100), c(80, 100), c(140, 300))
runDiscrim <- function(m, x, n, test, pd0, conf, stat, d0 = NULL) {
  r <- if (is.null(d0)) {
    if (test == "similarity" || pd0 > 0) discrim(x, n, pd0 = pd0, method = m, conf.level = conf, statistic = stat, test = test)
    else discrim(x, n, method = m, conf.level = conf, statistic = stat, test = test)
  } else discrim(x, n, d.prime0 = d0, method = m, conf.level = conf, statistic = stat, test = test)
  cf <- r$coefficients
  mu <- x / n; pg <- PG[m]
  # valores precisos: d' de la estimación y de los extremos, se(d') con la derivada precisa
  pcE <- max(mu, pg); dE <- dP(m, pcE)
  seD <- if (mu > pg && mu < 1) sqrt(mu * (1 - mu) / n) / derivP(m, dE) else NA_real_
  out <- list(method = m, correct = x, total = n, test = test, pd0 = pd0, d0 = if (is.null(d0)) NA_real_ else d0,
       conf = conf, statistic = stat,
       pc = cf[1, 1], pd = cf[2, 1], d = cf[3, 1], se_pc = cf[1, 2], se_pd = cf[2, 2], se_d = cf[3, 2],
       lo_pc = cf[1, 3], hi_pc = cf[1, 4], lo_pd = cf[2, 3], hi_pd = cf[2, 4], lo_d = cf[3, 3], hi_d = cf[3, 4],
       p = r$p.value, stat_value = if (is.null(r$stat.value)) NA_real_ else unname(r$stat.value),
       dPrecise = dE, se_dPrecise = seD,
       lo_dPrecise = dP(m, max(cf[1, 3], pg)), hi_dPrecise = dP(m, max(cf[1, 4], pg)),
       # con d'0 el paquete obtiene pc0 de su Pc aproximada; aquí, de la precisa
       pPrecise = if (is.null(d0) || stat != "exact") NA_real_ else {
         pc0 <- pcP(m, d0); if (test == "difference") pbinom(x - 1, n, pc0, lower.tail = FALSE) else pbinom(x, n, pc0) })
  if (stat == "likelihood") {
    ci <- pmin(pmax(likCI(x, n, conf), 0), 1)
    out$lo_pcExact <- max(ci[1], pg); out$hi_pcExact <- max(ci[2], pg)
  }
  out
}
dl <- list()
for (m in methods) for (v in xn) {
  dl[[length(dl) + 1]] <- runDiscrim(m, v[1], v[2], "difference", 0, 0.95, "exact")
  dl[[length(dl) + 1]] <- runDiscrim(m, v[1], v[2], "similarity", 0.2, 0.95, "exact")
}
for (m in methods) for (v in xn[c(3, 5, 9, 12, 14)]) {
  dl[[length(dl) + 1]] <- runDiscrim(m, v[1], v[2], "difference", 0.1, 0.90, "exact")
  dl[[length(dl) + 1]] <- runDiscrim(m, v[1], v[2], "similarity", 0.3, 0.99, "exact")
  dl[[length(dl) + 1]] <- runDiscrim(m, v[1], v[2], "similarity", 0, 0.95, "exact", d0 = 1)
  for (st in c("likelihood", "score", "Wald")) {
    dl[[length(dl) + 1]] <- runDiscrim(m, v[1], v[2], "difference", 0, 0.95, st)
    dl[[length(dl) + 1]] <- runDiscrim(m, v[1], v[2], "similarity", 0.25, 0.90, st)
  }
}
REF$discrim <- dl

# ---------------------------------------------------------------- findcr, discrimPwr, discrimSS
fc <- list()
for (n in c(5, 10, 12, 15, 18, 20, 24, 30, 36, 40, 50, 60, 75, 100, 150, 200, 500))
  for (pg in c(1/2, 1/3)) for (al in c(0.01, 0.05, 0.1))
    for (cfg in list(c("difference", 0), c("difference", 0.1), c("similarity", 0.2), c("similarity", 0.3), c("similarity", 0.5))) {
      cr <- tryCatch(findcr(n, alpha = al, p0 = pg, pd0 = as.numeric(cfg[2]), test = cfg[1]), error = function(e) NA_real_)
      fc[[length(fc) + 1]] <- list(n = n, pg = pg, alpha = al, test = cfg[1], pd0 = as.numeric(cfg[2]), cr = cr)
    }
REF$findcr <- fc
pw <- list()
for (m in methods) for (n in c(10, 20, 30, 50, 100)) {
  for (pdA in c(0.1, 0.2, 0.3, 0.5))
    pw[[length(pw) + 1]] <- list(method = m, n = n, pdA = pdA, dA = NA_real_, alpha = 0.05, test = "difference", pd0 = 0,
      power = discrimPwr(pdA, sample.size = n, alpha = 0.05, pGuess = PG[[m]], test = "difference"),
      cr = findcr(n, alpha = 0.05, p0 = PG[[m]], pd0 = 0, test = "difference"))
  for (cfg in list(c(0.3, 0.1), c(0.5, 0.2)))
    pw[[length(pw) + 1]] <- list(method = m, n = n, pdA = cfg[1], dA = NA_real_, alpha = 0.05, test = "difference", pd0 = cfg[2],
      power = discrimPwr(cfg[1], pd0 = cfg[2], sample.size = n, alpha = 0.05, pGuess = PG[[m]], test = "difference"),
      cr = findcr(n, alpha = 0.05, p0 = PG[[m]], pd0 = cfg[2], test = "difference"))
  for (cfg in list(c(0, 0.3), c(0.1, 0.4), c(0, 0.5)))
    pw[[length(pw) + 1]] <- list(method = m, n = n, pdA = cfg[1], dA = NA_real_, alpha = 0.05, test = "similarity", pd0 = cfg[2],
      power = discrimPwr(cfg[1], pd0 = cfg[2], sample.size = n, alpha = 0.05, pGuess = PG[[m]], test = "similarity"),
      cr = tryCatch(findcr(n, alpha = 0.05, p0 = PG[[m]], pd0 = cfg[2], test = "similarity"), error = function(e) NA_real_))
  for (dA in c(0.5, 1, 1.5, 2))
    pw[[length(pw) + 1]] <- list(method = m, n = n, pdA = NA_real_, dA = dA, alpha = 0.1, test = "difference", pd0 = 0,
      power = d.primePwr(dA, sample.size = n, alpha = 0.1, method = m),
      cr = NA_real_)
}
# casos pequeños de similitud en los que la prueba no puede rechazar (crítico −1)
for (n in c(3, 5, 8)) for (pg in c(1/2, 1/3))
  pw[[length(pw) + 1]] <- list(method = if (pg == 0.5) "duotrio" else "triangle", n = n, pdA = 0, dA = NA_real_, alpha = 0.05, test = "similarity", pd0 = 0.2,
    power = discrimPwr(0, pd0 = 0.2, sample.size = n, alpha = 0.05, pGuess = pg, test = "similarity"),
    cr = findcr(n, alpha = 0.05, p0 = pg, pd0 = 0.2, test = "similarity"))
REF$power <- pw
ss <- list()
for (pg in c(1/2, 1/3)) for (pdA in c(0.2, 0.3, 0.4, 0.5)) for (pow in c(0.8, 0.9)) for (al in c(0.05, 0.1))
  ss[[length(ss) + 1]] <- list(method = if (pg == 0.5) "twoAFC" else "triangle", pdA = pdA, dA = NA_real_, power = pow, alpha = al, test = "difference", pd0 = 0,
    n = discrimSS(pdA, target.power = pow, alpha = al, pGuess = pg, test = "difference"))
for (pg in c(1/2, 1/3)) for (cfg in list(c(0, 0.3), c(0, 0.4), c(0.1, 0.5), c(0, 0.5))) for (pow in c(0.8, 0.9))
  ss[[length(ss) + 1]] <- list(method = if (pg == 0.5) "duotrio" else "tetrad", pdA = cfg[1], dA = NA_real_, power = pow, alpha = 0.05, test = "similarity", pd0 = cfg[2],
    n = discrimSS(cfg[1], pd0 = cfg[2], target.power = pow, alpha = 0.05, pGuess = pg, test = "similarity"))
for (m in methods) for (dA in c(0.8, 1, 1.5, 2))
  ss[[length(ss) + 1]] <- list(method = m, pdA = NA_real_, dA = dA, power = 0.8, alpha = 0.05, test = "difference", pd0 = 0,
    n = d.primeSS(dA, target.power = 0.8, alpha = 0.05, method = m))
for (pg in c(1/2, 1/3)) for (cfg in list(c(0.4, 0.1), c(0.5, 0.2), c(0.6, 0.3)))
  ss[[length(ss) + 1]] <- list(method = if (pg == 0.5) "twoAFC" else "threeAFC", pdA = cfg[1], dA = NA_real_, power = 0.9, alpha = 0.05, test = "difference", pd0 = cfg[2],
    n = discrimSS(cfg[1], pd0 = cfg[2], target.power = 0.9, alpha = 0.05, pGuess = pg, test = "difference"))
REF$sampleSize <- ss

# ---------------------------------------------------------------- A-Not A, binom.test, preferencia
REF$anota <- lapply(list(c(30, 50, 15, 50), c(10, 20, 4, 20), c(45, 60, 20, 55), c(80, 100, 30, 100),
                         c(5, 25, 2, 25), c(12, 40, 15, 40), c(57, 60, 3, 60)), function(v) {
  r <- AnotA(v[1], v[2], v[3], v[4])
  list(x1 = v[1], n1 = v[2], x2 = v[3], n2 = v[4], d = unname(coef(r)), se = unname(r$se), p = r$p.value)
})
bt <- list()
for (cfg in list(c(7, 20, 0.5), c(13, 20, 0.5), c(10, 20, 0.5), c(0, 15, 1/3), c(15, 15, 1/3), c(12, 30, 1/3),
                 c(25, 40, 1/3), c(3, 50, 0.1), c(60, 100, 0.5), c(1, 1, 0.5), c(41, 123, 0.3)))
  for (alt in c("two.sided", "less", "greater")) for (cl in c(0.95, 0.9)) {
    r <- binom.test(cfg[1], cfg[2], cfg[3], alternative = alt, conf.level = cl)
    bt[[length(bt) + 1]] <- list(x = cfg[1], n = cfg[2], p0 = cfg[3], alternative = alt, conf = cl,
      p = r$p.value, lo = r$conf.int[1], hi = r$conf.int[2])
  }
REF$binom <- bt
pref <- list()
for (cfg in list(c(30, 18, 0), c(30, 18, 10), c(30, 18, 11), c(25, 25, 4), c(40, 10, 3)))
  for (ties in c("ignore", "split")) {
    h <- if (ties == "split") floor(cfg[3] / 2) else 0
    x <- cfg[1] + h; n <- cfg[1] + cfg[2] + 2 * h
    r <- binom.test(x, n, 0.5)
    pref[[length(pref) + 1]] <- list(nA = cfg[1], nB = cfg[2], noPref = cfg[3], ties = ties, x = x, n = n,
                                     p = r$p.value, lo = r$conf.int[1], hi = r$conf.int[2])
  }
REF$preference <- pref

# ---------------------------------------------------------------- hedónica
simHed <- function(nP, nC, missing = 0, decimals = FALSE) {
  prod <- paste0("P", c(3, 1, 5, 2, 4, 6, 7)[1:nP])
  eff <- rnorm(nP, 0, 0.8); ceff <- rnorm(nC, 0, 1)
  d <- expand.grid(product = prod, consumer = sprintf("C%02d", 1:nC), stringsAsFactors = FALSE)[, c("consumer", "product")]
  d <- d[order(d$consumer), ]
  s <- 6 + eff[match(d$product, prod)] + ceff[match(d$consumer, sprintf("C%02d", 1:nC))] + rnorm(nrow(d), 0, 1.2)
  d$score <- if (decimals) round(s, 1) else pmin(9, pmax(1, round(s)))
  if (missing > 0) d <- d[-sample(nrow(d), round(missing * nrow(d))), ]
  rownames(d) <- NULL
  d
}
hedRef <- function(name, d, alpha = 0.05) {
  d$product <- factor(d$product, levels = unique(d$product)); d$consumer <- factor(d$consumer, levels = unique(d$consumer))
  fit <- aov(score ~ product + consumer, data = d)
  tab <- summary(fit)[[1]]
  adj <- anova(lm(score ~ consumer + product, data = d))
  tk <- TukeyHSD(fit, "product", conf.level = 1 - alpha)$product
  hs <- HSD.test(fit, "product", alpha = alpha)
  grp <- hs$groups
  lv <- levels(d$product)
  list(name = name, alpha = alpha,
       data = list(consumer = as.character(d$consumer), product = as.character(d$product), score = d$score),
       anova = list(df = unname(tab[, 1]), ss = unname(tab[, 2]), ms = unname(tab[, 3]), F = unname(tab[1:2, 4]), p = unname(tab[1:2, 5])),
       adjusted = list(df = adj["product", 1], ss = adj["product", 2], F = adj["product", 4], p = adj["product", 5]),
       means = list(product = lv, n = as.numeric(table(d$product)[lv]), mean = as.numeric(tapply(d$score, d$product, mean)[lv]),
                    sd = as.numeric(tapply(d$score, d$product, sd)[lv]), se = hs$means[lv, "se"]),
       tukey = list(pair = rownames(tk), diff = unname(tk[, 1]), lwr = unname(tk[, 2]), upr = unname(tk[, 3]), p = unname(tk[, 4])),
       letters = list(product = rownames(grp), group = trimws(as.character(grp$groups))),
       hsd = if (is.null(hs$statistics$MSD)) NA_real_ else hs$statistics$MSD,
       cv = hs$statistics$CV, mse = hs$statistics$MSerror, dfe = hs$statistics$Df)
}
REF$hedonic <- list(hedRef("balanceado 5x40", simHed(5, 40)),
                    hedRef("faltantes 6x30", simHed(6, 30, missing = 0.15)),
                    hedRef("pequeño 3x12", simHed(3, 12, decimals = TRUE)),
                    hedRef("balanceado 4x25 alfa 0.10", simHed(4, 25), alpha = 0.10))

# ---------------------------------------------------------------- JAR
simJar <- function(levels, nC, prods, attrs) {
  ctr <- (levels + 1) / 2
  rows <- list()
  for (p in prods) {
    sh <- rnorm(length(attrs), 0, 0.7)
    for (c in 1:nC) {
      j <- pmin(levels, pmax(1, round(ctr + sh + rnorm(length(attrs), 0, levels / 5))))
      lik <- pmin(9, pmax(1, round(7.2 - 0.9 * sum(abs(j - ctr)) / length(attrs) * 2 + rnorm(1, 0, 1))))
      for (a in seq_along(attrs)) rows[[length(rows) + 1]] <- data.frame(consumer = sprintf("C%03d", c), product = p, attribute = attrs[a], jar = j[a], liking = lik)
    }
  }
  do.call(rbind, rows)
}
jarRef <- function(name, d, levels, thr = 20) {
  ctr <- (levels + 1) / 2
  res <- list()
  for (p in unique(d$product)) for (a in unique(d$attribute)) {
    s <- d[d$product == p & d$attribute == a, ]
    lo <- s$liking[s$jar < ctr]; ja <- s$liking[s$jar == ctr]; hi <- s$liking[s$jar > ctr]
    tp <- function(g) if (length(g) >= 2 && length(ja) >= 2) t.test(g, ja, var.equal = TRUE)$p.value else NA_real_
    mn <- function(g) if (length(g)) mean(g) else NA_real_
    n <- nrow(s)
    res[[length(res) + 1]] <- list(product = p, attribute = a, n = n, nLow = length(lo), nJar = length(ja), nHigh = length(hi),
      pctLow = 100 * length(lo) / n, pctJar = 100 * length(ja) / n, pctHigh = 100 * length(hi) / n,
      meanJar = mn(ja), meanLow = mn(lo), meanHigh = mn(hi),
      penaltyLow = (mn(ja) - mn(lo)) * length(lo) / n, penaltyHigh = (mn(ja) - mn(hi)) * length(hi) / n,
      pLow = tp(lo), pHigh = tp(hi), flagLow = 100 * length(lo) / n >= thr, flagHigh = 100 * length(hi) / n >= thr)
  }
  list(name = name, levels = levels, threshold = thr,
       data = list(consumer = d$consumer, product = d$product, attribute = d$attribute, jar = d$jar, liking = d$liking),
       results = res)
}
REF$jar <- list(jarRef("5 niveles", simJar(5, 60, c("A", "B", "C"), c("dulzor", "acidez", "firmeza", "aroma")), 5),
                jarRef("3 niveles", simJar(3, 40, c("X", "Y"), c("sal", "color")), 3),
                jarRef("7 niveles, umbral 25", simJar(7, 50, c("M1", "M2", "M3"), c("jugosidad", "crujido")), 7, 25))

# ---------------------------------------------------------------- Cochran, McNemar, CATA, CA
REF$cochran <- lapply(1:4, function(i) {
  b <- c(12, 20, 30, 15)[i]; k <- c(3, 4, 5, 2)[i]
  M <- matrix(rbinom(b * k, 1, rep(seq(0.3, 0.7, length = k), each = b)), b, k)
  if (i == 2) { M[1, ] <- 1; M[2, ] <- 0 }
  r <- CochranQTest(M)
  list(M = M, Q = unname(r$statistic), df = unname(r$parameter), p = r$p.value)
})
REF$mcnemar <- lapply(1:5, function(i) {
  n <- c(30, 50, 20, 40, 25)[i]
  x <- rbinom(n, 1, 0.5); y <- ifelse(runif(n) < c(0.3, 0.5, 0.2, 0.0, 0.4)[i], 1 - x, x)
  if (i == 5) y <- x                     # b = c = 0: sin información
  tb <- table(factor(x, 0:1), factor(y, 0:1))
  r1 <- suppressWarnings(mcnemar.test(tb, correct = TRUE)); r0 <- suppressWarnings(mcnemar.test(tb, correct = FALSE))
  list(x = x, y = y, stat = unname(r1$statistic), p = r1$p.value, stat0 = unname(r0$statistic), p0 = r0$p.value)
})
simCata <- function(nC, prods, attrs) {
  pr <- matrix(runif(length(prods) * length(attrs), 0.1, 0.8), length(prods))
  pr[, 6] <- 0.35
  rows <- list()
  for (c in 1:nC) for (i in seq_along(prods)) {
    v <- rbinom(length(attrs), 1, pmax(0.02, pmin(0.95, pr[i, ] + rnorm(1, 0, 0.05))))
    rows[[length(rows) + 1]] <- c(list(consumer = sprintf("K%02d", c), product = prods[i]), setNames(as.list(v), attrs))
  }
  do.call(rbind.data.frame, rows)
}
cataRef <- function(d, attrs) {
  prods <- unique(d$product)
  counts <- t(sapply(prods, function(p) colSums(d[d$product == p, attrs])))
  nE <- as.numeric(table(d$product)[prods])
  per <- lapply(attrs, function(a) {
    M <- sapply(prods, function(p) d[d$product == p, a][match(unique(d$consumer), d$consumer[d$product == p])])
    q <- CochranQTest(M)
    pr <- combn(length(prods), 2)
    st <- pv <- numeric(ncol(pr))
    for (k in 1:ncol(pr)) {
      tb <- table(factor(M[, pr[1, k]], 0:1), factor(M[, pr[2, k]], 0:1))
      r <- suppressWarnings(mcnemar.test(tb))
      st[k] <- unname(r$statistic); pv[k] <- r$p.value
    }
    list(attribute = a, Q = unname(q$statistic), df = unname(q$parameter), p = q$p.value,
         a = prods[pr[1, ]], b = prods[pr[2, ]], stat = st, pp = pv, pAdj = p.adjust(pv, "holm"))
  })
  ca <- CA(as.data.frame(counts), graph = FALSE, ncp = 20)
  list(counts = unname(counts), pct = unname(100 * counts / nE), perAttribute = per, ca = caRef(ca, counts))
}
caRef <- function(ca, tab) {
  ch <- suppressWarnings(chisq.test(tab, correct = FALSE))
  list(eig = unname(ca$eig[, 1]), pct = unname(ca$eig[, 2]), cum = unname(ca$eig[, 3]),
       rowCoord = unname(ca$row$coord), rowContrib = unname(ca$row$contrib), rowCos2 = unname(ca$row$cos2), rowInertia = unname(ca$row$inertia),
       colCoord = unname(ca$col$coord), colContrib = unname(ca$col$contrib), colCos2 = unname(ca$col$cos2), colInertia = unname(ca$col$inertia),
       chi2 = unname(ch$statistic), df = unname(ch$parameter), p = ch$p.value)
}
cattrs <- c("dulce", "acido", "jugoso", "harinoso", "firme", "aromatico")
cd <- simCata(40, c("Manzana A", "Manzana B", "Manzana C", "Manzana D"), cattrs)
REF$cata <- c(list(attributes = cattrs, data = as.list(cd)), cataRef(cd, cattrs))
REF$ca <- lapply(list(matrix(rpois(20, 15) + 1, 5, 4), matrix(rpois(18, 8) + 1, 3, 6), matrix(rpois(42, 20), 7, 6)), function(tab) {
  ca <- CA(as.data.frame(tab), graph = FALSE, ncp = 20)
  c(list(table = tab), caRef(ca, tab))
})

# ---------------------------------------------------------------- Friedman
friRef <- function(name, M, alpha = 0.05) {
  b <- nrow(M); t <- ncol(M)
  trt <- paste0("T", 1:t)
  judge <- rep(paste0("J", sprintf("%02d", 1:b)), times = t); tr <- rep(trt, each = b); ev <- as.vector(M)
  ft <- friedman.test(M)
  ag <- agricolae::friedman(judge, tr, ev, alpha = alpha, group = TRUE)
  agc <- agricolae::friedman(judge, tr, ev, alpha = alpha, group = FALSE)
  list(name = name, M = M, alpha = alpha, chi2 = unname(ft$statistic), df = unname(ft$parameter), p = ft$p.value,
       chi2Ag = ag$statistics$Chisq, F = ag$statistics$F, pF = ag$statistics$p.F,
       # agricolae calcula 1 - pf(...): se pierden dígitos cuando p es pequeño
       pFprecise = pf(ag$statistics$F, t - 1, (b - 1) * (t - 1), lower.tail = FALSE),
       lsd = if (is.null(ag$statistics$LSD)) NA_real_ else ag$statistics$LSD, tvalue = if (is.null(ag$statistics$t.value)) NA_real_ else ag$statistics$t.value,
       rankSums = ag$means[trt, "rankSum"],
       letters = list(trt = rownames(ag$groups), group = trimws(as.character(ag$groups$groups))),
       pairs = list(pair = rownames(agc$comparison), diff = agc$comparison$difference, p = agc$comparison$pvalue))
}
REF$friedman <- list(
  friRef("puntuaciones 1-5, 12x4", matrix(sample(1:5, 48, replace = TRUE), 12, 4) + outer(rep(1, 12), c(0, 1, 0, 2))),
  friRef("rangos sin empates, 10x5", t(replicate(10, sample(1:5)))[, c(1, 2, 3, 4, 5)] ),
  friRef("muchos empates, 15x3", matrix(sample(1:3, 45, replace = TRUE, prob = c(0.2, 0.5, 0.3)), 15, 3)),
  friRef("alfa 0.10, 20x6", matrix(round(rnorm(120, rep(c(5, 5.5, 6, 6, 7, 5), each = 20), 1)), 20, 6), alpha = 0.10))

# ---------------------------------------------------------------- QDA
simQda <- function(prods, pans, reps, attrs, missing = 0, session = TRUE) {
  d <- expand.grid(rep = 1:reps, product = prods, panelist = pans, stringsAsFactors = FALSE)
  d <- d[order(d$panelist, d$rep, d$product), ]
  for (a in attrs) {
    pe <- rnorm(length(prods), 0, 1.2); je <- rnorm(length(pans), 0, 0.8)
    ie <- matrix(rnorm(length(prods) * length(pans), 0, 0.5), length(prods))
    noise <- runif(length(pans), 0.3, 1.4)
    pi <- match(d$product, prods); ji <- match(d$panelist, pans)
    d[[a]] <- round(pmin(10, pmax(0, 5 + pe[pi] + je[ji] + ie[cbind(pi, ji)] + rnorm(nrow(d)) * noise[ji])), 1)
    if (missing > 0) d[[a]][sample(nrow(d), round(missing * nrow(d)))] <- NA
  }
  out <- data.frame(panelist = d$panelist, product = d$product, stringsAsFactors = FALSE)
  if (session) out$session <- paste0("S", d$rep)
  cbind(out, d[, attrs])
}
qdaRef <- function(name, d, attrs, session, alpha = 0.05) {
  dd <- d
  dd$product <- factor(dd$product, levels = unique(dd$product)); dd$panelist <- factor(dd$panelist, levels = unique(dd$panelist))
  if (session) dd$session <- factor(dd$session, levels = unique(dd$session))
  rep <- any(table(dd$product, dd$panelist) > 1)
  terms <- c("product", "panelist", if (session) "session", if (rep) "product:panelist")
  fo <- paste("~", paste(terms, collapse = "+"))
  per <- lapply(attrs, function(a) {
    fit <- aov(as.formula(paste(a, fo)), data = dd)
    tab <- summary(fit)[[1]]
    k <- nrow(tab)
    if (rep) { msI <- tab[k - 1, 3]; dfI <- tab[k - 1, 1] } else { msI <- tab[k, 3]; dfI <- tab[k, 1] }
    fM <- tab[1, 3] / msI; pM <- pf(fM, tab[1, 1], dfI, lower.tail = FALSE)
    y <- dd[[a]]; ok <- !is.na(y)
    lsd <- LSD.test(y[ok], dd$product[ok], DFerror = dfI, MSerror = msI, alpha = alpha)
    hsd <- HSD.test(y[ok], dd$product[ok], DFerror = dfI, MSerror = msI, alpha = alpha)
    lv <- levels(dd$product)
    mn <- tapply(y, dd$product, mean, na.rm = TRUE)[lv]; nn <- tapply(!is.na(y), dd$product, sum)[lv]
    cmb <- combn(length(lv), 2)
    plsd <- sapply(1:ncol(cmb), function(k) { i <- cmb[1, k]; j <- cmb[2, k]; 2 * pt(-abs(mn[i] - mn[j]) / sqrt(msI * (1 / nn[i] + 1 / nn[j])), dfI) })
    # medias del panel = promedio de las medias de celda panelista x producto
    cm <- tapply(y, list(dd$product, dd$panelist), mean, na.rm = TRUE)
    list(attribute = a, source = gsub(" ", "", rownames(tab)), df = unname(tab[, 1]), ss = unname(tab[, 2]), ms = unname(tab[, 3]),
         F = unname(tab[-k, 4]), p = unname(tab[-k, 5]), fMixed = fM, pMixed = pM, msI = msI, dfI = dfI,
         r2 = summary.lm(fit)$r.squared, sdRes = sqrt(tab[k, 3]),
         means = unname(mn), n = unname(nn), pLSD = unname(plsd),
         lettersLSD = list(product = rownames(lsd$groups), group = trimws(as.character(lsd$groups$groups))),
         lettersHSD = list(product = rownames(hsd$groups), group = trimws(as.character(hsd$groups$groups))),
         panelMeans = unname(rowMeans(cm[lv, ], na.rm = TRUE)))
  })
  # SensoMineR: panelperf (modelo completo, panelista aleatorio) y paneliperf (por panelista, ~Product)
  sm <- data.frame(Product = dd$product, Panelist = dd$panelist)
  if (session) sm$Session <- dd$session
  sm <- cbind(sm, dd[, attrs])
  fo2 <- paste("~Product+Panelist", if (session) "+Session", if (rep) "+Product:Panelist", sep = "")
  pp <- panelperf(sm, formul = fo2, firstvar = ncol(sm) - length(attrs) + 1, random = TRUE)
  pi <- if (rep) paneliperf(sm, formul = paste("~Product+Panelist", if (rep) "+Product:Panelist", sep = ""), formul.j = "~Product",
                            col.j = 2, firstvar = ncol(sm) - length(attrs) + 1, synthesis = FALSE) else NULL
  list(name = name, attributes = attrs, session = session, alpha = alpha,
       data = as.list(d), perAttribute = per,
       panelperf = list(terms = colnames(pp$p.value), p = unname(pp$p.value), res = unname(pp$res[, 1]), r2 = unname(pp$r2[, 1]), variability = unname(pp$variability)),
       paneliperf = if (is.null(pi)) NULL else list(panelists = rownames(pi$prob.ind), prob = unname(pi$prob.ind), res = unname(pi$res.ind), agree = unname(pi$agree.ind)))
}
qattrs <- c("firmeza", "dulzor", "acidez", "aroma")
q1 <- simQda(c("Pera 1", "Pera 2", "Pera 3", "Pera 4", "Pera 5"), sprintf("J%d", 1:8), 2, qattrs)
q2 <- simQda(c("A", "B", "C", "D"), sprintf("E%02d", 1:6), 3, qattrs[1:3], missing = 0.06, session = FALSE)
q3 <- simQda(c("L1", "L2", "L3", "L4"), sprintf("P%02d", 1:10), 1, qattrs[c(1, 4)], session = FALSE)
REF$qda <- list(qdaRef("5 productos x 8 jueces x 2 sesiones", q1, qattrs, TRUE),
                qdaRef("4 x 6 x 3 repeticiones con faltantes", q2, qattrs[1:3], FALSE),
                qdaRef("sin repeticiones 4 x 10", q3, qattrs[c(1, 4)], FALSE, alpha = 0.10))

# ---------------------------------------------------------------- ACP
pcaRef <- function(name, X, scale) {
  r <- PCA(as.data.frame(X), scale.unit = scale, ncp = 50, graph = FALSE)
  list(name = name, X = unname(X), scale = scale,
       eig = unname(r$eig[, 1]), pct = unname(r$eig[, 2]), cum = unname(r$eig[, 3]),
       indCoord = unname(r$ind$coord), indCos2 = unname(r$ind$cos2), indContrib = unname(r$ind$contrib), indDist = unname(r$ind$dist),
       varCoord = unname(r$var$coord), varCor = unname(r$var$cor), varCos2 = unname(r$var$cos2), varContrib = unname(r$var$contrib))
}
qm <- aggregate(q1[, qattrs], by = list(product = q1$product), FUN = mean)
Xr <- matrix(rnorm(60), 12, 5) %*% matrix(runif(25, -1, 1), 5, 5); Xr[, 3] <- Xr[, 3] * 10 + 50
REF$pca <- list(pcaRef("medias QDA 5x4", as.matrix(qm[, qattrs]), TRUE),
                pcaRef("aleatoria 12x5 estandarizada", Xr, TRUE),
                pcaRef("aleatoria 12x5 sin estandarizar", Xr, FALSE),
                pcaRef("n < p, 4x6", matrix(rnorm(24), 4, 6), TRUE))

# ---------------------------------------------------------------- escritura
REF$meta <- list(R = R.version.string, sensR = as.character(packageVersion("sensR")), SensoMineR = as.character(packageVersion("SensoMineR")),
                 FactoMineR = as.character(packageVersion("FactoMineR")), agricolae = as.character(packageVersion("agricolae")),
                 DescTools = as.character(packageVersion("DescTools")), seed = 20261004)
js <- toJSON(REF, digits = NA, auto_unbox = TRUE, na = "string", dataframe = "rows", matrix = "rowmajor")
writeLines(js, file.path(here, "ref_sensory.json"), useBytes = TRUE)
writeLines(paste0("window.REF = window.REF || {};\nwindow.REF.sensory = ", js, ";"), file.path(here, "ref_sensory.js"), useBytes = TRUE)
cat("ref_sensory escrito:", nchar(js), "caracteres\n")
