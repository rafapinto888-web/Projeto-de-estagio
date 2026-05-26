"""Modelo ORM da tabela dispositivos_descobertos (resultado do scan)."""

# Modelo ORM dos dispositivos descobertos pelo scan.
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class DispositivoDescobertoDB(Base):
    """Host encontrado no scan; unico por inventario_id + ip."""

    __tablename__ = "dispositivos_descobertos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    inventario_id: Mapped[int] = mapped_column(ForeignKey("inventarios.id"))
    ip: Mapped[str] = mapped_column(String(45))
    mac_address: Mapped[str | None] = mapped_column(String(17))
    hostname: Mapped[str | None] = mapped_column(String(100))
    marca: Mapped[str | None] = mapped_column(String(100))
    modelo: Mapped[str | None] = mapped_column(String(100))
    numero_serie: Mapped[str | None] = mapped_column(String(120))
    sistema_operativo: Mapped[str | None] = mapped_column(String(120))
    origem_registo: Mapped[str] = mapped_column(String(30), default="scan")
    estado: Mapped[str] = mapped_column(String(50))
    ultima_vez_ativo_em: Mapped[datetime | None] = mapped_column(DateTime)
    criado_em: Mapped[datetime | None] = mapped_column(DateTime)

    inventario: Mapped["InventarioDB"] = relationship(
        back_populates="dispositivos_descobertos"
    )

    @property
    def inventario_nome(self) -> str | None:
        # Nome do inventario para respostas JSON sem join extra.
        if self.inventario is None:
            return None
        return self.inventario.nome

