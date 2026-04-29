# Modelo ORM de computadores registados manualmente.
from __future__ import annotations

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.connection import Base


class ComputadorDB(Base):
    __tablename__ = "computadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    marca: Mapped[str] = mapped_column(String(100), nullable=False)
    modelo: Mapped[str] = mapped_column(String(100), nullable=False)
    numero_serie: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    estado: Mapped[str] = mapped_column(String(50), nullable=False)
    inventario_id: Mapped[int] = mapped_column(
        ForeignKey("inventarios.id"), nullable=False, index=True
    )
    localizacao_id: Mapped[int | None] = mapped_column(
        ForeignKey("localizacoes.id"), nullable=True, index=True
    )
    utilizador_responsavel_id: Mapped[int | None] = mapped_column(
        ForeignKey("utilizadores.id"), nullable=True, index=True
    )

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
