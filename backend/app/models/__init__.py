# Pacote com os modelos ORM da aplicacao.
"""Modelos internos da aplicacao."""

from app.models.computador_db import ComputadorDB
from app.models.dispositivo_descoberto_db import DispositivoDescobertoDB
from app.models.inventario_db import InventarioDB
from app.models.localizacao_db import LocalizacaoDB
from app.models.log_dispositivo_db import LogDispositivoDB
from app.models.log_sistema_db import LogSistemaDB
from app.models.perfil_db import PerfilDB
from app.models.utilizador_db import UtilizadorDB

__all__ = [
    "ComputadorDB",
    "DispositivoDescobertoDB",
    "InventarioDB",
    "LocalizacaoDB",
    "LogDispositivoDB",
    "LogSistemaDB",
    "PerfilDB",
    "UtilizadorDB",
]
