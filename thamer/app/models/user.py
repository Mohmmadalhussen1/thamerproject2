# app/models/user.py
from sqlmodel import Relationship, SQLModel, Field
from typing import List, Optional
from enum import Enum
import datetime

# from app.models.Company import Company
# from app.models.Subscription import Subscription


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class User(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    first_name: str
    last_name: str
    phone_number: str
    company_name: str
    email: str = Field(unique=True, index=True)
    hashed_password: str
    role: UserRole = Field(default=UserRole.USER)
    otp: str = Field(default=None, nullable=True)
    otp_expiry: datetime.datetime = Field(default=None, nullable=True)
    reset_otp: str = Field(default=None, nullable=True)  # Field for password reset OTP
    reset_otp_expiry: datetime.datetime = Field(default=None, nullable=True)  # Expiry field for reset OTP
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    deleted_at: Optional[datetime.datetime] = Field(default=None)

    # Profile Picture URL
    profile_picture: Optional[str] = Field(default=None)

    # Last Login and IP Address Tracking
    last_login: Optional[datetime.datetime] = Field(default=None)
    last_login_ip: Optional[str] = Field(default=None)

    # Relationship to Subscription
    subscriptions: List["Subscription"] = Relationship(back_populates="user")

    # Relationship to Company (if needed)
    companies: List["Company"] = Relationship(back_populates="user")
    company_views: List["CompanyView"] = Relationship(back_populates="viewer")
    notifications: List["Notification"] = Relationship(back_populates="recipient")