/* Comentario geral deste ficheiro: contem partes importantes da interface e comportamento. */

import { useEffect, useMemo, useState } from "react";
import { api, getApiBase, setApiBase } from "./api";

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
  }

  async function refreshAtivos(invId, searchTerm = "") {
    if (!invId) {
      setAtivos([]);
      return;
    }
    const inv = String(invId);
    if (searchTerm) {
      const data = await api.inventarios.pesquisarAtivos(inv, searchTerm, token);
      const all = [...(data?.computadores || []), ...(data?.dispositivos_descobertos || [])];
      setAtivos(all);
      return;
    }
    const data = await api.inventarios.ativos(inv, token);
    setAtivos(data || []);
  }

  async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
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
    try {
      await action();
      await loadAllData();
      if (selectedInventarioId) {
        await refreshAtivos(selectedInventarioId, ativoPesquisa);
      }
      setStatus({ type: "ok", message: successMessage });
    } catch (error) {
      setStatus({ type: "err", message: error.message });
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

  if (!token) {
    return (
      <main className="auth-screen">
        <form className="auth-card" onSubmit={handleLogin}>
          <h1>Inventario Informatico</h1>
          <p>Login para aceder ao painel React.</p>
          <input name="identificador" placeholder="Username ou email" required />
          <input name="password" type="password" placeholder="Palavra-passe" required />
          <button type="submit">Entrar</button>
          <p className={`status ${status.type}`}>{status.message}</p>
        </form>
      </main>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Inventario Informatico</h1>
          <p>Frontend React compatível com o backend FastAPI</p>
        </div>
        <div className="topbar-actions">
          <span className="badge">{user?.username || user?.email || "utilizador"}</span>
          <span className="badge">{isAdmin ? "Admin" : "Utilizador"}</span>
          <button className="ghost" onClick={handleLogout}>
            Terminar sessao
          </button>
        </div>
      </header>

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
        <aside className="sidebar">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "tab active" : "tab"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        <main className="content">
          <p className={`status ${status.type}`}>{status.message}</p>

          {activeTab === "dashboard" && (
            <section className="panel">
              <h2>Visao Geral</h2>
              <div className="kpis">
                <article><span>Inventarios</span><strong>{inventarios.length}</strong></article>
                <article><span>Computadores</span><strong>{computadores.length}</strong></article>
                <article><span>Utilizadores</span><strong>{utilizadores.length}</strong></article>
                <article><span>Localizacoes</span><strong>{localizacoes.length}</strong></article>
              </div>
            </section>
          )}

          {activeTab === "inventarios" && (
            <section className="panel">
              <h2>Inventarios</h2>
              {isAdmin && (
                <div className="grid">
                  <input
                    placeholder="ID (apenas para editar/apagar)"
                    value={inventarioForm.id}
                    onChange={(e) => setInventarioForm((p) => ({ ...p, id: e.target.value }))}
                  />
                  <input
                    placeholder="Nome"
                    value={inventarioForm.nome}
                    onChange={(e) => setInventarioForm((p) => ({ ...p, nome: e.target.value }))}
                  />
                  <select
                    value={inventarioForm.tipo_inventario}
                    onChange={(e) => setInventarioForm((p) => ({ ...p, tipo_inventario: e.target.value }))}
                  >
                    <option value="normal">normal</option>
                    <option value="sub_rede">sub_rede</option>
                  </select>
                  <input
                    placeholder="IP rede (opcional)"
                    value={inventarioForm.ip_rede}
                    onChange={(e) => setInventarioForm((p) => ({ ...p, ip_rede: e.target.value }))}
                  />
                  <input
                    placeholder="Descricao"
                    value={inventarioForm.descricao}
                    onChange={(e) => setInventarioForm((p) => ({ ...p, descricao: e.target.value }))}
                  />
                </div>
              )}
              {isAdmin && (
                <div className="actions">
                  <button
                    onClick={() =>
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
                  >
                    Criar
                  </button>
                  <button
                    onClick={() =>
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
                  >
                    Atualizar
                  </button>
                  <button
                    className="danger"
                    onClick={() => {
                      if (!window.confirm("Confirmar apagar inventario?")) return;
                      withAction(() => api.inventarios.apagar(inventarioForm.id, token), "Inventario apagado");
                    }}
                  >
                    Apagar
                  </button>
                </div>
              )}
              <table>
                <thead>
                  <tr><th>ID</th><th>Nome</th><th>Tipo</th><th>IP Rede</th><th>Descricao</th><th>Acoes</th></tr>
                </thead>
                <tbody>
                  {inventarios.map((inv) => (
                    <tr key={inv.id}>
                      <td>{inv.id}</td>
                      <td>{inv.nome}</td>
                      <td>{inv.tipo_inventario}</td>
                      <td>{inv.ip_rede || "-"}</td>
                      <td>{inv.descricao || "-"}</td>
                      <td>
                        <button
                          className="ghost"
                          onClick={() => {
                            setSelectedInventarioId(String(inv.id));
                            setInventarioForm({
                              id: String(inv.id),
                              nome: inv.nome || "",
                              tipo_inventario: inv.tipo_inventario || "normal",
                              ip_rede: inv.ip_rede || "",
                              descricao: inv.descricao || "",
                            });
                          }}
                        >
                          Editar
                        </button>
                        {isAdmin && (
                          <button
                            className="danger table-btn"
                            onClick={() => {
                              if (!window.confirm(`Confirmar apagar inventario "${inv.nome}"?`)) return;
                              withAction(() => api.inventarios.apagar(inv.id, token), "Inventario apagado");
                            }}
                          >
                            Apagar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {activeTab === "ativos" && (
            <section className="panel">
              <h2>Ativos + Scan</h2>
              <div className="grid grid-inline">
                <select value={selectedInventarioId} onChange={(e) => setSelectedInventarioId(e.target.value)}>
                  <option value="">Seleciona inventario</option>
                  {inventarios.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.id} - {inv.nome}
                    </option>
                  ))}
                </select>
                <input value={ativoPesquisa} onChange={(e) => setAtivoPesquisa(e.target.value)} placeholder="Pesquisar no inventario" />
                <button onClick={() => refreshAtivos(selectedInventarioId, ativoPesquisa).catch((err) => setStatus({ type: "err", message: err.message }))}>
                  Pesquisar
                </button>
                <button className="ghost" onClick={() => refreshAtivos(selectedInventarioId).catch((err) => setStatus({ type: "err", message: err.message }))}>
                  Recarregar
                </button>
              </div>
              {isAdmin && (
                <div className="grid grid-inline">
                  <input value={scanRede} onChange={(e) => setScanRede(e.target.value)} placeholder="Rede para scan (opcional)" />
                  <input value={scanUser} onChange={(e) => setScanUser(e.target.value)} placeholder="Utilizador de rede (obrigatorio)" />
                  <input value={scanPass} onChange={(e) => setScanPass(e.target.value)} type="password" placeholder="Password de rede (obrigatoria)" />
                  <button
                    onClick={() =>
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
                  >
                    Executar Scan
                  </button>
                </div>
              )}
              <p>{scanInfo}</p>
              <table>
                <thead>
                  <tr><th>Tipo</th><th>Nome/Hostname</th><th>IP</th><th>Serie</th><th>Estado</th><th>Marca</th><th>Modelo</th></tr>
                </thead>
                <tbody>
                  {ativos.map((a, idx) => (
                    <tr key={`${a.id || a.ip || idx}`}>
                      <td>{a.tipo || (a.numero_serie ? "computador" : "descoberto")}</td>
                      <td>{a.nome || a.hostname || "-"}</td>
                      <td>{a.ip || "-"}</td>
                      <td>{a.numero_serie || "-"}</td>
                      <td>{a.estado || "-"}</td>
                      <td>{a.marca || "-"}</td>
                      <td>{a.modelo || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {activeTab === "computadores" && (
            <section className="panel">
              <h2>Computadores</h2>
              {isAdmin && (
                <>
                  <div className="grid">
                    <input placeholder="ID (editar/apagar)" value={computadorForm.id} onChange={(e) => setComputadorForm((p) => ({ ...p, id: e.target.value }))} />
                    <input placeholder="Nome" value={computadorForm.nome} onChange={(e) => setComputadorForm((p) => ({ ...p, nome: e.target.value }))} />
                    <input placeholder="Marca" value={computadorForm.marca} onChange={(e) => setComputadorForm((p) => ({ ...p, marca: e.target.value }))} />
                    <input placeholder="Modelo" value={computadorForm.modelo} onChange={(e) => setComputadorForm((p) => ({ ...p, modelo: e.target.value }))} />
                    <input placeholder="Numero de serie" value={computadorForm.numero_serie} onChange={(e) => setComputadorForm((p) => ({ ...p, numero_serie: e.target.value }))} />
                    <input placeholder="Estado" value={computadorForm.estado} onChange={(e) => setComputadorForm((p) => ({ ...p, estado: e.target.value }))} />
                    <select value={computadorForm.inventario_id} onChange={(e) => setComputadorForm((p) => ({ ...p, inventario_id: e.target.value }))}>
                      <option value="">Inventario</option>
                      {inventarios.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                    </select>
                    <select value={computadorForm.localizacao_id} onChange={(e) => setComputadorForm((p) => ({ ...p, localizacao_id: e.target.value }))}>
                      <option value="">Localizacao (opcional)</option>
                      {localizacoes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                    </select>
                    <select value={computadorForm.utilizador_responsavel_id} onChange={(e) => setComputadorForm((p) => ({ ...p, utilizador_responsavel_id: e.target.value }))}>
                      <option value="">Responsavel (opcional)</option>
                      {utilizadores.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                    </select>
                  </div>
                  <div className="actions">
                    <button onClick={() => withAction(() => api.computadores.criar({
                      ...computadorForm,
                      inventario_id: Number(computadorForm.inventario_id),
                      localizacao_id: computadorForm.localizacao_id ? Number(computadorForm.localizacao_id) : null,
                      utilizador_responsavel_id: computadorForm.utilizador_responsavel_id ? Number(computadorForm.utilizador_responsavel_id) : null,
                    }, token), "Computador criado")}>Criar</button>
                    <button onClick={() => withAction(() => api.computadores.atualizar(computadorForm.id, {
                      ...computadorForm,
                      inventario_id: Number(computadorForm.inventario_id),
                      localizacao_id: computadorForm.localizacao_id ? Number(computadorForm.localizacao_id) : null,
                      utilizador_responsavel_id: computadorForm.utilizador_responsavel_id ? Number(computadorForm.utilizador_responsavel_id) : null,
                    }, token), "Computador atualizado")}>Atualizar (PUT)</button>
                    <button onClick={() => withAction(() => api.computadores.patch(computadorForm.id, {
                      nome: computadorForm.nome || undefined,
                      marca: computadorForm.marca || undefined,
                      modelo: computadorForm.modelo || undefined,
                      numero_serie: computadorForm.numero_serie || undefined,
                      estado: computadorForm.estado || undefined,
                    }, token), "Computador atualizado parcial")}>Atualizar (PATCH)</button>
                    <button className="danger" onClick={() => withAction(() => api.computadores.apagar(computadorForm.id, token), "Computador apagado")}>Apagar</button>
                    <button className="ghost" onClick={() => setComputadorForm(emptyComputerForm())}>Cancelar</button>
                  </div>
                </>
              )}
              <table>
                <thead><tr><th>ID</th><th>Nome</th><th>Serie</th><th>Inventario</th><th>Localizacao</th><th>Responsavel</th><th>Acoes</th></tr></thead>
                <tbody>
                  {computadores.map((pc) => (
                    <tr key={pc.id}>
                      <td>{pc.id}</td><td>{pc.nome}</td><td>{pc.numero_serie}</td>
                      <td>{pc.inventario_nome || pc.inventario_id}</td>
                      <td>{pc.localizacao_nome || "-"}</td>
                      <td>{pc.utilizador_responsavel_nome || "-"}</td>
                      <td>
                        {isAdmin ? (
                          <>
                            <button className="ghost table-btn" onClick={() => setComputadorForm({
                              id: String(pc.id),
                              nome: pc.nome || "",
                              marca: pc.marca || "",
                              modelo: pc.modelo || "",
                              numero_serie: pc.numero_serie || "",
                              estado: pc.estado || "ativo",
                              inventario_id: String(pc.inventario_id || ""),
                              localizacao_id: String(pc.localizacao_id || ""),
                              utilizador_responsavel_id: String(pc.utilizador_responsavel_id || ""),
                            })}>Editar</button>
                            <button
                              className="danger table-btn"
                              onClick={() =>
                                withAction(() => api.computadores.apagar(pc.id, token), "Computador apagado")
                              }
                            >
                              Apagar
                            </button>
                          </>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {activeTab === "utilizadores" && (
            <section className="panel">
              <h2>Utilizadores</h2>
              {isAdmin && (
                <>
                  <div className="grid">
                    <input placeholder="ID (editar/apagar)" value={utilizadorForm.id} onChange={(e) => setUtilizadorForm((p) => ({ ...p, id: e.target.value }))} />
                    <input placeholder="Nome" value={utilizadorForm.nome} onChange={(e) => setUtilizadorForm((p) => ({ ...p, nome: e.target.value }))} />
                    <input placeholder="Username" value={utilizadorForm.username} onChange={(e) => setUtilizadorForm((p) => ({ ...p, username: e.target.value }))} />
                    <input placeholder="Email" value={utilizadorForm.email} onChange={(e) => setUtilizadorForm((p) => ({ ...p, email: e.target.value }))} />
                    <select value={utilizadorForm.perfil_id} onChange={(e) => setUtilizadorForm((p) => ({ ...p, perfil_id: e.target.value }))}>
                      <option value="">Perfil</option>
                      {perfis.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                    </select>
                    <input type="password" placeholder="Palavra-passe" value={utilizadorForm.palavra_passe} onChange={(e) => setUtilizadorForm((p) => ({ ...p, palavra_passe: e.target.value }))} />
                  </div>
                  <div className="actions">
                    <button onClick={() => withAction(() => api.utilizadores.criar({ ...utilizadorForm, perfil_id: Number(utilizadorForm.perfil_id) }, token), "Utilizador criado")}>Criar</button>
                    <button onClick={() => withAction(() => api.utilizadores.atualizar(utilizadorForm.id, {
                      nome: utilizadorForm.nome,
                      username: utilizadorForm.username,
                      email: utilizadorForm.email,
                      perfil_id: Number(utilizadorForm.perfil_id),
                      palavra_passe: utilizadorForm.palavra_passe || undefined,
                    }, token), "Utilizador atualizado")}>Atualizar</button>
                    <button className="danger" onClick={() => {
                      if (!window.confirm("Confirmar apagar utilizador?")) return;
                      withAction(() => api.utilizadores.apagar(utilizadorForm.id, token), "Utilizador apagado");
                    }}>Apagar</button>
                    <button className="ghost" onClick={() => setUtilizadorForm(emptyUserForm())}>Cancelar</button>
                  </div>
                </>
              )}
              <table>
                <thead><tr><th>ID</th><th>Nome</th><th>Username</th><th>Email</th><th>Perfil</th><th>Acoes</th></tr></thead>
                <tbody>
                  {utilizadores.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td><td>{u.nome}</td><td>{u.username}</td><td>{u.email}</td><td>{u.perfil_nome || u.perfil_id}</td>
                      <td>
                        {isAdmin ? (
                          <>
                            <button className="ghost table-btn" onClick={() => setUtilizadorForm({
                              id: String(u.id), nome: u.nome || "", username: u.username || "", email: u.email || "", perfil_id: String(u.perfil_id || ""), palavra_passe: "",
                            })}>Editar</button>
                            <button
                              className="danger table-btn"
                              onClick={() => {
                                if (!window.confirm(`Confirmar apagar utilizador "${u.username}"?`)) return;
                                withAction(() => api.utilizadores.apagar(u.id, token), "Utilizador apagado");
                              }}
                            >
                              Apagar
                            </button>
                          </>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {activeTab === "perfis" && (
            <section className="panel">
              <h2>Perfis</h2>
              {isAdmin && (
                <>
                  <div className="grid grid-inline">
                    <input placeholder="ID (editar/apagar)" value={perfilForm.id} onChange={(e) => setPerfilForm((p) => ({ ...p, id: e.target.value }))} />
                    <input placeholder="Nome do perfil" value={perfilForm.nome} onChange={(e) => setPerfilForm((p) => ({ ...p, nome: e.target.value }))} />
                  </div>
                  <div className="actions">
                    <button onClick={() => withAction(() => api.perfis.criar({ nome: perfilForm.nome }, token), "Perfil criado")}>Criar</button>
                    <button onClick={() => withAction(() => api.perfis.atualizar(perfilForm.id, { nome: perfilForm.nome }, token), "Perfil atualizado")}>Atualizar</button>
                    <button className="danger" onClick={() => withAction(() => api.perfis.apagar(perfilForm.id, token), "Perfil apagado")}>Apagar</button>
                    <button className="ghost" onClick={() => setPerfilForm({ id: "", nome: "" })}>Cancelar</button>
                  </div>
                </>
              )}
              <table>
                <thead><tr><th>ID</th><th>Nome</th><th>Acoes</th></tr></thead>
                <tbody>
                  {perfis.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.nome}</td>
                      <td>
                        {isAdmin ? (
                          <>
                            <button className="ghost table-btn" onClick={() => setPerfilForm({ id: String(p.id), nome: p.nome || "" })}>Editar</button>
                            <button
                              className="danger table-btn"
                              onClick={() => withAction(() => api.perfis.apagar(p.id, token), "Perfil apagado")}
                            >
                              Apagar
                            </button>
                          </>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {activeTab === "localizacoes" && (
            <section className="panel">
              <h2>Localizacoes</h2>
              {isAdmin && (
                <>
                  <div className="grid">
                    <input placeholder="ID (editar/apagar)" value={localizacaoForm.id} onChange={(e) => setLocalizacaoForm((p) => ({ ...p, id: e.target.value }))} />
                    <input placeholder="Nome" value={localizacaoForm.nome} onChange={(e) => setLocalizacaoForm((p) => ({ ...p, nome: e.target.value }))} />
                    <input placeholder="Descricao (opcional)" value={localizacaoForm.descricao} onChange={(e) => setLocalizacaoForm((p) => ({ ...p, descricao: e.target.value }))} />
                  </div>
                  <div className="actions">
                    <button onClick={() => withAction(() => api.localizacoes.criar({
                      nome: localizacaoForm.nome,
                      descricao: localizacaoForm.descricao || null,
                    }, token), "Localizacao criada")}>Criar</button>
                    <button onClick={() => withAction(() => api.localizacoes.atualizar(localizacaoForm.id, {
                      nome: localizacaoForm.nome,
                      descricao: localizacaoForm.descricao || null,
                    }, token), "Localizacao atualizada")}>Atualizar</button>
                    <button className="danger" onClick={() => withAction(() => api.localizacoes.apagar(localizacaoForm.id, token), "Localizacao apagada")}>Apagar</button>
                    <button className="ghost" onClick={() => setLocalizacaoForm({ id: "", nome: "", descricao: "" })}>Cancelar</button>
                  </div>
                </>
              )}
              <table>
                <thead><tr><th>ID</th><th>Nome</th><th>Descricao</th><th>Acoes</th></tr></thead>
                <tbody>
                  {localizacoes.map((l) => (
                    <tr key={l.id}>
                      <td>{l.id}</td>
                      <td>{l.nome}</td>
                      <td>{l.descricao || "-"}</td>
                      <td>
                        {isAdmin ? (
                          <>
                            <button className="ghost table-btn" onClick={() => setLocalizacaoForm({ id: String(l.id), nome: l.nome || "", descricao: l.descricao || "" })}>Editar</button>
                            <button
                              className="danger table-btn"
                              onClick={() => withAction(() => api.localizacoes.apagar(l.id, token), "Localizacao apagada")}
                            >
                              Apagar
                            </button>
                          </>
                        ) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {activeTab === "pesquisa" && (
            <section className="panel">
              <h2>Pesquisa Global</h2>
              <div className="grid grid-inline">
                <input value={globalTermo} onChange={(e) => setGlobalTermo(e.target.value)} placeholder="Termo de pesquisa" />
                <button onClick={async () => {
                  try {
                    const data = await api.pesquisa.global(globalTermo, token);
                    setGlobalOutput(JSON.stringify(data, null, 2));
                  } catch (error) {
                    setGlobalOutput(JSON.stringify({ erro: error.message }, null, 2));
                  }
                }}>Pesquisar</button>
              </div>
              <pre>{globalOutput}</pre>
            </section>
          )}

          {activeTab === "logs" && (
            <section className="panel">
              <h2>Logs</h2>
              <h3>Computadores</h3>
              <div className="grid">
                <input placeholder="computador_id" value={logComputadorParams.computador_id} onChange={(e) => setLogComputadorParams((p) => ({ ...p, computador_id: e.target.value }))} />
                <input placeholder="nome" value={logComputadorParams.nome} onChange={(e) => setLogComputadorParams((p) => ({ ...p, nome: e.target.value }))} />
                <input placeholder="numero_serie" value={logComputadorParams.numero_serie} onChange={(e) => setLogComputadorParams((p) => ({ ...p, numero_serie: e.target.value }))} />
                <input placeholder="hostname" value={logComputadorParams.hostname} onChange={(e) => setLogComputadorParams((p) => ({ ...p, hostname: e.target.value }))} />
                <select value={logComputadorParams.tipo_log} onChange={(e) => setLogComputadorParams((p) => ({ ...p, tipo_log: e.target.value }))}>
                  <option value="">tipo_log (todos)</option>
                  <option value="seguranca">seguranca</option>
                  <option value="rdp">rdp</option>
                </select>
                <button onClick={async () => {
                  try {
                    const data = await api.logs.porComputador(logComputadorParams, token);
                    setLogsOutput(JSON.stringify(data, null, 2));
                  } catch (error) {
                    setLogsOutput(JSON.stringify({ erro: error.message }, null, 2));
                  }
                }}>Buscar logs computadores</button>
              </div>

              <h3>Inventario / Descobertos</h3>
              <div className="grid">
                <input placeholder="inventario_id" value={logInventarioParams.inventario_id} onChange={(e) => setLogInventarioParams((p) => ({ ...p, inventario_id: e.target.value }))} />
                <input placeholder="dispositivo_id" value={logInventarioParams.dispositivo_id} onChange={(e) => setLogInventarioParams((p) => ({ ...p, dispositivo_id: e.target.value }))} />
                <select value={logInventarioParams.tipo_log} onChange={(e) => setLogInventarioParams((p) => ({ ...p, tipo_log: e.target.value }))}>
                  <option value="">tipo_log (todos)</option>
                  <option value="seguranca">seguranca</option>
                  <option value="rdp">rdp</option>
                </select>
                <select value={logInventarioParams.coletar_agora} onChange={(e) => setLogInventarioParams((p) => ({ ...p, coletar_agora: e.target.value }))}>
                  <option value="false">coletar_agora=false</option>
                  <option value="true">coletar_agora=true</option>
                </select>
                <button onClick={async () => {
                  try {
                    const invId = logInventarioParams.inventario_id || selectedInventarioId;
                    const query = { ...logInventarioParams };
                    delete query.inventario_id;
                    const data = await api.inventarios.logsDispositivos(invId, query, token);
                    setLogsOutput(JSON.stringify(data, null, 2));
                  } catch (error) {
                    setLogsOutput(JSON.stringify({ erro: error.message }, null, 2));
                  }
                }}>Buscar logs inventario</button>
              </div>

              <pre>{logsOutput}</pre>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

