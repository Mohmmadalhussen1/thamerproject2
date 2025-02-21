# app/api/v1/endpoints/user.py
from datetime import datetime, timedelta
import json
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, UploadFile, File, Form
from pydantic import EmailStr, HttpUrl, ValidationError
from sqlalchemy import case, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Score
from app.models.Notification import Notification
from app.models.CompanyView import CompanyView
from app.models.Company import Company
from app.models.Subscription import Subscription, SubscriptionStatus
from app.models.payment import Payment
from app.models.user import User
from app.core.db import get_session
from app.api.dependencies.auth import get_current_user, get_current_user_optional  # Import your dependency
from app.schemas.common import EmailValidator, NotificationResponse, PaginatedNotificationsResponse, PaginatedViewersResponse, ViewStatisticsResponse, ViewerDetail
from app.schemas.company import CompanyInput, CompanyResponse, CompanyScorePaginationResponse, CompanyUpdateValidator, FileResponse, ScoreResponse
from app.schemas.stats import CompanyPerformance, CompanyStatsResponse, EngagementStats, UserStatsResponse
from app.services.subscription_service import get_subscription_stats, is_subscription_active
from botocore.exceptions import ClientError
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
from sqlalchemy.orm import joinedload
import botocore.exceptions
import boto3
import logging
import os


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
router = APIRouter()

# AWS S3 Configuration
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
S3_REGION = os.getenv("S3_REGION", "me-south-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")


if not all([S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY]):
    raise ValueError("Missing required AWS S3 credentials in environment variables.")


s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=S3_REGION,
    endpoint_url=f"https://s3.{S3_REGION}.amazonaws.com",
)

def generate_presigned_url(object_key: str, expiration: int = 3600) -> str:
    """
    Generate a pre-signed URL for an S3 object.
    :param object_key: S3 object key (e.g., profile_pictures/25/6.jpg)
    :param expiration: URL expiration time in seconds (default: 3600)
    :return: Pre-signed URL as a string
    """
    try:
        return s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET_NAME, "Key": object_key},
            ExpiresIn=expiration,
        )
    except ClientError as e:
        logger.error(f"Failed to generate pre-signed URL for {object_key}: {e}")
        raise HTTPException(status_code=500, detail="Error generating pre-signed URL.")

    

def generate_presigned_url_with_lstrip(object_key: str, expiration: int = 3600) -> str:
    """
    Generate a pre-signed URL for an S3 object.
    :param object_key: S3 object key or full URL.
    :param expiration: URL expiration time in seconds (default: 3600).
    :return: Pre-signed URL as a string.
    """
    try:
        # Extract object key if a full URL is provided
        if object_key.startswith("http"):
            parsed_url = urlparse(object_key)
            object_key = parsed_url.path.lstrip("/")

        # Generate the pre-signed URL
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET_NAME, "Key": object_key},
            ExpiresIn=expiration,
        )
        return url
    except botocore.exceptions.ClientError as e:
        logger.error(f"Failed to generate pre-signed URL for {object_key}: {e}")
        raise HTTPException(status_code=500, detail="Error generating pre-signed URL.")


def extract_object_key(full_url: str) -> str:
    """
    Extract the S3 object key from a full S3 URL.
    :param full_url: Full S3 URL (e.g., https://bucket-name.s3.region.amazonaws.com/key)
    :return: Object key (e.g., key)
    """
    parsed_url = urlparse(full_url)
    # The path part of the URL contains the object key, remove the leading "/"
    return parsed_url.path.lstrip("/")


def validate_s3_object_exists(object_key: str):
    """
    Validate if an object exists in S3.
    :param object_key: S3 object key
    :raises HTTPException: If object does not exist
    """
    try:
        s3_client.head_object(Bucket=S3_BUCKET_NAME, Key=object_key)
    except ClientError as e:
        if e.response["Error"]["Code"] == "404":
            raise HTTPException(status_code=404, detail=f"File {object_key} not found in S3.")
        logger.error(f"Error checking S3 object existence for {object_key}: {e}")
        raise HTTPException(status_code=500, detail="Error checking file existence.")


