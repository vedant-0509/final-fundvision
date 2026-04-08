"""
FundVision Pro — FastAPI Main Application
=========================================
Entry point. Mounts all routers and configures CORS, middleware, and startup events.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from .database import get_db # Ensure this path points to your database config
from . import models         # Ensure this points to your models

from .database import engine, Base
from .config import settings
from .routers import auth, funds, portfolio, calculator, ai_advisor, market

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("fundvision")


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 FundVision Pro starting up...")
    # Create all tables on first run
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables verified.")
    yield
    logger.info("⛔ FundVision Pro shutting down.")


# ── App Instance ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="FundVision Pro API",
    description="AI-Powered Mutual Fund Portfolio Analyzer",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── Middleware ─────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


# ── API Routers ────────────────────────────────────────────────────────────────
API_PREFIX = "/api/v1"

app.include_router(auth.router,       prefix=f"{API_PREFIX}/auth",       tags=["Authentication"])
app.include_router(funds.router,      prefix=f"{API_PREFIX}/funds",      tags=["Fund Screener"])
app.include_router(portfolio.router,  prefix=f"{API_PREFIX}/portfolio",  tags=["Portfolio"])
app.include_router(calculator.router, prefix=f"{API_PREFIX}/calculator", tags=["Calculators"])
app.include_router(ai_advisor.router, prefix=f"{API_PREFIX}/ai",         tags=["AI Advisor"])
app.include_router(market.router,     prefix=f"{API_PREFIX}/market",     tags=["Market Data"])


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["System"])
async def health():
    return {"status": "ok", "version": "2.0.0", "service": "FundVision Pro"}


# ── SPA Fallback (serve React frontend) ───────────────────────────────────────
try:
    app.mount("/static", StaticFiles(directory="frontend/dist/static"), name="static")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        return FileResponse("frontend/dist/index.html")
except RuntimeError:
    # Frontend not built yet — OK during development
    pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)


from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
# ... your other imports (models, database)
@app.get("/api/v1/funds/{identifier}")
async def get_fund(identifier: str, db: Session = Depends(get_db)):
    # Try finding by scheme_code first
    fund = db.query(models.Fund).filter(models.Fund.scheme_code == identifier).first()
    
    # If not found, try searching by database ID
    if not fund and identifier.isdigit():
        fund = db.query(models.Fund).filter(models.Fund.id == int(identifier)).first()
        
    if not fund:
        raise HTTPException(status_code=404, detail="Fund not found")
        
    return fund