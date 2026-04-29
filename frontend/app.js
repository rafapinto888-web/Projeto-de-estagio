const state = {
  apiBase: localStorage.getItem("apiBase") || "http://127.0.0.1:8000",
  inventarioId: null,
  ativos: [],
  activeTab: "tab-inventarios",
};

const el = {
  apiBase: document.getElementById("apiBase"),
  saveApiBase: document.getElementById("saveApiBase"),
  testApi: document.getElementById("testApi"),
  globalStatus: document.getElementById("globalStatus"),
  apiStatus: document.getElementById("apiStatus"),
  selectedStatus: document.getElementById("selectedStatus"),
  inventarioForm: document.getElementById("inventarioForm"),
  invNome: document.getElementById("invNome"),
  invTipo: document.getElementById("invTipo"),
  invRede: document.getElementById("invRede"),
  invDesc: document.getElementById("invDesc"),
  inventariosList: document.getElementById("inventariosList"),
  reloadInventarios: document.getElementById("reloadInventarios"),
  inventarioSelecionado: document.getElementById("inventarioSelecionado"),
  termoPesquisa: document.getElementById("termoPesquisa"),
  filtroTipo: document.getElementById("filtroTipo"),
  filtroEstado: document.getElementById("filtroEstado"),
  btnPesquisar: document.getElementById("btnPesquisar"),
  btnLimparFiltros: document.getElementById("btnLimparFiltros"),
  redeScan: document.getElementById("redeScan"),
  btnScan: document.getElementById("btnScan"),
  scanInfo: document.getElementById("scanInfo"),
  ativosTableBody: document.getElementById("ativosTableBody"),
  kpiTotal: document.getElementById("kpiTotal"),
  kpiComputadores: document.getElementById("kpiComputadores"),
  kpiDescobertos: document.getElementById("kpiDescobertos"),
  kpiInativos: document.getElementById("kpiInativos"),
  logComputadorId: document.getElementById("logComputadorId"),
  logNome: document.getElementById("logNome"),
  logSerie: document.getElementById("logSerie"),
  logHostname: document.getElementById("logHostname"),
  logTipo: document.getElementById("logTipo"),
  btnBuscarLogs: document.getElementById("btnBuscarLogs"),
  logsOutput: document.getElementById("logsOutput"),
  tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
  tabPanels: Array.from(document.querySelectorAll(".tab-panel")),
};

el.apiBase.value = state.apiBase;

function api(path) {
  return `${state.apiBase}${path}`;
}

function setGlobalStatus(text, level = "ok") {
  el.globalStatus.className = `status ${level}`;
  el.globalStatus.textContent = text;
}

function activateTab(tabId) {
  state.activeTab = tabId;
  el.tabButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabId);
  });
  el.tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
}

async function req(path, options) {
  const res = await fetch(api(path), options);
  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      msg = body.detail || JSON.stringify(body);
    } catch {
      // ignore
    }
    throw new Error(msg);
  }
  return res.json();
}

function setScanInfo(message, isError = false) {
  el.scanInfo.style.color = isError ? "#b42318" : "#2f5be7";
  el.scanInfo.textContent = message;
  setGlobalStatus(isError ? "Erro" : "OK", isError ? "err" : "ok");
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("pt-PT");
}

function formatTipo(value) {
  if (value === "computador") return "Computador";
  if (value === "dispositivo_descoberto") return "Descoberto";
  return value || "-";
}

function formatEstado(value) {
  const estado = (value || "").toLowerCase();
  if (estado === "ativo") return '<span class="chip chip-ok">ativo</span>';
  if (estado === "inativo") return '<span class="chip chip-warn">inativo</span>';
  return "-";
}

