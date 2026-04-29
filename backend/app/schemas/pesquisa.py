# Schema de resposta da pesquisa global do sistema.
from pydantic import BaseModel

from app.schemas.computador import ComputadorResponse
from app.schemas.inventario import InventarioResponse
from app.schemas.localizacao import LocalizacaoResponse
from app.schemas.utilizador import UtilizadorResponse


class PesquisaGlobalResponse(BaseModel):
    computadores: list[ComputadorResponse]
    inventarios: list[InventarioResponse]
    utilizadores: list[UtilizadorResponse]
    localizacoes: list[LocalizacaoResponse]
