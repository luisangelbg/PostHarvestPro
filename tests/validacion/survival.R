# PostHarvestPro — referencias de R para el motor de tiempo de falla (js/survival.js).
# Copyright (C) 2026  Luis Ángel Barrera-Guzmán. GPL-3.0-or-later.
#
# Genera conjuntos simulados (semilla fija): dos tratamientos con censura del 0 %, ~30 % y ~60 %,
# tiempos redondeados a días (empates, también entre eventos y censuras), un grupo, tres grupos,
# una covariable numérica y un caso pequeño con la mediana exactamente en S = 0.5; y calcula con
#   * survival::survfit   (Kaplan–Meier; conf.type "log", "log-log", "plain"; summary()$table:
#                          mediana, sus límites, media restringida; quantile())
#   * survival::survdiff  (log-rank, rho = 0, y Peto–Peto/Prentice, rho = 1)
#   * survival::survreg   (weibull, lognormal, loglogistic, exponential; coeficientes, EE, vcov,
#                          log-verosimilitud, AIC, predict(type = "quantile"/"uquantile", se.fit = TRUE))
#   * flexsurv::flexsurvreg (log-verosimilitud de weibull, lnorm y llogis: segunda comprobación)
# Escribe tests/validacion/ref_survival.json y ref_survival.js.
#
#   "C:/Program Files/R/R-4.4.2/bin/Rscript.exe" tests/validacion/survival.R

suppressMessages({ library(jsonlite); library(survival); library(flexsurv) })
args <- commandArgs(trailingOnly = FALSE)
here <- dirname(normalizePath(sub("^--file=", "", args[grep("^--file=", args)])))
set.seed(20261005)
un <- function(x) unname(as.numeric(x))
um <- function(m) { m <- as.matrix(m); dimnames(m) <- NULL; m }
DISTS <- c("weibull", "lognormal", "loglogistic", "exponential")
ctl <- survreg.control(rel.tolerance = 1e-12, maxiter = 200)

km_one <- function(time, status, ctype) {
  f <- survfit(Surv(time, status) ~ 1, conf.type = ctype)
  s <- summary(f, censored = TRUE)
  tab <- summary(f)$table
  q <- quantile(f, probs = c(0.25, 0.5, 0.75))
  list(time = un(f$time), nRisk = un(f$n.risk), nEvent = un(f$n.event), nCensor = un(f$n.censor),
       surv = un(f$surv), stdErrLog = un(f$std.err), se = un(s$std.err), lower = un(f$lower), upper = un(f$upper),
       median = un(tab["median"]), medianCI = un(tab[c("0.95LCL", "0.95UCL")]),
       rmean = un(tab["rmean"]), rmeanSE = un(tab["se(rmean)"]), n = un(tab["records"]), events = un(tab["events"]),
       quantile = list(p = c(0.25, 0.5, 0.75), est = un(q$quantile), lo = un(q$lower), hi = un(q$upper)))
}

reg_one <- function(time, status, X, dist, newdata, ps, tq) {
  df <- data.frame(time = time, status = status, X)
  rhs <- if (ncol(X) == 0) "1" else paste(names(X), collapse = " + ")
  fit <- survreg(as.formula(paste("Surv(time, status) ~", rhs)), data = df, dist = dist, control = ctl)
  V <- vcov(fit); tab <- summary(fit)$table
  rows <- function(m) matrix(un(m), nrow = nrow(newdata))   # one row per level, also for a single row
  pq <- predict(fit, newdata, type = "quantile", p = ps, se.fit = TRUE)
  pu <- predict(fit, newdata, type = "uquantile", p = ps, se.fit = TRUE)
  lp <- predict(fit, newdata, type = "lp")
  S <- t(sapply(lp, function(m) 1 - psurvreg(tq, mean = m, scale = fit$scale, distribution = dist)))
  list(coef = un(coef(fit)), names = names(coef(fit)), se = un(sqrt(diag(V))), z = un(tab[, "z"]), p = un(tab[, "p"]),
       scale = fit$scale, logScaleSE = if (dist == "exponential") NaN else sqrt(V[nrow(V), nrow(V)]),
       loglik = fit$loglik[2], loglik0 = fit$loglik[1], aic = AIC(fit), df = un(fit$df), vcov = um(V), iter = un(fit$iter[1]),
       p_ = ps, qEst = rows(pq$fit), qSE = rows(pq$se.fit), uqEst = rows(pu$fit), uqSE = rows(pu$se.fit), tq = tq, surv = um(S))
}

