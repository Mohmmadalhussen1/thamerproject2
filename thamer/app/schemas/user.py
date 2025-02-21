# app/schemas/user.py

from app.schemas.common import PaginationBase
from pydantic import BaseModel, EmailStr
from typing import List
import datetime
from enum import Enum


# Enum for User roles
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"


class UserResponse(BaseModel):
    """
    Schema for user response.
    This schema is used for representing individual user details.
    """
    id: int
    name: str
    email: EmailStr
    phone: str
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime.datetime

    class Config:
        schema_extra = {
            "example": {
                "id": 1,
                "name": "John Doe",
                "email": "john.doe@example.com",
                "phone": "+1234567890",
                "role": "user",
                "is_active": True,
                "is_verified": False,
                "created_at": "2025-01-21T18:09:00",
            }
        }


class UserPaginationResponse(PaginationBase[UserResponse]):
    data: List[UserResponse]