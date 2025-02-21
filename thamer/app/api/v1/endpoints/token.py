# app/api/v1/endpoints/token.py
import datetime
from fastapi import APIRouter, Depends, HTTPException, Form, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import verify_password, create_access_token
from app.models.user import User
from app.core.db import get_session
from sqlalchemy.future import select

router = APIRouter()

@router.post("/token")
async def login_for_access_token(
    request: Request,  # Non-default argument comes first
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: AsyncSession = Depends(get_session),
):
    """
    Endpoint to authenticate a user and return a JWT token.
    """
    # Query user by email
    stmt = select(User).where(User.email == form_data.username)
    result = await session.execute(stmt)
    user = result.scalars().first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Update last login and IP address
    user.last_login = datetime.datetime.utcnow()
    user.last_login_ip = request.client.host
    await session.commit()

    # Create JWT token
    access_token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}
