"""Schemas de login, sessao autenticada por cookie e historico do utilizador."""

from datetime import UTC, datetime

from pydantic import BaseModel, ConfigDict, Field, field_serializer


class LoginRequest(BaseModel):
    """Pedido de login com identificador (username ou email) e password."""

    model_config = ConfigDict(extra="forbid")

    identificador: str = Field(min_length=1)
    palavra_passe: str = Field(min_length=1)


class AuthLoginResponse(BaseModel):
    """Resposta do login; a autenticacao persiste via cookie HttpOnly, nao via JWT no corpo."""

    ok: bool = True
    message: str = "Sessao iniciada"


class AuthLogoutResponse(BaseModel):
    ok: bool = True
    message: str = "Sessao terminada"


class AuthMeResponse(BaseModel):
    """Dados do utilizador autenticado (endpoint /auth/me)."""

    id: int
    nome: str
    username: str
    email: str
    perfil_id: int
    perfil_nome: str | None = None


class HistoricoRegistoIn(BaseModel):
    """Registo de atividade sempre associado ao utilizador autenticado pela sessao atual."""

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
