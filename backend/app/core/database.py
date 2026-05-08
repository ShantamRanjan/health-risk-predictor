"""SQLAlchemy database setup — works seamlessly with SQLite (dev) and Postgres (prod)."""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings


def _normalise_url(url: str) -> str:
    """
    Render / Heroku / Railway often hand out URLs starting with `postgres://`,
    but SQLAlchemy 2.x requires the explicit `postgresql://` driver prefix.
    Also enforce the psycopg2 driver so the same code works everywhere.
    """
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://") and "+" not in url.split("://", 1)[0]:
        url = "postgresql+psycopg2://" + url[len("postgresql://"):]
    return url


DB_URL = _normalise_url(settings.DATABASE_URL)
IS_SQLITE = DB_URL.startswith("sqlite")

engine_kwargs = {"pool_pre_ping": True}
if IS_SQLITE:
    # SQLite needs this so multiple FastAPI threads can share the engine
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # Reasonable Postgres pool defaults for a free-tier app
    engine_kwargs.update({
        "pool_size": 5,
        "max_overflow": 5,
        "pool_recycle": 1800,  # 30 min — avoids stale conns on Neon's idle disconnect
    })

engine = create_engine(DB_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
