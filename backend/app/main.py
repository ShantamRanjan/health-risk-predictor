"""FastAPI entry point."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api import auth, chat, pdf_report, predict, reports
from app.core.config import settings
from app.core.database import Base, engine, IS_SQLITE
from app.ml.predictor import registry


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables (dev only — use Alembic in prod)
    Base.metadata.create_all(bind=engine)
    # Load all ML models into memory
    registry.load_all()
    yield


app = FastAPI(
    title="AI Health Risk Predictor",
    description="ML-powered multi-disease risk prediction with SHAP explanations and a health-only chatbot.",
    version="1.0.0",
    lifespan=lifespan,
)

origins = [o.strip() for o in settings.FRONTEND_ORIGIN.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(reports.router)
app.include_router(pdf_report.router)
app.include_router(chat.router)


@app.get("/")
def root():
    return {
        "service": "AI Health Risk Predictor",
        "diseases_loaded": registry.diseases(),
        "docs": "/docs",
    }


@app.get("/health")
def healthcheck():
    """Readiness probe — verifies DB and ML models are usable."""
    db_ok = True
    db_error = None
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_ok = False
        db_error = str(e)[:200]
    return {
        "status": "ok" if db_ok else "degraded",
        "database": {
            "connected": db_ok,
            "engine": "sqlite" if IS_SQLITE else "postgresql",
            "error": db_error,
        },
        "models_loaded": registry.diseases(),
    }
