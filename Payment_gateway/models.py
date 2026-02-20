from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
import uuid
import time


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    EXPIRED = "EXPIRED"


class PaymentRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount in INR (must be > 0)")
    note: Optional[str] = Field(default="Payment", description="Transaction note")
    payer_name: Optional[str] = Field(default=None, description="Name of the payer")
    transaction_id: Optional[str] = Field(
        default=None,
        description="Unique transaction reference ID (auto-generated if not provided)",
    )

    def model_post_init(self, __context):
        if not self.transaction_id:
            self.transaction_id = f"TXN-{uuid.uuid4().hex[:12].upper()}"


class PaymentRecord(BaseModel):
    transaction_id: str
    amount: float
    note: str
    payer_name: Optional[str]
    upi_uri: str
    status: PaymentStatus = PaymentStatus.PENDING
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)


class WebhookPayload(BaseModel):
    """
    Generic webhook payload for receiving payment status updates
    from a middleware or a manual status update tool.
    """
    transaction_id: str
    status: PaymentStatus
    upi_transaction_id: Optional[str] = Field(
        default=None, description="UTR number from the UPI transaction"
    )
    payer_vpa: Optional[str] = Field(
        default=None, description="Payer's VPA (UPI ID)"
    )
    secret_key: str = Field(..., description="Shared secret for webhook verification")


class PaymentStatusResponse(BaseModel):
    transaction_id: str
    amount: float
    status: PaymentStatus
    upi_transaction_id: Optional[str] = None
    message: str
