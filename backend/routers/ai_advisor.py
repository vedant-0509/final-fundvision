"""
FundVision Pro — AI Advisor Router
===================================
Hybrid Recommendation Engine:
  Step 1 — Rule-based filtering (risk, category, goal, tax)
  Step 2 — Fund scoring (CAGR × Sharpe × Cost composite)
  Step 3 — LLM explanation via Claude API (Anthropic)

Also handles portfolio health AI commentary.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import get_db
from ..models import Fund, User, AIRecommendation
from ..routers.auth import get_current_user

logger = logging.getLogger("fundvision.ai")
router = APIRouter()

# ── Anthropic client (lazy init) ───────────────────────────────────────────────
_client: anthropic.AsyncAnthropic | None = None


def get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        _client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    return _client


# ── Request Schemas ────────────────────────────────────────────────────────────
class ProfileInput(BaseModel):
    age: int = 30
    annual_income: float = 600000
    monthly_income: float | None = None
    annual_deductions: float = 150000
    risk_appetite: str = "medium"           # very_low, low, medium, high, very_high
    investment_horizon: str = "long"        # short(<3yr), medium(3-7yr), long(7-15yr), very_long(15+)
    investment_goal: str = "wealth"         # wealth, retirement, education, tax, house, emergency
    investable_monthly: float | None = None


class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    portfolio_context: dict | None = None


# ── Fund Scoring Helpers ───────────────────────────────────────────────────────
RISK_MAP = {
    "very_low":  ["debt"],
    "low":       ["debt", "largecap"],
    "medium":    ["largecap", "hybrid", "midcap"],
    "high":      ["midcap", "smallcap", "flexicap", "elss"],
    "very_high": ["smallcap", "midcap", "elss", "flexicap"],
}

GOAL_BONUS = {
    "tax":        {"elss": 20},
    "retirement": {"debt": 10, "hybrid": 5},
    "emergency":  {"debt": 30},
    "education":  {"largecap": 5, "hybrid": 5},
}

HORIZON_MODIFIER = {
    "short":     {"debt": 1.3, "largecap": 0.8, "midcap": 0.4, "smallcap": 0.2},
    "medium":    {"debt": 0.8, "largecap": 1.2, "midcap": 1.0, "hybrid": 1.1},
    "long":      {"largecap": 1.1, "midcap": 1.2, "smallcap": 1.0, "elss": 1.1},
    "very_long": {"midcap": 1.3, "smallcap": 1.3, "flexicap": 1.2, "elss": 1.1},
}


def _score_fund(fund: Fund, goal: str, horizon: str) -> float:
    """Composite score: 35% return, 25% sharpe, 20% cost, 10% aum, 10% rating."""
    score = 0.0
    score += (fund.cagr_5y or 0) * 0.35
    score += (fund.sharpe_ratio or 0) * 10 * 0.25
    score += max(0, (2.0 - (fund.expense_ratio or 1.0))) * 5 * 0.20
    score += min((fund.aum_cr or 0) / 10000, 5) * 0.10
    score += (fund.star_rating or 3) * 0.10

    # Goal bonus
    bonus = GOAL_BONUS.get(goal, {}).get(fund.category, 0)
    score += bonus * 0.5

    # Horizon modifier
    mod = HORIZON_MODIFIER.get(horizon, {}).get(fund.category, 1.0)
    score *= mod

    return round(score, 3)


def _get_allocation(risk: str, goal: str, horizon: str) -> dict[str, int]:
    """Returns target % allocation by category."""
    allocations = {
        "very_low":  {"debt": 70, "largecap": 20, "hybrid": 10},
        "low":       {"debt": 50, "largecap": 35, "hybrid": 15},
        "medium":    {"debt": 15, "largecap": 35, "hybrid": 15, "midcap": 25, "smallcap": 10},
        "high":      {"debt": 5,  "largecap": 20, "flexicap": 15, "midcap": 35, "smallcap": 25},
        "very_high": {"largecap": 10, "flexicap": 15, "midcap": 30, "smallcap": 35, "elss": 10},
    }
    alloc = allocations.get(risk, allocations["medium"]).copy()

    # Adjust for tax goal
    if goal == "tax":
        alloc["elss"] = alloc.get("elss", 0) + 15
        # Trim largest allocation proportionally
        biggest = max(alloc, key=lambda k: alloc[k] if k != "elss" else 0)
        alloc[biggest] = max(0, alloc[biggest] - 15)

    # Adjust for emergency
    if goal == "emergency":
        alloc = {"debt": 80, "largecap": 20}

    # Short horizon — shift to debt
    if horizon == "short":
        alloc = {k: max(0, v - (v * 0.4 if k != "debt" else 0)) for k, v in alloc.items()}
        alloc["debt"] = alloc.get("debt", 0) + 40
        # Normalize to 100
        total = sum(alloc.values())
        alloc = {k: round(v / total * 100) for k, v in alloc.items() if v > 0}

    return alloc


# ── Main Recommendation Endpoint ───────────────────────────────────────────────
@router.post("/recommend")
async def recommend(
    profile: ProfileInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Hybrid recommendation:
    1. Rule-based allocation & fund filtering
    2. Claude LLM for human-readable explanation
    """
    monthly = profile.investable_monthly or (profile.monthly_income or profile.annual_income / 12) * 0.3

    alloc = _get_allocation(profile.risk_appetite, profile.investment_goal, profile.investment_horizon)

    # Fetch funds from DB
    result = await db.execute(select(Fund).where(Fund.is_active == True))
    all_funds: list[Fund] = result.scalars().all()

    # For each allocation bucket, pick top-scored fund
    recommendations = []
    for category, pct in alloc.items():
        if pct == 0:
            continue
        bucket = [f for f in all_funds if f.category == category]
        if not bucket:
            continue
        bucket.sort(key=lambda f: _score_fund(f, profile.investment_goal, profile.investment_horizon), reverse=True)
        best = bucket[0]
        recommendations.append({
            "category": category,
            "allocation_pct": pct,
            "monthly_amount": round(monthly * pct / 100),
            "fund": {
                "id": best.id,
                "name": best.name,
                "fund_house": best.fund_house,
                "nav": float(best.nav or 0),
                "cagr_3y": float(best.cagr_3y or 0),
                "cagr_5y": float(best.cagr_5y or 0),
                "sharpe_ratio": float(best.sharpe_ratio or 0),
                "expense_ratio": float(best.expense_ratio or 0),
                "risk_level": best.risk_level,
                "star_rating": best.star_rating,
                "score": _score_fund(best, profile.investment_goal, profile.investment_horizon),
            },
        })

    # ── AI Explanation ─────────────────────────────────────────────────────────
    ai_explanation = await _generate_ai_explanation(profile, recommendations, monthly)

    payload = {
        "profile": profile.model_dump(),
        "investable_monthly": round(monthly),
        "allocation": alloc,
        "recommendations": recommendations,
        "ai_explanation": ai_explanation,
    }

    # Persist recommendation
    db.add(AIRecommendation(
        user_id=current_user.id,
        profile_snapshot=profile.model_dump(),
        recommendations={"items": recommendations, "allocation": alloc},
        ai_explanation=ai_explanation,
        model_used=settings.CLAUDE_MODEL,
    ))
    await db.commit()

    return payload


