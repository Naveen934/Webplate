from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

# Supabase requires SSL - add sslmode if not already in URL
if "supabase" in SQLALCHEMY_DATABASE_URL and "sslmode" not in SQLALCHEMY_DATABASE_URL:
    SQLALCHEMY_DATABASE_URL += "?sslmode=require"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
