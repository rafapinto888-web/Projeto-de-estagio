"""Endpoint GET /pesquisar: pesquisa global em varias tabelas."""

# Rota de pesquisa global por varias entidades do sistema.
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import String, cast, or_
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, is_admin_user
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
    current_user: UtilizadorDB = Depends(get_current_user),
):
    # Limpa e valida o termo de pesquisa global.
    pesquisa_limpa = pesquisa.strip()
    if pesquisa_limpa == "":
        raise HTTPException(
            status_code=400,
            detail="Parametro pesquisa nao pode estar vazio",
        )

    pesquisa_like = f"%{pesquisa_limpa}%"

    filtro_texto = or_(
        cast(ComputadorDB.id, String) == pesquisa_limpa,
        ComputadorDB.nome.ilike(pesquisa_like),
        ComputadorDB.numero_serie.ilike(pesquisa_like),
        ComputadorDB.marca.ilike(pesquisa_like),
        ComputadorDB.modelo.ilike(pesquisa_like),
        ComputadorDB.estado.ilike(pesquisa_like),
    )

    query_computadores = db.query(ComputadorDB).filter(filtro_texto)
    if not is_admin_user(current_user):
        query_computadores = query_computadores.filter(
            ComputadorDB.utilizador_responsavel_id == current_user.id
        )
    computadores = query_computadores.order_by(ComputadorDB.id).all()

    filtro_inv = or_(
        cast(InventarioDB.id, String) == pesquisa_limpa,
        InventarioDB.nome.ilike(pesquisa_like),
        InventarioDB.descricao.ilike(pesquisa_like),
    )
    query_inventarios = db.query(InventarioDB).filter(filtro_inv)
    if not is_admin_user(current_user):
        query_inventarios = (
            query_inventarios.join(
                ComputadorDB, ComputadorDB.inventario_id == InventarioDB.id
            )
            .filter(ComputadorDB.utilizador_responsavel_id == current_user.id)
            .distinct()
        )
    inventarios = query_inventarios.order_by(InventarioDB.id).all()

    if is_admin_user(current_user):
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
    else:
        filtro_utilizador = or_(
            cast(UtilizadorDB.id, String) == pesquisa_limpa,
            UtilizadorDB.nome.ilike(pesquisa_like),
            UtilizadorDB.email.ilike(pesquisa_like),
        )
        u = (
            db.query(UtilizadorDB)
            .filter(UtilizadorDB.id == current_user.id)
            .filter(filtro_utilizador)
            .first()
        )
        utilizadores = [u] if u is not None else []

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

