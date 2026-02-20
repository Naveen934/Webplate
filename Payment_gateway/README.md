# UPI Payment Gateway — FastAPI

A **0-commission** UPI/Google Pay payment gateway built with FastAPI + Python.  
Payments go directly to your bank account via UPI — no third-party fees.

---

## Receiver UPI ID
```
naveen1998726-1@okicici
```

---

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. (Optional) Set a custom webhook secret
set WEBHOOK_SECRET=your_secret_here   # Windows
# export WEBHOOK_SECRET=your_secret_here  # Linux/Mac

# 3. Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Open: **http://localhost:8000/docs** for the interactive API docs.

---

## API Endpoints

### 🔵 Create a Payment
```http
POST /payment/create
Content-Type: application/json

{
  "amount": 500.00,
  "note": "Order #1234",
  "payer_name": "Customer Name"
}
```
**Response includes:**
- `transaction_id` — unique reference
- `upi_uri` — standard UPI deep link
- `gpay_intent_url` — Google Pay specific deep link
- `pay_url` — hosted payment page
- `qr_url` — QR code image URL

---

### 🔵 Payment Page (HTML)
```
GET /payment/{transaction_id}
```
Opens a premium payment page with:
- QR code (desktop)
- "Pay with Google Pay" button (mobile)
- Live status polling every 5 seconds

---

### 🔵 Check Payment Status
```http
GET /payment/{transaction_id}/status
```

---

### 🟡 Webhook — Receive Payment Update
```http
POST /webhook/payment
Content-Type: application/json

{
  "transaction_id": "TXN-XXXXXXXXXXXX",
  "status": "SUCCESS",
  "upi_transaction_id": "UTR1234567890",
  "payer_vpa": "customer@upi",
  "secret_key": "supersecret123change_me"
}
```
> Change the default secret via the `WEBHOOK_SECRET` env variable.

---

### 🔴 Admin — Manually Confirm Payment
After verifying UTR in your bank app:
```http
POST /admin/confirm/{transaction_id}?secret=supersecret123change_me&utr_number=UTR1234567890
```

### 🔴 Admin — List All Transactions
```http
GET /admin/transactions?secret=supersecret123change_me
```

---

## How GPay / UPI Integration Works

```
Customer → Payment Page → Clicks "Pay with GPay"
         → GPay opens with pre-filled amount & UPI ID
         → Customer approves
         → Money hits your account directly (0% fee)
         → You verify UTR & call /admin/confirm or webhook
         → Payment page updates to ✅ Success
```

> **Note:** Native UPI does not push real-time webhooks.  
> For automated confirmation, use a middleware like [Cashfree Payouts](https://www.cashfree.com/) or Razorpay Route **only for the webhook part** (your funds go direct, they only confirm).

---

## File Structure
```
Payment_gateway/
├── main.py              ← FastAPI app & all endpoints
├── models.py            ← Pydantic data models
├── requirements.txt     ← Python dependencies
├── utils/
│   └── upi.py           ← UPI URI builder & QR generator
└── templates/
    └── payment.html     ← Payment UI (dark, premium)
```
