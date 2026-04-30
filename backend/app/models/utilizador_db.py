"""Comentario geral deste ficheiro: define a logica principal deste modulo."""

# Modelo ORM dos utilizadores da aplicacao.
from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class UtilizadorDB(Base):
    __tablename__ = "utilizadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    palavra_passe_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    perfil_id: Mapped[int] = mapped_column(
        ForeignKey("perfis.id"), nullable=False, index=True
    )

    perfil: Mapped["PerfilDB"] = relationship(back_populates="utilizadores")
    computadores_responsavel: Mapped[list["ComputadorDB"]] = relationship(
        back_populates="utilizador_responsavel"
    )
    logs_sistema: Mapped[list["LogSistemaDB"]] = relationship(
        back_populates="utilizador"
    )

