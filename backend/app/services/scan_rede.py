"""Servico de scan: ping na sub-rede, MAC/hostname e enriquecimento Windows (CIM)."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from ipaddress import ip_network
import json
import os
import platform
import re
import socket
import subprocess


def _limpo_ou_none(valor: object) -> str | None:
    # Placeholders e vazios -> None (evita gravar lixo na BD).
    texto = str(valor or "").strip()
    if not texto:
        return None
    normalizado = texto.lower()
    placeholders = {
        "n/a",
        "na",
        "null",
        "none",
        "erro",
        "error",
        "nao acessivel",
        "não acessível",
        "indisponivel",
        "indisponível",
    }
    if normalizado in placeholders:
        return None
    return texto


def _normalizar_mac(mac: object) -> str | None:
    limpo = _limpo_ou_none(mac)
    if limpo is None:
        return None
    padrao = re.search(r"(?i)\b([0-9a-f]{2}(?:[:-][0-9a-f]{2}){5})\b", limpo)
    if not padrao:
        return None
    return padrao.group(1).replace("-", ":").lower()


def _subprocess_sem_janela() -> dict:
    """Windows: evita abrir janela de consola (CREATE_NO_WINDOW / STARTUPINFO)."""
    if os.name != "nt":
        return {}
    kwargs: dict = {}
    creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    if creationflags:
        kwargs["creationflags"] = creationflags
    if hasattr(subprocess, "STARTUPINFO"):
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = 0
        kwargs["startupinfo"] = startupinfo
    return kwargs


def ping_host(ip: str) -> bool:
    sistema = platform.system().lower()
    if sistema.startswith("win"):
        comando = ["ping", "-n", "1", "-w", "100", ip]
    else:
        comando = ["ping", "-c", "1", "-W", "1", ip]

    try:
        resultado = subprocess.run(
            comando,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
            **_subprocess_sem_janela(),
        )
    except (OSError, subprocess.SubprocessError):
        return False

    return resultado.returncode == 0


def obter_hostname(ip: str) -> str | None:
    try:
        hostname, _, _ = socket.gethostbyaddr(ip)
    except (OSError, socket.herror, socket.gaierror, TimeoutError):
        return None
    except Exception:
        return None

    hostname_limpo = hostname.strip() if isinstance(hostname, str) else ""
    return hostname_limpo or None


def obter_mac_address(ip: str) -> str | None:
    sistema = platform.system().lower()

    try:
        if sistema.startswith("win"):
            comando = ["arp", "-a", ip]
        else:
            comando = ["ip", "neigh", "show", ip]

        resultado = subprocess.run(
            comando,
            capture_output=True,
            text=True,
            timeout=2,
            check=False,
            **_subprocess_sem_janela(),
        )
        saida = (resultado.stdout or "") + "\n" + (resultado.stderr or "")
    except (OSError, subprocess.SubprocessError):
        return None

    match = re.search(r"(?i)\b([0-9a-f]{2}(?:[:-][0-9a-f]{2}){5})\b", saida)
    if match:
        return match.group(1).replace("-", ":").lower()

    # Unix: `ip neigh` pode falhar ou nao existir; tenta `arp -n`.
    if not sistema.startswith("win"):
        try:
            resultado_arp = subprocess.run(
                ["arp", "-n", ip],
                capture_output=True,
                text=True,
                timeout=2,
                check=False,
                **_subprocess_sem_janela(),
            )
            saida_arp = (resultado_arp.stdout or "") + "\n" + (resultado_arp.stderr or "")
            match_arp = re.search(
                r"(?i)\b([0-9a-f]{2}(?:[:-][0-9a-f]{2}){5})\b",
                saida_arp,
            )
            if match_arp:
                return match_arp.group(1).replace("-", ":").lower()
        except (OSError, subprocess.SubprocessError):
            return None

    return None


def descobrir_dispositivos_ativos(rede: str) -> list[dict[str, str | None]]:
    rede_obj = ip_network(rede, strict=False)
    hosts = [str(h) for h in rede_obj.hosts()]
    if not hosts:
        # /31-/32: `IPv4Network.hosts()` e vazio; usar o unico endereco.
        if rede_obj.prefixlen >= 31:
            hosts = [str(rede_obj.network_address)]
        else:
            return []

    max_workers = min(50, len(hosts))
    ativos: list[str] = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        tarefas = {executor.submit(ping_host, h): h for h in hosts}
        for tarefa in as_completed(tarefas):
            ip = tarefas[tarefa]
            try:
                if tarefa.result():
                    ativos.append(ip)
            except Exception:
                continue

    ips_ping = sorted(ativos, key=lambda x: tuple(map(int, x.split("."))))

    primeiro_host = next(rede_obj.hosts(), None)
    if primeiro_host is not None:
        primeiro = str(primeiro_host)
        ips_ping = [ip for ip in ips_ping if ip != primeiro]

    if not ips_ping:
        return []

    max_workers_mac = min(50, len(ips_ping))
    with ThreadPoolExecutor(max_workers=max_workers_mac) as executor:
        macs = list(executor.map(obter_mac_address, ips_ping))

    max_workers_hostname = min(50, len(ips_ping))
    with ThreadPoolExecutor(max_workers=max_workers_hostname) as executor:
        hostnames = list(executor.map(obter_hostname, ips_ping))

    return [
        {"ip": ip, "mac_address": mac, "hostname": hostname}
        for ip, mac, hostname in zip(ips_ping, macs, hostnames, strict=False)
    ]


def descobrir_hosts_ativos(rede: str) -> list[str]:
    rede_obj = ip_network(rede, strict=False)
    hosts = [str(h) for h in rede_obj.hosts()]
    if not hosts:
        # /31-/32: `IPv4Network.hosts()` e vazio; usar o unico endereco.
        if rede_obj.prefixlen >= 31:
            hosts = [str(rede_obj.network_address)]
        else:
            return []

    max_workers = min(50, len(hosts))
    ativos: list[str] = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        tarefas = {executor.submit(ping_host, h): h for h in hosts}
        for tarefa in as_completed(tarefas):
            ip = tarefas[tarefa]
            try:
                if tarefa.result():
                    ativos.append(ip)
            except Exception:
                continue

    out = sorted(ativos, key=lambda x: tuple(map(int, x.split("."))))
    primeiro_host = next(rede_obj.hosts(), None)
    if primeiro_host is not None:
        primeiro = str(primeiro_host)
        out = [ip for ip in out if ip != primeiro]
    return out


def obter_info_windows_por_ip(
    ip: str,
    utilizador: str | None,
    password: str | None,
) -> dict[str, str | None]:
    user_ok = bool((utilizador or "").strip())
    pass_ok = bool((password or "").strip())
    use_cred = user_ok and pass_ok

    ambiente = os.environ.copy()
    ambiente["REDE_SCAN_IP"] = ip
    ambiente["REDE_SCAN_USE_CRED"] = "1" if use_cred else "0"
    # Com credenciais: modelo CIM cru; sem credenciais: heuristica por fabricante no PS abaixo.
    ambiente["REDE_SCAN_SCRIPT_MODEL"] = "1" if use_cred else "0"
    if use_cred:
        ambiente["REDE_SCAN_USER"] = str(utilizador).strip()
        ambiente["REDE_SCAN_PASSWORD"] = str(password)

    script = r"""
