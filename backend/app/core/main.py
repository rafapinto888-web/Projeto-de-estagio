"""Ponto de entrada FastAPI: CORS e registo de routers."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import APP_ENV, CORS_ORIGINS
from app.core.security import SECRET_KEY
from app.routes.auth import router as auth_router
from app.routes.computadores import router as computadores_router
from app.routes.inventarios import router as inventarios_router
from app.routes.localizacoes import router as localizacoes_router
from app.routes.pesquisa import router as pesquisa_router
from app.routes.perfis import router as perfis_router
from app.routes.utilizadores import router as utilizadores_router

logger = logging.getLogger(__name__)

app = FastAPI(
    title="API de Inventario",
    version="0.1.0",
    description="API para gestao de inventario e computadores.",
)

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
def root():
    return {"mensagem": "API de inventario a funcionar"}
