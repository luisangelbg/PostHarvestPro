# PostHarvestPro — referencias de R para el motor de cinética y vida de anaquel (js/kinetics.js).
# Copyright (C) 2026  Luis Ángel Barrera-Guzmán. GPL-3.0-or-later.
#
# Genera conjuntos simulados (semilla fija) y calcula con R:
#   * stats::nls  (Gauss–Newton, tol = 1e-10): ajustes de orden 0, 1 y 2 en la escala original,
#     EE, vcov, AIC/BIC (stats::AIC, stats::BIC), y el tiempo al límite reparametrizando el modelo
#     (nls con el tiempo al límite como parámetro: su EE es el del método delta).
#   * stats::lm   : regresiones linealizadas (y, ln y, 1/y), Arrhenius, raíz cuadrada (Ratkowsky),
#     prueba acelerada (ASLT) con predict(..., interval = "confidence" / "prediction").
#   * stats::deriv: gradientes analíticos para los intervalos de predicción de la media de nls.
# Escribe tests/validacion/ref_kinetics.json y ref_kinetics.js.
#
#   "C:/Program Files/R/R-4.4.2/bin/Rscript.exe" tests/validacion/kinetics.R

suppressMessages(library(jsonlite))
args <- commandArgs(trailingOnly = FALSE)
here <- dirname(normalizePath(sub("^--file=", "", args[grep("^--file=", args)])))
set.seed(20261004)

RG <- 8.314462618
K0 <- 273.15
CONF <- 0.95
## tol = 1e-8: the relative-offset criterion (Bates & Watts 1981) puts the estimates within
## 1e-8 standard errors of the optimum; below ~1e-10 it stalls on rounding
ctl <- nls.control(maxiter = 1000, tol = 1e-8, minFactor = 1 / 4096^2)
un <- function(x) unname(as.numeric(x))
um <- function(m) { m <- as.matrix(m); dimnames(m) <- NULL; m }

## nls is given the analytic gradient (deriv), not forward differences, so that its
## estimates and standard errors are exact to rounding
form <- list(y ~ dfun[[1]](C0, k, t), y ~ dfun[[2]](C0, k, t), y ~ dfun[[3]](C0, k, t))
dfun <- list(
  deriv(~ C0 - k * t, c("C0", "k"), function.arg = c("C0", "k", "t")),
  deriv(~ C0 * exp(-k * t), c("C0", "k"), function.arg = c("C0", "k", "t")),
  deriv(~ C0 / (1 + C0 * k * t), c("C0", "k"), function.arg = c("C0", "k", "t")))
rfun <- list(
  deriv(~ C0 - (C0 - L) / tL * t, c("C0", "tL"), function.arg = c("C0", "tL", "t", "L")),
  deriv(~ C0 * exp(-log(C0 / L) / tL * t), c("C0", "tL"), function.arg = c("C0", "tL", "t", "L")),
  deriv(~ C0 / (1 + (C0 / L - 1) * t / tL), c("C0", "tL"), function.arg = c("C0", "tL", "t", "L")))
gen <- function(order, C0, k, t) switch(order + 1, C0 - k * t, C0 * exp(-k * t), C0 / (1 + C0 * k * t))
# g(C0, L): the integrated kinetic function between C0 and the limit L
gL <- function(order, C0, L) switch(order + 1, C0 - L, log(C0 / L), 1 / L - 1 / C0)

