# Rotas para gestao de inventarios, scan e dispositivos descobertos.
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import String, cast, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, contains_eager, joinedload

from app.core.deps import get_current_user, is_admin_user, require_admin
from app.database.connection import get_db
from app.models.computador_db import ComputadorDB
from app.models.dispositivo_descoberto_db import DispositivoDescobertoDB
from app.models.inventario_db import InventarioDB
from app.models.localizacao_db import LocalizacaoDB
from app.models.log_dispositivo_db import LogDispositivoDB
from app.models.utilizador_db import UtilizadorDB
from app.schemas.dispositivo_descoberto import (
    DispositivoDescobertoResponse,
    DispositivoDescobertoScanResponse,
)
from app.services.scan_rede import descobrir_dispositivos_enriquecidos
from app.services.windows_logs import coletar_logs_windows
from app.schemas.log_dispositivo import LogsDispositivoConsultaResponse
from app.schemas.inventario import (
    AtivoInventarioItem,
    ComputadorDetalhadoInventarioResponse,
    ComputadorPesquisaInventarioItem,
    DispositivoDescobertoPesquisaInventarioItem,
    InventarioCreate,
    InventarioDetalhesResponse,
    InventarioResponse,
    InventarioScanInfo,
    TipoInventarioEnum,
    InventarioUpdate,
    PesquisaInventarioResponse,
    ScanRedeRequest,
    ScanRedeResponse,
)

router = APIRouter(prefix="/inventarios", tags=["Inventarios"])


def obter_inventario_ou_404(db: Session, inventario_id: int) -> InventarioDB:
    inventario = db.get(InventarioDB, inventario_id)
    if inventario is None:
        raise HTTPException(status_code=404, detail="Inventario nao encontrado")
    return inventario


def obter_dispositivo_descoberto_ou_404(
    db: Session,
    inventario_id: int,
    dispositivo_id: int,
) -> DispositivoDescobertoDB:
    dispositivo = db.get(DispositivoDescobertoDB, dispositivo_id)
    if dispositivo is None or dispositivo.inventario_id != inventario_id:
        raise HTTPException(
            status_code=404,
            detail="Dispositivo descoberto nao encontrado neste inventario",
        )
    return dispositivo


def obter_dispositivos_descobertos_por_ips(
    db: Session,
    inventario_id: int,
    ips: list[str],
) -> dict[str, DispositivoDescobertoDB]:
    if not ips:
        return {}

    dispositivos = (
        db.query(DispositivoDescobertoDB)
        .filter(
            DispositivoDescobertoDB.inventario_id == inventario_id,
            DispositivoDescobertoDB.ip.in_(ips),
        )
        .all()
    )
    return {dispositivo.ip: dispositivo for dispositivo in dispositivos}


def _resolver_computador_para_dispositivo(
    db: Session,
    inventario_id: int,
    dispositivo: DispositivoDescobertoDB,
) -> ComputadorDB | None:
    # Tenta resolver computador por numero de serie (mais fiavel) ou nome/hostname.
    if dispositivo.numero_serie:
        por_serie = (
            db.query(ComputadorDB)
            .filter(
                ComputadorDB.inventario_id == inventario_id,
                ComputadorDB.numero_serie == dispositivo.numero_serie,
            )
            .first()
        )
        if por_serie is not None:
            return por_serie

    if dispositivo.hostname:
        hostname = dispositivo.hostname.strip()
        if hostname:
            por_nome = (
                db.query(ComputadorDB)
                .filter(
                    ComputadorDB.inventario_id == inventario_id,
                    ComputadorDB.nome.ilike(hostname),
                )
                .first()
            )
            if por_nome is not None:
                return por_nome
    return None


def _guardar_logs_windows_no_computador(
    db: Session,
    computador_id: int,
    logs: list[dict[str, str]],
) -> int:
    # Guarda logs evitando duplicados basicos por computador+tipo+data_evento+descricao.
    guardados = 0
    for log in logs:
        existente = (
            db.query(LogDispositivoDB)
            .filter(
                LogDispositivoDB.computador_id == computador_id,
                LogDispositivoDB.tipo_log == log["tipo_log"],
                LogDispositivoDB.data_evento == datetime.fromisoformat(log["data_evento"]),
                LogDispositivoDB.descricao == log["descricao"],
            )
            .first()
        )
        if existente is not None:
            continue
        db.add(
            LogDispositivoDB(
                computador_id=computador_id,
                tipo_log=log["tipo_log"],
                descricao=log["descricao"],
                data_evento=datetime.fromisoformat(log["data_evento"]),
            )
        )
        guardados += 1
    return guardados


