/*
 * Componente raiz: autenticação, estado global e roteamento por abas (hash).
 * Delega UI de cada secção às páginas em ./pages.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { api } from "./api";
import { isAdminProfileName } from "./authz";
import SidebarNav from "./components/SidebarNav";
import StatusAlert from "./components/StatusAlert";
import Topbar from "./components/Topbar";
import AtivosPage from "./pages/AtivosPage";
import ComputadoresPage from "./pages/ComputadoresPage";
import DashboardPage from "./pages/DashboardPage";
import InventariosPage from "./pages/InventariosPage";
import LocalizacoesPage from "./pages/LocalizacoesPage";
import LogsPage from "./pages/LogsPage";
import HistoricoContaPage from "./pages/HistoricoContaPage";
import PesquisaPage from "./pages/PesquisaPage";
import UtilizadoresPage from "./pages/UtilizadoresPage";

// --- Navegação: abas do menu e sincronização com URL (#hash) ---

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "inventarios", label: "Inventários" },
  { id: "ativos", label: "Scan" },
  { id: "computadores", label: "Computadores" },
  { id: "utilizadores", label: "Utilizadores" },
  { id: "localizacoes", label: "Localizações" },
  { id: "pesquisa", label: "Pesquisa global" },
  { id: "historico-conta", label: "Histórico" },
  { id: "logs", label: "Logs" },
];

const TAB_IDS = new Set(TABS.map((t) => t.id));

// Aba ativa a partir do fragmento da URL (ex. #computadores).
function tabIdFromLocation() {
  try {
    const raw = decodeURIComponent((window.location.hash || "").replace(/^#/, "").trim());
    if (!raw) return "dashboard";
    return TAB_IDS.has(raw) ? raw : "dashboard";
  } catch {
    return "dashboard";
  }
}

// Escreve o hash (#aba) sem recarregar a página.
function syncLocationHash(tabId) {
  const path = `${window.location.pathname}${window.location.search}`;
  const next = tabId === "dashboard" ? path : `${path}#${tabId}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current !== next) {
    window.history.replaceState(null, "", next);
  }
}

// --- Formulários e utilitários de rede (scan) ---

function emptyComputerForm() {
  return {
    id: "",
    nome: "",
    marca: "",
    modelo: "",
    numero_serie: "",
    estado: "ativo",
    inventario_id: "",
    localizacao_id: "",
    utilizador_responsavel_id: "",
    hostname: "",
    endereco_ip: "",
    mac_address: "",
    sistema_operativo: "",
  };
}

// Corpo JSON para criar/atualizar computador a partir do form.
function payloadComputadorRegisto(form) {
  // Normaliza o form partilhado num payload consistente para create/update completo.
  return {
    nome: form.nome.trim(),
    marca: form.marca.trim(),
    modelo: form.modelo.trim(),
    numero_serie: form.numero_serie.trim(),
    estado: (form.estado && form.estado.trim()) || "ativo",
    inventario_id: Number(form.inventario_id),
    localizacao_id: form.localizacao_id ? Number(form.localizacao_id) : null,
    utilizador_responsavel_id: form.utilizador_responsavel_id
      ? Number(form.utilizador_responsavel_id)
      : null,
    hostname: form.hostname?.trim() || null,
    endereco_ip: form.endereco_ip?.trim() || null,
    mac_address: form.mac_address?.trim() || null,
    sistema_operativo: form.sistema_operativo?.trim() || null,
  };
}

// Form utilizador vazio.
function emptyUserForm() {
  return { id: "", nome: "", username: "", email: "", perfil_id: "", palavra_passe: "" };
}

// Form inventário vazio.
function emptyInventarioForm() {
  return { id: "", nome: "", tipo_inventario: "normal", ip_rede: "", descricao: "" };
}

// Remove chaves com string vazia ou null (útil em query strings de logs).
function limparQueryVazia(params) {
  // Evita enviar filtros vazios que poderiam alterar o comportamento do backend.
  return Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => {
      if (value == null) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      return true;
    }),
  );
}

// Parse de IPv4 para array de 4 números; inválido => null.
function parseIPv4(ip) {
  const txt = String(ip || "").trim();
  const parts = txt.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums;
}

// Compara dois IPv4 já parseados.
function compareIPv4(a, b) {
  for (let i = 0; i < 4; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

// Texto do campo rede do scan -> CIDR/rede aceite pela API ou erro.
function normalizarRedeScan(rawValue) {
  // Aceita IP unico, CIDR ou alguns intervalos simples e devolve um alvo seguro para a API.
  const input = String(rawValue || "").trim();
  if (!input) {
    return { ok: true, rede: null, label: "rede padrão do inventário" };
  }

  const cidrMatch = input.match(/^(\d{1,3}(?:\.\d{1,3}){3})\/(\d{1,2})$/);
  if (cidrMatch) {
    const ip = parseIPv4(cidrMatch[1]);
    const prefix = Number(cidrMatch[2]);
    if (!ip || prefix < 0 || prefix > 32) {
      return { ok: false, message: "IP ou intervalo de rede inválido." };
    }
    return { ok: true, rede: `${ip.join(".")}/${prefix}`, label: `${ip.join(".")}/${prefix}` };
  }

  const singleIp = parseIPv4(input);
  if (singleIp) {
    const rede = `${singleIp.join(".")}/32`;
    return { ok: true, rede, label: rede };
  }

  const rangeMatch = input.match(/^(\d{1,3}(?:\.\d{1,3}){3})\s*-\s*(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (rangeMatch) {
    const start = parseIPv4(rangeMatch[1]);
    const end = parseIPv4(rangeMatch[2]);
    if (!start || !end || compareIPv4(start, end) > 0) {
      return { ok: false, message: "IP ou intervalo de rede inválido." };
    }
    if (start[0] === end[0] && start[1] === end[1] && start[2] === end[2] && start[3] === 1 && end[3] === 254) {
      const rede = `${start[0]}.${start[1]}.${start[2]}.0/24`;
      return { ok: true, rede, label: `${start.join(".")}-${end.join(".")} (${rede})` };
    }
    if (compareIPv4(start, end) === 0) {
      const rede = `${start.join(".")}/32`;
      return { ok: true, rede, label: rede };
    }
    return {
      ok: false,
      message: "Intervalo válido, mas não suportado neste modo. Usa CIDR (ex.: 192.168.1.0/24).",
    };
  }

  return { ok: false, message: "IP ou intervalo de rede inválido." };
}

/** Resposta do scan: todos os hosts sem marca/modelo/SO → provável falta de acesso WMI remoto. */
function heuristicaScanSemWmiCompleto(out) {
  // Se todos os hosts vierem sem enriquecimento tecnico, sugerimos repetir com credenciais explicitas.
  const disps = out?.dispositivos_descobertos;
  if (!Array.isArray(disps) || disps.length === 0) return false;
  return disps.every(
    (d) =>
      !String(d?.marca || "").trim() &&
      !String(d?.modelo || "").trim() &&
      !String(d?.sistema_operativo || "").trim(),
  );
}

