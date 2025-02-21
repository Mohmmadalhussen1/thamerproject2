# app/models/Notification.py
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional
from enum import Enum

class NotificationType(str, Enum):
    GENERAL = "GENERAL"
    COMMENT = "COMMENT"
    MESSAGE = "MESSAGE"
    SYSTEM = "SYSTEM"
    VIEW = "VIEW"
    ALERT = "ALERT"
    FOLLOW = "FOLLOW"
    OTHER = "OTHER"

class Notification(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    recipient_id: int = Field(foreign_key="user.id")  # The user receiving the notification
    title: str = Field(..., description="Notification title")
    message: str = Field(..., description="Notification content")
    type: NotificationType = Field(default=NotificationType.GENERAL, description="Type of notification")
    is_read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    recipient: Optional["User"] = Relationship(back_populates="notifications")

