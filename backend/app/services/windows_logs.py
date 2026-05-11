"""Comentario geral deste ficheiro: define a logica principal deste modulo."""

# Servico para recolher logs reais do Windows (seguranca e RDP).
from __future__ import annotations

import json
import os
import subprocess
from datetime import datetime

LOG_RDP_REMOTECONN = "Microsoft-Windows-TerminalServices-RemoteConnectionManager/Operational"
LOG_RDP_LOCALSESSION = "Microsoft-Windows-TerminalServices-LocalSessionManager/Operational"
EVENTO_RDP_AUTH = 1149
EVENTOS_RDP_LOCAL = [21, 24, 25]
TENTATIVAS_LOGS = 2
TIMEOUT_LOGS_SEGUNDOS = 40


def _to_iso(value: str | None) -> str | None:
    if not value:
        return None
    try:
        # Aceita formato vindo do PowerShell e normaliza para ISO.
        return datetime.fromisoformat(value.replace("Z", "+00:00")).isoformat()
    except ValueError:
        return None


def _erro_curto(texto: str | None) -> str:
    valor = (texto or "").strip()
    if not valor:
        return ""
    return valor.splitlines()[0][:240]


def _executar_ps_json(
    script: str,
    *,
    env: dict[str, str] | None,
) -> tuple[dict | list, str]:
    ultimo_erro = ""
    for _ in range(TENTATIVAS_LOGS):
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
                timeout=TIMEOUT_LOGS_SEGUNDOS,
                check=False,
                env=env,
            )
        except (OSError, subprocess.SubprocessError) as exc:
            ultimo_erro = str(exc)
            continue

        saida = (result.stdout or "").strip()
        if result.returncode != 0 and not saida:
            ultimo_erro = _erro_curto(result.stderr) or "Erro ao consultar logs"
            continue
        if not saida:
            ultimo_erro = "Sem resposta do PowerShell"
            continue

        try:
            payload = json.loads(saida)
        except json.JSONDecodeError:
            ultimo_erro = _erro_curto(saida) or "Resposta invalida na consulta de logs"
            continue
        return payload, ""

    return {}, ultimo_erro or "Falha ao consultar logs"


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
    tipos_permitidos = {str(t).strip().lower() for t in (tipos_log or ["seguranca", "rdp"])}
    if not tipos_permitidos:
        return []

    recolher_seg = "seguranca" in tipos_permitidos
    recolher_rdp = "rdp" in tipos_permitidos
    ids_rdp_local = ",".join(str(x) for x in EVENTOS_RDP_LOCAL)

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
$logs = @()
$diag = @()

function Run-GetWinEvent {{
    param(
        [string]$LogName,
        [object]$Ids = $null,
        [switch]$UseFilterOnly
    )
    if ($remote -and $cred) {{
        if ($UseFilterOnly) {{
            return Get-WinEvent -ComputerName $target -Credential $cred -FilterHashtable @{{LogName=$LogName; StartTime=$start}} -MaxEvents $max -ErrorAction Stop
        }}
        return Get-WinEvent -ComputerName $target -Credential $cred -FilterHashtable @{{LogName=$LogName; Id=$Ids; StartTime=$start}} -MaxEvents $max -ErrorAction Stop
    }}
    if ($remote) {{
        if ($UseFilterOnly) {{
            return Get-WinEvent -ComputerName $target -FilterHashtable @{{LogName=$LogName; StartTime=$start}} -MaxEvents $max -ErrorAction Stop
        }}
        return Get-WinEvent -ComputerName $target -FilterHashtable @{{LogName=$LogName; Id=$Ids; StartTime=$start}} -MaxEvents $max -ErrorAction Stop
    }}
    if ($UseFilterOnly) {{
        return Get-WinEvent -FilterHashtable @{{LogName=$LogName; StartTime=$start}} -MaxEvents $max -ErrorAction Stop
    }}
    return Get-WinEvent -FilterHashtable @{{LogName=$LogName; Id=$Ids; StartTime=$start}} -MaxEvents $max -ErrorAction Stop
}}

if ({'$true' if recolher_seg else '$false'}) {{
    try {{
        $security = Run-GetWinEvent -LogName 'Security' -UseFilterOnly |
            Select-Object @{{Name='tipo_log';Expression={{'seguranca'}}}}, TimeCreated, Id, ProviderName, Message
        $logs += $security
    }} catch {{
        $diag += ('Security: ' + $_.Exception.Message)
    }}
}}

if ({'$true' if recolher_rdp else '$false'}) {{
    try {{
        $rdpRemote = Run-GetWinEvent -LogName '{LOG_RDP_REMOTECONN}' -Ids {EVENTO_RDP_AUTH} |
            Select-Object @{{Name='tipo_log';Expression={{'rdp'}}}}, TimeCreated, Id, ProviderName, Message
        $logs += $rdpRemote
    }} catch {{
        $diag += ('RDP RemoteConnectionManager: ' + $_.Exception.Message)
    }}

    try {{
        $rdpLocal = Run-GetWinEvent -LogName '{LOG_RDP_LOCALSESSION}' -Ids @({ids_rdp_local}) |
            Select-Object @{{Name='tipo_log';Expression={{'rdp'}}}}, TimeCreated, Id, ProviderName, Message
        $logs += $rdpLocal
    }} catch {{
        $diag += ('RDP LocalSessionManager: ' + $_.Exception.Message)
    }}
}}

[pscustomobject]@{{
    logs = @($logs) | Sort-Object TimeCreated -Descending | Select-Object -First $max
    diagnostico = ($diag -join ' | ')
}} | ConvertTo-Json -Depth 4
""".strip()

    env = None
    if target_remoto and utilizador and password:
        env = {
            **os.environ,
            "REDE_LOG_USER": str(utilizador).strip(),
            "REDE_LOG_PASSWORD": str(password),
        }
    payload, erro_exec = _executar_ps_json(script, env=env)
    if erro_exec:
        return []

    logs_raw = payload.get("logs") if isinstance(payload, dict) else payload
    if isinstance(logs_raw, dict):
        items = [logs_raw]
    elif isinstance(logs_raw, list):
        items = logs_raw
    else:
        items = []

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
        if tipo == "rdp":
            partes = [f"[{provider or 'RDP'}][EventID={event_id or str(EVENTO_RDP_AUTH)}] Autenticacao RDP"]
            if message:
                partes.append(message)
            descricao = " | ".join(p for p in partes if p).strip()
        else:
            descricao = f"[{provider}][EventID={event_id}] {message}".strip()
        logs.append(
            {
                "tipo_log": tipo,
                "data_evento": data_iso,
                "descricao": descricao[:4000],
            }
        )

    return logs

