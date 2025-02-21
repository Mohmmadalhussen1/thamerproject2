from datetime import datetime, timedelta
from enum import Enum
import uuid
from fastapi.responses import JSONResponse, PlainTextResponse, RedirectResponse
import requests
import hashlib
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.api.dependencies.auth import get_current_user
from app.core.config import settings
from app.core.db import get_session
from app.models.payment import Payment
from app.models.Subscription import Subscription, SubscriptionStatus  # Fixed lowercase import
from app.models.subscription_plan import SubscriptionPlan
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SETTLED = "SETTLED"
    DECLINED = "DECLINED"
    FAILURE = "FAILURE"

    
def compute_hash(payment_id, merchant_pass):
    """Generate secure hash for payment verification."""
    to_md5 = f"{payment_id}{merchant_pass}".upper()
    md5_hash = hashlib.md5(to_md5.encode()).hexdigest()
    return hashlib.sha1(md5_hash.encode()).hexdigest()

# def generate_payment_signature(order_id: str, formatted_amount: str, currency: str, description: str, merchant_pass: str) -> str:
#     """Generate payment signature for EDFAPay."""
#     to_md5 = f"{order_id.upper()}{formatted_amount.upper()}{currency.upper()}{description.upper()}{merchant_pass.upper()}"
#     md5_hash = hashlib.md5(to_md5.encode()).hexdigest()
#     return hashlib.sha1(md5_hash.encode()).hexdigest()

def generate_payment_signature(order_id: str, formatted_amount: str, currency: str, description: str, merchant_pass: str) -> str:
    """
    Generate payment signature for EDFAPay.
    
    Hashing sequence:
    1. Concatenate values in order (without spaces).
    2. Convert entire string to uppercase.
    3. Apply MD5 hashing.
    4. Apply SHA1 hashing to the MD5 result.
    5. Return the final hash.
    """
    # Step 1: Concatenate parameters in the correct order
    to_md5 = f"{order_id}{formatted_amount}{currency}{description}{merchant_pass}"

    # Step 2: Convert full concatenated string to uppercase
    to_md5_upper = to_md5.upper()

    # Debugging: Print raw string before hashing
    print("Raw string before hashing:", to_md5_upper)

    # Step 3: Apply MD5 hashing
    md5_hash = hashlib.md5(to_md5_upper.encode()).hexdigest()

    # Step 4: Apply SHA1 hashing to the MD5 result
    sha1_hash = hashlib.sha1(md5_hash.encode()).hexdigest()

    return sha1_hash  # Step 5: Return final hash



def verify_payment_hash(callback_data: dict, expected_hash: str) -> bool:
    """Verify hash for payment callback"""
    try:
        order_id = callback_data.get("order_id", "").strip().upper()
        amount = callback_data.get("amount", "").strip().upper()
        currency = callback_data.get("currency", "").strip().upper()
        merchant_pass = settings.EDFAPAY_PASSWORD.strip().upper()

        # Construct hash string
        string_to_md5 = f"{order_id}.{amount}.{currency}.{merchant_pass}".upper()

        # Step 1: MD5 Hash
        md5_hash = hashlib.md5(string_to_md5.encode()).hexdigest()

        # Step 2: SHA1 Hash
        calculated_hash = hashlib.sha1(md5_hash.encode()).hexdigest()

        # Debugging logs
        logger.info(f"Hash Verification for order_id: {order_id}")
        logger.info(f"String to MD5: {string_to_md5}")
        logger.info(f"MD5 Hash: {md5_hash}")
        logger.info(f"Calculated SHA1 Hash: {calculated_hash}")
        logger.info(f"Expected Hash: {expected_hash}")

        return calculated_hash == expected_hash

    except Exception as e:
        logger.error(f"Hash verification error: {e}")
        return False