def _inventarios_visiveis_query(db: Session, current_user: UtilizadorDB):
    # Admin ve todos; utilizador normal apenas inventarios dos seus computadores.
    if is_admin_user(current_user):
        return db.query(InventarioDB)
    return (
        db.query(InventarioDB)
        .join(ComputadorDB, ComputadorDB.inventario_id == InventarioDB.id)
        .filter(ComputadorDB.utilizador_responsavel_id == current_user.id)
        .distinct()
    )


def _garantir_acesso_inventario(
    db: Session, inventario_id: int, current_user: UtilizadorDB
) -> InventarioDB:
    inventario = obter_inventario_ou_404(db, inventario_id)
    if is_admin_user(current_user):
        return inventario
    permitido = (
        db.query(ComputadorDB.id)
        .filter(
            ComputadorDB.inventario_id == inventario_id,
            ComputadorDB.utilizador_responsavel_id == current_user.id,
        )
        .first()
    )
    if permitido is None:
        raise HTTPException(
            status_code=403,
            detail="Sem permissao para aceder a este inventario",
        )
    return inventario


@router.get("/", response_model=list[InventarioResponse])
def listar_inventarios(
    db: Session = Depends(get_db),
    current_user: UtilizadorDB = Depends(get_current_user),
):
    return _inventarios_visiveis_query(db, current_user).order_by(InventarioDB.id).all()


@router.get("/{inventario_id}", response_model=InventarioResponse)
def obter_inventario(
    inventario_id: int,
    db: Session = Depends(get_db),
    current_user: UtilizadorDB = Depends(get_current_user),
):
    return _garantir_acesso_inventario(db, inventario_id, current_user)