@router.post("/generate-presigned-url", response_model=dict)
async def generate_presigned_upload_url(
    file_name: str = Form(..., description="Name of the file to be uploaded."),
    file_type: str = Form(..., description="MIME type of the file (e.g., image/png, application/pdf)."),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a pre-signed URL for file upload to S3.
    """
    try:
        file_key = f"uploads/{current_user.id}/{file_name}"
        logger.info(f"Generating pre-signed upload URL for user {current_user.email}, file: {file_name}")

        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={"Bucket": S3_BUCKET_NAME, "Key": file_key, "ContentType": file_type},
            ExpiresIn=3600,
        )
        return {"url": presigned_url, "key": file_key}
    except ClientError as e:
        logger.error(f"Failed to generate pre-signed upload URL: {e}")
        raise HTTPException(status_code=500, detail="Error generating pre-signed URL.")


@router.post("/generate-profile-picture-presigned-url", response_model=dict)
async def generate_profile_picture_presigned_url(
    file_name: str = Form(..., description="Name of the profile picture to be uploaded."),
    file_type: str = Form(..., description="MIME type of the file (e.g., image/png, image/jpeg)."),
    current_user: User = Depends(get_current_user),
):
    """
    Generate a pre-signed URL for uploading a profile picture.
    """
    try:
        logger.info(f"Generating pre-signed URL for profile picture upload for user {current_user.email}")

        # Generate a unique file path for the profile picture
        file_key = f"profile_pictures/{current_user.id}/{file_name}"

        # Generate pre-signed URL for PUT operation
        presigned_url = s3_client.generate_presigned_url(
            "put_object",
            Params={"Bucket": S3_BUCKET_NAME, "Key": file_key, "ContentType": file_type},
            ExpiresIn=3600,
        )

        return {"url": presigned_url, "key": file_key}

    except botocore.exceptions.ClientError as e:
        logger.error(f"Failed to generate pre-signed URL for profile picture: {e}")
        raise HTTPException(status_code=500, detail="Error generating pre-signed URL for profile picture.")



@router.post("/register-company", response_model=dict)
async def register_company(
    company: CompanyInput,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Register a new company with optional scores and associated details.
    """
    try:
        logger.info(f"User {current_user.email} is registering a company with CR: {company.cr}")

        # Check if the company already exists
        async with session.begin_nested():
            existing_company = await session.execute(
                select(Company).where(Company.cr == company.cr)
            )
            if existing_company.scalars().first():
                logger.warning(f"Company with CR {company.cr} already exists for user {current_user.email}.")
                raise HTTPException(
                    status_code=400,
                    detail=f"A company with CR {company.cr} already exists.",
                )
            
            # Validate email format
            try:
                valid_email = EmailValidator(email=company.email).email  # ✅ Correct way
            except ValidationError as e:
                logger.error(f"Invalid email provided: {company.email}")
                raise HTTPException(status_code=400, detail="Invalid email format.")


            # Validate URLs (set to None if invalid)
            def validate_url(url):
                try:
                    return str(HttpUrl(url)) if url else None
                except ValidationError:
                    return None

            # Convert HttpUrl fields to strings
            website = validate_url(company.website)
            linkedin = validate_url(company.linkedin)
            facebook = validate_url(company.facebook)
            twitter = validate_url(company.twitter)
            instagram = validate_url(company.instagram)

            # Create a new company instance
            new_company = Company(
                name=company.name,
                email=valid_email,
                phone_number=company.phone_number,
                cr=company.cr,
                website=website,
                description=company.description,
                tagline=company.tagline,
                linkedin=linkedin,
                facebook=facebook,
                twitter=twitter,
                instagram=instagram,
                logo=company.logo_key,
                awards=company.awards,
                sectors=company.sectors,
                user_id=current_user.id,
                last_updated=datetime.utcnow(),
            )
            session.add(new_company)
            await session.flush()  # Retrieve the new company's ID

            # Process scores (unchanged)
            score_details = []
            if company.scores:
                for score in company.scores:
                    try:
                        validate_s3_object_exists(score.file_key)
                    except HTTPException as e:
                        logger.error(f"Score file validation failed for key {score.file_key}: {e.detail}")
                        raise HTTPException(
                            status_code=400,
                            detail=f"Score file validation failed: {e.detail}",
                        )

                    # Add score to database
                    new_score = Score(
                        company_id=new_company.id,
                        year=score.year,
                        score=score.score,
                        score_type=score.score_type,
                        file=score.file_key,
                    )
                    session.add(new_score)

                    # Generate a pre-signed URL for the score file
                    presigned_url = generate_presigned_url(score.file_key)
                    score_details.append({
                        "id": new_score.id,
                        "year": score.year,
                        "score": score.score,
                        "score_type": score.score_type,
                        "file": presigned_url,
                    })

            # Generate pre-signed URL for the logo
            logo_url = generate_presigned_url(company.logo_key) if company.logo_key else None

            await session.commit()

        logger.info(f"Company {company.name} registered successfully by user {current_user.email}.")
        return {
            "message": "Company registered successfully.",
            "company": {
                "id": new_company.id,
                "name": new_company.name,
                "email": new_company.email,
                "phone_number": new_company.phone_number,
                "cr": new_company.cr,
                "website": new_company.website,
                "description": new_company.description,
                "tagline": new_company.tagline,
                "linkedin": new_company.linkedin,
                "facebook": new_company.facebook,
                "twitter": new_company.twitter,
                "instagram": new_company.instagram,
                "logo": logo_url,
                "awards": new_company.awards,
                "sectors": new_company.sectors,
                "created_at": new_company.created_at,
                "last_updated": new_company.last_updated,
                "scores": score_details,
            },
        }

    except HTTPException as http_err:
        logger.error(f"HTTPException during company registration: {http_err.detail}")
        raise http_err
    except Exception as e:
        logger.exception(f"Unexpected error during company registration for user {current_user.email}: {e}")
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during company registration.",
        )


