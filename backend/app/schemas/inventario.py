"""Schemas de inventarios, scan de rede, ativos unificados e pesquisa."""

# Schemas de inventarios, detalhes e respostas de scan.
from enum import Enum
from ipaddress import ip_network
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from typing import Literal

from app.schemas.dispositivo_descoberto import (
    DispositivoDescobertoResponse,
    DispositivoDescobertoScanResponse,
)
from app.schemas.localizacao import LocalizacaoResponse
from app.schemas.utilizador import UtilizadorResponse


class TipoInventarioEnum(str, Enum):
    # Opcoes fechadas para o tipo de inventario no Swagger/API.
    normal = "normal"
    sub_rede = "sub_rede"


class InventarioBase(BaseModel):
    # Identifica se o inventario e de sub-rede ou grupo logico.
    tipo_inventario: TipoInventarioEnum = TipoInventarioEnum.normal
    nome: str
    descricao: str | None = None
    rede: str | None = None

    @field_validator("rede")
    @classmethod
    def validar_rede(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
        rede_limpa = valor.strip()
        if not rede_limpa:
            return None
        try:
            rede = ip_network(rede_limpa, strict=False)
        except ValueError as exc:
            raise ValueError("rede invalida") from exc
        if rede.version != 4:
            raise ValueError("rede tem de ser IPv4")
        return str(rede)

class InventarioCreate(InventarioBase):
    @model_validator(mode="after")
    def validar_regra_tipo_rede(self):
        # Sub-rede exige campo rede; inventario normal nao exige.
        if self.tipo_inventario == TipoInventarioEnum.sub_rede and not self.rede:
            raise ValueError("Inventario do tipo sub_rede exige uma rede valida")
        return self


class InventarioUpdate(InventarioBase):
    @model_validator(mode="after")
    def validar_regra_tipo_rede(self):
        # Sub-rede exige campo rede; inventario normal nao exige.
        if self.tipo_inventario == TipoInventarioEnum.sub_rede and not self.rede:
            raise ValueError("Inventario do tipo sub_rede exige uma rede valida")
        return self


class InventarioResponse(InventarioBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class InventarioComContagensResponse(InventarioResponse):
    """Lista/detalhe de inventário com totais para painel e tabelas."""

    total_computadores: int = 0
    total_dispositivos_scan: int = 0


class ScanRedeRequest(BaseModel):
    """Pedido de scan com credenciais de rede e tipos de log a recolher."""

    rede: str | None = None
    utilizador: str
    password: str
    tipos_log: list[Literal["seguranca", "rdp"]] = Field(
        default_factory=lambda: ["seguranca", "rdp"]
    )

    @field_validator("rede")
    @classmethod
    def validar_rede(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
        rede_limpa = valor.strip()
        if not rede_limpa:
            return None

        try:
            rede = ip_network(rede_limpa, strict=False)
        except ValueError as exc:
            raise ValueError("rede invalida") from exc

        if rede.version != 4:
            raise ValueError("rede tem de ser IPv4")

        return str(rede)

    @field_validator("utilizador")
    @classmethod
    def validar_utilizador(cls, valor: str) -> str:
        utilizador = valor.strip()
        if not utilizador:
            raise ValueError("utilizador de rede e obrigatorio")
        return utilizador

    @field_validator("password")
    @classmethod
    def validar_password(cls, valor: str) -> str:
        if not valor or not valor.strip():
            raise ValueError("password de rede e obrigatoria")
        return valor

    @field_validator("tipos_log")
    @classmethod
    def validar_tipos_log(
        cls, valor: list[Literal["seguranca", "rdp"]]
    ) -> list[Literal["seguranca", "rdp"]]:
        if not valor:
            raise ValueError("seleciona pelo menos um tipo de log")
        # Remove duplicados mantendo ordem.
        vistos: set[str] = set()
        limpo: list[Literal["seguranca", "rdp"]] = []
        for item in valor:
            if item in vistos:
                continue
            vistos.add(item)
            limpo.append(item)
        return limpo


class InventarioScanInfo(BaseModel):
    id: int
    nome: str


class ScanRedeResponse(BaseModel):
    """Resultado do scan: dispositivos encontrados e total de logs guardados."""

    inventario: InventarioScanInfo
    rede_analisada: str
    total_dispositivos_encontrados: int
    total_logs_recolhidos: int = 0
    dispositivos_descobertos: list[DispositivoDescobertoScanResponse]


class ComputadorDetalhadoInventarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    marca: str
    modelo: str
    numero_serie: str
    estado: str
    localizacao: LocalizacaoResponse | None = None
    utilizador_responsavel: UtilizadorResponse | None = None


class ComputadorPesquisaInventarioItem(ComputadorDetalhadoInventarioResponse):
    tipo: Literal["computador"] = "computador"


class DispositivoDescobertoPesquisaInventarioItem(DispositivoDescobertoResponse):
    tipo: Literal["dispositivo_descoberto"] = "dispositivo_descoberto"


class PesquisaInventarioResponse(BaseModel):
    computadores: list[ComputadorPesquisaInventarioItem]
    dispositivos_descobertos: list[DispositivoDescobertoPesquisaInventarioItem]


class AtivoInventarioItem(BaseModel):
    tipo: Literal["computador", "dispositivo_descoberto"]
    id: int
    inventario_id: int
    nome: str | None = None
    hostname: str | None = None
    ip: str | None = None
    numero_serie: str | None = None
    estado: str | None = None
    marca: str | None = None
    modelo: str | None = None
    mac_address: str | None = None
    sistema_operativo: str | None = None
    localizacao_nome: str | None = None
    utilizador_responsavel_nome: str | None = None
    ultima_vez_ativo_em: datetime | None = None
    # Só para dispositivo_descoberto: primeira vez visto neste inventário (IP).
    criado_em: datetime | None = None
    # Só preenchido quando tipo == dispositivo_descoberto (coluna origem_registo).
    origem_registo: str | None = None


class InventarioAtivosGrupoResponse(BaseModel):
    """Inventário visível com lista unificada de registos manuais e descobertos no scan."""

    inventario_id: int
    inventario_nome: str
    tipo_inventario: TipoInventarioEnum
    ativos: list[AtivoInventarioItem]


class InventarioDetalhesResponse(InventarioResponse):
    computadores: list[ComputadorDetalhadoInventarioResponse]
    dispositivos_descobertos: list[DispositivoDescobertoResponse]

