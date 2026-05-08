"""
First-time database initialisation + lightweight column migrations.

Safe to run repeatedly:
- `Base.metadata.create_all` only creates missing tables.
- `_add_column_if_missing` adds new optional columns to existing tables.

Usage:
    cd backend
    python -m scripts.init_db
"""
import sys

sys.path.insert(0, ".")

from sqlalchemy import text  # noqa: E402

from app.core.database import Base, engine, DB_URL, IS_SQLITE  # noqa: E402
from app.models import User, Prediction, UploadedReport, ChatMessage  # noqa: E402,F401


def _add_column_if_missing(table: str, column_name: str, column_def: str) -> None:
    """
    Add a column with `ALTER TABLE` if it doesn't already exist.
    Works for both SQLite and Postgres (catches the duplicate-column error).
    """
    try:
        with engine.begin() as conn:
            conn.execute(text(f'ALTER TABLE {table} ADD COLUMN {column_name} {column_def}'))
        print(f"  + added {table}.{column_name}")
    except Exception as e:
        msg = str(e).lower()
        if "duplicate" in msg or "already exists" in msg or "duplicate column" in msg:
            return  # column exists — nothing to do
        # Some Postgres errors mention the existing column differently; swallow safely
        if "column" in msg and column_name in msg:
            return
        # Re-raise unknown errors so they're visible
        raise


def main() -> None:
    masked = DB_URL
    if "@" in masked:
        head, tail = masked.split("@", 1)
        if ":" in head:
            scheme_user, _ = head.rsplit(":", 1)
            masked = scheme_user + ":****@" + tail

    print(f"Connecting to: {masked}")
    print(f"Backend       : {'SQLite' if IS_SQLITE else 'PostgreSQL'}")

    print("Creating tables…")
    Base.metadata.create_all(bind=engine)

    # --- Schema migrations: add columns that may be missing on older DBs ---
    print("Running migrations…")
    _add_column_if_missing("users", "age", "INTEGER")
    _add_column_if_missing("users", "sex", "VARCHAR(16)")
    _add_column_if_missing(
        "users", "height_cm", "DOUBLE PRECISION" if not IS_SQLITE else "REAL"
    )
    _add_column_if_missing(
        "users", "weight_kg", "DOUBLE PRECISION" if not IS_SQLITE else "REAL"
    )

    table_names = sorted(Base.metadata.tables.keys())
    print(f"Tables ready  : {', '.join(table_names)}")
    print("Done.")


if __name__ == "__main__":
    main()