flex_ll <- function(time, status, X, dist) {
  df <- data.frame(time = time, status = status, X)
  rhs <- if (ncol(X) == 0) "1" else paste(names(X), collapse = " + ")
  d <- c(weibull = "weibull", lognormal = "lnorm", loglogistic = "llogis", exponential = "exp")[[dist]]
  f <- tryCatch(flexsurvreg(as.formula(paste("Surv(time, status) ~", rhs)), data = df, dist = d), error = function(e) NULL)
  if (is.null(f)) NaN else f$loglik
}

make <- function(id, time, status, group = NULL, x = NULL, ps = c(0.1, 0.5, 0.9), tq = c(5, 15, 30)) {
  out <- list(id = id, time = time, status = status, censored = mean(status == 0))
  if (!is.null(group)) {
    lev <- sort(unique(group)); out$group <- group; out$levels <- lev
    out$km <- lapply(lev, function(l) { w <- group == l
      list(level = l, log = km_one(time[w], status[w], "log"), loglog = km_one(time[w], status[w], "log-log"),
           plain = km_one(time[w], status[w], "plain")) })
    g <- factor(group, levels = lev)
    out$logrank <- lapply(c(0, 1), function(rho) {
      sd <- survdiff(Surv(time, status) ~ g, rho = rho)
      dfr <- sum(sd$exp > 0) - 1
      list(rho = rho, chisq = sd$chisq, df = dfr, p = pchisq(sd$chisq, dfr, lower.tail = FALSE),
           obs = un(sd$obs), exp = un(sd$exp), var = um(sd$var))
    })
    X <- data.frame(g = g); nd <- data.frame(g = factor(lev, levels = lev))
  } else if (!is.null(x)) {
    out$x <- x; X <- data.frame(x = x); out$xnew <- c(5, 12.5, 20); nd <- data.frame(x = out$xnew)
  } else {
    out$km <- list(list(level = NULL, log = km_one(time, status, "log"), loglog = km_one(time, status, "log-log"),
                        plain = km_one(time, status, "plain")))
    X <- data.frame(row.names = seq_along(time)); nd <- data.frame(row.names = 1)
  }
  out$reg <- list()
  for (d in DISTS) {
    ## survreg's warning "Ran out of iterations and did not converge" marks the reference as unusable
    conv <- TRUE
    r <- withCallingHandlers(tryCatch(reg_one(time, status, X, d, nd, ps, tq), error = function(e) NULL),
                             warning = function(w) { conv <<- FALSE; invokeRestart("muffleWarning") })
    if (is.null(r)) r <- list(failed = TRUE) else { r$conv <- conv; r$loglik2 <- flex_ll(time, status, X, d) }
    out$reg[[d]] <- r
  }
  ## a level without events: survreg reports its coefficient as NA (or stops at an arbitrary large
  ## value) and predict() then gives NA for every level. The limit of the likelihood is the fit
  ## without those records: it is refitted here as the reference for the estimable terms.
  if (!is.null(group)) {
    ev <- tapply(status, factor(group, levels = lev), sum); zero <- names(ev)[ev == 0]
    if (length(zero) && length(zero) < length(lev)) {
      k <- !(group %in% zero); levE <- setdiff(lev, zero)
      if (length(levE) > 1) { XE <- data.frame(g = factor(group[k], levels = levE)); ndE <- data.frame(g = factor(levE, levels = levE)) }
      else { XE <- data.frame(row.names = seq_len(sum(k))); ndE <- data.frame(row.names = 1) }
      for (d in DISTS) {
        rE <- tryCatch(reg_one(time[k], status[k], XE, d, ndE, ps, tq), error = function(e) NULL)
        if (!is.null(rE)) { rE$levels <- levE; out$reg[[d]]$limit <- rE }
      }
      out$zeroEventLevels <- zero
    }
  }
  aic <- sapply(out$reg, function(r) if (isTRUE(r$conv)) r$aic else NA); dA <- aic - min(aic); w <- exp(-dA / 2); w <- w / sum(w)
  out$compare <- list(dists = DISTS, aic = un(aic), deltaAIC = un(dA), weights = un(w), best = names(aic)[which.min(aic)])
  out
}

