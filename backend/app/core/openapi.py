"""Esquema OpenAPI: autenticacao por cookie de sessao no Swagger."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from app.core.security import SESSION_COOKIE_NAME

# Nome do esquema cookie no Swagger (deve coincidir com scheme_name em deps.py).
SESSION_COOKIE_SCHEME_NAME = "SessionCookieAuth"

# Rotas publicas (unicas sem sessao: iniciar docs e criar sessao/login).
_PUBLIC_PATH_PREFIXES = (
    "/auth/login",
    "/docs",
    "/redoc",
    "/openapi.json",
)


def _path_is_public(path: str) -> bool:
    if path in _PUBLIC_PATH_PREFIXES:
        return True
    if path.startswith("/docs") or path.startswith("/redoc"):
        return True
    return False


def configure_openapi(app: FastAPI) -> None:
    """Regista gerador OpenAPI com cookie de sessao nas rotas protegidas."""

    def custom_openapi():
        if app.openapi_schema:
            return app.openapi_schema

        schema = get_openapi(
            title=app.title,
            version=app.version,
            routes=app.routes,
        )

        components = schema.setdefault("components", {})
        schemes = components.setdefault("securitySchemes", {})
        schemes[SESSION_COOKIE_SCHEME_NAME] = {
            "type": "apiKey",
            "in": "cookie",
            "name": SESSION_COOKIE_NAME,
        }
        schemes.pop("HTTPBasic", None)
        schemes.pop("BearerAuth", None)

        cookie_security = [{SESSION_COOKIE_SCHEME_NAME: []}]

        for path, path_item in schema.get("paths", {}).items():
            if _path_is_public(path):
                continue
            for operation in path_item.values():
                if not isinstance(operation, dict) or "operationId" not in operation:
                    continue
                operation["security"] = cookie_security

        app.openapi_schema = schema
        return app.openapi_schema

    app.openapi = custom_openapi  # type: ignore[method-assign]