## starting values from the linearised regressions (several, the best converged nls is kept)
starts <- function(t, y, order) {
  a0 <- coef(lm(y ~ t))
  s <- list(c(C0 = a0[[1]], k = -a0[[2]]))
  if (order == 1) {
    if (all(y > 0)) { a <- coef(lm(log(y) ~ t)); s <- c(list(c(C0 = exp(a[[1]]), k = -a[[2]])), s) }
    s <- c(s, list(c(C0 = a0[[1]], k = -a0[[2]] / a0[[1]])))
  }
  if (order == 2) {
    if (all(y > 0)) { a <- coef(lm(I(1 / y) ~ t)); s <- c(list(c(C0 = 1 / a[[1]], k = a[[2]])), s) }
    s <- c(s, list(c(C0 = a0[[1]], k = -a0[[2]] / a0[[1]]^2)))
  }
  s
}
fit_nls <- function(t, y, order) {
  best <- NULL
  for (st in starts(t, y, order)) {
    m <- tryCatch(nls(form[[order + 1]], data = data.frame(t = t, y = y), start = as.list(st), control = ctl),
                  error = function(e) NULL)
    if (!is.null(m) && (is.null(best) || deviance(m) < deviance(best))) best <- m
  }
  ## when Gauss–Newton stalls on its step-halving rule (strongly curved fits near the pole of
  ## the second-order model), Levenberg–Marquardt (minpack.lm::nlsLM) with the same analytic
  ## gradient is used instead and the reference is marked via = "levenberg-marquardt"
  if (is.null(best)) for (st in starts(t, y, order)) {
    m <- tryCatch(minpack.lm::nlsLM(form[[order + 1]], data = data.frame(t = t, y = y), start = as.list(st),
                  control = minpack.lm::nls.lm.control(maxiter = 1000, ftol = 1e-15, ptol = 1e-15)), error = function(e) NULL)
    if (!is.null(m) && m$convInfo$isConv && (is.null(best) || deviance(m) < deviance(best))) { best <- m; attr(best, "via") <- "levenberg-marquardt" }
  }
  best
}

ext_nls <- function(m, t, y, order, tnew, limit) {
  if (is.null(m)) return(NULL)
  cf <- coef(m); V <- vcov(m); se <- sqrt(diag(V)); df <- df.residual(m)
  q <- qt(1 - (1 - CONF) / 2, df); n <- length(y); rss <- deviance(m)
  C0 <- cf[["C0"]]; k <- cf[["k"]]
  hl <- if (k > 0) switch(order + 1, C0 / (2 * k), log(2) / k, 1 / (C0 * k)) else NaN
  d <- dfun[[order + 1]](C0, k, tnew); G <- attr(d, "gradient")
  sep <- sqrt(rowSums((G %*% V) * G))
  out <- list(
    C0 = C0, k = k, se = list(C0 = un(se[1]), k = un(se[2])),
    ci = list(C0 = un(C0 + c(-1, 1) * q * se[1]), k = un(k + c(-1, 1) * q * se[2])),
    vcov = um(V), rss = rss, sigma = summary(m)$sigma, df = df,
    aic = AIC(m), bic = BIC(m), aicc = AIC(m) + 2 * 3 * 4 / (n - 3 - 1),
    r2 = 1 - rss / sum((y - mean(y))^2), fitted = un(fitted(m)), resid = un(resid(m)),
    halfLife = hl, converged = m$convInfo$isConv, via = if (is.null(attr(m, "via"))) "gauss-newton" else attr(m, "via"),
    pred = list(t = tnew, fit = un(d), se = un(sep), lo = un(d - q * sep), hi = un(d + q * sep)))
  ## time to the limit: the model reparametrised with tL as a parameter, so that nls
  ## gives the delta-method standard error directly
  tL0 <- gL(order, C0, limit) / k
  if (is.finite(tL0) && tL0 > 0) {
    f2 <- switch(order + 1,
      y ~ rfun[[1]](C0, tL, t, L),
      y ~ rfun[[2]](C0, tL, t, L),
      y ~ rfun[[3]](C0, tL, t, L))
    dd <- data.frame(t = t, y = y, L = limit)
    m2 <- tryCatch(nls(f2, data = dd, start = list(C0 = C0, tL = tL0), control = ctl), error = function(e) NULL)
    if (is.null(m2)) m2 <- tryCatch(minpack.lm::nlsLM(f2, data = dd, start = list(C0 = C0, tL = tL0),
                  control = minpack.lm::nls.lm.control(maxiter = 1000, ftol = 1e-15, ptol = 1e-15)), error = function(e) NULL)
    if (!is.null(m2)) {
      sL <- sqrt(vcov(m2)[2, 2]); tL <- coef(m2)[["tL"]]
      out$ttl <- list(limit = limit, t = tL, se = sL, lo = tL - q * sL, hi = tL + q * sL)
    }
  } else out$ttl <- list(limit = limit, t = NaN, se = NaN, lo = NaN, hi = NaN)
  out
}

