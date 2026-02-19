from pydantic import BaseModel
from typing import Optional, List

class ProductBase(BaseModel):
    name: str
    description: str
    price: float
    image_url: str
    is_available: bool = True

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True

class ContactBase(BaseModel):
    name: str
    email: str
    message: str

class ContactCreate(ContactBase):
    pass

class Contact(ContactBase):
    id: int

    class Config:
        from_attributes = True
