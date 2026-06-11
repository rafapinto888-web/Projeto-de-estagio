"""Hash de passwords (Argon2) e sessoes autenticadas por cookie HttpOnly."""

from __future__ import annotations

import hashlib
import os
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import Response
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError
from pwdlib.hashers.argon2 import Argon2Hasher


SECRET_KEY = os.getenv("SECRET_KEY", "inventario-dev-secret-key-change-in-production")
SESSION_EXPIRE_MINUTES = int(os.getenv("SESSION_EXPIRE_MINUTES", "60"))
SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "inventario_session").strip() or "inventario_session"
SESSION_COOKIE_SAMESITE = (os.getenv("SESSION_COOKIE_SAMESITE", "lax").strip().lower() or "lax")
SESSION_COOKIE_PATH = "/"


def _env_bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


SESSION_COOKIE_SECURE = _env_bool(
    "SESSION_COOKIE_SECURE",
    os.getenv("INVENTARIO_APP_ENV", "development").strip().lower() == "production",
)


def _build_password_hash() -> PasswordHash:
    """Apenas Argon2: novas passwords e verificacao de hashes ja guardados neste formato."""
    return PasswordHash((Argon2Hasher(),))


password_hash = _build_password_hash()


def verificar_palavra_passe(palavra_passe: str, palavra_passe_hash: str) -> bool:
    """Compara password em claro com hash Argon2 (PHC)."""
    try:
        return password_hash.verify(palavra_passe, palavra_passe_hash)
    except UnknownHashError:
        return False


def agora_utc_naive() -> datetime:
    """Timestamp UTC sem timezone explicita, alinhado com o resto das tabelas do projeto."""
    return datetime.now(UTC).replace(tzinfo=None)


def expira_sessao_em(base: datetime | None = None) -> datetime:
    """Calcula a nova expiracao da sessao a partir do instante indicado."""
    instante = base or agora_utc_naive()
    return instante + timedelta(minutes=SESSION_EXPIRE_MINUTES)


def criar_token_sessao() -> str:
    """Token opaco e aleatorio enviado ao browser via cookie HttpOnly."""
    return secrets.token_urlsafe(48)


def hash_token_sessao(token: str) -> str:
    """Hash SHA-256 do token de sessao para nao guardar o valor bruto na BD."""
    valor = str(token or "")
    return hashlib.sha256(valor.encode("utf-8")).hexdigest()


def configurar_cookie_sessao(response: Response, token: str, expires_at: datetime | None = None) -> None:
    """Escreve cookie de sessao com atributos seguros e expiracao alinhada com a BD."""
    exp = expires_at or expira_sessao_em()
    exp_http = exp.replace(tzinfo=UTC) if exp.tzinfo is None else exp.astimezone(UTC)
    max_age = max(0, int((exp - agora_utc_naive()).total_seconds()))
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        max_age=max_age,
        expires=exp_http,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite=SESSION_COOKIE_SAMESITE,
        path=SESSION_COOKIE_PATH,
    )


def limpar_cookie_sessao(response: Response) -> None:
    """Apaga o cookie de sessao do browser."""
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        secure=SESSION_COOKIE_SECURE,
        samesite=SESSION_COOKIE_SAMESITE,
        path=SESSION_COOKIE_PATH,
    )