ext_lm <- function(t, y, order) {
  if (order > 0 && any(y <= 0)) return(NULL)
  Y <- switch(order + 1, y, log(y), 1 / y)
  m <- lm(Y ~ t); s <- summary(m); cf <- coef(m); V <- vcov(m); se <- sqrt(diag(V)); ci <- confint(m, level = CONF)
  a <- cf[[1]]; b <- cf[[2]]
  tr <- switch(order + 1, function(v) v, function(v) exp(v), function(v) 1 / v)
  dC0 <- switch(order + 1, 1, exp(a), -1 / a^2)
  J <- diag(c(dC0, if (order == 2) 1 else -1)); Vt <- J %*% V %*% J
  kci <- if (order == 2) un(ci[2, ]) else un(-rev(ci[2, ]))
  fitted0 <- tr(fitted(m))
  list(coef = un(cf), seCoef = un(se), C0 = tr(a), k = if (order == 2) b else -b,
       se = list(C0 = abs(dC0) * se[[1]], k = se[[2]]),
       ci = list(C0 = sort(un(tr(ci[1, ]))), k = kci), vcov = um(Vt),
       r2 = s$r.squared, sigma = s$sigma, df = df.residual(m), rss = deviance(m), aic = AIC(m),
       fitted = un(fitted0), resid = un(y - fitted0))
}

## ---------------- kinetic fits: 3 orders × 2 noise levels × falling and rising ----------------
tt <- rep(c(0, 3, 6, 9, 12, 15, 18, 21), each = 2)
design <- list(
  list(order = 0, C0 = 100, k = 3, dir = "down", limit = 50),
  list(order = 1, C0 = 100, k = 0.06, dir = "down", limit = 50),
  list(order = 2, C0 = 100, k = 0.0015, dir = "down", limit = 50),
  list(order = 0, C0 = 10, k = -0.5, dir = "up", limit = 18),
  list(order = 1, C0 = 10, k = -0.04, dir = "up", limit = 18),
  list(order = 2, C0 = 10, k = -0.003, dir = "up", limit = 18))
fits <- list()
for (D in design) for (noise in c(0.01, 0.05)) {
  y <- gen(D$order, D$C0, D$k, tt) + rnorm(length(tt), 0, noise * D$C0)
  y <- round(y, 3)
  tnew <- c(1.5, 10, 25)
  rec <- list(id = sprintf("o%d-%s-%g", D$order, D$dir, noise), gen = list(order = D$order, C0 = D$C0, k = D$k, noise = noise, dir = D$dir),
              t = tt, y = y, limit = D$limit, tnew = tnew, nonlin = list(), lin = list())
  for (o in 0:2) {
    rec$nonlin[o + 1] <- list(ext_nls(fit_nls(tt, y, o), tt, y, o, tnew, D$limit))
    rec$lin[o + 1] <- list(ext_lm(tt, y, o))
  }
  aic <- sapply(rec$nonlin, function(f) if (is.null(f)) NA else f$aic)
  dA <- aic - min(aic, na.rm = TRUE); w <- exp(-dA / 2); w <- w / sum(w, na.rm = TRUE)
  rec$compare <- list(aic = aic, deltaAIC = dA, weights = w, best = which.min(aic) - 1)
  fits[[length(fits) + 1]] <- rec
}
## a small single-replicate set (n = 6), order 1 falling
t6 <- c(0, 5, 10, 15, 20, 30); y6 <- round(gen(1, 80, 0.04, t6) * exp(rnorm(6, 0, 0.03)), 2)
rec <- list(id = "o1-small", gen = list(order = 1, C0 = 80, k = 0.04, noise = 0.03, dir = "down"), t = t6, y = y6, limit = 40,
            tnew = c(2, 25), nonlin = list(), lin = list())
for (o in 0:2) { rec$nonlin[o + 1] <- list(ext_nls(fit_nls(t6, y6, o), t6, y6, o, rec$tnew, 40)); rec$lin[o + 1] <- list(ext_lm(t6, y6, o)) }
aic <- sapply(rec$nonlin, function(f) if (is.null(f)) NA else f$aic)
dA <- aic - min(aic, na.rm = TRUE); w <- exp(-dA / 2); w <- w / sum(w, na.rm = TRUE)
rec$compare <- list(aic = aic, deltaAIC = dA, weights = w, best = which.min(aic) - 1)
fits[[length(fits) + 1]] <- rec

