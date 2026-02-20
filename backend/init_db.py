from database import engine, Base
import models
from sqlalchemy.orm import Session
from database import SessionLocal

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if products exist
        product_count = db.query(models.Product).count()
        if product_count == 0:
            print("Adding sample products...")
            sample_products = [
                models.Product(
                    name="Premium Dinner Plate (12 inch)",
                    description="Our largest and sturdiest plate, perfect for main courses. Eco-friendly and biodegradable.",
                    price=25.0,
                    image_url="https://images.unsplash.com/photo-1594910403546-193641328905?w=500",
                    is_available=True
                ),
                models.Product(
                    name="Standard Breakfast Plate (8 inch)",
                    description="Ideal for appetizers, desserts, or breakfast. Elegant and sustainable.",
                    price=15.0,
                    image_url="https://images.unsplash.com/photo-1594910403336-d86b77943c5b?w=500",
                    is_available=True
                ),
                models.Product(
                    name="Leaf Bowl (250ml)",
                    description="Perfect for soups, salads, and snacks. Lightweight yet durable.",
                    price=10.0,
                    image_url="https://images.unsplash.com/photo-1594910403454-150641328905?w=500",
                    is_available=True
                )
            ]
            db.add_all(sample_products)
            db.commit()
            print("Sample products added.")
        else:
            print(f"Database already has {product_count} products.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
