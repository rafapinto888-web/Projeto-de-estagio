# Schemas dos dispositivos descobertos no scan de rede.
from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_serializer, field_validator, model_validator


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    def to_dict(self, exclude_unset: bool = False) -> dict:
        if hasattr(self, "model_dump"):
            return self.model_dump(exclude_unset=exclude_unset)
        return self.dict(exclude_unset=exclude_unset)


def _limpar_texto_obrigatorio(valor: str, nome_campo: str) -> str:
    valor_limpo = valor.strip()
    if not valor_limpo:
        raise ValueError(f"{nome_campo} nao pode estar vazio")
    return valor_limpo


class DispositivoDescobertoCreate(BaseSchema):
    ip: str
    estado: str
    mac_address: str | None = None
    hostname: str | None = None
    marca: str | None = None
    modelo: str | None = None
    numero_serie: str | None = None
    sistema_operativo: str | None = None
    origem_registo: str | None = "scan"

    @field_validator("ip")
    @classmethod
    def validar_ip(cls, valor: str) -> str:
        return _limpar_texto_obrigatorio(valor, "ip")

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, valor: str) -> str:
        return _limpar_texto_obrigatorio(valor, "estado")


class DispositivoDescobertoUpdate(BaseSchema):
    ip: str | None = None
    estado: str | None = None
    mac_address: str | None = None
    hostname: str | None = None
    marca: str | None = None
    modelo: str | None = None
    numero_serie: str | None = None
    sistema_operativo: str | None = None
    origem_registo: str | None = None

    @field_validator("ip")
    @classmethod
    def validar_ip(cls, valor: str | None) -> str | None:
        if valor is None:
            return valor
        return _limpar_texto_obrigatorio(valor, "ip")

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, valor: str | None) -> str | None:
        if valor is None:
            return valor
        return _limpar_texto_obrigatorio(valor, "estado")


class DispositivoDescobertoResponse(BaseSchema):
    id: int
    inventario_id: int
    inventario_nome: str | None = None
    ip: str
    mac_address: str | None = None
    hostname: str | None = None
    marca: str | None = None
    modelo: str | None = None
    numero_serie: str | None = None
    sistema_operativo: str | None = None
    origem_registo: str | None = None
    estado: str | None = None
    ultima_vez_ativo_em: datetime | None = None

    @model_validator(mode="after")
    def mostrar_ultima_vez_ativo_apenas_offline(self):
        # Mostra ultima_vez_ativo_em apenas quando o dispositivo estiver offline.
        if self.estado is None or self.estado.lower() != "inativo":
            self.ultima_vez_ativo_em = None
        return self

    @field_serializer("ultima_vez_ativo_em", when_used="json")
    def formatar_ultima_vez_ativo_em(self, valor: datetime | None):
        # Formata a data para um formato mais legível no JSON.
        if valor is None:
            return None
        return valor.strftime("%Y-%m-%d %H:%M:%S")


class DispositivoDescobertoScanResponse(DispositivoDescobertoResponse):
    pass
