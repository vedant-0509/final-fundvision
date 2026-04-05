"""
FundVision Pro — SQLAlchemy ORM Models
=======================================
Mirror the schema.sql definitions for Python-level ORM queries.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Boolean, Column, DateTime, Date, Enum, ForeignKey,
    Integer, JSON, Numeric, SmallInteger, String, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(120))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    holdings = relationship("PortfolioHolding", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    ai_recommendations = relationship("AIRecommendation", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    age: Mapped[Optional[int]] = mapped_column(SmallInteger)
    occupation: Mapped[Optional[str]] = mapped_column(String(60))
    annual_income: Mapped[Optional[float]] = mapped_column(Numeric(14, 2))
    monthly_income: Mapped[Optional[float]] = mapped_column(Numeric(14, 2))
    annual_deductions: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    tax_bracket_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0)
    risk_appetite: Mapped[str] = mapped_column(
        Enum("very_low", "low", "medium", "high", "very_high"), default="medium"
    )
    investment_horizon: Mapped[str] = mapped_column(
        Enum("short", "medium", "long", "very_long"), default="long"
    )
    investment_goal: Mapped[str] = mapped_column(
        Enum("wealth", "retirement", "education", "tax", "house", "emergency"), default="wealth"
    )
    investment_style: Mapped[str] = mapped_column(
        Enum("active", "passive", "hybrid"), default="passive"
    )
    preferred_sectors: Mapped[Optional[dict]] = mapped_column(JSON)
    excluded_sectors: Mapped[Optional[dict]] = mapped_column(JSON)
    investable_monthly: Mapped[Optional[float]] = mapped_column(Numeric(14, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")


class Fund(Base):
    __tablename__ = "funds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scheme_code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    fund_house: Mapped[Optional[str]] = mapped_column(String(100))
    category: Mapped[str] = mapped_column(String(20), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(10), nullable=False)
    nav: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))
    cagr_1y: Mapped[Optional[float]] = mapped_column(Numeric(7, 2))
    cagr_3y: Mapped[Optional[float]] = mapped_column(Numeric(7, 2))
    cagr_5y: Mapped[Optional[float]] = mapped_column(Numeric(7, 2))
    cagr_10y: Mapped[Optional[float]] = mapped_column(Numeric(7, 2))
    sharpe_ratio: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    sortino_ratio: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    beta: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    alpha: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    std_deviation: Mapped[Optional[float]] = mapped_column(Numeric(6, 3))
    aum_cr: Mapped[Optional[float]] = mapped_column(Numeric(14, 2))
    expense_ratio: Mapped[Optional[float]] = mapped_column(Numeric(5, 3))
    risk_level: Mapped[str] = mapped_column(String(10), default="Moderate")
    star_rating: Mapped[Optional[int]] = mapped_column(SmallInteger)
    exit_load: Mapped[Optional[str]] = mapped_column(String(60))
    lock_in_years: Mapped[int] = mapped_column(SmallInteger, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    nav_date: Mapped[Optional[datetime]] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    holdings = relationship("PortfolioHolding", back_populates="fund")


class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"
    __table_args__ = (UniqueConstraint("user_id", "fund_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    fund_id: Mapped[int] = mapped_column(Integer, ForeignKey("funds.id"), nullable=False)
    invested_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    units_held: Mapped[Optional[float]] = mapped_column(Numeric(14, 4))
    avg_nav: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))
    investment_type: Mapped[str] = mapped_column(Enum("sip", "lumpsum"), default="lumpsum")
    sip_amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2))
    sip_date: Mapped[Optional[int]] = mapped_column(SmallInteger)
    first_invested: Mapped[Optional[datetime]] = mapped_column(Date)
    last_invested: Mapped[Optional[datetime]] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="holdings")
    fund = relationship("Fund", back_populates="holdings")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    fund_id: Mapped[int] = mapped_column(Integer, ForeignKey("funds.id"), nullable=False)
    txn_type: Mapped[str] = mapped_column(Enum("buy", "sell", "sip"), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    units: Mapped[Optional[float]] = mapped_column(Numeric(14, 4))
    nav_at_txn: Mapped[Optional[float]] = mapped_column(Numeric(12, 4))
    txn_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")


class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    profile_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    recommendations: Mapped[dict] = mapped_column(JSON, nullable=False)
    ai_explanation: Mapped[Optional[str]] = mapped_column(Text)
    model_used: Mapped[str] = mapped_column(String(60), default="claude-sonnet-4-20250514")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="ai_recommendations")


class HealthScore(Base):
    __tablename__ = "health_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    overall_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    diversification: Mapped[Optional[int]] = mapped_column(SmallInteger)
    return_quality: Mapped[Optional[int]] = mapped_column(SmallInteger)
    risk_balance: Mapped[Optional[int]] = mapped_column(SmallInteger)
    cost_efficiency: Mapped[Optional[int]] = mapped_column(SmallInteger)
    rebalancing_advice: Mapped[Optional[dict]] = mapped_column(JSON)
    computed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
