"""Engine SQLAlchemy, sessao e dependencia get_db para injecao nas rotas."""

# Configuracao da ligacao SQLAlchemy e sessoes da BD.
import os
from collections.abc import Generator
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

# backend/.env (mesmo nivel que requirements.txt)
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

DATABASE_URL = (os.getenv("DATABASE_URL") or "").strip()
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL nao definida. Cria o ficheiro backend/.env com DATABASE_URL=... "
        "(PostgreSQL local; ver README)."
    )

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Abre sessao por pedido HTTP e fecha ao terminar (padrao FastAPI)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
