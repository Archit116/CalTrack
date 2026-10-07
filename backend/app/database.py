import sqlitecloud
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import StaticPool

from .config import get_settings

settings = get_settings()
database_url = settings.database_url


def get_sqlitecloud_connection():
    """Create a new SQLiteCloud connection with patched create_function"""
    conn = sqlitecloud.connect(database_url)

    # Patch create_function to handle 'deterministic' argument
    # SQLiteCloud doesn't support this argument but SQLAlchemy passes it
    original_create_function = conn.create_function
    def patched_create_function(name, num_params, func, **kwargs):
        # Ignore deterministic and other kwargs
        return original_create_function(name, num_params, func)
    conn.create_function = patched_create_function

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
