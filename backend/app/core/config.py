"""Configuracao da aplicacao via variaveis de ambiente."""

import os


def _env_bool(nome: str, *, default: bool = False) -> bool:
    valor = os.getenv(nome, "").strip().lower()
    if valor in ("1", "true", "yes", "on", "sim"):
        return True
    if valor in ("0", "false", "no", "off", "nao", "não"):
        return False
    return default


# Swagger: bypass automatico (Referer /docs) — desligar em producao.
ALLOW_SWAGGER_BYPASS = _env_bool("INVENTARIO_ALLOW_SWAGGER_BYPASS", default=False)

# Origens CORS permitidas (separadas por virgula). Evitar "*" em producao.
_cors_raw = os.getenv(
    "INVENTARIO_CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:80",
)
CORS_ORIGINS = [o.strip() for o in _cors_raw.split(",") if o.strip()]

# Ambiente (opcional): "development" | "production"
APP_ENV = os.getenv("INVENTARIO_APP_ENV", "development").strip().lower()
