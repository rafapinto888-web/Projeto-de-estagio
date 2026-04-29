import ctypes
import ipaddress
import queue
import sys
import threading
from ctypes import wintypes
from pathlib import Path

from discovery import descobrir_hosts_ativos
from rdp_logs import formatar_log_rdp, obter_logs_rdp
from windows_info import obter_modelo


user32 = ctypes.WinDLL("user32", use_last_error=True)
gdi32 = ctypes.WinDLL("gdi32", use_last_error=True)
kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)


def obter_pasta_programa():
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent

    return Path(__file__).parent


def rgb(vermelho, verde, azul):
    return vermelho | (verde << 8) | (azul << 16)


WM_CREATE = 0x0001
WM_DESTROY = 0x0002
WM_SIZE = 0x0005
WM_GETMINMAXINFO = 0x0024
WM_COMMAND = 0x0111
WM_ERASEBKGND = 0x0014
WM_SETFONT = 0x0030
WM_CTLCOLOREDIT = 0x0133
WM_CTLCOLORBTN = 0x0135
WM_CTLCOLORSTATIC = 0x0138
WM_APP = 0x8000
WM_EVENTO_APP = WM_APP + 1

EM_SETSEL = 0x00B1
EM_REPLACESEL = 0x00C2
EM_SETLIMITTEXT = 0x00C5
EM_SETCUEBANNER = 0x1501
BM_GETCHECK = 0x00F0
BST_CHECKED = 1

WS_CHILD = 0x40000000
WS_VISIBLE = 0x10000000
WS_TABSTOP = 0x00010000
WS_OVERLAPPEDWINDOW = 0x00CF0000
WS_VSCROLL = 0x00200000

WS_EX_CLIENTEDGE = 0x00000200

ES_AUTOHSCROLL = 0x0080
ES_AUTOVSCROLL = 0x0040
ES_MULTILINE = 0x0004
ES_PASSWORD = 0x0020
ES_READONLY = 0x0800
ES_WANTRETURN = 0x1000

BS_AUTOCHECKBOX = 0x0003
BS_PUSHBUTTON = 0x0000

DEFAULT_CHARSET = 1
OUT_DEFAULT_PRECIS = 0
CLIP_DEFAULT_PRECIS = 0
DEFAULT_QUALITY = 0
DEFAULT_PITCH = 0
FW_NORMAL = 400
FW_SEMIBOLD = 600
FW_BOLD = 700

SW_SHOW = 5
CW_USEDEFAULT = ctypes.c_int(0x80000000).value

ID_REDE = 1001
ID_UTILIZADOR = 1002
ID_PASSWORD = 1003
ID_LOGS = 1004
ID_INICIAR = 1005
ID_SAIDA = 1006
ID_ESTADO = 1007

MB_OK = 0x00000000
MB_ICONINFORMATION = 0x00000040
MB_ICONERROR = 0x00000010


LRESULT = wintypes.LPARAM
WNDPROC = ctypes.WINFUNCTYPE(
    LRESULT,
    wintypes.HWND,
    wintypes.UINT,
    wintypes.WPARAM,
    wintypes.LPARAM,
)


class WNDCLASSW(ctypes.Structure):
    _fields_ = [
        ("style", wintypes.UINT),
        ("lpfnWndProc", WNDPROC),
        ("cbClsExtra", ctypes.c_int),
        ("cbWndExtra", ctypes.c_int),
        ("hInstance", wintypes.HINSTANCE),
        ("hIcon", wintypes.HANDLE),
        ("hCursor", wintypes.HANDLE),
        ("hbrBackground", wintypes.HANDLE),
        ("lpszMenuName", wintypes.LPCWSTR),
        ("lpszClassName", wintypes.LPCWSTR),
    ]


