/* CRUD de computadores + vista agregada com equipamentos descobertos por inventário (scan). */

import { useCallback, useMemo, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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

/** Junta manuais e descobertos e ordena por identificação. */
function linhasEquipamentosUnificadas(registos, scans) {
  return [...registos, ...scans].sort((a, b) =>
    labelAtivo(a).localeCompare(labelAtivo(b), "pt", { sensitivity: "base" }),
  );
}

/**
 * Origem lógica alinhada ao modelo: tabela computadores vs dispositivos_descobertos.origem_registo.
 */
function origemRegistoVisual(a) {
  if (a.tipo === "computador") return "manual";
  const raw = String(a.origem_registo ?? "scan")
    .trim()
    .toLowerCase();
  if (raw === "manual" || raw === "registo_manual") return "manual";
  return "scan";
}

/** Texto da coluna Origem (Manual / Scan ou valor vindo da BD). */
function etiquetaOrigemAmigavel(a) {
  if (a.tipo === "computador") return "Manual";
  const raw = String(a.origem_registo ?? "scan").trim();
  const low = raw.toLowerCase();
  if (low === "manual" || low === "registo_manual") return "Manual";
  if (low === "scan" || low === "") return "Scan";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
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
    a.id,
    a.nome,
    a.hostname,
    a.ip,
    a.endereco_ip,
    a.mac_address,
    a.numero_serie,
    a.marca,
    a.modelo,
    a.sistema_operativo,
    a.estado,
    a.localizacao_nome,
    a.utilizador_responsavel_nome,
    a.origem_registo,
    a.criado_em,
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

function invKey(grupo) {
  return String(grupo?.inventario_id ?? "");
}

function estadosUnicosDeAtivos(ativos) {
  const s = new Set();
  (ativos || []).forEach((a) => {
    const e = String(a?.estado || "").trim();
    if (e) s.add(e);
  });
  return [...s].sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));
}

function estadoPillClass(estadoRaw) {
  const e = String(estadoRaw || "").toLowerCase();
  if (e.includes("ativ")) return "computadores-estado-pill--ok";
  if (e.includes("inativ")) return "computadores-estado-pill--warn";
  if (e.includes("manut") || e.includes("pend")) return "computadores-estado-pill--pend";
  if (e.includes("erro") || e.includes("offline")) return "computadores-estado-pill--off";
  return "computadores-estado-pill--muted";
}

