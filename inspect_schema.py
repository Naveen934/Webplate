import sys
import os

# Add backend to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from database import engine
from sqlalchemy import inspect

def inspect_orders():
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('orders')]
    print(f"Columns in 'orders' table: {columns}")
    
    expected_columns = ['id', 'user_id', 'total_amount', 'status', 'created_at']
    missing = [c for c in expected_columns if c not in columns]
    
    if missing:
        print(f"Missing columns: {missing}")
    else:
        print("Schema matches models.py")

if __name__ == "__main__":
    inspect_orders()
