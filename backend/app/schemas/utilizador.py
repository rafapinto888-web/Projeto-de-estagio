"""Comentario geral deste ficheiro: define a logica principal deste modulo."""

# Schemas de utilizadores para criacao, update e resposta.
from pydantic import BaseModel, ConfigDict, Field


class UtilizadorBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nome: str
    username: str
    email: str
    perfil_id: int


class UtilizadorCreate(UtilizadorBase):
    palavra_passe: str = Field(min_length=1)


class UtilizadorUpdate(UtilizadorBase):
    palavra_passe: str | None = Field(default=None, min_length=1)


class UtilizadorResponse(UtilizadorBase):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: int

