"""Modelo ORM da tabela sessoes_utilizador (sessao autenticada por cookie)."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.security import agora_utc_naive, expira_sessao_em
from app.database.connection import Base

if TYPE_CHECKING:
    from app.models.utilizador_db import UtilizadorDB


class SessaoDB(Base):
    """Sessao autenticada persistida no servidor e identificada por token opaco."""

    __tablename__ = "sessoes_utilizador"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    utilizador_id: Mapped[int] = mapped_column(ForeignKey("utilizadores.id"))
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=agora_utc_naive)
    ultima_atividade_em: Mapped[datetime] = mapped_column(DateTime, default=agora_utc_naive)
    expira_em: Mapped[datetime] = mapped_column(DateTime, default=expira_sessao_em)
    revogado_em: Mapped[datetime | None] = mapped_column(DateTime, default=None)

    utilizador: Mapped["UtilizadorDB"] = relationship(back_populates="sessoes")
