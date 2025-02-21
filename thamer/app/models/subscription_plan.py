from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import List, Optional

class SubscriptionPlan(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str
    description: str
    price: float
    duration_days: int
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow, nullable=True)

    # ✅ FIX: Add relationship to Subscription
    subscriptions: List["Subscription"] = Relationship(back_populates="plan")
