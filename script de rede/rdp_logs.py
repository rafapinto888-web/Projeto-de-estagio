"""Comentario geral deste ficheiro: define a logica principal deste modulo."""

import json
import os
import subprocess
from processos import sem_janela


LOG_RDP_REMOTECONN = "Microsoft-Windows-TerminalServices-RemoteConnectionManager/Operational"
LOG_RDP_LOCALSESSION = "Microsoft-Windows-TerminalServices-LocalSessionManager/Operational"
EVENTO_RDP_AUTH = 1149
EVENTOS_RDP_LOCAL = [21, 24, 25]
LOG_SECURITY = "Security"
EVENTOS_SECURITY = [4624, 4625, 4634]
TENTATIVAS_LOGS = 2
TIMEOUT_LOGS_SEGUNDOS = 12


def _erro_curto(texto):
    texto = (texto or "").strip()
    if not texto:
        return ""

    return texto.splitlines()[0][:180]


def _executar_ps_logs(ip, utilizador, password, script):
    # Prepara ambiente comum para chamadas remotas ao PowerShell.
    ambiente = os.environ.copy()
    ambiente.update({
        "REDE_SCAN_IP": ip,
        "REDE_SCAN_USER": utilizador,
        "REDE_SCAN_PASSWORD": password,
    })

    ultimo_erro = ""
    for tentativa in range(1, TENTATIVAS_LOGS + 1):
        # Reexecuta em caso de timeout/erro transiente.
        try:
            resultado = subprocess.run(
                ["powershell", "-NoProfile", "-Command", script],
                capture_output=True,
                text=True,
                env=ambiente,
                timeout=TIMEOUT_LOGS_SEGUNDOS,
                **sem_janela()
            )
        except subprocess.TimeoutExpired:
            ultimo_erro = (
                f"Timeout na consulta de logs "
                f"({tentativa}/{TENTATIVAS_LOGS}, {TIMEOUT_LOGS_SEGUNDOS}s)"
            )
            continue

        saida = (resultado.stdout or "").strip()
        if resultado.returncode != 0 and not saida:
            ultimo_erro = _erro_curto(resultado.stderr) or "Erro ao consultar logs"
            continue

        try:
            # Espera JSON e devolve payload + erro vazio em caso de sucesso.
            return json.loads(saida or "{}"), ""
        except json.JSONDecodeError:
            ultimo_erro = _erro_curto(saida) or "Resposta invalida na consulta de logs"
            continue

    return {}, ultimo_erro or "Falha ao consultar logs"


def obter_logs_rdp(ip, utilizador, password):
    # Consulta dois canais RDP para cobrir mais cenarios de Windows.
    ids_local = ",".join(str(x) for x in EVENTOS_RDP_LOCAL)
    script = f"""
$securePassword = ConvertTo-SecureString $env:REDE_SCAN_PASSWORD -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($env:REDE_SCAN_USER, $securePassword)
$diag = @()
$logs = @()

try {{
    # Canal de autenticacao remota (eventos de entrada RDP).
    $l1 = Get-WinEvent `
        -ComputerName $env:REDE_SCAN_IP `
        -Credential $credential `
        -FilterHashtable @{{LogName="{LOG_RDP_REMOTECONN}"; Id={EVENTO_RDP_AUTH}}} `
        -ErrorAction Stop |
    ForEach-Object {{
        $user = ""
        $domain = ""
        $origem = ""
        if ($_.Properties.Count -gt 0) {{ $user = $_.Properties[0].Value }}
        if ($_.Properties.Count -gt 1) {{ $domain = $_.Properties[1].Value }}
        if ($_.Properties.Count -gt 2) {{ $origem = $_.Properties[2].Value }}
        [pscustomobject]@{{
            Horario = $_.TimeCreated.ToString("yyyy-MM-dd HH:mm:ss")
            EventoId = $_.Id
            Utilizador = "$domain\\$user"
            Origem = $origem
            Fonte = "{LOG_RDP_REMOTECONN}"
        }}
    }}
    $logs += $l1
}} catch {{
    $diag += ("RDP RemoteConnectionManager: " + $_.Exception.Message)
}}

try {{
    # Canal de sessao local (conexao/desconexao/sessao).
    $l2 = Get-WinEvent `
        -ComputerName $env:REDE_SCAN_IP `
        -Credential $credential `
        -FilterHashtable @{{LogName="{LOG_RDP_LOCALSESSION}"; Id=@({ids_local})}} `
        -ErrorAction Stop |
    ForEach-Object {{
        [pscustomobject]@{{
            Horario = $_.TimeCreated.ToString("yyyy-MM-dd HH:mm:ss")
            EventoId = $_.Id
            Utilizador = ""
            Origem = ""
            Fonte = "{LOG_RDP_LOCALSESSION}"
        }}
    }}
    $logs += $l2
}} catch {{
    $diag += ("RDP LocalSessionManager: " + $_.Exception.Message)
}}

[pscustomobject]@{{
    logs = $logs | Sort-Object Horario -Descending | Select-Object -First 40
    # Junta diagnostico para facilitar debug quando vier vazio.
    diagnostico = ($diag -join " | ")
}} | ConvertTo-Json -Compress
"""

    payload, erro_exec = _executar_ps_logs(ip, utilizador, password, script)
    if erro_exec:
        return [{"erro": f"Erro logs RDP: {erro_exec}"}]

    logs_raw = payload.get("logs") if isinstance(payload, dict) else []
    if isinstance(logs_raw, dict):
        logs_raw = [logs_raw]
    if not isinstance(logs_raw, list):
        logs_raw = []

    logs = [
        {
            "horario": log.get("Horario", ""),
            "evento_id": log.get("EventoId", ""),
            "utilizador": log.get("Utilizador", ""),
            "origem": log.get("Origem", ""),
            "fonte": log.get("Fonte", ""),
        }
        for log in logs_raw
        if isinstance(log, dict)
    ]

    if logs:
        return logs

    diag = ""
    if isinstance(payload, dict):
        diag = str(payload.get("diagnostico") or "").strip()
    return [{"erro": diag or "Sem registos RDP encontrados"}]