@router.post(
    "/criar-rapido",
    response_model=InventarioResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def criar_inventario_rapido(
    nome: str = Query(..., min_length=1),
    tipo_inventario: TipoInventarioEnum = Query(default=TipoInventarioEnum.normal),
    descricao: str | None = Query(default=None),
    rede: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    # Endpoint alternativo para Swagger com opcoes no tipo_inventario.
    payload = InventarioCreate(
        nome=nome,
        descricao=descricao,
        tipo_inventario=tipo_inventario,
        rede=rede,
    )

    existente = db.query(InventarioDB).filter(InventarioDB.nome == payload.nome).first()
    if existente is not None:
        raise HTTPException(status_code=409, detail="Nome de inventario ja existe")

    novo_inventario = InventarioDB(
        nome=payload.nome,
        descricao=payload.descricao,
        tipo_inventario=payload.tipo_inventario.value,
        rede=payload.rede,
    )
    db.add(novo_inventario)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Nao foi possivel criar o inventario",
        ) from None
    db.refresh(novo_inventario)
    return novo_inventario


@router.get("/{inventario_id}/computadores", response_model=list[AtivoInventarioItem])
def listar_computadores_do_inventario(
    inventario_id: int,
    db: Session = Depends(get_db),
    current_user: UtilizadorDB = Depends(get_current_user),
):
    # Devolve lista unificada de computadores manuais e dispositivos do scan.
    _garantir_acesso_inventario(db, inventario_id, current_user)

    computadores = (
        db.query(ComputadorDB)
        .options(
            joinedload(ComputadorDB.localizacao),
            joinedload(ComputadorDB.utilizador_responsavel),
        )
        .filter(ComputadorDB.inventario_id == inventario_id)
        .order_by(ComputadorDB.id)
        .all()
    )
    if not is_admin_user(current_user):
        computadores = [
            c for c in computadores if c.utilizador_responsavel_id == current_user.id
        ]
    dispositivos = []
    if is_admin_user(current_user):
        dispositivos = (
            db.query(DispositivoDescobertoDB)
            .filter(DispositivoDescobertoDB.inventario_id == inventario_id)
            .order_by(DispositivoDescobertoDB.id)
            .all()
        )

    ativos: list[AtivoInventarioItem] = []
    ativos.extend(
        AtivoInventarioItem(
            tipo="computador",
            id=c.id,
            inventario_id=c.inventario_id,
            nome=c.nome,
            ip=None,
            hostname=None,
            numero_serie=c.numero_serie,
            estado=c.estado,
            marca=c.marca,
            modelo=c.modelo,
            localizacao_nome=c.localizacao_nome,
            utilizador_responsavel_nome=c.utilizador_responsavel_nome,
            ultima_vez_ativo_em=None,
        )
        for c in computadores
    )
    ativos.extend(
        AtivoInventarioItem(
            tipo="dispositivo_descoberto",
            id=d.id,
            inventario_id=d.inventario_id,
            nome=None,
            hostname=d.hostname,
            ip=d.ip,
            numero_serie=d.numero_serie,
            estado=d.estado,
            marca=d.marca,
            modelo=d.modelo,
            localizacao_nome=None,
            utilizador_responsavel_nome=None,
            ultima_vez_ativo_em=d.ultima_vez_ativo_em,
        )
        for d in dispositivos
    )
    return ativos


@router.get(
    "/{inventario_id}/computadores/pesquisar",
    response_model=PesquisaInventarioResponse,
)
def pesquisar_computadores_do_inventario(
    inventario_id: int,
    termo: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: UtilizadorDB = Depends(get_current_user),
):
    _garantir_acesso_inventario(db, inventario_id, current_user)

    query_computadores = (
        db.query(ComputadorDB)
        .outerjoin(ComputadorDB.localizacao)
        .outerjoin(ComputadorDB.utilizador_responsavel)
        .options(
            contains_eager(ComputadorDB.localizacao),
            contains_eager(ComputadorDB.utilizador_responsavel),
        )
        .filter(ComputadorDB.inventario_id == inventario_id)
    )
    if not is_admin_user(current_user):
        query_computadores = query_computadores.filter(
            ComputadorDB.utilizador_responsavel_id == current_user.id
        )

    termo_limpo = termo.strip() if termo is not None else ""
    if termo_limpo:
        termo_like = f"%{termo_limpo}%"
        query_computadores = query_computadores.filter(
            or_(
                cast(ComputadorDB.id, String) == termo_limpo,
                ComputadorDB.nome.ilike(termo_like),
                ComputadorDB.marca.ilike(termo_like),
                ComputadorDB.modelo.ilike(termo_like),
                ComputadorDB.numero_serie.ilike(termo_like),
                ComputadorDB.estado.ilike(termo_like),
                LocalizacaoDB.nome.ilike(termo_like),
                UtilizadorDB.nome.ilike(termo_like),
                UtilizadorDB.email.ilike(termo_like),
            )
        )

    computadores = query_computadores.order_by(ComputadorDB.id).all()

    query_dispositivos = (
        db.query(DispositivoDescobertoDB)
        .filter(DispositivoDescobertoDB.inventario_id == inventario_id)
    )
    if not is_admin_user(current_user):
        query_dispositivos = query_dispositivos.filter(DispositivoDescobertoDB.id == -1)
    if termo_limpo:
        termo_like = f"%{termo_limpo}%"
        query_dispositivos = query_dispositivos.filter(
            or_(
                cast(DispositivoDescobertoDB.id, String) == termo_limpo,
                DispositivoDescobertoDB.ip.ilike(termo_like),
                DispositivoDescobertoDB.estado.ilike(termo_like),
                DispositivoDescobertoDB.hostname.ilike(termo_like),
                DispositivoDescobertoDB.marca.ilike(termo_like),
                DispositivoDescobertoDB.modelo.ilike(termo_like),
                DispositivoDescobertoDB.numero_serie.ilike(termo_like),
                DispositivoDescobertoDB.sistema_operativo.ilike(termo_like),
            )
        )

    dispositivos_descobertos = (
        query_dispositivos.order_by(DispositivoDescobertoDB.id).all()
    )

    return {
        "computadores": [
            ComputadorPesquisaInventarioItem.model_validate(computador)
            for computador in computadores
        ],
        "dispositivos_descobertos": [
            DispositivoDescobertoPesquisaInventarioItem.model_validate(dispositivo)
            for dispositivo in dispositivos_descobertos
        ],
    }


@router.get("/{inventario_id}/detalhes", response_model=InventarioDetalhesResponse)
def obter_detalhes_do_inventario(
    inventario_id: int,
    db: Session = Depends(get_db),
    current_user: UtilizadorDB = Depends(get_current_user),
):
    inventario = _garantir_acesso_inventario(db, inventario_id, current_user)

    computadores = (
        db.query(ComputadorDB)
        .options(
            joinedload(ComputadorDB.localizacao),
            joinedload(ComputadorDB.utilizador_responsavel),
        )
        .filter(ComputadorDB.inventario_id == inventario_id)
        .order_by(ComputadorDB.id)
        .all()
    )
    if not is_admin_user(current_user):
        computadores = [
            c for c in computadores if c.utilizador_responsavel_id == current_user.id
        ]
    dispositivos_descobertos = (
        db.query(DispositivoDescobertoDB)
        .filter(DispositivoDescobertoDB.inventario_id == inventario_id)
        .order_by(DispositivoDescobertoDB.id)
        .all()
    )
    if not is_admin_user(current_user):
        dispositivos_descobertos = []
    return {
        "id": inventario.id,
        "nome": inventario.nome,
        "descricao": inventario.descricao,
        "computadores": computadores,
        "dispositivos_descobertos": dispositivos_descobertos,
    }


@router.post(
    "/{inventario_id}/scan",
    response_model=ScanRedeResponse,
    dependencies=[Depends(require_admin)],
)
def executar_scan_do_inventario(
    inventario_id: int,
    pedido_scan: ScanRedeRequest,
    db: Session = Depends(get_db),
):
    # Valida inventário e aplica regra: scan so para inventario do tipo sub_rede.
    inventario = obter_inventario_ou_404(db, inventario_id)
    if inventario.tipo_inventario != "sub_rede":
        raise HTTPException(
            status_code=400,
            detail="Scan so esta disponivel para inventarios do tipo sub_rede",
        )

    # Prioriza rede enviada no pedido; se faltar, usa a rede definida no inventario.
    rede_alvo = pedido_scan.rede or inventario.rede
    if not rede_alvo:
        raise HTTPException(
            status_code=400,
            detail="Inventario sub_rede precisa de rede definida para executar scan",
        )

    # Usa pipeline consolidado do scan (descoberta + enriquecimento tecnico por IP).
    dispositivos_ativos = descobrir_dispositivos_enriquecidos(
        rede_alvo,
        pedido_scan.utilizador,
        pedido_scan.password,
    )
    ips_ativos = list(dict.fromkeys([d["ip"] for d in dispositivos_ativos if d.get("ip")]))
    ativos_por_ip = {d["ip"]: d for d in dispositivos_ativos if d.get("ip")}
    # Carrega os dispositivos já existentes neste inventário (por IP).
    existentes_por_ip = obter_dispositivos_descobertos_por_ips(
        db,
        inventario_id,
        ips_ativos,
    )
    # Guarda timestamp local sem microsegundos para facilitar leitura no frontend.
    instante_scan = datetime.now().replace(microsecond=0)
    logs_recolhidos_no_scan = 0

    try:
        # Cria novos ou atualiza existentes sem duplicar (inventario_id + ip).
        for ip in ips_ativos:
            dispositivo = existentes_por_ip.get(ip)
            dados_scan = ativos_por_ip.get(ip, {})
            hostname_novo = dados_scan.get("hostname")
            if dispositivo is None:
                # Novo IP no inventário: cria registo como ativo.
                dispositivo = DispositivoDescobertoDB(
                    inventario_id=inventario_id,
                    ip=ip,
                    estado="ativo",
                    mac_address=dados_scan.get("mac_address"),
                    hostname=hostname_novo,
                    marca=dados_scan.get("marca"),
                    modelo=dados_scan.get("modelo"),
                    numero_serie=dados_scan.get("numero_serie"),
                    sistema_operativo=dados_scan.get("sistema_operativo"),
                    origem_registo="scan",
                    ultima_vez_ativo_em=instante_scan,
                )
                db.add(dispositivo)
                existentes_por_ip[ip] = dispositivo
            else:
                # IP já existe: marca ativo e atualiza campos sem apagar valores antigos.
                dispositivo.estado = "ativo"
                dispositivo.ultima_vez_ativo_em = instante_scan
                dispositivo.mac_address = dados_scan.get("mac_address") or dispositivo.mac_address
                if hostname_novo and hostname_novo != dispositivo.hostname:
                    dispositivo.hostname = hostname_novo
                dispositivo.marca = dados_scan.get("marca") or dispositivo.marca
                dispositivo.modelo = dados_scan.get("modelo") or dispositivo.modelo
                dispositivo.numero_serie = dados_scan.get("numero_serie") or dispositivo.numero_serie
                dispositivo.sistema_operativo = (
                    dados_scan.get("sistema_operativo") or dispositivo.sistema_operativo
                )

            # Tenta recolher logs reais do Windows para o dispositivo/computador associado.
            computador_alvo = _resolver_computador_para_dispositivo(db, inventario_id, dispositivo)
            if computador_alvo is not None:
                logs_windows = coletar_logs_windows(
                    dispositivo.hostname or computador_alvo.nome,
                    max_eventos=20,
                    horas=24,
                )
                logs_recolhidos_no_scan += _guardar_logs_windows_no_computador(
                    db, computador_alvo.id, logs_windows
                )

        # Marca como inativos os dispositivos deste inventario que nao responderam neste scan.
        db.query(DispositivoDescobertoDB).filter(
            DispositivoDescobertoDB.inventario_id == inventario_id,
            ~DispositivoDescobertoDB.ip.in_(ips_ativos),
        ).update({"estado": "inativo"}, synchronize_session=False)

        # Persiste alterações do scan.
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Nao foi possivel guardar o resultado do scan",
        ) from None

    # Devolve apenas os dispositivos encontrados neste scan.
    dispositivos_guardados = (
        db.query(DispositivoDescobertoDB)
        .filter(
            DispositivoDescobertoDB.inventario_id == inventario_id,
            DispositivoDescobertoDB.ip.in_(ips_ativos),
        )
        .order_by(DispositivoDescobertoDB.id)
        .all()
    )

    return {
        "inventario": InventarioScanInfo(
            id=inventario.id,
            nome=inventario.nome,
        ),
        "rede_analisada": rede_alvo,
        "total_dispositivos_encontrados": len(dispositivos_guardados),
        "dispositivos_descobertos": [
            DispositivoDescobertoScanResponse.model_validate(dispositivo)
            for dispositivo in dispositivos_guardados
        ],
        "total_logs_recolhidos": logs_recolhidos_no_scan,
    }


