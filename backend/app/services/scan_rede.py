# Servico responsavel por descobrir IPs ativos e metadados basicos na rede.
from __future__ import annotations

import platform
import subprocess
from concurrent.futures import ThreadPoolExecutor
from ipaddress import ip_network
import re
import socket
import os
import json


def ping_host(ip: str) -> bool:
    # Faz ping ao IP (Windows/Linux) para saber se está ativo.
    sistema = platform.system().lower()
    if sistema.startswith("win"):
        comando = ["ping", "-n", "1", "-w", "100", ip]
    else:
        comando = ["ping", "-c", "1", ip]

    try:
        resultado = subprocess.run(
            comando,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=2,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return False

    return resultado.returncode == 0


def obter_hostname(ip: str) -> str | None:
    # Tenta resolver hostname por DNS reverso, sem falhar o scan.
    try:
        hostname, _, _ = socket.gethostbyaddr(ip)
    except (OSError, socket.herror, socket.gaierror, TimeoutError):
        return None
    except Exception:
        return None

    hostname_limpo = hostname.strip() if isinstance(hostname, str) else ""
    return hostname_limpo or None


def obter_mac_address(ip: str) -> str | None:
    # Tenta obter o MAC via cache ARP/neighbor table (depende do SO).
    sistema = platform.system().lower()

    # Nota: em Windows, depois do ping o IP costuma ficar em cache ARP.
    # Em Linux/macOS, `arp`/`ip neigh` podem devolver a entrada se existir.
    try:
        if sistema.startswith("win"):
            comando = ["arp", "-a", ip]
        else:
            # tenta primeiro via `ip neigh` (mais comum em Linux)
            comando = ["ip", "neigh", "show", ip]

        resultado = subprocess.run(
            comando,
            capture_output=True,
            text=True,
            timeout=2,
            check=False,
        )
        saida = (resultado.stdout or "") + "\n" + (resultado.stderr or "")
    except (OSError, subprocess.SubprocessError):
        return None

    # procura padrão MAC
    match = re.search(r"(?i)\b([0-9a-f]{2}(?:[:-][0-9a-f]{2}){5})\b", saida)
    if match:
        return match.group(1).replace("-", ":").lower()

    # fallback para Unix quando `ip neigh` não existe mas `arp` existe
    if not sistema.startswith("win"):
        try:
            resultado_arp = subprocess.run(
                ["arp", "-n", ip],
                capture_output=True,
                text=True,
                timeout=2,
                check=False,
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
    # Varre a rede: ping -> lista IPs ativos -> tenta MAC e hostname para cada IP.
    hosts = [str(host) for host in ip_network(rede, strict=False).hosts()]
    if not hosts:
        return []

    # Pinga em paralelo para descobrir quais IPs respondem.
    max_workers = min(64, len(hosts))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        resultados_ping = list(executor.map(ping_host, hosts))

    # Filtra apenas os IPs que responderam ao ping.
    ips_ativos = [ip for ip, ativo in zip(hosts, resultados_ping, strict=False) if ativo]
    if not ips_ativos:
        return []

    # Busca MAC em paralelo (pode falhar e voltar None).
    max_workers_mac = min(64, len(ips_ativos))
    with ThreadPoolExecutor(max_workers=max_workers_mac) as executor:
        macs = list(executor.map(obter_mac_address, ips_ativos))

    # Busca hostname em paralelo (pode falhar e voltar None).
    max_workers_hostname = min(64, len(ips_ativos))
    with ThreadPoolExecutor(max_workers=max_workers_hostname) as executor:
        hostnames = list(executor.map(obter_hostname, ips_ativos))

    # Devolve uma lista de dicts com os dados obtidos por IP ativo.
    return [
        {"ip": ip, "mac_address": mac, "hostname": hostname}
        for ip, mac, hostname in zip(ips_ativos, macs, hostnames, strict=False)
    ]


def descobrir_hosts_ativos(rede: str) -> list[str]:
    # Versão antiga: só devolve IPs ativos (mantida para compatibilidade).
    hosts = [str(host) for host in ip_network(rede, strict=False).hosts()]
    if not hosts:
        return []

    max_workers = min(64, len(hosts))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        resultados = executor.map(ping_host, hosts)
        return [ip for ip, ativo in zip(hosts, resultados, strict=False) if ativo]


def obter_info_windows_por_ip(
    ip: str,
    utilizador: str | None,
    password: str | None,
) -> dict[str, str | None]:
    # Recolhe dados Windows remotos por CIM; se falhar, devolve campos nulos.
    if not utilizador or not password:
        return {
            "marca": None,
            "modelo": None,
            "numero_serie": None,
            "sistema_operativo": None,
        }

    ambiente = os.environ.copy()
    ambiente["REDE_SCAN_IP"] = ip
    ambiente["REDE_SCAN_USER"] = utilizador
    ambiente["REDE_SCAN_PASSWORD"] = password

    script = r"""
$ErrorActionPreference = "SilentlyContinue"
$target = $env:REDE_SCAN_IP
$securePassword = ConvertTo-SecureString $env:REDE_SCAN_PASSWORD -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($env:REDE_SCAN_USER, $securePassword)

function Try-CimInfo {
    param([string]$Protocol)
    $session = $null
    try {
        if ($Protocol -eq "DCOM") {
            $options = New-CimSessionOption -Protocol Dcom
            $session = New-CimSession -ComputerName $target -Credential $credential -SessionOption $options
        } else {
            $session = New-CimSession -ComputerName $target -Credential $credential
        }

        $cs = Get-CimInstance -CimSession $session -ClassName Win32_ComputerSystem -ErrorAction SilentlyContinue
        $bios = Get-CimInstance -CimSession $session -ClassName Win32_BIOS -ErrorAction SilentlyContinue
        $os = Get-CimInstance -CimSession $session -ClassName Win32_OperatingSystem -ErrorAction SilentlyContinue

        if ($session) {
            Remove-CimSession $session -ErrorAction SilentlyContinue
        }

        [pscustomobject]@{
            marca = if ($cs) { $cs.Manufacturer } else { $null }
            modelo = if ($cs) { $cs.Model } else { $null }
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
            timeout=20,
            check=False,
        )
    except (OSError, subprocess.SubprocessError):
        return {
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

    def _limpo(v: object) -> str | None:
        texto = str(v or "").strip()
        return texto or None

    return {
        "marca": _limpo(payload.get("marca")),
        "modelo": _limpo(payload.get("modelo")),
        "numero_serie": _limpo(payload.get("numero_serie")),
        "sistema_operativo": _limpo(payload.get("sistema_operativo")),
    }
