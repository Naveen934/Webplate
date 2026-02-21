from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import yaml
import os
import sys

# Add backend directory to path so absolute imports work on Vercel
sys.path.insert(0, os.path.dirname(__file__))

import models
import schemas
import crud
import database
import auth
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import urllib.parse
from datetime import timedelta
import time

# Ensure tables exist (especially important for PostgreSQL/Supabase)
try:
    print("Initializing database tables...")
    models.Base.metadata.create_all(bind=database.engine)
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Error initializing tables: {e}")

# Run schema migration to fix orders table schema
# Strategy: if any stale columns exist, drop order_items + orders and recreate fresh
try:
    from sqlalchemy import text, inspect as sa_inspect
    _insp = sa_inspect(database.engine)
    _existing_cols = [col["name"] for col in _insp.get_columns("orders")]

    # Stale columns from old designs that have NOT NULL constraints blocking inserts
    _stale = ["product_id", "quantity", "price", "product_name",
               "customer_name", "customer_email", "customer_phone", "shipping_address"]

    _needs_recreate = any(c in _existing_cols for c in _stale)

    if _needs_recreate:
        print("Schema migration: stale columns detected - dropping and recreating orders tables...")
        with database.engine.connect() as _conn:
            _conn.execute(text("DROP TABLE IF EXISTS order_items CASCADE"))
            _conn.execute(text("DROP TABLE IF EXISTS orders CASCADE"))
            _conn.commit()
            print("  -> orders and order_items tables dropped.")
        # Recreate with current models
        models.Base.metadata.create_all(bind=database.engine)
        print("  -> orders and order_items tables recreated cleanly.")
    else:
        # Just add any missing columns (safe path when table is already correct)
        with database.engine.connect() as _conn:
            _migrations = {
                "user_id":        "ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)",
                "total_amount":   "ALTER TABLE orders ADD COLUMN total_amount FLOAT",
                "status":         "ALTER TABLE orders ADD COLUMN status VARCHAR DEFAULT 'pending'",
                "created_at":     "ALTER TABLE orders ADD COLUMN created_at VARCHAR",
                "transaction_id": "ALTER TABLE orders ADD COLUMN transaction_id VARCHAR",
                "utr_number":     "ALTER TABLE orders ADD COLUMN utr_number VARCHAR",
            }
            for _col, _sql in _migrations.items():
                if _col not in _existing_cols:
                    print(f"Schema migration: adding column '{_col}' to orders...")
                    _conn.execute(text(_sql))
                    _conn.commit()

    print("Schema migration complete.")
except Exception as e:
    print(f"Schema migration warning: {e}")

app = FastAPI(
    title="Leaf Plate Sales API",
    description="API for Leaf Plate Sales Business",
    version="1.0.0"
)

# Load config
config_path = os.path.join(os.path.dirname(__file__), "../config/config.yaml")
if os.path.exists(config_path):
    with open(config_path, "r") as f:
        config = yaml.safe_load(f)
else:
    config = {"api": {"allow_origins": ["*"]}}

