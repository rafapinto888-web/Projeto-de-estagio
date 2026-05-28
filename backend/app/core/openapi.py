"""Esquema OpenAPI: autenticacao JWT no Swagger."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

# Nome do esquema HTTP Bearer no Swagger (deve coincidir com scheme_name em deps.py).
BEARER_SCHEME_NAME = "BearerAuth"

# Rotas publicas (unicas sem JWT: obter ou renovar token).
_PUBLIC_PATH_PREFIXES = (
    "/auth/login",
    "/auth/refresh",
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
    """Regista gerador OpenAPI com um unico esquema Bearer e rotas publicas marcadas."""

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
        schemes[BEARER_SCHEME_NAME] = {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
        schemes.pop("HTTPBasic", None)

        bearer_security = [{BEARER_SCHEME_NAME: []}]

        for path, path_item in schema.get("paths", {}).items():
            if _path_is_public(path):
                continue
            for operation in path_item.values():
                if not isinstance(operation, dict) or "operationId" not in operation:
                    continue
                operation["security"] = bearer_security

        app.openapi_schema = schema
        return app.openapi_schema

    app.openapi = custom_openapi  # type: ignore[method-assign]
