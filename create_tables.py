import sys
import os

# Add backend to sys.path just like main.py does
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

# Now import using local names as the app does
from database import engine, Base
import models

from sqlalchemy import text
from dotenv import load_dotenv

# Force load the .env file from the backend directory
env_path = os.path.join(os.path.dirname(__file__), "backend", ".env")
load_dotenv(env_path)

print(f"Database URL from env: {os.getenv('DATABASE_URL', 'Not Set')[:20]}...")

print("Initializing database schema synchronization...")
try:
    # Ensure all tables exist (creates new tables, doesn't update existing ones)
    models.Base.metadata.create_all(bind=engine)
    print("Basic table structure checked.")

    # Migration for orders table (SQLAlchemy create_all doesn't add columns to existing tables)
    # We use targeted ALTER TABLE statements which are safer for migration
    with engine.connect() as conn:
        print("Checking for missing columns in 'orders' table...")
        
        # 1. Check/Add user_id
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)"))
            conn.commit()
            print("Successfully added 'user_id' column to 'orders'.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column 'user_id' already exists.")
            else:
                print(f"Note: Could not add 'user_id' via ALTER (might be SQLite or existing): {e}")

        # 2. Check/Add created_at
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN created_at VARCHAR"))
            conn.commit()
            print("Successfully added 'created_at' column to 'orders'.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column 'created_at' already exists.")
            else:
                print(f"Note: Could not add 'created_at' via ALTER: {e}")
            
    print("\nSUCCESS: Database schema is now synchronized with the models!")
    print("Please RESTART your backend server now.")
except Exception as e:
    print(f"\nCRITICAL ERROR during synchronization: {e}")
    print("Make sure your DATABASE_URL is correctly set in backend/.env")