$ErrorActionPreference = "SilentlyContinue"
$target = $env:REDE_SCAN_IP
$useCred = ($env:REDE_SCAN_USE_CRED -eq "1")
$credential = $null
if ($useCred) {
    $securePassword = ConvertTo-SecureString $env:REDE_SCAN_PASSWORD -AsPlainText -Force
    $credential = New-Object System.Management.Automation.PSCredential ($env:REDE_SCAN_USER, $securePassword)
}

function Try-CimInfo {
    param([string]$Protocol)
    $session = $null
    try {
        if ($Protocol -eq "DCOM") {
            $options = New-CimSessionOption -Protocol Dcom
            if ($credential) {
                $session = New-CimSession -ComputerName $target -Credential $credential -SessionOption $options
            } else {
                $session = New-CimSession -ComputerName $target -SessionOption $options
            }
        } else {
            if ($credential) {
                $session = New-CimSession -ComputerName $target -Credential $credential
            } else {
                $session = New-CimSession -ComputerName $target
            }
        }

        $cs = Get-CimInstance -CimSession $session -ClassName Win32_ComputerSystem -ErrorAction SilentlyContinue
        $bios = Get-CimInstance -CimSession $session -ClassName Win32_BIOS -ErrorAction SilentlyContinue
        $os = Get-CimInstance -CimSession $session -ClassName Win32_OperatingSystem -ErrorAction SilentlyContinue
        $nics = Get-CimInstance -CimSession $session -ClassName Win32_NetworkAdapterConfiguration -ErrorAction SilentlyContinue |
            Where-Object { $_.IPEnabled -eq $true }

        # MAC da NIC cujo IP inclui o alvo (evita pegar outra interface).
        $mac = $null
        $nicMatch = $nics | Where-Object { $_.IPAddress -contains $target } | Select-Object -First 1
        if (-not $nicMatch) {
            $nicMatch = $nics | Select-Object -First 1
        }
        if ($nicMatch) { $mac = $nicMatch.MACAddress }

        $hostname = $null
        if ($cs -and $cs.Name) { $hostname = $cs.Name }

        $modeloOut = $null
        if ($env:REDE_SCAN_SCRIPT_MODEL -eq "1") {
            $modeloOut = if ($cs) { $cs.Model } else { $null }
        } else {
            $modeloOut = $null
            if ($cs) {
                $fabricante = ""
                if ($cs.Manufacturer) { $fabricante = $cs.Manufacturer.ToString().ToLower() }
                if ($fabricante -match "lenovo" -and $cs.SystemFamily) {
                    $modeloOut = $cs.SystemFamily
                } elseif ($fabricante -match "hp|hewlett" -and $cs.Model) {
                    $modeloOut = $cs.Model
                } elseif ($cs.Model) {
                    $modeloOut = $cs.Model
                } elseif ($cs.SystemFamily) {
                    $modeloOut = $cs.SystemFamily
                }
            }
        }

        if ($session) {
            Remove-CimSession $session -ErrorAction SilentlyContinue
        }

        [pscustomobject]@{
            hostname = $hostname
            mac_address = $mac
            marca = if ($cs) { $cs.Manufacturer } else { $null }
            modelo = $modeloOut
            numero_serie = if ($bios) { $bios.SerialNumber } else { $null }
            sistema_operativo = if ($os) { $os.Caption } else { $null }
        }
    } catch {
        if ($session) {
            Remove-CimSession $session -ErrorAction SilentlyContinue
        }
        $null
    }
}

