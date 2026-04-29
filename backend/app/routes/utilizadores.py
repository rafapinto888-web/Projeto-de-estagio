# Rotas CRUD dos utilizadores e respetivos perfis.
from fastapi import APIRouter, Depends, HTTPException, Response, status
from pwdlib import PasswordHash
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database.connection import get_db
from app.models.perfil_db import PerfilDB
from app.models.utilizador_db import UtilizadorDB
from app.schemas.utilizador import (
    UtilizadorCreate,
    UtilizadorResponse,
    UtilizadorUpdate,
)

router = APIRouter(prefix="/utilizadores", tags=["Utilizadores"])
password_hash = PasswordHash.recommended()


def gerar_hash_palavra_passe(palavra_passe: str) -> str:
    return password_hash.hash(palavra_passe)


def validar_perfil(db: Session, perfil_id: int) -> None:
    if db.get(PerfilDB, perfil_id) is None:
        raise HTTPException(
            status_code=400,
            detail=f"Perfil com id {perfil_id} nao existe",
        )


def validar_email_unico(
    db: Session, email: str, utilizador_id: int | None = None
) -> None:
    existente = db.query(UtilizadorDB).filter(UtilizadorDB.email == email).first()
    if existente is not None and existente.id != utilizador_id:
        raise HTTPException(status_code=409, detail="Email de utilizador ja existe")


def validar_username_unico(
    db: Session, username: str, utilizador_id: int | None = None
) -> None:
    existente = (
        db.query(UtilizadorDB).filter(UtilizadorDB.username == username).first()
    )
    if existente is not None and existente.id != utilizador_id:
        raise HTTPException(status_code=409, detail="Username de utilizador ja existe")


@router.get("/", response_model=list[UtilizadorResponse])
def listar_utilizadores(db: Session = Depends(get_db)):
    return db.query(UtilizadorDB).order_by(UtilizadorDB.id).all()


@router.get("/{utilizador_id}", response_model=UtilizadorResponse)
def obter_utilizador(utilizador_id: int, db: Session = Depends(get_db)):
    utilizador = db.get(UtilizadorDB, utilizador_id)
    if utilizador is None:
        raise HTTPException(status_code=404, detail="Utilizador nao encontrado")
    return utilizador


@router.post(
    "/",
    response_model=UtilizadorResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def criar_utilizador(utilizador: UtilizadorCreate, db: Session = Depends(get_db)):
    validar_perfil(db, utilizador.perfil_id)
    validar_email_unico(db, utilizador.email)
    validar_username_unico(db, utilizador.username)

    novo_utilizador = UtilizadorDB(
        nome=utilizador.nome,
        username=utilizador.username,
        email=utilizador.email,
        palavra_passe_hash=gerar_hash_palavra_passe(utilizador.palavra_passe),
        perfil_id=utilizador.perfil_id,
    )
    db.add(novo_utilizador)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Perfil, email ou username invalido",
        ) from None
    db.refresh(novo_utilizador)
    return novo_utilizador


@router.put(
    "/{utilizador_id}",
    response_model=UtilizadorResponse,
    dependencies=[Depends(require_admin)],
)
def atualizar_utilizador(
    utilizador_id: int,
    utilizador_atualizado: UtilizadorUpdate,
    db: Session = Depends(get_db),
):
    utilizador = db.get(UtilizadorDB, utilizador_id)
    if utilizador is None:
        raise HTTPException(status_code=404, detail="Utilizador nao encontrado")

    validar_perfil(db, utilizador_atualizado.perfil_id)
    validar_email_unico(db, utilizador_atualizado.email, utilizador_id)
    validar_username_unico(db, utilizador_atualizado.username, utilizador_id)

    utilizador.nome = utilizador_atualizado.nome
    utilizador.username = utilizador_atualizado.username
    utilizador.email = utilizador_atualizado.email
    if utilizador_atualizado.palavra_passe is not None:
        utilizador.palavra_passe_hash = gerar_hash_palavra_passe(
            utilizador_atualizado.palavra_passe
        )
    utilizador.perfil_id = utilizador_atualizado.perfil_id
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Perfil, email ou username invalido",
        ) from None
    db.refresh(utilizador)
    return utilizador


@router.delete(
    "/{utilizador_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def apagar_utilizador(utilizador_id: int, db: Session = Depends(get_db)):
    utilizador = db.get(UtilizadorDB, utilizador_id)
    if utilizador is None:
        raise HTTPException(status_code=404, detail="Utilizador nao encontrado")

    db.delete(utilizador)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Nao e possivel apagar o utilizador porque existem registos associados",
        ) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
