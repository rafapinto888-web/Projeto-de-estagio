"""Endpoints de autenticacao, sessao (/me) e historico de auditoria."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import (
    SESSION_COOKIE_NAME,
    agora_utc_naive,
    configurar_cookie_sessao,
    criar_token_sessao,
    expira_sessao_em,
    hash_token_sessao,
    limpar_cookie_sessao,
    verificar_palavra_passe,
)
from app.database.connection import get_db
from app.models.log_sistema_db import LogSistemaDB
from app.models.sessao_db import SessaoDB
from app.models.utilizador_db import UtilizadorDB
from app.schemas.auth import (
    AuthLoginResponse,
    AuthLogoutResponse,
    AuthMeResponse,
    HistoricoRegistoIn,
    LoginRequest,
)

router = APIRouter(prefix="/auth", tags=["Autenticacao"])


def registar_log_sistema(
    db: Session,
    utilizador_id: int,
    acao: str,
    descricao: str | None = None,
) -> None:
    """Persiste uma linha de auditoria ligada ao utilizador (isolada por utilizador_id)."""
    limpa_acao = (acao or "").strip()[:100] or "evento"
    linha = LogSistemaDB(
        utilizador_id=utilizador_id,
        acao=limpa_acao,
        descricao=(descricao.strip()[:8000] if descricao else None),
    )
    db.add(linha)
    db.commit()


def autenticar_utilizador(
    db: Session, identificador: str, palavra_passe: str
) -> UtilizadorDB:
    """Valida credenciais; levanta 401 se falhar."""
    identificador_limpo = identificador.strip()
    utilizador = (
        db.query(UtilizadorDB)
        .filter(
            or_(
                UtilizadorDB.username == identificador_limpo,
                UtilizadorDB.email == identificador_limpo,
            )
        )
        .first()
    )
    if utilizador is None or not verificar_palavra_passe(palavra_passe, utilizador.palavra_passe_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas",
        )
    return utilizador


@router.post("/login", response_model=AuthLoginResponse)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    utilizador = autenticar_utilizador(db, payload.identificador, payload.palavra_passe)
    agora = agora_utc_naive()
    expira_em = expira_sessao_em(agora)
    token_bruto = criar_token_sessao()
    sessao = SessaoDB(
        utilizador_id=utilizador.id,
        token_hash=hash_token_sessao(token_bruto),
        criado_em=agora,
        ultima_atividade_em=agora,
        expira_em=expira_em,
    )
    db.add(sessao)
    db.commit()

    registar_log_sistema(
        db,
        utilizador.id,
        "sessao.login",
        f'Sessão iniciada como "{utilizador.username}"',
    )
    configurar_cookie_sessao(response, token_bruto, expires_at=expira_em)
    return {"ok": True, "message": "Sessao iniciada"}


@router.post("/logout", response_model=AuthLogoutResponse)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_user: UtilizadorDB = Depends(get_current_user),
):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        sessao = (
            db.query(SessaoDB)
            .filter(SessaoDB.token_hash == hash_token_sessao(token.strip()))
            .first()
        )
        if sessao is not None and sessao.revogado_em is None:
            sessao.revogado_em = agora_utc_naive()
            db.commit()

    registar_log_sistema(
        db,
        current_user.id,
        "sessao.logout",
        f'Sessão terminada ({current_user.nome or current_user.username}).',
    )
    limpar_cookie_sessao(response)
    return {"ok": True, "message": "Sessao terminada"}


@router.get("/me", response_model=AuthMeResponse)
def me(current_user: UtilizadorDB = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "nome": current_user.nome,
        "username": current_user.username,
        "email": current_user.email,
        "perfil_id": current_user.perfil_id,
        "perfil_nome": current_user.perfil.nome if current_user.perfil else None,
    }


@router.post("/me/historico", status_code=status.HTTP_201_CREATED)
def registar_evento_historico(
    payload: HistoricoRegistoIn,
    db: Session = Depends(get_db),
    current_user: UtilizadorDB = Depends(get_current_user),
):
    registar_log_sistema(
        db,
        current_user.id,
        payload.acao.strip(),
        payload.descricao.strip() if payload.descricao else None,
    )
    return {"ok": True}
