"""Comentario geral deste ficheiro: define a logica principal deste modulo."""

# Modelo ORM dos dispositivos descobertos pelo scan.
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class DispositivoDescobertoDB(Base):
    __tablename__ = "dispositivos_descobertos"
    __table_args__ = (
        UniqueConstraint("inventario_id", "ip", name="uq_dispositivo_descoberto_inventario_ip"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    inventario_id: Mapped[int] = mapped_column(
        ForeignKey("inventarios.id"), nullable=False, index=True
    )
    ip: Mapped[str] = mapped_column(String(45), nullable=False, index=True)
    mac_address: Mapped[str | None] = mapped_column(String(17), nullable=True)
    hostname: Mapped[str | None] = mapped_column(String(100), nullable=True)
    marca: Mapped[str | None] = mapped_column(String(100), nullable=True)
    modelo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    numero_serie: Mapped[str | None] = mapped_column(String(120), nullable=True)
    sistema_operativo: Mapped[str | None] = mapped_column(String(120), nullable=True)
    origem_registo: Mapped[str] = mapped_column(String(30), nullable=False, default="scan")
    estado: Mapped[str] = mapped_column(String(50), nullable=False)
    ultima_vez_ativo_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    inventario: Mapped["InventarioDB"] = relationship(
        back_populates="dispositivos_descobertos"
    )

    @property
    def inventario_nome(self) -> str | None:
        if self.inventario is None:
            return None
        return self.inventario.nome

