"""Comentario geral deste ficheiro: define a logica principal deste modulo."""

# Servico para recolher logs reais do Windows (seguranca e RDP).
from __future__ import annotations

import json
import os
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
    tipos_log: list[str] | None = None,
    utilizador: str | None = None,
    password: str | None = None,
) -> list[dict[str, str]]:
    # Tenta recolher logs Windows por PowerShell; devolve vazio em caso de erro.
    target = (computer_name or "").strip()
    target_remoto = target and target.lower() not in {"localhost", "127.0.0.1"}

    script = f"""
$ErrorActionPreference = 'SilentlyContinue'
$start = (Get-Date).AddHours(-{int(horas)})
$max = {int(max_eventos)}

$target = {json.dumps(target)}
$remote = {"$true" if target_remoto else "$false"}
$credUser = $env:REDE_LOG_USER
$credPass = $env:REDE_LOG_PASSWORD
$cred = $null
if ($remote -and $credUser -and $credPass) {{
    $securePassword = ConvertTo-SecureString $credPass -AsPlainText -Force
    $cred = New-Object System.Management.Automation.PSCredential ($credUser, $securePassword)
}}

if ($remote -and $cred) {{
    $security = Get-WinEvent -ComputerName $target -Credential $cred -FilterHashtable @{{LogName='Security'; StartTime=$start}} -MaxEvents $max |
        Select-Object @{{Name='tipo_log';Expression={{'seguranca'}}}}, TimeCreated, Id, ProviderName, Message

    $rdp = Get-WinEvent -ComputerName $target -Credential $cred -FilterHashtable @{{LogName='Microsoft-Windows-TerminalServices-LocalSessionManager/Operational'; StartTime=$start}} -MaxEvents $max |
        Select-Object @{{Name='tipo_log';Expression={{'rdp'}}}}, TimeCreated, Id, ProviderName, Message
}} elseif ($remote) {{
    $security = Get-WinEvent -ComputerName $target -FilterHashtable @{{LogName='Security'; StartTime=$start}} -MaxEvents $max |
        Select-Object @{{Name='tipo_log';Expression={{'seguranca'}}}}, TimeCreated, Id, ProviderName, Message

    $rdp = Get-WinEvent -ComputerName $target -FilterHashtable @{{LogName='Microsoft-Windows-TerminalServices-LocalSessionManager/Operational'; StartTime=$start}} -MaxEvents $max |
        Select-Object @{{Name='tipo_log';Expression={{'rdp'}}}}, TimeCreated, Id, ProviderName, Message
}} else {{
    $security = Get-WinEvent -FilterHashtable @{{LogName='Security'; StartTime=$start}} -MaxEvents $max |
        Select-Object @{{Name='tipo_log';Expression={{'seguranca'}}}}, TimeCreated, Id, ProviderName, Message

    $rdp = Get-WinEvent -FilterHashtable @{{LogName='Microsoft-Windows-TerminalServices-LocalSessionManager/Operational'; StartTime=$start}} -MaxEvents $max |
        Select-Object @{{Name='tipo_log';Expression={{'rdp'}}}}, TimeCreated, Id, ProviderName, Message
}}

$all = @($security) + @($rdp) | Sort-Object TimeCreated -Descending | Select-Object -First $max
$all | ConvertTo-Json -Depth 3
""".strip()

    try:
        env = None
        if target_remoto and utilizador and password:
            env = {
                **os.environ,
                "REDE_LOG_USER": str(utilizador).strip(),
                "REDE_LOG_PASSWORD": str(password),
            }
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
            env=env,
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

    tipos_permitidos = {str(t).strip().lower() for t in (tipos_log or ["seguranca", "rdp"])}
    if not tipos_permitidos:
        return []

    logs: list[dict[str, str]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        tipo = str(item.get("tipo_log") or "").strip().lower()
        if tipo not in {"seguranca", "rdp"}:
            continue
        if tipo not in tipos_permitidos:
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

