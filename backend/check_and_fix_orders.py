"""
Check existing columns in orders table and add any missing ones.
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from database import engine
from sqlalchemy import text, inspect

def check_and_fix():
    insp = inspect(engine)
    existing = [col["name"] for col in insp.get_columns("orders")]
    print("Current orders table columns:", existing)

    needed = {
        "user_id":      "ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)",
        "total_amount": "ALTER TABLE orders ADD COLUMN total_amount FLOAT",
        "status":       "ALTER TABLE orders ADD COLUMN status VARCHAR DEFAULT 'pending'",
        "created_at":   "ALTER TABLE orders ADD COLUMN created_at VARCHAR",
    }

    with engine.connect() as conn:
        for col, sql in needed.items():
            if col not in existing:
                print(f"Adding column: {col}")
                conn.execute(text(sql))
                conn.commit()
                print(f"  -> {col} added OK")
            else:
                print(f"  Column {col} already exists, skipping.")

    print("\nDone. Columns now:")
    insp2 = inspect(engine)
    print([c["name"] for c in insp2.get_columns("orders")])

if __name__ == "__main__":
    check_and_fix()
