from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from .config import get_settings

settings = get_settings()

# SQLiteCloud connection using sqlitecloud:// protocol
# The connection string includes the API key as query parameter
engine = create_engine(
    settings.database_url,
    connect_args={"timeout": 30},
    pool_pre_ping=True,
    echo=False
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
