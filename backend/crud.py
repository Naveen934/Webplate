from sqlalchemy.orm import Session
import models
import schemas

def get_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()

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
