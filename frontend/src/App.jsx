/* Comentario geral deste ficheiro: orquestra estado global e navegacao entre paginas. */

import { useEffect, useMemo, useState } from "react";
import { api, getApiBase, setApiBase } from "./api";
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
import PesquisaPage from "./pages/PesquisaPage";
import UtilizadoresPage from "./pages/UtilizadoresPage";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "inventarios", label: "Inventarios" },
  { id: "ativos", label: "Ativos + Scan" },
  { id: "computadores", label: "Computadores" },
  { id: "utilizadores", label: "Utilizadores" },
  { id: "perfis", label: "Perfis" },
  { id: "localizacoes", label: "Localizacoes" },
  { id: "pesquisa", label: "Pesquisa Global" },
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
  };
}

function emptyUserForm() {
  return { id: "", nome: "", username: "", email: "", perfil_id: "", palavra_passe: "" };
}

function emptyInventarioForm() {
  return { id: "", nome: "", tipo_inventario: "normal", ip_rede: "", descricao: "" };
}

export default function App() {
  const [apiBaseInput, setApiBaseInput] = useState(getApiBase());
  const [status, setStatus] = useState({ type: "ok", message: "Pronto" });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [token, setToken] = useState(localStorage.getItem("access_token") || "");
  const [user, setUser] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [inventarios, setInventarios] = useState([]);
  const [computadores, setComputadores] = useState([]);
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
  const [scanInfo, setScanInfo] = useState("");
  const [ativoPesquisa, setAtivoPesquisa] = useState("");

  const [globalTermo, setGlobalTermo] = useState("");
  const [globalOutput, setGlobalOutput] = useState("Escreve um termo para pesquisar.");
  const [logsOutput, setLogsOutput] = useState("Seleciona filtros para consultar logs.");

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
    return String(nomePerfil).toLowerCase().includes("admin") || user?.is_admin === true;
  }, [user]);

  async function loadAllData(currentToken) {
    const tk = currentToken || token;
    if (!tk) return;
    setDataLoading(true);
    try {
      const [inventariosData, computadoresData, utilizadoresData, perfisData, localizacoesData] =
        await Promise.all([
          api.inventarios.listar(tk),
          api.computadores.listar(tk),
          api.utilizadores.listar(tk),
          api.perfis.listar(tk),
          api.localizacoes.listar(tk),
        ]);
      setInventarios(inventariosData || []);
      setComputadores(computadoresData || []);
      setUtilizadores(utilizadoresData || []);
      setPerfis(perfisData || []);
      setLocalizacoes(localizacoesData || []);
      const firstId = (inventariosData || [])[0]?.id;
      setSelectedInventarioId((prev) => prev || String(firstId || ""));
    } finally {
      setDataLoading(false);
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
    setUtilizadores([]);
    setPerfis([]);
    setLocalizacoes([]);
    setAtivos([]);
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
    } catch (error) {
      setStatus({ type: "err", message: error.message });
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    async function bootstrap() {
      if (!token) return;
      try {
        const me = await api.me(token);
        setUser(me);
        await loadAllData(token);
      } catch {
        localStorage.removeItem("access_token");
        setToken("");
      }
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (token && selectedInventarioId) {
      refreshAtivos(selectedInventarioId).catch(() =>
        setStatus({ type: "warn", message: "Falha ao carregar ativos" }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInventarioId, token]);

  const loading = dataLoading || actionLoading;

  if (!token) {
    return (
      <main className="auth-screen">
        <form className="auth-card" onSubmit={handleLogin}>
          <h1>Inventario Informatico</h1>
          <p>Login para aceder ao painel React.</p>
          <input name="identificador" placeholder="Username ou email" required />
          <input name="password" type="password" placeholder="Palavra-passe" required />
          <button type="submit">{actionLoading ? "A entrar..." : "Entrar"}</button>
          <StatusAlert type={status.type} message={status.message} />
        </form>
      </main>
    );
  }

  return (
    <div className="app">
      <Topbar user={user} isAdmin={isAdmin} onLogout={handleLogout} />

      <section className="api-row">
        <input value={apiBaseInput} onChange={(e) => setApiBaseInput(e.target.value)} />
        <button
          onClick={() => {
            setApiBase(apiBaseInput.trim());
            setStatus({ type: "ok", message: "API Base guardada" });
          }}
        >
          Guardar API Base
        </button>
        <button
          className="ghost"
          onClick={async () => {
            const ok = await api.health().catch(() => false);
            setStatus({ type: ok ? "ok" : "err", message: ok ? "API online" : "API indisponivel" });
          }}
        >
          Testar API
        </button>
      </section>

      <div className="layout">
        <SidebarNav tabs={TABS} activeTab={activeTab} onSelect={setActiveTab} />

        <main className="content">
          <StatusAlert type={status.type} message={status.message} />

          {activeTab === "dashboard" && (
            <DashboardPage
              inventarios={inventarios}
              computadores={computadores}
              utilizadores={utilizadores}
              localizacoes={localizacoes}
              loading={loading}
            />
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
                  () =>
                    api.inventarios.criar(
                      {
                        nome: inventarioForm.nome.trim(),
                        tipo_inventario: inventarioForm.tipo_inventario,
                        ip_rede: inventarioForm.ip_rede.trim() || null,
                        descricao: inventarioForm.descricao.trim() || null,
                      },
                      token,
                    ),
                  "Inventario criado",
                )
              }
              onUpdate={() =>
                withAction(
                  () =>
                    api.inventarios.atualizar(
                      inventarioForm.id,
                      {
                        nome: inventarioForm.nome.trim(),
                        tipo_inventario: inventarioForm.tipo_inventario,
                        ip_rede: inventarioForm.ip_rede.trim() || null,
                        descricao: inventarioForm.descricao.trim() || null,
                      },
                      token,
                    ),
                  "Inventario atualizado",
                )
              }
              onDelete={(inv) => {
                const id = inv?.id || inventarioForm.id;
                if (!window.confirm("Confirmar apagar inventario?")) return;
                withAction(() => api.inventarios.apagar(id, token), "Inventario apagado");
              }}
              onSelectInventario={(inv) => {
                setSelectedInventarioId(String(inv.id));
                setInventarioForm({
                  id: String(inv.id),
                  nome: inv.nome || "",
                  tipo_inventario: inv.tipo_inventario || "normal",
                  ip_rede: inv.ip_rede || "",
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
              onPesquisar={() =>
                refreshAtivos(selectedInventarioId, ativoPesquisa).catch((err) =>
                  setStatus({ type: "err", message: err.message }),
                )
              }
              onRecarregar={() =>
                refreshAtivos(selectedInventarioId).catch((err) =>
                  setStatus({ type: "err", message: err.message }),
                )
              }
              isAdmin={isAdmin}
              scanRede={scanRede}
              setScanRede={setScanRede}
              scanUser={scanUser}
              setScanUser={setScanUser}
              scanPass={scanPass}
              setScanPass={setScanPass}
              onScan={() =>
                withAction(
                  async () => {
                    const out = await api.inventarios.scan(
                      selectedInventarioId,
                      {
                        rede: scanRede.trim() || null,
                        utilizador: scanUser.trim(),
                        password: scanPass,
                      },
                      token,
                    );
                    setScanInfo(
                      `Scan OK: ${out?.total_dispositivos_encontrados ?? 0} dispositivos, ${out?.total_logs_recolhidos ?? 0} logs`,
                    );
                  },
                  "Scan executado",
                )
              }
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
                  () =>
                    api.computadores.criar(
                      {
                        ...computadorForm,
                        inventario_id: Number(computadorForm.inventario_id),
                        localizacao_id: computadorForm.localizacao_id
                          ? Number(computadorForm.localizacao_id)
                          : null,
                        utilizador_responsavel_id: computadorForm.utilizador_responsavel_id
                          ? Number(computadorForm.utilizador_responsavel_id)
                          : null,
                      },
                      token,
                    ),
                  "Computador criado",
                )
              }
              onUpdate={() =>
                withAction(
                  () =>
                    api.computadores.atualizar(
                      computadorForm.id,
                      {
                        ...computadorForm,
                        inventario_id: Number(computadorForm.inventario_id),
                        localizacao_id: computadorForm.localizacao_id
                          ? Number(computadorForm.localizacao_id)
                          : null,
                        utilizador_responsavel_id: computadorForm.utilizador_responsavel_id
                          ? Number(computadorForm.utilizador_responsavel_id)
                          : null,
                      },
                      token,
                    ),
                  "Computador atualizado",
                )
              }
              onPatch={() =>
                withAction(
                  () =>
                    api.computadores.patch(
                      computadorForm.id,
                      {
                        nome: computadorForm.nome || undefined,
                        marca: computadorForm.marca || undefined,
                        modelo: computadorForm.modelo || undefined,
                        numero_serie: computadorForm.numero_serie || undefined,
                        estado: computadorForm.estado || undefined,
                      },
                      token,
                    ),
                  "Computador atualizado parcial",
                )
              }
              onDeleteByForm={() =>
                window.confirm("Confirmar apagar computador?")
                  ? withAction(
                      () => api.computadores.apagar(computadorForm.id, token),
                      "Computador apagado",
                    )
                  : null
              }
              onCancel={() => setComputadorForm(emptyComputerForm())}
              computadores={computadores}
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
                  localizacao_id: String(pc.localizacao_id || ""),
                  utilizador_responsavel_id: String(pc.utilizador_responsavel_id || ""),
                })
              }
              onDeleteRow={(pc) =>
                window.confirm(`Confirmar apagar computador "${pc.nome}"?`)
                  ? withAction(() => api.computadores.apagar(pc.id, token), "Computador apagado")
                  : null
              }
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
              onDeleteByForm={() => {
                if (!window.confirm("Confirmar apagar utilizador?")) return;
                withAction(() => api.utilizadores.apagar(utilizadorForm.id, token), "Utilizador apagado");
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
              onDeleteByForm={() =>
                window.confirm("Confirmar apagar perfil?")
                  ? withAction(() => api.perfis.apagar(perfilForm.id, token), "Perfil apagado")
                  : null
              }
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
              onDeleteByForm={() =>
                window.confirm("Confirmar apagar localizacao?")
                  ? withAction(
                      () => api.localizacoes.apagar(localizacaoForm.id, token),
                      "Localizacao apagada",
                    )
                  : null
              }
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
              loading={loading}
            />
          )}

          {activeTab === "logs" && (
            <LogsPage
              logComputadorParams={logComputadorParams}
              setLogComputadorParams={setLogComputadorParams}
              onLogsComputador={async () => {
                setActionLoading(true);
                try {
                  const data = await api.logs.porComputador(logComputadorParams, token);
                  setLogsOutput(JSON.stringify(data, null, 2));
                } catch (error) {
                  setLogsOutput(JSON.stringify({ erro: error.message }, null, 2));
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
                } catch (error) {
                  setLogsOutput(JSON.stringify({ erro: error.message }, null, 2));
                } finally {
                  setActionLoading(false);
                }
              }}
              logsOutput={logsOutput}
              loading={loading}
            />
          )}
        </main>
      </div>
    </div>
  );
}

