# Rotas para gestao de computadores e consulta de logs de dispositivo.
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database.computadores import (
    apagar_computador as apagar_computador_db,
    atualizar_computador as atualizar_computador_db,
    criar_computador as criar_computador_db,
    listar_computadores as listar_computadores_db,
    obter_computador,
    obter_computador_por_numero_serie,
)
from app.database.connection import get_db
from app.models.computador_db import ComputadorDB
from app.models.dispositivo_descoberto_db import DispositivoDescobertoDB
from app.models.inventario_db import InventarioDB
from app.models.localizacao_db import LocalizacaoDB
from app.models.log_dispositivo_db import LogDispositivoDB
from app.models.utilizador_db import UtilizadorDB
from app.schemas.computador import (
    ComputadorCreate,
    ComputadorReplace,
    ComputadorResponse,
    ComputadorUpdate,
)
from app.schemas.log_dispositivo import (
    LogDispositivoItemResponse,
    LogsDispositivoConsultaResponse,
)

router = APIRouter(prefix="/computadores", tags=["Computadores"])


def validar_inventario(db: Session, inventario_id: int) -> None:
    # Garante que o inventario existe antes de gravar o computador.
    if inventario_id is None:
        raise HTTPException(status_code=400, detail="Inventario e obrigatorio")

    if db.get(InventarioDB, inventario_id) is None:
        raise HTTPException(
            status_code=400,
            detail=f"Inventario com id {inventario_id} nao existe",
        )


def validar_localizacao(db: Session, localizacao_id: int | None) -> None:
    # Valida localizacao apenas quando o campo foi enviado.
    if localizacao_id is None:
        return

    if db.get(LocalizacaoDB, localizacao_id) is None:
        raise HTTPException(
            status_code=400,
            detail=f"Localizacao com id {localizacao_id} nao existe",
        )


def validar_utilizador_responsavel(
    db: Session, utilizador_responsavel_id: int | None
) -> None:
    # Valida utilizador responsavel apenas quando definido.
    if utilizador_responsavel_id is None:
        return

    if db.get(UtilizadorDB, utilizador_responsavel_id) is None:
        raise HTTPException(
            status_code=400,
            detail=f"Utilizador com id {utilizador_responsavel_id} nao existe",
        )


@router.get("/", response_model=list[ComputadorResponse])
def listar_computadores(db: Session = Depends(get_db)):
    # Lista todos os computadores registados.
    return listar_computadores_db(db)


@router.get("/logs/dispositivo", response_model=LogsDispositivoConsultaResponse)
def consultar_logs_dispositivo(
    computador_id: int | None = Query(default=None),
    nome: str | None = Query(default=None),
    numero_serie: str | None = Query(default=None),
    hostname: str | None = Query(default=None),
    tipo_log: Literal["seguranca", "rdp"] | None = Query(default=None),
    db: Session = Depends(get_db),
):
    # Valida se existe pelo menos um identificador para procurar logs.
    if (
        computador_id is None
        and nome is None
        and numero_serie is None
        and hostname is None
    ):
        raise HTTPException(
            status_code=400,
            detail="Indica computador_id, nome, numero_serie ou hostname para pesquisar logs",
        )

    computadores_alvo: set[int] = set()
    filtros_aplicados: dict[str, str | int] = {}

    # Resolve o computador diretamente pelo ID da base de dados.
    if computador_id is not None:
        computador = obter_computador(db, computador_id)
        if computador is None:
            raise HTTPException(status_code=404, detail="Computador nao encontrado")
        computadores_alvo.add(computador.id)
        filtros_aplicados["computador_id"] = computador_id

    # Resolve por nome do computador.
    if nome is not None:
        nome_limpo = nome.strip()
        if not nome_limpo:
            raise HTTPException(status_code=400, detail="nome nao pode estar vazio")
        computadores_por_nome = (
            db.query(ComputadorDB)
            .filter(ComputadorDB.nome.ilike(f"%{nome_limpo}%"))
            .all()
        )
        computadores_alvo.update(c.id for c in computadores_por_nome)
        filtros_aplicados["nome"] = nome_limpo

    # Resolve o computador pelo numero de serie (registo manual).
    if numero_serie is not None:
        numero_serie_limpo = numero_serie.strip()
        if not numero_serie_limpo:
            raise HTTPException(status_code=400, detail="numero_serie nao pode estar vazio")
        computador = obter_computador_por_numero_serie(db, numero_serie_limpo)
        if computador is None:
            raise HTTPException(
                status_code=404, detail="Computador com esse numero_serie nao encontrado"
            )
        computadores_alvo.add(computador.id)
        filtros_aplicados["numero_serie"] = numero_serie_limpo

    # Resolve por hostname do dispositivo descoberto; usa numero_serie capturado no scan quando existir.
    if hostname is not None:
        hostname_limpo = hostname.strip()
        if not hostname_limpo:
            raise HTTPException(status_code=400, detail="hostname nao pode estar vazio")
        filtros_aplicados["hostname"] = hostname_limpo

        dispositivos = (
            db.query(DispositivoDescobertoDB)
            .filter(DispositivoDescobertoDB.hostname.ilike(f"%{hostname_limpo}%"))
            .all()
        )
        numeros_serie_descobertos = {
            d.numero_serie for d in dispositivos if d.numero_serie is not None
        }
        if numeros_serie_descobertos:
            computadores_por_serie = (
                db.query(ComputadorDB)
                .filter(ComputadorDB.numero_serie.in_(numeros_serie_descobertos))
                .all()
            )
            computadores_alvo.update(c.id for c in computadores_por_serie)

    # Se nenhum computador foi resolvido pelos filtros, devolve vazio em vez de erro.
    if not computadores_alvo:
        if tipo_log is not None and tipo_log.strip():
            filtros_aplicados["tipo_log"] = tipo_log.strip()
        return {"filtros": filtros_aplicados, "total_logs": 0, "logs": []}

    query_logs = (
        # Busca logs de dispositivo dos computadores resolvidos pelos filtros.
        db.query(LogDispositivoDB)
        .filter(LogDispositivoDB.computador_id.in_(list(computadores_alvo)))
        .order_by(LogDispositivoDB.data_evento.desc(), LogDispositivoDB.id.desc())
    )

    if tipo_log is not None:
        tipo_log_limpo = tipo_log.strip()
        if tipo_log_limpo:
            query_logs = query_logs.filter(LogDispositivoDB.tipo_log == tipo_log_limpo)
            filtros_aplicados["tipo_log"] = tipo_log_limpo

    logs = query_logs.all()
    return {"filtros": filtros_aplicados, "total_logs": len(logs), "logs": logs}


