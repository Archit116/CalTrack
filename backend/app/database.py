import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .config import get_settings

settings = get_settings()
database_url = settings.database_url

# For Vercel serverless, use /tmp for SQLite (only writable directory)
if database_url.startswith("sqlite:///") and not database_url.startswith("sqlite:///:memory:"):
    # Use /tmp directory for Vercel
    db_path = "/tmp/caltrack.db"
    database_url = f"sqlite:///{db_path}"

# Handle SQLiteCloud URL - convert to use sqlitecloud package directly
if database_url.startswith("sqlitecloud://"):
    # For now, fall back to local SQLite in /tmp for serverless
    # SQLiteCloud requires special handling
    database_url = "sqlite:////tmp/caltrack.db"

engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