@router.post("/initiate")
async def initiate_payment(
    request: Request,
    plan_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Initiate a payment transaction with EDFAPay.
    """
    try:
        # Generate unique order ID
        order_id = f"ORD{uuid.uuid4().hex[:10].upper()}"

        # Fetch subscription plan
        result = await session.execute(
            select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)
        )
        plan = result.scalars().first()

        if not plan:
            raise HTTPException(status_code=404, detail="Subscription plan not found")

        # Format amount based on currency
        formatted_amount = f"{plan.price:.2f}"  # Adjust format based on currency requirements

        # Generate payment signature
        payment_hash = generate_payment_signature(
            order_id,
            formatted_amount,
            "SAR",  # Currency code
            plan.name,
            settings.EDFAPAY_PASSWORD
        )

        # Create payment record
        payment = Payment(
            order_id=order_id,
            user_id=current_user.id,
            plan_id=plan_id,
            amount=plan.price,
            currency="SAR",
            description=plan.name,
            status=PaymentStatus.PENDING,
            created_at=datetime.utcnow()
        )
        session.add(payment)
        await session.commit()

        # Prepare EDFAPay request payload
        payload = {
            "action": "SALE",
            "edfa_merchant_id": settings.EDFAPAY_MERCHANT_ID,
            "order_id": order_id,
            "order_amount": formatted_amount,
            "order_currency": "SAR",
            "order_description": plan.name,
            "payer_first_name": current_user.first_name,
            "payer_last_name": current_user.last_name,
            "payer_email": current_user.email,
            "payer_phone": current_user.phone_number,
            "payer_ip": request.client.host,
            "payer_country": "SA",
            "payer_city": "Riyadh",
            "payer_address": "Riyadh",
            "payer_zip": "12221",
            "term_url_3ds": f"{settings.API_BASE_URL}/user/callback",
            # "term_url_3ds": f"http://localhost:3000/user/callback",
            "recurring_init":"N",
            "req_token":"N",
            "auth": "N",
            "hash": payment_hash,
        }

        # Convert to form-data
        files = {k: (None, str(v)) for k, v in payload.items()}

        # Send request to EDFAPay
        response = requests.post(
            settings.EDFAPAY_PAYMENT_URL,
            files=files,
            timeout=30
        )

        if response.status_code != 200:
            logger.error(f"EDFAPay error: {response.text}")
            raise HTTPException(status_code=400, detail="Payment initiation failed")

        response_data = response.json()

        if "redirect_url" not in response_data:
            logger.error(f"Invalid EDFAPay response: {response_data}")
            raise HTTPException(status_code=400, detail="Invalid payment gateway response")

        return {
            "message": "Payment initiated successfully",
            "order_id": order_id,
            "redirect_url": response_data["redirect_url"]
        }

    except Exception as e:
        logger.error(f"Error initiating payment: {e}")
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail="An unexpected error occurred")


@router.post("/callback")
async def payment_callback(
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """Process payment callbacks based on order_id and transaction status"""
    try:
        # Extract callback data
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            callback_data = await request.json()
        else:
            form_data = await request.form()
            callback_data = dict(form_data)

        logger.info(f"Received callback: {callback_data}")

        # Essential parameters
        order_id = callback_data.get("order_id", "").strip()
        trans_id = callback_data.get("trans_id", "").strip()
        result = callback_data.get("result", "").upper().strip()
        status = callback_data.get("status", "").upper().strip()
        trans_date_str = callback_data.get("trans_date")
        decline_reason = callback_data.get("decline_reason")
        redirect_url = callback_data.get("redirect_url")

        if not order_id:
            return JSONResponse({"error": "Missing order_id"}, status_code=400)

        # Fetch payment record
        payment_result = await session.execute(
            select(Payment).where(Payment.order_id == order_id)
        )
        payment = payment_result.scalars().first()

        if not payment:
            logger.error(f"Payment not found for order_id: {order_id}")
            return JSONResponse({"error": "Payment not found"}, status_code=404)

        # Update transaction details
        payment.trans_id = trans_id
        payment.updated_at = datetime.utcnow()

        # Parse transaction date
        if trans_date_str:
            try:
                payment.trans_date = datetime.strptime(trans_date_str, '%Y-%m-%d %H:%M:%S')
            except ValueError as e:
                logger.error(f"Invalid trans_date format: {trans_date_str} - {e}")
                payment.trans_date = datetime.utcnow()

        # Map status based on result
        status_mapping = {
            "SUCCESS": "SETTLED",
            "DECLINED": "DECLINED",
            "REDIRECT": "PENDING",
            "ERROR": "FAILURE"
        }
        payment.status = status_mapping.get(result, "PENDING")

        # Handle special 3DS case
        if status == "3DS":
            payment.status = "3DS_VERIFICATION"
            payment.redirect_url = redirect_url

        # Store decline reason if present
        if decline_reason:
            payment.failure_reason = decline_reason

        # ✅ Fix: If `subscription_id` is None, create a new one
        if not payment.subscription_id and payment.status == "SETTLED":
            logger.info(f"No active subscription found for user {payment.user_id}. Creating new subscription.")

            # ✅ Fetch `plan_id` from Payment
            if not payment.plan_id:
                logger.error(f"Plan ID is missing for payment with order_id: {payment.order_id}")
                raise HTTPException(status_code=404, detail="Plan ID missing in payment record.")

            # ✅ Fetch Subscription Plan using `plan_id`
            plan_result = await session.execute(
                select(SubscriptionPlan).where(SubscriptionPlan.id == payment.plan_id)
            )
            plan = plan_result.scalars().first()

            if not plan:
                logger.error(f"Subscription plan not found for plan_id: {payment.plan_id}")
                raise HTTPException(status_code=404, detail="Subscription plan not found.")

            # ✅ Create new subscription
            end_date = datetime.utcnow() + timedelta(days=plan.duration_days)
            new_subscription = Subscription(
                user_id=payment.user_id,
                plan_id=plan.id,
                start_date=datetime.utcnow(),
                end_date=end_date,
                amount_paid=payment.amount,
                status=SubscriptionStatus.ACTIVE
            )
            session.add(new_subscription)

            # ✅ Flush to get subscription ID before updating payment
            await session.flush()

            # ✅ Link payment to the new subscription
            payment.subscription_id = new_subscription.id
            logger.info(f"New subscription created with ID {new_subscription.id} for user {payment.user_id}")

        # ✅ Final commit after all updates
        await session.commit()
        logger.info(f"Payment {payment.order_id} processed successfully with status {payment.status}")

        # Handle 3DS/REDIRECT cases
        if payment.status in ["3DS_VERIFICATION", "PENDING"] and redirect_url:
            return JSONResponse({
                "status": "redirect_required",
                "redirect_url": redirect_url
            })

        return JSONResponse({
            "status": "processed",
            "order_id": order_id,
            "payment_status": payment.status
        })

    except Exception as e:
        logger.error(f"Callback processing error: {str(e)}", exc_info=True)
        await session.rollback()
        return JSONResponse(
            {"error": "Internal server error"},
            status_code=500
        )


@router.get("/payment/status/{order_id}")
async def check_payment_status(order_id: str, session: AsyncSession = Depends(get_session)):
    """ Fetch payment status from EDFAPay using order_id """
    try:
        result = await session.execute(select(Payment).where(Payment.order_id == order_id))
        payment = result.scalars().first()

        if not payment or not payment.trans_id:
            raise HTTPException(status_code=404, detail="Payment ID not found. Wait for callback.")

        hash_value = compute_hash(payment.trans_id, settings.EDFAPAY_PASSWORD)

        payload = {
            "order_id": order_id,
            "merchant_id": settings.EDFAPAY_MERCHANT_ID,
            "gway_Payment_Id": payment.trans_id,
            "hash": hash_value
        }

        response = requests.post(settings.EDFAPAY_STATUS_URL, json=payload)
        response_data = response.json()

        if response.status_code == 200:
            return {"status": "success", "payment_status": response_data}
        else:
            raise HTTPException(status_code=400, detail=response_data)

    except Exception as e:
        logger.error(f"Error fetching payment status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
