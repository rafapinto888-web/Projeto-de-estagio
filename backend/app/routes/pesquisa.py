"""Comentario geral deste ficheiro: define a logica principal deste modulo."""

# Rota de pesquisa global por varias entidades do sistema.
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import String, cast, or_
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.computador_db import ComputadorDB
from app.models.inventario_db import InventarioDB
from app.models.localizacao_db import LocalizacaoDB
from app.models.utilizador_db import UtilizadorDB
from app.schemas.pesquisa import PesquisaGlobalResponse

router = APIRouter(tags=["Pesquisa"])


@router.get("/pesquisar", response_model=PesquisaGlobalResponse)
def pesquisar_global(
    pesquisa: str = Query(...),
    db: Session = Depends(get_db),
):
    # Limpa e valida o termo de pesquisa global.
    pesquisa_limpa = pesquisa.strip()
    if pesquisa_limpa == "":
        raise HTTPException(
            status_code=400,
            detail="Parametro pesquisa nao pode estar vazio",
        )

    pesquisa_like = f"%{pesquisa_limpa}%"

    # Pesquisa computadores por id, nome, serie, marca, modelo e estado.
    computadores = (
        db.query(ComputadorDB)
        .filter(
            or_(
                cast(ComputadorDB.id, String) == pesquisa_limpa,
                ComputadorDB.nome.ilike(pesquisa_like),
                ComputadorDB.numero_serie.ilike(pesquisa_like),
                ComputadorDB.marca.ilike(pesquisa_like),
                ComputadorDB.modelo.ilike(pesquisa_like),
                ComputadorDB.estado.ilike(pesquisa_like),
            )
        )
        .order_by(ComputadorDB.id)
        .all()
    )

    # Pesquisa inventarios por id, nome e descricao.
    inventarios = (
        db.query(InventarioDB)
        .filter(
            or_(
                cast(InventarioDB.id, String) == pesquisa_limpa,
                InventarioDB.nome.ilike(pesquisa_like),
                InventarioDB.descricao.ilike(pesquisa_like),
            )
        )
        .order_by(InventarioDB.id)
        .all()
    )

    # Pesquisa utilizadores por id, nome e email.
    utilizadores = (
        db.query(UtilizadorDB)
        .filter(
            or_(
                cast(UtilizadorDB.id, String) == pesquisa_limpa,
                UtilizadorDB.nome.ilike(pesquisa_like),
                UtilizadorDB.email.ilike(pesquisa_like),
            )
        )
        .order_by(UtilizadorDB.id)
        .all()
    )

    # Pesquisa localizacoes por id, nome e descricao.
    localizacoes = (
        db.query(LocalizacaoDB)
        .filter(
            or_(
                cast(LocalizacaoDB.id, String) == pesquisa_limpa,
                LocalizacaoDB.nome.ilike(pesquisa_like),
                LocalizacaoDB.descricao.ilike(pesquisa_like),
            )
        )
        .order_by(LocalizacaoDB.id)
        .all()
    )

    # Devolve todos os resultados agrupados por categoria.
    return {
        "computadores": computadores,
        "inventarios": inventarios,
        "utilizadores": utilizadores,
        "localizacoes": localizacoes,
    }

