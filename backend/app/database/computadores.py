from collections.abc import Mapping

from sqlalchemy.exc import IntegrityError
# Funcoes CRUD de baixo nivel para computadores.
from sqlalchemy.orm import Session

from app.models.computador_db import ComputadorDB


def listar_computadores(db: Session) -> list[ComputadorDB]:
    return db.query(ComputadorDB).order_by(ComputadorDB.id).all()


def obter_computador(db: Session, computador_id: int) -> ComputadorDB | None:
    return db.get(ComputadorDB, computador_id)


def obter_computador_por_numero_serie(
    db: Session, numero_serie: str
) -> ComputadorDB | None:
    return (
        db.query(ComputadorDB)
        .filter(ComputadorDB.numero_serie == numero_serie)
        .first()
    )


def criar_computador(
    db: Session, dados: Mapping[str, str | int | None]
) -> ComputadorDB:
    computador = ComputadorDB(**dados)
    db.add(computador)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(computador)
    return computador


def atualizar_computador(
    db: Session, computador_id: int, dados: Mapping[str, str | int | None]
) -> ComputadorDB | None:
    computador = obter_computador(db, computador_id)
    if computador is None:
        return None

    for campo, valor in dados.items():
        setattr(computador, campo, valor)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(computador)
    return computador


def apagar_computador(db: Session, computador_id: int) -> bool:
    computador = obter_computador(db, computador_id)
    if computador is None:
        return False

    db.delete(computador)
    db.commit()
    return True
