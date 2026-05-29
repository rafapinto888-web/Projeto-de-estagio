"""Dados minimos ao arranque da API (utilizador admin por defeito para desenvolvimento/demo)."""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.core.deps import perfil_nome_e_admin
from app.core.security import password_hash
from app.models.perfil_db import PerfilDB
from app.models.utilizador_db import UtilizadorDB

logger = logging.getLogger(__name__)

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "inventario123"
ADMIN_EMAIL = "admin@inventario.local"
ADMIN_NOME_EXIBICAO = "Administrador"
PERFIL_ADMIN_NOVO_NOME = "Admin"


def _obter_ou_criar_perfil_admin_id(db: Session) -> int:
    """Devolve id de um perfil com privilegios admin; cria 'Admin' se ainda nao existir."""
    for p in db.query(PerfilDB).order_by(PerfilDB.id):
        if perfil_nome_e_admin(p.nome):
            return p.id
    perfil = PerfilDB(nome=PERFIL_ADMIN_NOVO_NOME)
    db.add(perfil)
    db.commit()
    db.refresh(perfil)
    logger.info(
        "Perfil '%s' criado automaticamente (id=%s) para a conta admin por defeito.",
        PERFIL_ADMIN_NOVO_NOME,
        perfil.id,
    )
    return perfil.id


def garantir_utilizador_admin_inicial(db: Session) -> None:
    """
    Garante um utilizador com username 'admin' e password configurada.

    Idempotente: se o username ja existir, nao altera password nem dados.
    Em producao, altera a password apos o primeiro login.
    """
    existente = (
        db.query(UtilizadorDB)
        .filter(UtilizadorDB.username == ADMIN_USERNAME)
        .first()
    )
    if existente is not None:
        logger.debug("Utilizador '%s' ja existe — sem seed.", ADMIN_USERNAME)
        return

    perfil_id = _obter_ou_criar_perfil_admin_id(db)
    utilizador = UtilizadorDB(
        nome=ADMIN_NOME_EXIBICAO,
        username=ADMIN_USERNAME,
        email=ADMIN_EMAIL,
        palavra_passe_hash=password_hash.hash(ADMIN_PASSWORD),
        perfil_id=perfil_id,
    )
    db.add(utilizador)
    db.commit()
    logger.info(
        "Utilizador inicial '%s' criado (perfil_id=%s). Password por defeito so para dev/demo.",
        ADMIN_USERNAME,
        perfil_id,
    )
