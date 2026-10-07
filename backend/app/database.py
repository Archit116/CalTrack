import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .config import get_settings

settings = get_settings()
database_url = settings.database_url

# Check if using SQLiteCloud
if database_url.startswith("sqlitecloud://"):
    try:
        import sqlitecloud
        # Create SQLiteCloud connection
        conn = sqlitecloud.connect(database_url)

        # Create engine using raw connection
        from sqlalchemy.pool import StaticPool
        engine = create_engine(
            "sqlite://",
            creator=lambda: conn,
            poolclass=StaticPool,
            connect_args={"check_same_thread": False},
        )
    except Exception as e:
        print(f"SQLiteCloud connection failed: {e}")
        # Fallback to in-memory SQLite
        engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
        )
else:
    # Standard SQLite file or other database
    connect_args = {}
    if database_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    engine = create_engine(database_url, connect_args=connect_args)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
