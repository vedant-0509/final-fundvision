"""
FundVision Pro — Portfolio Router
==================================
CRUD for portfolio holdings + health score computation.
"""

from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..models import Fund, PortfolioHolding, Transaction, User
from ..routers.auth import get_current_user
from ..utils.scoring import HoldingInput, compute_health_score
from ..utils.forecasting import project_nav

router = APIRouter()


# ── Schemas ────────────────────────────────────────────────────────────────────
class AddHoldingRequest(BaseModel):
    fund_id: int
    amount: float = Field(..., gt=0)
    investment_type: str = "lumpsum"   # sip | lumpsum
    sip_amount: float | None = None
    sip_date: int | None = None
    notes: str | None = None


class UpdateHoldingRequest(BaseModel):
    amount: float = Field(..., gt=0)  # additional investment


# ── Helpers ────────────────────────────────────────────────────────────────────
async def _get_user_holdings(user_id: int, db: AsyncSession) -> list[dict]:
    """Fetch holdings with fund details joined."""
    result = await db.execute(
        select(PortfolioHolding, Fund)
        .join(Fund, PortfolioHolding.fund_id == Fund.id)
        .where(PortfolioHolding.user_id == user_id, PortfolioHolding.is_active == True)
    )
    rows = result.all()
    holdings = []
    for h, f in rows:
        current_value = float(h.invested_amount) * (1 + (float(f.cagr_5y or 0) / 100))
        holdings.append({
            "holding_id": h.id,
            "fund_id": f.id,
            "name": f.name,
            "fund_house": f.fund_house,
            "category": f.category,
            "asset_type": f.asset_type,
            "risk_level": f.risk_level,
            "nav": float(f.nav or 0),
            "invested": float(h.invested_amount),
            "current_value": round(current_value, 2),
            "gain": round(current_value - float(h.invested_amount), 2),
            "gain_pct": round((current_value / float(h.invested_amount) - 1) * 100, 2) if h.invested_amount else 0,
            "cagr_5y": float(f.cagr_5y or 0),
            "sharpe_ratio": float(f.sharpe_ratio or 0),
            "expense_ratio": float(f.expense_ratio or 0),
            "star_rating": f.star_rating,
            "investment_type": h.investment_type,
            "sip_amount": float(h.sip_amount or 0),
            "first_invested": str(h.first_invested) if h.first_invested else None,
        })
    return holdings


# ── Endpoints ──────────────────────────────────────────────────────────────────
@router.get("")
async def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return full portfolio with health score and rebalancing advice."""
    holdings = await _get_user_holdings(current_user.id, db)

    # Health score
    score_inputs = [
        HoldingInput(
            fund_id=h["fund_id"], name=h["name"], category=h["category"],
            asset_type=h["asset_type"], risk_level=h["risk_level"],
            invested=h["invested"], cagr_5y=h["cagr_5y"],
            sharpe_ratio=h["sharpe_ratio"], expense_ratio=h["expense_ratio"],
        )
        for h in holdings
    ]
    health = compute_health_score(score_inputs)

    total_invested = sum(h["invested"] for h in holdings)
    total_value = sum(h["current_value"] for h in holdings)

    return {
        "holdings": holdings,
        "summary": {
            "total_invested": round(total_invested),
            "total_value": round(total_value),
            "total_gain": round(total_value - total_invested),
            "total_gain_pct": round((total_value / total_invested - 1) * 100, 2) if total_invested else 0,
            "fund_count": len(holdings),
        },
        "health": {
            "overall": health.overall,
            "grade": health.grade,
            "diversification": health.diversification,
            "return_quality": health.return_quality,
            "risk_balance": health.risk_balance,
            "cost_efficiency": health.cost_efficiency,
            "weighted_cagr": health.weighted_cagr,
            "weighted_sharpe": health.weighted_sharpe,
            "weighted_expense": health.weighted_expense,
            "category_breakdown": health.category_breakdown,
            "asset_breakdown": health.asset_breakdown,
            "rebalancing_advice": health.rebalancing_advice,
            "strengths": health.strengths,
            "weaknesses": health.weaknesses,
        },
    }


@router.post("/add", status_code=201)
async def add_holding(
    body: AddHoldingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add or top-up a fund in the portfolio."""
    fund_result = await db.execute(select(Fund).where(Fund.id == body.fund_id))
    fund = fund_result.scalar_one_or_none()
    if not fund:
        raise HTTPException(404, "Fund not found")

    # Check existing holding
    existing_result = await db.execute(
        select(PortfolioHolding).where(
            PortfolioHolding.user_id == current_user.id,
            PortfolioHolding.fund_id == body.fund_id,
        )
    )
    holding = existing_result.scalar_one_or_none()

    if holding:
        holding.invested_amount += body.amount
        holding.last_invested = date.today()
    else:
        holding = PortfolioHolding(
            user_id=current_user.id,
            fund_id=body.fund_id,
            invested_amount=body.amount,
            investment_type=body.investment_type,
            sip_amount=body.sip_amount,
            sip_date=body.sip_date,
            first_invested=date.today(),
            last_invested=date.today(),
            notes=body.notes,
        )
        db.add(holding)

    # Record transaction
    db.add(Transaction(
        user_id=current_user.id,
        fund_id=body.fund_id,
        txn_type=body.investment_type,
        amount=body.amount,
        nav_at_txn=fund.nav,
        units=body.amount / float(fund.nav) if fund.nav else None,
        txn_date=date.today(),
    ))

    await db.commit()
    return {"message": "Holding updated", "fund": fund.name, "amount": body.amount}


@router.get("/transactions")
async def get_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get transaction history."""
    result = await db.execute(
        select(Transaction, Fund)
        .join(Fund, Transaction.fund_id == Fund.id)
        .where(Transaction.user_id == current_user.id)
        .order_by(Transaction.txn_date.desc())
        .limit(50)
    )
    rows = result.all()
    return {
        "transactions": [
            {
                "id": t.id,
                "fund_name": f.name,
                "type": t.txn_type,
                "amount": float(t.amount),
                "units": float(t.units or 0),
                "nav": float(t.nav_at_txn or 0),
                "date": str(t.txn_date),
            }
            for t, f in rows
        ]
    }

@router.get("/forecast/{fund_id}")
async def forecast_fund(
    fund_id: int,
    years: int = 5,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate NAV projection for a specific fund."""
    fund_result = await db.execute(select(Fund).where(Fund.id == fund_id))
    fund = fund_result.scalar_one_or_none()
    if not fund:
        raise HTTPException(404, "Fund not found")

    projections = project_nav(
        current_nav=float(fund.nav or 100),
        cagr_pct=float(fund.cagr_5y or 12),
        years_ahead=min(years, 10),
    )

    return {
        "fund": {"id": fund.id, "name": fund.name, "nav": float(fund.nav or 0)},
        "projections": [{"label": p.label, "value": p.value, "projected": p.is_projected} for p in projections],
    }

@router.delete("/{fund_id}")
async def remove_holding(
    fund_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove a fund from the portfolio (soft delete)."""
    result = await db.execute(
        select(PortfolioHolding).where(
            PortfolioHolding.user_id == current_user.id,
            PortfolioHolding.fund_id == fund_id,
        )
    )
    holding = result.scalar_one_or_none()
    if not holding:
        raise HTTPException(404, "Holding not found")

    holding.is_active = False
    await db.commit()
    return {"message": "Holding removed"}
