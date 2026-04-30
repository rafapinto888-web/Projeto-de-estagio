# Rotas CRUD das localizacoes de equipamentos.
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.core.deps import require_admin
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


@router.post(
    "/",
    response_model=LocalizacaoResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def criar_localizacao(localizacao: LocalizacaoCreate, db: Session = Depends(get_db)):
    nome_limpo = localizacao.nome.strip()
    if not nome_limpo:
        raise HTTPException(status_code=400, detail="Nome da localizacao e obrigatorio")
    descricao_limpa = localizacao.descricao.strip() if isinstance(localizacao.descricao, str) else None
    if descricao_limpa == "":
        descricao_limpa = None

    existente = obter_localizacao_duplicada(
        db, nome_limpo, descricao_limpa
    )
    if existente is not None:
        raise HTTPException(
            status_code=409,
            detail="Ja existe uma localizacao com o mesmo nome e descricao",
        )

    nova_localizacao = LocalizacaoDB(
        nome=nome_limpo,
        descricao=descricao_limpa,
    )
    db.add(nova_localizacao)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Ja existe uma localizacao com o mesmo nome e descricao",
        ) from None
    db.refresh(nova_localizacao)
    return nova_localizacao


@router.put(
    "/{localizacao_id}",
    response_model=LocalizacaoResponse,
    dependencies=[Depends(require_admin)],
)
def atualizar_localizacao(
    localizacao_id: int,
    localizacao_atualizada: LocalizacaoUpdate,
    db: Session = Depends(get_db),
):
    localizacao = db.get(LocalizacaoDB, localizacao_id)
    if localizacao is None:
        raise HTTPException(status_code=404, detail="Localizacao nao encontrada")

    nome_limpo = localizacao_atualizada.nome.strip()
    if not nome_limpo:
        raise HTTPException(status_code=400, detail="Nome da localizacao e obrigatorio")
    descricao_limpa = (
        localizacao_atualizada.descricao.strip()
        if isinstance(localizacao_atualizada.descricao, str)
        else None
    )
    if descricao_limpa == "":
        descricao_limpa = None

    existente = obter_localizacao_duplicada(
        db, nome_limpo, descricao_limpa
    )
    if existente is not None and existente.id != localizacao_id:
        raise HTTPException(
            status_code=409,
            detail="Ja existe uma localizacao com o mesmo nome e descricao",
        )

    localizacao.nome = nome_limpo
    localizacao.descricao = descricao_limpa
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Ja existe uma localizacao com o mesmo nome e descricao",
        ) from None
    db.refresh(localizacao)
    return localizacao


@router.delete(
    "/{localizacao_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
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
