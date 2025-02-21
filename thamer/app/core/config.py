# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Thamer"
    DATABASE_URL: str
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    OTP_EXPIRY_MINUTES: int
    OTP_SECRET_KEY: str
    OTP_LENGTH: int = 6

    EDFAPAY_MERCHANT_ID: str
    EDFAPAY_PASSWORD: str
    EDFAPAY_PAYMENT_URL: str
    EDFAPAY_CALLBACK_URL: str
    EDFAPAY_STATUS_URL:str

    API_BASE_URL:str


    class Config:
        env_file = "../.env"

settings = Settings()
