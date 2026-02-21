import sys
import os

# Add backend to sys.path just like main.py does
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

# Now import using local names as the app does
from database import engine, Base
import models

from sqlalchemy import text

print("Initializing database tables...")
try:
    # Ensure all tables exist
    models.Base.metadata.create_all(bind=engine)
    print("Database tables initialized.")

    # Migration for orders table (SQLAlchemy create_all doesn't add columns to existing tables)
    with engine.connect() as conn:
        print("Checking for missing columns in 'orders'...")
        # Check if user_id exists in orders table
        check_sql = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='orders' AND column_name='user_id'
        """)
        res = conn.execute(check_sql)
        if not res.fetchone():
            print("Adding missing 'user_id' column to 'orders' table...")
            conn.execute(text("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)"))
            conn.commit()
            print("Successfully added 'user_id' column.")
        else:
            print("'user_id' column already exists.")
            
    print("Schema synchronization complete!")
except Exception as e:
    print(f"Error during table creation/migration: {e}")
    # Fallback for SQLite which might not have information_schema
    if "sqlite" in str(engine.url):
        print("SQLite detected, create_all should have handled it if table was new.")
