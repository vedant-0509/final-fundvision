"""
FundVision Pro — Portfolio Health Scoring Engine
================================================
Computes a 0–100 health score from four dimensions:
  1. Diversification    (35%)
  2. Return Quality     (30%)
  3. Risk Balance       (20%)
  4. Cost Efficiency    (15%)

Also generates specific rebalancing advice.
"""

from dataclasses import dataclass, field
from typing import Any


# ── Data Contract ──────────────────────────────────────────────────────────────
@dataclass
class HoldingInput:
    fund_id: int
    name: str
    category: str           # largecap, midcap, smallcap, debt, hybrid, elss, flexicap
    asset_type: str          # equity, debt, hybrid
    risk_level: str          # Low, Moderate, High, Very High
    invested: float          # ₹ invested
    cagr_5y: float | None
    sharpe_ratio: float | None
    expense_ratio: float | None


@dataclass
class HealthResult:
    overall: int                          # 0–100
    diversification: int
    return_quality: int
    risk_balance: int
    cost_efficiency: int
    grade: str                            # A+, A, B+, B, C, D
    weighted_cagr: float
    weighted_sharpe: float
    weighted_expense: float
    category_breakdown: dict[str, float]  # {category: pct}
    asset_breakdown: dict[str, float]     # {equity/debt/hybrid: pct}
    rebalancing_advice: list[dict]
    strengths: list[str]
    weaknesses: list[str]


# ── Scoring Engine ─────────────────────────────────────────────────────────────
def compute_health_score(holdings: list[HoldingInput]) -> HealthResult:
    """Main entry point: compute portfolio health."""
    if not holdings:
        return _empty_result()

    total = sum(h.invested for h in holdings)
    weights = {h.fund_id: h.invested / total for h in holdings}

    # ── 1. Diversification (35%) ──────────────────────────────────────────────
    categories = list({h.category for h in holdings})
    asset_types = list({h.asset_type for h in holdings})

    category_pcts: dict[str, float] = {}
    for h in holdings:
        category_pcts[h.category] = category_pcts.get(h.category, 0) + weights[h.fund_id] * 100

    asset_pcts: dict[str, float] = {}
    for h in holdings:
        asset_pcts[h.asset_type] = asset_pcts.get(h.asset_type, 0) + weights[h.fund_id] * 100

    # Herfindahl-Hirschman concentration index (lower = more diversified)
    hhi = sum((pct / 100) ** 2 for pct in category_pcts.values())
    # HHI: 1.0 = fully concentrated, 1/N = perfectly spread
    max_pct = max(category_pcts.values())
    num_cat = len(categories)

    div_score = 0
    div_score += min(num_cat * 15, 45)         # up to 45 pts for category count (3+)
    div_score += max(0, (1 - hhi) * 40)        # up to 40 pts for low concentration
    div_score += min(len(asset_types) * 7.5, 15)  # up to 15 for asset type mix
    div_score = min(100, round(div_score))

    # ── 2. Return Quality (30%) ───────────────────────────────────────────────
    valid_cagr = [(h, weights[h.fund_id]) for h in holdings if h.cagr_5y is not None]
    weighted_cagr = sum(h.cagr_5y * w for h, w in valid_cagr) if valid_cagr else 0

    # Benchmark: 12% = excellent equity return; 7.5% = good debt return
    # Score based on weighted CAGR relative to blended benchmark
    equity_pct = asset_pcts.get("equity", 0) / 100
    bench = equity_pct * 13.0 + (1 - equity_pct) * 7.5
    ret_ratio = weighted_cagr / bench if bench else 0
    ret_score = min(100, round(ret_ratio * 85))

    # Sharpe bonus
    valid_sharpe = [(h, weights[h.fund_id]) for h in holdings if h.sharpe_ratio is not None]
    weighted_sharpe = sum(h.sharpe_ratio * w for h, w in valid_sharpe) if valid_sharpe else 0
    sharpe_bonus = min(15, round(weighted_sharpe * 8))
    ret_score = min(100, ret_score + sharpe_bonus)

    # ── 3. Risk Balance (20%) ─────────────────────────────────────────────────
    risk_map = {"Low": 1, "Moderate": 2, "High": 3, "Very High": 4}
    weighted_risk = sum(risk_map.get(h.risk_level, 2) * weights[h.fund_id] for h in holdings)

    # Ideal: weighted risk ~2.0 (moderate). Penalize extremes.
    risk_deviation = abs(weighted_risk - 2.0)
    risk_score = max(0, round(100 - risk_deviation * 30))

    # Penalize if >50% in Very High risk
    vh_pct = sum(weights[h.fund_id] for h in holdings if h.risk_level == "Very High")
    if vh_pct > 0.5:
        risk_score = max(0, risk_score - round((vh_pct - 0.5) * 60))

    # ── 4. Cost Efficiency (15%) ──────────────────────────────────────────────
    valid_exp = [(h, weights[h.fund_id]) for h in holdings if h.expense_ratio is not None]
    weighted_expense = sum(h.expense_ratio * w for h, w in valid_exp) if valid_exp else 0

    # <0.5% excellent; 0.5–1.0% good; >1.5% poor
    if weighted_expense == 0:
        cost_score = 100
    elif weighted_expense < 0.5:
        cost_score = 100
    elif weighted_expense < 1.0:
        cost_score = round(100 - (weighted_expense - 0.5) * 60)
    elif weighted_expense < 1.5:
        cost_score = round(70 - (weighted_expense - 1.0) * 80)
    else:
        cost_score = max(0, round(30 - (weighted_expense - 1.5) * 40))

    # ── Overall Weighted Score ────────────────────────────────────────────────
    overall = round(
        div_score   * 0.35 +
        ret_score   * 0.30 +
        risk_score  * 0.20 +
        cost_score  * 0.15
    )

    # ── Grade ─────────────────────────────────────────────────────────────────
    grade = _score_to_grade(overall)

    # ── Rebalancing Advice ─────────────────────────────────────────────────────
    advice = _generate_advice(
        holdings, category_pcts, asset_pcts, weighted_expense,
        weighted_cagr, weighted_sharpe, vh_pct, div_score, ret_score, risk_score, cost_score
    )

    strengths, weaknesses = _categorize_findings(div_score, ret_score, risk_score, cost_score)

    return HealthResult(
        overall=overall,
        diversification=div_score,
        return_quality=ret_score,
        risk_balance=risk_score,
        cost_efficiency=cost_score,
        grade=grade,
        weighted_cagr=round(weighted_cagr, 2),
        weighted_sharpe=round(weighted_sharpe, 3),
        weighted_expense=round(weighted_expense, 3),
        category_breakdown=category_pcts,
        asset_breakdown=asset_pcts,
        rebalancing_advice=advice,
        strengths=strengths,
        weaknesses=weaknesses,
    )


