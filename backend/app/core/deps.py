"""Dependencias FastAPI: autenticacao JWT/Basic, bypass Swagger e controlo de perfil admin."""

import base64
import re

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBasic,
    HTTPBasicCredentials,
    HTTPBearer,
)
from sqlalchemy.orm import Session, joinedload

from app.core.config import ALLOW_SWAGGER_BYPASS
from app.core.security import descodificar_access_token, verificar_palavra_passe
from app.database.connection import get_db
from app.models.utilizador_db import UtilizadorDB

http_bearer = HTTPBearer(auto_error=False)
basic_scheme = HTTPBasic(auto_error=False)

# Palavras de perfil que concedem visao global (logs, inventarios, computadores).
_PERFIL_ADMIN_TOKENS = frozenset({"admin", "administrador", "administrator"})


def _tokens_do_perfil(perfil_raw: str | None) -> frozenset[str]:
    """Extrai palavras do nome do perfil para comparacao (ex.: Admin, Administrador)."""
    if not perfil_raw or not str(perfil_raw).strip():
        return frozenset()
    pedacos = re.split(r"[^\wàáâãèéêìíîòóôõùúûçÀÁÂÃÈÉÊÌÍÎÒÓÔÕÙÚÛÇ]+", perfil_raw.lower())
    return frozenset(p for p in pedacos if p)


def is_admin_user(user: UtilizadorDB) -> bool:
    """True para perfis como Admin / Administrador (palavra inteira), nao para 'administrativo'."""
    nome = user.perfil.nome if user.perfil else ""
    return bool(_tokens_do_perfil(nome) & _PERFIL_ADMIN_TOKENS)


def _is_swagger_request(request: Request) -> bool:
    """True se o pedido vier do Swagger/ReDoc no browser."""
    referer = (request.headers.get("referer") or "").lower()
    user_agent = (request.headers.get("user-agent") or "").lower()
    return "/docs" in referer or "/redoc" in referer or "swagger-ui" in user_agent


def get_current_user(
    request: Request,
    bearer_credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    swagger_credentials: HTTPBasicCredentials | None = Depends(basic_scheme),
    db: Session = Depends(get_db),
) -> UtilizadorDB:
    """Resolve utilizador via bypass Swagger (opcional), Bearer JWT ou Basic (user/password no Swagger)."""
    # Modo desenvolvimento: sem login no /docs quando INVENTARIO_ALLOW_SWAGGER_BYPASS=true
    if ALLOW_SWAGGER_BYPASS and _is_swagger_request(request):
        candidatos = (
            db.query(UtilizadorDB)
            .options(joinedload(UtilizadorDB.perfil))
            .all()
        )
        for utilizador in candidatos:
            if is_admin_user(utilizador):
                return utilizador
        if candidatos:
            return candidatos[0]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sem utilizadores na base de dados para o modo Swagger",
            headers={"WWW-Authenticate": "Basic"},
        )

    if bearer_credentials is not None and bearer_credentials.scheme.lower() == "bearer":
        token = (bearer_credentials.credentials or "").strip()
        utilizador_id_txt = descodificar_access_token(token)
        if utilizador_id_txt is None or not utilizador_id_txt.isdigit():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token invalido",
                headers={"WWW-Authenticate": "Bearer"},
            )
        utilizador_por_token = (
            db.query(UtilizadorDB)
            .options(joinedload(UtilizadorDB.perfil))
            .filter(UtilizadorDB.id == int(utilizador_id_txt))
            .first()
        )
        if utilizador_por_token is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utilizador do token nao encontrado",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return utilizador_por_token

    identificador = None
    palavra_passe = None
    if swagger_credentials is not None:
        identificador = (swagger_credentials.username or "").strip()
        palavra_passe = swagger_credentials.password
    else:
        authorization = request.headers.get("Authorization", "").strip()
        if authorization.lower().startswith("basic "):
            try:
                token = authorization[6:].strip()
                decoded = base64.b64decode(token).decode("utf-8")
                identificador, palavra_passe = decoded.split(":", 1)
                identificador = identificador.strip()
            except Exception:
                identificador = None
                palavra_passe = None

    if not identificador or palavra_passe is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nao autenticado — Bearer JWT, ou user/password no Swagger (Authorize)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    utilizador_por_credencial = (
        db.query(UtilizadorDB)
        .options(joinedload(UtilizadorDB.perfil))
        .filter(
            (UtilizadorDB.username == identificador)
            | (UtilizadorDB.email == identificador)
        )
        .first()
    )
    if utilizador_por_credencial is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas",
            headers={"WWW-Authenticate": "Basic"},
        )
    if not verificar_palavra_passe(
        palavra_passe, utilizador_por_credencial.palavra_passe_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas",
            headers={"WWW-Authenticate": "Basic"},
        )
    return utilizador_por_credencial


def require_admin(current_user: UtilizadorDB = Depends(get_current_user)) -> UtilizadorDB:
    """Bloqueia a operacao se o utilizador atual nao for administrador."""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem executar esta operacao",
        )
    return current_user