@router.post("/chat")
async def ai_chat(body: ChatRequest, current_user: User = Depends(get_current_user)):
    """
    Conversational AI for portfolio questions.
    The frontend passes the full message history for multi-turn context.
    """
    system = _build_system_prompt(body.portfolio_context)

    messages = [{"role": m.role, "content": m.content} for m in body.messages]

    try:
        client = get_client()
        response = await client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=800,
            system=system,
            messages=messages,
        )
        reply = response.content[0].text
    except Exception as exc:
        logger.error(f"AI chat error: {exc}")
        reply = (
            "I'm having trouble connecting to the AI service right now. "
            "Please check your API key configuration or try again shortly."
        )

    return {"reply": reply}


@router.get("/news-sentiment")
async def news_sentiment(current_user: User = Depends(get_current_user)):
    """
    Analyse recent market headlines and return sentiment scores.
    In production, feed real headlines from NewsAPI. Here we use representative mock data.
    """
    headlines = [
        "RBI keeps repo rate unchanged at 6.5%, signals cautious stance on inflation",
        "Nifty 50 hits record high as FII inflows surge ₹12,000 Cr in a single session",
        "SEBI tightens expense ratio norms for direct mutual fund plans",
        "SBI Mutual Fund AUM crosses ₹10 lakh crore milestone",
        "India GDP growth forecast revised upward to 7.2% by IMF for FY25",
        "Global recession fears mount as US Fed signals prolonged high rates",
        "Mid-cap funds witness 3-month outperformance over large-caps",
        "HDFC Bank Q3 results disappoint; stock falls 4% in intraday trade",
    ]

    try:
        client = get_client()
        response = await client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=600,
            messages=[{
                "role": "user",
                "content": (
                    "Analyze the sentiment of these financial news headlines for Indian markets. "
                    "For each, return JSON with: headline (short), sentiment (positive/negative/neutral), "
                    "score (-1.0 to 1.0), and impact (1-2 sentence analysis). "
                    "Return a JSON array only, no markdown.\n\n"
                    + "\n".join(f"- {h}" for h in headlines)
                ),
            }],
        )
        results = json.loads(response.content[0].text)
    except Exception as exc:
        logger.error(f"Sentiment analysis error: {exc}")
        results = _mock_sentiment(headlines)

    return {"sentiments": results, "overall": _overall_sentiment(results)}