@router.get(
    "/{inventario_id}/dispositivos-descobertos",
    response_model=list[DispositivoDescobertoResponse],
)
def listar_dispositivos_descobertos_do_inventario(
    inventario_id: int,
    db: Session = Depends(get_db),
    current_user: UtilizadorDB = Depends(get_current_user),
):
    _garantir_acesso_inventario(db, inventario_id, current_user)

    return (
        db.query(DispositivoDescobertoDB)
        .filter(DispositivoDescobertoDB.inventario_id == inventario_id)
        .order_by(DispositivoDescobertoDB.id)
        .all()
    )


@router.get(
    "/{inventario_id}/dispositivos-descobertos/{dispositivo_id}",
    response_model=DispositivoDescobertoResponse,
)
def obter_dispositivo_descoberto(
    inventario_id: int,
    dispositivo_id: int,
    db: Session = Depends(get_db),
    current_user: UtilizadorDB = Depends(get_current_user),
):
    _garantir_acesso_inventario(db, inventario_id, current_user)
    return obter_dispositivo_descoberto_ou_404(db, inventario_id, dispositivo_id)


@router.get(
    "/{inventario_id}/logs/dispositivos-descobertos",
    response_model=LogsDispositivoConsultaResponse,
)
def listar_logs_dos_dispositivos_descobertos(
    inventario_id: int,
    dispositivo_id: int | None = Query(default=None),
    coletar_agora: bool = Query(default=False),
    tipo_log: Literal["seguranca", "rdp"] | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: UtilizadorDB = Depends(get_current_user),
):
    # Lista logs de um dispositivo especifico ou de todos os dispositivos do inventario.
    _garantir_acesso_inventario(db, inventario_id, current_user)

    filtros: dict[str, str | int] = {"inventario_id": inventario_id}
    dispositivos_query = db.query(DispositivoDescobertoDB).filter(
        DispositivoDescobertoDB.inventario_id == inventario_id
    )
    if dispositivo_id is not None:
        dispositivos_query = dispositivos_query.filter(
            DispositivoDescobertoDB.id == dispositivo_id
        )
        filtros["dispositivo_id"] = dispositivo_id

    dispositivos = dispositivos_query.order_by(DispositivoDescobertoDB.id).all()
    if dispositivo_id is not None and not dispositivos:
        raise HTTPException(
            status_code=404,
            detail="Dispositivo descoberto nao encontrado neste inventario",
        )

    computadores_ids: set[int] = set()
    for dispositivo in dispositivos:
        computador = _resolver_computador_para_dispositivo(db, inventario_id, dispositivo)
        if computador is None:
            continue
        computadores_ids.add(computador.id)
        if coletar_agora:
            logs_windows = coletar_logs_windows(dispositivo.hostname or computador.nome)
            _guardar_logs_windows_no_computador(db, computador.id, logs_windows)

    if coletar_agora:
        db.commit()

    if not computadores_ids:
        return {"filtros": filtros, "total_logs": 0, "logs": []}

    query_logs = (
        db.query(LogDispositivoDB)
        .filter(LogDispositivoDB.computador_id.in_(list(computadores_ids)))
        .order_by(LogDispositivoDB.data_evento.desc(), LogDispositivoDB.id.desc())
    )
    if tipo_log is not None:
        filtros["tipo_log"] = tipo_log
        query_logs = query_logs.filter(LogDispositivoDB.tipo_log == tipo_log)

    logs = query_logs.all()
    return {"filtros": filtros, "total_logs": len(logs), "logs": logs}


