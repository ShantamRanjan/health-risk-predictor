"""
First-time database initialisation.

Safe to run repeatedly — `create_all` only creates missing tables.

Usage:
    cd backend
    python -m scripts.init_db
"""
import sys

# Make sure 'app' is importable when run as a module
sys.path.insert(0, ".")

from app.core.database import Base, engine, DB_URL, IS_SQLITE  # noqa: E402
from app.models import User, Prediction, UploadedReport, ChatMessage  # noqa: E402,F401


def main() -> None:
    masked = DB_URL
    if "@" in masked:
        # Hide password if present (postgres://user:pass@host/db)
        head, tail = masked.split("@", 1)
        if ":" in head:
            scheme_user, _ = head.rsplit(":", 1)
            masked = scheme_user + ":****@" + tail

    print(f"Connecting to: {masked}")
    print(f"Backend       : {'SQLite' if IS_SQLITE else 'PostgreSQL'}")

    print("Creating tables…")
    Base.metadata.create_all(bind=engine)

    # Verify
    table_names = sorted(Base.metadata.tables.keys())
    print(f"Tables ready  : {', '.join(table_names)}")
    print("Done.")


if __name__ == "__main__":
    main()
