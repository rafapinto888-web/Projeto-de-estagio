"""Modelo ORM da tabela utilizadores (credenciais e perfil)."""

# Modelo ORM dos utilizadores da aplicacao.
from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class UtilizadorDB(Base):
    """Conta de acesso com hash de password e perfil de permissoes."""

    __tablename__ = "utilizadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(100))
    username: Mapped[str] = mapped_column(String(50))
    email: Mapped[str] = mapped_column(String(100))
    palavra_passe_hash: Mapped[str] = mapped_column(String(255))
    perfil_id: Mapped[int] = mapped_column(ForeignKey("perfis.id"))

    perfil: Mapped["PerfilDB"] = relationship(back_populates="utilizadores")
    computadores_responsavel: Mapped[list["ComputadorDB"]] = relationship(
        back_populates="utilizador_responsavel"
    )
    logs_sistema: Mapped[list["LogSistemaDB"]] = relationship(
        back_populates="utilizador",
        cascade="all, delete-orphan",
    )

