from pydantic import BaseModel, Field
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

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserBase(BaseModel):
    email: str
    full_name: str
    phone: str = Field(..., min_length=10)
    shipping_address: str = Field(..., min_length=5)

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

class OrderItemBase(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    price: float

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    total_amount: float

class OrderCreate(OrderBase):
    items: List[OrderItemCreate]

class Order(OrderBase):
    id: int
    user_id: int
    status: str
    items: List[OrderItem]

    class Config:
        from_attributes = True
