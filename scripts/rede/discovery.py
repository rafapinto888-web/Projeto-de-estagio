"""Comentario geral deste ficheiro: define a logica principal deste modulo."""

import subprocess
import platform
from concurrent.futures import ThreadPoolExecutor, as_completed

# funcao ping
def ping_host(ip):
    # Deteta sistema operativo para escolher sintaxe de ping correta.
    sistema = platform.system().lower()

    # escolher comando
    if sistema == "windows":
        comando = ["ping", "-n", "1", "-w", "100", ip]
    else:
        comando = ["ping", "-c", "1", "-W", "1", ip]

    # executar ping
    resultado = subprocess.run(
        comando,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    # verificar resposta
    return resultado.returncode == 0

# scan rede
def descobrir_hosts_ativos(rede):
    # Acumula apenas IPs que responderam ao ping.
    ativos = []

    # criar tarefas
    with ThreadPoolExecutor(max_workers=50) as executor:
        # Dispara pings em paralelo para reduzir o tempo total.
        tarefas = {
            executor.submit(ping_host, str(ip)): str(ip)
            for ip in rede.hosts()
        }

        # receber resultados
        for tarefa in as_completed(tarefas):
            ip = tarefas[tarefa]

            if tarefa.result():
                ativos.append(ip)

    # Ordena os IPs numericamente para output estável.
    return sorted(ativos, key=lambda x: tuple(map(int, x.split("."))))

