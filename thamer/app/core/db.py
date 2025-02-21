# app/core/db.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.models.otp_rate_limit import OTPRateLimit
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel
from app.core.config import settings

# Create an async engine
engine = create_async_engine("postgresql+asyncpg://admin:QwErTyUiOp@db:5432/thamer", echo=True)

# Create a sessionmaker for async sessions
async_session = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

# Initialize database
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

# Dependency for async session
async def get_session():
    async with async_session() as session:
        yield session
