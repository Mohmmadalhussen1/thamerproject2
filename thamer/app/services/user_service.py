# app/services/user_service.py
from datetime import datetime
import hmac
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import User

class UserService:
    @staticmethod
    def create_user(session: AsyncSession, user: User) -> User:
        """
        Create a new user and persist it in the database.

        Args:
            session (AsyncSession): The database session.
            user (User): The user instance to be created.

        Returns:
            User: The created user object.
        """
        session.add(user)
        session.commit()
        session.refresh(user)
        return user

    @staticmethod
    def get_user(session: AsyncSession, user_id: int) -> User | None:
        """
        Retrieve a user by their ID.

        Args:
            session (AsyncSession): The database session.
            user_id (int): The user's ID.

        Returns:
            User | None: The user object if found, otherwise None.
        """
        return session.get(User, user_id)

    @staticmethod
    async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
        """
        Retrieve a user by their email address.

        Args:
            session (AsyncSession): The database session.
            email (str): The email address of the user.

        Returns:
            User | None: The user object if found, otherwise None.
        """
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        return result.scalars().first()

    @staticmethod
    def get_users(session: AsyncSession) -> list[User]:
        """
        Retrieve all users.

        Args:
            session (AsyncSession): The database session.

        Returns:
            list[User]: A list of user objects.
        """
        statement = select(User)
        return session.exec(statement).all()
    
    @staticmethod
    def verify_otp(user: User, otp: str) -> bool:
        """
        Verify the OTP for a user.

        Args:
            user (User): The user object containing OTP and expiry.
            otp (str): The OTP to verify.

        Returns:
            bool: True if the OTP is valid and not expired, False otherwise.
        """
        if not user.otp:
            raise HTTPException(status_code=400, detail="No OTP has been generated for this user")

        if user.otp_expiry < datetime.utcnow():
            raise HTTPException(status_code=400, detail="OTP has expired")

        if not hmac.compare_digest(user.otp, otp):
            raise HTTPException(status_code=400, detail="OTP does not match")

        return True