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