def _score_to_grade(score: int) -> str:
    if score >= 90: return "A+"
    if score >= 80: return "A"
    if score >= 70: return "B+"
    if score >= 60: return "B"
    if score >= 50: return "C"
    return "D"


def _generate_advice(
    holdings, category_pcts, asset_pcts, expense, cagr, sharpe,
    vh_pct, div_s, ret_s, risk_s, cost_s
) -> list[dict]:
    advice = []

    # Diversification advice
    if len(category_pcts) < 3:
        advice.append({
            "priority": "high",
            "type": "diversification",
            "title": "Increase Category Diversification",
            "detail": f"You hold funds in only {len(category_pcts)} categor{'y' if len(category_pcts)==1 else 'ies'}. "
                      "Consider adding Mid-Cap and Debt funds to reduce concentration risk.",
            "action": "Add 1–2 funds from underrepresented categories.",
        })

    max_cat = max(category_pcts, key=category_pcts.get)
    if category_pcts[max_cat] > 60:
        advice.append({
            "priority": "medium",
            "type": "concentration",
            "title": f"High {max_cat.title()} Concentration",
            "detail": f"{category_pcts[max_cat]:.0f}% of your portfolio is in {max_cat} funds. "
                      "Concentration above 60% amplifies category-specific risk.",
            "action": f"Trim {max_cat} allocation to under 50% and redistribute.",
        })

    # Debt allocation advice
    equity_pct = asset_pcts.get("equity", 0)
    if equity_pct > 90:
        advice.append({
            "priority": "medium",
            "type": "asset_allocation",
            "title": "No Debt Cushion",
            "detail": f"Portfolio is {equity_pct:.0f}% equity. This is highly volatile without any debt allocation.",
            "action": "Add 10–20% in short-duration debt funds for stability.",
        })

    # Cost advice
    if expense > 1.0:
        high_cost = [h for h in holdings if h.expense_ratio and h.expense_ratio > 1.2]
        advice.append({
            "priority": "low" if expense < 1.3 else "medium",
            "type": "cost",
            "title": "High Average Expense Ratio",
            "detail": f"Weighted expense ratio is {expense:.2f}%. Every 0.5% saved compounding over 10 years adds ~5% to final corpus.",
            "action": f"Consider switching {', '.join(h.name for h in high_cost[:2])} to lower-cost alternatives or direct plans.",
        })

    # Very high risk advice
    if vh_pct > 0.4:
        advice.append({
            "priority": "high",
            "type": "risk",
            "title": "Elevated Small-Cap Exposure",
            "detail": f"{vh_pct*100:.0f}% of portfolio is in Very High risk funds. These can drop 40–60% in bear markets.",
            "action": "Cap Very High risk allocation at 30% of total portfolio.",
        })

    # Positive reinforcements (no action needed)
    if expense < 0.6:
        advice.append({
            "priority": "info",
            "type": "strength",
            "title": "Excellent Cost Discipline",
            "detail": f"Your weighted expense ratio of {expense:.2f}% is outstanding. Cost savings compound significantly over time.",
            "action": "Maintain this — consider only direct plan equivalents if not already.",
        })

    if sharpe > 1.4:
        advice.append({
            "priority": "info",
            "type": "strength",
            "title": "Strong Risk-Adjusted Returns",
            "detail": f"Weighted Sharpe Ratio of {sharpe:.2f} indicates excellent returns per unit of risk taken.",
            "action": "No action needed — continue monitoring quarterly.",
        })

    return advice


def _categorize_findings(div, ret, risk, cost) -> tuple[list[str], list[str]]:
    strengths, weaknesses = [], []
    dim_map = {
        "Diversification": div,
        "Return Quality": ret,
        "Risk Balance": risk,
        "Cost Efficiency": cost,
    }
    for name, score in dim_map.items():
        if score >= 75:
            strengths.append(f"{name} ({score}/100)")
        elif score < 55:
            weaknesses.append(f"{name} ({score}/100) — needs attention")
    return strengths, weaknesses


def _empty_result() -> HealthResult:
    return HealthResult(
        overall=0, diversification=0, return_quality=0, risk_balance=0, cost_efficiency=0,
        grade="D", weighted_cagr=0, weighted_sharpe=0, weighted_expense=0,
        category_breakdown={}, asset_breakdown={},
        rebalancing_advice=[{"priority":"info","type":"empty","title":"No Holdings Found",
                             "detail":"Add funds to your portfolio to compute a health score.","action":"Use the Fund Screener to add funds."}],
        strengths=[], weaknesses=["Portfolio is empty"],
    )
