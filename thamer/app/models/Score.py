# app/models/Score.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional

class Score(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    company_id: int = Field(foreign_key="company.id")
    year: int = Field(..., description="The year for the score.")
    score: float = Field(..., description="Score value (e.g., local or IKTVA score).")
    score_type: str = Field(..., description="Type of score (e.g., 'local' or 'iktva').")
    file: Optional[str] = Field(default=None, description="Path or URL to the score certificate.")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of record creation.")

    company: Optional["Company"] = Relationship(back_populates="scores")
