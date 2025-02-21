from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from enum import Enum
import datetime
from app.models.user import User
from app.models.subscription_plan import SubscriptionPlan

class SubscriptionStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    EXPIRED = "expired"

class Subscription(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    plan_id: int = Field(foreign_key="subscriptionplan.id")
    start_date: datetime.datetime
    end_date: datetime.datetime
    amount_paid: float
    status: SubscriptionStatus = Field(default=SubscriptionStatus.ACTIVE)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)  # NEW FIELD

    # ✅ Fix: Explicitly Define Relationships
    user: Optional["User"] = Relationship(back_populates="subscriptions")
    plan: Optional["SubscriptionPlan"] = Relationship(back_populates="subscriptions")
