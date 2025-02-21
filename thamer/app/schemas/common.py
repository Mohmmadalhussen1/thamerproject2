# app/schemas/common.py
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import List, Optional, TypeVar, Generic

from app.models.Notification import NotificationType

# Step 1: Create a generic PaginationBase class
T = TypeVar('T')  # Type variable for generic pagination class

class PaginationBase(BaseModel, Generic[T]):
    total: int
    page: int
    page_size: int
    total_pages: int


class ViewStatisticsResponse(BaseModel):
    total_views: int
    views_last_7_days: int
    views_last_30_days: int
    anonymous_views: int
    authenticated_views: int


class ViewerDetail(BaseModel):
    viewer_id: Optional[int]
    viewer_name: Optional[str]
    viewer_email: Optional[str]
    viewed_at: datetime
    profile_picture: Optional[str]
    company_name: Optional[str]


class PaginatedViewersResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ViewerDetail]


class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: NotificationType
    is_read: bool
    created_at: datetime

class PaginatedNotificationsResponse(BaseModel):
    total: int
    unread_count: int
    page: int
    page_size: int
    items: List[NotificationResponse]


class EmailValidator(BaseModel):
    email: EmailStr 