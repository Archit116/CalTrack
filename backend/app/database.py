import sqlitecloud
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import StaticPool

from .config import get_settings

settings = get_settings()
database_url = settings.database_url


def get_sqlitecloud_connection():
    """Create a new SQLiteCloud connection with patched methods"""
    conn = sqlitecloud.connect(database_url)

    # SQLiteCloud doesn't support create_function but SQLAlchemy requires it
    # Make it a no-op to prevent errors
    conn.create_function = lambda *args, **kwargs: None

    return conn


# Use SQLiteCloud with SQLAlchemy
engine = create_engine(
    "sqlite://",
    creator=get_sqlitecloud_connection,
    poolclass=StaticPool,
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
