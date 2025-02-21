# app/schemas/company.py
from pydantic import BaseModel, Field, HttpUrl, EmailStr, validator
from typing import List, Optional
from datetime import datetime
from app.schemas.common import PaginationBase


class ScoreInput(BaseModel):
    """
    Schema for input scores during company registration or update.
    """
    year: int = Field(..., description="Year of the score")
    score: float = Field(..., gt=0, lt=100, description="Score value (must be between 0 and 100)")
    score_type: str = Field(..., description="Type of score (e.g., local)")
    file_key: str = Field(..., description="S3 object key for the score file")

    class Config:
        schema_extra = {
            "example": {
                "year": 2023,
                "score": 85.0,
                "score_type": "local",
                "file_key": "scores/12345/file.pdf",
            }
        }


class CompanyInput(BaseModel):
    """
    Schema for input data during company registration or update.
    """
    name: str = Field(..., description="Company name")
    email: EmailStr = Field(..., description="Company email address")
    phone_number: str = Field(..., description="Company phone number")
    cr: str = Field(..., description="Company registration number")
    website: Optional[HttpUrl] = Field(None, description="Company website URL")
    description: Optional[str] = Field(None, description="Company description")
    tagline: Optional[str] = Field(None, description="Company tagline")
    linkedin: Optional[HttpUrl] = Field(None, description="LinkedIn profile URL")
    facebook: Optional[HttpUrl] = Field(None, description="Facebook page URL")
    twitter: Optional[HttpUrl] = Field(None, description="Twitter handle URL")
    instagram: Optional[HttpUrl] = Field(None, description="Instagram page URL")
    logo_key: Optional[str] = Field(None, description="S3 key for the company logo")
    awards: Optional[List[str]] = Field(None, description="List of awards")
    sectors: Optional[List[str]] = Field(None, description="Sectors the company operates in")
    scores: Optional[List[ScoreInput]] = Field(None, description="List of associated scores")

    class Config:
        schema_extra = {
            "example": {
                "name": "Example Company",
                "email": "info@example.com",
                "phone_number": "+123456789",
                "cr": "CR123456",
                "website": "https://example.com",
                "description": "An example company",
                "tagline": "Innovation at its best",
                "linkedin": "https://linkedin.com/company/example",
                "facebook": "https://facebook.com/example",
                "twitter": "https://twitter.com/example",
                "instagram": "https://instagram.com/example",
                "logo_key": "logos/example_logo.jpg",
                "awards": ["Best Startup 2023"],
                "sectors": ["Technology", "Education"],
                "scores": [
                    {
                        "year": 2023,
                        "score": 95.0,
                        "score_type": "local",
                        "file_key": "scores/12345/file.pdf",
                    }
                ],
            }
        }


class FileResponse(BaseModel):
    """
    Schema for file details including pre-signed URL and object key.
    """
    url: Optional[str] = None
    key: Optional[str] = None

class ScoreResponse(BaseModel):
    """
    Schema for output scores when returning company data.
    """
    id: int
    year: int
    score: float
    score_type: str
    file: Optional[FileResponse]

    class Config:
        orm_mode = True


class CompanyResponse(BaseModel):
    """
    Schema for output company data with related scores.
    """
    id: int
    name: str
    email: EmailStr
    phone_number: str
    cr: str
    website: Optional[HttpUrl]
    description: Optional[str]
    tagline: Optional[str]
    linkedin: Optional[HttpUrl]
    facebook: Optional[HttpUrl]
    twitter: Optional[HttpUrl]
    instagram: Optional[HttpUrl]
    logo: Optional[FileResponse]
    awards: Optional[List[str]]
    sectors: Optional[List[str]]
    created_at: datetime
    last_updated: datetime
    scores: List[ScoreResponse] = []

    # **Fix: Add missing fields**
    status: str  # Ensure company status is included
    rejection_reason: Optional[str]  # Include rejection reason if applicable

    class Config:
        orm_mode = True


class PendingCompanyResponse(BaseModel):
    """
    Schema for output of pending companies for admin review.
    """
    id: int
    name: str
    email: EmailStr
    phone_number: str
    cr: str
    website: Optional[HttpUrl]
    description: Optional[str]
    tagline: Optional[str]
    linkedin: Optional[HttpUrl]
    facebook: Optional[HttpUrl]
    twitter: Optional[HttpUrl]
    instagram: Optional[HttpUrl]
    logo: Optional[str]
    awards: Optional[List[str]]
    sectors: Optional[List[str]]
    created_at: datetime
    last_updated: datetime
    scores: Optional[List[ScoreResponse]] = []

    # **Fix: Add missing fields**
    status: str  # Ensure company status is included
    rejection_reason: Optional[str]  # Include rejection reason if applicable

    class Config:
        orm_mode = True


class GetAllCompaniesResponse(PaginationBase[PendingCompanyResponse]):
    company_details:List[PendingCompanyResponse]


class CompanyScoreResponse(BaseModel):
    """
    Schema for returning a company score along with its associated company details.
    """
    id: int
    year: int
    score: float
    score_type: str
    file_url: Optional[str] = None  # Pre-signed URL for the score file
    company: CompanyResponse  # Associated company details

    class Config:
        from_attributes = True  # Enables ORM compatibility


class CompanyScorePaginationResponse(BaseModel):
    """
    Paginated response schema for companies with scores.
    """
    total: int  # Total number of matching companies
    page: int  # Current page number
    page_size: int  # Number of items per page
    total_pages: int  # Total number of pages
    data: List[CompanyResponse]  # List of companies with scores

    class Config:
        from_attributes = True

class CompanyUpdateValidator(BaseModel):
    email: Optional[EmailStr] = None
    website: Optional[HttpUrl] = None
    linkedin: Optional[HttpUrl] = None
    facebook: Optional[HttpUrl] = None
    twitter: Optional[HttpUrl] = None
    instagram: Optional[HttpUrl] = None