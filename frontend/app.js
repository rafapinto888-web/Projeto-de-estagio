import { store, setApiBase } from "./js/core/store.js";
import { clear, td, option } from "./js/core/dom.js";
import { http } from "./js/core/http.js";
import { inventariosApi } from "./js/api/inventariosApi.js";
import { computadoresApi } from "./js/api/computadoresApi.js";
import { utilizadoresApi } from "./js/api/utilizadoresApi.js";
import { perfisApi } from "./js/api/perfisApi.js";
import { localizacoesApi } from "./js/api/localizacoesApi.js";
import { pesquisaApi } from "./js/api/pesquisaApi.js";

const el = {
  apiBase: document.getElementById("apiBase"),
  saveApiBase: document.getElementById("saveApiBase"),
  testApi: document.getElementById("testApi"),
  globalStatus: document.getElementById("globalStatus"),
  apiStatus: document.getElementById("apiStatus"),
  selectedInventario: document.getElementById("selectedInventario"),
  tabs: Array.from(document.querySelectorAll(".tab-btn")),
  panels: Array.from(document.querySelectorAll(".panel")),
  kpiInventarios: document.getElementById("kpiInventarios"),
  kpiComputadores: document.getElementById("kpiComputadores"),
  kpiUtilizadores: document.getElementById("kpiUtilizadores"),
  kpiLocalizacoes: document.getElementById("kpiLocalizacoes"),
  inventariosBody: document.getElementById("inventariosBody"),
  inventarioForm: document.getElementById("inventarioForm"),
  invId: document.getElementById("invId"),
  invNome: document.getElementById("invNome"),
  invTipo: document.getElementById("invTipo"),
  invRede: document.getElementById("invRede"),
  invDesc: document.getElementById("invDesc"),
  btnInvUpdate: document.getElementById("btnInvUpdate"),
  btnInvDelete: document.getElementById("btnInvDelete"),
  reloadInventarios: document.getElementById("reloadInventarios"),
  ativoInventarioSelect: document.getElementById("ativoInventarioSelect"),
  ativoPesquisa: document.getElementById("ativoPesquisa"),
  btnAtivoPesquisar: document.getElementById("btnAtivoPesquisar"),
  btnAtivoReload: document.getElementById("btnAtivoReload"),
  scanRede: document.getElementById("scanRede"),
  scanUser: document.getElementById("scanUser"),
  scanPass: document.getElementById("scanPass"),
  btnScan: document.getElementById("btnScan"),
  scanInfo: document.getElementById("scanInfo"),
  ativosBody: document.getElementById("ativosBody"),
  computadorForm: document.getElementById("computadorForm"),
  pcId: document.getElementById("pcId"),
  pcNome: document.getElementById("pcNome"),
  pcMarca: document.getElementById("pcMarca"),
  pcModelo: document.getElementById("pcModelo"),
  pcSerie: document.getElementById("pcSerie"),
  pcEstado: document.getElementById("pcEstado"),
  pcInventarioId: document.getElementById("pcInventarioId"),
  pcLocalizacaoId: document.getElementById("pcLocalizacaoId"),
  pcUtilizadorId: document.getElementById("pcUtilizadorId"),
  btnPcPut: document.getElementById("btnPcPut"),
  btnPcPatch: document.getElementById("btnPcPatch"),
  btnPcDelete: document.getElementById("btnPcDelete"),
  computadoresBody: document.getElementById("computadoresBody"),
  utilizadorForm: document.getElementById("utilizadorForm"),
  utId: document.getElementById("utId"),
  utNome: document.getElementById("utNome"),
  utUsername: document.getElementById("utUsername"),
  utEmail: document.getElementById("utEmail"),
  utPerfilId: document.getElementById("utPerfilId"),
  utPassword: document.getElementById("utPassword"),
  btnUtUpdate: document.getElementById("btnUtUpdate"),
  btnUtDelete: document.getElementById("btnUtDelete"),
  utilizadoresBody: document.getElementById("utilizadoresBody"),
  perfilForm: document.getElementById("perfilForm"),
  pfId: document.getElementById("pfId"),
  pfNome: document.getElementById("pfNome"),
  pfDesc: document.getElementById("pfDesc"),
  btnPfUpdate: document.getElementById("btnPfUpdate"),
  btnPfDelete: document.getElementById("btnPfDelete"),
  perfisBody: document.getElementById("perfisBody"),
  localizacaoForm: document.getElementById("localizacaoForm"),
  lcId: document.getElementById("lcId"),
  lcNome: document.getElementById("lcNome"),
  lcDesc: document.getElementById("lcDesc"),
  btnLcUpdate: document.getElementById("btnLcUpdate"),
  btnLcDelete: document.getElementById("btnLcDelete"),
  localizacoesBody: document.getElementById("localizacoesBody"),
  globalTermo: document.getElementById("globalTermo"),
  btnGlobalSearch: document.getElementById("btnGlobalSearch"),
  globalOutput: document.getElementById("globalOutput"),
  logComputadorId: document.getElementById("logComputadorId"),
  logNome: document.getElementById("logNome"),
  logSerie: document.getElementById("logSerie"),
  logHostname: document.getElementById("logHostname"),
  logTipo: document.getElementById("logTipo"),
  btnLogsComputador: document.getElementById("btnLogsComputador"),
  logInvId: document.getElementById("logInvId"),
  logDispId: document.getElementById("logDispId"),
  logInvTipo: document.getElementById("logInvTipo"),
  logColetarAgora: document.getElementById("logColetarAgora"),
  btnLogsInventario: document.getElementById("btnLogsInventario"),
  logsOutput: document.getElementById("logsOutput"),
};

