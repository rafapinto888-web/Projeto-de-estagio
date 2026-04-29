import ipaddress
import getpass
import sys
from pathlib import Path
from discovery import descobrir_hosts_ativos
from windows_info import obter_info_completa
from rdp_logs import (
    obter_logs_rdp,
    formatar_log_rdp,
    obter_logs_seguranca,
    formatar_log_seguranca,
)

def obter_pasta_programa():
    # Em exe usa pasta do binario; em .py usa pasta do script.
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent

    return Path(__file__).parent

# pedir rede
rede_texto = input("Indica a rede (ex: 192.168.1.0/24): ").strip()

# pedir credenciais
utilizador = input("Utilizador: ").strip()
password = getpass.getpass("Password: ")

#logs RDP
recolher_logs_rdp = input("Recolher logs RDP? (s/N): ").strip().lower() == "s"
recolher_logs_seguranca = input("Recolher logs Seguranca? (s/N): ").strip().lower() == "s"

# validar rede
try:
    # Aceita CIDR e normaliza rede sem exigir strict.
    rede = ipaddress.ip_network(rede_texto, strict=False)
except ValueError:
    print("Rede inválida.")
    exit()

# info scan
print(f"\nA procurar máquinas ativas em {rede}...")

# descobrir ips
ativos = descobrir_hosts_ativos(rede)

# ignorar o primeiro host da rede (normalmente gateway)
primeiro_host = next(rede.hosts(), None)
if primeiro_host:
    ativos = [ip for ip in ativos if ip != str(primeiro_host)]

# mostrar total
print(f"\nTotal de ativos: {len(ativos)}")
print("\nInventário:\n")

# guardar ficheiro
caminho_resultado = obter_pasta_programa() / "resultado.txt"

with open(caminho_resultado, "w", encoding="utf-8") as ficheiro:
    # Cabecalho de contexto do scan executado.
    ficheiro.write(f"Rede: {rede}\n")
    ficheiro.write(f"Total de ativos: {len(ativos)}\n\n")

    if not ativos:
        ficheiro.write("Nenhum host ativo encontrado.\n")

    # loop resultados
    for ip in ativos:
        print(f"A processar {ip}...", flush=True)
        try:
            # Recolhe inventario tecnico remoto do host.
            info = obter_info_completa(ip, utilizador, password)
        except Exception as exc:
            info = {
                "hostname": "Erro",
                "marca": "Erro",
                "modelo": f"Erro: {exc}",
                "numero_serie": "Erro",
                "sistema_operativo": "Erro",
                "mac_address": "Erro",
            }

        linha = (
            f"IP: {ip}  | Hostname: {info['hostname']} | MAC: {info['mac_address']} "
            f"| Marca: {info['marca']} | Modelo: {info['modelo']} "
            f"| Serie: {info['numero_serie']} | SO: {info['sistema_operativo']}"
        )

        print(linha, flush=True)
        ficheiro.write(linha + "\n")

        if recolher_logs_rdp:
            # Logs RDP sao opcionais para nao penalizar tempo em todos os runs.
            print(f"  A recolher logs RDP de {ip}...", flush=True)
            logs_rdp = obter_logs_rdp(ip, utilizador, password)
            ficheiro.write("  Logs RDP:\n")

            if not logs_rdp:
                linha_log = "    Sem registos RDP encontrados."
                print(linha_log, flush=True)
                ficheiro.write(linha_log + "\n")

            for log in logs_rdp:
                linha_log = "    " + formatar_log_rdp(log)
                print(linha_log, flush=True)
                ficheiro.write(linha_log + "\n")

        if recolher_logs_seguranca:
            # Logs de seguranca sao opcionais e podem depender de permissao.
            print(f"  A recolher logs Seguranca de {ip}...", flush=True)
            logs_seg = obter_logs_seguranca(ip, utilizador, password)
            ficheiro.write("  Logs Seguranca:\n")

            if not logs_seg:
                linha_log = "    Sem registos de seguranca encontrados."
                print(linha_log, flush=True)
                ficheiro.write(linha_log + "\n")

            for log in logs_seg:
                linha_log = "    " + formatar_log_seguranca(log)
                print(linha_log, flush=True)
                ficheiro.write(linha_log + "\n")

print(f"\nResultado guardado em: {caminho_resultado}")
