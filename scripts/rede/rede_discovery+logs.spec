# -*- mode: python ; coding: utf-8 -*-
# PyInstaller: executável do scan de rede (main.py + módulos locais).
# Correr a partir desta pasta: pyinstaller rede_discovery+logs.spec

from pathlib import Path

block_cipher = None
spec_dir = Path(SPEC).parent.resolve()

a = Analysis(
    [str(spec_dir / "main.py")],
    pathex=[str(spec_dir)],
    binaries=[],
    datas=[],
    hiddenimports=[],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="rede_discovery+logs",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
