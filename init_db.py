from backend.database import engine, Base
import backend.models

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("Tables created.")
