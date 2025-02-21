# app/models/Company.py
from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy import Integer, String, Column
from datetime import datetime
from typing import Optional, List

from app.models.CompanyView import CompanyView
from app.models.user import User
from app.models.Score import Score

from sqlalchemy.orm import column_property
from sqlalchemy import select, func

class Company(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str
    email: str
    phone_number: str
    cr: str  # Company registration number
    website: Optional[str] = Field(default=None)
    description: Optional[str] = Field(default=None)

    # New fields
    logo: Optional[str] = Field(default=None, description="Path or URL to the company's logo.")
    tagline: Optional[str] = Field(default=None, max_length=255, description="Tagline or slogan of the company.")
    linkedin: Optional[str] = Field(default=None, description="Company's LinkedIn profile URL.")
    facebook: Optional[str] = Field(default=None, description="Company's Facebook page URL.")
    twitter: Optional[str] = Field(default=None, description="Company's Twitter handle URL.")
    instagram: Optional[str] = Field(default=None, description="Company's Instagram page URL.")
    last_updated: datetime = Field(default_factory=datetime.utcnow, description="Last updated timestamp.")


    # Use ARRAY(String) for awards and sectors
    awards: Optional[List[str]] = Field(
        sa_column=Column(ARRAY(String))  # Explicitly use String as the subtype
    )
    sectors: Optional[List[str]] = Field(
        sa_column=Column(ARRAY(String))  # Explicitly use String as the subtype
    )

    # Enhanced status field
    status: str = Field(default="pending", description="Status of the company profile (e.g., pending, approved).")  # e.g., pending, approved, rejected, deleted

    rejection_reason: Optional[str] = Field(default=None)  # Optional rejection reason
    user_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional["User"] = Relationship(back_populates="companies")
    scores: list["Score"] = Relationship(back_populates="company")
    views: list["CompanyView"] = Relationship(back_populates="company")

    # Correct the view_count column_property to reference the Company's id correctly
    view_count: int = Field(
        sa_column=Column(
            Integer,
            server_default="0",
            nullable=False
        )
    )