$dados = Try-CimInfo -Protocol "DCOM"
if (-not $dados) {
    $dados = Try-CimInfo -Protocol "WSMAN"
}

if ($dados) {
    $dados | ConvertTo-Json -Compress
} else {
    "{}"
}
"""

    try:
        result = subprocess.run(
            ["powershell", "-NoProfile", "-Command", script],
            capture_output=True,
            text=True,
            env=ambiente,
            timeout=25,
            check=False,
            **_subprocess_sem_janela(),
        )
    except (OSError, subprocess.SubprocessError):
        return {
            "hostname": None,
            "mac_address": None,
            "marca": None,
            "modelo": None,
            "numero_serie": None,
            "sistema_operativo": None,
        }

    try:
        payload = json.loads((result.stdout or "").strip() or "{}")
    except json.JSONDecodeError:
        payload = {}
    if not isinstance(payload, dict):
        payload = {}

    return {
        "hostname": _limpo_ou_none(payload.get("hostname")),
        "mac_address": _normalizar_mac(payload.get("mac_address")),
        "marca": _limpo_ou_none(payload.get("marca")),
        "modelo": _limpo_ou_none(payload.get("modelo")),
        "numero_serie": _limpo_ou_none(payload.get("numero_serie")),
        "sistema_operativo": _limpo_ou_none(payload.get("sistema_operativo")),
    }


def descobrir_dispositivos_enriquecidos(
    rede: str,
    utilizador: str | None,
    password: str | None,
) -> list[dict[str, str | None]]:
    dispositivos_base = descobrir_dispositivos_ativos(rede)
    if not dispositivos_base:
        return []

    ips_ativos = [d["ip"] for d in dispositivos_base if d.get("ip")]
    info_por_ip = {
        ip: obter_info_windows_por_ip(ip, utilizador, password)
        for ip in ips_ativos
    }

    enriquecidos: list[dict[str, str | None]] = []
    for dispositivo in dispositivos_base:
        ip = dispositivo.get("ip")
        if not ip:
            continue
        info_windows = info_por_ip.get(ip, {})
        hostname = _limpo_ou_none(dispositivo.get("hostname")) or info_windows.get("hostname")
        mac = _normalizar_mac(dispositivo.get("mac_address")) or info_windows.get("mac_address")
        enriquecidos.append(
            {
                "ip": ip,
                "hostname": hostname,
                "mac_address": mac,
                "marca": info_windows.get("marca"),
                "modelo": info_windows.get("modelo"),
                "numero_serie": info_windows.get("numero_serie"),
                "sistema_operativo": info_windows.get("sistema_operativo"),
            }
        )
    return enriquecidos

