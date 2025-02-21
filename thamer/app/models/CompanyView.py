# Ensure correct imports and relationships
from datetime import datetime
from typing import Optional
from sqlalchemy import Index
from sqlmodel import Field, Relationship, SQLModel

class CompanyView(SQLModel, table=True):
    __tablename__ = "company_views"

    id: int = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id", index=True)
    viewer_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)
    viewed_at: datetime = Field(default_factory=datetime.utcnow)

    # Use string references to prevent circular imports
    company: Optional["Company"] = Relationship(back_populates="views")
    viewer: Optional["User"] = Relationship(back_populates="company_views")

    __table_args__ = (
        Index("idx_company_views_company_id", "company_id"),
        Index("idx_company_views_viewer_id", "viewer_id"),
        Index("idx_company_views_viewed_at", "viewed_at"),
    )