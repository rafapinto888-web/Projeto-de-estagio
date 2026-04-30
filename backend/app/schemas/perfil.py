# Schemas de perfis de utilizador.
from pydantic import BaseModel, ConfigDict


class PerfilBase(BaseModel):
    nome: str


class PerfilCreate(PerfilBase):
    pass


class PerfilUpdate(PerfilBase):
    pass


class PerfilResponse(PerfilBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
