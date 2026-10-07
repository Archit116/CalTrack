import libsql_experimental as libsql
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import StaticPool

from .config import get_settings

settings = get_settings()


class LibsqlConnectionWrapper:
    """Wrapper to make libsql connection compatible with SQLAlchemy's expectations"""

    def __init__(self, conn):
        self._conn = conn

    def __getattr__(self, name):
        return getattr(self._conn, name)

    def create_function(self, *args, **kwargs):
        pass

    def create_aggregate(self, *args, **kwargs):
        pass

    def create_collation(self, *args, **kwargs):
        pass

    def set_authorizer(self, *args, **kwargs):
        pass

    def set_progress_handler(self, *args, **kwargs):
        pass

    def cursor(self):
        return self._conn.cursor()

    def execute(self, *args, **kwargs):
        return self._conn.execute(*args, **kwargs)

    def executemany(self, *args, **kwargs):
        return self._conn.executemany(*args, **kwargs)

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()


def get_turso_connection():
    """Create a Turso/libsql connection wrapped for SQLAlchemy compatibility"""
    url = settings.get_db_url()
    token = settings.get_db_token()

    if not url:
        raise ValueError("TURSO_DATABASE_URL environment variable is not set")

    conn = libsql.connect(database=url, auth_token=token)
    return LibsqlConnectionWrapper(conn)


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
