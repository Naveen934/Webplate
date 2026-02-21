"""
Migration script: Add missing columns to the 'orders' table.
Run this once to bring the database schema in sync with the SQLAlchemy models.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        # Add user_id column if missing
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)"))
            print("Added column: user_id")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("Column user_id already exists, skipping.")
            else:
                print(f"Error adding user_id: {e}")

        # Add total_amount column if missing
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN total_amount FLOAT"))
            print("Added column: total_amount")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("Column total_amount already exists, skipping.")
            else:
                print(f"Error adding total_amount: {e}")

        # Add status column if missing
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN status VARCHAR DEFAULT 'pending'"))
            print("Added column: status")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("Column status already exists, skipping.")
            else:
                print(f"Error adding status: {e}")

        # Add created_at column if missing
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN created_at VARCHAR"))
            print("Added column: created_at")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("Column created_at already exists, skipping.")
            else:
                print(f"Error adding created_at: {e}")

        conn.commit()
        print("\nMigration complete! Schema is now in sync with models.")

if __name__ == "__main__":
    migrate()
