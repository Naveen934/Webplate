import sys
import os

# Add backend to sys.path just like main.py does
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

# Now import using local names as the app does
from database import engine, Base
import models

print("Creating all tables for:", Base.metadata.tables.keys())
Base.metadata.create_all(bind=engine)
print("Done!")
