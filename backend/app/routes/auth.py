"""Endpoints de autenticacao, sessao (/me) e historico de auditoria."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import (
    criar_access_token,
    criar_refresh_token,
    descodificar_refresh_token,
    verificar_palavra_passe,
)
from app.database.connection import get_db
from app.models.log_sistema_db import LogSistemaDB
from app.models.utilizador_db import UtilizadorDB
from app.schemas.auth import (
    AuthMeResponse,
    AuthRefreshRequest,
    AuthRefreshResponse,
    AuthTokenResponse,
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
            headers={"WWW-Authenticate": "Bearer"},
        )
    return utilizador


@router.post("/login", response_model=AuthTokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    utilizador = autenticar_utilizador(db, payload.identificador, payload.palavra_passe)
    registar_log_sistema(
        db,
        utilizador.id,
        "sessao.login",
        f'Sessão iniciada como "{utilizador.username}"',
    )
    return {
        "access_token": criar_access_token(str(utilizador.id)),
        "refresh_token": criar_refresh_token(str(utilizador.id)),
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=AuthRefreshResponse)
def refresh_token(payload: AuthRefreshRequest, db: Session = Depends(get_db)):
    """Novo access JWT a partir de um refresh JWT valido (sem password)."""
    uid_txt = descodificar_refresh_token(payload.refresh_token.strip())
    if uid_txt is None or not uid_txt.isdigit():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token invalido ou expirado",
        )
    utilizador = db.get(UtilizadorDB, int(uid_txt))
    if utilizador is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utilizador do refresh token nao encontrado",
        )
    return {
        "access_token": criar_access_token(str(utilizador.id)),
        "token_type": "bearer",
    }


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
