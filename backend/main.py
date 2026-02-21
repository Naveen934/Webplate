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
import requests
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
try:
    from sqlalchemy import text, inspect as sa_inspect
    _insp = sa_inspect(database.engine)
    _existing_cols = [col["name"] for col in _insp.get_columns("orders")]

    with database.engine.connect() as _conn:
        # Drop stale columns that belonged to the old single-table order design
        # These cause NOT NULL violations since the new design uses order_items table
        _stale_cols = ["product_id", "quantity", "price", "product_name"]
        for _col in _stale_cols:
            if _col in _existing_cols:
                print(f"Schema migration: dropping stale column '{_col}' from orders table...")
                _conn.execute(text(f"ALTER TABLE orders DROP COLUMN IF EXISTS {_col}"))
                _conn.commit()
                print(f"  -> '{_col}' dropped.")

        # Re-inspect after drops
        _insp2 = sa_inspect(database.engine)
        _existing_cols = [col["name"] for col in _insp2.get_columns("orders")]

        # Add any missing required columns
        _migrations = {
            "user_id":      "ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)",
            "total_amount": "ALTER TABLE orders ADD COLUMN total_amount FLOAT",
            "status":       "ALTER TABLE orders ADD COLUMN status VARCHAR DEFAULT 'pending'",
            "created_at":   "ALTER TABLE orders ADD COLUMN created_at VARCHAR",
        }
        for _col, _sql in _migrations.items():
            if _col not in _existing_cols:
                print(f"Schema migration: adding column '{_col}' to orders table...")
                _conn.execute(text(_sql))
                _conn.commit()
                print(f"  -> '{_col}' added.")

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
        
        # Integrate with Payment Gateway
        # Use the URL where the Payment_gateway service is running
        PAYMENT_GATEWAY_URL = os.getenv("PAYMENT_GATEWAY_URL", "http://localhost:8001").rstrip('/')
        
        payment_data = {
            "amount": order.total_amount,
            "payer_name": current_user.full_name,
            "note": f"Order #{db_order.id}",
            "transaction_id": f"ORD{db_order.id}-{int(time.time())}"
        }
        
        print(f"Connecting to payment gateway at: {PAYMENT_GATEWAY_URL}/payment/create")
        try:
            response = requests.post(f"{PAYMENT_GATEWAY_URL}/payment/create", json=payment_data, timeout=5)
            print(f"Payment gateway response status: {response.status_code}")
            
            if response.status_code == 200:
                payment_info = response.json()
                # Prepend the gateway URL if pay_url is relative
                pay_url = payment_info.get("pay_url")
                if pay_url and pay_url.startswith("/"):
                    pay_url = f"{PAYMENT_GATEWAY_URL}{pay_url}"
                
                print(f"Payment session created: {pay_url}")
                return {
                    "order_id": db_order.id,
                    "payment_url": pay_url,
                    "transaction_id": payment_info.get("transaction_id")
                }
            else:
                print(f"Payment gateway error details: {response.text}")
                return {
                    "order_id": db_order.id,
                    "payment_url": None,
                    "message": "Payment gateway returned an error, but order saved."
                }
        except requests.exceptions.RequestException as e:
            print(f"Payment gateway connection error: {e}")
            return {
                "order_id": db_order.id,
                "payment_url": None,
                "message": "Payment system temporarily unreachable."
            }
        except Exception as e:
            print(f"Unexpected payment gateway error: {e}")
            return {
                "order_id": db_order.id,
                "payment_url": None,
                "message": "Payment system encountered an unexpected error."
            }

    except Exception as e:
        print(f"Error creating order: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@app.get("/contact-info/", tags=["Contact"])
def get_contact_info():
    contact = config.get("contact", {})
    return {
        "phone": contact.get("phone", "N/A"),
        "email": contact.get("email", "N/A")
    }