const LINHAS_POR_PAGINA = 10;

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
  onNavigateTab,
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [scanEditorOpen, setScanEditorOpen] = useState(false);
  const [scanForm, setScanForm] = useState(emptyScanForm);
  const [pesquisaLista, setPesquisaLista] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos"); // todos | manuais | scan
  const [filtroEstadoGlobal, setFiltroEstadoGlobal] = useState("");
  const [invQ, setInvQ] = useState({});
  const [invEst, setInvEst] = useState({});
  const [invPage, setInvPage] = useState({});

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

  const estadosGlobaisOpcoes = useMemo(() => {
    const s = new Set();
    for (const g of gruposOrdenados) {
      (g.ativos || []).forEach((a) => {
        const e = String(a?.estado || "").trim();
        if (e) s.add(e);
      });
    }
    return [...s].sort((a, b) => a.localeCompare(b, "pt", { sensitivity: "base" }));
  }, [gruposOrdenados]);

  const qLista = pesquisaLista.trim().toLowerCase();

  const gruposExibicao = useMemo(() => {
    return gruposOrdenados.filter((g) => {
      const todosBase = g.ativos || [];
      const todosAt = filtroEstadoGlobal
        ? todosBase.filter(
            (x) => String(x.estado || "").toLowerCase() === filtroEstadoGlobal.toLowerCase(),
          )
        : todosBase;
      const nReg = todosAt.filter((x) => x.tipo === "computador").length;
      const nScan = todosAt.filter((x) => x.tipo === "dispositivo_descoberto").length;
      if (filtroTipo === "manuais" && nReg === 0) return false;
      if (filtroTipo === "scan" && nScan === 0) return false;
      if (qLista === "") return true;
      return inventarioCoincideNome(g, qLista) || inventarioTemAtivoCoincidente({ ...g, ativos: todosAt }, qLista);
    });
  }, [gruposOrdenados, filtroTipo, qLista, filtroEstadoGlobal]);

  const totaisFiltrados = useMemo(() => {
    let registos = 0;
    let scan = 0;
    for (const g of gruposExibicao) {
      const todosBase = g.ativos || [];
      const at = filtroEstadoGlobal
        ? todosBase.filter(
            (x) => String(x.estado || "").toLowerCase() === filtroEstadoGlobal.toLowerCase(),
          )
        : todosBase;
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
  }, [gruposExibicao, qLista, filtroTipo, filtroEstadoGlobal]);

  const filtroActivo = qLista !== "" || filtroTipo !== "todos" || Boolean(filtroEstadoGlobal);

  function irParaInventario(id) {
    if (!id) return;
    const el = document.getElementById(`computadores-inv-card-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function limparFiltrosLista() {
    setPesquisaLista("");
    setFiltroTipo("todos");
    setFiltroEstadoGlobal("");
    setInvQ({});
    setInvEst({});
    setInvPage({});
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
      subtitle="Equipamentos agrupados por inventário — dados da base (manual e scan)."
      rightAction={
        isAdmin ? (
          <Button
            type="button"
            variant="contained"
            color="primary"
            startIcon={<span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>add</span>}
            onClick={openCreate}
          >
            Novo computador
          </Button>
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
                  <TextField
                    type="search"
                    size="small"
                    fullWidth
                    placeholder="Pesquisar por nome, hostname, IP, MAC ou série…"
                    value={pesquisaLista}
                    onChange={(e) => setPesquisaLista(e.target.value)}
                    autoComplete="off"
                    aria-label="Pesquisar na lista"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <span className="material-symbols-outlined computadores-search-field-icon" aria-hidden>
                            search
                          </span>
                        </InputAdornment>
                      ),
                    }}
                  />
                </div>
                {pesquisaLista ? (
                  <Button type="button" variant="outlined" size="small" onClick={() => setPesquisaLista("")}>
                    Limpar
                  </Button>
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
                  <TextField
                    select
                    size="small"
                    label="Estado"
                    value={filtroEstadoGlobal}
                    onChange={(e) => setFiltroEstadoGlobal(e.target.value)}
                    disabled={gruposOrdenados.length === 0}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {estadosGlobaisOpcoes.map((est) => (
                      <MenuItem key={est} value={est}>
                        {est}
                      </MenuItem>
                    ))}
                  </TextField>
                  <label className="computadores-jump-compact">
                    <span className="computadores-jump-compact-label">Ir para</span>
                    <TextField
                      select
                      size="small"
                      value=""
                      disabled={gruposExibicao.length === 0}
                      sx={{ minWidth: 180 }}
                      onChange={(e) => {
                        irParaInventario(e.target.value);
                      }}
                    >
                      <MenuItem value="" disabled>
                        {gruposExibicao.length === 0 ? "Sem resultados" : "Inventário…"}
                      </MenuItem>
                      {gruposExibicao.map((g) => (
                        <MenuItem key={g.inventario_id} value={g.inventario_id}>
                          {g.inventario_nome}
                        </MenuItem>
                      ))}
                    </TextField>
                  </label>
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

          <div className="computadores-por-inv-grid">
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
                <Button type="button" variant="contained" onClick={limparFiltrosLista}>
                  Repor pesquisa e filtros
                </Button>
              </div>
            ) : (
              gruposExibicao.map((grupo, idxInv) => {
              const k = invKey(grupo);
              let todosBase = grupo.ativos || [];
              if (filtroEstadoGlobal) {
                todosBase = todosBase.filter(
                  (x) => String(x.estado || "").toLowerCase() === filtroEstadoGlobal.toLowerCase(),
                );
              }
              const todos = todosBase;
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
              const linhasBaseCard = linhasEquipamentosUnificadas(registos, scans);
              const estadosCard = estadosUnicosDeAtivos(linhasBaseCard);
              let linhasUnificadas = linhasBaseCard;
              const qInv = (invQ[k] || "").trim().toLowerCase();
              const estInv = invEst[k] || "";
              if (qInv) {
                linhasUnificadas = linhasUnificadas.filter((a) => textoAtivoBusca(a).includes(qInv));
              }
              if (estInv) {
                linhasUnificadas = linhasUnificadas.filter(
                  (a) => String(a.estado || "").toLowerCase() === estInv.toLowerCase(),
                );
              }
              const totalLinhas = linhasUnificadas.length;
              const maxPag = Math.max(1, Math.ceil(totalLinhas / LINHAS_POR_PAGINA) || 1);
              let pagAtual = invPage[k] || 1;
              if (pagAtual > maxPag) pagAtual = maxPag;
              if (pagAtual < 1) pagAtual = 1;
              const inicio = (pagAtual - 1) * LINHAS_POR_PAGINA;
              const linhasPagina = linhasUnificadas.slice(inicio, inicio + LINHAS_POR_PAGINA);
              const tipoInv =
                grupo.tipo_inventario === "sub_rede" ? "sub_rede" : "normal";

              return (
                <article
                  key={grupo.inventario_id}
                  id={`computadores-inv-card-${grupo.inventario_id}`}
                  className={`computadores-inv-card computadores-inv-card--${tipoInv}`}
                >
                  <header className="computadores-inv-card-header">
                    <div className="computadores-inv-card-head-main">
                      <span className="computadores-inv-card-folder material-symbols-outlined" aria-hidden>
                        folder
                      </span>
                      <div className="computadores-inv-card-head-text">
                        <div className="computadores-inv-card-title-row">
                          <h3 className="computadores-inv-card-title">{grupo.inventario_nome}</h3>
                          <span className="pill badge-info">{tipoInvLabel(grupo.tipo_inventario)}</span>
                          <span className="computadores-inv-card-index">#{idxInv + 1}</span>
                        </div>
                        <dl className="computadores-inv-kpis computadores-inv-kpis--inline">
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
                      </div>
                    </div>
                    <button
                      type="button"
                      className="computadores-inv-card-link"
                      onClick={() => onNavigateTab?.("inventarios")}
                    >
                      Abrir inventários
                      <span className="material-symbols-outlined" aria-hidden>
                        open_in_new
                      </span>
                    </button>
                  </header>

                  {nTot === 0 ? (
                    <p className="cell-muted computadores-inv-empty">Nenhum equipamento neste inventário.</p>
                  ) : (
                    <div className="computadores-inv-card-body">
                      <div className="computadores-inv-card-toolbar">
                        <TextField
                          type="search"
                          size="small"
                          fullWidth
                          placeholder="Pesquisar neste inventário…"
                          value={invQ[k] || ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            setInvQ((p) => ({ ...p, [k]: v }));
                            setInvPage((p) => ({ ...p, [k]: 1 }));
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <span className="material-symbols-outlined computadores-search-field-icon" aria-hidden>
                                  search
                                </span>
                              </InputAdornment>
                            ),
                          }}
                          sx={{ flex: "1 1 200px", minWidth: 0, maxWidth: "100%" }}
                        />
                        <TextField
                          select
                          size="small"
                          label="Estado"
                          value={estInv}
                          onChange={(e) => {
                            setInvEst((p) => ({ ...p, [k]: e.target.value }));
                            setInvPage((p) => ({ ...p, [k]: 1 }));
                          }}
                          sx={{ minWidth: 140, flex: "0 0 auto", maxWidth: "100%" }}
                        >
                          <MenuItem value="">Todos</MenuItem>
                          {estadosCard.map((est) => (
                            <MenuItem key={est} value={est}>
                              {est}
                            </MenuItem>
                          ))}
                        </TextField>
                        <IconButton size="small" aria-label="Filtros do inventário" disabled title="Filtro local">
                          <span className="material-symbols-outlined">filter_list</span>
                        </IconButton>
                      </div>

                      <div className="table-shell computadores-detalhe-table computadores-detalhe-table--unified computadores-inv-table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Equipamento</th>
                              <th>Hostname</th>
                              <th>IP</th>
                              <th>MAC</th>
                              <th>Marca</th>
                              <th>Modelo</th>
                              <th>N.º série</th>
                              <th>Sistema</th>
                              <th>Origem</th>
                              <th>Origem registo</th>
                              <th>Primeira vista</th>
                              <th>Estado</th>
                              <th>Localiz.</th>
                              <th>Resp.</th>
                              <th>Última atualização</th>
                              <th className="th-actions">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {linhasPagina.map((a) => (
                              <tr
                                key={a.tipo === "computador" ? `pc-${a.id}` : `scan-${a.id}`}
                                className={
                                  origemRegistoVisual(a) === "manual"
                                    ? "computadores-row--manual"
                                    : "computadores-row--scan"
                                }
                              >
                                <td className="cell-mono">{a.id != null ? String(a.id) : "—"}</td>
                                <td className="computadores-cell-equip">
                                  <span className="material-symbols-outlined computadores-cell-equip-ic" aria-hidden>
                                    computer
                                  </span>
                                  <div>
                                    <span className="cell-title">
                                      {a.tipo === "computador" ? dash(a.nome) : labelAtivo(a)}
                                    </span>
                                    {a.hostname ? (
                                      <span className="computadores-cell-equip-sub">{dash(a.hostname)}</span>
                                    ) : null}
                                  </div>
                                </td>
                                <td className="cell-mono">{dash(a.hostname)}</td>
                                <td className="cell-mono">{dash(a.ip || a.endereco_ip)}</td>
                                <td className="cell-mono">{dash(a.mac_address)}</td>
                                <td>{dash(a.marca)}</td>
                                <td>{dash(a.modelo)}</td>
                                <td className="cell-mono">{dash(a.numero_serie)}</td>
                                <td>{dash(a.sistema_operativo)}</td>
                                <td>
                                  <span
                                    className={
                                      origemRegistoVisual(a) === "manual"
                                        ? "computadores-origem computadores-origem--manual"
                                        : "computadores-origem computadores-origem--scan"
                                    }
                                  >
                                    {etiquetaOrigemAmigavel(a)}
                                  </span>
                                </td>
                                <td className="cell-muted cell-mono">
                                  {a.tipo === "dispositivo_descoberto" ? dash(a.origem_registo) : "—"}
                                </td>
                                <td className="cell-muted cell-nowrap">
                                  {a.tipo === "dispositivo_descoberto" ? fmtUltimaSinc(a.criado_em) : "—"}
                                </td>
                                <td>
                                  <span className={`computadores-estado-pill ${estadoPillClass(a.estado)}`}>
                                    <span className="computadores-estado-dot" aria-hidden />
                                    {dash(a.estado)}
                                  </span>
                                </td>
                                <td>{a.tipo === "computador" ? dash(a.localizacao_nome) : "—"}</td>
                                <td>{a.tipo === "computador" ? dash(a.utilizador_responsavel_nome) : "—"}</td>
                                <td className="cell-muted cell-nowrap">
                                  {a.tipo === "dispositivo_descoberto"
                                    ? fmtUltimaSinc(a.ultima_vez_ativo_em)
                                    : "—"}
                                </td>
                                <td>
                                  {isAdmin ? (
                                    a.tipo === "computador" ? (
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
                                    )
                                  ) : (
                                    <span className="cell-muted">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {totalLinhas > 0 ? (
                        <footer className="computadores-inv-pagination">
                          <Typography variant="caption" color="text.secondary">
                            Linhas por página {LINHAS_POR_PAGINA} ·{" "}
                            {totalLinhas === 0
                              ? "0"
                              : `${inicio + 1}-${Math.min(inicio + LINHAS_POR_PAGINA, totalLinhas)}`}{" "}
                            de {totalLinhas}
                          </Typography>
                          <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
                            <Button
                              type="button"
                              size="small"
                              variant="outlined"
                              disabled={pagAtual <= 1}
                              onClick={() => setInvPage((p) => ({ ...p, [k]: Math.max(1, (p[k] || 1) - 1) }))}
                            >
                              Anterior
                            </Button>
                            <Button
                              type="button"
                              size="small"
                              variant="outlined"
                              disabled={pagAtual >= Math.ceil(totalLinhas / LINHAS_POR_PAGINA)}
                              onClick={() =>
                                setInvPage((p) => ({
                                  ...p,
                                  [k]: Math.min(
                                    Math.max(1, Math.ceil(totalLinhas / LINHAS_POR_PAGINA)),
                                    (p[k] || 1) + 1,
                                  ),
                                }))
                              }
                            >
                              Seguinte
                            </Button>
                          </Box>
                        </footer>
                      ) : null}
                    </div>
                  )}
                </article>
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
              <Button type="button" variant="outlined" onClick={closeEditor}>
                Cancelar
              </Button>
              {editorMode === "edit" ? (
                <>
                  <Button type="button" color="error" variant="outlined" onClick={handleDeleteInModal}>
                    Apagar
                  </Button>
                  <Button type="button" variant="outlined" onClick={handleUpdatePatch}>
                    Guardar apenas alterações (PATCH)
                  </Button>
                  <Button type="button" onClick={handleUpdatePut}>
                    Substituir registo (PUT)
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={handleCreate}>
                  Criar computador
                </Button>
              )}
            </>
          }
        >
          <Stack spacing={1.2}>
            <TextField
              label="Nome"
              placeholder="Identificação do equipamento"
              value={computadorForm.nome}
              onChange={(e) => setComputadorForm((p) => ({ ...p, nome: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Estado"
              placeholder="ativo, manutenção, …"
              value={computadorForm.estado}
              onChange={(e) => setComputadorForm((p) => ({ ...p, estado: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Marca"
              placeholder="Marca"
              value={computadorForm.marca}
              onChange={(e) => setComputadorForm((p) => ({ ...p, marca: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Modelo"
              placeholder="Modelo"
              value={computadorForm.modelo}
              onChange={(e) => setComputadorForm((p) => ({ ...p, modelo: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Número de série"
              placeholder="S/N ou etiqueta"
              value={computadorForm.numero_serie}
              onChange={(e) => setComputadorForm((p) => ({ ...p, numero_serie: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Hostname (rede)"
              placeholder="Ex.: PC-LAB-03"
              value={computadorForm.hostname}
              onChange={(e) => setComputadorForm((p) => ({ ...p, hostname: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Endereço IP"
              placeholder="Ex.: 192.168.1.10"
              value={computadorForm.endereco_ip}
              onChange={(e) => setComputadorForm((p) => ({ ...p, endereco_ip: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="MAC"
              placeholder="Ex.: AA:BB:CC:DD:EE:FF"
              value={computadorForm.mac_address}
              onChange={(e) => setComputadorForm((p) => ({ ...p, mac_address: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Sistema operativo"
              placeholder="Ex.: Windows 11 Pro"
              value={computadorForm.sistema_operativo}
              onChange={(e) => setComputadorForm((p) => ({ ...p, sistema_operativo: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              select
              label="Inventário"
              value={computadorForm.inventario_id}
              onChange={(e) => setComputadorForm((p) => ({ ...p, inventario_id: e.target.value }))}
              size="small"
              fullWidth
            >
              <MenuItem value="">Escolhe inventário…</MenuItem>
              {inventarios.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.nome}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Localização (opcional)"
              value={computadorForm.localizacao_id}
              onChange={(e) => setComputadorForm((p) => ({ ...p, localizacao_id: e.target.value }))}
              size="small"
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {localizacoes.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.nome}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Responsável (opcional)"
              value={computadorForm.utilizador_responsavel_id}
              onChange={(e) =>
                setComputadorForm((p) => ({ ...p, utilizador_responsavel_id: e.target.value }))
              }
              size="small"
              fullWidth
            >
              <MenuItem value="">—</MenuItem>
              {utilizadores.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.nome}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
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
              <Button type="button" variant="outlined" onClick={closeScanEditor}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void handleScanSave()}>
                Guardar alterações
              </Button>
            </>
          }
        >
          <Stack spacing={1.2}>
            <TextField
              label="Endereço IP *"
              placeholder="192.168.x.x"
              value={scanForm.ip}
              onChange={(e) => setScanForm((p) => ({ ...p, ip: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Estado *"
              placeholder="ativo, inativo…"
              value={scanForm.estado}
              onChange={(e) => setScanForm((p) => ({ ...p, estado: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Hostname"
              value={scanForm.hostname}
              onChange={(e) => setScanForm((p) => ({ ...p, hostname: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="MAC"
              placeholder="AA:BB:CC:DD:EE:FF"
              value={scanForm.mac_address}
              onChange={(e) => setScanForm((p) => ({ ...p, mac_address: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Marca"
              value={scanForm.marca}
              onChange={(e) => setScanForm((p) => ({ ...p, marca: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Modelo"
              value={scanForm.modelo}
              onChange={(e) => setScanForm((p) => ({ ...p, modelo: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="N.º série"
              value={scanForm.numero_serie}
              onChange={(e) => setScanForm((p) => ({ ...p, numero_serie: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              label="Sistema operativo"
              value={scanForm.sistema_operativo}
              onChange={(e) => setScanForm((p) => ({ ...p, sistema_operativo: e.target.value }))}
              size="small"
              fullWidth
            />
          </Stack>
        </FormModal>
        </>
      ) : null}
    </SectionCard>
  );
}
