"""Modelo ORM da tabela logs_sistema (auditoria por utilizador)."""

# Modelo ORM dos logs de acoes do sistema.
from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base

if TYPE_CHECKING:
    from app.models.utilizador_db import UtilizadorDB


class LogSistemaDB(Base):
    """Registo de acao do utilizador na aplicacao (login, navegacao, etc.)."""

    __tablename__ = "logs_sistema"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    utilizador_id: Mapped[int] = mapped_column(ForeignKey("utilizadores.id"))
    acao: Mapped[str] = mapped_column(String(100))
    descricao: Mapped[str | None] = mapped_column(Text)
    data_evento: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC).replace(tzinfo=None)
    )

    utilizador: Mapped["UtilizadorDB"] = relationship(back_populates="logs_sistema")

