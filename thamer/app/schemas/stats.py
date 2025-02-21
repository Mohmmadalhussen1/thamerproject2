from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


# -------------------------------
# 📊 Company Performance Schema
# -------------------------------
class CompanyPerformance(BaseModel):
    score_trend: Dict[int, float] = Field(..., example={2021: 75, 2022: 80, 2023: 85})


# -------------------------------
# 📈 Engagement Stats Schema
# -------------------------------
class EngagementStats(BaseModel):
    total_views: int = Field(..., example=150)
    view_trend: Dict[str, int] = Field(..., example={"2023-10": 50, "2023-11": 100})


# -------------------------------
# 📊 Per Company Stats
# -------------------------------
class CompanyStatsResponse(BaseModel):
    company_id: int = Field(..., example=1)
    company_name: str = Field(..., example="TechCorp")
    total_views: int = Field(..., example=500)
    monthly_views: Dict[str, int] = Field(..., example={"2024-08": 100, "2024-09": 120})
    performance_trend: Dict[int, float] = Field(..., example={2022: 78.0, 2023: 81.5})



class SubscriptionStats(BaseModel):
    plan_name: str = Field(..., example="Pro Plan")
    renewal_date: Optional[datetime] = None


# -------------------------------
# 📊 Final API Response Schema
# -------------------------------
class UserStatsResponse(BaseModel):
    profile_summary: Dict[str, int] = Field(..., example={"total_companies": 5, "approved_companies": 3})
    engagement: EngagementStats
    subscription: Optional[SubscriptionStats]
    performance: CompanyPerformance
    top_viewers: List[Dict[str, str]]
    company_stats: List[CompanyStatsResponse]
    