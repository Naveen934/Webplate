import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Try to load env from multiple locations
load_dotenv() # current dir
load_dotenv("backend/.env") # backend dir

def fix():
    url = os.getenv("DATABASE_URL")
    if not url or "sqlite" in url:
        print("ERROR: DATABASE_URL is either not set or points to SQLite.")
        print("I need to connect to your PostgreSQL/Supabase database to fix the schema.")
        print("\nPlease run this script as follows:")
        print("  Windows: SET DATABASE_URL=your_postgresql_url && python fix_postgres.py")
        print("  Bash: DATABASE_URL=your_postgresql_url python fix_postgres.py")
        return

    print(f"Connecting to database: {url[:25]}...")
    engine = create_engine(url)
    
    with engine.connect() as conn:
        print("Checking 'orders' table...")
        
        # Add user_id if missing
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)"))
            conn.commit()
            print("Successfully added 'user_id' column.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("'user_id' column already exists.")
            else:
                print(f"Error adding 'user_id': {e}")

        # Add total_amount if missing
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN total_amount FLOAT"))
            conn.commit()
            print("Successfully added 'total_amount' column.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("'total_amount' column already exists.")
            else:
                print(f"Error adding 'total_amount': {e}")

        # Add status if missing
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN status VARCHAR DEFAULT 'pending'"))
            conn.commit()
            print("Successfully added 'status' column.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("'status' column already exists.")
            else:
                print(f"Error adding 'status': {e}")

        # Add created_at if missing
        try:
            conn.execute(text("ALTER TABLE orders ADD COLUMN created_at VARCHAR"))
            conn.commit()
            print("Successfully added 'created_at' column.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("'created_at' column already exists.")
            else:
                print(f"Error adding 'created_at': {e}")
                
    print("\nDONE! Please RESTART your uvicorn backend server now.")

if __name__ == "__main__":
    fix()
