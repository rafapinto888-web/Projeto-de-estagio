# Schemas de criacao, atualizacao e resposta de computadores.
from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    def to_dict(self, exclude_unset: bool = False) -> dict:
        if hasattr(self, "model_dump"):
            return self.model_dump(exclude_unset=exclude_unset)
        return self.dict(exclude_unset=exclude_unset)


class ComputadorBase(BaseSchema):
    nome: str
    marca: str
    modelo: str
    numero_serie: str
    estado: str
    inventario_id: int
    localizacao_id: int | None = None
    utilizador_responsavel_id: int | None = None


class ComputadorCreate(ComputadorBase):
    pass


class ComputadorReplace(ComputadorBase):
    pass


class ComputadorUpdate(BaseSchema):
    nome: str | None = None
    marca: str | None = None
    modelo: str | None = None
    numero_serie: str | None = None
    estado: str | None = None
    inventario_id: int | None = None
    localizacao_id: int | None = None
    utilizador_responsavel_id: int | None = None


class ComputadorResponse(ComputadorBase):
    id: int
    inventario_nome: str | None = None
    localizacao_nome: str | None = None
    utilizador_responsavel_nome: str | None = None
