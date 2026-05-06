/* Comentario geral deste ficheiro: orquestra estado global e navegacao entre paginas. */

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
import PerfisPage from "./pages/PerfisPage";
import HistoricoContaPage from "./pages/HistoricoContaPage";
import PesquisaPage from "./pages/PesquisaPage";
import UtilizadoresPage from "./pages/UtilizadoresPage";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "inventarios", label: "Inventários" },
  { id: "ativos", label: "Scan" },
  { id: "computadores", label: "Computadores" },
  { id: "utilizadores", label: "Utilizadores" },
  { id: "perfis", label: "Perfis" },
  { id: "localizacoes", label: "Localizações" },
  { id: "pesquisa", label: "Pesquisa global" },
  { id: "historico-conta", label: "Histórico" },
  { id: "logs", label: "Logs" },
];

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

function payloadComputadorRegisto(form) {
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

function emptyUserForm() {
  return { id: "", nome: "", username: "", email: "", perfil_id: "", palavra_passe: "" };
}

function emptyInventarioForm() {
  return { id: "", nome: "", tipo_inventario: "normal", ip_rede: "", descricao: "" };
}

function parseIPv4(ip) {
  const txt = String(ip || "").trim();
  const parts = txt.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return nums;
}

function compareIPv4(a, b) {
  for (let i = 0; i < 4; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function normalizarRedeScan(rawValue) {
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

export default function App() {
  const theme = useTheme();
  const isMobileNav = useMediaQuery(theme.breakpoints.down("lg"));
  const [status, setStatus] = useState({ type: "ok", message: "" });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("access_token") || "");
  const [user, setUser] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [inventarios, setInventarios] = useState([]);
  const [computadores, setComputadores] = useState([]);
  const [ativosPorInventario, setAtivosPorInventario] = useState([]);
  const [utilizadores, setUtilizadores] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [localizacoes, setLocalizacoes] = useState([]);
  const [ativos, setAtivos] = useState([]);

  const [selectedInventarioId, setSelectedInventarioId] = useState("");
  const [inventarioForm, setInventarioForm] = useState(emptyInventarioForm());
  const [computadorForm, setComputadorForm] = useState(emptyComputerForm());
  const [utilizadorForm, setUtilizadorForm] = useState(emptyUserForm());
  const [perfilForm, setPerfilForm] = useState({ id: "", nome: "" });
  const [localizacaoForm, setLocalizacaoForm] = useState({ id: "", nome: "", descricao: "" });

  const [scanRede, setScanRede] = useState("");
  const [scanUser, setScanUser] = useState("");
  const [scanPass, setScanPass] = useState("");
  const [scanLogsRdp, setScanLogsRdp] = useState(true);
  const [scanLogsSeguranca, setScanLogsSeguranca] = useState(true);
  const [scanInfo, setScanInfo] = useState("");
  const [ativoPesquisa, setAtivoPesquisa] = useState("");

  const [globalTermo, setGlobalTermo] = useState("");
  const [globalOutput, setGlobalOutput] = useState("");
  const [globalSearchRequestId, setGlobalSearchRequestId] = useState(0);
  const [logsOutput, setLogsOutput] = useState("Seleciona filtros para consultar logs.");
  const [historicoConta, setHistoricoConta] = useState([]);
  const lastInventarioIdForScanRef = useRef("");

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
    tipo_log: "",
    coletar_agora: "false",
  });

  const isAdmin = useMemo(() => {
    const nomePerfil =
      user?.perfil_nome || user?.perfil || user?.perfil_nome_utilizador || user?.role || "";
    return isAdminProfileName(nomePerfil) || user?.is_admin === true;
  }, [user]);

  async function loadAllData(currentToken, options = {}) {
    const tk = currentToken || token;
    if (!tk) return;
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
        historicoData,
      ] = await Promise.all([
        api.inventarios.listar(tk),
        api.computadores.listar(tk),
        api.utilizadores.listar(tk),
        api.perfis.listar(tk),
        api.localizacoes.listar(tk),
        api.inventarios.ativosPorInventario(tk),
        api.historicoMeu(tk),
      ]);
      setInventarios(inventariosData || []);
      setComputadores(computadoresData || []);
      setAtivosPorInventario(ativosGruposData || []);
      setUtilizadores(utilizadoresData || []);
      setPerfis(perfisData || []);
      setLocalizacoes(localizacoesData || []);
      setHistoricoConta(Array.isArray(historicoData?.itens) ? historicoData.itens : []);
      const firstId = (inventariosData || [])[0]?.id;
      setSelectedInventarioId((prev) => prev || String(firstId || ""));
    } finally {
      if (!silent) setDataLoading(false);
    }
  }

  async function refreshAtivos(invId, searchTerm = "") {
    if (!invId) {
      setAtivos([]);
      return;
    }
    const inv = String(invId);
    setActionLoading(true);
    try {
      if (searchTerm) {
        const data = await api.inventarios.pesquisarAtivos(inv, searchTerm, token);
        const all = [...(data?.computadores || []), ...(data?.dispositivos_descobertos || [])];
        setAtivos(all);
        return;
      }
      const data = await api.inventarios.ativos(inv, token);
      setAtivos(data || []);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setActionLoading(true);
    try {
      const res = await api.login(formData.get("identificador"), formData.get("password"));
      const accessToken = res?.access_token;
      if (!accessToken) throw new Error("Token nao recebido no login");
      localStorage.setItem("access_token", accessToken);
      setToken(accessToken);
      const me = await api.me(accessToken);
      setUser(me);
      await loadAllData(accessToken);
      setStatus({ type: "ok", message: "Sessao iniciada com sucesso" });
    } catch (error) {
      setStatus({ type: "err", message: `Erro no login: ${error.message}` });
    } finally {
      setActionLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    setToken("");
    setUser(null);
    setInventarios([]);
    setComputadores([]);
    setAtivosPorInventario([]);
    setUtilizadores([]);
    setPerfis([]);
    setLocalizacoes([]);
    setAtivos([]);
    setHistoricoConta([]);
    setStatus({ type: "ok", message: "Sessao terminada" });
  }

  async function withAction(action, successMessage) {
    setActionLoading(true);
    try {
      await action();
      await loadAllData();
      if (selectedInventarioId) {
        await refreshAtivos(selectedInventarioId, ativoPesquisa);
      }
      setStatus({ type: "ok", message: successMessage });
      const tk = token || localStorage.getItem("access_token");
      if (tk && successMessage) {
        try {
          await api.registarHistorico(
            {
              acao: "painel",
              descricao: String(successMessage).slice(0, 3900),
            },
            tk,
          );
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

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const me = await api.me(token);
        setUser(me);
        await loadAllData(token);
      } catch {
        localStorage.removeItem("access_token");
        setToken("");
        setUser(null);
      }
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (token && selectedInventarioId) {
      refreshAtivos(selectedInventarioId).catch(() =>
        setStatus({ type: "warn", message: "Falha ao carregar ativos" }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInventarioId, token]);

  useEffect(() => {
    const invId = String(selectedInventarioId || "");
    if (!invId || lastInventarioIdForScanRef.current === invId) return;
    lastInventarioIdForScanRef.current = invId;
    const inv = (inventarios || []).find((x) => String(x.id) === invId);
    const redePadrao = String(inv?.rede || inv?.ip_rede || "").trim();
    setScanRede(redePadrao);
  }, [selectedInventarioId, inventarios]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  useEffect(() => {
    if (!token || activeTab !== "dashboard") return undefined;
    const timer = setInterval(() => {
      loadAllData(token, { silent: true }).catch(() => {
        /* atualização automática opcional; falhas pontuais não devem quebrar UI */
      });
    }, 30000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeTab]);

  const loading = dataLoading || actionLoading;

  function handleSelectTab(tabId) {
    setActiveTab(tabId);
    if (isMobileNav) setMobileNavOpen(false);
  }

  if (!token) {
    return (
      <main className="auth-screen">
        <form className="auth-card" onSubmit={handleLogin}>
          <div className="brand-mini">
            <span className="topbar-logo" aria-hidden style={{ width: 40, height: 40 }}>
              <span className="material-symbols-outlined">inventory_2</span>
            </span>
            <div>
              <h1>Inventario IT</h1>
              <p>Entrar no painel de gestao.</p>
            </div>
          </div>
          <input name="identificador" placeholder="Username ou email" required autoComplete="username" />
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

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
        p: { xs: 1, md: 1.5 },
        gap: { xs: 1, md: 1.5 },
      }}
    >
      <SidebarNav
        tabs={TABS}
        activeTab={activeTab}
        onSelect={handleSelectTab}
        mobile={isMobileNav}
        open={isMobileNav ? mobileNavOpen : true}
        onClose={() => setMobileNavOpen(false)}
      />

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
        <Topbar
          user={user}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          onNavigate={handleSelectTab}
          showNavToggle={isMobileNav}
          onToggleNav={() => setMobileNavOpen(true)}
          onSearch={(q) => {
            setGlobalTermo(q);
            handleSelectTab("pesquisa");
            setGlobalSearchRequestId((n) => n + 1);
          }}
        />

        <main className="content" style={{ marginTop: 0, width: "100%" }}>
          <StatusAlert type={status.type} message={status.message} />

          {activeTab === "dashboard" && (
            <DashboardPage
              inventarios={inventarios}
              computadores={computadores}
              ativosPorInventario={ativosPorInventario}
              utilizadores={utilizadores}
              localizacoes={localizacoes}
              historicoConta={historicoConta}
              loading={loading}
              onNavigate={handleSelectTab}
              onOpenHistorico={() => handleSelectTab("historico-conta")}
            />
          )}

          {activeTab === "historico-conta" && (
            <HistoricoContaPage token={token} active={activeTab === "historico-conta"} user={user} />
          )}

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
                      token,
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
                      token,
                    );
                  },
                  "Inventario atualizado",
                )
              }
              onCancel={() => setInventarioForm(emptyInventarioForm())}
              onDeleteByForm={async () => {
                if (!window.confirm("Confirmar apagar inventario?")) return false;
                return withAction(() => api.inventarios.apagar(inventarioForm.id, token), "Inventario apagado");
              }}
              onDeleteRow={(inv) => {
                if (!window.confirm("Confirmar apagar inventario?")) return;
                withAction(() => api.inventarios.apagar(inv.id, token), "Inventario apagado");
              }}
              onSelectInventario={(inv) => {
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
                setActionLoading(true);
                try {
                  const created = await api.inventarios.criar(payload, token);
                  await loadAllData();
                  const createdId = created?.id ?? created?.inventario_id ?? null;
                  if (createdId) {
                    setSelectedInventarioId(String(createdId));
                  }
                  setStatus({ type: "ok", message: "Inventário criado para scan" });
                  const tk = token || localStorage.getItem("access_token");
                  if (tk) {
                    try {
                      await api.registarHistorico(
                        {
                          acao: "painel",
                          descricao: "Inventário criado a partir do fluxo de scan.",
                        },
                        tk,
                      );
                    } catch {
                      /* não bloquear operação por falha de auditoria */
                    }
                  }
                  return createdId;
                } catch (err) {
                  setStatus({ type: "err", message: err.message });
                  return null;
                } finally {
                  setActionLoading(false);
                }
              }}
              onScan={async () => {
                if (!selectedInventarioId) {
                  setStatus({ type: "err", message: "Seleciona um inventário para executar o scan" });
                  return false;
                }
                const inventarioSelecionado = (inventarios || []).find(
                  (inv) => String(inv.id) === String(selectedInventarioId),
                );
                if (inventarioSelecionado?.tipo_inventario !== "sub_rede") {
                  setStatus({ type: "err", message: "O scan só está disponível para inventários do tipo Rede (sub-rede)" });
                  return false;
                }
                if (!scanUser.trim() || !scanPass) {
                  setStatus({ type: "err", message: "Indica as credenciais da rede para iniciar o scan" });
                  return false;
                }
                const redeNormalizada = normalizarRedeScan(scanRede);
                if (!redeNormalizada.ok) {
                  setStatus({ type: "err", message: redeNormalizada.message });
                  return false;
                }
                const userCred = scanUser.trim();
                const stamp = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
                const alvoRede = redeNormalizada.label;
                const logsEscolhidos = [];
                if (scanLogsRdp) logsEscolhidos.push("RDP");
                if (scanLogsSeguranca) logsEscolhidos.push("Segurança");
                const modoLogsLabel = logsEscolhidos.length ? logsEscolhidos.join(" + ") : "Nenhum selecionado";
                setScanInfo(
                  `[${stamp}] Iniciar scan...\n` +
                    `[${stamp}] Inventário: ${selectedInventarioId || "não definido"}\n` +
                    `[${stamp}] Alvo: ${alvoRede}\n` +
                    `[${stamp}] Logs pedidos: ${modoLogsLabel}\n` +
                    `[${stamp}] Utilizador: ${userCred || "não definido"}\n` +
                    `[${stamp}] Estado: em execução`,
                );
                const ok = await withAction(
                  async () => {
                    const out = await api.inventarios.scan(
                      selectedInventarioId,
                      {
                        rede: redeNormalizada.rede,
                        utilizador: userCred,
                        password: scanPass,
                      },
                      token,
                    );
                    let totalLogsPreferidos = null;
                    if (scanLogsRdp !== scanLogsSeguranca) {
                      const tipoLog = scanLogsRdp ? "rdp" : "seguranca";
                      try {
                        const consulta = await api.inventarios.logsDispositivos(
                          selectedInventarioId,
                          { coletar_agora: "false", tipo_log: tipoLog },
                          token,
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
                  },
                  "Scan iniciado com sucesso.",
                );
                if (!ok) {
                  const errStamp = new Date().toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                  setScanInfo((prev) => `${prev ? `${prev}\n` : ""}[${errStamp}] Resultado: erro ao executar scan`);
                }
                setScanPass("");
                return ok;
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
                  () => api.computadores.criar(payloadComputadorRegisto(computadorForm), token),
                  "Computador criado",
                )
              }
              onUpdate={() =>
                withAction(
                  () =>
                    api.computadores.atualizar(computadorForm.id, payloadComputadorRegisto(computadorForm), token),
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
                      token,
                    ),
                  "Computador atualizado parcial",
                )
              }
              onDeleteByForm={async () => {
                if (!window.confirm("Confirmar apagar computador?")) return false;
                return withAction(() => api.computadores.apagar(computadorForm.id, token), "Computador apagado");
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
                  ? withAction(() => api.computadores.apagar(pc.id, token), "Computador apagado")
                  : null
              }
              token={token}
              withPanelAction={withAction}
            />
          )}

          {activeTab === "utilizadores" && (
            <UtilizadoresPage
              isAdmin={isAdmin}
              utilizadorForm={utilizadorForm}
              setUtilizadorForm={setUtilizadorForm}
              perfis={perfis}
              onCreate={() =>
                withAction(
                  () =>
                    api.utilizadores.criar(
                      { ...utilizadorForm, perfil_id: Number(utilizadorForm.perfil_id) },
                      token,
                    ),
                  "Utilizador criado",
                )
              }
              onUpdate={() =>
                withAction(
                  () =>
                    api.utilizadores.atualizar(
                      utilizadorForm.id,
                      {
                        nome: utilizadorForm.nome,
                        username: utilizadorForm.username,
                        email: utilizadorForm.email,
                        perfil_id: Number(utilizadorForm.perfil_id),
                        palavra_passe: utilizadorForm.palavra_passe || undefined,
                      },
                      token,
                    ),
                  "Utilizador atualizado",
                )
              }
              onDeleteByForm={async () => {
                if (!window.confirm("Confirmar apagar utilizador?")) return false;
                return withAction(
                  () => api.utilizadores.apagar(utilizadorForm.id, token),
                  "Utilizador apagado",
                );
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
              onDeleteRow={(u) => {
                if (!window.confirm(`Confirmar apagar utilizador "${u.username}"?`)) return;
                withAction(() => api.utilizadores.apagar(u.id, token), "Utilizador apagado");
              }}
            />
          )}

          {activeTab === "perfis" && (
            <PerfisPage
              isAdmin={isAdmin}
              utilizadores={utilizadores}
              perfilForm={perfilForm}
              setPerfilForm={setPerfilForm}
              onCreate={() =>
                withAction(() => api.perfis.criar({ nome: perfilForm.nome }, token), "Perfil criado")
              }
              onUpdate={() =>
                withAction(
                  () => api.perfis.atualizar(perfilForm.id, { nome: perfilForm.nome }, token),
                  "Perfil atualizado",
                )
              }
              onDeleteByForm={async () => {
                if (!window.confirm("Confirmar apagar perfil?")) return false;
                return withAction(() => api.perfis.apagar(perfilForm.id, token), "Perfil apagado");
              }}
              onCancel={() => setPerfilForm({ id: "", nome: "" })}
              perfis={perfis}
              loading={loading}
              onPick={(p) => setPerfilForm({ id: String(p.id), nome: p.nome || "" })}
              onDeleteRow={(p) =>
                window.confirm(`Confirmar apagar perfil "${p.nome}"?`)
                  ? withAction(() => api.perfis.apagar(p.id, token), "Perfil apagado")
                  : null
              }
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
                      token,
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
                      token,
                    ),
                  "Localizacao atualizada",
                )
              }
              onDeleteByForm={async () => {
                if (!window.confirm("Confirmar apagar localizacao?")) return false;
                return withAction(() => api.localizacoes.apagar(localizacaoForm.id, token), "Localizacao apagada");
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
                  ? withAction(() => api.localizacoes.apagar(l.id, token), "Localizacao apagada")
                  : null
              }
            />
          )}

          {activeTab === "pesquisa" && (
            <PesquisaPage
              globalTermo={globalTermo}
              setGlobalTermo={setGlobalTermo}
              onPesquisar={async () => {
                setActionLoading(true);
                try {
                  const data = await api.pesquisa.global(globalTermo, token);
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
              onLogsComputador={async () => {
                setActionLoading(true);
                try {
                  const data = await api.logs.porComputador(logComputadorParams, token);
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
              onLogsInventario={async () => {
                setActionLoading(true);
                try {
                  const invId = logInventarioParams.inventario_id || selectedInventarioId;
                  const query = { ...logInventarioParams };
                  delete query.inventario_id;
                  const data = await api.inventarios.logsDispositivos(invId, query, token);
                  setLogsOutput(JSON.stringify(data, null, 2));
                  return true;
                } catch (error) {
                  setLogsOutput(JSON.stringify({ erro: error.message }, null, 2));
                  return false;
                } finally {
                  setActionLoading(false);
                }
              }}
              logsOutput={logsOutput}
              loading={loading}
            />
          )}
        </main>
      </Box>
    </Box>
  );
}

