from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session, joinedload

from app.core.security import descodificar_access_token, verificar_palavra_passe
from app.database.connection import get_db
from app.models.utilizador_db import UtilizadorDB

basic_scheme = HTTPBasic(auto_error=False)


def get_current_user(
    request: Request,
    credentials: HTTPBasicCredentials | None = Depends(basic_scheme),
    db: Session = Depends(get_db),
) -> UtilizadorDB:
    authorization = request.headers.get("Authorization", "").strip()

    # Mantem compatibilidade com frontend atual (Bearer JWT).
    if authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
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

    # Para Swagger: autenticação simples com username/email + password.
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nao autenticado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    identificador = credentials.username.strip()
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
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verificar_palavra_passe(
        credentials.password, utilizador_por_credencial.palavra_passe_hash
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais invalidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return utilizador_por_credencial


def require_admin(current_user: UtilizadorDB = Depends(get_current_user)) -> UtilizadorDB:
    perfil_nome = (current_user.perfil.nome if current_user.perfil else "").strip().lower()
    if perfil_nome != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem executar esta operacao",
        )
    return current_user
