import sys
import os
from sqlalchemy import inspect

# Add backend to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from database import engine, SQLALCHEMY_DATABASE_URL

def debug_db():
    print(f"DATABASE_URL (masked): {SQLALCHEMY_DATABASE_URL[:15]}...")
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Tables found: {tables}")
        
        if 'orders' in tables:
            columns = [c['name'] for c in inspector.get_columns('orders')]
            print(f"Columns in 'orders': {columns}")
        else:
            print("'orders' table NOT found in this database.")
            
    except Exception as e:
        print(f"Error accessing DB: {e}")

if __name__ == "__main__":
    debug_db()
