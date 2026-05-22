"""API minima: sem persistencia nem rotas de negocio (BD removida por decisao de projeto)."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import APP_ENV, CORS_ORIGINS
from app.core.security import SECRET_KEY

logger = logging.getLogger(__name__)

app = FastAPI(
    title="API de Inventario",
    version="0.1.0",
    description="API sem camada de base de dados — rotas a reintroduzir quando a BD existir.",
)

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


@app.get("/", tags=["Root"])
def root():
    return {
        "mensagem": "API sem base de dados ligada",
        "estado": "aguarda nova BD e rotas",
    }
