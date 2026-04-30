import base64

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from sqlalchemy.orm import Session, joinedload

from app.core.security import descodificar_access_token, verificar_palavra_passe
from app.database.connection import get_db
from app.models.utilizador_db import UtilizadorDB

basic_scheme = HTTPBasic(auto_error=False)


def is_admin_user(user: UtilizadorDB) -> bool:
    # Centraliza a regra de permissao para simplificar reutilizacao nas rotas.
    perfil_nome = (user.perfil.nome if user.perfil else "").strip().lower()
    return perfil_nome == "admin"


def _is_swagger_request(request: Request) -> bool:
    # Permite manter frontend protegido e, ao mesmo tempo, facilitar testes no /docs.
    referer = (request.headers.get("referer") or "").lower()
    user_agent = (request.headers.get("user-agent") or "").lower()
    return "/docs" in referer or "/redoc" in referer or "swagger-ui" in user_agent


def get_current_user(
    request: Request,
    swagger_credentials: HTTPBasicCredentials | None = Depends(basic_scheme),
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
    identificador = None
    palavra_passe = None
    if swagger_credentials is not None:
        identificador = (swagger_credentials.username or "").strip()
        palavra_passe = swagger_credentials.password
    elif authorization.lower().startswith("basic "):
        try:
            token = authorization[6:].strip()
            decoded = base64.b64decode(token).decode("utf-8")
            identificador, palavra_passe = decoded.split(":", 1)
            identificador = identificador.strip()
        except Exception:
            identificador = None
            palavra_passe = None

    if not identificador or palavra_passe is None:
        if _is_swagger_request(request):
            # Bypass apenas no Swagger: usa um admin da BD quando nao existe auth explicita.
            admin_swagger = (
                db.query(UtilizadorDB)
                .options(joinedload(UtilizadorDB.perfil))
                .all()
            )
            for utilizador in admin_swagger:
                if is_admin_user(utilizador):
                    return utilizador
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nao autenticado",
            headers={"WWW-Authenticate": "Basic"},
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
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem executar esta operacao",
        )
    return current_user
