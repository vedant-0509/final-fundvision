"""
FundVision Pro — Database Engine & Session
==========================================
Async SQLAlchemy 2.0 setup. All DB I/O is non-blocking.
"""

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from .config import settings

# ── Async Engine ───────────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

# ── Session Factory ────────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


# ── Base Model ─────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Dependency: inject DB session ─────────────────────────────────────────────


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            # REMOVED: await session.commit() 
            # We want the specific endpoint to decide when to commit.
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()