## ---------------- Arrhenius ----------------
arr_ext <- function(Tc, k, Tref = NULL, w = NULL, Tnew) {
  TK <- Tc + K0
  if (is.null(Tref)) TrefK <- 1 / mean(1 / TK) else TrefK <- Tref + K0
  x <- 1 / TK - 1 / TrefK; ly <- log(k)
  m <- if (is.null(w)) lm(ly ~ x) else lm(ly ~ x, weights = w)
  s <- summary(m); cf <- coef(m); V <- vcov(m); se <- sqrt(diag(V)); ci <- confint(m, level = CONF)
  a <- cf[[1]]; b <- cf[[2]]; Ea <- -b * RG
  gA <- c(1, -1 / TrefK); lnA <- a - b / TrefK; seLnA <- sqrt(drop(t(gA) %*% V %*% gA))
  q <- qt(1 - (1 - CONF) / 2, df.residual(m))
  nd <- data.frame(x = 1 / (Tnew + K0) - 1 / TrefK)
  pc <- predict(m, nd, interval = "confidence", level = CONF, se.fit = TRUE)
  out <- list(Tc = Tc, k = k, weights = w, TrefC = TrefK - K0, Ea = Ea, EaKJ = Ea / 1000, seEa = se[[2]] * RG,
       ciEa = un(-rev(ci[2, ]) * RG), kRef = exp(a), seLnKRef = se[[1]], ciKRef = un(exp(ci[1, ])),
       lnA = lnA, seLnA = seLnA, ciLnA = lnA + c(-1, 1) * q * seLnA,
       r2 = s$r.squared, df = df.residual(m), sigma = s$sigma,
       Tnew = Tnew, pred = list(lnk = un(pc$fit[, 1]), se = un(pc$se.fit), k = un(exp(pc$fit[, 1])), lo = un(exp(pc$fit[, 2])), hi = un(exp(pc$fit[, 3]))),
       q10 = un(exp(10 * Ea / (RG * (Tnew + K0) * (Tnew + K0 + 10)))))
  if (is.null(w)) {
    pp <- predict(m, nd, interval = "prediction", level = CONF)
    out$predP <- list(lo = un(exp(pp[, 2])), hi = un(exp(pp[, 3])))
  }
  out
}
arr <- list()
Tc1 <- rep(c(5, 15, 25, 35), each = 3)
k1 <- 0.05 * exp(-85000 / RG * (1 / (Tc1 + K0) - 1 / (25 + K0))) * exp(rnorm(12, 0, 0.08))
k1 <- signif(k1, 6)
arr[[1]] <- arr_ext(Tc1, k1, NULL, NULL, c(0, 4, 10, 20, 30, 40))
arr[[2]] <- arr_ext(Tc1, k1, 25, NULL, c(0, 4, 10, 20, 30, 40))
Tc2 <- c(4, 12, 20, 28, 36)
k2 <- signif(0.012 * exp(-62000 / RG * (1 / (Tc2 + K0) - 1 / (20 + K0))) * exp(rnorm(5, 0, 0.06)), 6)
se2 <- signif(k2 * c(0.05, 0.04, 0.08, 0.06, 0.1), 5)
r <- arr_ext(Tc2, k2, NULL, k2^2 / se2^2, c(8, 25)); r$seK <- se2
arr[[3]] <- r

## ---------------- Q10 ----------------
q10 <- list(
  list(k1 = 0.02, T1 = 5, k2 = 0.05, T2 = 15, q = (0.05 / 0.02)^(10 / 10)),
  list(k1 = 0.011, T1 = 4, k2 = 0.09, T2 = 25, q = (0.09 / 0.011)^(10 / 21)),
  list(Ea = 85000, Tc = 20, q = exp(10 * 85000 / (RG * (20 + K0) * (30 + K0)))),
  list(Ea = 50000, Tc = 0, q = exp(10 * 50000 / (RG * K0 * (K0 + 10)))))

