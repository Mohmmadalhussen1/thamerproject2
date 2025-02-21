# app/services/otp_service.py
from datetime import datetime, timedelta
from fastapi import HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.otp_rate_limit import OTPRateLimit
from app.core.security import generate_otp
from app.services.email_service import EmailService
from app.services.user_service import UserService

MAX_REQUESTS = 15  # Maximum OTP requests allowed per hour
RATE_LIMIT_WINDOW = timedelta(hours=1)  # Rate-limit window

async def can_request_otp(identifier: str, session: AsyncSession) -> bool:
    """
    Check if the user can request an OTP.
    Args:
        identifier (str): A unique user identifier (e.g., email).
        session (AsyncSession): The database session.
    Returns:
        bool: True if allowed, False if rate-limited.
    """
    stmt = select(OTPRateLimit).where(OTPRateLimit.identifier == identifier)
    result = await session.execute(stmt)
    otp_rate_limit = result.scalars().first()

    current_time = datetime.utcnow()

    if otp_rate_limit:
        time_since_last_request = current_time - otp_rate_limit.last_request

        if time_since_last_request < RATE_LIMIT_WINDOW and otp_rate_limit.request_count >= MAX_REQUESTS:
            return False  # Rate-limited

        if time_since_last_request >= RATE_LIMIT_WINDOW:
            # Reset counter if outside the rate-limit window
            otp_rate_limit.request_count = 0

        otp_rate_limit.request_count += 1
        otp_rate_limit.last_request = current_time
    else:
        # Create a new rate-limit record for the identifier
        otp_rate_limit = OTPRateLimit(
            identifier=identifier,
            request_count=1,
            last_request=current_time,
        )
        session.add(otp_rate_limit)

    await session.commit()
    return True

async def send_otp_to_user(email: str, background_tasks: BackgroundTasks, session: AsyncSession):
    """
    Generate and send OTP to the user.
    """
    # Fetch the user by email
    user = await UserService.get_user_by_email(session, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check rate limit for OTP requests
    if not await can_request_otp(email, session):
        raise HTTPException(status_code=429, detail="Too many OTP requests. Try again later.")

    # Generate OTP
    otp = generate_otp(email)
    user.otp = otp
    print("otp")
    print(otp)
    user.otp_expiry = datetime.utcnow() + timedelta(minutes=10)  # Set OTP expiry time

    # Commit changes to persist the OTP in the database
    await session.commit()

    # Send OTP email
    email_service = EmailService()
    email_service.send_email(
        to_email=email,
        subject="Your OTP Code",
        template_name="otp_email.html",  # Template to use
        context={
            "user": user,
            "purpose": "account verification",
            "otp": otp,
            "app_name": "Thamer",  # Your app name
        },
        background_tasks=background_tasks,
    )