# app/core/security.py
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import random
import string
import time
import hashlib
import hmac
from app.core.config import settings

# Load sensitive information from the environment via Pydantic settings
SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
OTP_LENGTH = settings.OTP_LENGTH
OTP_EXPIRY_MINUTES = settings.OTP_EXPIRY_MINUTES
OTP_SECRET_KEY = settings.OTP_SECRET_KEY

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Password hashing functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# JWT token generation
def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# OTP generation
def generate_otp(identifier: str) -> str:
    """
    Generate a cryptographically secure OTP.
    Args:
        identifier (str): A unique user identifier (e.g., email).
    Returns:
        str: A securely generated OTP.
    """
    timestamp = int(time.time() / (OTP_EXPIRY_MINUTES * 60))  # Generate time-based window
    secret = f"{OTP_SECRET_KEY}{identifier}".encode()
    msg = f"{timestamp}".encode()
    
    # Generate HMAC hash
    digest = hmac.new(secret, msg, hashlib.sha256).digest()
    
    # Convert to a numeric OTP
    otp = int.from_bytes(digest, "big") % (10 ** OTP_LENGTH)
    return f"{otp:0{OTP_LENGTH}d}"


def verify_otp(identifier: str, otp: str) -> bool:
    """
    Verify if the OTP is valid.
    Args:
        identifier (str): A unique user identifier (e.g., email).
        otp (str): The OTP to validate.
    Returns:
        bool: True if valid, False otherwise.
    """
    expected_otp = generate_otp(identifier)
    return hmac.compare_digest(expected_otp, otp)