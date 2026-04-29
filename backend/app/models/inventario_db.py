# Modelo ORM dos inventarios de equipamentos.
from __future__ import annotations

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class InventarioDB(Base):
    __tablename__ = "inventarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Tipo do inventario: normal (grupo logico) ou sub_rede.
    tipo_inventario: Mapped[str] = mapped_column(String(20), nullable=False, default="normal")
    # Rede associada ao inventario quando for do tipo sub_rede.
    rede: Mapped[str | None] = mapped_column(String(50), nullable=True)

    computadores: Mapped[list["ComputadorDB"]] = relationship(
        back_populates="inventario"
    )
    dispositivos_descobertos: Mapped[list["DispositivoDescobertoDB"]] = relationship(
        back_populates="inventario"
    )