# ── Private Helpers ────────────────────────────────────────────────────────────
async def _generate_ai_explanation(profile: ProfileInput, recs: list[dict], monthly: float) -> str:
    prompt = f"""You are FundVision Pro's AI investment advisor. Explain these mutual fund recommendations
to an Indian retail investor in a friendly, confident, and concise manner (200-250 words).

Investor Profile:
- Age: {profile.age} | Risk: {profile.risk_appetite} | Goal: {profile.investment_goal}
- Horizon: {profile.investment_horizon} | Monthly SIP budget: ₹{monthly:,.0f}

Recommended Portfolio:
{json.dumps([{"fund": r["fund"]["name"], "category": r["category"], "allocation": f"{r['allocation_pct']}%", "monthly": f"₹{r['monthly_amount']:,}"} for r in recs], indent=2)}

Explain:
1. WHY this specific allocation suits their risk profile and goal
2. WHY each fund category was chosen (not specific fund names, keep it generic)
3. One key risk to be aware of
4. One actionable tip to maximise returns

Be warm, professional, and use simple language. Avoid jargon."""

    try:
        client = get_client()
        response = await client.messages.create(
            model=settings.CLAUDE_MODEL,
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text
    except Exception as exc:
        logger.error(f"AI explanation error: {exc}")
        return _fallback_explanation(profile, recs)


def _build_system_prompt(portfolio_ctx: dict | None) -> str:
    ctx_str = ""
    if portfolio_ctx:
        ctx_str = f"\n\nUser's current portfolio context:\n{json.dumps(portfolio_ctx, indent=2)}"
    return (
        "You are FundVision Pro, an expert AI investment advisor specialising in Indian mutual funds, "
        "taxation (80C, LTCG, STCG), and SIP strategies. "
        "Be concise (under 150 words), precise, and always cite relevant metrics (CAGR, Sharpe, expense ratio). "
        "Use ₹ for Indian Rupees. Never recommend specific individual stocks — only funds. "
        "Always remind the user that investments are subject to market risk."
        + ctx_str
    )


def _fallback_explanation(profile: ProfileInput, recs: list[dict]) -> str:
    goal_map = {"wealth": "long-term wealth creation", "retirement": "a comfortable retirement",
                "tax": "tax savings under Section 80C", "education": "education planning"}
    return (
        f"Based on your {profile.risk_appetite} risk profile and goal of "
        f"{goal_map.get(profile.investment_goal, profile.investment_goal)}, "
        f"this portfolio is designed for your {profile.investment_horizon}-term horizon. "
        f"The allocation balances growth potential with appropriate risk management. "
        f"Review and rebalance annually. Past performance is not indicative of future returns."
    )


def _mock_sentiment(headlines: list[str]) -> list[dict]:
    sentiments = ["positive", "positive", "neutral", "positive", "positive", "negative", "positive", "negative"]
    scores = [0.65, 0.82, 0.05, 0.78, 0.71, -0.68, 0.55, -0.72]
    results = []
    for h, s, sc in zip(headlines, sentiments, scores):
        results.append({"headline": h[:80], "sentiment": s, "score": sc, "impact": "Market impact analysis unavailable."})
    return results


def _overall_sentiment(sentiments: list[dict]) -> dict:
    if not sentiments:
        return {"label": "neutral", "score": 0}
    avg = sum(s.get("score", 0) for s in sentiments) / len(sentiments)
    label = "positive" if avg > 0.1 else "negative" if avg < -0.1 else "neutral"
    return {"label": label, "score": round(avg, 3)}
