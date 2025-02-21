from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Payment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    order_id: str = Field(index=True, unique=True)
    user_id: int = Field(foreign_key="user.id")
    plan_id: Optional[int] = Field(foreign_key="subscriptionplan.id")  # ✅ Store plan_id
    subscription_id: Optional[int] = Field(foreign_key="subscription.id")
    amount: float
    currency: str
    description: str
    status: str = Field(default="PENDING")
    trans_id: Optional[str] = Field(default=None, unique=True)
    trans_date: Optional[datetime]
    failure_reason: Optional[str] = None
    redirect_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
