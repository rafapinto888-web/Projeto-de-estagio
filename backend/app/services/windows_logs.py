# Servico para recolher logs reais do Windows (seguranca e RDP).
from __future__ import annotations

import json
import subprocess
from datetime import datetime


def _to_iso(value: str | None) -> str | None:
    if not value:
        return None
    try:
        # Aceita formato vindo do PowerShell e normaliza para ISO.
        return datetime.fromisoformat(value.replace("Z", "+00:00")).isoformat()
    except ValueError:
        return None


def coletar_logs_windows(
    computer_name: str | None = None,
    *,
    max_eventos: int = 50,
    horas: int = 24,
) -> list[dict[str, str]]:
    # Tenta recolher logs Windows por PowerShell; devolve vazio em caso de erro.
    target = (computer_name or "").strip()
    computer_param = (
        f"-ComputerName '{target}'"
        if target and target.lower() not in {"localhost", "127.0.0.1"}
        else ""
    )

    script = f"""
$ErrorActionPreference = 'SilentlyContinue'
$start = (Get-Date).AddHours(-{int(horas)})
$max = {int(max_eventos)}

$security = Get-WinEvent {computer_param} -FilterHashtable @{{LogName='Security'; StartTime=$start}} -MaxEvents $max |
    Select-Object @{{Name='tipo_log';Expression={{'seguranca'}}}}, TimeCreated, Id, ProviderName, Message

$rdp = Get-WinEvent {computer_param} -FilterHashtable @{{LogName='Microsoft-Windows-TerminalServices-LocalSessionManager/Operational'; StartTime=$start}} -MaxEvents $max |
    Select-Object @{{Name='tipo_log';Expression={{'rdp'}}}}, TimeCreated, Id, ProviderName, Message

$all = @($security) + @($rdp) | Sort-Object TimeCreated -Descending | Select-Object -First $max
$all | ConvertTo-Json -Depth 3
""".strip()

    try:
        result = subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                script,
            ],
            capture_output=True,
            text=True,
            timeout=40,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return []

    if result.returncode != 0 or not result.stdout.strip():
        return []

    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError:
        return []

    if isinstance(payload, dict):
        items = [payload]
    elif isinstance(payload, list):
        items = payload
    else:
        return []

    logs: list[dict[str, str]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        tipo = str(item.get("tipo_log") or "").strip().lower()
        if tipo not in {"seguranca", "rdp"}:
            continue
        data_iso = _to_iso(item.get("TimeCreated"))
        if not data_iso:
            continue
        provider = str(item.get("ProviderName") or "").strip()
        event_id = str(item.get("Id") or "").strip()
        message = str(item.get("Message") or "").strip()
        descricao = f"[{provider}][EventID={event_id}] {message}".strip()
        logs.append(
            {
                "tipo_log": tipo,
                "data_evento": data_iso,
                "descricao": descricao[:4000],
            }
        )

    return logs
