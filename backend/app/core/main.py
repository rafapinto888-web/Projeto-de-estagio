"""Ponto de entrada FastAPI: CORS, seed inicial e registo de routers."""

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.bootstrap import garantir_utilizador_admin_inicial
from app.core.config import APP_ENV, CORS_ORIGINS
from app.core.deps import get_current_user
from app.core.openapi import configure_openapi
from app.core.security import SECRET_KEY
from app.routes.auth import router as auth_router
from app.routes.computadores import router as computadores_router
from app.routes.inventarios import router as inventarios_router
from app.routes.localizacoes import router as localizacoes_router
from app.routes.pesquisa import router as pesquisa_router
from app.routes.perfis import router as perfis_router
from app.routes.utilizadores import router as utilizadores_router
from app.database.connection import SessionLocal, engine
from app.models.sessao_db import SessaoDB
from app.models.utilizador_db import UtilizadorDB

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ao arranque: garante tabela de sessoes e utilizador admin inicial."""
    SessaoDB.__table__.create(bind=engine, checkfirst=True)
    db = SessionLocal()
    try:
        garantir_utilizador_admin_inicial(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="API de Inventario",
    version="0.1.0",
    swagger_ui_parameters={"withCredentials": True},
    lifespan=lifespan,
)

configure_openapi(app)

# CORS: lista em app.core.config (INVENTARIO_CORS_ORIGINS); ver docstring em config.py.
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if APP_ENV == "production" and SECRET_KEY == "inventario-dev-secret-key-change-in-production":
    logger.warning(
        "SECRET_KEY por defeito em producao — define SECRET_KEY no ambiente."
    )

app.include_router(computadores_router)
app.include_router(auth_router)
app.include_router(inventarios_router)
app.include_router(localizacoes_router)
app.include_router(pesquisa_router)
app.include_router(perfis_router)
app.include_router(utilizadores_router)


@app.get("/", tags=["Root"])
def root(current_user: UtilizadorDB = Depends(get_current_user)):
    return {
        "mensagem": "API de inventario a funcionar",
        "utilizador": current_user.username,
    }
