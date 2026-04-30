from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session, joinedload

from app.core.security import descodificar_access_token
from app.database.connection import get_db
from app.models.utilizador_db import UtilizadorDB

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)


def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> UtilizadorDB:
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nao autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
    perfil_nome = (current_user.perfil.nome if current_user.perfil else "").strip().lower()
    if perfil_nome != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem executar esta operacao",
        )
    return current_user