@router.put("/update-profile-picture", response_model=dict)
async def update_profile_picture(
    file_key: str = Form(..., description="S3 key of the uploaded profile picture"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update the user's profile picture with the provided S3 file key.
    """
    try:
        # Validate that the file exists in S3 before updating the database
        validate_s3_object_exists(file_key)

        # Update the user's profile picture key in the database
        current_user.profile_picture = file_key
        await session.commit()

        # Generate a pre-signed URL for retrieving the profile picture
        profile_picture_url = generate_presigned_url(file_key)

        logger.info(f"Profile picture updated for user {current_user.email}.")
        return {
            "message": "Profile picture updated successfully.",
            "profile_picture_url": profile_picture_url,
        }
    except Exception as e:
        logger.error(f"Error updating profile picture for user {current_user.email}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")




@router.get("/me", response_model=dict)
async def get_user_details(current_user: User = Depends(get_current_user)):
    """
    Retrieve the details of the currently authenticated user.
    """
    profile_picture_url = None
    if current_user.profile_picture:
        try:
            # Generate pre-signed URL for the stored object key
            profile_picture_url = generate_presigned_url(current_user.profile_picture)
        except Exception as e:
            logger.error(f"Failed to generate pre-signed URL for profile picture of user {current_user.email}: {e}")

    return {
        "id": current_user.id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "phone_number": current_user.phone_number,
        "company_name": current_user.company_name,
        "profile_picture": profile_picture_url,
        "last_login": current_user.last_login,
        "last_login_ip": current_user.last_login_ip,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at,
    }



@router.put("/update-profile", response_model=dict)
async def update_profile(
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    company_name: Optional[str] = Form(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update the profile details of the current user and return updated data.
    """
    try:
        # Update fields if provided
        current_user.first_name = first_name or current_user.first_name
        current_user.last_name = last_name or current_user.last_name
        current_user.phone_number = phone_number or current_user.phone_number
        current_user.company_name = company_name or current_user.company_name

        # Update the `updated_at` timestamp
        current_user.updated_at = datetime.utcnow()

        # Commit changes to the database
        await session.commit()

        logger.info(f"User profile updated for {current_user.email}.")

        # Return the updated profile data
        return {
            "id": current_user.id,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "email": current_user.email,
            "phone_number": current_user.phone_number,
            "company_name": current_user.company_name,
            "last_login": current_user.last_login,
            "last_login_ip": current_user.last_login_ip,
            "is_active": current_user.is_active,
            "is_verified": current_user.is_verified,
            "created_at": current_user.created_at,
            "updated_at": current_user.updated_at,
        }

    except Exception as e:
        logger.error(f"Error updating profile for user {current_user.email}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")



@router.get("/companies-with-scores", response_model=CompanyScorePaginationResponse)
async def get_companies_with_scores(
    score_type: Optional[str] = Query(None),
    min_year: Optional[int] = Query(None),
    max_year: Optional[int] = Query(None),
    sectors: Optional[List[str]] = Query(None),
    company_name: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all companies along with their associated scores, with pagination and optional filtering.
    """

    try:
        # Validate subscription
        if not await is_subscription_active(current_user, session):
            raise HTTPException(
                status_code=403,
                detail="Subscription required to access company scores"
            )

        # Base query: Select companies and join with scores
        # base_query = select(Company).options(joinedload(Company.scores))
        base_query = select(Company).where(Company.status == "approved").options(joinedload(Company.scores))

        # Apply filters
        if sectors:
            base_query = base_query.where(Company.sectors.overlap(sectors))
        if company_name:
            base_query = base_query.where(Company.name.ilike(f"%{company_name}%"))
        if score_type or min_year or max_year:
            base_query = base_query.join(Score)
            if score_type:
                base_query = base_query.where(Score.score_type == score_type)
            if min_year:
                base_query = base_query.where(Score.year >= min_year)
            if max_year:
                base_query = base_query.where(Score.year <= max_year)

        # Get total count
        count_query = select(func.count()).select_from(base_query.subquery())
        total_result = await session.execute(count_query)
        total = total_result.scalar_one_or_none() or 0

        # Calculate pagination
        total_pages = max(1, (total + page_size - 1) // page_size)
        offset = (page - 1) * page_size

        # Get paginated results
        paginated_query = base_query.offset(offset).limit(page_size)
        result = await session.execute(paginated_query)
        companies = result.unique().scalars().all()

        # Prepare response data
        data = []
        for company in companies:
            company_scores = [
                ScoreResponse(
                    id=score.id,
                    year=score.year,
                    score=score.score,
                    score_type=score.score_type,
                    file=FileResponse(  # Convert file into a valid FileResponse object
                        url=generate_presigned_url_with_lstrip(score.file) if score.file else None,
                        key=score.file if score.file else None,
                    )
                )
                for score in company.scores
            ]

            company_data = CompanyResponse(
                id=company.id,
                name=company.name,
                email=company.email,
                phone_number=company.phone_number,
                cr=company.cr,
                website=company.website,
                description=company.description,
                tagline=company.tagline,
                linkedin=company.linkedin,
                facebook=company.facebook,
                twitter=company.twitter,
                instagram=company.instagram,
                logo=FileResponse(  # Convert logo into a FileResponse object
                    url=generate_presigned_url(company.logo) if company.logo else None,
                    key=company.logo if company.logo else None,
                ),
                awards=company.awards,
                sectors=company.sectors,
                created_at=company.created_at,
                last_updated=company.last_updated,
                status=company.status,  
                rejection_reason=company.rejection_reason,  
                scores=company_scores  # Include scores inside company details
            )

            data.append(company_data)

        return CompanyScorePaginationResponse(
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            data=data
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving companies with scores: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve companies with scores")


@router.get("/user/companies", response_model=List[CompanyResponse])
async def get_user_companies(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all companies registered by the current user, including scores with pre-signed links for files.
    """
    try:
        logger.info(f"Fetching companies for user {current_user.email}")

        # Fetch user-owned companies with associated scores
        stmt = select(Company).where(Company.user_id == current_user.id).options(joinedload(Company.scores))
        result = await session.execute(stmt)
        companies = result.unique().scalars().all()

        # Extract company names for logging
        company_names = [company.name for company in companies]
        logger.info(f"Found {len(companies)} companies for user {current_user.email}: {', '.join(company_names) or 'No Companies Found'}")


        # Explicitly map ORM models to Pydantic models
        response_data = [
            CompanyResponse(
                id=company.id,
                name=company.name,
                email=company.email,
                phone_number=company.phone_number,
                cr=company.cr,
                website=company.website,
                description=company.description,
                tagline=company.tagline,
                linkedin=company.linkedin,
                facebook=company.facebook,
                twitter=company.twitter,
                instagram=company.instagram,
                logo=FileResponse(
                    url=generate_presigned_url_with_lstrip(company.logo) if company.logo else None,
                    key=company.logo
                ) if company.logo else None,
                awards=company.awards,
                sectors=company.sectors,
                created_at=company.created_at,
                last_updated=company.last_updated,
                scores=[
                    ScoreResponse(
                        id=score.id,
                        year=score.year,
                        score=score.score,
                        score_type=score.score_type,
                        file=FileResponse(
                            url=generate_presigned_url_with_lstrip(score.file) if score.file else None,
                            key=score.file
                        ) if score.file else None
                    ) for score in company.scores
                ],
                status=company.status,  # Ensure company status is included
                rejection_reason=company.rejection_reason  # Include rejection reason if applicable
            ) for company in companies
        ]

        logger.info(f"Returning {len(response_data)} companies successfully for user {current_user.email}")
        return response_data

    except HTTPException as e:
        logger.error(f"HTTPException while fetching companies for user {current_user.email}: {e.detail}")
        raise e
    except Exception as e:
        logger.exception(f"Unexpected error fetching companies for user {current_user.email}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while retrieving companies.")


@router.get("/user/companies/{company_id}", response_model=CompanyResponse)
async def get_user_company_by_id(
    company_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve a single company registered by the current user, including scores, with pre-signed links for files.
    Access is restricted to:
      - The owner of the company
      - Active subscribers
    """
    try:
        logger.info(f"Fetching company {company_id} for user {current_user.email}")

        # Fetch the company and its scores
        stmt = (
            select(Company)
            .where(Company.id == company_id)
            .options(joinedload(Company.scores))
        )
        result = await session.execute(stmt)
        company = result.scalars().first()

        if not company:
            logger.warning(f"Company {company_id} not found for user {current_user.email}")
            raise HTTPException(status_code=404, detail="Company not found.")

        # Check if the user is the owner or has an active subscription
        if company.user_id != current_user.id:
            if not await is_subscription_active(current_user, session):
                logger.warning(f"Unauthorized access attempt to company {company_id} by user {current_user.email}")
                raise HTTPException(status_code=403, detail="Subscription required to view this company.")

        # Explicitly map ORM model to Pydantic schema (to ensure correct serialization)
        response_data = CompanyResponse(
            id=company.id,
            name=company.name,
            email=company.email,
            phone_number=company.phone_number,
            cr=company.cr,
            website=company.website,
            description=company.description,
            tagline=company.tagline,
            linkedin=company.linkedin,
            facebook=company.facebook,
            twitter=company.twitter,
            instagram=company.instagram,
            logo=FileResponse(
                url=generate_presigned_url_with_lstrip(company.logo) if company.logo else None,
                key=company.logo
            ) if company.logo else None,
            awards=company.awards,
            sectors=company.sectors,
            created_at=company.created_at,
            last_updated=company.last_updated,
            scores=[
                ScoreResponse(
                    id=score.id,
                    year=score.year,
                    score=score.score,
                    score_type=score.score_type,
                    file=FileResponse(
                        url=generate_presigned_url_with_lstrip(score.file) if score.file else None,
                        key=score.file
                    ) if score.file else None
                ) for score in company.scores
            ],
            status=company.status,  # Ensure company status is included
            rejection_reason=company.rejection_reason  # Include rejection reason if applicable
        )

        logger.info(f"Successfully fetched company '{company.name}' (ID {company.id}) for user {current_user.email}")
        return response_data

    except HTTPException as e:
        logger.error(f"HTTPException while fetching company {company_id} for user {current_user.email}: {e.detail}")
        raise e
    except Exception as e:
        logger.exception(f"Unexpected error fetching company {company_id} for user {current_user.email}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred while retrieving the company.")



@router.put("/user/companies/{company_id}", response_model=dict)
async def update_company(
    company_id: int,
    name: Optional[str] = Form(None, description="Updated company name"),
    email: Optional[EmailStr] = Form(None, description="Updated company email address"),
    phone_number: Optional[str] = Form(None, description="Updated company phone number"),
    cr: Optional[str] = Form(None, description="Updated company registration number"),
    website: Optional[str] = Form(None, description="Updated company website URL"),
    description: Optional[str] = Form(None, description="Updated company description"),
    tagline: Optional[str] = Form(None, description="Updated company tagline"),
    linkedin: Optional[str] = Form(None, description="Updated LinkedIn profile URL"),
    facebook: Optional[str] = Form(None, description="Updated Facebook page URL"),
    twitter: Optional[str] = Form(None, description="Updated Twitter handle URL"),
    instagram: Optional[str] = Form(None, description="Updated Instagram page URL"),
    logo_key: Optional[str] = Form(None, description="S3 key of the uploaded company logo"),
    awards: Optional[List[str]] = Form(None, description="Updated list of awards"),
    sectors: Optional[List[str]] = Form(None, description="Updated list of sectors"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing company registered by the current user.
    
    **Status Changes on Update:**
    - `"approved"` → **Changes to** `"re-evaluation"`
    - `"pending"` → **Remains** `"pending"`
    - `"rejected"` → **Changes to** `"revision-requested"`
    """
    try:
        logger.info(f"User {current_user.email} attempting to update company ID {company_id}.")

        # Fetch the company associated with the current user
        stmt = select(Company).where(Company.id == company_id, Company.user_id == current_user.id)
        result = await session.execute(stmt)
        company = result.scalars().first()

        if not company:
            logger.warning(f"Company ID {company_id} not found or unauthorized access by user {current_user.email}.")
            raise HTTPException(status_code=404, detail="Company not found or unauthorized access.")
        
        # Validate Email and URLs using Pydantic Model
        try:
            validated_data = CompanyUpdateValidator(
                email=email,
                website=website,
                linkedin=linkedin,
                facebook=facebook,
                twitter=twitter,
                instagram=instagram
            )
        except ValidationError as e:
            logger.error(f"Validation failed: {e.errors()}")
            raise HTTPException(status_code=400, detail="Invalid email or URL format. Ensure URLs include http:// or https://.")


        # Capture the old status before making changes
        old_status = company.status

        # Determine the new status
        if old_status == "approved":
            new_status = "re-evaluation"
        elif old_status == "rejected":
            new_status = "revision-requested"
        else:  # Keep "pending" unchanged
            new_status = old_status

        # Apply the status update **only if it has changed**
        if company.status != new_status:
            logger.info(f"Changing company ID {company_id} status from '{old_status}' to '{new_status}'")
            company.status = new_status

        # Update fields if provided
        company.name = name or company.name
        company.email = email or company.email
        company.phone_number = phone_number or company.phone_number
        company.cr = cr or company.cr
        company.website = website or company.website
        company.description = description or company.description
        company.tagline = tagline or company.tagline
        company.linkedin = linkedin or company.linkedin
        company.facebook = facebook or company.facebook
        company.twitter = twitter or company.twitter
        company.instagram = instagram or company.instagram
        company.awards = awards or company.awards
        company.sectors = sectors or company.sectors
        company.last_updated = datetime.utcnow()

        # Validate and update logo if provided
        if logo_key:
            validate_s3_object_exists(logo_key)  # Ensure file exists in S3
            company.logo = logo_key

        # **Ensure SQLAlchemy detects changes by explicitly adding the object**
        session.add(company)

        # Commit changes
        await session.commit()

        # Generate pre-signed URL for the updated logo
        logo_url = generate_presigned_url(logo_key) if logo_key else None

        logger.info(f"Company ID {company_id} updated successfully by user {current_user.email}. New status: {company.status}")
        return {
            "message": "Company updated successfully.",
            "company": {
                "id": company.id,
                "name": company.name,
                "email": company.email,
                "phone_number": company.phone_number,
                "cr": company.cr,
                "website": company.website,
                "description": company.description,
                "tagline": company.tagline,
                "linkedin": company.linkedin,
                "facebook": company.facebook,
                "twitter": company.twitter,
                "instagram": company.instagram,
                "logo": logo_url,  # Return pre-signed URL
                "awards": company.awards,
                "sectors": company.sectors,
                "status": company.status,  # Now properly updated
                "created_at": company.created_at,
                "last_updated": company.last_updated,
            },
        }

    except HTTPException as he:
        # Re-raise HTTPException (e.g., 404, 400) to return appropriate response
        raise he
    except Exception as e:
        logger.error(f"Error updating company ID {company_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.put("/user/companies/{company_id}/scores/{score_id}", response_model=dict)
async def update_score(
    company_id: int,
    score_id: int,
    year: Optional[int] = Form(None, description="Updated year of the score"),
    score: Optional[float] = Form(None, description="Updated score value"),
    score_type: Optional[str] = Form(None, description="Updated score type"),
    file_key: Optional[str] = Form(None, description="Updated S3 key for the score file"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Update an existing score for a company registered by the current user.
    
    **Status Changes on Score Update:**
    - `"approved"` → **Changes to** `"re-evaluation"`
    - `"pending"` → **Remains** `"pending"`
    - `"rejected"` → **Changes to** `"revision-requested"`
    """
    try:
        logger.info(f"User {current_user.email} attempting to update score ID {score_id} for company ID {company_id}.")

        # Fetch the company to ensure it belongs to the current user
        stmt = select(Company).where(Company.id == company_id, Company.user_id == current_user.id)
        result = await session.execute(stmt)
        company = result.scalars().first()

        if not company:
            logger.warning(f"Company ID {company_id} not found or unauthorized access by user {current_user.email}.")
            raise HTTPException(status_code=404, detail="Company not found or unauthorized access.")

        # Fetch the score to update
        stmt = select(Score).where(Score.id == score_id, Score.company_id == company_id)
        result = await session.execute(stmt)
        score_entry = result.scalars().first()

        if not score_entry:
            logger.warning(f"Score ID {score_id} not found for company ID {company_id}.")
            raise HTTPException(status_code=404, detail="Score not found.")

        # Capture the old company status before making changes
        old_status = company.status

        # Determine the new status after score update
        if old_status == "approved":
            new_status = "re-evaluation"
        elif old_status == "rejected":
            new_status = "revision-requested"
        else:
            new_status = old_status  # Keep "pending" unchanged

        # Update fields if provided
        score_entry.year = year or score_entry.year
        score_entry.score = score or score_entry.score
        score_entry.score_type = score_type or score_entry.score_type

        # Validate and update file if provided
        if file_key:
            validate_s3_object_exists(file_key)  # Ensure file exists in S3
            score_entry.file = file_key

        # **Ensure company status is updated**
        if company.status != new_status:
            logger.info(f"Changing company ID {company_id} status from '{old_status}' to '{new_status}'")
            company.status = new_status

        # Ensure SQLAlchemy detects changes by explicitly adding both objects
        session.add(score_entry)
        session.add(company)

        # Commit changes
        await session.commit()

        # Generate pre-signed URL for the updated file
        file_url = generate_presigned_url(file_key) if file_key else None

        logger.info(f"Score ID {score_id} updated successfully by user {current_user.email}. Company status updated to {company.status}.")
        return {
            "message": "Score updated successfully.",
            "score": {
                "id": score_entry.id,
                "year": score_entry.year,
                "score": score_entry.score,
                "score_type": score_entry.score_type,
                "file": file_url,  # Return pre-signed URL for updated file
            },
            "company": {
                "id": company.id,
                "status": company.status,  # Ensure updated status is returned
            },
        }

    except Exception as e:
        logger.error(f"Error updating score ID {score_id} for company ID {company_id}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


async def send_notification_background(
    user_id: int, 
    title: str, 
    message: str, 
    notification_type: str,  # Pass notification type explicitly
    session: AsyncSession
):
    """
    Send a notification asynchronously with a specific type.
    """
    try:
        # Ensure the session is active and commit manually
        new_notification = Notification(
            recipient_id=user_id,
            title=title,
            message=message,
            type=notification_type,  # Use an explicit field instead of `type`
            created_at=datetime.utcnow(),
        )
        session.add(new_notification)

        # Explicitly commit outside of session.begin()
        await session.commit()

        logger.info(f"Notification created for user {user_id}")
    
    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")


@router.post("/company/{company_id}/view", response_model=dict)
async def track_company_view(
    company_id: int,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user),
):
    """
    Track when a user views a company.
    """
    try:
        stmt = select(Company).where(Company.id == company_id)
        result = await session.execute(stmt)
        company = result.scalars().first()

        if not company:
            raise HTTPException(status_code=404, detail="Company not found.")

        # Avoid duplicate views in 1 hour
        recent_view_stmt = (
            select(CompanyView)
            .where(CompanyView.company_id == company_id)
            .where(CompanyView.viewer_id == current_user.id if current_user else None)
            .where(CompanyView.viewed_at > datetime.utcnow() - timedelta(hours=1))
        )
        recent_view = await session.execute(recent_view_stmt)
        if recent_view.scalars().first():
            return {"message": "View already recorded recently."}

        # Create new view entry
        new_view = CompanyView(
            company_id=company_id,
            viewer_id=current_user.id if current_user else None,
        )
        session.add(new_view)

        # Update view count in Company table
        company.view_count = (company.view_count or 0) + 1  

        await session.commit()

        # Use background task for notifications
        if current_user:
            background_tasks.add_task(send_notification_background, company.user_id, "New Company View", f"Your company '{company.name}' was viewed by {current_user.first_name}.", "VIEW", session)

        return {"message": "Company view recorded."}

    except Exception as e:
        logger.error(f"Error tracking company view: {e}")
        raise HTTPException(status_code=500, detail="Failed to track company view.")


@router.get("/companies/{company_id}/views/stats", response_model=ViewStatisticsResponse)
async def get_view_statistics(
    company_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get detailed view statistics for a company (Owner only)
    """
    try:
        # Validate company ownership
        company = await session.get(Company, company_id)
        if not company or company.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Company not found or unauthorized")

        # Base query
        base_query = select(CompanyView).where(CompanyView.company_id == company_id)

        # Total views
        total_views = await session.scalar(
            select(func.count()).select_from(base_query.subquery())
        )

        # Time-based views
        views_last_7_days = await session.scalar(
            select(func.count()).where(
                CompanyView.company_id == company_id,
                CompanyView.viewed_at >= datetime.utcnow() - timedelta(days=7)
            )
        )

        views_last_30_days = await session.scalar(
            select(func.count()).where(
                CompanyView.company_id == company_id,
                CompanyView.viewed_at >= datetime.utcnow() - timedelta(days=30)
            )
        )

        # Viewer type breakdown
        anonymous_views = await session.scalar(
            select(func.count()).where(
                CompanyView.company_id == company_id,
                CompanyView.viewer_id.is_(None)
            )
        )

        authenticated_views = await session.scalar(
            select(func.count()).where(
                CompanyView.company_id == company_id,
                CompanyView.viewer_id.is_not(None)
            )
        )

        return ViewStatisticsResponse(
            total_views=total_views or 0,
            views_last_7_days=views_last_7_days or 0,
            views_last_30_days=views_last_30_days or 0,
            anonymous_views=anonymous_views or 0,
            authenticated_views=authenticated_views or 0
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching view stats for company {company_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch view statistics")


@router.get("/companies/{company_id}/viewers", response_model=PaginatedViewersResponse)
async def get_company_viewers(
    company_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get paginated list of viewers for a company (Owner only)
    """
    try:
        # Validate company ownership
        company = await session.get(Company, company_id)
        if not company or company.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Company not found or unauthorized")

        # Total count
        total = await session.scalar(
            select(func.count()).where(CompanyView.company_id == company_id)
        )

        # Paginated query
        query = (
            select(CompanyView, User)
            .join(User, CompanyView.viewer_id == User.id, isouter=True)
            .where(CompanyView.company_id == company_id)
            .order_by(CompanyView.viewed_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        result = await session.execute(query)
        items = []

        for view, user in result.all():
            profile_picture = None
            if user and user.profile_picture:
                profile_picture = generate_presigned_url(user.profile_picture)

            items.append(ViewerDetail(
                viewer_id=view.viewer_id,
                viewer_name=f"{user.first_name} {user.last_name}" if user else "Anonymous",
                viewer_email=user.email if user else None,
                viewed_at=view.viewed_at,
                profile_picture=profile_picture,
                company_name=user.company_name
            ))

        return PaginatedViewersResponse(
            total=total or 0,
            page=page,
            page_size=page_size,
            items=items
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching viewers for company {company_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch viewers")


@router.get("/notifications", response_model=PaginatedNotificationsResponse)
async def get_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    read_status: Optional[bool] = Query(None),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Get paginated notifications for current user
    """
    try:
        # Base query
        logger.info(f"Fetching notifications for user_id: {current_user.id}")

        query = select(Notification).where(Notification.recipient_id == current_user.id)
        result = await session.execute(query)
        notifications = result.scalars().all()

        logger.info(f"Found {len(notifications)} notifications")

        # Filter by read status if provided
        if read_status is not None:
            query = query.where(Notification.is_read == read_status)

        # Total counts
        total = await session.scalar(
            select(func.count()).select_from(query.subquery())
        )

        unread_count = await session.scalar(
            select(func.count()).where(
                Notification.recipient_id == current_user.id,
                Notification.is_read == False
            )
        )

        # Paginated results
        notifications = await session.scalars(
            query.order_by(Notification.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )

        return PaginatedNotificationsResponse(
            total=total or 0,
            unread_count=unread_count or 0,
            page=page,
            page_size=page_size,
            items=[
                NotificationResponse(
                    id=n.id,
                    title=n.title,
                    message=n.message,
                    type=n.type,
                    is_read=n.is_read,
                    created_at=n.created_at
                ) for n in notifications
            ]
        )

    except Exception as e:
        logger.error(f"Error fetching notifications for user {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")
    

@router.get("/notifications/{notification_id}", response_model=dict)
async def get_single_notification(
    notification_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve details of a single notification along with sender's user details.
    """
    try:
        logger.info(f"Fetching notification {notification_id} for user_id: {current_user.id}")

        # Fetch notification along with sender (recipient) details
        stmt = (
            select(Notification, User)
            .join(User, User.id == Notification.recipient_id)  # Explicitly join User table
            .where(Notification.id == notification_id, Notification.recipient_id == current_user.id)
        )
        result = await session.execute(stmt)
        notification, sender = result.first() if result else (None, None)

        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found.")

        # Generate a pre-signed URL for the sender's profile picture (if available)
        sender_profile_picture = (
            generate_presigned_url(sender.profile_picture) if sender and sender.profile_picture else None
        )

        return {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,  
            "is_read": notification.is_read,
            "created_at": notification.created_at,
            "sender": {
                "id": sender.id if sender else None,
                "first_name": sender.first_name if sender else None,
                "last_name": sender.last_name if sender else None,
                "email": sender.email if sender else None,
                "profile_picture": sender_profile_picture,
                "company_name": sender.company_name if sender else None
            },
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error fetching notification {notification_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch notification details")


@router.post("/notifications/mark-read", response_model=dict)
async def mark_notifications_read(
    notification_ids: List[int],
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Mark multiple notifications as read
    """
    try:
        result = await session.execute(
            select(Notification)
            .where(
                Notification.id.in_(notification_ids),
                Notification.recipient_id == current_user.id
            )
        )
        notifications = result.scalars().all()

        if not notifications:
            raise HTTPException(status_code=404, detail="No notifications found")

        for notification in notifications:
            notification.is_read = True

        await session.commit()
        return {"message": f"Marked {len(notifications)} notifications as read"}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error marking notifications as read: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to mark notifications as read")

@router.delete("/notifications/{notification_id}", response_model=dict)
async def delete_notification(
    notification_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a specific notification
    """
    try:
        notification = await session.get(Notification, notification_id)
        if not notification or notification.recipient_id != current_user.id:
            raise HTTPException(status_code=404, detail="Notification not found")

        await session.delete(notification)
        await session.commit()
        return {"message": "Notification deleted successfully"}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting notification {notification_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete notification")

# region Background Task Handlers
async def send_view_notification(
    session: AsyncSession,
    company_id: int,
    viewer: Optional[User]
):
    """
    Background task to send view notification to company owner
    """
    try:
        company = await session.get(Company, company_id)
        if not company:
            return

        viewer_name = "Anonymous"
        if viewer:
            viewer_name = f"{viewer.first_name} {viewer.last_name}"

        notification = Notification(
            recipient_id=company.user_id,
            title="New Company View",
            message=f"Your company '{company.name}' was viewed by {viewer_name}",
            created_at=datetime.utcnow()
        )

        session.add(notification)
        await session.commit()
    except Exception as e:
        logger.error(f"Failed to send view notification: {str(e)}")


@router.get("/user/subscription", response_model=dict)
async def get_user_subscription(
    session: AsyncSession = Depends(get_session),
    current_user=Depends(get_current_user)
):
    """
    Retrieve only the **subscription and payment details** of the authenticated user.
    """

    try:
        # Fetch active subscription
        subscription_result = await session.execute(
            select(Subscription)
            .where(
                (Subscription.user_id == current_user.id) &
                (Subscription.status == SubscriptionStatus.ACTIVE)
            )
            .options(joinedload(Subscription.plan))
        )
        subscription = subscription_result.scalars().first()

        # Fetch last payment record
        payment_result = await session.execute(
            select(Payment)
            .where(Payment.user_id == current_user.id)
            .order_by(Payment.created_at.desc())
        )
        last_payment = payment_result.scalars().first()

        # Prepare subscription response
        subscription_data = (
            {
                "id": subscription.id,
                "plan_name": subscription.plan.name,
                "plan_price": subscription.plan.price,
                "duration_days": subscription.plan.duration_days,
                "start_date": subscription.start_date,
                "end_date": subscription.end_date,
                "status": subscription.status.value,
                "amount_paid": subscription.amount_paid,
            }
            if subscription else None
        )

        # Prepare payment response
        payment_data = (
            {
                "order_id": last_payment.order_id if last_payment else None,
                "status": last_payment.status if last_payment else None,
                "trans_id": last_payment.trans_id if last_payment else None,
                "amount": last_payment.amount if last_payment else None,
                "currency": last_payment.currency if last_payment else None,
                "transaction_date": last_payment.trans_date if last_payment else None,
                "failure_reason": last_payment.failure_reason if last_payment and last_payment.status == "FAILURE" else None,
            }
            if last_payment else None
        )

        return {
            "subscription": subscription_data,
            "payment": payment_data,
        }

    except Exception as e:
        logger.error(f"Error fetching subscription details: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve subscription details.")


# ---------------------------------------
# ✅ Get Profile Summary (Total & Approved Companies)
# ---------------------------------------
async def get_profile_summary(user: User, session: AsyncSession):
    result = await session.execute(
        select(
            func.count(Company.id).label("total"),
            func.count(Company.id).filter(Company.status == "approved").label("approved")
        )
        .where(Company.user_id == user.id)
    )
    counts = result.first()
    return {
        "total_companies": counts.total or 0,
        "approved_companies": counts.approved or 0
    }


# ---------------------------------------
# 📊 Get Engagement Stats (Total Views + Monthly Trends)
# ---------------------------------------
async def get_engagement_stats(user: User, session: AsyncSession) -> EngagementStats:
    total_views = await session.scalar(
        select(func.count(CompanyView.id))
        .join(Company)
        .where(Company.user_id == user.id)
    )

    six_months_ago = datetime.utcnow() - timedelta(days=180)
    monthly_views = await session.execute(
        select(
            func.to_char(CompanyView.viewed_at, 'YYYY-MM').label("month"),
            func.count(CompanyView.id).label("views")
        )
        .join(Company)
        .where(Company.user_id == user.id, CompanyView.viewed_at >= six_months_ago)
        .group_by("month")
        .order_by("month")
    )

    return EngagementStats(
        total_views=total_views or 0,
        view_trend={row.month: row.views for row in monthly_views}
    )


# ---------------------------------------
# 📈 Get Company Performance (Scores Over Years)
# ---------------------------------------
async def get_company_performance(user: User, session: AsyncSession) -> CompanyPerformance:
    performance_scores = await session.execute(
        select(Score.year, func.avg(Score.score).label("avg_score"))
        .join(Company)
        .where(Company.user_id == user.id)
        .group_by(Score.year)
        .order_by(Score.year)
    )

    return CompanyPerformance(
        score_trend={row.year: row.avg_score for row in performance_scores}
    )


# ---------------------------------------
# 🗂 Get Top 5 Viewers
# ---------------------------------------
async def get_top_viewers(user: User, session: AsyncSession):
    top_viewers = await session.execute(
        select(
            User.company_name,
            func.concat(User.first_name, ' ', User.last_name).label("name"),
            func.count(CompanyView.id).label("views")
        )
        .join(CompanyView, CompanyView.viewer_id == User.id)
        .join(Company)
        .where(Company.user_id == user.id)
        .group_by(User.id)
        .order_by(text("views DESC"))
        .limit(5)
    )

    return [
        {"name": row.name, "company": row.company_name, "views": str(row.views)}  # ✅ Convert views to string
        for row in top_viewers
    ]



# ---------------------------------------
# 🔹 Get Stats for Each Company
# ---------------------------------------
async def get_company_stats(user: User, session: AsyncSession):
    six_months_ago = datetime.utcnow() - timedelta(days=180)

    company_stats = []
    companies = await session.execute(select(Company).where(Company.user_id == user.id))
    
    for company in companies.scalars():
        # Total views per company
        company_views = await session.scalar(
            select(func.count(CompanyView.id)).where(CompanyView.company_id == company.id)
        )

        # Monthly views per company
        company_monthly_views = await session.execute(
            select(
                func.to_char(CompanyView.viewed_at, 'YYYY-MM').label("month"),
                func.count(CompanyView.id).label("views")
            )
            .where(CompanyView.company_id == company.id, CompanyView.viewed_at >= six_months_ago)
            .group_by("month")
            .order_by("month")
        )

        # Performance trend per company
        company_performance = await session.execute(
            select(Score.year, func.avg(Score.score).label("avg_score"))
            .where(Score.company_id == company.id)
            .group_by(Score.year)
            .order_by(Score.year)
        )

        company_stats.append(CompanyStatsResponse(
            company_id=company.id,
            company_name=company.name,
            total_views=company_views,
            monthly_views={row.month: row.views for row in company_monthly_views},
            performance_trend={row.year: row.avg_score for row in company_performance}
        ))

    return company_stats
# --------------------------
# Main Endpoint
# --------------------------

@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Get dashboard statistics for the authenticated user
    """
    try:
        profile_summary = await get_profile_summary(current_user, session)
        engagement = await get_engagement_stats(current_user, session)
        performance = await get_company_performance(current_user, session)
        top_viewers = await get_top_viewers(current_user, session)
        company_stats = await get_company_stats(current_user, session)
        subscription = await get_subscription_stats(current_user, session)

        subscription = subscription.dict() if subscription else None  # ✅ Fix validation error

        return UserStatsResponse(
            profile_summary=profile_summary,
            engagement=engagement,
            subscription=subscription,
            performance=performance,
            top_viewers=top_viewers,
            company_stats=company_stats,
        )

    except Exception as e:
        logger.error(f"Error fetching stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching stats: {str(e)}")
