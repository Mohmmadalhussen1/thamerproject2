# app/schemas/auth.py
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from app.models.user import UserRole


# Request schema for signup
class SignUpRequest(BaseModel):
    first_name: str = Field(..., max_length=50)
    last_name: str = Field(..., max_length=50)
    phone_number: str = Field(..., max_length=15, pattern=r"^\+?\d{8,18}$")  # Validate phone numbers
    company_name: str = Field(..., max_length=100)
    email: EmailStr
    password: str
    role: Optional[UserRole] = UserRole.USER # Default role is 'user'

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OTPVerificationRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    new_password: str
    otp: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: str


class CompanyRegistrationRequest(BaseModel):
    name: str
    email: EmailStr
    phone_number: str = Field(..., max_length=15, pattern=r"^\+?\d{10,15}$")
    cr: str
    website: Optional[str]
    local_score: float
    current_iktva_score: float
    last_year_iktva_score: float
    last_year_local_score: float
    description: Optional[str] = None
    awards: Optional[List[str]] = None
    sectors: Optional[List[str]] = None
    iktva_certificate: str  # Expected to be a file path or URL
    local_content_certificate: str  # Expected to be a file path or URL


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=6, description="Current password")
    new_password: str = Field(..., min_length=6, description="New password")