function applyFilters(data) {
  const termo = el.termoPesquisa.value.trim().toLowerCase();
  const tipo = el.filtroTipo.value;
  const estado = el.filtroEstado.value;

  return data.filter((item) => {
    const texto = [
      item.tipo,
      item.nome,
      item.hostname,
      item.ip,
      item.numero_serie,
      item.estado,
      item.marca,
      item.modelo,
      item.localizacao_nome,
      item.utilizador_responsavel_nome,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (termo && !texto.includes(termo)) return false;
    if (tipo && item.tipo !== tipo) return false;
    if (estado && (item.estado || "").toLowerCase() !== estado) return false;
    return true;
  });
}

function updateKpis(data) {
  const total = data.length;
  const computadores = data.filter((x) => x.tipo === "computador").length;
  const descobertos = data.filter((x) => x.tipo === "dispositivo_descoberto").length;
  const inativos = data.filter((x) => (x.estado || "").toLowerCase() === "inativo").length;
  el.kpiTotal.textContent = `Total: ${total}`;
  el.kpiComputadores.textContent = `Computadores: ${computadores}`;
  el.kpiDescobertos.textContent = `Descobertos: ${descobertos}`;
  el.kpiInativos.textContent = `Inativos: ${inativos}`;
}

function renderAtivos(ativos) {
  el.ativosTableBody.innerHTML = "";
  updateKpis(ativos);
  ativos.forEach((a) => {
    const ultimaVez = (a.tipo === "dispositivo_descoberto" && (a.estado || "").toLowerCase() === "inativo")
      ? formatDateTime(a.ultima_vez_ativo_em)
      : "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${formatTipo(a.tipo)}</td>
      <td>${a.nome || a.hostname || "-"}</td>
      <td>${a.ip || "-"}</td>
      <td>${a.numero_serie || "-"}</td>
      <td>${formatEstado(a.estado)}</td>
      <td>${ultimaVez}</td>
      <td>${a.marca || "-"}</td>
      <td>${a.modelo || "-"}</td>
      <td>${a.localizacao_nome || "-"}</td>
      <td>${a.utilizador_responsavel_nome || "-"}</td>
    `;
    el.ativosTableBody.appendChild(tr);
  });
}

async function carregarInventarios() {
  setGlobalStatus("A carregar...", "warn");
  const invs = await req("/inventarios/");
  el.inventariosList.innerHTML = "";
  invs.forEach((inv) => {
    const btn = document.createElement("button");
    btn.className = `inv-chip ${state.inventarioId === inv.id ? "active" : ""}`;
    btn.textContent = `${inv.id} - ${inv.nome} (${inv.tipo_inventario})`;
    btn.onclick = async () => {
      state.inventarioId = inv.id;
      el.inventarioSelecionado.textContent = `Inventario: ${inv.nome} (id ${inv.id})`;
      el.selectedStatus.textContent = `Selecionado: ${inv.nome} [${inv.tipo_inventario}]`;
      await carregarInventarios();
      await carregarAtivos();
    };
    el.inventariosList.appendChild(btn);
  });
  if (!state.inventarioId && invs.length) {
    state.inventarioId = invs[0].id;
    el.inventarioSelecionado.textContent = `Inventario: ${invs[0].nome} (id ${invs[0].id})`;
    el.selectedStatus.textContent = `Selecionado: ${invs[0].nome} [${invs[0].tipo_inventario}]`;
  }
  setGlobalStatus("Pronto", "ok");
}

async function carregarAtivos() {
  if (!state.inventarioId) return;
  const ativos = await req(`/inventarios/${state.inventarioId}/computadores`);
  state.ativos = ativos;
  renderAtivos(applyFilters(state.ativos));
}

async function pesquisar() {
  if (!state.inventarioId) {
    setScanInfo("Seleciona um inventario primeiro.", true);
    return;
  }
  renderAtivos(applyFilters(state.ativos));
}

async function executarScan() {
  if (!state.inventarioId) {
    setScanInfo("Seleciona um inventario primeiro.", true);
    return;
  }
  el.btnScan.disabled = true;
  setGlobalStatus("Scan em execucao...", "warn");
  setScanInfo("Scan em execucao...");
  try {
    const body = { rede: el.redeScan.value.trim() || null };
    const out = await req(`/inventarios/${state.inventarioId}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setScanInfo(
      `Scan OK. Dispositivos: ${out.total_dispositivos_encontrados}. Logs recolhidos: ${
        out.total_logs_recolhidos || 0
      }`
    );
    await carregarAtivos();
  } catch (err) {
    setScanInfo(`Erro no scan: ${err.message}`, true);
  } finally {
    el.btnScan.disabled = false;
  }
}

async function criarInventario(ev) {
  ev.preventDefault();
  try {
    const qs = new URLSearchParams({
      nome: el.invNome.value.trim(),
      tipo_inventario: el.invTipo.value,
    });
    if (el.invDesc.value.trim()) qs.set("descricao", el.invDesc.value.trim());
    if (el.invRede.value.trim()) qs.set("rede", el.invRede.value.trim());
    await req(`/inventarios/criar-rapido?${qs.toString()}`, { method: "POST" });
    el.inventarioForm.reset();
    await carregarInventarios();
    await carregarAtivos();
    setScanInfo("Inventario criado com sucesso.");
  } catch (err) {
    setScanInfo(`Erro ao criar inventario: ${err.message}`, true);
  }
}

async function buscarLogs() {
  setGlobalStatus("A carregar logs...", "warn");
  try {
    const qs = new URLSearchParams();
    if (el.logComputadorId.value.trim()) qs.set("computador_id", el.logComputadorId.value.trim());
    if (el.logNome.value.trim()) qs.set("nome", el.logNome.value.trim());
    if (el.logSerie.value.trim()) qs.set("numero_serie", el.logSerie.value.trim());
    if (el.logHostname.value.trim()) qs.set("hostname", el.logHostname.value.trim());
    if (el.logTipo.value) qs.set("tipo_log", el.logTipo.value);
    const data = await req(`/computadores/logs/dispositivo?${qs.toString()}`);
    el.logsOutput.textContent = JSON.stringify(data, null, 2);
    setGlobalStatus("Pronto", "ok");
  } catch (err) {
    el.logsOutput.textContent = `Erro: ${err.message}`;
    setGlobalStatus("Erro", "err");
  }
}

el.saveApiBase.onclick = async () => {
  state.apiBase = el.apiBase.value.trim().replace(/\/$/, "");
  localStorage.setItem("apiBase", state.apiBase);
  await carregarInventarios();
  await carregarAtivos();
  setScanInfo("API Base atualizada.");
};

el.testApi.onclick = async () => {
  try {
    const data = await req("/");
    el.apiStatus.textContent = `API OK: ${JSON.stringify(data)}`;
    setGlobalStatus("API ligada", "ok");
  } catch (err) {
    el.apiStatus.textContent = `API erro: ${err.message}`;
    setGlobalStatus("API em erro", "err");
  }
};

el.tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});

el.reloadInventarios.onclick = async () => {
  await carregarInventarios();
  await carregarAtivos();
};

el.inventarioForm.addEventListener("submit", criarInventario);
el.btnPesquisar.onclick = pesquisar;
el.btnLimparFiltros.onclick = async () => {
  el.termoPesquisa.value = "";
  el.filtroTipo.value = "";
  el.filtroEstado.value = "";
  renderAtivos(state.ativos);
};
el.btnScan.onclick = executarScan;
el.btnBuscarLogs.onclick = buscarLogs;
el.filtroTipo.onchange = pesquisar;
el.filtroEstado.onchange = pesquisar;

(async function init() {
  try {
    activateTab(state.activeTab);
    await carregarInventarios();
    await carregarAtivos();
  } catch (err) {
    setGlobalStatus("Erro ao carregar", "err");
    el.apiStatus.textContent = `Falha inicial: ${err.message}`;
  }
})();
