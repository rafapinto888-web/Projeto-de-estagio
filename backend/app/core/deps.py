"""Dependencias FastAPI: autenticacao por sessao-cookie e controlo de perfil admin."""

from __future__ import annotations

import re

from fastapi import Depends, HTTPException, Response, status
from fastapi.security import APIKeyCookie
from sqlalchemy.orm import Session, joinedload

from app.core.openapi import SESSION_COOKIE_SCHEME_NAME
from app.core.security import (
    SESSION_COOKIE_NAME,
    configurar_cookie_sessao,
    expira_sessao_em,
    hash_token_sessao,
    limpar_cookie_sessao,
    agora_utc_naive,
)
from app.database.connection import get_db
from app.models.sessao_db import SessaoDB
from app.models.utilizador_db import UtilizadorDB

session_cookie = APIKeyCookie(
    auto_error=False,
    name=SESSION_COOKIE_NAME,
    scheme_name=SESSION_COOKIE_SCHEME_NAME,
)

# Palavras de perfil que concedem visao global (logs, inventarios, computadores).
_PERFIL_ADMIN_TOKENS = frozenset({"admin", "administrador", "administrator"})


def _tokens_do_perfil(perfil_raw: str | None) -> frozenset[str]:
    """Extrai palavras do nome do perfil para comparacao (ex.: Admin, Administrador)."""
    if not perfil_raw or not str(perfil_raw).strip():
        return frozenset()
    pedacos = re.split(r"[^0-9a-zA-ZÀ-ÿ_]+", perfil_raw.lower())
    return frozenset(p for p in pedacos if p)


def perfil_nome_e_admin(nome: str | None) -> bool:
    """True se o nome do perfil (ex.: na tabela perfis) concede permissoes de administrador."""
    return bool(_tokens_do_perfil(nome) & _PERFIL_ADMIN_TOKENS)


def is_admin_user(user: UtilizadorDB) -> bool:
    """True para perfis como Admin / Administrador (palavra inteira), nao para 'administrativo'."""
    nome = user.perfil.nome if user.perfil else ""
    return perfil_nome_e_admin(nome)


def _raise_nao_autenticado(response: Response, detail: str) -> None:
    limpar_cookie_sessao(response)
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
    )


def get_current_user(
    response: Response,
    session_token: str | None = Depends(session_cookie),
    db: Session = Depends(get_db),
) -> UtilizadorDB:
    """Resolve utilizador via cookie de sessao, validando e prolongando a sessao por pedido."""
    if session_token is None or not str(session_token).strip():
        _raise_nao_autenticado(response, "Nao autenticado")

    agora = agora_utc_naive()
    sessao = (
        db.query(SessaoDB)
        .options(joinedload(SessaoDB.utilizador).joinedload(UtilizadorDB.perfil))
        .filter(SessaoDB.token_hash == hash_token_sessao(session_token.strip()))
        .first()
    )
    if sessao is None or sessao.revogado_em is not None:
        _raise_nao_autenticado(response, "Sessao invalida")
    if sessao.expira_em <= agora:
        _raise_nao_autenticado(response, "Sessao expirada")
    if sessao.utilizador is None:
        _raise_nao_autenticado(response, "Utilizador da sessao nao encontrado")

    # Sliding session: cada pedido autenticado renova a validade e o max-age do cookie.
    nova_expiracao = expira_sessao_em(agora)
    sessao.ultima_atividade_em = agora
    sessao.expira_em = nova_expiracao
    db.commit()
    configurar_cookie_sessao(response, session_token.strip(), expires_at=nova_expiracao)
    return sessao.utilizador


def require_admin(current_user: UtilizadorDB = Depends(get_current_user)) -> UtilizadorDB:
    """Bloqueia a operacao se o utilizador atual nao for administrador."""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem executar esta operacao",
        )
    return current_user