class MINMAXINFO(ctypes.Structure):
    _fields_ = [
        ("ptReserved", wintypes.POINT),
        ("ptMaxSize", wintypes.POINT),
        ("ptMaxPosition", wintypes.POINT),
        ("ptMinTrackSize", wintypes.POINT),
        ("ptMaxTrackSize", wintypes.POINT),
    ]


user32.RegisterClassW.argtypes = [ctypes.POINTER(WNDCLASSW)]
user32.RegisterClassW.restype = wintypes.ATOM
user32.CreateWindowExW.argtypes = [
    wintypes.DWORD,
    wintypes.LPCWSTR,
    wintypes.LPCWSTR,
    wintypes.DWORD,
    ctypes.c_int,
    ctypes.c_int,
    ctypes.c_int,
    ctypes.c_int,
    wintypes.HWND,
    wintypes.HMENU,
    wintypes.HINSTANCE,
    wintypes.LPVOID,
]
user32.CreateWindowExW.restype = wintypes.HWND
user32.DefWindowProcW.argtypes = [
    wintypes.HWND,
    wintypes.UINT,
    wintypes.WPARAM,
    wintypes.LPARAM,
]
user32.DefWindowProcW.restype = LRESULT
user32.DestroyWindow.argtypes = [wintypes.HWND]
user32.DestroyWindow.restype = wintypes.BOOL
user32.PostQuitMessage.argtypes = [ctypes.c_int]
user32.PostQuitMessage.restype = None
user32.GetMessageW.argtypes = [
    ctypes.POINTER(wintypes.MSG),
    wintypes.HWND,
    wintypes.UINT,
    wintypes.UINT,
]
user32.GetMessageW.restype = wintypes.BOOL
user32.TranslateMessage.argtypes = [ctypes.POINTER(wintypes.MSG)]
user32.TranslateMessage.restype = wintypes.BOOL
user32.DispatchMessageW.argtypes = [ctypes.POINTER(wintypes.MSG)]
user32.DispatchMessageW.restype = LRESULT
user32.IsDialogMessageW.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.MSG)]
user32.IsDialogMessageW.restype = wintypes.BOOL
user32.ShowWindow.argtypes = [wintypes.HWND, ctypes.c_int]
user32.ShowWindow.restype = wintypes.BOOL
user32.UpdateWindow.argtypes = [wintypes.HWND]
user32.UpdateWindow.restype = wintypes.BOOL
user32.MoveWindow.argtypes = [
    wintypes.HWND,
    ctypes.c_int,
    ctypes.c_int,
    ctypes.c_int,
    ctypes.c_int,
    wintypes.BOOL,
]
user32.MoveWindow.restype = wintypes.BOOL
user32.EnableWindow.argtypes = [wintypes.HWND, wintypes.BOOL]
user32.EnableWindow.restype = wintypes.BOOL
user32.GetWindowTextLengthW.argtypes = [wintypes.HWND]
user32.GetWindowTextLengthW.restype = ctypes.c_int
user32.GetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPWSTR, ctypes.c_int]
user32.GetWindowTextW.restype = ctypes.c_int
user32.SetWindowTextW.argtypes = [wintypes.HWND, wintypes.LPCWSTR]
user32.SetWindowTextW.restype = wintypes.BOOL
user32.SendMessageW.argtypes = [
    wintypes.HWND,
    wintypes.UINT,
    wintypes.WPARAM,
    wintypes.LPARAM,
]
user32.SendMessageW.restype = LRESULT
user32.PostMessageW.argtypes = [
    wintypes.HWND,
    wintypes.UINT,
    wintypes.WPARAM,
    wintypes.LPARAM,
]
user32.PostMessageW.restype = wintypes.BOOL
user32.MessageBoxW.argtypes = [
    wintypes.HWND,
    wintypes.LPCWSTR,
    wintypes.LPCWSTR,
    wintypes.UINT,
]
user32.MessageBoxW.restype = ctypes.c_int
user32.GetClientRect.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.RECT)]
user32.GetClientRect.restype = wintypes.BOOL
user32.InvalidateRect.argtypes = [wintypes.HWND, ctypes.POINTER(wintypes.RECT), wintypes.BOOL]
user32.InvalidateRect.restype = wintypes.BOOL
kernel32.GetModuleHandleW.argtypes = [wintypes.LPCWSTR]
kernel32.GetModuleHandleW.restype = wintypes.HINSTANCE
gdi32.CreateSolidBrush.argtypes = [wintypes.COLORREF]
gdi32.CreateSolidBrush.restype = wintypes.HBRUSH
user32.FillRect.argtypes = [wintypes.HDC, ctypes.POINTER(wintypes.RECT), wintypes.HBRUSH]
user32.FillRect.restype = ctypes.c_int
gdi32.SetBkColor.argtypes = [wintypes.HDC, wintypes.COLORREF]
gdi32.SetBkColor.restype = wintypes.COLORREF
gdi32.SetTextColor.argtypes = [wintypes.HDC, wintypes.COLORREF]
gdi32.SetTextColor.restype = wintypes.COLORREF
gdi32.CreateFontW.argtypes = [
    ctypes.c_int,
    ctypes.c_int,
    ctypes.c_int,
    ctypes.c_int,
    ctypes.c_int,
    wintypes.DWORD,
    wintypes.DWORD,
    wintypes.DWORD,
    wintypes.DWORD,
    wintypes.DWORD,
    wintypes.DWORD,
    wintypes.DWORD,
    wintypes.DWORD,
    wintypes.LPCWSTR,
]
gdi32.CreateFontW.restype = wintypes.HFONT


