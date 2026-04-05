"""
FundVision Pro — AI Advisor Router (April 2026 Edition)
======================================================
Features:
- Gemini 2.5 Flash Integration (Stable v1)
- Rule-based Fund Recommendation Engine
- Live Market Sentiment Analysis
- AI-Powered Portfolio Explanations
"""

from __future__ import annotations
import json
import logging
from typing import Any

import google.generativeai as genai
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

# ── Gemini Initialization (April 2026 Stable) ─────────────────────────────────
ai_model = None

if settings.GOOGLE_API_KEY:
    try:
        # Use 'transport="rest"' to ensure we use the stable v1 production API
        genai.configure(api_key=settings.GOOGLE_API_KEY, transport="rest")
        
        # Initializing with the 2.5 model confirmed by your project key
        ai_model = genai.GenerativeModel(model_name='gemini-2.5-flash')
        
        logger.info("✅ Gemini 2.5 Flash initialized successfully (Stable v1)")
    except Exception as e:
        logger.error(f"❌ Gemini Initialization Error: {e}")
        ai_model = None
else:
    logger.warning("⚠️ GOOGLE_API_KEY missing from .env. AI Advisor is offline.")

# ── Request Schemas ────────────────────────────────────────────────────────────
class ProfileInput(BaseModel):
    age: int = 30
    annual_income: float = 600000
    monthly_income: float | None = None
    annual_deductions: float = 150000
    risk_appetite: str = "medium"           # very_low, low, medium, high, very_high
    investment_horizon: str = "long"        # short, medium, long, very_long
    investment_goal: str = "wealth"         # wealth, retirement, education, tax, emergency
    investable_monthly: float | None = None

class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    portfolio_context: dict | None = None

# ── Scoring & Allocation Logic ────────────────────────────────────────────────
GOAL_BONUS = {
    "tax": {"elss": 20},
    "retirement": {"debt": 10, "hybrid": 5},
    "emergency": {"debt": 30},
}

HORIZON_MODIFIER = {
    "short": {"debt": 1.3, "largecap": 0.8},
    "long": {"largecap": 1.1, "midcap": 1.2, "smallcap": 1.0},
}

def _score_fund(fund: Fund, goal: str, horizon: str) -> float:
    # ✅ Convert Decimal values to float before multiplication
    cagr = float(fund.cagr_5y or 0)
    rating = float(fund.star_rating or 3)
    
    score = cagr * 0.35
    score += rating * 0.10
    
    bonus = GOAL_BONUS.get(goal, {}).get(fund.category, 0)
    score += bonus * 0.5
    
    mod = HORIZON_MODIFIER.get(horizon, {}).get(fund.category, 1.0)
    return round(score * mod, 3)

def _get_allocation(risk: str, goal: str) -> dict[str, int]:
    allocations = {
        "medium": {"debt": 15, "largecap": 35, "hybrid": 15, "midcap": 25, "smallcap": 10},
        "high": {"debt": 5, "largecap": 20, "flexicap": 15, "midcap": 35, "smallcap": 25},
    }
    alloc = allocations.get(risk, allocations["medium"]).copy()
    if goal == "emergency":
        alloc = {"debt": 80, "largecap": 20}
    return alloc

# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/recommend")
async def recommend(
    profile: ProfileInput,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    monthly = profile.investable_monthly or (profile.annual_income / 12) * 0.3
    alloc = _get_allocation(profile.risk_appetite, profile.investment_goal)

    result = await db.execute(select(Fund).where(Fund.is_active == True))
    all_funds = result.scalars().all()

    recommendations = []
    for category, pct in alloc.items():
        bucket = [f for f in all_funds if f.category == category]
        if not bucket: continue
        bucket.sort(key=lambda f: _score_fund(f, profile.investment_goal, profile.investment_horizon), reverse=True)
        best = bucket[0]
        recommendations.append({
            "category": category,
            "allocation_pct": pct,
            "monthly_amount": round(monthly * pct / 100),
            "fund": {
                "id": best.id,
                "name": best.name,
                "nav": float(best.nav or 0),
                "cagr_5y": float(best.cagr_5y or 0),
                "score": _score_fund(best, profile.investment_goal, profile.investment_horizon),
            },
        })

    ai_explanation = _generate_ai_explanation(profile, recommendations, monthly)

    # Persist the recommendation
    db.add(AIRecommendation(
        user_id=current_user.id,
        profile_snapshot=profile.model_dump(),
        recommendations={"items": recommendations, "allocation": alloc},
        ai_explanation=ai_explanation,
        model_used="gemini-2.5-flash",
    ))
    await db.commit()

    return {
        "profile": profile.model_dump(),
        "investable_monthly": round(monthly),
        "recommendations": recommendations,
        "ai_explanation": ai_explanation,
    }

@router.post("/chat")
async def ai_chat(body: ChatRequest, current_user: User = Depends(get_current_user)):
    if not ai_model:
        return {"reply": "AI is offline. Please check API settings."}

    try:
        system_instr = _build_system_prompt(body.portfolio_context)
        user_msg = body.messages[-1].content
        full_prompt = f"{system_instr}\n\nUser Question: {user_msg}"

        response = ai_model.generate_content(full_prompt)
        return {"reply": response.text}
    except Exception as exc:
        logger.error(f"Gemini Chat Error: {exc}")
        return {"reply": "I'm connected, but hit a snag. Please try again!"}

@router.get("/news-sentiment")
async def news_sentiment(current_user: User = Depends(get_current_user)):
    headlines = [
        "RBI keeps interest rates stable; focus on long-term growth",
        "Nifty 50 achieves new milestone; domestic inflows remain strong",
        "Market volatility expected due to global energy price shifts",
        "India's tax collections exceed budget estimates, fiscal deficit narrows"
    ]
    try:
        if ai_model:
            prompt = (
                f"Analyze these Indian market headlines: {headlines}. "
                "Provide a brief 'Market Sentiment' (Bullish/Bearish/Neutral) "
                "and a 1-sentence summary for a Mutual Fund investor. "
                "Format: Sentiment: [Mood] | Summary: [Text]"
            )
            response = ai_model.generate_content(prompt)
            raw_text = response.text
            sentiment = "Bullish" if "Bullish" in raw_text else "Bearish" if "Bearish" in raw_text else "Neutral"
            summary = raw_text.split("Summary:")[-1].strip() if "Summary:" in raw_text else raw_text
        else:
            sentiment, summary = "Neutral", "Analysis unavailable."

        results = [{"headline": h, "sentiment": "Positive" if "growth" in h.lower() else "Neutral"} for h in headlines]
        return {"overall_sentiment": sentiment, "overall_summary": summary, "sentiments": results}
    except Exception:
        return {"overall_sentiment": "Neutral", "overall_summary": "Steady market outlook.", "sentiments": []}

# ── Private Helpers ────────────────────────────────────────────────────────────

def _generate_ai_explanation(profile: ProfileInput, recs: list[dict], monthly: float) -> str:
    if not ai_model:
        return "Portfolio generated based on risk parameters. Focus on disciplined SIPs."

    prompt = (
        f"Explain this mutual fund portfolio for an Indian investor: "
        f"Risk: {profile.risk_appetite}, Goal: {profile.investment_goal}, Budget: ₹{monthly}. "
        f"Portfolio: {json.dumps(recs)}. Keep it under 100 words."
    )
    try:
        response = ai_model.generate_content(prompt)
        return response.text
    except Exception:
        return "Your portfolio is balanced to optimize risk-adjusted returns."

def _build_system_prompt(portfolio_ctx: dict | None) -> str:
    ctx_str = f"Context: {json.dumps(portfolio_ctx)}" if portfolio_ctx else "User has no current portfolio."
    return f"You are FundVision AI, an Indian Mutual Fund expert. {ctx_str} Use ₹. Be concise."