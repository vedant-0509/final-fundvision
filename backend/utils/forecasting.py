"""
FundVision Pro — Predictive Analytics Engine
============================================
Implements two forecasting models for NAV projection:
  1. Exponential Moving Average (EMA) — for near-term trend
  2. Linear Regression — for long-term projection

Returns monthly data points suitable for Chart.js / Recharts.
"""

import math
from datetime import date, timedelta
from typing import NamedTuple


class DataPoint(NamedTuple):
    label: str          # "Jan 2025"
    value: float        # NAV or portfolio value
    is_projected: bool


# ── Moving Average Forecaster ─────────────────────────────────────────────────
def compute_ema(values: list[float], span: int = 3) -> list[float]:
    """Exponential Moving Average with given span."""
    alpha = 2 / (span + 1)
    ema = [values[0]]
    for v in values[1:]:
        ema.append(alpha * v + (1 - alpha) * ema[-1])
    return ema


def linear_regression(x: list[float], y: list[float]) -> tuple[float, float]:
    """Returns (slope, intercept) for y = slope*x + intercept."""
    n = len(x)
    sum_x = sum(x)
    sum_y = sum(y)
    sum_xy = sum(xi * yi for xi, yi in zip(x, y))
    sum_xx = sum(xi ** 2 for xi in x)
    denom = n * sum_xx - sum_x ** 2
    if denom == 0:
        return 0.0, sum_y / n
    slope = (n * sum_xy - sum_x * sum_y) / denom
    intercept = (sum_y - slope * sum_x) / n
    return slope, intercept


# ── NAV Projection ─────────────────────────────────────────────────────────────
def project_nav(
    current_nav: float,
    cagr_pct: float,
    years_ahead: int = 5,
    historical_navs: list[float] | None = None,
) -> list[DataPoint]:
    """
    Project future NAV values month by month.

    If historical_navs are provided (monthly, oldest first), use regression.
    Otherwise use CAGR-based compound growth.

    Returns list of DataPoint (last 12 historical + projected months).
    """
    today = date.today()
    result: list[DataPoint] = []

    # ── Historical portion ────────────────────────────────────────────────────
    history = historical_navs or _synthetic_history(current_nav, cagr_pct, 12)

    start_month = today.replace(day=1) - timedelta(days=30 * len(history))
    for i, nav_val in enumerate(history):
        label_date = start_month + timedelta(days=30 * i)
        result.append(DataPoint(
            label=label_date.strftime("%b '%y"),
            value=round(nav_val, 2),
            is_projected=False,
        ))

    # ── Regression on historical ───────────────────────────────────────────────
    x_vals = list(range(len(history)))
    y_vals = history
    slope, intercept = linear_regression(x_vals, y_vals)

    # Adjust with CAGR expectation: blend regression and CAGR
    cagr_monthly = (1 + cagr_pct / 100) ** (1 / 12) - 1
    last_nav = history[-1]

    # ── Projection ────────────────────────────────────────────────────────────
    num_months = years_ahead * 12
    for i in range(1, num_months + 1):
        # Blend: 40% regression line, 60% CAGR compound
        reg_val = intercept + slope * (len(history) + i)
        cagr_val = last_nav * ((1 + cagr_monthly) ** i)
        blended = 0.4 * reg_val + 0.6 * cagr_val

        label_date = today.replace(day=1) + timedelta(days=30 * i)
        result.append(DataPoint(
            label=label_date.strftime("%b '%y"),
            value=round(max(blended, 1.0), 2),
            is_projected=True,
        ))

    return result


# ── SIP Corpus Projection ─────────────────────────────────────────────────────
def project_sip_corpus(
    monthly_sip: float,
    cagr_pct: float,
    years: int,
    inflation_pct: float = 6.0,
) -> list[dict]:
    """
    Project SIP corpus year-by-year with nominal and inflation-adjusted values.
    Uses standard SIP future value formula with compounding.
    """
    monthly_rate = cagr_pct / 100 / 12
    inflation_monthly = inflation_pct / 100 / 12
    result = []

    for year in range(1, years + 1):
        n = year * 12
        if monthly_rate == 0:
            fv = monthly_sip * n
        else:
            fv = monthly_sip * (((1 + monthly_rate) ** n - 1) / monthly_rate) * (1 + monthly_rate)

        invested = monthly_sip * n
        real_fv = fv / ((1 + inflation_pct / 100) ** year)

        result.append({
            "year": year,
            "label": f"Yr {year}",
            "invested": round(invested),
            "corpus": round(fv),
            "real_corpus": round(real_fv),
            "gain": round(fv - invested),
        })

    return result


# ── Lumpsum Projection ────────────────────────────────────────────────────────
def project_lumpsum_corpus(
    amount: float,
    cagr_pct: float,
    years: int,
    inflation_pct: float = 6.0,
) -> list[dict]:
    """Year-by-year lumpsum growth with inflation adjustment."""
    result = []
    for year in range(1, years + 1):
        fv = amount * ((1 + cagr_pct / 100) ** year)
        real_fv = fv / ((1 + inflation_pct / 100) ** year)
        result.append({
            "year": year,
            "label": f"Yr {year}",
            "invested": round(amount),
            "corpus": round(fv),
            "real_corpus": round(real_fv),
            "gain": round(fv - amount),
        })
    return result


# ── Helpers ────────────────────────────────────────────────────────────────────
def _synthetic_history(current_nav: float, cagr_pct: float, months: int) -> list[float]:
    """Generate plausible synthetic historical NAVs working backwards from current."""
    monthly_rate = (1 + cagr_pct / 100) ** (1 / 12) - 1
    navs = [current_nav]
    for _ in range(months - 1):
        # Add small noise (±1.5%)
        import random
        noise = 1 + random.uniform(-0.015, 0.015)
        prev = navs[-1] / (1 + monthly_rate) * noise
        navs.append(max(prev, 1.0))
    navs.reverse()
    return navs
