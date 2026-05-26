"""Modelo ORM da tabela inventarios (normal ou sub-rede)."""

# Modelo ORM dos inventarios de equipamentos.
from __future__ import annotations

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class InventarioDB(Base):
    """Grupo logico ou inventario associado a uma rede para scan."""

    __tablename__ = "inventarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(100))
    descricao: Mapped[str | None] = mapped_column(Text)
    tipo_inventario: Mapped[str] = mapped_column(String(20), default="normal")
    rede: Mapped[str | None] = mapped_column(String(50))

    computadores: Mapped[list["ComputadorDB"]] = relationship(
        back_populates="inventario"
    )
    dispositivos_descobertos: Mapped[list["DispositivoDescobertoDB"]] = relationship(
        back_populates="inventario"
    )

