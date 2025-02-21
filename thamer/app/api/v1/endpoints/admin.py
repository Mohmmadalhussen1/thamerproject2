# File: app/api/v1/endpoints/admin.py
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Path, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api.v1.endpoints.user import generate_presigned_url, generate_presigned_url_with_lstrip
from app.models import Score
from app.models.Company import Company
from app.models.subscription_plan import SubscriptionPlan
from app.models.user import User, UserRole
from app.core.db import get_session
from app.api.dependencies.auth import get_admin_user, get_current_user
from app.schemas.company import CompanyResponse, FileResponse, PendingCompanyResponse, GetAllCompaniesResponse, ScoreResponse
from app.models.Subscription import Subscription, SubscriptionStatus
from typing import List, Optional
from sqlalchemy.sql import func
from sqlalchemy.orm import joinedload
import logging
from app.schemas.user import UserPaginationResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.put("/admin/validate-company/{company_id}", response_model=dict)
async def validate_company(
    company_id: int = Path(..., title="The ID of the company to validate"),
    status: str = Query(..., description="The new status of the company (approved, rejected)"),
    rejection_reason: Optional[str] = None,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Validate or reject a company's details.

    **Admin Rules:**
    - Admin can **ONLY** choose `"approved"` or `"rejected"`.
    - The backend **determines the actual status change** based on the company's current status.

    **Backend Rules:**
    - `"approved"` → **Rejecting sets it to `"re-evaluation"`**
    - `"pending"` → **Approved → `"approved"`, Rejected → `"rejected"`**
    - `"re-evaluation"` → **Approved → `"approved"`, Rejected → `"rejected"`**
    - `"revision-requested"` → **Approved → `"approved"`, Rejected → `"rejected"`**
    - `"rejected"` → **Approved → `"approved"`** (✅ **Fix applied**)

    **Rejection Reason Requirement:**
    - If setting status to `"rejected"`, a rejection reason is required.
    """
    try:
        logger.info(f"Admin {current_user.email} attempting to validate company ID {company_id}.")

        # Ensure the current user is an admin
        if current_user.role != UserRole.ADMIN:
            logger.warning(f"Access denied for user {current_user.email}. Only admins can validate companies.")
            raise HTTPException(status_code=403, detail="Access denied. Only admins can validate companies.")

        # Fetch the company by ID
        stmt = select(Company).where(Company.id == company_id)
        result = await session.execute(stmt)
        company = result.scalars().first()

        if not company:
            logger.warning(f"Company ID {company_id} not found.")
            raise HTTPException(status_code=404, detail="Company not found.")

        old_status = company.status

        # Admin can only select approved or rejected
        if status not in ["approved", "rejected"]:
            logger.warning(f"Invalid status '{status}' provided for company ID {company_id}.")
            raise HTTPException(status_code=400, detail="Invalid status. Admin can only select 'approved' or 'rejected'.")

        # Ensure rejection reason is provided when rejecting
        if status == "rejected" and not rejection_reason:
            logger.warning(f"Rejection reason required for status '{status}' for company ID {company_id}.")
            raise HTTPException(status_code=400, detail="Rejection reason is required for rejection.")

        # Backend determines actual status update
        new_status = old_status  # Default to no change
        if status == "approved":
            new_status = "approved"  # ✅ Fix: Now correctly sets `"approved"` when a rejected company is approved
        elif status == "rejected":
            if old_status == "approved":
                new_status = "re-evaluation"  # Approved → Rejected = Re-evaluation
            elif old_status in ["pending", "re-evaluation", "revision-requested"]:
                new_status = "rejected"

        # Avoid redundant updates
        if company.status == new_status:
            logger.info(f"Company ID {company_id} is already '{new_status}', no changes needed.")
            return {
                "message": f"Company '{company.name}' is already {new_status}.",
                "company": {
                    "id": company.id,
                    "name": company.name,
                    "status": company.status,
                    "rejection_reason": company.rejection_reason,
                    "last_updated": company.last_updated.isoformat(),
                },
            }

        # Update company status
        company.status = new_status
        company.rejection_reason = rejection_reason if new_status == "rejected" else None
        company.last_updated = datetime.utcnow()

        await session.commit()

        response = {
            "message": f"Company '{company.name}' status changed from '{old_status}' to '{new_status}'.",
            "company": {
                "id": company.id,
                "name": company.name,
                "status": company.status,
                "rejection_reason": company.rejection_reason,
                "last_updated": company.last_updated.isoformat(),
            },
        }
        logger.info(response["message"])
        return response

    except Exception as e:
        logger.error(f"Error validating company {company_id}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")

    
@router.get("/admin/pending-companies", response_model=List[PendingCompanyResponse])
async def get_pending_companies(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
):
    """
    Retrieve pending companies for admin review.

    - Requires admin access.
    - Supports pagination with page and page_size.
    """
    try:
        logger.info(f"Admin {current_user.email} fetching pending companies (Page: {page}, Page Size: {page_size}).")

        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied. Only admins can view pending companies.")

        offset = (page - 1) * page_size
        stmt = select(Company).where(Company.status == "pending").offset(offset).limit(page_size)
        result = await session.execute(stmt)
        companies = result.scalars().all()

        if not companies:
            logger.info("No pending companies found.")
            return []

        company_details = []
        for company in companies:
            # Fetch associated scores
            stmt_scores = select(Score).where(Score.company_id == company.id)
            score_result = await session.execute(stmt_scores)
            scores = score_result.scalars().all()

            score_details = [
                {
                    "id": score.id,  # Include `id` field
                    "year": score.year,
                    "score": score.score,
                    "score_type": score.score_type,
                    "file": generate_presigned_url_with_lstrip(score.file) if score.file else None,
                }
                for score in scores
            ]

            company_details.append(
                PendingCompanyResponse(
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
                    logo=generate_presigned_url_with_lstrip(company.logo) if company.logo else None,
                    awards=company.awards,
                    sectors=company.sectors,
                    created_at=company.created_at,
                    last_updated=company.last_updated,
                    status=company.status,  
                    rejection_reason=company.rejection_reason, 
                    scores=score_details,
                )
            )

        logger.info(f"Admin {current_user.email} retrieved {len(company_details)} pending companies.")
        return company_details
    except Exception as e:
        logger.error(f"Error fetching pending companies: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")



@router.get("/admin/users",  response_model=UserPaginationResponse)
async def get_users(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    """
    Retrieve all users with pagination.

    - Requires admin access.
    - Supports pagination with page and page_size.
    """
    try:
        logger.info(f"Admin {current_user.email} fetching users (Page: {page}, Page Size: {page_size}).")

        # Check if the current user has admin access
        if current_user.role != UserRole.ADMIN:
            logger.warning(f"Access denied for user {current_user.email}. Only admins can view users.")
            raise HTTPException(status_code=403, detail="Access denied. Only admins can view users.")

        # Calculate offset for pagination
        offset = (page - 1) * page_size
        
        # Fetch users with pagination
        stmt = select(User).where(User.role != UserRole.ADMIN).order_by(User.created_at.desc()).offset(offset).limit(page_size)
        result = await session.execute(stmt)
        users = result.scalars().all()

        # Fetch total count of users for pagination purposes
        total_stmt = select(func.count()).select_from(User).where(User.role != UserRole.ADMIN)
        total_result = await session.execute(total_stmt)
        total_users = total_result.scalar()

        logger.info(f"Admin {current_user.email} retrieved {len(users)} users out of {total_users} total users.")

        # Return response with pagination metadata and user data
        return {
            "data": [
                {
                    "id": user.id,
                    "name": f"{user.first_name} {user.last_name}",
                    "email": user.email,
                    "phone": user.phone_number,
                    "role": user.role,
                    "is_active": user.is_active,
                    "is_verified": user.is_verified,
                    "created_at": user.created_at,
                }
                for user in users
            ],
            "total": total_users,  # Include total number of users
            "page": page,
            "page_size": page_size,
            "total_pages": (total_users + page_size - 1) // page_size,  # Calculate total pages
        }

    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


class SubscriptionResponse(BaseModel):
    data: List[dict]  # Ensure this is properly structured
    total: int
    page: int
    page_size: int
    total_pages: int


@router.get("/admin/subscriptions", response_model=SubscriptionResponse)
async def get_subscriptions(
    page: int = Query(1, ge=1, description="Page number for pagination"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all subscriptions with pagination.
    """
    try:
        logger.info(f"Admin {current_user.email} fetching subscriptions (Page: {page}, Page Size: {page_size}).")

        # Ensure admin access
        if current_user.role != UserRole.ADMIN:
            logger.warning(f"Access denied for user {current_user.email}. Only admins can view subscriptions.")
            raise HTTPException(status_code=403, detail="Access denied. Only admins can view subscriptions.")

        offset = (page - 1) * page_size
        stmt = select(Subscription).offset(offset).limit(page_size)
        result = await session.execute(stmt)
        subscriptions = result.scalars().all()

        # Get total count
        total_stmt = select(func.count()).select_from(Subscription)
        total_result = await session.execute(total_stmt)
        total_subscriptions = total_result.scalar()

        logger.info(f"Admin {current_user.email} retrieved {len(subscriptions)} subscriptions.")

        return SubscriptionResponse(
            data=[
                {
                    "id": subscription.id,
                    "user_id": subscription.user_id,
                    "start_date": subscription.start_date,
                    "end_date": subscription.end_date,
                    "amount_paid": subscription.amount_paid,
                    "status": subscription.status.value,  # Convert Enum to string
                    "created_at": subscription.created_at,
                }
                for subscription in subscriptions
            ],
            total=total_subscriptions,
            page=page,
            page_size=page_size,
            total_pages=(total_subscriptions + page_size - 1) // page_size,
        )

    except Exception as e:
        logger.error(f"Error fetching subscriptions: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")



class UpdateSubscriptionRequest(BaseModel):
    user_id: int
    start_date: datetime
    end_date: datetime
    amount_paid: float

@router.post("/admin/subscriptions", response_model=dict)
async def update_subscription(
    request: UpdateSubscriptionRequest,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    **Add or update a subscription for a user.**
    
    - **user_id**: ID of the user for whom the subscription is being updated.
    - **start_date**: Subscription start date.
    - **end_date**: Subscription end date.
    - **amount_paid**: Amount paid for the subscription.
    """
    try:
        logger.info(f"Admin {current_user.email} attempting to update subscription for user ID {request.user_id}.")

        # Ensure admin access
        if current_user.role != UserRole.ADMIN:
            logger.warning(f"Access denied for user {current_user.email}. Only admins can update subscriptions.")
            raise HTTPException(status_code=403, detail="Access denied. Only admins can update subscriptions.")

        stmt = select(Subscription).where(Subscription.user_id == request.user_id)
        result = await session.execute(stmt)
        subscription = result.scalars().first()

        if subscription:
            logger.info(f"Updating existing subscription for user ID {request.user_id}.")
            # Update existing subscription
            subscription.start_date = request.start_date
            subscription.end_date = request.end_date
            subscription.amount_paid = request.amount_paid
            subscription.status = SubscriptionStatus.ACTIVE
        else:
            logger.info(f"Creating new subscription for user ID {request.user_id}.")
            # Create new subscription
            subscription = Subscription(
                user_id=request.user_id,
                start_date=request.start_date,
                end_date=request.end_date,
                amount_paid=request.amount_paid,
                status=SubscriptionStatus.ACTIVE,
            )
            session.add(subscription)

        await session.commit()

        logger.info(f"Subscription for user ID {request.user_id} updated successfully.")
        return {
            "message": "Subscription updated successfully.",
            "subscription": {
                "user_id": subscription.user_id,
                "start_date": subscription.start_date,
                "end_date": subscription.end_date,
                "amount_paid": subscription.amount_paid,
                "status": subscription.status,
            },
        }
    except Exception as e:
        logger.error(f"Error updating subscription for user ID {request.user_id}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")





router.get("/admin/dashboard", response_model=dict)
async def get_dashboard_stats(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve statistics for the admin dashboard.

    - Provides counts for total users, companies, and subscriptions.
    """
    try:
        logger.info(f"Admin {current_user.email} fetching dashboard statistics.")

        if current_user.role != UserRole.ADMIN:
            logger.warning(f"Access denied for user {current_user.email}. Only admins can view dashboard statistics.")
            raise HTTPException(status_code=403, detail="Access denied. Only admins can view dashboard statistics.")

        total_users = await session.scalar(select(func.count(User.id)))
        total_companies = await session.scalar(select(func.count(Company.id)))
        total_subscriptions = await session.scalar(select(func.count(Subscription.id)))

        logger.info(f"Dashboard statistics fetched by {current_user.email}: Users={total_users}, Companies={total_companies}, Subscriptions={total_subscriptions}.")
        return {
            "total_users": total_users,
            "total_companies": total_companies,
            "total_subscriptions": total_subscriptions,
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard statistics: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")



@router.delete("/admin/users/{user_id}", response_model=dict)
async def deactivate_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Deactivate a user by setting is_active to False.
    """
    try:
        logger.info(f"Admin {current_user.email} attempting to deactivate user ID {user_id}.")

        # Ensure admin access
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied. Only admins can deactivate users.")

        # Fetch the user
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        if not user.is_active:
            raise HTTPException(status_code=400, detail="User is already deactivated.")

        # Deactivate user
        user.is_active = False
        await session.commit()

        logger.info(f"User ID {user_id} deactivated successfully by {current_user.email}.")
        return {"message": "User deactivated successfully.", "user": {"id": user.id, "email": user.email}}
    except Exception as e:
        logger.error(f"Error deactivating user ID {user_id}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")



@router.put("/admin/users/{user_id}/restore", response_model=dict)
async def restore_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Reactivate a user by setting is_active to True.
    """
    try:
        logger.info(f"Admin {current_user.email} attempting to restore user ID {user_id}.")

        # Ensure admin access
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied. Only admins can restore users.")

        # Fetch the user
        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        user = result.scalars().first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found.")

        if user.is_active:
            raise HTTPException(status_code=400, detail="User is already active.")

        # Reactivate user
        user.is_active = True
        await session.commit()

        logger.info(f"User ID {user_id} restored successfully by {current_user.email}.")
        return {"message": "User restored successfully.", "user": {"id": user.id, "email": user.email}}
    except Exception as e:
        logger.error(f"Error restoring user ID {user_id}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.get("/admin/companies", response_model=GetAllCompaniesResponse)
async def get_pending_companies(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
):
    """
    Retrieve pending companies for admin review.

    - Requires admin access.
    - Supports pagination with page and page_size.
    """
    try:
        logger.info(f"Admin {current_user.email} fetching pending companies (Page: {page}, Page Size: {page_size}).")

        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied. Only admins can view pending companies.")

        offset = (page - 1) * page_size
        stmt = select(Company).order_by(Company.created_at.desc()).offset(offset).limit(page_size)
        result = await session.execute(stmt)
        companies = result.scalars().all()

          # Fetch total count of users for pagination purposes
        total_stmt = select(func.count()).select_from(Company)
        total_result = await session.execute(total_stmt)
        total_companies = total_result.scalar()


        if not companies:
            logger.info("No pending companies found.")
            return {
                "company_details": [],
                "total": total_companies,
                "page": page,
                "page_size": page_size,
                "total_pages": max(1, (total_companies // page_size) + (1 if total_companies % page_size > 0 else 0)),
            }

        company_details = []
        for company in companies:
            # Fetch associated scores
            stmt_scores = select(Score).where(Score.company_id == company.id)
            score_result = await session.execute(stmt_scores)
            scores = score_result.scalars().all()

            score_details = [
                {
                    "id": score.id,  
                    "year": score.year,
                    "score": score.score,
                    "score_type": score.score_type,
                    "file": FileResponse(
                        url=generate_presigned_url_with_lstrip(score.file) if score.file else None,
                        key=score.file if score.file else None
                    ) if score.file else None,  # ✅ Ensure this is a `FileResponse`
                }
                for score in scores
            ]


            company_details.append(
                PendingCompanyResponse(
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
                    logo=generate_presigned_url_with_lstrip(company.logo) if company.logo else None,
                    awards=company.awards,
                    sectors=company.sectors,
                    created_at=company.created_at,
                    last_updated=company.last_updated,
                    status=company.status,  
                    rejection_reason=company.rejection_reason,
                    scores=score_details,
                )
            )

        logger.info(f"Admin {current_user.email} retrieved {len(company_details)} pending companies.")
        return {"company_details":company_details,"total":total_companies,"page":page,"page_size":page_size,"total_pages":((total_companies+page_size-1)//page_size)}
    except Exception as e:
        logger.error(f"Error fetching pending companies: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")



@router.delete("/admin/companies/{company_id}", response_model=dict)
async def soft_delete_company(
    company_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Soft delete a company by updating its status to 'deleted'.
    """
    try:
        logger.info(f"Admin {current_user.email} attempting to soft delete company ID {company_id}.")

        # Ensure admin access
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied. Only admins can delete companies.")

        # Fetch the company
        stmt = select(Company).where(Company.id == company_id)
        result = await session.execute(stmt)
        company = result.scalars().first()

        if not company:
            logger.warning(f"Company ID {company_id} not found.")
            raise HTTPException(status_code=404, detail="Company not found.")

        # Prevent duplicate deletion
        if company.status == "deleted":
            logger.warning(f"Company ID {company_id} is already deleted.")
            raise HTTPException(status_code=400, detail="Company is already deleted.")

        # Soft delete by updating status
        company.status = "deleted"
        company.last_updated = datetime.utcnow()
        session.add(company)
        await session.commit()

        logger.info(f"Company ID {company_id} soft deleted successfully by {current_user.email}.")
        return {
            "message": "Company soft deleted successfully.",
            "company": {
                "id": company.id,
                "name": company.name,
                "status": company.status,
                "last_updated": company.last_updated,
            },
        }

    except HTTPException as e:
        logger.error(f"HTTPException while deleting company ID {company_id}: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error while deleting company ID {company_id}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")




@router.put("/admin/subscriptions/{subscription_id}/suspend", response_model=dict)
async def suspend_subscription(
    subscription_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    **Suspend a subscription by ending it immediately.**
    """
    try:
        logger.info(f"Admin {current_user.email} attempting to suspend subscription ID {subscription_id}.")

        # Ensure admin access
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied. Only admins can suspend subscriptions.")

        # Fetch the subscription
        stmt = select(Subscription).where(Subscription.id == subscription_id)
        result = await session.execute(stmt)
        subscription = result.scalars().first()

        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found.")

        if subscription.end_date <= datetime.utcnow():
            raise HTTPException(status_code=400, detail="Subscription is already expired or suspended.")

        # Suspend the subscription
        subscription.end_date = datetime.utcnow()
        subscription.status = SubscriptionStatus.SUSPENDED
        await session.commit()

        logger.info(f"Subscription ID {subscription_id} suspended successfully by {current_user.email}.")
        return {"message": "Subscription suspended successfully.", "subscription": {"id": subscription.id}}
    except Exception as e:
        logger.error(f"Error suspending subscription ID {subscription_id}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


class CreateSubscriptionPlanRequest(BaseModel):
    name: str
    description: str
    price: float
    duration_days: int


@router.post("/admin/subscription/create")
async def create_subscription_plan(
    name: str,
    description: str,
    price: float,
    duration_days: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    **Create a new subscription plan (Admin only).**
    """
    try:
        logger.info(f"Admin {current_user.email} attempting to create a new subscription plan.")

        # ✅ Prevent duplicate plans
        existing_plan = await session.execute(select(SubscriptionPlan).where(SubscriptionPlan.name == name))
        if existing_plan.scalars().first():
            raise HTTPException(status_code=400, detail="A plan with this name already exists.")

        # ✅ Create a new subscription plan
        new_plan = SubscriptionPlan(
            name=name,
            description=description,
            price=price,
            duration_days=duration_days,
            is_active=True,
        )
        session.add(new_plan)
        await session.commit()

        return {"message": "Subscription plan created successfully", "plan_id": new_plan.id}

    except Exception as e:
        logger.error(f"Error creating subscription plan: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")



@router.get("/admin/subscription/list", response_model=dict)
async def list_subscription_plans(
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    page_size: int = Query(10, ge=1, le=100, description="Number of items per page"),
):
    """
    **List all available subscription plans.**

    - Requires **admin access**.
    - Supports **pagination** with `page` and `page_size`.
    """
    try:
        logger.info(f"Admin {current_user.email} fetching subscription plans (Page: {page}, Page Size: {page_size}).")

        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied. Only admins can view subscription plans.")

        offset = (page - 1) * page_size
        stmt = select(SubscriptionPlan).where(SubscriptionPlan.is_active == True).offset(offset).limit(page_size)
        result = await session.execute(stmt)
        plans = result.scalars().all()

        total_stmt = select(func.count()).select_from(SubscriptionPlan).where(SubscriptionPlan.is_active == True)
        total_result = await session.execute(total_stmt)
        total_plans = total_result.scalar()

        logger.info(f"Admin {current_user.email} retrieved {len(plans)} subscription plans.")
        return {
            "plans": plans,
            "total": total_plans,
            "page": page,
            "page_size": page_size,
            "total_pages": (total_plans + page_size - 1) // page_size,
        }

    except Exception as e:
        logger.error(f"Error fetching subscription plans: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.get("/admin/subscription/status/{user_id}", response_model=dict)
async def get_subscription_status(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    **Get the current subscription status of a user.**

    - Requires **admin access**.
    - Fetches **active subscription** details if available.
    """
    try:
        logger.info(f"Admin {current_user.email} fetching subscription status for user ID {user_id}.")

        if current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=403, detail="Access denied. Only admins can view user subscriptions.")

        result = await session.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )
        subscription = result.scalars().first()

        if not subscription:
            raise HTTPException(status_code=404, detail="No active subscription found")

        return {
            "subscription_status": subscription.status,
            "expires_on": subscription.end_date,
            "user_id": subscription.user_id,
            "amount_paid": subscription.amount_paid,
        }

    except Exception as e:
        logger.error(f"Error fetching subscription status for user ID {user_id}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")


@router.get("/admin/companies/{company_id}", response_model=CompanyResponse)
async def get_company_by_id_admin(
    company_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve a company's details for admin review.

    **Admin Access Only:**
    - Unlike user APIs, admins **can view any company**, not just their own.
    - Fetches **company scores** with pre-signed URLs for file access.

    **Security:**
    - Requires admin privileges.
    """
    try:
        logger.info(f"Admin {current_user.email} fetching company ID {company_id}.")

        # ✅ Ensure admin access
        if current_user.role != UserRole.ADMIN:
            logger.warning(f"Access denied for user {current_user.email}. Only admins can view company details.")
            raise HTTPException(status_code=403, detail="Access denied. Only admins can view company details.")

        # ✅ Fetch company with scores
        stmt = select(Company).where(Company.id == company_id).options(joinedload(Company.scores))
        result = await session.execute(stmt)
        company = result.scalars().first()

        if not company:
            logger.warning(f"Company ID {company_id} not found.")
            raise HTTPException(status_code=404, detail="Company not found.")

        # ✅ Generate pre-signed URL for logo
        logo_response = FileResponse(
            url=generate_presigned_url_with_lstrip(company.logo) if company.logo else None,
            key=company.logo if company.logo else None,
        )

        # ✅ Generate pre-signed URLs for scores
        score_details = [
            ScoreResponse(
                id=score.id,
                year=score.year,
                score=score.score,
                score_type=score.score_type,
                file=FileResponse(
                    url=generate_presigned_url_with_lstrip(score.file) if score.file else None,
                    key=score.file if score.file else None,
                ),
            )
            for score in company.scores
        ]

        # ✅ Create response object
        response = CompanyResponse(
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
            logo=logo_response,
            awards=company.awards,
            sectors=company.sectors,
            created_at=company.created_at,
            last_updated=company.last_updated,
            status=company.status,
            rejection_reason=company.rejection_reason,
            scores=score_details,
        )

        logger.info(f"Admin {current_user.email} successfully retrieved company ID {company_id}.")
        return response

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching company ID {company_id}: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