## ---------------- square-root model (Ratkowsky) ----------------
bel <- list()
TcB <- c(0, 2, 4, 6, 8, 10, 12, 15, 18, 21, 24, 27, 30)
sq <- 0.02 * (TcB + 4) + rnorm(length(TcB), 0, 0.008)
kB <- signif(sq^2, 6)
mB <- lm(sqrt(kB) ~ TcB); cf <- coef(mB); bB <- cf[[2]]; TminB <- -cf[[1]] / cf[[2]]
rk <- deriv(~ b * (T - Tmin), c("b", "Tmin"), function.arg = c("b", "Tmin", "T"))
mB2 <- nls(sqrt(kB) ~ rk(b, Tmin, TcB), start = list(b = bB, Tmin = TminB), control = ctl)
seB2 <- sqrt(diag(vcov(mB2))); qB <- qt(1 - (1 - CONF) / 2, df.residual(mB))
TnB <- c(-6, -2, 5, 20, 35)
pB <- predict(mB, data.frame(TcB = TnB), interval = "confidence", level = CONF)
sqr <- function(v) ifelse(v > 0, v^2, 0)
bel[[1]] <- list(Tc = TcB, k = kB, b = coef(mB2)[["b"]], Tmin = coef(mB2)[["Tmin"]], seB = seB2[[1]], seTmin = seB2[[2]],
                 ciB = coef(mB2)[["b"]] + c(-1, 1) * qB * seB2[[1]], ciTmin = coef(mB2)[["Tmin"]] + c(-1, 1) * qB * seB2[[2]],
                 lmB = bB, lmTmin = TminB, r2 = summary(mB)$r.squared, sigma = summary(mB)$sigma, df = df.residual(mB),
                 Tnew = TnB, pred = list(k = un(sqr(pB[, 1])), lo = un(sqr(pB[, 2])), hi = un(sqr(pB[, 3]))))

## ---------------- accelerated shelf-life testing ----------------
aslt <- list()
TcA <- rep(c(25, 35, 45), each = 3)
thA <- signif(60 * exp(70000 / RG * (1 / (TcA + K0) - 1 / (25 + K0))) * exp(rnorm(9, 0, 0.07)), 6)
for (model in c("arrhenius", "q10")) for (Tt in c(5, 20)) {
  x <- if (model == "arrhenius") 1 / (TcA + K0) else TcA
  m <- lm(log(thA) ~ x); s <- summary(m); b <- coef(m)[[2]]
  x0 <- if (model == "arrhenius") 1 / (Tt + K0) else Tt
  pp <- predict(m, data.frame(x = x0), interval = "prediction", level = CONF, se.fit = TRUE)
  pc <- predict(m, data.frame(x = x0), interval = "confidence", level = CONF)
  TT <- Tt + K0
  if (model == "arrhenius") { Ea <- b * RG; Q10 <- exp(10 * Ea / (RG * TT * (TT + 10))) }
  else { Q10 <- exp(-10 * b); Ea <- log(Q10) * RG * TT * (TT + 10) / 10 }
  aslt[[length(aslt) + 1]] <- list(Tc = TcA, shelfLife = thA, Ttarget = Tt, model = model,
    estimate = exp(pp$fit[1, 1]), lo = exp(pp$fit[1, 2]), hi = exp(pp$fit[1, 3]),
    ciMean = un(exp(pc[1, 2:3])), seMean = pp$se.fit[[1]], Ea = Ea, Q10 = Q10, r2 = s$r.squared, df = df.residual(m), sigma = s$sigma,
    slope = b)
}

