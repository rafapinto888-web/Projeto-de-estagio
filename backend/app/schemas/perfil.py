"""Comentario geral deste ficheiro: define a logica principal deste modulo."""

# Schemas de perfis de utilizador.
from pydantic import BaseModel, ConfigDict, Field, computed_field


class PerfilBase(BaseModel):
    nome: str


class PerfilCreate(PerfilBase):
    pass


class PerfilUpdate(PerfilBase):
    pass


class UtilizadorResumoNoPerfil(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    nome: str
    username: str
    email: str


class PerfilResponse(PerfilBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    utilizadores: list[UtilizadorResumoNoPerfil] = Field(default_factory=list)

    @computed_field
    def quantidade_utilizadores(self) -> int:
        return len(self.utilizadores)

