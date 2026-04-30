"""Comentario geral deste ficheiro: define a logica principal deste modulo."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import criar_access_token, verificar_palavra_passe
from app.database.connection import get_db
from app.models.utilizador_db import UtilizadorDB
from app.schemas.auth import AuthMeResponse, AuthTokenResponse, LoginRequest

router = APIRouter(prefix="/auth", tags=["Autenticacao"])


def autenticar_utilizador(
    db: Session, identificador: str, palavra_passe: str
) -> UtilizadorDB:
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
    return {"access_token": criar_access_token(str(utilizador.id)), "token_type": "bearer"}


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