origins = config.get("api", {}).get("allow_origins", ["*"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing subject",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_data = schemas.TokenData(email=email)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = crud.get_user_by_email(db, email=token_data.email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Welcome to Leaf Plate Sales API"}

@app.get("/products/", response_model=list[schemas.Product], tags=["Products"])
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    products = crud.get_products(db, skip=skip, limit=limit)
    return products

@app.post("/products/", response_model=schemas.Product, status_code=status.HTTP_201_CREATED, tags=["Products"])
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    return crud.create_product(db=db, product=product)

# --- Auth Routes ---

@app.post("/auth/register", response_model=schemas.User, tags=["Auth"])
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = crud.get_user_by_email(db, email=user.email)
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        return crud.create_user(db=db, user=user)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected registration error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Registration failed due to server error: {str(e)}")

@app.post("/auth/token", response_model=schemas.Token, tags=["Auth"])
async def login_for_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.User, tags=["Auth"])
async def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/contact/", response_model=schemas.Contact, status_code=status.HTTP_201_CREATED, tags=["Contact"])
def create_contact(contact: schemas.ContactCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_contact(db=db, contact=contact)
    except Exception as e:
        print(f"Error creating contact: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.post("/orders/", tags=["Orders"])
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Ensure user has shipping details
    if not current_user.shipping_address or not current_user.phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shipping address and phone number are required to place an order. Please update your profile."
        )

    try:
        # Create order in DB
        db_order = crud.create_order(db=db, order=order, user_id=current_user.id)

        # --- Inline UPI Payment Generation (no external service needed) ---
        RECEIVER_UPI_ID = os.getenv("RECEIVER_UPI_ID", "naveen1998726-1@okicici")
        RECEIVER_NAME   = os.getenv("RECEIVER_NAME", "Naveen")
        transaction_id  = f"ORD{db_order.id}-{int(time.time())}"

        # Save transaction_id to order record
        try:
            db_order.transaction_id = transaction_id
            db.commit()
        except Exception:
            pass

        upi_params = {
            "pa": RECEIVER_UPI_ID,
            "pn": RECEIVER_NAME,
            "am": f"{order.total_amount:.2f}",
            "cu": "INR",
            "tn": f"Order #{db_order.id}",
            "tr": transaction_id,
        }
        upi_uri = "upi://pay?" + urllib.parse.urlencode(upi_params)

        # GPay Android intent deep-link
        gpay_url = (
            "intent://pay?" + urllib.parse.urlencode(upi_params)
            + "#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end"
        )

        print(f"UPI payment link generated for order #{db_order.id}: {upi_uri}")
        return {
            "order_id": db_order.id,
            "transaction_id": transaction_id,
            "upi_uri": upi_uri,
            "gpay_url": gpay_url,
            "message": "Order placed! Scan the QR code or use UPI app to pay."
        }

    except Exception as e:
        print(f"Error creating order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.post("/orders/{order_id}/confirm", tags=["Orders"])
def confirm_order_payment(
    order_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Customer submits UTR number after completing UPI payment.
    Validates UTR format (must be exactly 12 digits — the real UPI/IMPS standard).
    Updates order status to 'awaiting_verification'.
    """
    import re

    db_order = db.query(models.Order).filter(
        models.Order.id == order_id,
        models.Order.user_id == current_user.id
    ).first()

    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    if db_order.status in ("awaiting_verification", "confirmed"):
        return {
            "message": "Payment already submitted for this order. We are verifying it.",
            "order_id": order_id,
            "status": db_order.status
        }

    utr = payload.get("utr_number", "").strip()

    # --- UTR Format Validation ---
    # Real UPI/IMPS UTR numbers are ALWAYS exactly 12 digits
    if not utr:
        raise HTTPException(status_code=400, detail="UTR number is required.")

    if not re.fullmatch(r"\d{12}", utr):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid UTR format. A valid UPI/IMPS UTR number is always exactly "
                "12 digits (e.g. 407123456789). Please check your GPay / PhonePe "
                "transaction history and enter the correct UTR."
            )
        )

    # --- Duplicate UTR Check ---
    # Prevent the same UTR being used for multiple orders
    existing = db.query(models.Order).filter(
        models.Order.utr_number == utr,
        models.Order.id != order_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=(
                f"This UTR ({utr}) has already been used for another order. "
                "Each payment has a unique UTR. Please check your transaction history."
            )
        )

    # Save UTR and mark as awaiting verification (not yet confirmed)
    db_order.utr_number = utr
    db_order.status = "awaiting_verification"
    db.commit()

    print(f"Order #{order_id} UTR submitted: {utr} — awaiting manual verification")
    return {
        "message": (
            "UTR submitted successfully! Your order is now awaiting verification. "
            "We will confirm it after checking your payment in our bank account. "
            "This usually takes a few minutes to a few hours."
        ),
        "order_id": order_id,
        "utr_number": utr,
        "status": "awaiting_verification"
    }

@app.get("/admin/orders", tags=["Admin"])
def get_all_orders(x_admin_key: str = None, db: Session = Depends(get_db)):
    """
    Admin endpoint to list all orders with customer and item details.
    Pass x_admin_key query param equal to ADMIN_PASSWORD env var.
    """
    import os as _os
    secret = _os.getenv("ADMIN_PASSWORD", "Naveen12345")
    if x_admin_key != secret:
        raise HTTPException(status_code=403, detail="Forbidden: invalid admin password")

    orders = db.query(models.Order).order_by(models.Order.id.desc()).all()
    result = []
    for o in orders:
        user = o.user
        result.append({
            "order_id": o.id,
            "status": o.status,
            "total_amount": o.total_amount,
            "transaction_id": o.transaction_id,
            "utr_number": o.utr_number,
            "created_at": o.created_at,
            "customer": {
                "name": user.full_name if user else "—",
                "email": user.email if user else "—",
                "phone": user.phone if user else "—",
                "shipping_address": user.shipping_address if user else "—",
            },
            "items": [
                {
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "price": item.price,
                }
                for item in o.items
            ],
        })
    return result

@app.patch("/admin/orders/{order_id}/status", tags=["Admin"])
def update_order_status(order_id: int, payload: dict, x_admin_key: str = None, db: Session = Depends(get_db)):
    """
    Admin endpoint to update order status (confirm / cancel).
    Pass x_admin_key query param equal to ADMIN_PASSWORD env var.
    """
    import os as _os
    secret = _os.getenv("ADMIN_PASSWORD", "Naveen12345")
    if x_admin_key != secret:
        raise HTTPException(status_code=403, detail="Forbidden: invalid admin password")

    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = payload.get("status")
    allowed = {"pending", "awaiting_verification", "confirmed", "cancelled"}
    if new_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")

    db_order.status = new_status
    db.commit()
    print(f"Admin: order #{order_id} status -> {new_status}")
    return {"order_id": order_id, "status": new_status}

@app.get("/contact-info/", tags=["Contact"])
def get_contact_info():
    contact = config.get("contact", {})
    return {
        "phone": contact.get("phone", "N/A"),
        "email": contact.get("email", "N/A")
    }
