"""Dependencias FastAPI: autenticacao JWT e controlo de perfil admin."""

import re

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session, joinedload

from app.core.openapi import BEARER_SCHEME_NAME
from app.core.security import descodificar_access_token
from app.database.connection import get_db
from app.models.utilizador_db import UtilizadorDB

http_bearer = HTTPBearer(auto_error=False, scheme_name=BEARER_SCHEME_NAME)

# Palavras de perfil que concedem visao global (logs, inventarios, computadores).
_PERFIL_ADMIN_TOKENS = frozenset({"admin", "administrador", "administrator"})


def _tokens_do_perfil(perfil_raw: str | None) -> frozenset[str]:
    """Extrai palavras do nome do perfil para comparacao (ex.: Admin, Administrador)."""
    if not perfil_raw or not str(perfil_raw).strip():
        return frozenset()
    pedacos = re.split(r"[^\wàáâãèéêìíîòóôõùúûçÀÁÂÃÈÉÊÌÍÎÒÓÔÕÙÚÛÇ]+", perfil_raw.lower())
    return frozenset(p for p in pedacos if p)


def perfil_nome_e_admin(nome: str | None) -> bool:
    """True se o nome do perfil (ex.: na tabela perfis) concede permissoes de administrador."""
    return bool(_tokens_do_perfil(nome) & _PERFIL_ADMIN_TOKENS)


def is_admin_user(user: UtilizadorDB) -> bool:
    """True para perfis como Admin / Administrador (palavra inteira), nao para 'administrativo'."""
    nome = user.perfil.nome if user.perfil else ""
    return perfil_nome_e_admin(nome)


def get_current_user(
    bearer_credentials: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> UtilizadorDB:
    """Resolve utilizador apenas via Bearer JWT (POST /auth/login)."""
    if bearer_credentials is None or bearer_credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nao autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = (bearer_credentials.credentials or "").strip()
    utilizador_id_txt = descodificar_access_token(token)
    if utilizador_id_txt is None or not utilizador_id_txt.isdigit():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    utilizador = (
        db.query(UtilizadorDB)
        .options(joinedload(UtilizadorDB.perfil))
        .filter(UtilizadorDB.id == int(utilizador_id_txt))
        .first()
    )
    if utilizador is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilizador do token nao encontrado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return utilizador


def require_admin(current_user: UtilizadorDB = Depends(get_current_user)) -> UtilizadorDB:
    """Bloqueia a operacao se o utilizador atual nao for administrador."""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem executar esta operacao",
        )
    return current_user
