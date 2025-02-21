from datetime import datetime
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.Company import Company
from app.models.Subscription import Subscription, SubscriptionStatus
from app.models.payment import Payment
from app.models.user import User
from sqlalchemy.orm import joinedload
from app.schemas.stats import SubscriptionStats
import logging


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def is_subscription_active(user: User, session: AsyncSession) -> bool:
    """
    Check if the user has an active subscription.

    Args:
        user (User): The user object to check.
        session (AsyncSession): The database session.

    Returns:
        bool: True if the user has an active subscription, False otherwise.
    """
    if not user:
        return False

    # Query the subscription table to check for active subscriptions
    stmt = select(Subscription).where(
        Subscription.user_id == user.id,
        Subscription.end_date > datetime.utcnow()  # Active subscription
    )
    result = await session.execute(stmt)
    subscription = result.scalars().first()


    return subscription is not None


async def get_subscription_stats(user: User, session: AsyncSession) -> SubscriptionStats:
    """
    Fetch subscription details for the user (without companies_limit).
    """
    result = await session.execute(
        select(Subscription)
        .where(
            Subscription.user_id == user.id,
            Subscription.status == SubscriptionStatus.ACTIVE  # ✅ Use enum
        )
        .options(joinedload(Subscription.plan))
    )

    subscription = result.scalars().first()

    if not subscription:
        return SubscriptionStats(
            plan_name="No Active Plan",
            renewal_date=None,
        )

    # ✅ Fetch Plan Name
    plan_name = subscription.plan.name if subscription.plan else "Unknown Plan"

    # ✅ Fetch Payment History
    payments = await session.execute(
        select(Payment)
        .where(Payment.user_id == user.id)
        .order_by(Payment.created_at.desc())
        .limit(5)
    )


    return SubscriptionStats(
        plan_name=plan_name,
        renewal_date=subscription.end_date,
    )
