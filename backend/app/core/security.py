"""Hash de passwords (Argon2), emissao e validacao de tokens JWT."""

import os
from datetime import UTC, datetime, timedelta

import jwt
from jwt import InvalidTokenError
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.exceptions import UnknownHashError


ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "5"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
SECRET_KEY = os.getenv("SECRET_KEY", "inventario-dev-secret-key-change-in-production")

JWT_TYP_ACCESS = "access"
JWT_TYP_REFRESH = "refresh"


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


def criar_access_token(subject: str) -> str:
    """JWT curto (API): subject = id do utilizador, claim `typ=access`."""
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire, "typ": JWT_TYP_ACCESS}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def criar_refresh_token(subject: str) -> str:
    """JWT longo: mesma chave HS256, claim `typ=refresh` — nao serve como Bearer nas rotas normais."""
    expire = datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": subject, "exp": expire, "typ": JWT_TYP_REFRESH}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def descodificar_access_token(token: str) -> str | None:
    """Subject do access JWT; None se invalido, expirado, ou se for token de refresh."""
    try:
        # Leeway suave para relógios do cliente/servidor ligeiramente desfasados.
        payload = jwt.decode(
            token, SECRET_KEY, algorithms=[ALGORITHM], leeway=timedelta(seconds=120)
        )
    except InvalidTokenError:
        return None
    if payload.get("typ") == JWT_TYP_REFRESH:
        return None
    subject = payload.get("sub")
    if not isinstance(subject, str):
        return None
    return subject


def descodificar_refresh_token(token: str) -> str | None:
    """Subject do refresh JWT; None se invalido ou nao for typ=refresh."""
    try:
        payload = jwt.decode(
            token, SECRET_KEY, algorithms=[ALGORITHM], leeway=timedelta(seconds=120)
        )
    except InvalidTokenError:
        return None
    if payload.get("typ") != JWT_TYP_REFRESH:
        return None
    subject = payload.get("sub")
    if not isinstance(subject, str):
        return None
    return subject
