import sys
import os

# Add backend to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from database import engine
from sqlalchemy import inspect

def check_tables():
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables in database: {tables}")
    if "users" in tables:
        print("Success: 'users' table exists.")
    else:
        print("Error: 'users' table is missing!")

if __name__ == "__main__":
    check_tables()
