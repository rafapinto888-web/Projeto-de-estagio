"""Comentario geral deste ficheiro: define a logica principal deste modulo."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    identificador: str = Field(min_length=1)
    palavra_passe: str = Field(min_length=1)


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthMeResponse(BaseModel):
    id: int
    nome: str
    username: str
    email: str
    perfil_id: int
    perfil_nome: str | None = None


class HistoricoRegistoIn(BaseModel):
    """Registo de atividade sempre associado ao utilizador autenticado pelo token."""

    model_config = ConfigDict(extra="forbid")

    acao: str = Field(min_length=1, max_length=100, description='Ex.: "painel", "inventarios.criar"')
    descricao: str | None = Field(default=None, max_length=4000)


class HistoricoUtilizadorItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    acao: str
    descricao: str | None
    data_evento: datetime


class HistoricoUtilizadorLista(BaseModel):
    itens: list[HistoricoUtilizadorItem]