@router.get("/{computador_id}/logs", response_model=list[LogDispositivoItemResponse])
def listar_logs_do_computador(
    computador_id: int,
    tipo_log: Literal["seguranca", "rdp"] | None = Query(default=None),
    db: Session = Depends(get_db),
):
    # Lista logs diretamente por computador para facilitar no frontend.
    computador = obter_computador(db, computador_id)
    if computador is None:
        raise HTTPException(status_code=404, detail="Computador nao encontrado")

    query_logs = (
        db.query(LogDispositivoDB)
        .filter(LogDispositivoDB.computador_id == computador_id)
        .order_by(LogDispositivoDB.data_evento.desc(), LogDispositivoDB.id.desc())
    )
    if tipo_log is not None:
        query_logs = query_logs.filter(LogDispositivoDB.tipo_log == tipo_log)
    return query_logs.all()


@router.get("/{computador_id}", response_model=ComputadorResponse)
def buscar_computador(computador_id: int, db: Session = Depends(get_db)):
    # Devolve um computador pelo id.
    computador = obter_computador(db, computador_id)
    if computador is None:
        raise HTTPException(status_code=404, detail="Computador nao encontrado")
    return computador


@router.post(
    "/",
    response_model=ComputadorResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def adicionar_computador(
    computador: ComputadorCreate, db: Session = Depends(get_db)
):
    # Valida referencias e cria um novo computador.
    validar_inventario(db, computador.inventario_id)
    validar_localizacao(db, computador.localizacao_id)
    validar_utilizador_responsavel(db, computador.utilizador_responsavel_id)
    existente = obter_computador_por_numero_serie(db, computador.numero_serie)
    if existente is not None:
        raise HTTPException(status_code=400, detail="Numero de serie ja existe")

    try:
        return criar_computador_db(db, computador.to_dict())
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Inventario, localizacao, utilizador ou numero de serie invalido",
        ) from None


@router.put(
    "/{computador_id}",
    response_model=ComputadorResponse,
    dependencies=[Depends(require_admin)],
)
def editar_computador(
    computador_id: int,
    computador_atualizado: ComputadorReplace,
    db: Session = Depends(get_db),
):
    # Substitui os dados completos de um computador.
    validar_inventario(db, computador_atualizado.inventario_id)
    validar_localizacao(db, computador_atualizado.localizacao_id)
    validar_utilizador_responsavel(
        db, computador_atualizado.utilizador_responsavel_id
    )
    existente = obter_computador_por_numero_serie(
        db, computador_atualizado.numero_serie
    )
    if existente is not None and existente.id != computador_id:
        raise HTTPException(status_code=400, detail="Numero de serie ja existe")

    try:
        computador = atualizar_computador_db(
            db, computador_id, computador_atualizado.to_dict()
        )
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Inventario, localizacao, utilizador ou numero de serie invalido",
        ) from None
    if computador is None:
        raise HTTPException(status_code=404, detail="Computador nao encontrado")
    return computador


@router.patch(
    "/{computador_id}",
    response_model=ComputadorResponse,
    dependencies=[Depends(require_admin)],
)
def atualizar_parcialmente_computador(
    computador_id: int,
    computador_atualizado: ComputadorUpdate,
    db: Session = Depends(get_db),
):
    # Atualiza apenas os campos enviados no pedido.
    computador = obter_computador(db, computador_id)
    if computador is None:
        raise HTTPException(status_code=404, detail="Computador nao encontrado")

    dados_atualizados = computador_atualizado.to_dict(exclude_unset=True)

    if "inventario_id" in dados_atualizados:
        validar_inventario(db, dados_atualizados["inventario_id"])

    if "localizacao_id" in dados_atualizados:
        validar_localizacao(db, dados_atualizados["localizacao_id"])

    if "utilizador_responsavel_id" in dados_atualizados:
        validar_utilizador_responsavel(
            db, dados_atualizados["utilizador_responsavel_id"]
        )

    if "numero_serie" in dados_atualizados:
        existente = obter_computador_por_numero_serie(
            db, dados_atualizados["numero_serie"]
        )
        if existente is not None and existente.id != computador_id:
            raise HTTPException(status_code=400, detail="Numero de serie ja existe")

    try:
        computador = atualizar_computador_db(db, computador_id, dados_atualizados)
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="Inventario, localizacao, utilizador ou numero de serie invalido",
        ) from None
    if computador is None:
        raise HTTPException(status_code=404, detail="Computador nao encontrado")
    return computador


@router.delete(
    "/{computador_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def apagar_computador(computador_id: int, db: Session = Depends(get_db)):
    # Remove um computador pelo id.
    removido = apagar_computador_db(db, computador_id)
    if not removido:
        raise HTTPException(status_code=404, detail="Computador nao encontrado")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