sets <- list()
## two treatments, Weibull times (shape 1.8; scales 20 and 30 days), uniform censoring
two <- function(n, cmax) {
  grp <- rep(c("A", "B"), each = n)
  T <- c(rweibull(n, 1.8, 20), rweibull(n, 1.8, 30))
  C <- if (is.finite(cmax)) runif(2 * n, 0, cmax) else rep(Inf, 2 * n)
  list(time = ceiling(pmin(T, C)), status = as.integer(T <= C), group = grp)
}
d <- two(30, Inf);  sets[[1]] <- make("two-cens0", d$time, d$status, d$group)
d <- two(30, 75);   sets[[2]] <- make("two-cens30", d$time, d$status, d$group)
d <- two(30, 27);   sets[[3]] <- make("two-cens60", d$time, d$status, d$group)
## one group, lognormal times, ~30 % censoring
T <- rlnorm(40, log(15), 0.6); C <- runif(40, 0, 55)
sets[[4]] <- make("one-cens30", ceiling(pmin(T, C)), as.integer(T <= C))
## three groups, log-logistic times, ~30 % censoring
lev3 <- rep(c("A", "B", "C"), each = 25)
T <- exp(log(c(rep(12, 25), rep(18, 25), rep(26, 25))) + 0.35 * rlogis(75)); C <- runif(75, 0, 80)
sets[[5]] <- make("three-cens30", ceiling(pmin(T, C)), as.integer(T <= C), lev3)
## numeric covariate (storage temperature, °C), Weibull, ~30 % censoring
temp <- rep(c(5, 10, 15, 20), each = 15)
T <- exp(4 - 0.08 * temp + 0.5 * log(rexp(60))); C <- runif(60, 0, 45)
sets[[6]] <- make("covariate", ceiling(pmin(T, C) * 2) / 2, as.integer(T <= C), x = temp, tq = c(5, 20, 40))
## small, the median exactly where S = 0.5 (midpoint rule), last observation an event (S = 0)
sets[[7]] <- make("small-exact", c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10), rep(1L, 10), tq = c(2, 5, 8))
## heavy ties: weekly inspections, two groups, ~30 % censoring
grp <- rep(c("A", "B"), each = 35)
T <- c(rweibull(35, 2.5, 6), rweibull(35, 2.5, 8)); C <- runif(70, 0, 22)
sets[[8]] <- make("ties-weekly", ceiling(pmin(T, C)), as.integer(T <= C), grp, tq = c(2, 5, 8))

## stress batch: random sizes (8–60), 1–3 groups, three distributions, shapes, 0–80 % censoring,
## time units of 0.1, 1 or 7 days (from few to many ties)
stress <- list()
for (i in 1:30) {
  G <- sample(1:3, 1); n <- sample(8:60, 1); dist <- sample(c("weibull", "lognormal", "loglogistic"), 1)
  shape <- runif(1, 0.6, 3); base <- runif(1, 5, 40)
  grp <- if (G > 1) LETTERS[1:G][c(1:G, sample(1:G, n - G, replace = TRUE))] else NULL
  eff <- if (G > 1) c(0, runif(G - 1, -0.7, 0.7))[match(grp, LETTERS[1:G])] else rep(0, n)
  W <- switch(dist, weibull = log(rexp(n)), lognormal = rnorm(n), loglogistic = rlogis(n))
  T <- exp(log(base) + eff + W / shape)
  cfrac <- sample(c(0, 0.2, 0.4, 0.6, 0.8), 1)
  C <- if (cfrac == 0) rep(Inf, n) else runif(n, 0, 2 * quantile(T, 1 - cfrac))
  unit <- sample(c(0.1, 1, 7), 1)
  time <- ceiling(pmin(T, C) / unit) * unit; status <- as.integer(T <= C)
  if (sum(status) < 2) status[order(time)[1:2]] <- 1L
  tq <- signif(quantile(time, c(0.25, 0.5, 0.75)), 3)
  stress[[i]] <- make(sprintf("stress-%02d", i), time, status, grp, tq = un(tq))
}

ref <- list(R = R.version.string, survival = as.character(packageVersion("survival")),
            flexsurv = as.character(packageVersion("flexsurv")), sets = sets, stress = stress)
js <- toJSON(ref, digits = NA, auto_unbox = TRUE, null = "null", na = "string")
writeLines(js, file.path(here, "ref_survival.json"), useBytes = TRUE)
writeLines(paste0("window.REF = window.REF || {};\nwindow.REF.survival = ", js, ";"), file.path(here, "ref_survival.js"), useBytes = TRUE)
for (s in c(sets, stress)) cat(sprintf("%-14s n=%3d censored=%.2f  iter: %s\n", s$id, length(s$time), s$censored,
                            paste(sapply(s$reg, function(r) if (isTRUE(r$conv)) r$iter else "X"), collapse = " ")))
