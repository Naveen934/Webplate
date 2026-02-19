from sqlalchemy import Column, Integer, String, Text, Boolean, Float
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    price = Column(Float)
    image_url = Column(String)
    is_available = Column(Boolean, default=True)

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    message = Column(Text)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer)
    product_name = Column(String)
    customer_name = Column(String)
    customer_email = Column(String)
    quantity = Column(Integer, default=1)
    status = Column(String, default="pending")  # pending, completed, cancelled
