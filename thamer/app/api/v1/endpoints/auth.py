# app/api/v1/endpoints/auth.py
import logging
from datetime import datetime, timedelta
from sqlalchemy.exc import SQLAlchemyError
import hmac
from app.api.dependencies.auth import get_current_user
from app.schemas.auth import (
    SignUpRequest,
    LoginRequest,
    TokenResponse,
    OTPVerificationRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.services.otp_service import can_request_otp, send_otp_to_user
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.auth import *
from app.core.db import get_session
from app.services.user_service import UserService
from app.models.user import User, UserRole
from app.services.email_service import EmailService
from app.core.security import generate_otp, verify_password, create_access_token, hash_password
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import text

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/db-test")
async def db_test(session: AsyncSession = Depends(get_session)):
    """
    Test database connectivity with a simple query.
    """
    try:
        # Execute the raw SQL query
        result = await session.execute(text("SELECT 1"))  # Use text() for raw SQL

        # Fetch one row as a tuple
        row = result.fetchone()  # Fetch one row

        # Extract the first column from the row
        if row is not None:
            scalar_result = row[0]  # First column of the result
        else:
            scalar_result = None  # No rows returned

        return {"status": "success", "result": scalar_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")




@router.post("/signup", response_model=dict)
async def signup(
    request: SignUpRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    try:
        # Check if the email already exists
        stmt = select(User).where(User.email == request.email)
        result = await session.execute(stmt)
        existing_user = result.scalars().first()

        if existing_user:
            raise HTTPException(status_code=400, detail="Email is already registered.")

        
        # Restrict admin role creation
        if request.role == UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Admin signup is not allowed.")

        # Create and save the user
        new_user = User(
            first_name=request.first_name,
            last_name=request.last_name,
            phone_number=request.phone_number,
            company_name=request.company_name,
            email=request.email,
            hashed_password=hash_password(request.password),
            role=request.role,
        )
        session.add(new_user)
        await session.commit()
        await session.refresh(new_user)

        # Send OTP
        await send_otp_to_user(new_user.email, background_tasks, session)
        logger.info(f"New user registered: {new_user.email}")
        return {"message": "Signup successful. Please verify your email using the OTP sent."}

    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=400, detail="A database error occurred.")
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")




@router.post("/login", response_model=TokenResponse)
async def login(
    client_request: Request,  # Non-default argument comes first
    request: LoginRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Endpoint for user login.
    """
    try:
        # Fetch user by email
        user = await UserService.get_user_by_email(session, request.email)
        if not user or not verify_password(request.password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Invalid email or password")

        # Check if user is verified
        if not user.is_verified:
            raise HTTPException(status_code=400, detail="User is not verified")

        # Check if user is active
        if not user.is_active:
            raise HTTPException(status_code=403, detail="User account is deactivated")
        
        # Update login details
        user.last_login = datetime.utcnow()
        user.last_login_ip = client_request.client.host
        await session.commit()

        # Define token expiration
        token_expiry_minutes = 30  # Example: 30 minutes
        token_expiry = datetime.utcnow() + timedelta(minutes=token_expiry_minutes)

        # Create the token
        access_token = create_access_token(
            {"sub": user.email, "role": user.role},
            expires_delta=timedelta(minutes=token_expiry_minutes),
        )

        logger.info(f"User logged in: {user.email}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_at": token_expiry.isoformat()  # Include token expiry
        }

    except HTTPException as e:
        logger.warning(f"Login failed: {e.detail}")
        raise e
    except SQLAlchemyError as e:
        logger.error(f"Database error during login: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")



@router.post("/send-otp")
async def send_otp(
    email: str,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    """
    Endpoint to send an OTP to the user.
    """
    try:
        user = await UserService.get_user_by_email(session, email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        await send_otp_to_user(email, background_tasks, session)
        logger.info(f"OTP sent to: {email}")
        return {"message": "OTP sent successfully"}

    except HTTPException as e:
        logger.warning(f"Failed to send OTP: {e.detail}")
        raise e
    except SQLAlchemyError as e:
        logger.error(f"Database error during OTP sending: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    except Exception as e:
        logger.error(f"Unexpected error during OTP sending: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")



@router.post("/verify-otp")
async def verify_otp(
    request: OTPVerificationRequest, 
    background_tasks: BackgroundTasks, 
    session: AsyncSession = Depends(get_session)
):
    """
    Endpoint to verify an OTP.
    """
    try:
        # Validate the request
        if not request.otp:
            raise HTTPException(status_code=400, detail="OTP is required")

        # Fetch the user by email
        user = await UserService.get_user_by_email(session, request.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Verify the OTP
        if not UserService.verify_otp(user, request.otp):
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")

        # Mark user as verified and clear OTP fields
        user.is_verified = True
        user.otp = None
        user.otp_expiry = None
        await session.commit()

        # Send Welcome Email
        email_service = EmailService()
        email_service.send_email(
            to_email=user.email,
            subject="Welcome to Thamer!",
            template_name="welcome_email.html",
            context={
                "user": user,
                "app_name": "Thamer",
                "docs_link": "https://thamer.com/docs",
                "tutorials_link": "https://thamer.com/tutorials",
            },
            background_tasks=background_tasks,
        )
        logger.info(f"User verified: {user.email}")
        return {"message": "OTP verified successfully. Welcome email sent."}

    except HTTPException as e:
        logger.warning(f"OTP verification failed: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during OTP verification: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")




@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
):
    """
    Endpoint for forgot password.
    """
    try:
        user = await UserService.get_user_by_email(session, request.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not await can_request_otp(request.email, session):
            raise HTTPException(
                status_code=429, detail="Too many OTP requests. Try again later."
            )

        otp = generate_otp(request.email)
        user.reset_otp = otp
        user.reset_otp_expiry = datetime.utcnow() + timedelta(minutes=10)

        await session.commit()

        email_service = EmailService()
        email_service.send_email(
            to_email=request.email,
            subject="Password Reset Request",
            template_name="forgot_password_email.html",
            context={
                "user": user,
                "otp": otp,
                "app_name": "Thamer",
            },
            background_tasks=background_tasks,
        )

        logger.info(f"Password reset OTP sent to {request.email}.")
        return {"message": "Password reset OTP sent successfully"}

    except HTTPException as e:
        logger.warning(f"Forgot password failed: {e.detail}")
        raise e
    except SQLAlchemyError as e:
        logger.error(f"Database error during forgot password: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    except Exception as e:
        logger.error(f"Unexpected error during forgot password: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest, session: AsyncSession = Depends(get_session)
):
    """
    Endpoint to reset the password.
    """
    try:
        user = await UserService.get_user_by_email(session, request.email)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if not user.reset_otp or not user.reset_otp_expiry:
            raise HTTPException(
                status_code=400, detail="No OTP has been generated for this user"
            )
        if user.reset_otp_expiry < datetime.utcnow():
            raise HTTPException(status_code=400, detail="OTP has expired")
        if not hmac.compare_digest(user.reset_otp, request.otp):
            raise HTTPException(status_code=400, detail="Invalid OTP")

        user.hashed_password = hash_password(request.new_password)
        user.reset_otp = None
        user.reset_otp_expiry = None
        user.updated_at = datetime.utcnow()  # Update timestamp for audit

        await session.commit()

        logger.info(f"Password reset successfully for user {request.email}.")
        return {"message": "Password reset successfully"}

    except HTTPException as e:
        logger.warning(f"Reset password failed: {e.detail}")
        raise e
    except SQLAlchemyError as e:
        logger.error(f"Database error during reset password: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
    except Exception as e:
        logger.error(f"Unexpected error during reset password: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
    

@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    """
    Endpoint for logged-in users to change their password.
    """
    try:
        # Verify the current password
        if not verify_password(request.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect current password")

        # Ensure the new password is different from the old password
        if verify_password(request.new_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="New password cannot be the same as the current password")

        # Hash the new password and update it in the database
        current_user.hashed_password = hash_password(request.new_password)
        await session.commit()

        logger.info(f"Password changed successfully for user {current_user.email}")
        return {"message": "Password changed successfully"}

    except HTTPException as e:
        logger.warning(f"Change password failed for user {current_user.email}: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during password change for user {current_user.email}: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")