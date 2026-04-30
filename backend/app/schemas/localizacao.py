"""Comentario geral deste ficheiro: define a logica principal deste modulo."""

# Schemas de localizacoes para requests e responses.
from pydantic import BaseModel, ConfigDict, Field, field_validator


class LocalizacaoBase(BaseModel):
    nome: str
    descricao: str | None = Field(default=None)

    @field_validator("descricao", mode="before")
    @classmethod
    def normalizar_descricao(cls, value: str | None):
        if value is None:
            return None
        if isinstance(value, str) and value.strip() == "":
            return None
        return value


class LocalizacaoCreate(LocalizacaoBase):
    pass


class LocalizacaoUpdate(LocalizacaoBase):
    pass


class LocalizacaoResponse(LocalizacaoBase):
    model_config = ConfigDict(from_attributes=True)

    id: int

