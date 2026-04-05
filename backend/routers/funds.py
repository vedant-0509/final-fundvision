"""
FundVision Pro — Fund Screener Router
=======================================
List, filter, sort, and compare mutual funds.
Live NAV refresh via AMFI India API.
"""

import asyncio
import httpx
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import get_db
from ..models import Fund
from ..routers.auth import get_current_user
from ..models import User

logger = logging.getLogger("fundvision.funds")
router = APIRouter()


# ── Fund Response Schema ───────────────────────────────────────────────────────
def _fund_to_dict(f: Fund) -> dict:
    return {
        "id": f.id,
        "scheme_code": f.scheme_code,
        "name": f.name,
        "fund_house": f.fund_house,
        "category": f.category,
        "asset_type": f.asset_type,
        "nav": float(f.nav or 0),
        "cagr_1y": float(f.cagr_1y or 0),
        "cagr_3y": float(f.cagr_3y or 0),
        "cagr_5y": float(f.cagr_5y or 0),
        "cagr_10y": float(f.cagr_10y) if f.cagr_10y else None,
        "sharpe_ratio": float(f.sharpe_ratio or 0),
        "sortino_ratio": float(f.sortino_ratio or 0),
        "beta": float(f.beta or 0),
        "alpha": float(f.alpha or 0),
        "aum_cr": float(f.aum_cr or 0),
        "expense_ratio": float(f.expense_ratio or 0),
        "risk_level": f.risk_level,
        "star_rating": f.star_rating,
        "exit_load": f.exit_load,
        "lock_in_years": f.lock_in_years,
        "nav_date": str(f.nav_date) if f.nav_date else None,
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────
@router.get("")
async def list_funds(
    category: Optional[str] = Query(None),
    asset_type: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    min_cagr_5y: Optional[float] = Query(None),
    min_sharpe: Optional[float] = Query(None),
    max_expense: Optional[float] = Query(None),
    sort_by: str = Query("cagr_5y", regex="^(cagr_5y|cagr_3y|sharpe_ratio|expense_ratio|aum_cr|star_rating)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    q: Optional[str] = Query(None, description="Search by fund name"),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """Filterable, sortable fund screener."""
    stmt = select(Fund).where(Fund.is_active == True)

    if category:
        stmt = stmt.where(Fund.category == category)
    if asset_type:
        stmt = stmt.where(Fund.asset_type == asset_type)
    if risk_level:
        stmt = stmt.where(Fund.risk_level == risk_level)
    if min_cagr_5y is not None:
        stmt = stmt.where(Fund.cagr_5y >= min_cagr_5y)
    if min_sharpe is not None:
        stmt = stmt.where(Fund.sharpe_ratio >= min_sharpe)
    if max_expense is not None:
        stmt = stmt.where(Fund.expense_ratio <= max_expense)
    if q:
        stmt = stmt.where(or_(Fund.name.ilike(f"%{q}%"), Fund.fund_house.ilike(f"%{q}%")))

    # Sorting
    sort_col = getattr(Fund, sort_by, Fund.cagr_5y)
    if sort_order == "desc":
        stmt = stmt.order_by(sort_col.desc().nulls_last())
    else:
        stmt = stmt.order_by(sort_col.asc().nulls_last())

    # Count total
    count_result = await db.execute(stmt)
    all_funds = count_result.scalars().all()
    total = len(all_funds)

    paginated = all_funds[offset : offset + limit]

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "funds": [_fund_to_dict(f) for f in paginated],
    }


@router.post("/compare")
async def compare_funds(
    fund_ids: list[int],
    db: AsyncSession = Depends(get_db),
):
    """Compare up to 4 funds side-by-side."""
    if len(fund_ids) > 4:
        raise HTTPException(400, "Compare at most 4 funds")
    result = await db.execute(select(Fund).where(Fund.id.in_(fund_ids)))
    funds = result.scalars().all()
    return {"funds": [_fund_to_dict(f) for f in funds]}

@router.post("/refresh-nav")
async def refresh_nav(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Refresh NAV from AMFI India (free API, no key needed).
    Matches by scheme_code and updates nav + nav_date.
    Rate-limited: call at most once per session.
    """
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(settings.AMFI_NAV_URL)
            resp.raise_for_status()
    except Exception as exc:
        logger.warning(f"NAV refresh failed: {exc}")
        raise HTTPException(503, "Could not fetch live NAV. AMFI API may be unavailable.")

    # Parse AMFI text format: Scheme Code;ISIN1;ISIN2;Scheme Name;Date;NAV
    nav_map: dict[str, tuple[float, str]] = {}
    for line in resp.text.splitlines():
        parts = line.split(";")
        if len(parts) >= 6:
            try:
                code = parts[0].strip()
                nav_date = parts[4].strip()
                nav_val = float(parts[5].strip())
                nav_map[code] = (nav_val, nav_date)
            except ValueError:
                continue

    # Update DB
    result = await db.execute(select(Fund))
    funds = result.scalars().all()
    updated = 0
    from datetime import date
    for fund in funds:
        if fund.scheme_code in nav_map:
            nav_val, nav_date_str = nav_map[fund.scheme_code]
            fund.nav = nav_val
            try:
                fund.nav_date = date.fromisoformat(nav_date_str)
            except Exception:
                pass
            updated += 1

    await db.commit()
    return {"message": f"Updated {updated} fund NAVs", "total_in_amfi": len(nav_map)}

@router.get("/{fund_id}")
async def get_fund(fund_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single fund by ID with full details."""
    result = await db.execute(select(Fund).where(Fund.id == fund_id))
    fund = result.scalar_one_or_none()
    if not fund:
        raise HTTPException(404, "Fund not found")
    return _fund_to_dict(fund)