el.apiBase.value = store.apiBase;

function setStatus(text, level = "ok") {
  el.globalStatus.className = `status ${level}`;
  el.globalStatus.textContent = text;
}

function selectedInventarioId() {
  return Number(el.ativoInventarioSelect.value || "0") || null;
}

function setSelectedInventarioLabel() {
  const id = selectedInventarioId();
  store.selectedInventarioId = id;
  el.selectedInventario.textContent = id ? `Inventario: ${id}` : "Inventario: nenhum";
}

function activateTab(tabName) {
  el.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  el.panels.forEach((panel) => panel.classList.toggle("active", panel.id === `panel-${tabName}`));
}

function toNullableInt(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function showJson(target, data) {
  target.textContent = JSON.stringify(data, null, 2);
}

function activeStatusChip(state) {
  const span = document.createElement("span");
  const st = (state || "").toLowerCase();
  span.className = `chip ${st === "ativo" ? "chip-ok" : st === "inativo" ? "chip-warn" : ""}`;
  span.textContent = state || "-";
  return span;
}

function formatDate(v) {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString("pt-PT");
}

async function refreshInventarios() {
  const inventarios = await inventariosApi.list();
  clear(el.inventariosBody);
  clear(el.ativoInventarioSelect);
  el.ativoInventarioSelect.appendChild(option("", "Seleciona inventario"));
  inventarios.forEach((inv) => {
    const tr = document.createElement("tr");
    tr.appendChild(td(String(inv.id)));
    tr.appendChild(td(inv.nome));
    tr.appendChild(td(inv.tipo_inventario));
    tr.appendChild(td(inv.rede || "-"));
    tr.appendChild(td(inv.descricao || "-"));
    el.inventariosBody.appendChild(tr);
    el.ativoInventarioSelect.appendChild(option(String(inv.id), `${inv.id} - ${inv.nome}`));
  });

  if (!store.selectedInventarioId && inventarios.length > 0) {
    store.selectedInventarioId = inventarios[0].id;
  }
  if (store.selectedInventarioId) {
    el.ativoInventarioSelect.value = String(store.selectedInventarioId);
  }
  setSelectedInventarioLabel();
  el.kpiInventarios.textContent = `Inventarios: ${inventarios.length}`;
}

async function refreshComputadores() {
  const pcs = await computadoresApi.list();
  clear(el.computadoresBody);
  pcs.forEach((pc) => {
    const tr = document.createElement("tr");
    tr.appendChild(td(String(pc.id)));
    tr.appendChild(td(pc.nome));
    tr.appendChild(td(pc.numero_serie));
    tr.appendChild(td(pc.inventario_nome || String(pc.inventario_id)));
    tr.appendChild(td(pc.localizacao_nome || "-"));
    tr.appendChild(td(pc.utilizador_responsavel_nome || "-"));
    el.computadoresBody.appendChild(tr);
  });
  el.kpiComputadores.textContent = `Computadores: ${pcs.length}`;
}

async function refreshUtilizadores() {
  const uts = await utilizadoresApi.list();
  clear(el.utilizadoresBody);
  uts.forEach((u) => {
    const tr = document.createElement("tr");
    tr.appendChild(td(String(u.id)));
    tr.appendChild(td(u.nome));
    tr.appendChild(td(u.username));
    tr.appendChild(td(u.email));
    tr.appendChild(td(String(u.perfil_id)));
    el.utilizadoresBody.appendChild(tr);
  });
  el.kpiUtilizadores.textContent = `Utilizadores: ${uts.length}`;
}

async function refreshPerfis() {
  const perfis = await perfisApi.list();
  clear(el.perfisBody);
  perfis.forEach((p) => {
    const tr = document.createElement("tr");
    tr.appendChild(td(String(p.id)));
    tr.appendChild(td(p.nome));
    tr.appendChild(td(p.descricao || "-"));
    el.perfisBody.appendChild(tr);
  });
}

async function refreshLocalizacoes() {
  const locs = await localizacoesApi.list();
  clear(el.localizacoesBody);
  locs.forEach((l) => {
    const tr = document.createElement("tr");
    tr.appendChild(td(String(l.id)));
    tr.appendChild(td(l.nome));
    tr.appendChild(td(l.descricao || "-"));
    el.localizacoesBody.appendChild(tr);
  });
  el.kpiLocalizacoes.textContent = `Localizacoes: ${locs.length}`;
}

async function refreshAtivos() {
  const invId = selectedInventarioId();
  if (!invId) return;
  const ativos = await inventariosApi.listAtivos(invId);
  clear(el.ativosBody);
  ativos.forEach((a) => {
    const tr = document.createElement("tr");
    tr.appendChild(td(a.tipo));
    tr.appendChild(td(a.nome || a.hostname || "-"));
    tr.appendChild(td(a.ip || "-"));
    tr.appendChild(td(a.numero_serie || "-"));
    const cellEstado = document.createElement("td");
    cellEstado.appendChild(activeStatusChip(a.estado));
    tr.appendChild(cellEstado);
    tr.appendChild(td(a.estado === "inativo" ? formatDate(a.ultima_vez_ativo_em) : "-"));
    tr.appendChild(td(a.marca || "-"));
    tr.appendChild(td(a.modelo || "-"));
    el.ativosBody.appendChild(tr);
  });
}

async function handleInventarioCreate(ev) {
  ev.preventDefault();
  try {
    await inventariosApi.create({
      nome: el.invNome.value.trim(),
      descricao: el.invDesc.value.trim() || null,
      tipo_inventario: el.invTipo.value,
      rede: el.invRede.value.trim() || null,
    });
    await refreshInventarios();
    setStatus("Inventario criado", "ok");
  } catch (err) {
    setStatus(`Erro inventario: ${err.message}`, "err");
  }
}

async function handleInventarioUpdate() {
  const id = toNullableInt(el.invId.value);
  if (!id) return setStatus("Indica invId", "warn");
  try {
    await inventariosApi.update(id, {
      nome: el.invNome.value.trim(),
      descricao: el.invDesc.value.trim() || null,
      tipo_inventario: el.invTipo.value,
      rede: el.invRede.value.trim() || null,
    });
    await refreshInventarios();
    setStatus("Inventario atualizado", "ok");
  } catch (err) {
    setStatus(`Erro update inventario: ${err.message}`, "err");
  }
}

async function handleInventarioDelete() {
  const id = toNullableInt(el.invId.value);
  if (!id) return setStatus("Indica invId", "warn");
  if (!window.confirm(`Apagar inventario ${id}?`)) return;
  try {
    await inventariosApi.remove(id);
    await refreshInventarios();
    setStatus("Inventario apagado", "ok");
  } catch (err) {
    setStatus(`Erro apagar inventario: ${err.message}`, "err");
  }
}

async function handleScan() {
  const id = selectedInventarioId();
  if (!id) return setStatus("Seleciona inventario para scan", "warn");
  try {
    el.btnScan.disabled = true;
    setStatus("Scan em execucao...", "warn");
    const out = await inventariosApi.scan(id, {
      rede: el.scanRede.value.trim() || null,
      utilizador: el.scanUser.value.trim() || null,
      password: el.scanPass.value || null,
    });
    el.scanInfo.textContent = `Scan OK: ${out.total_dispositivos_encontrados} dispositivos, ${out.total_logs_recolhidos} logs`;
    await refreshAtivos();
    setStatus("Scan concluido", "ok");
  } catch (err) {
    el.scanInfo.textContent = `Erro no scan: ${err.message}`;
    setStatus("Scan falhou", "err");
  } finally {
    el.btnScan.disabled = false;
  }
}

async function handleAtivoPesquisar() {
  const id = selectedInventarioId();
  if (!id) return setStatus("Seleciona inventario", "warn");
  try {
    const data = await inventariosApi.searchAtivos(id, el.ativoPesquisa.value.trim());
    clear(el.ativosBody);
    const todos = [...data.computadores, ...data.dispositivos_descobertos];
    todos.forEach((a) => {
      const tr = document.createElement("tr");
      tr.appendChild(td(a.tipo));
      tr.appendChild(td(a.nome || a.hostname || "-"));
      tr.appendChild(td(a.ip || "-"));
      tr.appendChild(td(a.numero_serie || "-"));
      const c = document.createElement("td");
      c.appendChild(activeStatusChip(a.estado));
      tr.appendChild(c);
      tr.appendChild(td(a.ultima_vez_ativo_em || "-"));
      tr.appendChild(td(a.marca || "-"));
      tr.appendChild(td(a.modelo || "-"));
      el.ativosBody.appendChild(tr);
    });
    setStatus("Pesquisa no inventario concluida", "ok");
  } catch (err) {
    setStatus(`Erro pesquisa inventario: ${err.message}`, "err");
  }
}

function buildComputadorPayload(full = true) {
  const base = {
    nome: el.pcNome.value.trim(),
    marca: el.pcMarca.value.trim(),
    modelo: el.pcModelo.value.trim(),
    numero_serie: el.pcSerie.value.trim(),
    estado: el.pcEstado.value.trim(),
    inventario_id: toNullableInt(el.pcInventarioId.value),
    localizacao_id: toNullableInt(el.pcLocalizacaoId.value),
    utilizador_responsavel_id: toNullableInt(el.pcUtilizadorId.value),
  };
  if (full) return base;
  const out = {};
  Object.entries(base).forEach(([k, v]) => {
    if (v !== null && v !== "") out[k] = v;
  });
  return out;
}

async function handlePcCreate(ev) {
  ev.preventDefault();
  try {
    await computadoresApi.create(buildComputadorPayload(true));
    await refreshComputadores();
    setStatus("Computador criado", "ok");
  } catch (err) {
    setStatus(`Erro criar computador: ${err.message}`, "err");
  }
}

async function handlePcPut() {
  const id = toNullableInt(el.pcId.value);
  if (!id) return setStatus("Indica pcId", "warn");
  try {
    await computadoresApi.replace(id, buildComputadorPayload(true));
    await refreshComputadores();
    setStatus("Computador atualizado (PUT)", "ok");
  } catch (err) {
    setStatus(`Erro PUT computador: ${err.message}`, "err");
  }
}

async function handlePcPatch() {
  const id = toNullableInt(el.pcId.value);
  if (!id) return setStatus("Indica pcId", "warn");
  try {
    await computadoresApi.patch(id, buildComputadorPayload(false));
    await refreshComputadores();
    setStatus("Computador atualizado (PATCH)", "ok");
  } catch (err) {
    setStatus(`Erro PATCH computador: ${err.message}`, "err");
  }
}

async function handlePcDelete() {
  const id = toNullableInt(el.pcId.value);
  if (!id) return setStatus("Indica pcId", "warn");
  if (!window.confirm(`Apagar computador ${id}?`)) return;
  try {
    await computadoresApi.remove(id);
    await refreshComputadores();
    setStatus("Computador apagado", "ok");
  } catch (err) {
    setStatus(`Erro apagar computador: ${err.message}`, "err");
  }
}

async function handleUtilizadorCreate(ev) {
  ev.preventDefault();
  try {
    await utilizadoresApi.create({
      nome: el.utNome.value.trim(),
      username: el.utUsername.value.trim(),
      email: el.utEmail.value.trim(),
      perfil_id: toNullableInt(el.utPerfilId.value),
      palavra_passe: el.utPassword.value || "123456",
    });
    await refreshUtilizadores();
    setStatus("Utilizador criado", "ok");
  } catch (err) {
    setStatus(`Erro criar utilizador: ${err.message}`, "err");
  }
}

async function handleUtilizadorUpdate() {
  const id = toNullableInt(el.utId.value);
  if (!id) return setStatus("Indica utId", "warn");
  try {
    await utilizadoresApi.update(id, {
      nome: el.utNome.value.trim(),
      username: el.utUsername.value.trim(),
      email: el.utEmail.value.trim(),
      perfil_id: toNullableInt(el.utPerfilId.value),
      palavra_passe: el.utPassword.value.trim() || null,
    });
    await refreshUtilizadores();
    setStatus("Utilizador atualizado", "ok");
  } catch (err) {
    setStatus(`Erro atualizar utilizador: ${err.message}`, "err");
  }
}

async function handleUtilizadorDelete() {
  const id = toNullableInt(el.utId.value);
  if (!id) return setStatus("Indica utId", "warn");
  if (!window.confirm(`Apagar utilizador ${id}?`)) return;
  try {
    await utilizadoresApi.remove(id);
    await refreshUtilizadores();
    setStatus("Utilizador apagado", "ok");
  } catch (err) {
    setStatus(`Erro apagar utilizador: ${err.message}`, "err");
  }
}

async function handlePerfilCreate(ev) {
  ev.preventDefault();
  try {
    await perfisApi.create({ nome: el.pfNome.value.trim(), descricao: el.pfDesc.value.trim() || null });
    await refreshPerfis();
    setStatus("Perfil criado", "ok");
  } catch (err) {
    setStatus(`Erro criar perfil: ${err.message}`, "err");
  }
}

async function handlePerfilUpdate() {
  const id = toNullableInt(el.pfId.value);
  if (!id) return setStatus("Indica pfId", "warn");
  try {
    await perfisApi.update(id, { nome: el.pfNome.value.trim(), descricao: el.pfDesc.value.trim() || null });
    await refreshPerfis();
    setStatus("Perfil atualizado", "ok");
  } catch (err) {
    setStatus(`Erro atualizar perfil: ${err.message}`, "err");
  }
}

async function handlePerfilDelete() {
  const id = toNullableInt(el.pfId.value);
  if (!id) return setStatus("Indica pfId", "warn");
  if (!window.confirm(`Apagar perfil ${id}?`)) return;
  try {
    await perfisApi.remove(id);
    await refreshPerfis();
    setStatus("Perfil apagado", "ok");
  } catch (err) {
    setStatus(`Erro apagar perfil: ${err.message}`, "err");
  }
}

async function handleLocalizacaoCreate(ev) {
  ev.preventDefault();
  try {
    await localizacoesApi.create({ nome: el.lcNome.value.trim(), descricao: el.lcDesc.value.trim() || null });
    await refreshLocalizacoes();
    setStatus("Localizacao criada", "ok");
  } catch (err) {
    setStatus(`Erro criar localizacao: ${err.message}`, "err");
  }
}

async function handleLocalizacaoUpdate() {
  const id = toNullableInt(el.lcId.value);
  if (!id) return setStatus("Indica lcId", "warn");
  try {
    await localizacoesApi.update(id, { nome: el.lcNome.value.trim(), descricao: el.lcDesc.value.trim() || null });
    await refreshLocalizacoes();
    setStatus("Localizacao atualizada", "ok");
  } catch (err) {
    setStatus(`Erro atualizar localizacao: ${err.message}`, "err");
  }
}

async function handleLocalizacaoDelete() {
  const id = toNullableInt(el.lcId.value);
  if (!id) return setStatus("Indica lcId", "warn");
  if (!window.confirm(`Apagar localizacao ${id}?`)) return;
  try {
    await localizacoesApi.remove(id);
    await refreshLocalizacoes();
    setStatus("Localizacao apagada", "ok");
  } catch (err) {
    setStatus(`Erro apagar localizacao: ${err.message}`, "err");
  }
}

async function handlePesquisaGlobal() {
  const termo = el.globalTermo.value.trim();
  if (!termo) return setStatus("Indica termo de pesquisa global", "warn");
  try {
    const data = await pesquisaApi.global(termo);
    showJson(el.globalOutput, data);
    setStatus("Pesquisa global concluida", "ok");
  } catch (err) {
    showJson(el.globalOutput, { erro: err.message });
    setStatus("Erro na pesquisa global", "err");
  }
}

async function handleLogsComputador() {
  try {
    const query = {};
    if (el.logComputadorId.value.trim()) query.computador_id = el.logComputadorId.value.trim();
    if (el.logNome.value.trim()) query.nome = el.logNome.value.trim();
    if (el.logSerie.value.trim()) query.numero_serie = el.logSerie.value.trim();
    if (el.logHostname.value.trim()) query.hostname = el.logHostname.value.trim();
    if (el.logTipo.value) query.tipo_log = el.logTipo.value;
    const data = await computadoresApi.logsByFilter(query);
    showJson(el.logsOutput, data);
    setStatus("Logs por computador carregados", "ok");
  } catch (err) {
    showJson(el.logsOutput, { erro: err.message });
    setStatus("Erro nos logs de computador", "err");
  }
}

async function handleLogsInventario() {
  const inventarioId = toNullableInt(el.logInvId.value);
  if (!inventarioId) return setStatus("Indica inventario_id", "warn");
  try {
    const query = {
      coletar_agora: el.logColetarAgora.value,
    };
    if (el.logDispId.value.trim()) query.dispositivo_id = el.logDispId.value.trim();
    if (el.logInvTipo.value) query.tipo_log = el.logInvTipo.value;
    const data = await inventariosApi.logsDispositivos(inventarioId, query);
    showJson(el.logsOutput, data);
    setStatus("Logs por inventario carregados", "ok");
  } catch (err) {
    showJson(el.logsOutput, { erro: err.message });
    setStatus("Erro nos logs de inventario", "err");
  }
}

async function init() {
  try {
    setStatus("A carregar...", "warn");
    await Promise.all([
      refreshInventarios(),
      refreshComputadores(),
      refreshUtilizadores(),
      refreshPerfis(),
      refreshLocalizacoes(),
    ]);
    await refreshAtivos();
    setStatus("Pronto", "ok");
  } catch (err) {
    setStatus(`Falha inicial: ${err.message}`, "err");
  }
}

el.tabs.forEach((tab) => tab.addEventListener("click", () => activateTab(tab.dataset.tab)));

el.saveApiBase.addEventListener("click", async () => {
  setApiBase(el.apiBase.value.trim());
  try {
    await init();
    el.apiStatus.textContent = `API Base atualizada: ${store.apiBase}`;
  } catch (err) {
    el.apiStatus.textContent = `Erro: ${err.message}`;
  }
});

el.testApi.addEventListener("click", async () => {
  try {
    const data = await http("/");
    el.apiStatus.textContent = `API OK: ${JSON.stringify(data)}`;
    setStatus("API ligada", "ok");
  } catch (err) {
    el.apiStatus.textContent = `API erro: ${err.message}`;
    setStatus("API em erro", "err");
  }
});

el.inventarioForm.addEventListener("submit", handleInventarioCreate);
el.btnInvUpdate.addEventListener("click", handleInventarioUpdate);
el.btnInvDelete.addEventListener("click", handleInventarioDelete);
el.reloadInventarios.addEventListener("click", refreshInventarios);
el.ativoInventarioSelect.addEventListener("change", async () => {
  setSelectedInventarioLabel();
  await refreshAtivos();
});
el.btnAtivoReload.addEventListener("click", refreshAtivos);
el.btnAtivoPesquisar.addEventListener("click", handleAtivoPesquisar);
el.btnScan.addEventListener("click", handleScan);

el.computadorForm.addEventListener("submit", handlePcCreate);
el.btnPcPut.addEventListener("click", handlePcPut);
el.btnPcPatch.addEventListener("click", handlePcPatch);
el.btnPcDelete.addEventListener("click", handlePcDelete);

el.utilizadorForm.addEventListener("submit", handleUtilizadorCreate);
el.btnUtUpdate.addEventListener("click", handleUtilizadorUpdate);
el.btnUtDelete.addEventListener("click", handleUtilizadorDelete);

el.perfilForm.addEventListener("submit", handlePerfilCreate);
el.btnPfUpdate.addEventListener("click", handlePerfilUpdate);
el.btnPfDelete.addEventListener("click", handlePerfilDelete);

el.localizacaoForm.addEventListener("submit", handleLocalizacaoCreate);
el.btnLcUpdate.addEventListener("click", handleLocalizacaoUpdate);
el.btnLcDelete.addEventListener("click", handleLocalizacaoDelete);

el.btnGlobalSearch.addEventListener("click", handlePesquisaGlobal);
el.btnLogsComputador.addEventListener("click", handleLogsComputador);
el.btnLogsInventario.addEventListener("click", handleLogsInventario);

init();
