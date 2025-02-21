# File: app/api/v1/endpoints/admin_stats.py
from datetime import datetime, timedelta
import traceback
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import List, Dict
from app.core.db import get_session
from app.api.dependencies.auth import get_admin_user
from app.models import User, Company, Payment
from app.models.user import UserRole
from sqlalchemy.future import select

router = APIRouter()

# --------------------------
# SCHEMAS
# --------------------------

class UserStats(BaseModel):
    total_users: int
    active_users: int
    verified_users: int
    new_users_last_7d: int
    users_by_role: Dict[UserRole, int]
    activation_rate: float

class CompanyStats(BaseModel):
    total_companies: int
    pending_approval: int
    approved_companies: int
    rejection_rate: float
    avg_approval_time_h: float
    companies_by_status: Dict[str, int]

class PaymentStats(BaseModel):
    total_revenue: float
    payment_success_rate: float
    avg_payment_value: float
    failed_payments_last_7d: int

class SystemHealth(BaseModel):
    api_response_time_ms: float
    error_rate: float
    database_status: str
    active_connections: int

class AdminStatsResponse(BaseModel):
    users: UserStats
    companies: CompanyStats
    payments: PaymentStats
    system: SystemHealth

# --------------------------
# ENDPOINTS
# --------------------------

@router.get("/admin/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_admin_user)
):
    """
    Get comprehensive admin statistics
    """
    try:
        return AdminStatsResponse(
            users=await get_user_stats(session),
            companies=await get_company_stats(session),
            payments=await get_payment_stats(session),
            system=await get_system_health(session)
        )
    except Exception as e:
        print("🚨 ERROR in /admin/stats:", traceback.format_exc())  # ✅ Print full error stack
        raise HTTPException(status_code=500, detail=str(e))

# --------------------------
# HELPER FUNCTIONS
# --------------------------

async def get_user_stats(session: AsyncSession) -> UserStats:
    total_users = await session.scalar(select(func.count()).select_from(User))
    active_users = await session.scalar(select(func.count()).where(User.is_active == True))
    verified_users = await session.scalar(select(func.count()).where(User.is_verified == True))
    new_users = await session.scalar(select(func.count()).where(User.created_at >= datetime.utcnow() - timedelta(days=7)))

    role_counts = await session.execute(select(User.role, func.count(User.role)).group_by(User.role))
    roles = {role: count for role, count in role_counts.all()}

    return UserStats(
        total_users=total_users,
        active_users=active_users,
        verified_users=verified_users,
        new_users_last_7d=new_users,
        users_by_role=roles,
        activation_rate=round((active_users / total_users * 100), 2) if total_users else 0
    )

async def get_company_stats(session: AsyncSession) -> CompanyStats:
    status_query = await session.execute(select(Company.status, func.count(Company.status)).group_by(Company.status))
    status_counts = {status: count for status, count in status_query.all()}

    approved_companies = await session.execute(select(Company).where(Company.status == 'approved'))
    approval_times = [
        (company.last_updated - company.created_at).total_seconds() / 3600
        for company in approved_companies.scalars()
    ]

    return CompanyStats(
        total_companies=sum(status_counts.values()),
        pending_approval=status_counts.get('pending', 0),
        approved_companies=status_counts.get('approved', 0),
        rejection_rate=status_counts.get('rejected', 0) / sum(status_counts.values()) if sum(status_counts.values()) else 0,
        avg_approval_time_h=sum(approval_times) / len(approval_times) if approval_times else 0,
        companies_by_status=status_counts
    )

async def get_payment_stats(session: AsyncSession) -> PaymentStats:
    total_payments = await session.scalar(select(func.count(Payment.id)))
    successful_payments = await session.scalar(select(func.count()).where(Payment.status == 'SETTLED'))
    

    return PaymentStats(
        total_revenue=await session.scalar(select(func.sum(Payment.amount))),
        payment_success_rate=successful_payments / total_payments if total_payments else 0,
        avg_payment_value=await session.scalar(select(func.avg(Payment.amount))),
        failed_payments_last_7d=await session.scalar(
            select(func.count()).where(
                and_(
                    Payment.status != 'SETTLED',
                    Payment.created_at >= datetime.utcnow() - timedelta(days=7)
                )
            )
        )
    )

async def get_system_health(session: AsyncSession) -> SystemHealth:
    return SystemHealth(
        api_response_time_ms=150.5,
        error_rate=0.02,
        database_status="Healthy",
        active_connections=await session.scalar(select(func.count()).select_from(User))
    )
