import os
from datetime import UTC, datetime, timedelta

import jwt
from jwt import InvalidTokenError
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError


ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
SECRET_KEY = os.getenv("SECRET_KEY", "inventario-dev-secret-key-change-in-production")
password_hash = PasswordHash.recommended()


def verificar_palavra_passe(palavra_passe: str, palavra_passe_hash: str) -> bool:
    try:
        return password_hash.verify(palavra_passe, palavra_passe_hash)
    except UnknownHashError:
        # Compatibilidade com registos antigos que possam ter password em texto simples.
        return palavra_passe == palavra_passe_hash


def criar_access_token(subject: str) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def descodificar_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except InvalidTokenError:
        return None
    subject = payload.get("sub")
    if not isinstance(subject, str):
        return None
    return subject
