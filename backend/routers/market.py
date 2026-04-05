"""
FundVision Pro — Market Data Router
=====================================
Live market indices (Sensex, Nifty) via yfinance.
Cached to avoid rate limiting.
"""

import asyncio
import logging
import time
from functools import lru_cache
from fastapi import APIRouter
import yfinance as yf

logger = logging.getLogger("fundvision.market")
router = APIRouter()

# Simple in-memory cache: (data, timestamp)
_cache: dict[str, tuple[dict, float]] = {}
CACHE_TTL = 300  # 5 minutes


def _cached(key: str, ttl: int = CACHE_TTL):
    """Returns cached value or None."""
    if key in _cache:
        data, ts = _cache[key]
        if time.time() - ts < ttl:
            return data
    return None


def _set_cache(key: str, data: dict):
    _cache[key] = (data, time.time())


@router.get("/indices")
async def get_indices():
    """Nifty 50 and Sensex with % change."""
    cached = _cached("indices")
    if cached:
        return cached

    tickers = {"Nifty 50": "^NSEI", "Sensex": "^BSESN", "Nifty Bank": "^NSEBANK"}
    result = {}

    for name, symbol in tickers.items():
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.fast_info
            last = getattr(info, 'last_price', None) or getattr(info, 'regularMarketPrice', None)
            prev = getattr(info, 'previous_close', None) or getattr(info, 'regularMarketPreviousClose', None)
            if last is None or prev is None:
                raise ValueError("Missing price data")
            result[name] = {
                "value": round(last, 2),
                "change": round(last - prev, 2),
                "change_pct": round((last - prev) / prev * 100, 2),
                "symbol": symbol,
            }
        except Exception as exc:
            logger.warning(f"Could not fetch {symbol}: {exc}")
            result[name] = _mock_index(name)

    result["status"] = "live" if result else "mock"
    _set_cache("indices", result)
    return result


@router.get("/indices/history")
async def get_index_history(symbol: str = "^NSEI", period: str = "1y", interval: str = "1mo"):
    """Historical OHLCV for index charts."""
    cached = _cached(f"history_{symbol}_{period}_{interval}")
    if cached:
        return cached

    valid_periods = ["1mo", "3mo", "6mo", "1y", "2y", "5y"]
    valid_intervals = ["1d", "1wk", "1mo"]
    if period not in valid_periods or interval not in valid_intervals:
        period, interval = "1y", "1mo"

    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period=period, interval=interval)
        data = {
            "symbol": symbol,
            "period": period,
            "data": [
                {
                    "date": str(idx.date()),
                    "open": round(row["Open"], 2),
                    "high": round(row["High"], 2),
                    "low": round(row["Low"], 2),
                    "close": round(row["Close"], 2),
                    "volume": int(row["Volume"]),
                }
                for idx, row in hist.iterrows()
            ],
        }
    except Exception as exc:
        logger.warning(f"History fetch failed: {exc}")
        data = {"symbol": symbol, "period": period, "data": _mock_history()}

    _set_cache(f"history_{symbol}_{period}_{interval}", data)
    return data


# ── Mock Fallbacks ─────────────────────────────────────────────────────────────
def _mock_index(name: str) -> dict:
    defaults = {
        "Nifty 50": {"value": 22326.90, "change": 97.30, "change_pct": 0.44},
        "Sensex":   {"value": 73648.62, "change": 312.45, "change_pct": 0.43},
        "Nifty Bank": {"value": 48120.50, "change": -145.20, "change_pct": -0.30},
    }
    d = defaults.get(name, {"value": 0, "change": 0, "change_pct": 0})
    return {**d, "symbol": "MOCK", "is_mock": True}


def _mock_history() -> list[dict]:
    """Return 12-month mock data."""
    import random
    base, result = 19000, []
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    for i, m in enumerate(months):
        base *= (1 + random.uniform(0.005, 0.025))
        result.append({"date": f"2024-{i+1:02d}-01", "open": round(base*0.99, 2),
                        "high": round(base*1.01, 2), "low": round(base*0.98, 2),
                        "close": round(base, 2), "volume": random.randint(1000000, 5000000)})
    return result
