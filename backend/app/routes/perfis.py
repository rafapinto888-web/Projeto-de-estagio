"""Comentario geral deste ficheiro: define a logica principal deste modulo."""

# Rotas CRUD dos perfis de utilizador.
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database.connection import get_db
from app.models.perfil_db import PerfilDB
from app.schemas.perfil import PerfilCreate, PerfilResponse, PerfilUpdate

router = APIRouter(prefix="/perfis", tags=["Perfis"])


def obter_perfil_ou_404(db: Session, perfil_id: int) -> PerfilDB:
    perfil = db.get(PerfilDB, perfil_id)
    if perfil is None:
        raise HTTPException(status_code=404, detail="Perfil nao encontrado")
    return perfil


@router.get("/", response_model=list[PerfilResponse])
def listar_perfis(db: Session = Depends(get_db)):
    return db.query(PerfilDB).order_by(PerfilDB.id).all()


@router.get("/{perfil_id}", response_model=PerfilResponse)
def obter_perfil(perfil_id: int, db: Session = Depends(get_db)):
    return obter_perfil_ou_404(db, perfil_id)


@router.post(
    "/",
    response_model=PerfilResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def criar_perfil(perfil: PerfilCreate, db: Session = Depends(get_db)):
    existente = db.query(PerfilDB).filter(PerfilDB.nome == perfil.nome).first()
    if existente is not None:
        raise HTTPException(status_code=409, detail="Nome de perfil ja existe")

    novo_perfil = PerfilDB(nome=perfil.nome)
    db.add(novo_perfil)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Nome de perfil ja existe",
        ) from None
    db.refresh(novo_perfil)
    return novo_perfil


@router.put(
    "/{perfil_id}",
    response_model=PerfilResponse,
    dependencies=[Depends(require_admin)],
)
def atualizar_perfil(
    perfil_id: int,
    perfil_atualizado: PerfilUpdate,
    db: Session = Depends(get_db),
):
    perfil = obter_perfil_ou_404(db, perfil_id)

    existente = (
        db.query(PerfilDB).filter(PerfilDB.nome == perfil_atualizado.nome).first()
    )
    if existente is not None and existente.id != perfil_id:
        raise HTTPException(status_code=409, detail="Nome de perfil ja existe")

    perfil.nome = perfil_atualizado.nome
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Nome de perfil ja existe",
        ) from None
    db.refresh(perfil)
    return perfil


@router.delete(
    "/{perfil_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def apagar_perfil(perfil_id: int, db: Session = Depends(get_db)):
    perfil = obter_perfil_ou_404(db, perfil_id)

    db.delete(perfil)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Nao e possivel apagar o perfil porque existem utilizadores associados",
        ) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)

