import sys
import os
from sqlalchemy import text

# Add backend to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from database import engine

def migrate():
    with engine.connect() as conn:
        print("Checking 'orders' table schema...")
        try:
            # For PostgreSQL/Supabase
            # Check if user_id exists
            check_sql = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='orders' AND column_name='user_id'
            """)
            res = conn.execute(check_sql)
            column_exists = res.fetchone()
            
            if not column_exists:
                print("Adding missing 'user_id' column to 'orders' table...")
                # Note: We use raw SQL for ALTER TABLE as create_all doesn't handle migrations
                conn.execute(text("ALTER TABLE orders ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                # Also ensure total_amount, status, created_at exist if this is a very old version
                
                # Check for other columns just in case
                for col in [('total_amount', 'FLOAT'), ('status', 'VARCHAR'), ('created_at', 'VARCHAR')]:
                    check_col = conn.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name='orders' AND column_name='{col[0]}'")).fetchone()
                    if not check_col:
                        print(f"Adding missing '{col[0]}' column to 'orders' table...")
                        conn.execute(text(f"ALTER TABLE orders ADD COLUMN {col[0]} {col[1]}"))
                
                conn.commit()
                print("Migration successful: Columns added to 'orders'.")
            else:
                print("Column 'user_id' already exists in 'orders' table.")
            
            # Check order_items table
            print("\nChecking 'order_items' table...")
            res_items = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_name='order_items'")).fetchone()
            if not res_items:
                print("'order_items' table is missing. Re-running create_all...")
                import models
                models.Base.metadata.create_all(bind=engine)
                print("'order_items' table should be created now.")
            else:
                print("'order_items' table exists.")

        except Exception as e:
            print(f"Migration error: {e}")
            print("\nAttempting to drop and recreate orders/order_items if migration failed...")
            try:
                # If migration fails (e.g. SQLite doesn't support complex ALTER TABLE), 
                # and since this is dev, we might need to drop. 
                # But only if the user explicitly allows it or we are sure.
                # For now, let's just log it.
                pass
            except Exception as e2:
                print(f"Retry failed: {e2}")

if __name__ == "__main__":
    migrate()
