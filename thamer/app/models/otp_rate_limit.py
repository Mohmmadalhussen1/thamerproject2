# app/models/otp_rate_limit.py
from sqlmodel import SQLModel, Field
from datetime import datetime

class OTPRateLimit(SQLModel, table=True):
    identifier: str = Field(primary_key=True, max_length=255)  # Unique identifier (e.g., email)
    request_count: int = Field(default=0)  # Number of OTP requests
    last_request: datetime = Field(default_factory=datetime.utcnow)  # Timestamp of the last request
