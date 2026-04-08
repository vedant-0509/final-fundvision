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
    investment_type: str = "lumpsum"   # sip | lumpsum | buy
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
        # Current value logic based on 5Y CAGR as a simple estimate
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

    # Health score computation
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
    """Add or top-up a fund in the portfolio with proper async handling."""
    
    # 1. Verify Fund exists
    fund_result = await db.execute(select(Fund).where(Fund.id == body.fund_id))
    fund = fund_result.scalar_one_or_none()
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")

    # 2. Check for existing active holding
    # We use execution options to ensure we get a fresh object
    existing_result = await db.execute(
        select(PortfolioHolding).where(
            PortfolioHolding.user_id == current_user.id,
            PortfolioHolding.fund_id == body.fund_id,
            PortfolioHolding.is_active == True
        )
    )
    holding = existing_result.scalar_one_or_none()

    # 3. Safe Math & Mapping
    holding_type = "lumpsum" if body.investment_type in ["buy", "lumpsum"] else "sip"
    txn_type = "buy" if body.investment_type in ["buy", "lumpsum"] else "sip"
    
    # Handle NAV safely
    try:
        nav_val = float(fund.nav) if fund.nav and float(fund.nav) > 0 else 10.0
    except (ValueError, TypeError):
        nav_val = 10.0

    amount_to_add = float(body.amount)
    units_to_add = amount_to_add / nav_val

    try:
        if holding:
            # 4a. UPDATE EXISTING (Prevents IntegrityError)
            # We use float() conversion to ensure SQLAlchemy tracks the change correctly
            holding.invested_amount = float(holding.invested_amount) + amount_to_add
            current_units = float(holding.units_held) if holding.units_held else 0.0
            holding.units_held = current_units + units_to_add
            holding.last_invested = date.today()
            # Update average NAV if necessary (optional logic)
            # holding.avg_nav = (float(holding.invested_amount)) / holding.units_held
        else:
            # 4b. INSERT NEW
            holding = PortfolioHolding(
                user_id=current_user.id,
                fund_id=body.fund_id,
                invested_amount=amount_to_add,
                units_held=units_to_add,
                avg_nav=nav_val,
                investment_type=holding_type,
                sip_amount=body.sip_amount or 0.0,
                sip_date=body.sip_date or 1,
                first_invested=date.today(),
                last_invested=date.today(),
                is_active=True,
                notes=body.notes or "Initial investment"
            )
            db.add(holding)

        # 5. Record the Transaction (Always a new entry)
        new_txn = Transaction(
            user_id=current_user.id,
            fund_id=body.fund_id,
            txn_type=txn_type,
            amount=amount_to_add,
            nav_at_txn=nav_val,
            units=units_to_add,
            txn_date=date.today(),
            notes=body.notes or "Added from Screener"
        )
        db.add(new_txn)

        # 6. Commit changes
        await db.commit()
        return {"message": "Success", "fund": fund.name}

    except Exception as e:
        await db.rollback()
        print(f"CRITICAL DATABASE ERROR: {str(e)}")
        # If it's still a duplicate error, it means another process inserted it simultaneously
        if "Duplicate entry" in str(e):
             raise HTTPException(status_code=400, detail="This fund is already in your portfolio.")
        raise HTTPException(status_code=500, detail=f"Database Error: {str(e)}")

















# @router.post("/add", status_code=201)
# async def add_holding(
#     body: AddHoldingRequest,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db),
# ):
#     """Add or top-up a fund in the portfolio with ENUM mapping and safe math."""
    
#     # 1. Verify Fund exists
#     fund_result = await db.execute(select(Fund).where(Fund.id == body.fund_id))
#     fund = fund_result.scalar_one_or_none()
#     if not fund:
#         raise HTTPException(404, "Fund not found")

#     # 2. Check for existing active holding
#     existing_result = await db.execute(
#         select(PortfolioHolding).where(
#             PortfolioHolding.user_id == current_user.id,
#             PortfolioHolding.fund_id == body.fund_id,
#             PortfolioHolding.is_active == True
#         )
#     )
#     holding = existing_result.scalar_one_or_none()

#     holding_type = "lumpsum" if body.investment_type in ["buy", "lumpsum"] else "sip"
#     txn_type = "buy" if body.investment_type in ["buy", "lumpsum"] else "sip"
#     nav_val = float(fund.nav) if fund.nav and float(fund.nav) > 0 else 10.0
#     amount_to_add = float(body.amount)
#     units_to_add = amount_to_add / nav_val

#     try:
#         if holding:
#             holding.invested_amount = float(holding.invested_amount) + amount_to_add
#             current_units = float(holding.units_held) if holding.units_held else 0.0
#             holding.units_held = current_units + units_to_add
#             holding.last_invested = date.today()
#         else:
#             holding = PortfolioHolding(
#                 user_id=current_user.id,
#                 fund_id=body.fund_id,
#                 invested_amount=amount_to_add,
#                 units_held=units_to_add,
#                 avg_nav=nav_val,
#                 investment_type=holding_type,
#                 sip_amount=body.sip_amount or 0.0,
#                 sip_date=body.sip_date or 1,
#                 first_invested=date.today(),
#                 last_invested=date.today(),
#                 is_active=True,
#                 notes=body.notes
#             )
#             db.add(holding)

#         # 5. Record the Transaction
#         db.add(Transaction(
#             user_id=current_user.id,
#             fund_id=body.fund_id,
#             txn_type=txn_type,
#             amount=amount_to_add,
#             nav_at_txn=nav_val,
#             units=units_to_add,
#             txn_date=date.today(),
#             notes=body.notes or "Added from Screener"
#         ))

#         await db.commit()
#         return {"message": "Success", "fund": fund.name}

#     except Exception as e:
#         await db.rollback()
#         # This will print the EXACT reason for the 500 error in your backend terminal
#         print(f"CRITICAL DATABASE ERROR: {str(e)}")
#         raise HTTPException(500, detail=f"Database Error: {str(e)}")


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