def formatar_log_rdp(log):
    if log.get("erro"):
        return f"Erro logs RDP: {log['erro']}"

    partes = [log.get("horario", ""), f"ID {log.get('evento_id', '')}", "RDP"]
    if log.get("utilizador"):
        partes.append(f"Utilizador: {log['utilizador']}")
    if log.get("origem"):
        partes.append(f"Origem: {log['origem']}")
    if log.get("fonte"):
        partes.append(f"Fonte: {log['fonte']}")

    return " | ".join(parte for parte in partes if parte)


def obter_logs_seguranca(ip, utilizador, password):
    # Consulta Security para eventos mais relevantes de autenticacao.
    ids = ",".join(str(x) for x in EVENTOS_SECURITY)
    script = f"""
$securePassword = ConvertTo-SecureString $env:REDE_SCAN_PASSWORD -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($env:REDE_SCAN_USER, $securePassword)
$ids = @({ids})

Get-WinEvent `
    -ComputerName $env:REDE_SCAN_IP `
    -Credential $credential `
    -FilterHashtable @{{LogName="{LOG_SECURITY}"; Id=$ids}} `
    -ErrorAction SilentlyContinue |
Select-Object -First 30 |
ForEach-Object {{
    [pscustomobject]@{{
        Horario = $_.TimeCreated.ToString("yyyy-MM-dd HH:mm:ss")
        EventoId = $_.Id
        Provider = $_.ProviderName
        Mensagem = $_.Message
    }}
}} | ConvertTo-Json -Compress
"""
    dados, erro_exec = _executar_ps_logs(ip, utilizador, password, script)
    if erro_exec:
        return [{"erro": f"Erro logs seguranca: {erro_exec}"}]

    if isinstance(dados, dict):
        dados = [dados]

    return [
        {
            "horario": log.get("Horario", ""),
            "evento_id": log.get("EventoId", ""),
            "provider": log.get("Provider", ""),
            "mensagem": (log.get("Mensagem", "") or "").strip(),
        }
        for log in dados
        if isinstance(log, dict)
    ]


def formatar_log_seguranca(log):
    if log.get("erro"):
        return f"Erro logs seguranca: {log['erro']}"

    partes = [log.get("horario", ""), f"ID {log.get('evento_id', '')}", "Seguranca"]
    if log.get("provider"):
        partes.append(f"Provider: {log['provider']}")
    if log.get("mensagem"):
        # Limita mensagem para o txt nao ficar gigante.
        partes.append(f"Msg: {log['mensagem'][:120].replace('\\n', ' ')}")
    return " | ".join(parte for parte in partes if parte)

