# File: app/api/dependencies/auth.py
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.models.user import User
from app.core.db import get_session
from app.core.security import SECRET_KEY, ALGORITHM

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
):
    """
    Dependency to extract and verify the current user from the Bearer token.
    """
    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    # Fetch the user from the database
    stmt = select(User).where(User.email == email)
    result = await session.execute(stmt)
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user


async def get_current_user_optional(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
):
    """
    Returns the current user if authenticated, otherwise returns None.
    Used for APIs where authentication is optional (e.g., viewing company details).
    """
    if not token:  # Allow anonymous users
        return None

    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None  # Treat as unauthenticated instead of raising an error
    except JWTError:
        return None  # Invalid token → treat as anonymous user

    # Fetch the user from the database
    stmt = select(User).where(User.email == email)
    result = await session.execute(stmt)
    user = result.scalars().first()
    
    return user  # May return None if the user is not found


async def get_admin_user(
    current_user: User = Depends(get_current_user),
):
    """
    Ensure the current user is an admin.
    """
    if current_user.role.lower() != "admin":  # Adjust this based on your user role system
        raise HTTPException(status_code=403, detail="Admin access required.")
    
    return current_user