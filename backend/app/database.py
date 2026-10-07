import sqlitecloud
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import StaticPool

from .config import get_settings

settings = get_settings()
database_url = settings.database_url

def get_sqlitecloud_connection():
    """Create a new SQLiteCloud connection"""
    return sqlitecloud.connect(database_url)

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
