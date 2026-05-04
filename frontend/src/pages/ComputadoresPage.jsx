/* CRUD de computadores + vista agregada com equipamentos descobertos por inventário (scan). */

import { useCallback, useMemo, useState } from "react";
import { api } from "../api";
import FormModal from "../components/FormModal";
import SectionCard from "../components/SectionCard";

function tipoInvLabel(t) {
  if (t === "sub_rede") return "Sub-rede";
  return "Normal";
}

function dash(v) {
  if (v == null || v === "") return "—";
  const s = String(v).trim();
  return s || "—";
}

function labelAtivo(a) {
  if (a.tipo === "computador") return a.nome || a.hostname || "—";
  return a.hostname || a.ip || `Scan #${a.id}`;
}

function sortByIdentificacao(list) {
  return [...(list || [])].sort((a, b) =>
    labelAtivo(a).localeCompare(labelAtivo(b), "pt", { sensitivity: "base" }),
  );
}

function fmtUltimaSinc(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function emptyScanForm() {
  return {
    id: "",
    inventario_id: "",
    ip: "",
    hostname: "",
    mac_address: "",
    marca: "",
    modelo: "",
    numero_serie: "",
    sistema_operativo: "",
    estado: "ativo",
  };
}

function payloadScanDispositivo(form) {
  return {
    ip: form.ip.trim(),
    estado: (form.estado && form.estado.trim()) || "ativo",
    hostname: form.hostname?.trim() || null,
    mac_address: form.mac_address?.trim() || null,
    marca: form.marca?.trim() || null,
    modelo: form.modelo?.trim() || null,
    numero_serie: form.numero_serie?.trim() || null,
    sistema_operativo: form.sistema_operativo?.trim() || null,
  };
}

/** Texto pesquisável de um ativo (manual ou scan). */
function textoAtivoBusca(a) {
  const partes = [
    a.nome,
    a.hostname,
    a.ip,
    a.mac_address,
    a.numero_serie,
    a.marca,
    a.modelo,
    a.sistema_operativo,
    a.estado,
    a.localizacao_nome,
    a.utilizador_responsavel_nome,
  ];
  return partes
    .filter((x) => x != null && String(x).trim() !== "")
    .join(" ")
    .toLowerCase();
}

function inventarioCoincideNome(grupo, qLimpa) {
  return qLimpa === "" || String(grupo.inventario_nome || "").toLowerCase().includes(qLimpa);
}

function inventarioTemAtivoCoincidente(grupo, qLimpa) {
  if (qLimpa === "") return true;
  return (grupo.ativos || []).some((a) => textoAtivoBusca(a).includes(qLimpa));
}

export default function ComputadoresPage({
  isAdmin,
  computadorForm,
  setComputadorForm,
  inventarios,
  localizacoes,
  utilizadores,
  onCreate,
  onUpdate,
  onPatch,
  onDeleteByForm,
  onCancel,
  computadores,
  ativosPorInventario,
  loading,
  onPick,
  onDeleteRow,
  token,
  withPanelAction,
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [scanEditorOpen, setScanEditorOpen] = useState(false);
  const [scanForm, setScanForm] = useState(emptyScanForm);
  const [pesquisaLista, setPesquisaLista] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos"); // todos | manuais | scan

  /** Inventários com mais equipamentos primeiro; depois nome A–Z. */
  const gruposOrdenados = useMemo(() => {
    const raw = ativosPorInventario || [];
    return [...raw].sort((gA, gB) => {
      const tA = (gA.ativos || []).length;
      const tB = (gB.ativos || []).length;
      if (tA !== tB) return tB - tA;
      return String(gA.inventario_nome || "").localeCompare(String(gB.inventario_nome || ""), "pt", {
        sensitivity: "base",
      });
    });
  }, [ativosPorInventario]);

  const totaisGlobais = useMemo(() => {
    let registos = 0;
    let scan = 0;
    let inventariosComDados = 0;
    for (const g of gruposOrdenados) {
      const at = g.ativos || [];
      const r = at.filter((x) => x.tipo === "computador").length;
      const s = at.filter((x) => x.tipo === "dispositivo_descoberto").length;
      registos += r;
      scan += s;
      if (r + s > 0) inventariosComDados += 1;
    }
    return {
      registos,
      scan,
      inventariosComDados,
      total: registos + scan,
      inventariosVisiveis: gruposOrdenados.length,
    };
  }, [gruposOrdenados]);

  const qLista = pesquisaLista.trim().toLowerCase();

  const gruposExibicao = useMemo(() => {
    return gruposOrdenados.filter((g) => {
      const todosAt = g.ativos || [];
      const nReg = todosAt.filter((x) => x.tipo === "computador").length;
      const nScan = todosAt.filter((x) => x.tipo === "dispositivo_descoberto").length;
      if (filtroTipo === "manuais" && nReg === 0) return false;
      if (filtroTipo === "scan" && nScan === 0) return false;
      if (qLista === "") return true;
      return inventarioCoincideNome(g, qLista) || inventarioTemAtivoCoincidente(g, qLista);
    });
  }, [gruposOrdenados, filtroTipo, qLista]);

  const totaisFiltrados = useMemo(() => {
    let registos = 0;
    let scan = 0;
    for (const g of gruposExibicao) {
      const at = g.ativos || [];
      let rs = at.filter((x) => x.tipo === "computador");
      let sc = at.filter((x) => x.tipo === "dispositivo_descoberto");
      if (qLista && !inventarioCoincideNome(g, qLista)) {
        rs = rs.filter((a) => textoAtivoBusca(a).includes(qLista));
        sc = sc.filter((a) => textoAtivoBusca(a).includes(qLista));
      }
      if (filtroTipo === "manuais") sc = [];
      if (filtroTipo === "scan") rs = [];
      registos += rs.length;
      scan += sc.length;
    }
    return {
      registos,
      scan,
      total: registos + scan,
      inventarios: gruposExibicao.length,
    };
  }, [gruposExibicao, qLista, filtroTipo]);

  const filtroActivo = qLista !== "" || filtroTipo !== "todos";

  function expandirTodosBlocos(abrir) {
    document.querySelectorAll(".computadores-inv-collapsible").forEach((el) => {
      el.open = abrir;
    });
  }

  function irParaInventario(id) {
    if (!id) return;
    const el = document.getElementById(`computadores-inv-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (el && "open" in el) el.open = true;
  }

  function limparFiltrosLista() {
    setPesquisaLista("");
    setFiltroTipo("todos");
  }

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    onCancel?.();
  }, [onCancel]);

  function openCreate() {
    setEditorMode("create");
    onCancel?.();
    setEditorOpen(true);
  }

  function openEditDeRegisto(pc) {
    setEditorMode("edit");
    onPick(pc);
    setEditorOpen(true);
  }

  function handleRowEdit(ativo) {
    if (ativo.tipo !== "computador") return;
    const full = (computadores || []).find((c) => c.id === ativo.id);
    openEditDeRegisto(full || ativo);
  }

  async function handleCreate() {
    const ok = Boolean(await onCreate?.());
    if (ok) closeEditor();
  }

  async function handleUpdatePut() {
    const ok = Boolean(await onUpdate?.());
    if (ok) closeEditor();
  }

  async function handleUpdatePatch() {
    const ok = Boolean(await onPatch?.());
    if (ok) closeEditor();
  }

  async function handleDeleteInModal() {
    const ok = Boolean(await onDeleteByForm?.());
    if (ok) closeEditor();
  }

  function openScanEdit(ativo, inventarioId) {
    setScanForm({
      id: String(ativo.id),
      inventario_id: String(inventarioId),
      ip: ativo.ip || "",
      hostname: ativo.hostname || "",
      mac_address: ativo.mac_address || "",
      marca: ativo.marca || "",
      modelo: ativo.modelo || "",
      numero_serie: ativo.numero_serie || "",
      sistema_operativo: ativo.sistema_operativo || "",
      estado: ativo.estado || "ativo",
    });
    setScanEditorOpen(true);
  }

  function closeScanEditor() {
    setScanEditorOpen(false);
    setScanForm(emptyScanForm());
  }

  async function handleScanSave() {
    if (!withPanelAction || !token) return;
    const ok = await withPanelAction(
      () =>
        api.inventarios.atualizarDispositivo(
          Number(scanForm.inventario_id),
          Number(scanForm.id),
          payloadScanDispositivo(scanForm),
          token,
        ),
      "Equipamento do scan atualizado",
    );
    if (ok) closeScanEditor();
  }

  async function handleScanDeleteRow(ativo, inventarioId) {
    if (!withPanelAction || !token) return;
    if (
      !window.confirm(
        `Remover o equipamento descoberto "${labelAtivo(ativo)}" (${ativo.ip || "sem IP"}) deste inventário?`,
      )
    ) {
      return;
    }
    await withPanelAction(
      () => api.inventarios.apagarDispositivo(inventarioId, ativo.id, token),
      "Equipamento do scan removido",
    );
  }

  const temAlgumAtivo = gruposOrdenados.some((g) => (g.ativos || []).length > 0);

  return (
    <SectionCard
      title="Computadores"
      subtitle="Por inventário: pesquisa e filtros em cima; expande cada bloco para ver manuais e scan."
      rightAction={
        isAdmin ? (
          <button type="button" className="btn-chip-primary" onClick={openCreate}>
            Novo computador
          </button>
        ) : null
      }
    >
      {loading ? (
        <div className="loading-box">A carregar equipamentos…</div>
      ) : gruposOrdenados.length === 0 ? (
        <div className="empty-state">
          <h3>Sem inventários visíveis</h3>
          <p>Não há inventários associados à tua conta.</p>
        </div>
      ) : (
        <>
          <div className="computadores-page">
          <div className="computadores-overview">
            <section className="computadores-overview-controls" aria-label="Pesquisa e filtros">
              <div className="computadores-search-row">
                <div className="computadores-search-field">
                  <span className="material-symbols-outlined computadores-search-field-icon" aria-hidden>
                    search
                  </span>
                  <input
                    type="search"
                    className="computadores-search-input"
                    placeholder="Pesquisar inventário ou equipamento (IP, hostname, série…)"
                    value={pesquisaLista}
                    onChange={(e) => setPesquisaLista(e.target.value)}
                    autoComplete="off"
                    aria-label="Pesquisar na lista"
                  />
                </div>
                {pesquisaLista ? (
                  <button type="button" className="ghost ghost-sm computadores-search-clear" onClick={() => setPesquisaLista("")}>
                    Limpar
                  </button>
                ) : null}
              </div>

              <div className="computadores-toolbar-merge">
                <div className="computadores-toolbar-merge-left">
                  <span className="computadores-toolbar-merge-label">Tipo</span>
                  <div className="computadores-filter-chips" role="group" aria-label="Tipo de registo">
                    <button
                      type="button"
                      className={`computadores-chip ${filtroTipo === "todos" ? "computadores-chip--active" : ""}`}
                      onClick={() => setFiltroTipo("todos")}
                    >
                      Tudo
                    </button>
                    <button
                      type="button"
                      title="Apenas registos manuais"
                      className={`computadores-chip ${filtroTipo === "manuais" ? "computadores-chip--active" : ""}`}
                      onClick={() => setFiltroTipo("manuais")}
                    >
                      Manuais
                    </button>
                    <button
                      type="button"
                      title="Apenas equipamentos descobertos pelo scan"
                      className={`computadores-chip ${filtroTipo === "scan" ? "computadores-chip--active" : ""}`}
                      onClick={() => setFiltroTipo("scan")}
                    >
                      Scan
                    </button>
                  </div>
                </div>
                <div className="computadores-toolbar-merge-right">
                  <label className="computadores-jump-compact">
                    <span className="computadores-jump-compact-label">Ir para</span>
                    <select
                      className="computadores-toolbar-select"
                      defaultValue=""
                      disabled={gruposExibicao.length === 0}
                      onChange={(e) => {
                        irParaInventario(e.target.value);
                        e.target.value = "";
                      }}
                    >
                      <option value="" disabled>
                        {gruposExibicao.length === 0 ? "Sem resultados" : "Inventário…"}
                      </option>
                      {gruposExibicao.map((g) => (
                        <option key={g.inventario_id} value={g.inventario_id}>
                          {g.inventario_nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="computadores-toolbar-actions">
                    <button
                      type="button"
                      className="ghost ghost-sm"
                      onClick={() => expandirTodosBlocos(true)}
                      disabled={gruposExibicao.length === 0}
                    >
                      Expandir todos
                    </button>
                    <button
                      type="button"
                      className="ghost ghost-sm"
                      onClick={() => expandirTodosBlocos(false)}
                      disabled={gruposExibicao.length === 0}
                    >
                      Recolher todos
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <div className="computadores-stat-strip" aria-label={filtroActivo ? "Resumo filtrado" : "Resumo global"}>
              <div className="computadores-stat-tile">
                <span className="material-symbols-outlined computadores-stat-tile-ic" aria-hidden>
                  devices
                </span>
                <div className="computadores-stat-tile-text">
                  <span className="computadores-stat-tile-value">{filtroActivo ? totaisFiltrados.total : totaisGlobais.total}</span>
                  <span className="computadores-stat-tile-label">
                    {filtroActivo ? "Com filtro" : "Total equip."}
                  </span>
                </div>
              </div>
              <div className="computadores-stat-tile computadores-stat-tile--manual">
                <span className="material-symbols-outlined computadores-stat-tile-ic" aria-hidden>
                  inventory_2
                </span>
                <div className="computadores-stat-tile-text">
                  <span className="computadores-stat-tile-value">{filtroActivo ? totaisFiltrados.registos : totaisGlobais.registos}</span>
                  <span className="computadores-stat-tile-label">Manuais</span>
                </div>
              </div>
              <div className="computadores-stat-tile computadores-stat-tile--scan">
                <span className="material-symbols-outlined computadores-stat-tile-ic" aria-hidden>
                  radar
                </span>
                <div className="computadores-stat-tile-text">
                  <span className="computadores-stat-tile-value">{filtroActivo ? totaisFiltrados.scan : totaisGlobais.scan}</span>
                  <span className="computadores-stat-tile-label">Scan</span>
                </div>
              </div>
              <div className="computadores-stat-tile computadores-stat-tile--muted">
                <span className="material-symbols-outlined computadores-stat-tile-ic" aria-hidden>
                  folder_open
                </span>
                <div className="computadores-stat-tile-text">
                  <span className="computadores-stat-tile-value">
                    {filtroActivo ? totaisFiltrados.inventarios : `${totaisGlobais.inventariosComDados}/${totaisGlobais.inventariosVisiveis}`}
                  </span>
                  <span className="computadores-stat-tile-label">
                    {filtroActivo ? "Inventários" : "Com dados / total"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="computadores-por-inv-stack">
            {gruposExibicao.length === 0 ? (
              <div className="computadores-empty-filtros" role="status">
                <div className="computadores-empty-filtros-inner">
                  <span className="material-symbols-outlined computadores-empty-filtros-icon" aria-hidden>
                    filter_alt_off
                  </span>
                  <div>
                    <h3 className="computadores-empty-filtros-title">Nenhum inventário corresponde aos filtros</h3>
                    <p className="computadores-empty-filtros-text">
                      Tenta outro termo de pesquisa ou altera o tipo de registos (tudo, manuais ou scan).
                    </p>
                  </div>
                </div>
                <button type="button" className="btn-chip-primary" onClick={limparFiltrosLista}>
                  Repor pesquisa e filtros
                </button>
              </div>
            ) : (
              gruposExibicao.map((grupo, idxInv) => {
              const todos = grupo.ativos || [];
              const nomeInvMatch = qLista !== "" && inventarioCoincideNome(grupo, qLista);
              let registos = sortByIdentificacao(todos.filter((a) => a.tipo === "computador"));
              let scans = sortByIdentificacao(todos.filter((a) => a.tipo === "dispositivo_descoberto"));
              if (qLista && !nomeInvMatch) {
                registos = registos.filter((a) => textoAtivoBusca(a).includes(qLista));
                scans = scans.filter((a) => textoAtivoBusca(a).includes(qLista));
              }
              if (filtroTipo === "manuais") scans = [];
              if (filtroTipo === "scan") registos = [];
              const nReg = registos.length;
              const nScan = scans.length;
              const nTot = nReg + nScan;
              const tipoInv =
                grupo.tipo_inventario === "sub_rede" ? "sub_rede" : "normal";

              return (
                <details
                  key={grupo.inventario_id}
                  id={`computadores-inv-${grupo.inventario_id}`}
                  className={`computadores-inv-collapsible computadores-inv-block computadores-inv-block--${tipoInv}`}
                >
                  <summary className="computadores-inv-summary">
                    <span className="computadores-inv-summary-grip" aria-hidden title="Expandir ou recolher">
                      <span className="material-symbols-outlined">expand_more</span>
                    </span>
                    <span className="computadores-inv-summary-main">
                      <span className="computadores-inv-index">#{idxInv + 1}</span>
                      <div className="computadores-inv-head-text">
                        <h3 className="computadores-inv-title">{grupo.inventario_nome}</h3>
                        <span className="pill badge-info">{tipoInvLabel(grupo.tipo_inventario)}</span>
                      </div>
                    </span>
                    <dl className="computadores-inv-kpis">
                      <div className="computadores-inv-kpi">
                        <dt>Total</dt>
                        <dd>{nTot}</dd>
                      </div>
                      <div className="computadores-inv-kpi computadores-inv-kpi--manual">
                        <dt>Manuais</dt>
                        <dd>{nReg}</dd>
                      </div>
                      <div className="computadores-inv-kpi computadores-inv-kpi--scan">
                        <dt>Scan</dt>
                        <dd>{nScan}</dd>
                      </div>
                    </dl>
                  </summary>

                  <div className="computadores-inv-body">
                  {nTot === 0 ? (
                    <p className="cell-muted computadores-inv-empty">Nenhum equipamento neste inventário.</p>
                  ) : (
                    <div className="computadores-inv-sections">
                      <section className="computadores-subsection computadores-subsection-card">
                        <h4 className="computadores-subsection-title">
                          <span className="material-symbols-outlined" aria-hidden>
                            inventory_2
                          </span>
                          Registos manuais
                          <span className="computadores-subsection-count">{nReg}</span>
                        </h4>
                        {nReg === 0 ? (
                          <p className="computadores-subsection-empty">Sem registos manuais neste inventário.</p>
                        ) : (
                          <div className="table-shell computadores-table-wrap computadores-detalhe-table">
                            <table>
                              <thead>
                                <tr>
                                  <th>Nome</th>
                                  <th>Hostname</th>
                                  <th>IP</th>
                                  <th>MAC</th>
                                  <th>Marca</th>
                                  <th>Modelo</th>
                                  <th>N.º série</th>
                                  <th>Sistema</th>
                                  <th>Estado</th>
                                  <th>Localiz.</th>
                                  <th>Resp.</th>
                                  <th className="th-actions">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {registos.map((a) => (
                                  <tr key={`pc-${a.id}`}>
                                    <td>
                                      <span className="cell-title">{dash(a.nome)}</span>
                                    </td>
                                    <td className="cell-mono">{dash(a.hostname)}</td>
                                    <td className="cell-mono">{dash(a.ip)}</td>
                                    <td className="cell-mono">{dash(a.mac_address)}</td>
                                    <td>{dash(a.marca)}</td>
                                    <td>{dash(a.modelo)}</td>
                                    <td className="cell-mono">{dash(a.numero_serie)}</td>
                                    <td>{dash(a.sistema_operativo)}</td>
                                    <td>{dash(a.estado)}</td>
                                    <td>{dash(a.localizacao_nome)}</td>
                                    <td>{dash(a.utilizador_responsavel_nome)}</td>
                                    <td>
                                      {isAdmin ? (
                                        <>
                                          <button
                                            type="button"
                                            className="ghost table-btn"
                                            onClick={() => handleRowEdit(a)}
                                          >
                                            Editar
                                          </button>
                                          <button
                                            type="button"
                                            className="danger table-btn"
                                            onClick={() => onDeleteRow?.(a)}
                                          >
                                            Apagar
                                          </button>
                                        </>
                                      ) : (
                                        <span className="cell-muted">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>

                      <section className="computadores-subsection computadores-subsection--scan computadores-subsection-card">
                        <h4 className="computadores-subsection-title">
                          <span className="material-symbols-outlined" aria-hidden>
                            radar
                          </span>
                          Descobertos pelo scan
                          <span className="computadores-subsection-count">{nScan}</span>
                        </h4>
                        {nScan === 0 ? (
                          <p className="computadores-subsection-empty">
                            Ainda não há equipamentos descobertos por scan neste inventário.
                          </p>
                        ) : (
                          <div className="table-shell computadores-table-wrap computadores-detalhe-table">
                            <table>
                              <thead>
                                <tr>
                                  <th>Identif.</th>
                                  <th>Hostname</th>
                                  <th>IP</th>
                                  <th>MAC</th>
                                  <th>Marca</th>
                                  <th>Modelo</th>
                                  <th>N.º série</th>
                                  <th>Sistema</th>
                                  <th>Estado</th>
                                  <th>Última atividade</th>
                                  <th className="th-actions">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {scans.map((a) => (
                                  <tr key={`scan-${a.id}`}>
                                    <td>
                                      <span className="cell-title">{labelAtivo(a)}</span>
                                    </td>
                                    <td className="cell-mono">{dash(a.hostname)}</td>
                                    <td className="cell-mono">{dash(a.ip)}</td>
                                    <td className="cell-mono">{dash(a.mac_address)}</td>
                                    <td>{dash(a.marca)}</td>
                                    <td>{dash(a.modelo)}</td>
                                    <td className="cell-mono">{dash(a.numero_serie)}</td>
                                    <td>{dash(a.sistema_operativo)}</td>
                                    <td>{dash(a.estado)}</td>
                                    <td className="cell-muted cell-nowrap">{fmtUltimaSinc(a.ultima_vez_ativo_em)}</td>
                                    <td>
                                      {isAdmin ? (
                                        <>
                                          <button
                                            type="button"
                                            className="ghost table-btn"
                                            onClick={() => openScanEdit(a, grupo.inventario_id)}
                                          >
                                            Editar
                                          </button>
                                          <button
                                            type="button"
                                            className="danger table-btn"
                                            onClick={() => handleScanDeleteRow(a, grupo.inventario_id)}
                                          >
                                            Apagar
                                          </button>
                                        </>
                                      ) : (
                                        <span className="cell-muted">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    </div>
                  )}
                  </div>
                </details>
              );
              })
            )}
          </div>
          </div>
        </>
      )}

      {!loading && gruposOrdenados.length > 0 && !temAlgumAtivo ? (
        <p className="section-subtitle computadores-footnote">
          Todos os inventários visíveis estão vazios. Usa a aba Scan para descobrir equipamentos na rede ou cria
          registos manuais.
        </p>
      ) : null}

      {isAdmin ? (
        <>
        <FormModal
          open={editorOpen}
          onClose={closeEditor}
          wide
          titleId="modal-computador-title"
          title={editorMode === "create" ? "Novo computador" : "Editar computador"}
          subtitle={
            editorMode === "edit" && computadorForm?.id ? (
              <>
                A alterar <strong>{computadorForm.nome || "este equipamento"}</strong>
              </>
            ) : (
              <>Liga o PC a um inventário e opcionalmente a localização e responsável.</>
            )
          }
          footer={
            <>
              <button type="button" className="ghost" onClick={closeEditor}>
                Cancelar
              </button>
              {editorMode === "edit" ? (
                <>
                  <button type="button" className="danger" onClick={handleDeleteInModal}>
                    Apagar
                  </button>
                  <button type="button" className="ghost" onClick={handleUpdatePatch}>
                    Guardar apenas alterações (PATCH)
                  </button>
                  <button type="button" onClick={handleUpdatePut}>
                    Substituir registo (PUT)
                  </button>
                </>
              ) : (
                <button type="button" onClick={handleCreate}>
                  Criar computador
                </button>
              )}
            </>
          }
        >
          <div className="form-stack form-stack--horizontal">
            <label className="field-label">
              Nome
              <input
                placeholder="Identificação do equipamento"
                value={computadorForm.nome}
                onChange={(e) => setComputadorForm((p) => ({ ...p, nome: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Estado
              <input
                placeholder="ativo, manutenção, …"
                value={computadorForm.estado}
                onChange={(e) => setComputadorForm((p) => ({ ...p, estado: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Marca
              <input
                placeholder="Marca"
                value={computadorForm.marca}
                onChange={(e) => setComputadorForm((p) => ({ ...p, marca: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Modelo
              <input
                placeholder="Modelo"
                value={computadorForm.modelo}
                onChange={(e) => setComputadorForm((p) => ({ ...p, modelo: e.target.value }))}
              />
            </label>
            <label className="field-label field-label--full">
              Número de série
              <input
                placeholder="S/N ou etiqueta"
                value={computadorForm.numero_serie}
                onChange={(e) => setComputadorForm((p) => ({ ...p, numero_serie: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Hostname (rede)
              <input
                placeholder="Ex.: PC-LAB-03"
                value={computadorForm.hostname}
                onChange={(e) => setComputadorForm((p) => ({ ...p, hostname: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Endereço IP
              <input
                placeholder="Ex.: 192.168.1.10"
                value={computadorForm.endereco_ip}
                onChange={(e) => setComputadorForm((p) => ({ ...p, endereco_ip: e.target.value }))}
              />
            </label>
            <label className="field-label">
              MAC
              <input
                placeholder="Ex.: AA:BB:CC:DD:EE:FF"
                className="input-mono"
                value={computadorForm.mac_address}
                onChange={(e) => setComputadorForm((p) => ({ ...p, mac_address: e.target.value }))}
              />
            </label>
            <label className="field-label field-label--full">
              Sistema operativo
              <input
                placeholder="Ex.: Windows 11 Pro"
                value={computadorForm.sistema_operativo}
                onChange={(e) => setComputadorForm((p) => ({ ...p, sistema_operativo: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Inventário
              <select
                value={computadorForm.inventario_id}
                onChange={(e) => setComputadorForm((p) => ({ ...p, inventario_id: e.target.value }))}
              >
                <option value="">Escolhe inventário…</option>
                {inventarios.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Localização (opcional)
              <select
                value={computadorForm.localizacao_id}
                onChange={(e) => setComputadorForm((p) => ({ ...p, localizacao_id: e.target.value }))}
              >
                <option value="">—</option>
                {localizacoes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label field-label--full">
              Responsável (opcional)
              <select
                value={computadorForm.utilizador_responsavel_id}
                onChange={(e) =>
                  setComputadorForm((p) => ({ ...p, utilizador_responsavel_id: e.target.value }))
                }
              >
                <option value="">—</option>
                {utilizadores.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </FormModal>

        <FormModal
          open={scanEditorOpen}
          onClose={closeScanEditor}
          wide
          titleId="modal-scan-dispositivo-title"
          title="Editar equipamento descoberto (scan)"
          subtitle={
            <>
              Dados detetados na rede neste inventário. O <strong>endereço IP</strong> tem de ser único no
              inventário.
            </>
          }
          footer={
            <>
              <button type="button" className="ghost" onClick={closeScanEditor}>
                Cancelar
              </button>
              <button type="button" onClick={() => void handleScanSave()}>
                Guardar alterações
              </button>
            </>
          }
        >
          <div className="form-stack form-stack--horizontal">
            <label className="field-label">
              Endereço IP *
              <input
                className="input-mono"
                placeholder="192.168.x.x"
                value={scanForm.ip}
                onChange={(e) => setScanForm((p) => ({ ...p, ip: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Estado *
              <input
                placeholder="ativo, inativo…"
                value={scanForm.estado}
                onChange={(e) => setScanForm((p) => ({ ...p, estado: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Hostname
              <input
                value={scanForm.hostname}
                onChange={(e) => setScanForm((p) => ({ ...p, hostname: e.target.value }))}
              />
            </label>
            <label className="field-label">
              MAC
              <input
                className="input-mono"
                placeholder="AA:BB:CC:DD:EE:FF"
                value={scanForm.mac_address}
                onChange={(e) => setScanForm((p) => ({ ...p, mac_address: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Marca
              <input
                value={scanForm.marca}
                onChange={(e) => setScanForm((p) => ({ ...p, marca: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Modelo
              <input
                value={scanForm.modelo}
                onChange={(e) => setScanForm((p) => ({ ...p, modelo: e.target.value }))}
              />
            </label>
            <label className="field-label field-label--full">
              N.º série
              <input
                className="input-mono"
                value={scanForm.numero_serie}
                onChange={(e) => setScanForm((p) => ({ ...p, numero_serie: e.target.value }))}
              />
            </label>
            <label className="field-label field-label--full">
              Sistema operativo
              <input
                value={scanForm.sistema_operativo}
                onChange={(e) => setScanForm((p) => ({ ...p, sistema_operativo: e.target.value }))}
              />
            </label>
          </div>
        </FormModal>
        </>
      ) : null}
    </SectionCard>
  );
}
