import libsql_experimental as libsql
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import StaticPool

from .config import get_settings

settings = get_settings()


def get_turso_connection():
    """Create a Turso/libsql connection with patched methods"""
    url = settings.turso_database_url
    token = settings.turso_auth_token
    conn = libsql.connect(database=url, auth_token=token)

    # Patch create_function to no-op (SQLAlchemy tries to use it for regexp)
    conn.create_function = lambda *args, **kwargs: None

    return conn


# Use libsql with SQLAlchemy via creator pattern
engine = create_engine(
    "sqlite://",
    creator=get_turso_connection,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False},
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
