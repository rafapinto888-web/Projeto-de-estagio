import os
import subprocess


def sem_janela():
    # Em Linux/macOS nao precisa de flags para esconder janela.
    if os.name != "nt":
        return {}

    parametros = {}

    creationflags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    if creationflags:
        # Evita abrir consola extra quando chamar PowerShell.
        parametros["creationflags"] = creationflags

    if hasattr(subprocess, "STARTUPINFO"):
        # Ajusta startup do processo para correr invisivel.
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = 0
        parametros["startupinfo"] = startupinfo

    # Devolve kwargs prontos para passar ao subprocess.run.
    return parametros
