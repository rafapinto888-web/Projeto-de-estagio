# Rotas CRUD das localizacoes de equipamentos.
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.computador_db import ComputadorDB
from app.models.localizacao_db import LocalizacaoDB
from app.schemas.localizacao import (
    LocalizacaoCreate,
    LocalizacaoResponse,
    LocalizacaoUpdate,
)

router = APIRouter(prefix="/localizacoes", tags=["Localizacoes"])


def obter_localizacao_duplicada(
    db: Session, nome: str, descricao: str | None
) -> LocalizacaoDB | None:
    return (
        db.query(LocalizacaoDB)
        .filter(
            and_(
                LocalizacaoDB.nome == nome,
                LocalizacaoDB.descricao.is_(None)
                if descricao is None
                else LocalizacaoDB.descricao == descricao,
            )
        )
        .first()
    )


@router.get("/", response_model=list[LocalizacaoResponse])
def listar_localizacoes(db: Session = Depends(get_db)):
    return db.query(LocalizacaoDB).order_by(LocalizacaoDB.id).all()


@router.get("/{localizacao_id}", response_model=LocalizacaoResponse)
def obter_localizacao(localizacao_id: int, db: Session = Depends(get_db)):
    localizacao = db.get(LocalizacaoDB, localizacao_id)
    if localizacao is None:
        raise HTTPException(status_code=404, detail="Localizacao nao encontrada")
    return localizacao


@router.post("/", response_model=LocalizacaoResponse, status_code=status.HTTP_201_CREATED)
def criar_localizacao(localizacao: LocalizacaoCreate, db: Session = Depends(get_db)):
    existente = obter_localizacao_duplicada(
        db, localizacao.nome, localizacao.descricao
    )
    if existente is not None:
        raise HTTPException(
            status_code=400,
            detail="Ja existe uma localizacao com o mesmo nome e descricao",
        )

    nova_localizacao = LocalizacaoDB(
        nome=localizacao.nome,
        descricao=localizacao.descricao,
    )
    db.add(nova_localizacao)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Ja existe uma localizacao com o mesmo nome e descricao",
        ) from None
    db.refresh(nova_localizacao)
    return nova_localizacao


@router.put("/{localizacao_id}", response_model=LocalizacaoResponse)
def atualizar_localizacao(
    localizacao_id: int,
    localizacao_atualizada: LocalizacaoUpdate,
    db: Session = Depends(get_db),
):
    localizacao = db.get(LocalizacaoDB, localizacao_id)
    if localizacao is None:
        raise HTTPException(status_code=404, detail="Localizacao nao encontrada")

    existente = obter_localizacao_duplicada(
        db, localizacao_atualizada.nome, localizacao_atualizada.descricao
    )
    if existente is not None and existente.id != localizacao_id:
        raise HTTPException(
            status_code=400,
            detail="Ja existe uma localizacao com o mesmo nome e descricao",
        )

    localizacao.nome = localizacao_atualizada.nome
    localizacao.descricao = localizacao_atualizada.descricao
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Ja existe uma localizacao com o mesmo nome e descricao",
        ) from None
    db.refresh(localizacao)
    return localizacao


@router.delete("/{localizacao_id}", status_code=status.HTTP_204_NO_CONTENT)
def apagar_localizacao(localizacao_id: int, db: Session = Depends(get_db)):
    localizacao = db.get(LocalizacaoDB, localizacao_id)
    if localizacao is None:
        raise HTTPException(status_code=404, detail="Localizacao nao encontrada")

    computador_associado = (
        db.query(ComputadorDB)
        .filter(ComputadorDB.localizacao_id == localizacao_id)
        .first()
    )
    if computador_associado is not None:
        raise HTTPException(
            status_code=400,
            detail="Nao e possivel apagar a localizacao porque existem computadores associados",
        )

    db.delete(localizacao)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