## ---------------- shelf life at any temperature: order-1 fits at four temperatures + Arrhenius ----------------
shelf <- list()
TcS <- c(5, 15, 25, 35); tS <- c(0, 0, 4, 4, 8, 8, 12, 12, 16, 16, 20, 20)
kS <- 0.03 * exp(-75000 / RG * (1 / (TcS + K0) - 1 / (25 + K0)))
sets <- list(); kk <- numeric(4); sek <- numeric(4); c0 <- numeric(4)
for (i in 1:4) {
  y <- round(gen(1, 100, kS[i], tS) + rnorm(length(tS), 0, 1.5), 3)
  m <- fit_nls(tS, y, 1); kk[i] <- coef(m)[["k"]]; sek[i] <- sqrt(vcov(m)[2, 2]); c0[i] <- coef(m)[["C0"]]
  sets[[i]] <- list(Tc = TcS[i], t = tS, y = y)
}
L <- 60; C0m <- mean(c0); G <- log(C0m / L)
for (weighted in c(FALSE, TRUE)) {
  TK <- TcS + K0; TrefK <- 1 / mean(1 / TK); x <- 1 / TK - 1 / TrefK; ly <- log(kk)
  m <- if (weighted) lm(ly ~ x, weights = kk^2 / sek^2) else lm(ly ~ x)
  Tn <- c(2, 10, 20)
  pc <- predict(m, data.frame(x = 1 / (Tn + K0) - 1 / TrefK), interval = "confidence", level = CONF)
  kp <- exp(pc[, 1]); klo <- exp(pc[, 2]); khi <- exp(pc[, 3])
  shelf[[length(shelf) + 1]] <- list(weighted = weighted, sets = sets, k = kk, seK = sek, C0 = C0m, limit = L, order = 1,
    Ea = -coef(m)[[2]] * RG, Tnew = Tn, kp = un(kp), klo = un(klo), khi = un(khi),
    t = un(G / kp), lo = un(G / khi), hi = un(G / klo))
}

## ---------------- stress batch: 40 random data sets ----------------
## random order, direction, size (5–20, irregular times), initial value, extent of change and
## noise (0.5–15 % of C0); every order is fitted to every set
set.seed(20261006)
stress <- list()
for (i in 1:40) {
  order <- sample(0:2, 1); dir <- sample(c("down", "up"), 1); n <- sample(5:20, 1)
  t <- sort(round(c(0, runif(n - 1, 0, 30)), 1)); C0 <- runif(1, 20, 200); tm <- max(t)
  if (dir == "down") { f <- runif(1, 0.3, 0.8); k <- switch(order + 1, f * C0 / tm, -log(1 - f) / tm, (1 / (C0 * (1 - f)) - 1 / C0) / tm) }
  else { gn <- runif(1, 0.3, 1.5); k <- switch(order + 1, -gn * C0 / tm, -log(1 + gn) / tm, (1 / (C0 * (1 + gn)) - 1 / C0) / tm) }
  noise <- runif(1, 0.005, 0.15)
  y <- round(gen(order, C0, k, t) + rnorm(n, 0, noise * C0), 3)
  limit <- if (dir == "down") C0 * 0.6 else C0 * 1.25
  rec <- list(id = sprintf("stress-%02d", i), gen = list(order = order, C0 = C0, k = k, noise = noise, dir = dir), t = t, y = y,
              limit = limit, tnew = c(tm / 3, tm), nonlin = list(), lin = list())
  for (o in 0:2) {
    rec$nonlin[o + 1] <- list(ext_nls(fit_nls(t, y, o), t, y, o, rec$tnew, limit))
    rec$lin[o + 1] <- list(ext_lm(t, y, o))
  }
  aic <- sapply(rec$nonlin, function(f) if (is.null(f)) NA else f$aic)
  dA <- aic - min(aic, na.rm = TRUE); w <- exp(-dA / 2); w <- w / sum(w, na.rm = TRUE)
  rec$compare <- list(aic = aic, deltaAIC = dA, weights = w, best = which.min(aic) - 1)
  stress[[i]] <- rec
}

ref <- list(R = R.version.string, conf = CONF, fits = fits, stress = stress, arrhenius = arr, q10 = q10, belehradek = bel, aslt = aslt, shelf = shelf)
js <- toJSON(ref, digits = NA, auto_unbox = TRUE, null = "null", na = "string")
writeLines(js, file.path(here, "ref_kinetics.json"), useBytes = TRUE)
writeLines(paste0("window.REF = window.REF || {};\nwindow.REF.kinetics = ", js, ";"), file.path(here, "ref_kinetics.js"), useBytes = TRUE)
cat("fits:", length(fits), "+", length(stress), " nls null:", sum(sapply(c(fits, stress), function(f) sum(sapply(f$nonlin, is.null)))),
    " via nlsLM:", sum(sapply(c(fits, stress), function(f) sum(sapply(f$nonlin, function(m) !is.null(m) && m$via == "levenberg-marquardt")))),
    " lin null:", sum(sapply(fits, function(f) sum(sapply(f$lin, is.null)))), "\n")
