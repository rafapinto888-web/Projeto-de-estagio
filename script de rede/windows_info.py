import subprocess
import os
import json
from processos import sem_janela

# obter modelo
def obter_modelo(ip, utilizador, password):
    ambiente = os.environ.copy()
    ambiente["REDE_SCAN_IP"] = ip
    ambiente["REDE_SCAN_USER"] = utilizador
    ambiente["REDE_SCAN_PASSWORD"] = password

    script = """
$ErrorActionPreference = "Stop"
$securePassword = ConvertTo-SecureString $env:REDE_SCAN_PASSWORD -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($env:REDE_SCAN_USER, $securePassword)

function Try-Cim {
    param([string]$Protocol)

    $session = $null
    try {
        if ($Protocol -eq "DCOM") {
            $options = New-CimSessionOption -Protocol Dcom
            $session = New-CimSession -ComputerName $env:REDE_SCAN_IP -Credential $credential -SessionOption $options
        } else {
            $session = New-CimSession -ComputerName $env:REDE_SCAN_IP -Credential $credential
        }

        $cs = Get-CimInstance -CimSession $session -ClassName Win32_ComputerSystem |
            Select-Object Manufacturer, Model, SystemFamily

        if ($session) {
            Remove-CimSession $session
        }

        $fabLower = ""
        if ($cs.Manufacturer) { $fabLower = $cs.Manufacturer.ToString().ToLower() }

        if ($fabLower -match "lenovo") {
            if ($cs.SystemFamily) { return $cs.SystemFamily }
        }

        if ($fabLower -match "hp" -or $fabLower -match "hewlett") {
            if ($cs.Model) { return $cs.Model }
        }

        if ($cs.Model) { return $cs.Model }
        if ($cs.SystemFamily) { return $cs.SystemFamily }
    } catch {
        if ($session) {
            Remove-CimSession $session -ErrorAction SilentlyContinue
        }
    }

    return $null
}

$modelo = Try-Cim -Protocol "DCOM"
if (-not $modelo) {
    $modelo = Try-Cim -Protocol "WSMAN"
}

if ($modelo) { $modelo } else { "" }
"""

    resultado = subprocess.run(
        ["powershell", "-NoProfile", "-Command", script],
        capture_output=True,
        text=True,
        env=ambiente,
        timeout=20,
        **sem_janela()
    )

    modelo = resultado.stdout.strip()
    if modelo:
        return modelo

    return "Nao acessivel"


def obter_info_completa(ip, utilizador, password):
    # Injeta parametros em variaveis de ambiente para o script PowerShell.
    ambiente = os.environ.copy()
    ambiente["REDE_SCAN_IP"] = ip
    ambiente["REDE_SCAN_USER"] = utilizador
    ambiente["REDE_SCAN_PASSWORD"] = password

    script = """
$ErrorActionPreference = "SilentlyContinue"
$securePassword = ConvertTo-SecureString $env:REDE_SCAN_PASSWORD -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($env:REDE_SCAN_USER, $securePassword)
$target = $env:REDE_SCAN_IP

function Try-CimInfo {
    param([string]$Protocol)
    # Tenta abrir sessao CIM em DCOM/WSMAN e ler classes de inventario.
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
        $nics = Get-CimInstance -CimSession $session -ClassName Win32_NetworkAdapterConfiguration -ErrorAction SilentlyContinue |
            Where-Object { $_.IPEnabled -eq $true }

        # Prioriza NIC que tenha o IP alvo para obter MAC mais correto.
        $mac = $null
        $nicMatch = $nics | Where-Object { $_.IPAddress -contains $target } | Select-Object -First 1
        if (-not $nicMatch) {
            $nicMatch = $nics | Select-Object -First 1
        }
        if ($nicMatch) { $mac = $nicMatch.MACAddress }

        $hostname = $null
        if ($cs -and $cs.Name) { $hostname = $cs.Name }

        $obj = [pscustomobject]@{
            hostname = $hostname
            marca = if ($cs) { $cs.Manufacturer } else { $null }
            modelo = if ($cs) { $cs.Model } else { $null }
            numero_serie = if ($bios) { $bios.SerialNumber } else { $null }
            sistema_operativo = if ($os) { $os.Caption } else { $null }
            mac_address = $mac
        }

        if ($session) {
            Remove-CimSession $session -ErrorAction SilentlyContinue
        }
        # Devolve objeto com campos normalizados para o Python.
        return $obj
    } catch {
        if ($session) {
            Remove-CimSession $session -ErrorAction SilentlyContinue
        }
        return $null
    }
}

$dados = Try-CimInfo -Protocol "DCOM"
if (-not $dados) {
    # Se DCOM falhar, tenta WSMAN sem abortar.
    $dados = Try-CimInfo -Protocol "WSMAN"
}

if ($dados) {
    $dados | ConvertTo-Json -Compress
} else {
    "{}"
}
"""

    resultado = subprocess.run(
        ["powershell", "-NoProfile", "-Command", script],
        capture_output=True,
        text=True,
        env=ambiente,
        timeout=25,
        **sem_janela()
    )

    try:
        # Faz parse seguro de JSON sem deixar excecao matar o script.
        payload = json.loads((resultado.stdout or "").strip() or "{}")
    except json.JSONDecodeError:
        payload = {}

    if not isinstance(payload, dict):
        payload = {}

    def _limpo(v):
        # Converte vazio/null para texto padrao no relatorio.
        t = str(v or "").strip()
        return t if t else "Nao acessivel"

    return {
        "hostname": _limpo(payload.get("hostname")),
        "marca": _limpo(payload.get("marca")),
        "modelo": _limpo(payload.get("modelo")),
        "numero_serie": _limpo(payload.get("numero_serie")),
        "sistema_operativo": _limpo(payload.get("sistema_operativo")),
        "mac_address": _limpo(payload.get("mac_address")).replace("-", ":").lower(),
    }
