# Schemas de inventarios, detalhes e respostas de scan.
from enum import Enum
from ipaddress import ip_network
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator, model_validator
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


class ScanRedeRequest(BaseModel):
    rede: str | None = None
    utilizador: str | None = None
    password: str | None = None

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
    def validar_utilizador(cls, valor: str | None) -> str | None:
        if valor is None:
            return None
        utilizador = valor.strip()
        return utilizador or None


class InventarioScanInfo(BaseModel):
    id: int
    nome: str


class ScanRedeResponse(BaseModel):
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
    localizacao_nome: str | None = None
    utilizador_responsavel_nome: str | None = None
    ultima_vez_ativo_em: datetime | None = None


class InventarioDetalhesResponse(InventarioResponse):
    computadores: list[ComputadorDetalhadoInventarioResponse]
    dispositivos_descobertos: list[DispositivoDescobertoResponse]
