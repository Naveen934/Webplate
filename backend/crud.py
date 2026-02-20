import models
import schemas
from sqlalchemy.orm import Session
from auth import get_password_hash

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        phone=user.phone,
        shipping_address=user.shipping_address
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_product(db: Session, product: schemas.ProductCreate):
    # Support both Pydantic v1 and v2
    data = product.model_dump() if hasattr(product, "model_dump") else product.dict()
    db_product = models.Product(**data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def create_contact(db: Session, contact: schemas.ContactCreate):
    # Support both Pydantic v1 and v2
    data = contact.model_dump() if hasattr(contact, "model_dump") else contact.dict()
    db_contact = models.Contact(**data)
    db.add(db_contact)
    db.commit()
    db.refresh(db_contact)
    return db_contact

def create_order(db: Session, order: schemas.OrderCreate, user_id: int):
    # Calculate the total amount on the backend for security
    calculated_total = 0
    order_items_data = []
    
    for item in order.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise Exception(f"Product with id {item.product_id} not found")
        
        item_total = product.price * item.quantity
        calculated_total += item_total
        
        order_items_data.append(models.OrderItem(
            product_id=item.product_id,
            product_name=product.name,
            quantity=item.quantity,
            price=product.price
        ))

    db_order = models.Order(
        user_id=user_id,
        total_amount=calculated_total,
        status="pending"
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    for db_item in order_items_data:
        db_item.order_id = db_order.id
        db.add(db_item)
    
    db.commit()
    db.refresh(db_order)
    return db_order
