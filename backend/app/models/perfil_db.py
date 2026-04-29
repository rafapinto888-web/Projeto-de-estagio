# Modelo ORM dos perfis de utilizador.
from __future__ import annotations

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class PerfilDB(Base):
    __tablename__ = "perfis"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)

    utilizadores: Mapped[list["UtilizadorDB"]] = relationship(
        back_populates="perfil"
    )
