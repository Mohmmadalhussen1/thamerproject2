# app/schemas/SubscriptionPlan.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SubscriptionPlanResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price: float
    duration_days: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime]
