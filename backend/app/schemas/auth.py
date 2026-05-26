"""Schemas de login, token JWT e historico de auditoria do utilizador."""

from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field, field_serializer


class LoginRequest(BaseModel):
    """Pedido de login com identificador (username ou email) e password."""

    model_config = ConfigDict(extra="forbid")

    identificador: str = Field(min_length=1)
    palavra_passe: str = Field(min_length=1)


class AuthTokenResponse(BaseModel):
    """Resposta com access + refresh JWT apos login bem-sucedido."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AuthRefreshRequest(BaseModel):
    """Pedido para obter novo access_token sem voltar a pedir password."""

    model_config = ConfigDict(extra="forbid")

    refresh_token: str = Field(min_length=10)


class AuthRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthMeResponse(BaseModel):
    """Dados do utilizador autenticado (endpoint /auth/me)."""

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

    @field_serializer("data_evento", when_used="json")
    def ser_data_evento_utc(self, v: datetime) -> str:
        # BD grava naive UTC; JSON sem "Z" faz o browser tratar como hora local e desfasar.
        if v.tzinfo is None:
            v = v.replace(tzinfo=UTC)
        return v.astimezone(UTC).isoformat().replace("+00:00", "Z")


class HistoricoUtilizadorLista(BaseModel):
    itens: list[HistoricoUtilizadorItem]

