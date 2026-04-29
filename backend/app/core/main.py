# Arranque da API FastAPI e registo de routers.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy import inspect

from app.database.connection import Base, engine
from app.models.computador_db import ComputadorDB
from app.models.dispositivo_descoberto_db import DispositivoDescobertoDB
from app.models.inventario_db import InventarioDB
from app.models.localizacao_db import LocalizacaoDB
from app.models.log_dispositivo_db import LogDispositivoDB
from app.models.log_sistema_db import LogSistemaDB
from app.models.perfil_db import PerfilDB
from app.models.utilizador_db import UtilizadorDB
from app.routes.auth import router as auth_router
from app.routes.computadores import router as computadores_router
from app.routes.inventarios import router as inventarios_router
from app.routes.localizacoes import router as localizacoes_router
from app.routes.pesquisa import router as pesquisa_router
from app.routes.perfis import router as perfis_router
from app.routes.utilizadores import router as utilizadores_router

app = FastAPI(
    title="API de Inventario",
    version="0.1.0",
    description="API para gestao de inventario e computadores.",
)

# Permite frontend local durante desenvolvimento.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def garantir_compatibilidade_schema_sqlite() -> None:
    with engine.begin() as connection:
        inspetor = inspect(connection)

        def adicionar_coluna_se_faltar(tabela: str, coluna: str, tipo_sqlite: str, tipo_outros: str) -> None:
            try:
                colunas = {c["name"] for c in inspetor.get_columns(tabela)}
            except Exception:
                return

            if coluna in colunas:
                return

            tipo = tipo_sqlite if engine.dialect.name == "sqlite" else tipo_outros
            connection.execute(text(f"ALTER TABLE {tabela} ADD COLUMN {coluna} {tipo}"))

        # Compatibilidade antiga para SQLite (computadores)
        adicionar_coluna_se_faltar("computadores", "inventario_id", "INTEGER", "INTEGER")
        adicionar_coluna_se_faltar("computadores", "localizacao_id", "INTEGER", "INTEGER")
        adicionar_coluna_se_faltar("computadores", "utilizador_responsavel_id", "INTEGER", "INTEGER")

        # Campos de tipo/rede para inventarios.
        adicionar_coluna_se_faltar("inventarios", "tipo_inventario", "TEXT DEFAULT 'normal'", "VARCHAR(20) DEFAULT 'normal'")
        adicionar_coluna_se_faltar("inventarios", "rede", "TEXT", "VARCHAR(50)")

        # Novo campo do scan (dispositivos_descobertos)
        adicionar_coluna_se_faltar("dispositivos_descobertos", "mac_address", "TEXT", "VARCHAR(17)")
        adicionar_coluna_se_faltar("dispositivos_descobertos", "marca", "TEXT", "VARCHAR(100)")
        adicionar_coluna_se_faltar("dispositivos_descobertos", "numero_serie", "TEXT", "VARCHAR(120)")
        adicionar_coluna_se_faltar("dispositivos_descobertos", "sistema_operativo", "TEXT", "VARCHAR(120)")
        adicionar_coluna_se_faltar("dispositivos_descobertos", "origem_registo", "TEXT DEFAULT 'scan'", "VARCHAR(30) DEFAULT 'scan'")
        adicionar_coluna_se_faltar("dispositivos_descobertos", "ultima_vez_ativo_em", "TEXT", "TIMESTAMP")


# Importa os modelos antes do create_all para registarem as tabelas na metadata.
Base.metadata.create_all(bind=engine)
garantir_compatibilidade_schema_sqlite()

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
