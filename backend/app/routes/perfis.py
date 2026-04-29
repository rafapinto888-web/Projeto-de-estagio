# Rotas CRUD dos perfis de utilizador.
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.perfil_db import PerfilDB
from app.schemas.perfil import PerfilCreate, PerfilResponse, PerfilUpdate

router = APIRouter(prefix="/perfis", tags=["Perfis"])


@router.get("/", response_model=list[PerfilResponse])
def listar_perfis(db: Session = Depends(get_db)):
    return db.query(PerfilDB).order_by(PerfilDB.id).all()


@router.get("/{perfil_id}", response_model=PerfilResponse)
def obter_perfil(perfil_id: int, db: Session = Depends(get_db)):
    perfil = db.get(PerfilDB, perfil_id)
    if perfil is None:
        raise HTTPException(status_code=404, detail="Perfil nao encontrado")
    return perfil


@router.post("/", response_model=PerfilResponse, status_code=status.HTTP_201_CREATED)
def criar_perfil(perfil: PerfilCreate, db: Session = Depends(get_db)):
    existente = db.query(PerfilDB).filter(PerfilDB.nome == perfil.nome).first()
    if existente is not None:
        raise HTTPException(status_code=400, detail="Nome de perfil ja existe")

    novo_perfil = PerfilDB(nome=perfil.nome, descricao=perfil.descricao)
    db.add(novo_perfil)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Nome de perfil ja existe",
        ) from None
    db.refresh(novo_perfil)
    return novo_perfil


@router.put("/{perfil_id}", response_model=PerfilResponse)
def atualizar_perfil(
    perfil_id: int,
    perfil_atualizado: PerfilUpdate,
    db: Session = Depends(get_db),
):
    perfil = db.get(PerfilDB, perfil_id)
    if perfil is None:
        raise HTTPException(status_code=404, detail="Perfil nao encontrado")

    existente = (
        db.query(PerfilDB).filter(PerfilDB.nome == perfil_atualizado.nome).first()
    )
    if existente is not None and existente.id != perfil_id:
        raise HTTPException(status_code=400, detail="Nome de perfil ja existe")

    perfil.nome = perfil_atualizado.nome
    perfil.descricao = perfil_atualizado.descricao
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Nome de perfil ja existe",
        ) from None
    db.refresh(perfil)
    return perfil


@router.delete("/{perfil_id}", status_code=status.HTTP_204_NO_CONTENT)
def apagar_perfil(perfil_id: int, db: Session = Depends(get_db)):
    perfil = db.get(PerfilDB, perfil_id)
    if perfil is None:
        raise HTTPException(status_code=404, detail="Perfil nao encontrado")

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
