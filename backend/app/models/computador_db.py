"""Modelo ORM da tabela computadores (registo manual no inventario)."""

# Modelo ORM de computadores registados manualmente.
from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class ComputadorDB(Base):
    """Equipamento registado manualmente com inventario, localizacao e responsavel."""

    __tablename__ = "computadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(100))
    marca: Mapped[str] = mapped_column(String(100))
    modelo: Mapped[str] = mapped_column(String(100))
    numero_serie: Mapped[str] = mapped_column(String(100))
    estado: Mapped[str] = mapped_column(String(50))
    inventario_id: Mapped[int] = mapped_column(ForeignKey("inventarios.id"))
    localizacao_id: Mapped[int | None] = mapped_column(ForeignKey("localizacoes.id"))
    utilizador_responsavel_id: Mapped[int | None] = mapped_column(ForeignKey("utilizadores.id"))
    hostname: Mapped[str | None] = mapped_column(String(100))
    endereco_ip: Mapped[str | None] = mapped_column(String(45))
    mac_address: Mapped[str | None] = mapped_column(String(17))
    sistema_operativo: Mapped[str | None] = mapped_column(String(120))

    inventario: Mapped["InventarioDB"] = relationship(back_populates="computadores")
    localizacao: Mapped["LocalizacaoDB | None"] = relationship(
        back_populates="computadores"
    )
    utilizador_responsavel: Mapped["UtilizadorDB | None"] = relationship(
        back_populates="computadores_responsavel"
    )
    logs_dispositivo: Mapped[list["LogDispositivoDB"]] = relationship(
        back_populates="computador"
    )

    @property
    def inventario_nome(self) -> str | None:
        # Devolve o nome do inventario associado ao computador.
        if self.inventario is None:
            return None
        return self.inventario.nome

    @property
    def localizacao_nome(self) -> str | None:
        # Devolve o nome da localizacao associada ao computador.
        if self.localizacao is None:
            return None
        return self.localizacao.nome

    @property
    def utilizador_responsavel_nome(self) -> str | None:
        # Devolve o nome do utilizador responsavel associado ao computador.
        if self.utilizador_responsavel is None:
            return None
        return self.utilizador_responsavel.nome

