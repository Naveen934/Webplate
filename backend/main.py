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

# NOTE: Do NOT call create_all() here at module level.
# Vercel serverless functions cannot hold a DB connection at import time.
# Create tables via the Supabase dashboard instead (see README).

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

@app.post("/contact/", response_model=schemas.Contact, status_code=status.HTTP_201_CREATED, tags=["Contact"])
def create_contact(contact: schemas.ContactCreate, db: Session = Depends(get_db)):
    return crud.create_contact(db=db, contact=contact)

@app.get("/contact-info/", tags=["Contact"])
def get_contact_info():
    contact = config.get("contact", {})
    return {
        "phone": contact.get("phone", "N/A"),
        "email": contact.get("email", "N/A")
    }
