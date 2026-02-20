import time
import os
import sys
from contextlib import asynccontextmanager
from typing import Dict, Optional

# Add current directory to path so imports work correctly
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from models import (
    PaymentRequest,
    PaymentRecord,
    PaymentStatus,
    PaymentStatusResponse,
    WebhookPayload,
)
from utils.upi import build_upi_uri, build_gpay_intent_url, generate_qr_code_bytes

# ---------------------------------------------------------------------------
# In-memory transaction store (replace with a DB for production)
# ---------------------------------------------------------------------------
transaction_store: Dict[str, PaymentRecord] = {}
utr_store: Dict[str, str] = {}   # utr_number -> transaction_id

# ---------------------------------------------------------------------------
# Shared webhook secret (set via env var in production)
# ---------------------------------------------------------------------------
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "supersecret123change_me")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure directories exist
    os.makedirs("static", exist_ok=True)
    os.makedirs("templates", exist_ok=True)
    yield


app = FastAPI(
    title="UPI Payment Gateway",
    description="0-commission UPI/GPay payment gateway powered by FastAPI",
    version="1.0.0",
    lifespan=lifespan,
)

# Mount static files directory
if os.path.isdir("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/health", tags=["Utility"])
async def health():
    return {"status": "ok", "timestamp": time.time()}


# ---------------------------------------------------------------------------
# Create a payment session
# ---------------------------------------------------------------------------
@app.post("/payment/create", response_model=dict, tags=["Payments"])
async def create_payment(req: PaymentRequest):
    """
    Creates a new payment session.
    Returns:
      - transaction_id
      - upi_uri  (standard UPI URI)
      - gpay_intent_url (Android deep-link for Google Pay)
      - pay_url  (link to the hosted payment page)
    """
    upi_uri = build_upi_uri(
        amount=req.amount,
        note=req.note or "Payment",
        transaction_id=req.transaction_id,
    )
    gpay_intent_url = build_gpay_intent_url(upi_uri)

    record = PaymentRecord(
        transaction_id=req.transaction_id,
        amount=req.amount,
        note=req.note or "Payment",
        payer_name=req.payer_name,
        upi_uri=upi_uri,
    )
    transaction_store[req.transaction_id] = record

    return {
        "transaction_id": req.transaction_id,
        "amount": req.amount,
        "currency": "INR",
        "upi_uri": upi_uri,
        "gpay_intent_url": gpay_intent_url,
        "pay_url": f"/payment/{req.transaction_id}",
        "qr_url": f"/payment/{req.transaction_id}/qr",
        "status": PaymentStatus.PENDING,
    }


# ---------------------------------------------------------------------------
# Payment page (HTML)
# ---------------------------------------------------------------------------
@app.get("/payment/{transaction_id}", response_class=HTMLResponse, tags=["Payments"])
async def payment_page(request: Request, transaction_id: str):
    record = transaction_store.get(transaction_id)
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")

    gpay_intent_url = build_gpay_intent_url(record.upi_uri)

    return templates.TemplateResponse(
        "payment.html",
        {
            "request": request,
            "transaction_id": transaction_id,
            "amount": record.amount,
            "note": record.note,
            "upi_uri": record.upi_uri,
            "gpay_intent_url": gpay_intent_url,
            "status": record.status,
        },
    )


# ---------------------------------------------------------------------------
# QR Code endpoint – returns a PNG image
# ---------------------------------------------------------------------------
@app.get("/payment/{transaction_id}/qr", tags=["Payments"])
async def payment_qr(transaction_id: str):
    record = transaction_store.get(transaction_id)
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")

    png_bytes = generate_qr_code_bytes(record.upi_uri)
    return Response(content=png_bytes, media_type="image/png")


# ---------------------------------------------------------------------------
# Payment status check
# ---------------------------------------------------------------------------
@app.get(
    "/payment/{transaction_id}/status",
    response_model=PaymentStatusResponse,
    tags=["Payments"],
)
async def payment_status(transaction_id: str):
    record = transaction_store.get(transaction_id)
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")

    messages = {
        PaymentStatus.PENDING: "Awaiting payment from customer.",
        PaymentStatus.SUCCESS: "Payment received successfully.",
        PaymentStatus.FAILED: "Payment failed. Please try again.",
        PaymentStatus.EXPIRED: "Payment link has expired.",
    }

    utr = utr_store.get(transaction_id)

    return PaymentStatusResponse(
        transaction_id=record.transaction_id,
        amount=record.amount,
        status=record.status,
        upi_transaction_id=utr,
        message=messages[record.status],
    )


# ---------------------------------------------------------------------------
# Webhook – receives payment confirmation from middleware / manual tool
# ---------------------------------------------------------------------------
@app.post("/webhook/payment", tags=["Webhook"])
async def payment_webhook(payload: WebhookPayload):
    """
    Webhook endpoint to receive payment status updates.
    Send a POST request with a WebhookPayload JSON body to update a transaction.

    Since direct UPI doesn't push webhooks natively, you can:
     1. Use a UPI gateway middleware that calls this endpoint after confirmation.
     2. Manually POST to this endpoint after verifying the UTR in your bank app.
    
    Security: Include the shared secret in 'secret_key' field.
    """
    if payload.secret_key != WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")

    record = transaction_store.get(payload.transaction_id)
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")

    record.status = payload.status
    record.updated_at = time.time()

    if payload.upi_transaction_id:
        utr_store[payload.transaction_id] = payload.upi_transaction_id

    return {
        "message": f"Transaction {payload.transaction_id} updated to {payload.status}",
        "transaction_id": payload.transaction_id,
        "status": payload.status,
    }


# ---------------------------------------------------------------------------
# Manual status update (admin tool) – useful for confirming via bank app
# ---------------------------------------------------------------------------
@app.post("/admin/confirm/{transaction_id}", tags=["Admin"])
async def admin_confirm_payment(
    transaction_id: str,
    utr_number: Optional[str] = None,
    secret: str = "",
):
    """
    Admin endpoint to manually confirm a payment after checking the bank statement.
    Requires the WEBHOOK_SECRET as the 'secret' query parameter.
    """
    if secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")

    record = transaction_store.get(transaction_id)
    if not record:
        raise HTTPException(status_code=404, detail="Transaction not found")

    record.status = PaymentStatus.SUCCESS
    record.updated_at = time.time()

    if utr_number:
        utr_store[transaction_id] = utr_number

    return {
        "message": "Payment confirmed successfully",
        "transaction_id": transaction_id,
        "utr_number": utr_number,
    }


# ---------------------------------------------------------------------------
# List all transactions (admin overview)
# ---------------------------------------------------------------------------
@app.get("/admin/transactions", tags=["Admin"])
async def list_transactions(secret: str = ""):
    if secret != WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")
    return [
        {
            "transaction_id": r.transaction_id,
            "amount": r.amount,
            "note": r.note,
            "status": r.status,
            "created_at": r.created_at,
            "updated_at": r.updated_at,
        }
        for r in transaction_store.values()
    ]