@router.post(
    "/",
    response_model=InventarioResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def criar_inventario(inventario: InventarioCreate, db: Session = Depends(get_db)):
    existente = (
        db.query(InventarioDB).filter(InventarioDB.nome == inventario.nome).first()
    )
    if existente is not None:
        raise HTTPException(status_code=409, detail="Nome de inventario ja existe")

    novo_inventario = InventarioDB(
        nome=inventario.nome,
        descricao=inventario.descricao,
        tipo_inventario=inventario.tipo_inventario,
        rede=inventario.rede,
    )
    db.add(novo_inventario)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Nao foi possivel criar o inventario",
        ) from None
    db.refresh(novo_inventario)
    return novo_inventario


@router.put(
    "/{inventario_id}",
    response_model=InventarioResponse,
    dependencies=[Depends(require_admin)],
)
def atualizar_inventario(
    inventario_id: int,
    inventario_atualizado: InventarioUpdate,
    db: Session = Depends(get_db),
):
    inventario = db.get(InventarioDB, inventario_id)
    if inventario is None:
        raise HTTPException(status_code=404, detail="Inventario nao encontrado")

    existente = (
        db.query(InventarioDB)
        .filter(InventarioDB.nome == inventario_atualizado.nome)
        .first()
    )
    if existente is not None and existente.id != inventario_id:
        raise HTTPException(status_code=409, detail="Nome de inventario ja existe")

    inventario.nome = inventario_atualizado.nome
    inventario.descricao = inventario_atualizado.descricao
    inventario.tipo_inventario = inventario_atualizado.tipo_inventario
    inventario.rede = inventario_atualizado.rede
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Nao foi possivel atualizar o inventario",
        ) from None
    db.refresh(inventario)
    return inventario


@router.delete(
    "/{inventario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def apagar_inventario(inventario_id: int, db: Session = Depends(get_db)):
    inventario = obter_inventario_ou_404(db, inventario_id)

    if inventario.computadores:
        raise HTTPException(
            status_code=400,
            detail="Nao e possivel apagar o inventario porque existem computadores associados",
        )

    if inventario.dispositivos_descobertos:
        raise HTTPException(
            status_code=400,
            detail="Nao e possivel apagar o inventario porque existem dispositivos descobertos associados",
        )

    db.delete(inventario)
    db.commit()
