"""Configuracao da aplicacao via variaveis de ambiente.

Variaveis usadas pelo projeto de inventario:
  INVENTARIO_APP_ENV                — development | production
  INVENTARIO_CORS_ORIGINS           — origens do frontend (lista separada por virgulas)
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# backend/.env — carrega antes de qualquer os.getenv neste modulo.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")


# ---------------------------------------------------------------------------
# Ambiente da aplicacao
# ---------------------------------------------------------------------------

APP_ENV = os.getenv("INVENTARIO_APP_ENV", "development").strip().lower()


# ---------------------------------------------------------------------------
# CORS (alinhado com frontend Vite + Docker do repositorio)
# ---------------------------------------------------------------------------
#
# O browser so envia pedidos credenciados (cookies / Authorization) para a API
# se a origem da pagina estiver em CORS_ORIGINS. A API usa allow_credentials=True.
#
# Defaults cobrem o arranque habitual deste repo:
#   - frontend/vite.config.js — servidor dev na porta 5173 (host 0.0.0.0)
#   - docker-compose.yml — servico web-dev expoe 5173:5173
#   - acesso pelo browser no PC: localhost e 127.0.0.1
#
# Em producao define INVENTARIO_CORS_ORIGINS com o(s) URL(s) publico(s) do frontend,
# por exemplo: https://inventario.empresa.pt
#
# Se acederes ao Vite a partir de outro PC na rede (http://IP-DO-PC:5173), acrescenta
# essa origem explicitamente na variavel de ambiente.
#
# Nao uses "*" com credentials=True no CORSMiddleware (comportamento incorreto / inseguro).

_ENV_CORS = "INVENTARIO_CORS_ORIGINS"

# Origens por defeito: mesma porta que frontend/vite.config.js e perfil dev-live do compose.
_DEFAULT_CORS_ORIGINS: tuple[str, ...] = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:80",
)


def _parse_lista_origens_cors(valor_bruto: str) -> list[str]:
    """Separa por virgula, faz strip e remove entradas vazias."""
    return [o.strip() for o in valor_bruto.split(",") if o.strip()]


_cors_raw = os.getenv(_ENV_CORS, ",".join(_DEFAULT_CORS_ORIGINS))
CORS_ORIGINS = _parse_lista_origens_cors(_cors_raw)