/** Mensagens de erro da API que sugerem problema de autenticação Windows/rede (domínio). */
function erroRespostaSugereCredenciaisDominio(msg) {
  const m = String(msg || "").toLowerCase();
  return /acesso negado|access denied|autentic|authentication|credencial|credential|logon|log\u00f3n|wmi|cim|rpc|forbidden|negad|unauthorized|winrm|negotiate|logon failure|falha de inicio|falha de início/.test(
    m,
  );
}

export default function App() {
  const theme = useTheme();
  const isCompactTopbar = useMediaQuery(theme.breakpoints.down("md"));

  // --- Estado da aplicação ---
  const [status, setStatus] = useState({ type: "ok", message: "" }); // mensagens ok / erro na StatusAlert
  const [activeTab, setActiveTab] = useState(() => tabIdFromLocation());
  /** Menu lateral (drawer): fechado por defeito — não ocupa largura no layout. */
  const [navOpen, setNavOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false); // bootstrap inicial da sessao por cookie
  const [user, setUser] = useState(null); // /auth/me
  const [dataLoading, setDataLoading] = useState(false); // loadAllData inicial / refresh
  const [actionLoading, setActionLoading] = useState(false); // botões CRUD, login, pesquisa…

  // Listas vindas da API (painel inteiro).
  const [inventarios, setInventarios] = useState([]);
  const [computadores, setComputadores] = useState([]);
  const [ativosPorInventario, setAtivosPorInventario] = useState([]);
  const [utilizadores, setUtilizadores] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [localizacoes, setLocalizacoes] = useState([]);
  const [ativos, setAtivos] = useState([]); // lista do inventário selecionado na aba Scan

  // Formulários e inventário ativo (Scan + várias páginas).
  const [selectedInventarioId, setSelectedInventarioId] = useState("");
  const [inventarioForm, setInventarioForm] = useState(emptyInventarioForm());
  const [computadorForm, setComputadorForm] = useState(emptyComputerForm());
  const [utilizadorForm, setUtilizadorForm] = useState(emptyUserForm());
  const [localizacaoForm, setLocalizacaoForm] = useState({ id: "", nome: "", descricao: "" });

  // Credenciais e opções do scan de rede (aba Scan).
  const [scanRede, setScanRede] = useState("");
  const [scanUser, setScanUser] = useState("");
  const [scanPass, setScanPass] = useState("");
  const [scanLogsRdp, setScanLogsRdp] = useState(false);
  const [scanLogsSeguranca, setScanLogsSeguranca] = useState(false);
  const [scanInfo, setScanInfo] = useState("");
  const [ativoPesquisa, setAtivoPesquisa] = useState(""); // filtro texto na lista de ativos do Scan

  // Pesquisa global (termo + JSON devolvido pela API).
  const [globalTermo, setGlobalTermo] = useState("");
  const [globalOutput, setGlobalOutput] = useState("");
  const [globalSearchRequestId, setGlobalSearchRequestId] = useState(0); // força reação na Pesquisa ao vir da topbar
  const [logsOutput, setLogsOutput] = useState("Seleciona filtros para consultar logs.");
  const lastInventarioIdForScanRef = useRef(""); // evita repor scanRede ao mudar só outros estados

  // Filtros dos modais de logs.
  const [logComputadorParams, setLogComputadorParams] = useState({
    computador_id: "",
    nome: "",
    numero_serie: "",
    hostname: "",
    tipo_log: "",
  });
  const [logInventarioParams, setLogInventarioParams] = useState({
    inventario_id: "",
    dispositivo_id: "",
  });

  // Admin se o perfil do /me corresponder ou flag is_admin.
  const isAdmin = useMemo(() => {
    const nomePerfil =
      user?.perfil_nome || user?.perfil || user?.perfil_nome_utilizador || user?.role || "";
    return isAdminProfileName(nomePerfil) || user?.is_admin === true;
  }, [user]);
  const isAuthenticated = Boolean(user);

  const navTabs = useMemo(
    () => (isAdmin ? TABS : TABS.filter((t) => t.id !== "historico-conta")),
    [isAdmin],
  );

  // --- Carregamento de dados (API) ---

  async function loadAllData(options = {}) {
    // Carrega o estado base do painel em paralelo para reduzir tempo de arranque/refresh.
    const { silent = false } = options;
    if (!silent) setDataLoading(true);
    try {
      const [
        inventariosData,
        computadoresData,
        utilizadoresData,
        perfisData,
        localizacoesData,
        ativosGruposData,
      ] = await Promise.all([
        api.inventarios.listar(),
        api.computadores.listar(),
        api.utilizadores.listar(),
        api.perfis.listar(),
        api.localizacoes.listar(),
        api.inventarios.ativosPorInventario(),
      ]);
      setInventarios(inventariosData || []);
      setComputadores(computadoresData || []);
      setAtivosPorInventario(ativosGruposData || []);
      setUtilizadores(utilizadoresData || []);
      setPerfis(perfisData || []);
      setLocalizacoes(localizacoesData || []);
      const firstId = (inventariosData || [])[0]?.id;
      setSelectedInventarioId((prev) => prev || String(firstId || ""));
    } finally {
      if (!silent) setDataLoading(false);
    }
  }

  // Atualiza lista de ativos do inventário na aba Scan (com ou sem termo de pesquisa).
  async function refreshAtivos(invId, searchTerm = "") {
    // A aba Scan trabalha com uma lista combinada: registos manuais + dispositivos descobertos.
    if (!invId) {
      setAtivos([]);
      return;
    }
    const inv = String(invId);
    setActionLoading(true);
    try {
      if (searchTerm) {
        const data = await api.inventarios.pesquisarAtivos(inv, searchTerm);
        const all = [...(data?.computadores || []), ...(data?.dispositivos_descobertos || [])];
        setAtivos(all);
        return;
      }
      const data = await api.inventarios.ativos(inv);
      setAtivos(data || []);
    } finally {
      setActionLoading(false);
    }
  }

  // --- Autenticação ---

  async function handleLogin(event) {
    // O login so e considerado concluido depois de termos sessao e dados iniciais minimamente prontos.
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setActionLoading(true);
    try {
      const identificador = String(formData.get("identificador") ?? "").trim();
      const palavraPasse = String(formData.get("password") ?? "");
      await api.login(identificador, palavraPasse);
      const me = await api.me();
      setUser(me);
      try {
        await loadAllData();
      } catch (loadErr) {
        setStatus({
          type: "ok",
          message: `Sessao iniciada, mas falhou o carregamento inicial (${loadErr.message}). Tenta recarregar a pagina.`,
        });
        setAuthReady(true);
        return;
      }
      setAuthReady(true);
      setStatus({ type: "ok", message: "Sessao iniciada com sucesso" });
    } catch (error) {
      setUser(null);
      setAuthReady(true);
      setStatus({ type: "err", message: `Erro no login: ${error.message}` });
    } finally {
      setActionLoading(false);
    }
  }

  function limparEstadoAutenticado() {
    setUser(null);
    setInventarios([]);
    setComputadores([]);
    setAtivosPorInventario([]);
    setUtilizadores([]);
    setPerfis([]);
    setLocalizacoes([]);
    setAtivos([]);
    setSelectedInventarioId("");
  }

  // Termina sessão e limpa estado local; o backend regista auditoria e revoga a sessão.
  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      /* sessao ja pode ter expirado; mesmo assim limpamos o estado local */
    }
    limparEstadoAutenticado();
    setAuthReady(true);
    setStatus({ type: "ok", message: "Sessao terminada" });
  }

  // --- Mutações CRUD com feedback e auditoria ---

  function removerUtilizadorDoEstado(utilizadorId) {
    // Ajuda a remover a conta logo do estado local, incluindo cenarios de auto-remocao.
    const id = Number(utilizadorId);
    if (Number.isNaN(id)) return;
    setUtilizadores((prev) => prev.filter((u) => Number(u.id) !== id));
  }

  async function withAction(action, successMessage, options = {}) {
    // Wrapper comum: executa a mutacao, refresca dados dependentes e tenta auditar o resultado.
    const { onSuccess } = options;
    setActionLoading(true);
    try {
      const result = await action();
      if (typeof onSuccess === "function") {
        await onSuccess(result);
      }
      await loadAllData();
      if (selectedInventarioId) {
        await refreshAtivos(selectedInventarioId, ativoPesquisa);
      }
      setStatus({ type: "ok", message: successMessage });
      if (successMessage) {
        try {
          await api.registarHistorico({
            acao: "painel",
            descricao: String(successMessage).slice(0, 3900),
          });
        } catch {
          /* não impedir a operação principal se o audit falhar */
        }
      }
      return true;
    } catch (error) {
      setStatus({ type: "err", message: error.message });
      return false;
    } finally {
      setActionLoading(false);
    }
  }

  // --- Efeitos: bootstrap, sync hash, refresh dashboard ---

  useEffect(() => {
    async function bootstrap() {
      // Verifica a sessao HttpOnly ja existente e restaura a UI sem depender de localStorage.
      try {
        const me = await api.me();
        setUser(me);
      } catch {
        setUser(null);
        setAuthReady(true);
        return;
      }
      try {
        await loadAllData();
      } catch {
        // Sessao valida mas dados iniciais falharam (rede, 500): nao deslogar.
        setStatus({
          type: "warn",
          message: "Sessão restaurada; não foi possível carregar todos os dados. Recarrega ou tenta outra vez.",
        });
      } finally {
        setAuthReady(true);
      }
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Qualquer 401 do cliente HTTP termina a sessao visivel e devolve o utilizador ao login.
    function onSessionExpired() {
      limparEstadoAutenticado();
      setAuthReady(true);
      setStatus({ type: "warn", message: "Sessao expirada. Inicia sessao novamente." });
    }
    window.addEventListener("inventario-session-expired", onSessionExpired);
    return () => window.removeEventListener("inventario-session-expired", onSessionExpired);
  }, []);

  // Ao mudar inventário ou voltar a logar: recarrega ativos do Scan para esse inventário.
  useEffect(() => {
    // Precarrega a lista visivel da aba Scan sempre que o inventario alvo muda.
    if (isAuthenticated && selectedInventarioId) {
      refreshAtivos(selectedInventarioId).catch(() =>
        setStatus({ type: "warn", message: "Falha ao carregar ativos" }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInventarioId, isAuthenticated]);

  // Preenche campo "rede" do scan quando escolhes outro inventário (uma vez por id).
  useEffect(() => {
    const invId = String(selectedInventarioId || "");
    if (!invId || lastInventarioIdForScanRef.current === invId) return;
    lastInventarioIdForScanRef.current = invId;
    const inv = (inventarios || []).find((x) => String(x.id) === invId);
    const redePadrao = String(inv?.rede || inv?.ip_rede || "").trim();
    setScanRede(redePadrao);
  }, [selectedInventarioId, inventarios]);

  // Mantém URL (#aba) alinhada com a aba ativa.
  useEffect(() => {
    syncLocationHash(activeTab);
  }, [activeTab]);

  // Voltar atrás / editar hash manualmente: sincroniza aba.
  useEffect(() => {
    const onHashChange = () => {
      setActiveTab(tabIdFromLocation());
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // UX: ao mudar de aba, scroll do conteúdo para o topo.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  // Utilizador normal não tem aba Histórico: evita ficar preso no hash #historico-conta.
  useEffect(() => {
    // Protege o acesso direto por hash a uma aba reservada a administradores.
    if (!isAuthenticated || !user) return;
    if (!isAdmin && activeTab === "historico-conta") {
      setActiveTab("dashboard");
      syncLocationHash("dashboard");
    }
  }, [isAuthenticated, user, isAdmin, activeTab]);

  // Ao abrir Computadores: atualiza agregados (manuais + scan) para refletir o último scan.
  useEffect(() => {
    // Ao abrir Computadores, refrescamos agregados para refletir scans recentes sem refresh total manual.
    if (!isAuthenticated || activeTab !== "computadores") return undefined;
    let cancelled = false;
    (async () => {
      try {
        const [grupos, comps] = await Promise.all([
          api.inventarios.ativosPorInventario(),
          api.computadores.listar(),
        ]);
        if (cancelled) return;
        setAtivosPorInventario(grupos || []);
        setComputadores(comps || []);
      } catch {
        /* falha silenciosa; utilizador já pode ter dados em cache */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, isAuthenticated]);

  // Dashboard aberto: atualiza dados em background a cada 30s (sem spinner principal).
  useEffect(() => {
    if (!isAuthenticated || activeTab !== "dashboard") return undefined;
    const timer = setInterval(() => {
      loadAllData({ silent: true }).catch(() => {
        /* atualização automática opcional; falhas pontuais não devem quebrar UI */
      });
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeTab]);

  const loading = dataLoading || actionLoading; // spinner geral (dados + ações)

  function handleSelectTab(tabId) {
    // Fechar a drawer no mesmo gesto evita dupla interacao em mobile.
    setActiveTab(tabId);
    setNavOpen(false);
  }

  // --- Render: bootstrap da sessao / ecrã de login ---

  if (!authReady) {
    return (
      <main className="auth-screen">
        <div className="auth-card">
          <div className="brand-mini">
            <span className="topbar-logo" aria-hidden style={{ width: 40, height: 40 }}>
              <span className="material-symbols-outlined">inventory_2</span>
            </span>
            <div>
              <h1>Inventário IT</h1>
              <p>A verificar sessão...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="auth-screen">
        {/* POST /auth/login via handleLogin */}
        <form className="auth-card" onSubmit={handleLogin}>
          <div className="brand-mini">
            <span className="topbar-logo" aria-hidden style={{ width: 40, height: 40 }}>
              <span className="material-symbols-outlined">inventory_2</span>
            </span>
            <div>
              <h1>Inventário IT</h1>
              <p>Entrar no painel de gestão.</p>
            </div>
          </div>
          <input name="identificador" placeholder="Utilizador ou email" required autoComplete="username" />
          <input
            name="password"
            type="password"
            placeholder="Palavra-passe"
            required
            autoComplete="current-password"
          />
          <button type="submit">{actionLoading ? "A entrar..." : "Entrar"}</button>
          <StatusAlert type={status.type} message={status.message} />
        </form>
      </main>
    );
  }

  // --- Render: shell autenticado (sidebar + topbar + páginas) ---

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <SidebarNav
        tabs={navTabs}
        activeTab={activeTab}
        onSelect={handleSelectTab}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Topbar
          user={user}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          onNavigate={handleSelectTab}
          compact={isCompactTopbar}
          onToggleNav={() => setNavOpen(true)}
          onSearch={(q) => {
            setGlobalTermo(q); // termo da pesquisa rápida
            handleSelectTab("pesquisa"); // abre Pesquisa global
            setGlobalSearchRequestId((n) => n + 1); // dispara efeitos na página se precisarem
          }}
        />

        <Box
          component="main"
          className="content"
          sx={{
            flex: 1,
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            mx: 0,
            px: { xs: 2, md: 3 },
            py: { xs: 2, md: 3 },
          }}
        >
          <StatusAlert type={status.type} message={status.message} />

          {/* --- Páginas por aba (conteúdo principal) --- */}
          {activeTab === "dashboard" && (
            <DashboardPage
              inventarios={inventarios}
              computadores={computadores}
              ativosPorInventario={ativosPorInventario}
              utilizadores={utilizadores}
              localizacoes={localizacoes}
              isAdmin={isAdmin}
              loading={loading}
              onNavigate={handleSelectTab}
              onOpenHistorico={() => handleSelectTab("historico-conta")}
            />
          )}

          {activeTab === "historico-conta" && (
            <HistoricoContaPage
              token={isAuthenticated ? "session" : ""}
              active={activeTab === "historico-conta"}
              isAdmin={isAdmin}
              utilizadores={utilizadores}
            />
          )}

          {/* Inventários, scan e computadores */}
          {activeTab === "inventarios" && (
            <InventariosPage
              isAdmin={isAdmin}
              inventarioForm={inventarioForm}
              setInventarioForm={setInventarioForm}
              inventarios={inventarios}
              loading={loading}
              onCreate={() =>
                withAction(
                  () => {
                    // Inventarios de sub-rede exigem alvo explicito porque alimentam o fluxo de scan.
                    const rede = inventarioForm.ip_rede.trim();
                    if (inventarioForm.tipo_inventario === "sub_rede" && !rede) {
                      throw new Error("IP da rede é obrigatório para inventário do tipo Rede (sub-rede)");
                    }
                    return api.inventarios.criar(
                      {
                        nome: inventarioForm.nome.trim(),
                        tipo_inventario: inventarioForm.tipo_inventario,
                        rede: rede || null,
                        descricao: inventarioForm.descricao.trim() || null,
                      },
                    );
                  },
                  "Inventario criado",
                )
              }
              onUpdate={() =>
                withAction(
                  () => {
                    const rede = inventarioForm.ip_rede.trim();
                    if (inventarioForm.tipo_inventario === "sub_rede" && !rede) {
                      throw new Error("IP da rede é obrigatório para inventário do tipo Rede (sub-rede)");
                    }
                    return api.inventarios.atualizar(
                      inventarioForm.id,
                      {
                        nome: inventarioForm.nome.trim(),
                        tipo_inventario: inventarioForm.tipo_inventario,
                        rede: rede || null,
                        descricao: inventarioForm.descricao.trim() || null,
                      },
                    );
                  },
                  "Inventario atualizado",
                )
              }
              onCancel={() => setInventarioForm(emptyInventarioForm())}
              onDeleteByForm={async () => {
                if (!window.confirm("Confirmar apagar inventario?")) return false;
                return withAction(() => api.inventarios.apagar(inventarioForm.id), "Inventario apagado");
              }}
              onDeleteRow={(inv) => {
                if (!window.confirm("Confirmar apagar inventario?")) return;
                withAction(() => api.inventarios.apagar(inv.id), "Inventario apagado");
              }}
              onSelectInventario={(inv) => {
                // A mesma selecao serve o editor de Inventarios e o contexto ativo da aba Scan.
                setSelectedInventarioId(String(inv.id));
                setInventarioForm({
                  id: String(inv.id),
                  nome: inv.nome || "",
                  tipo_inventario: inv.tipo_inventario || "normal",
                  ip_rede: inv.rede || inv.ip_rede || "",
                  descricao: inv.descricao || "",
                });
              }}
            />
          )}

          {activeTab === "ativos" && (
            <AtivosPage
              inventarios={inventarios}
              selectedInventarioId={selectedInventarioId}
              setSelectedInventarioId={setSelectedInventarioId}
              ativoPesquisa={ativoPesquisa}
              setAtivoPesquisa={setAtivoPesquisa}
              onPesquisar={async () => {
                try {
                  await refreshAtivos(selectedInventarioId, ativoPesquisa);
                  return true;
                } catch (err) {
                  setStatus({ type: "err", message: err.message });
                  return false;
                }
              }}
              onRecarregarLista={async () => {
                setAtivoPesquisa("");
                try {
                  await refreshAtivos(selectedInventarioId, "");
                  return true;
                } catch (err) {
                  setStatus({ type: "err", message: err.message });
                  return false;
                }
              }}
              isAdmin={isAdmin}
              scanRede={scanRede}
              setScanRede={setScanRede}
              scanUser={scanUser}
              setScanUser={setScanUser}
              scanPass={scanPass}
              setScanPass={setScanPass}
              scanLogsRdp={scanLogsRdp}
              setScanLogsRdp={setScanLogsRdp}
              scanLogsSeguranca={scanLogsSeguranca}
              setScanLogsSeguranca={setScanLogsSeguranca}
              onCreateInventarioFromScan={async (payload) => {
                // Fluxo auxiliar: criar inventario sem sair do modal/assistente de scan.
                setActionLoading(true);
                try {
                  const created = await api.inventarios.criar(payload);
                  await loadAllData();
                  const createdId = created?.id ?? created?.inventario_id ?? null;
                  if (createdId) {
                    setSelectedInventarioId(String(createdId));
                  }
                  setStatus({ type: "ok", message: "Inventário criado para scan" });
                  try {
                    await api.registarHistorico({
                      acao: "painel",
                      descricao: "Inventário criado a partir do fluxo de scan.",
                    });
                  } catch {
                    /* não bloquear operação por falha de auditoria */
                  }
                  return createdId;
                } catch (err) {
                  setStatus({ type: "err", message: err.message });
                  return null;
                } finally {
                  setActionLoading(false);
                }
              }}
              onScan={async ({ signal } = {}) => {
                // Fluxo principal do scan: validar contexto, executar, resumir no log e refrescar o painel.
                const falha = { ok: false };
                if (!selectedInventarioId) {
                  setStatus({ type: "err", message: "Seleciona um inventário para executar o scan" });
                  return falha;
                }
                const inventarioSelecionado = (inventarios || []).find(
                  (inv) => String(inv.id) === String(selectedInventarioId),
                );
                if (inventarioSelecionado?.tipo_inventario !== "sub_rede") {
                  setStatus({ type: "err", message: "O scan só está disponível para inventários do tipo Rede (sub-rede)" });
                  return falha;
                }
                const userTrim = scanUser.trim();
                const passRaw = scanPass != null ? String(scanPass) : "";
                const passTrim = passRaw.trim();
                const temCredRede = Boolean(userTrim && passTrim);
                if (userTrim && !passTrim) {
                  setStatus({
                    type: "err",
                    message: "Indica também a palavra-passe de rede, ou apaga o utilizador para executar só com a conta do serviço.",
                  });
                  return falha;
                }
                if (!userTrim && passTrim) {
                  setStatus({
                    type: "err",
                    message: "Indica o utilizador de rede, ou apaga a palavra-passe para executar só com a conta do serviço.",
                  });
                  return falha;
                }
                const redeNormalizada = normalizarRedeScan(scanRede);
                if (!redeNormalizada.ok) {
                  setStatus({ type: "err", message: redeNormalizada.message });
                  return falha;
                }
                const stamp = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                const alvoRede = redeNormalizada.label;
                const logsEscolhidos = [];
                if (scanLogsRdp) logsEscolhidos.push("RDP");
                if (scanLogsSeguranca) logsEscolhidos.push("Segurança");
                const modoLogsLabel = logsEscolhidos.length ? logsEscolhidos.join(" + ") : "Nenhum selecionado";
                const credLabel = temCredRede
                  ? `${userTrim} (conta explícita)`
                  : "conta do serviço / permissões locais";
                setScanInfo(
                  `[${stamp}] Iniciar scan...\n` +
                    `[${stamp}] Inventário: ${selectedInventarioId || "não definido"}\n` +
                    `[${stamp}] Alvo: ${alvoRede}\n` +
                    `[${stamp}] Logs pedidos: ${modoLogsLabel}\n` +
                    `[${stamp}] Credenciais: ${credLabel}\n` +
                    `[${stamp}] Estado: em execução`,
                );
                try {
                  const out = await api.inventarios.scan(
                    selectedInventarioId,
                    {
                      rede: redeNormalizada.rede,
                      utilizador: temCredRede ? userTrim : null,
                      password: temCredRede ? passRaw : null,
                      tipos_log: [
                        ...(scanLogsSeguranca ? ["seguranca"] : []),
                        ...(scanLogsRdp ? ["rdp"] : []),
                      ],
                    },
                    { signal },
                  );
                  // Quando so um tipo de log foi pedido, tentamos consultar o total desse tipo para resumo.
                  let totalLogsPreferidos = null;
                  if (scanLogsRdp !== scanLogsSeguranca) {
                    const tipoLog = scanLogsRdp ? "rdp" : "seguranca";
                    try {
                      const consulta = await api.inventarios.logsDispositivos(
                        selectedInventarioId,
                        { coletar_agora: "false", tipo_log: tipoLog },
                        { signal },
                      );
                      totalLogsPreferidos = consulta?.total_logs ?? 0;
                    } catch {
                      totalLogsPreferidos = null;
                    }
                  }
                  const doneStamp = new Date().toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  setScanInfo(
                    `[${doneStamp}] Iniciar scan...\n` +
                      `[${doneStamp}] Inventário: ${selectedInventarioId || "não definido"}\n` +
                      `[${doneStamp}] Alvo: ${alvoRede}\n` +
                      `[${doneStamp}] Resultado: concluído com sucesso\n` +
                      `[${doneStamp}] Dispositivos encontrados: ${out?.total_dispositivos_encontrados ?? 0}\n` +
                      `[${doneStamp}] Logs recolhidos: ${out?.total_logs_recolhidos ?? 0}` +
                      (totalLogsPreferidos === null
                        ? ""
                        : `\n[${doneStamp}] Logs (${scanLogsRdp ? "rdp" : "seguranca"}) disponíveis: ${totalLogsPreferidos}`),
                  );
                  await loadAllData();
                  if (selectedInventarioId) {
                    await refreshAtivos(selectedInventarioId, ativoPesquisa);
                  }
                  setStatus({ type: "ok", message: "Scan concluído com sucesso." });
                  try {
                    await api.registarHistorico({
                      acao: "painel",
                      descricao: "Scan de rede concluído com sucesso.",
                    });
                  } catch {
                    /* não bloquear */
                  }
                  // A password explicita nao deve ficar presa no estado depois de uma execucao bem sucedida.
                  if (temCredRede) setScanPass("");
                  const sugestaoCredenciais = !temCredRede && heuristicaScanSemWmiCompleto(out);
                  return { ok: true, sugestaoCredenciais };
                } catch (error) {
                  if (error?.name === "AbortError") {
                    const cStamp = new Date().toLocaleTimeString("pt-PT", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });
                    setScanInfo((prev) =>
                      `${prev ? `${prev}\n` : ""}[${cStamp}] Resultado: scan cancelado (pedido interrompido).`,
                    );
                    setStatus({ type: "warn", message: "Scan cancelado." });
                    try {
                      if (selectedInventarioId) {
                        await refreshAtivos(selectedInventarioId, ativoPesquisa);
                      }
                    } catch {
                      /* ignorar */
                    }
                    return { ok: false, cancelled: true };
                  }
                  const msg = error?.message || String(error);
                  setStatus({ type: "err", message: msg });
                  const errStamp = new Date().toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  setScanInfo((prev) => `${prev ? `${prev}\n` : ""}[${errStamp}] Erro: ${msg}`);
                  const sugestaoCredenciais = erroRespostaSugereCredenciaisDominio(msg) && !temCredRede;
                  return { ok: false, sugestaoCredenciais };
                }
              }}
              scanInfo={scanInfo}
              ativos={ativos}
              loading={loading}
            />
          )}

          {activeTab === "computadores" && (
            <ComputadoresPage
              isAdmin={isAdmin}
              computadorForm={computadorForm}
              setComputadorForm={setComputadorForm}
              inventarios={inventarios}
              localizacoes={localizacoes}
              utilizadores={utilizadores}
              onCreate={() =>
                withAction(
                  () => api.computadores.criar(payloadComputadorRegisto(computadorForm)),
                  "Computador criado",
                )
              }
              onUpdate={() =>
                withAction(
                  () =>
                    api.computadores.atualizar(computadorForm.id, payloadComputadorRegisto(computadorForm)),
                  "Computador atualizado",
                )
              }
              onPatch={() =>
                withAction(
                  () =>
                    api.computadores.patch(
                      computadorForm.id,
                      {
                        nome: computadorForm.nome?.trim() || undefined,
                        marca: computadorForm.marca?.trim() || undefined,
                        modelo: computadorForm.modelo?.trim() || undefined,
                        numero_serie: computadorForm.numero_serie?.trim() || undefined,
                        estado: computadorForm.estado?.trim() || undefined,
                        hostname: computadorForm.hostname?.trim() || undefined,
                        endereco_ip: computadorForm.endereco_ip?.trim() || undefined,
                        mac_address: computadorForm.mac_address?.trim() || undefined,
                        sistema_operativo: computadorForm.sistema_operativo?.trim() || undefined,
                      },
                    ),
                  "Computador atualizado parcial",
                )
              }
              onDeleteByForm={async () => {
                if (!window.confirm("Confirmar apagar computador?")) return false;
                return withAction(() => api.computadores.apagar(computadorForm.id), "Computador apagado");
              }}
              onCancel={() => setComputadorForm(emptyComputerForm())}
              computadores={computadores}
              ativosPorInventario={ativosPorInventario}
              loading={loading}
              onPick={(pc) =>
                setComputadorForm({
                  id: String(pc.id),
                  nome: pc.nome || "",
                  marca: pc.marca || "",
                  modelo: pc.modelo || "",
                  numero_serie: pc.numero_serie || "",
                  estado: pc.estado || "ativo",
                  inventario_id: String(pc.inventario_id || ""),
                  localizacao_id: String(pc.localizacao_id ?? ""),
                  utilizador_responsavel_id: String(pc.utilizador_responsavel_id ?? ""),
                  hostname: pc.hostname ?? "",
                  endereco_ip: pc.endereco_ip ?? "",
                  mac_address: pc.mac_address ?? "",
                  sistema_operativo: pc.sistema_operativo ?? "",
                })
              }
              onDeleteRow={(pc) =>
                window.confirm(`Confirmar apagar computador "${pc.nome}"?`)
                  ? withAction(() => api.computadores.apagar(pc.id), "Computador apagado")
                  : null
              }
              token={isAuthenticated ? "session" : ""}
              withPanelAction={withAction}
            />
          )}

          {/* Utilizadores e localizações */}
          {activeTab === "utilizadores" && (
            <UtilizadoresPage
              isAdmin={isAdmin}
              utilizadorForm={utilizadorForm}
              setUtilizadorForm={setUtilizadorForm}
              perfis={perfis}
              onCreate={(extra = {}) =>
                withAction(
                  () => {
                    const { id: _id, ...dados } = utilizadorForm;
                    return api.utilizadores.criar({
                      ...dados,
                      ...extra,
                      perfil_id: Number(utilizadorForm.perfil_id),
                    });
                  },
                  "Utilizador criado",
                )
              }
              onUpdate={(extra = {}) =>
                withAction(
                  () =>
                    api.utilizadores.atualizar(utilizadorForm.id, {
                      nome: utilizadorForm.nome,
                      username: utilizadorForm.username,
                      email: extra.email ?? utilizadorForm.email,
                      perfil_id: Number(utilizadorForm.perfil_id),
                      palavra_passe: utilizadorForm.palavra_passe || undefined,
                    }),
                  "Utilizador atualizado",
                )
              }
              onDeleteByForm={async () => {
                if (!window.confirm("Confirmar apagar utilizador?")) return false;
                const alvoId = utilizadorForm.id;
                const apagarPropriaConta = String(alvoId) === String(user?.id);
                const ok = await withAction(
                  () => api.utilizadores.apagar(alvoId),
                  "Utilizador apagado",
                  {
                    onSuccess: () => removerUtilizadorDoEstado(alvoId),
                  },
                );
                if (ok && apagarPropriaConta) {
                  handleLogout();
                }
                return ok;
              }}
              onCancel={() => setUtilizadorForm(emptyUserForm())}
              utilizadores={utilizadores}
              loading={loading}
              onPick={(u) =>
                setUtilizadorForm({
                  id: String(u.id),
                  nome: u.nome || "",
                  username: u.username || "",
                  email: u.email || "",
                  perfil_id: String(u.perfil_id || ""),
                  palavra_passe: "",
                })
              }
              onDeleteRow={async (u) => {
                if (!window.confirm(`Confirmar apagar utilizador "${u.username}"?`)) return;
                const apagarPropriaConta = String(u.id) === String(user?.id);
                const ok = await withAction(
                  () => api.utilizadores.apagar(u.id),
                  "Utilizador apagado",
                  {
                    onSuccess: () => removerUtilizadorDoEstado(u.id),
                  },
                );
                if (ok && apagarPropriaConta) {
                  handleLogout();
                }
              }}
            />
          )}

          {activeTab === "localizacoes" && (
            <LocalizacoesPage
              isAdmin={isAdmin}
              localizacaoForm={localizacaoForm}
              setLocalizacaoForm={setLocalizacaoForm}
              onCreate={() =>
                withAction(
                  () =>
                    api.localizacoes.criar(
                      {
                        nome: localizacaoForm.nome,
                        descricao: localizacaoForm.descricao || null,
                      },
                    ),
                  "Localizacao criada",
                )
              }
              onUpdate={() =>
                withAction(
                  () =>
                    api.localizacoes.atualizar(
                      localizacaoForm.id,
                      {
                        nome: localizacaoForm.nome,
                        descricao: localizacaoForm.descricao || null,
                      },
                    ),
                  "Localizacao atualizada",
                )
              }
              onDeleteByForm={async () => {
                if (!window.confirm("Confirmar apagar localizacao?")) return false;
                return withAction(() => api.localizacoes.apagar(localizacaoForm.id), "Localizacao apagada");
              }}
              onCancel={() => setLocalizacaoForm({ id: "", nome: "", descricao: "" })}
              localizacoes={localizacoes}
              loading={loading}
              onPick={(l) =>
                setLocalizacaoForm({
                  id: String(l.id),
                  nome: l.nome || "",
                  descricao: l.descricao || "",
                })
              }
              onDeleteRow={(l) =>
                window.confirm(`Confirmar apagar localizacao "${l.nome}"?`)
                  ? withAction(() => api.localizacoes.apagar(l.id), "Localizacao apagada")
                  : null
              }
            />
          )}

          {/* Pesquisa global e logs */}
          {activeTab === "pesquisa" && (
            <PesquisaPage
              globalTermo={globalTermo}
              setGlobalTermo={setGlobalTermo}
              onPesquisar={async () => {
                // Guardamos a resposta crua em JSON para a pagina decidir parse, filtros e apresentacao.
                setActionLoading(true);
                try {
                  const data = await api.pesquisa.global(globalTermo);
                  setGlobalOutput(JSON.stringify(data, null, 2));
                } catch (error) {
                  setGlobalOutput(JSON.stringify({ erro: error.message }, null, 2));
                } finally {
                  setActionLoading(false);
                }
              }}
              globalOutput={globalOutput}
              loading={actionLoading}
              searchRequestId={globalSearchRequestId}
              localizacoesBase={localizacoes}
              computadoresBase={computadores}
              inventariosBase={inventarios}
              utilizadoresBase={utilizadores}
              ativosPorInventarioBase={ativosPorInventario}
            />
          )}

          {activeTab === "logs" && (
            <LogsPage
              inventarios={inventarios}
              selectedInventarioId={selectedInventarioId}
              logComputadorParams={logComputadorParams}
              setLogComputadorParams={setLogComputadorParams}
              onLogsComputador={async (paramsOverride = null) => {
                // Logs por computador usam apenas os filtros realmente preenchidos pelo utilizador.
                setActionLoading(true);
                try {
                  const query = limparQueryVazia(paramsOverride || logComputadorParams);
                  const temIdentificador =
                    query.computador_id || query.nome || query.numero_serie || query.hostname;
                  if (!temIdentificador) {
                    throw new Error("Escolhe um tipo de procura e escreve o valor para consultar logs");
                  }
                  const data = await api.logs.porComputador(query);
                  setLogsOutput(JSON.stringify(data, null, 2));
                  return true;
                } catch (error) {
                  setLogsOutput(JSON.stringify({ erro: error.message }, null, 2));
                  return false;
                } finally {
                  setActionLoading(false);
                }
              }}
              logInventarioParams={logInventarioParams}
              setLogInventarioParams={setLogInventarioParams}
              onLogsInventario={async ({ tiposSelecionados = [], credenciais = {} } = {}) => {
                // A recolha em lote depende do inventario ativo e de credenciais de rede validas.
                setActionLoading(true);
                try {
                  const invId = logInventarioParams.inventario_id || selectedInventarioId;
                  if (!invId) {
                    throw new Error("Seleciona um inventário ou define um inventário ativo na área Scan");
                  }
                  const utilizador = String(credenciais?.utilizador || "").trim();
                  const password = String(credenciais?.password || "");
                  if (!utilizador || !password) {
                    throw new Error("Credenciais de rede obrigatórias para recolher logs");
                  }
                  const payload = {
                    utilizador,
                    password,
                  };
                  const dispositivoId = logInventarioParams.dispositivo_id;
                  if (dispositivoId) {
                    payload.dispositivo_id = Number(dispositivoId);
                  }
                  if (Array.isArray(tiposSelecionados) && tiposSelecionados.length === 1) {
                    payload.tipo_log = tiposSelecionados[0];
                  }
                  const data = await api.inventarios.recolherLogsDispositivos(invId, payload);
                  setLogsOutput(JSON.stringify(data, null, 2));
                  return true;
                } catch (error) {
                  const mensagem =
                    typeof error?.message === "string"
                      ? error.message
                      : typeof error === "string"
                        ? error
                        : "Erro ao consultar logs";
                  setLogsOutput(JSON.stringify({ erro: mensagem }, null, 2));
                  return false;
                } finally {
                  setActionLoading(false);
                }
              }}
              logsOutput={logsOutput}
              loading={loading}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

