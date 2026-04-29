# Modelo ORM das localizacoes fisicas dos equipamentos.
from __future__ import annotations

from sqlalchemy import Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class LocalizacaoDB(Base):
    __tablename__ = "localizacoes"
    __table_args__ = (
        UniqueConstraint(
            "nome",
            "descricao",
            name="uq_localizacoes_nome_descricao",
            postgresql_nulls_not_distinct=True,
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)

    computadores: Mapped[list["ComputadorDB"]] = relationship(
        back_populates="localizacao"
    )