class RedeDiscoveryApp:
    def __init__(self):
        self.hinst = kernel32.GetModuleHandleW(None)
        self.hwnd = None
        self.cores = {
            "fundo": rgb(244, 246, 248),
            "header": rgb(255, 255, 255),
            "accent": rgb(15, 118, 110),
            "painel": rgb(255, 255, 255),
            "saida": rgb(250, 251, 252),
            "chip_ready": rgb(232, 245, 239),
            "chip_running": rgb(225, 242, 254),
            "chip_done": rgb(220, 252, 231),
            "chip_error": rgb(254, 226, 226),
            "texto": rgb(24, 32, 45),
            "muted": rgb(91, 103, 119),
            "branco": rgb(255, 255, 255),
            "status_ready": rgb(21, 94, 117),
            "status_running": rgb(7, 89, 133),
            "status_done": rgb(22, 101, 52),
            "status_error": rgb(153, 27, 27),
        }
        self.brushes = {
            nome: gdi32.CreateSolidBrush(cor)
            for nome, cor in self.cores.items()
            if nome
            in (
                "fundo",
                "header",
                "accent",
                "painel",
                "saida",
                "chip_ready",
                "chip_running",
                "chip_done",
                "chip_error",
            )
        }
        self.font = self._criar_fonte(16, FW_NORMAL)
        self.font_label = self._criar_fonte(14, FW_SEMIBOLD)
        self.font_titulo = self._criar_fonte(28, FW_SEMIBOLD)
        self.font_subtitulo = self._criar_fonte(16, FW_NORMAL)
        self.font_secao = self._criar_fonte(18, FW_SEMIBOLD)
        self.font_pequena = self._criar_fonte(14, FW_NORMAL)
        self.font_mono = self._criar_fonte(16, FW_NORMAL, "Consolas")
        self.controles = {}
        self.cores_controles = {}
        self.cue_banners = []
        self.eventos = queue.Queue()
        self.worker = None
        self._wnd_proc_ref = WNDPROC(self._wnd_proc)

    def run(self):
        self._ativar_dpi()
        self._registar_classe()
        self._criar_janela()
        self._loop_mensagens()

    def _ativar_dpi(self):
        try:
            user32.SetProcessDPIAware()
        except Exception:
            pass

    def _criar_fonte(self, tamanho, peso, nome="Segoe UI"):
        return gdi32.CreateFontW(
            -tamanho,
            0,
            0,
            0,
            peso,
            0,
            0,
            0,
            DEFAULT_CHARSET,
            OUT_DEFAULT_PRECIS,
            CLIP_DEFAULT_PRECIS,
            DEFAULT_QUALITY,
            DEFAULT_PITCH,
            nome,
        )

    def _registar_classe(self):
        classe = WNDCLASSW()
        classe.lpfnWndProc = self._wnd_proc_ref
        classe.hInstance = self.hinst
        classe.hCursor = user32.LoadCursorW(None, 32512)
        classe.hbrBackground = self.brushes["fundo"]
        classe.lpszClassName = "RedeDiscoveryWindow"
        atom = user32.RegisterClassW(ctypes.byref(classe))
        if not atom:
            erro = ctypes.get_last_error()
            if erro != 1410:
                raise ctypes.WinError(erro)

    def _criar_janela(self):
        self.hwnd = user32.CreateWindowExW(
            0,
            "RedeDiscoveryWindow",
            "Rede Discovery",
            WS_OVERLAPPEDWINDOW | WS_VISIBLE,
            CW_USEDEFAULT,
            CW_USEDEFAULT,
            960,
            700,
            None,
            None,
            self.hinst,
            None,
        )
        if not self.hwnd:
            raise ctypes.WinError(ctypes.get_last_error())

        user32.ShowWindow(self.hwnd, SW_SHOW)
        user32.UpdateWindow(self.hwnd)

    def _loop_mensagens(self):
        mensagem = wintypes.MSG()
        while user32.GetMessageW(ctypes.byref(mensagem), None, 0, 0) > 0:
            if not user32.IsDialogMessageW(self.hwnd, ctypes.byref(mensagem)):
                user32.TranslateMessage(ctypes.byref(mensagem))
                user32.DispatchMessageW(ctypes.byref(mensagem))

    def _wnd_proc(self, hwnd, msg, wparam, lparam):
        try:
            if msg == WM_CREATE:
                self._criar_controles(hwnd)
                return 0
            if msg == WM_SIZE:
                largura = lparam & 0xFFFF
                altura = (lparam >> 16) & 0xFFFF
                self._posicionar_controles(largura, altura)
                return 0
            if msg == WM_GETMINMAXINFO:
                info = ctypes.cast(lparam, ctypes.POINTER(MINMAXINFO)).contents
                info.ptMinTrackSize.x = 820
                info.ptMinTrackSize.y = 580
                return 0
            if msg == WM_ERASEBKGND:
                self._pintar_fundo(hwnd, wparam)
                return 1
            if msg in (WM_CTLCOLORSTATIC, WM_CTLCOLOREDIT, WM_CTLCOLORBTN):
                return self._cor_controle(msg, wparam, lparam)
            if msg == WM_COMMAND:
                if (wparam & 0xFFFF) == ID_INICIAR:
                    self._iniciar_scan()
                    return 0
            if msg == WM_EVENTO_APP:
                self._processar_eventos()
                return 0
            if msg == WM_DESTROY:
                user32.PostQuitMessage(0)
                return 0
        except Exception as exc:
            user32.MessageBoxW(hwnd, str(exc), "Rede Discovery", MB_OK | MB_ICONERROR)

        return user32.DefWindowProcW(hwnd, msg, wparam, lparam)

    def _pintar_fundo(self, hwnd, hdc):
        rect = wintypes.RECT()
        user32.GetClientRect(hwnd, ctypes.byref(rect))
        user32.FillRect(hdc, ctypes.byref(rect), self.brushes["fundo"])

    def _cor_controle(self, msg, hdc, hwnd_controle):
        fundo, texto = self.cores_controles.get(int(hwnd_controle), ("fundo", "texto"))

        if msg == WM_CTLCOLOREDIT:
            fundo = "painel"
            if int(hwnd_controle) == int(self.controles.get("saida", 0)):
                fundo = "saida"

        gdi32.SetBkColor(hdc, self.cores[fundo])
        gdi32.SetTextColor(hdc, self.cores[texto])
        return self.brushes[fundo]

    def _criar_controles(self, hwnd):
        self.controles["accent_bg"] = self._criar_controle(hwnd, "STATIC", "", 0, 0, 0)
        self.controles["header_bg"] = self._criar_controle(hwnd, "STATIC", "", 0, 0, 0)
        self.controles["titulo"] = self._criar_controle(hwnd, "STATIC", "Rede Discovery", 0, 0, 0)
        self.controles["subtitulo"] = self._criar_controle(
            hwnd, "STATIC", "Scan de ativos, modelos e logs RDP", 0, 0, 0
        )
        self.controles["estado"] = self._criar_controle(hwnd, "STATIC", "Pronto", 0, 0, ID_ESTADO)

        self.controles["form_bg"] = self._criar_controle(hwnd, "STATIC", "", 0, 0, 0)
        self.controles["form_titulo"] = self._criar_controle(hwnd, "STATIC", "Dados do scan", 0, 0, 0)
        self.controles["form_desc"] = self._criar_controle(
            hwnd, "STATIC", "Usa as mesmas credenciais para consultar os equipamentos encontrados.", 0, 0, 0
        )
        self.controles["lbl_rede"] = self._criar_controle(hwnd, "STATIC", "Rede / CIDR", 0, 0, 0)
        self.controles["rede"] = self._criar_controle(
            hwnd,
            "EDIT",
            "192.168.1.0/24",
            WS_TABSTOP | ES_AUTOHSCROLL,
            WS_EX_CLIENTEDGE,
            ID_REDE,
        )
        self.controles["lbl_utilizador"] = self._criar_controle(hwnd, "STATIC", "Utilizador", 0, 0, 0)
        self.controles["utilizador"] = self._criar_controle(
            hwnd,
            "EDIT",
            "",
            WS_TABSTOP | ES_AUTOHSCROLL,
            WS_EX_CLIENTEDGE,
            ID_UTILIZADOR,
        )
        self.controles["lbl_password"] = self._criar_controle(hwnd, "STATIC", "Password", 0, 0, 0)
        self.controles["password"] = self._criar_controle(
            hwnd,
            "EDIT",
            "",
            WS_TABSTOP | ES_AUTOHSCROLL | ES_PASSWORD,
            WS_EX_CLIENTEDGE,
            ID_PASSWORD,
        )
        self.controles["logs"] = self._criar_controle(
            hwnd,
            "BUTTON",
            "Recolher logs RDP",
            WS_TABSTOP | BS_AUTOCHECKBOX,
            0,
            ID_LOGS,
        )
        self.controles["iniciar"] = self._criar_controle(
            hwnd,
            "BUTTON",
            "Iniciar scan",
            WS_TABSTOP | BS_PUSHBUTTON,
            0,
            ID_INICIAR,
        )

        self.controles["saida_bg"] = self._criar_controle(hwnd, "STATIC", "", 0, 0, 0)
        self.controles["saida_titulo"] = self._criar_controle(hwnd, "STATIC", "Resultados", 0, 0, 0)
        self.controles["saida_hint"] = self._criar_controle(
            hwnd, "STATIC", "Guardado automaticamente em resultado.txt", 0, 0, 0
        )
        self.controles["saida"] = self._criar_controle(
            hwnd,
            "EDIT",
            "",
            WS_TABSTOP | WS_VSCROLL | ES_MULTILINE | ES_AUTOVSCROLL | ES_READONLY | ES_WANTRETURN,
            WS_EX_CLIENTEDGE,
            ID_SAIDA,
        )
        user32.SendMessageW(self.controles["saida"], EM_SETLIMITTEXT, 0, 0)
        self._aplicar_fontes()
        self._registar_cores()
        self._aplicar_placeholders()
        self._posicionar_controles(960, 700)

    def _criar_controle(self, parent, classe, texto, estilo, estilo_ex, controle_id):
        hwnd = user32.CreateWindowExW(
            estilo_ex,
            classe,
            texto,
            WS_CHILD | WS_VISIBLE | estilo,
            0,
            0,
            10,
            10,
            parent,
            wintypes.HMENU(controle_id),
            self.hinst,
            None,
        )
        if not hwnd:
            raise ctypes.WinError(ctypes.get_last_error())
        user32.SendMessageW(hwnd, WM_SETFONT, self.font, 1)
        return hwnd

    def _aplicar_fontes(self):
        self._fonte("titulo", self.font_titulo)
        self._fonte("subtitulo", self.font_subtitulo)
        self._fonte("estado", self.font_label)
        self._fonte("form_titulo", self.font_secao)
        self._fonte("form_desc", self.font_pequena)
        self._fonte("saida_titulo", self.font_secao)
        self._fonte("saida_hint", self.font_pequena)
        self._fonte("lbl_rede", self.font_label)
        self._fonte("lbl_utilizador", self.font_label)
        self._fonte("lbl_password", self.font_label)
        self._fonte("saida", self.font_mono)

    def _fonte(self, nome, fonte):
        user32.SendMessageW(self.controles[nome], WM_SETFONT, fonte, 1)

    def _registar_cores(self):
        self._cor("accent_bg", "accent", "branco")
        self._cor("header_bg", "header", "texto")
        self._cor("titulo", "header", "texto")
        self._cor("subtitulo", "header", "muted")
        self._cor("estado", "chip_ready", "status_ready")

        self._cor("form_bg", "painel", "texto")
        self._cor("form_titulo", "painel", "texto")
        self._cor("form_desc", "painel", "muted")
        self._cor("lbl_rede", "painel", "muted")
        self._cor("lbl_utilizador", "painel", "muted")
        self._cor("lbl_password", "painel", "muted")
        self._cor("logs", "painel", "texto")

        self._cor("saida_bg", "painel", "texto")
        self._cor("saida_titulo", "painel", "texto")
        self._cor("saida_hint", "painel", "muted")
        self._cor("saida", "saida", "texto")

    def _cor(self, nome, fundo, texto):
        self.cores_controles[int(self.controles[nome])] = (fundo, texto)

    def _aplicar_placeholders(self):
        self._placeholder("utilizador", "DOMINIO\\utilizador")
        self._placeholder("password", "Password")

    def _placeholder(self, nome, texto):
        buffer = ctypes.create_unicode_buffer(texto)
        self.cue_banners.append(buffer)
        ponteiro = ctypes.cast(buffer, ctypes.c_void_p).value
        user32.SendMessageW(self.controles[nome], EM_SETCUEBANNER, 0, ponteiro)

    def _posicionar_controles(self, largura, altura):
        if not self.controles:
            return

        largura = max(largura, 820)
        altura = max(altura, 580)
        margem = 28
        gap = 16
        header_h = 96
        painel_w = largura - margem * 2

        self._mover("accent_bg", 0, 0, largura, 5)
        self._mover("header_bg", 0, 5, largura, header_h - 5)
        self._mover("titulo", margem, 22, 360, 34)
        self._mover("subtitulo", margem, 58, 440, 24)
        self._mover("estado", largura - margem - 128, 35, 128, 28)

        form_y = header_h + 20
        form_h = 174
        self._mover("form_bg", margem, form_y, painel_w, form_h)
        self._mover("form_titulo", margem + 18, form_y + 14, 260, 24)
        self._mover("form_desc", margem + 18, form_y + 40, painel_w - 36, 20)

        conteudo_x = margem + 18
        conteudo_w = painel_w - 36
        col_w = max(150, (conteudo_w - gap * 2) // 3)
        campo_y = form_y + 72
        label_h = 20
        campo_h = 30
        x_rede = conteudo_x
        x_user = x_rede + col_w + gap
        x_pass = x_user + col_w + gap

        self._mover("lbl_rede", x_rede, campo_y, col_w, label_h)
        self._mover("rede", x_rede, campo_y + 23, col_w, campo_h)
        self._mover("lbl_utilizador", x_user, campo_y, col_w, label_h)
        self._mover("utilizador", x_user, campo_y + 23, col_w, campo_h)
        self._mover("lbl_password", x_pass, campo_y, col_w, label_h)
        self._mover("password", x_pass, campo_y + 23, col_w, campo_h)

        opcoes_y = form_y + 132
        self._mover("logs", conteudo_x, opcoes_y + 5, 190, 26)
        self._mover("iniciar", margem + painel_w - 18 - 136, opcoes_y, 136, 34)

        saida_y = form_y + form_h + 18
        saida_h = max(220, altura - saida_y - margem)
        self._mover("saida_bg", margem, saida_y, painel_w, saida_h)
        self._mover("saida_titulo", margem + 18, saida_y + 14, 240, 24)
        self._mover("saida_hint", largura - margem - 300, saida_y + 18, 282, 20)
        self._mover("saida", margem + 18, saida_y + 48, painel_w - 36, saida_h - 66)

        user32.InvalidateRect(self.hwnd, None, True)

    def _mover(self, nome, x, y, largura, altura):
        user32.MoveWindow(self.controles[nome], x, y, largura, altura, True)

    def _iniciar_scan(self):
        if self.worker and self.worker.is_alive():
            return

        rede_texto = self._obter_texto("rede").strip()
        utilizador = self._obter_texto("utilizador").strip()
        password = self._obter_texto("password")
        recolher_logs_rdp = (
            user32.SendMessageW(self.controles["logs"], BM_GETCHECK, 0, 0) == BST_CHECKED
        )

        self._limpar_saida()
        self._definir_execucao(True)

        self.worker = threading.Thread(
            target=self._executar_scan,
            args=(rede_texto, utilizador, password, recolher_logs_rdp),
            daemon=True,
        )
        self.worker.start()

    def _executar_scan(self, rede_texto, utilizador, password, recolher_logs_rdp):
        try:
            try:
                rede = ipaddress.ip_network(rede_texto, strict=False)
            except ValueError:
                self._publicar("erro", "Rede invalida.")
                return

            self._publicar("linha", f"A procurar maquinas ativas em {rede}...")
            ativos = descobrir_hosts_ativos(rede)

            primeiro_host = next(rede.hosts(), None)
            if primeiro_host:
                ativos = [ip for ip in ativos if ip != str(primeiro_host)]

            self._publicar("linha", "")
            self._publicar("linha", f"Total de ativos: {len(ativos)}")
            self._publicar("linha", "")
            self._publicar("linha", "Inventario:")
            self._publicar("linha", "")

            caminho_resultado = obter_pasta_programa() / "resultado.txt"

            with open(caminho_resultado, "w", encoding="utf-8") as ficheiro:
                ficheiro.write(f"Rede: {rede}\n")
                ficheiro.write(f"Total de ativos: {len(ativos)}\n\n")

                if not ativos:
                    ficheiro.write("Nenhum host ativo encontrado.\n")

                for ip in ativos:
                    self._publicar("linha", f"A processar {ip}...")
                    try:
                        modelo = obter_modelo(ip, utilizador, password)
                    except Exception as exc:
                        modelo = f"Erro Modelo: {exc}"

                    linha = f"IP: {ip}  | Modelo: {modelo}"

                    self._publicar("linha", linha)
                    ficheiro.write(linha + "\n")

                    if recolher_logs_rdp:
                        self._publicar("linha", f"  A recolher logs RDP de {ip}...")
                        logs_rdp = obter_logs_rdp(ip, utilizador, password)
                        ficheiro.write("  Logs RDP:\n")

                        if not logs_rdp:
                            linha_log = "    Sem registos RDP encontrados."
                            self._publicar("linha", linha_log)
                            ficheiro.write(linha_log + "\n")

                        for log in logs_rdp:
                            linha_log = "    " + formatar_log_rdp(log)
                            self._publicar("linha", linha_log)
                            ficheiro.write(linha_log + "\n")

            self._publicar("linha", "")
            self._publicar("concluido", f"Resultado guardado em: {caminho_resultado}")
        except Exception as exc:
            self._publicar("erro", f"Erro: {exc}")
        finally:
            self._publicar("fim", None)

    def _publicar(self, tipo, valor):
        self.eventos.put((tipo, valor))
        if self.hwnd:
            user32.PostMessageW(self.hwnd, WM_EVENTO_APP, 0, 0)

    def _processar_eventos(self):
        mensagens = []

        try:
            while True:
                tipo, valor = self.eventos.get_nowait()

                if tipo == "linha":
                    self._adicionar_linha(valor)
                elif tipo == "concluido":
                    self._adicionar_linha(valor)
                    self._definir_estado("Concluido", "done")
                    mensagens.append((valor, MB_OK | MB_ICONINFORMATION))
                elif tipo == "erro":
                    self._adicionar_linha(valor)
                    self._definir_estado("Erro", "error")
                    mensagens.append((valor, MB_OK | MB_ICONERROR))
                elif tipo == "fim":
                    self._definir_execucao(False)
        except queue.Empty:
            pass

        for texto, estilo in mensagens:
            user32.MessageBoxW(self.hwnd, texto, "Rede Discovery", estilo)

    def _obter_texto(self, nome):
        hwnd = self.controles[nome]
        tamanho = user32.GetWindowTextLengthW(hwnd)
        buffer = ctypes.create_unicode_buffer(tamanho + 1)
        user32.GetWindowTextW(hwnd, buffer, tamanho + 1)
        return buffer.value

    def _limpar_saida(self):
        user32.SetWindowTextW(self.controles["saida"], "")

    def _adicionar_linha(self, texto):
        buffer = ctypes.create_unicode_buffer(texto + "\r\n")
        ponteiro = ctypes.cast(buffer, ctypes.c_void_p).value
        fim = ctypes.c_size_t(-1).value
        user32.SendMessageW(self.controles["saida"], EM_SETSEL, fim, fim)
        user32.SendMessageW(self.controles["saida"], EM_REPLACESEL, 0, ponteiro)

    def _definir_estado(self, texto, tipo="ready"):
        estilos = {
            "ready": ("chip_ready", "status_ready"),
            "running": ("chip_running", "status_running"),
            "done": ("chip_done", "status_done"),
            "error": ("chip_error", "status_error"),
        }
        self.cores_controles[int(self.controles["estado"])] = estilos.get(tipo, estilos["ready"])
        user32.SetWindowTextW(self.controles["estado"], texto)
        user32.InvalidateRect(self.controles["estado"], None, True)

    def _definir_execucao(self, em_execucao):
        ativo = not em_execucao
        for nome in ("rede", "utilizador", "password", "logs", "iniciar"):
            user32.EnableWindow(self.controles[nome], ativo)

        if em_execucao:
            user32.SetWindowTextW(self.controles["iniciar"], "A executar...")
            self._definir_estado("A executar", "running")
            return

        user32.SetWindowTextW(self.controles["iniciar"], "Iniciar scan")
        estado = self._obter_texto("estado")
        if estado == "A executar":
            self._definir_estado("Pronto", "ready")


def main():
    RedeDiscoveryApp().run()


if __name__ == "__main__":
    main()
