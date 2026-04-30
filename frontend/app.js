import { store, setApiBase } from "./js/core/store.js";
import { clear, td, option } from "./js/core/dom.js";
import { http } from "./js/core/http.js";
import { inventariosApi } from "./js/api/inventariosApi.js";
import { computadoresApi } from "./js/api/computadoresApi.js";
import { utilizadoresApi } from "./js/api/utilizadoresApi.js";
import { perfisApi } from "./js/api/perfisApi.js";
import { localizacoesApi } from "./js/api/localizacoesApi.js";
import { pesquisaApi } from "./js/api/pesquisaApi.js";
import { authApi } from "./js/api/authApi.js";
import { clearSession, isAdmin, isAuthenticated, saveSession } from "./js/core/session.js";

// Referencias de elementos da interface para uso em toda a app.
const el = {
  appRoot: document.getElementById("appRoot"),
  loginScreen: document.getElementById("loginScreen"),
  loginForm: document.getElementById("loginForm"),
  loginIdentificador: document.getElementById("loginIdentificador"),
  loginPassword: document.getElementById("loginPassword"),
  loginError: document.getElementById("loginError"),
  authUser: document.getElementById("authUser"),
  authPerfil: document.getElementById("authPerfil"),
  btnLogout: document.getElementById("btnLogout"),
  apiBase: document.getElementById("apiBase"),
  saveApiBase: document.getElementById("saveApiBase"),
  testApi: document.getElementById("testApi"),
  globalStatus: document.getElementById("globalStatus"),
  apiStatus: document.getElementById("apiStatus"),
  selectedInventario: document.getElementById("selectedInventario"),
  tabs: Array.from(document.querySelectorAll(".tab-btn")),
  panels: Array.from(document.querySelectorAll(".panel")),
  actionRows: Array.from(document.querySelectorAll(".action-row")),
  kpiInventarios: document.getElementById("kpiInventarios"),
  kpiComputadores: document.getElementById("kpiComputadores"),
  kpiUtilizadores: document.getElementById("kpiUtilizadores"),
  kpiLocalizacoes: document.getElementById("kpiLocalizacoes"),
  dashInventariosBody: document.getElementById("dashInventariosBody"),
  dashAtividade: document.getElementById("dashAtividade"),
  btnQuickInventario: document.getElementById("btnQuickInventario"),
  btnGoAtivos: document.getElementById("btnGoAtivos"),
  btnGoInventarios: document.getElementById("btnGoInventarios"),
  btnGoLogs: document.getElementById("btnGoLogs"),
  btnGoComputadores: document.getElementById("btnGoComputadores"),
  btnGoUtilizadores: document.getElementById("btnGoUtilizadores"),
  btnGoPesquisa: document.getElementById("btnGoPesquisa"),
  btnGoLogs2: document.getElementById("btnGoLogs2"),
  inventariosBody: document.getElementById("inventariosBody"),
  inventarioForm: document.getElementById("inventarioForm"),
  invId: document.getElementById("invId"),
  invNome: document.getElementById("invNome"),
  invTipo: document.getElementById("invTipo"),
  invRede: document.getElementById("invRede"),
  invDesc: document.getElementById("invDesc"),
  btnInvUpdate: document.getElementById("btnInvUpdate"),
  btnInvDelete: document.getElementById("btnInvDelete"),
  btnInvCancel: document.getElementById("btnInvCancel"),
  btnOpenInventarioModal: document.getElementById("btnOpenInventarioModal"),
  inventarioModal: document.getElementById("inventarioModal"),
  inventarioModalTitle: document.getElementById("inventarioModalTitle"),
  btnCloseInventarioModal: document.getElementById("btnCloseInventarioModal"),
  reloadInventarios: document.getElementById("reloadInventarios"),
  ativoInventarioSelect: document.getElementById("ativoInventarioSelect"),
  ativoPesquisa: document.getElementById("ativoPesquisa"),
  btnAtivoPesquisar: document.getElementById("btnAtivoPesquisar"),
  btnAtivoReload: document.getElementById("btnAtivoReload"),
  scanRede: document.getElementById("scanRede"),
  scanUser: document.getElementById("scanUser"),
  scanPass: document.getElementById("scanPass"),
  scanCredsRow: document.getElementById("scanCredsRow"),
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
  btnPcCreate: document.getElementById("btnPcCreate"),
  btnPcCancel: document.getElementById("btnPcCancel"),
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
  btnUtCreate: document.getElementById("btnUtCreate"),
  btnUtCancel: document.getElementById("btnUtCancel"),
  utilizadoresBody: document.getElementById("utilizadoresBody"),
  perfilForm: document.getElementById("perfilForm"),
  pfId: document.getElementById("pfId"),
  pfNome: document.getElementById("pfNome"),
  btnPfUpdate: document.getElementById("btnPfUpdate"),
  btnPfDelete: document.getElementById("btnPfDelete"),
  btnPfCreate: document.getElementById("btnPfCreate"),
  btnPfCancel: document.getElementById("btnPfCancel"),
  perfisBody: document.getElementById("perfisBody"),
  localizacaoForm: document.getElementById("localizacaoForm"),
  lcId: document.getElementById("lcId"),
  lcNome: document.getElementById("lcNome"),
  lcDesc: document.getElementById("lcDesc"),
  btnLcUpdate: document.getElementById("btnLcUpdate"),
  btnLcDelete: document.getElementById("btnLcDelete"),
  btnLcCreate: document.getElementById("btnLcCreate"),
  btnLcCancel: document.getElementById("btnLcCancel"),
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
  computadorCreateModal: document.getElementById("computadorCreateModal"),
  btnClosePcCreateModal: document.getElementById("btnClosePcCreateModal"),
  btnCancelPcCreateModal: document.getElementById("btnCancelPcCreateModal"),
  computadorCreateForm: document.getElementById("computadorCreateForm"),
  pcCreateNome: document.getElementById("pcCreateNome"),
  pcCreateMarca: document.getElementById("pcCreateMarca"),
  pcCreateModelo: document.getElementById("pcCreateModelo"),
  pcCreateSerie: document.getElementById("pcCreateSerie"),
  pcCreateEstado: document.getElementById("pcCreateEstado"),
  pcCreateInventarioId: document.getElementById("pcCreateInventarioId"),
  pcCreateLocalizacaoId: document.getElementById("pcCreateLocalizacaoId"),
  pcCreateUtilizadorId: document.getElementById("pcCreateUtilizadorId"),
  utilizadorCreateModal: document.getElementById("utilizadorCreateModal"),
  btnCloseUtCreateModal: document.getElementById("btnCloseUtCreateModal"),
  btnCancelUtCreateModal: document.getElementById("btnCancelUtCreateModal"),
  utilizadorCreateForm: document.getElementById("utilizadorCreateForm"),
  utCreateNome: document.getElementById("utCreateNome"),
  utCreateUsername: document.getElementById("utCreateUsername"),
  utCreateEmail: document.getElementById("utCreateEmail"),
  utCreatePerfilId: document.getElementById("utCreatePerfilId"),
  utCreatePassword: document.getElementById("utCreatePassword"),
  perfilCreateModal: document.getElementById("perfilCreateModal"),
  btnClosePfCreateModal: document.getElementById("btnClosePfCreateModal"),
  btnCancelPfCreateModal: document.getElementById("btnCancelPfCreateModal"),
  perfilCreateForm: document.getElementById("perfilCreateForm"),
  pfCreateNome: document.getElementById("pfCreateNome"),
  localizacaoCreateModal: document.getElementById("localizacaoCreateModal"),
  btnCloseLcCreateModal: document.getElementById("btnCloseLcCreateModal"),
  btnCancelLcCreateModal: document.getElementById("btnCancelLcCreateModal"),
  localizacaoCreateForm: document.getElementById("localizacaoCreateForm"),
  lcCreateNome: document.getElementById("lcCreateNome"),
  lcCreateDesc: document.getElementById("lcCreateDesc"),
};

el.apiBase.value = store.apiBase;
const selectedEntity = {
  inventarioId: null,
  computadorId: null,
  utilizadorId: null,
  perfilId: null,
  localizacaoId: null,
};
const uiActivityLog = [];

// Mostra o estado global da app e regista atividade recente no dashboard.
function setStatus(text, level = "ok") {
  el.globalStatus.className = `status ${level}`;
  el.globalStatus.textContent = text;
  const now = new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  uiActivityLog.unshift({ text, time: now, level });
  if (uiActivityLog.length > 8) {
    uiActivityLog.length = 8;
  }
  renderDashboardActivity();
}

function setSelectOptions(selectEl, items, getValue, getLabel, placeholder) {
  if (!selectEl) return;
  const previous = selectEl.value;
  clear(selectEl);
  if (placeholder) {
    selectEl.appendChild(option("", placeholder));
  }
  items.forEach((item) => {
    selectEl.appendChild(option(String(getValue(item)), getLabel(item)));
  });
  if (previous && Array.from(selectEl.options).some((o) => o.value === previous)) {
    selectEl.value = previous;
  }
}

function makeRowActionButton(text, className, onClick) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = text;
  btn.className = className;
  btn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    onClick();
  });
  return btn;
}

// Mostra/limpa mensagem de erro do formulario de login.
function setLoginError(message = "") {
  if (!message) {
    el.loginError.classList.add("is-hidden");
    el.loginError.textContent = "";
    return;
  }
  el.loginError.classList.remove("is-hidden");
  el.loginError.textContent = message;
}

function showApp(isVisible) {
  el.appRoot.classList.toggle("is-hidden", !isVisible);
  el.loginScreen.classList.toggle("is-hidden", isVisible);
}

// Atualiza dados do utilizador autenticado no header.
function setAuthUi() {
  const user = store.currentUser;
  el.authUser.textContent = user ? user.nome : "Sem sessao";
  el.authPerfil.textContent = `Perfil: ${user?.perfil_nome || "-"}`;
}

// Aplica visibilidade de acoes conforme perfil (admin ou leitura).
function applyRoleUi() {
  const admin = isAdmin();
  [
    el.inventarioForm,
    el.computadorForm,
    el.utilizadorForm,
    el.perfilForm,
    el.localizacaoForm,
    ...el.actionRows,
    el.btnScan,
    el.btnOpenInventarioModal,
    el.btnQuickInventario,
    el.btnPcCreate,
    el.btnUtCreate,
    el.btnPfCreate,
    el.btnLcCreate,
  ].forEach((node) => {
    if (!node) return;
    node.classList.toggle("is-hidden", !admin);
  });
  if (!admin) {
    el.scanInfo.textContent = "Sessao em modo consulta: apenas administradores podem alterar dados.";
  }
}

// Controla o modal de inventario para criar/editar.
function openInventarioModal(mode = "create") {
  if (!isAdmin()) return;
  if (mode === "create") {
    clearInventarioForm();
    el.inventarioModalTitle.textContent = "Criar inventario";
  } else {
    el.inventarioModalTitle.textContent = "Editar inventario";
  }
  el.inventarioModal.classList.remove("is-hidden");
}

function closeInventarioModal() {
  clearInventarioForm();
  el.inventarioModal.classList.add("is-hidden");
}

function openModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove("is-hidden");
}

function closeModal(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add("is-hidden");
}

function clearPcCreateModalForm() {
  el.pcCreateNome.value = "";
  el.pcCreateMarca.value = "";
  el.pcCreateModelo.value = "";
  el.pcCreateSerie.value = "";
  el.pcCreateEstado.value = "ativo";
  el.pcCreateInventarioId.value = "";
  el.pcCreateLocalizacaoId.value = "";
  el.pcCreateUtilizadorId.value = "";
}

function clearUtCreateModalForm() {
  el.utCreateNome.value = "";
  el.utCreateUsername.value = "";
  el.utCreateEmail.value = "";
  el.utCreatePerfilId.value = "";
  el.utCreatePassword.value = "";
}

function clearPfCreateModalForm() {
  el.pfCreateNome.value = "";
}

function clearLcCreateModalForm() {
  el.lcCreateNome.value = "";
  el.lcCreateDesc.value = "";
}

function openPcCreateModal() {
  clearPcCreateModalForm();
  openModal(el.computadorCreateModal);
}

function openUtCreateModal() {
  clearUtCreateModalForm();
  openModal(el.utilizadorCreateModal);
}

function openPfCreateModal() {
  clearPfCreateModalForm();
  openModal(el.perfilCreateModal);
}

function openLcCreateModal() {
  clearLcCreateModalForm();
  openModal(el.localizacaoCreateModal);
}

function clearInventarioForm() {
  el.invId.value = "";
  selectedEntity.inventarioId = null;
  el.invNome.value = "";
  el.invTipo.value = "normal";
  el.invRede.value = "";
  el.invDesc.value = "";
  syncInventarioConditionalUI();
}

function preencherInventarioForm(inv) {
  selectedEntity.inventarioId = inv.id;
  el.invId.value = String(inv.id ?? "");
  el.invNome.value = inv.nome || "";
  el.invTipo.value = inv.tipo_inventario || "normal";
  el.invRede.value = inv.rede || "";
  el.invDesc.value = inv.descricao || "";
  syncInventarioConditionalUI();
}

// Ajusta visualmente o campo de rede conforme o tipo de inventario.
function syncInventarioConditionalUI() {
  const isRede = el.invTipo.value === "sub_rede";
  el.invRede.classList.toggle("is-hidden", !isRede);
  el.invRede.required = isRede;
  if (isRede) {
    el.invRede.placeholder = "IP da rede obrigatorio (ex: 192.168.1.0/24)";
  } else {
    el.invRede.value = "";
    el.invRede.placeholder = "IP da rede (ex: 192.168.1.0/24)";
  }
}

// Helpers de apresentacao e navegacao.
function labelTipoInventario(tipo) {
  if (tipo === "sub_rede") return "rede";
  return tipo || "-";
}

function selectedInventarioId() {
  return Number(el.ativoInventarioSelect.value || "0") || null;
}

function setSelectedInventarioLabel() {
  const id = selectedInventarioId();
  store.selectedInventarioId = id;
  const selectedOption = el.ativoInventarioSelect.selectedOptions?.[0];
  const selectedLabel = selectedOption?.textContent?.trim() || "";
  const nome = selectedLabel.includes(" - ")
    ? selectedLabel.split(" - ").slice(1).join(" - ").trim()
    : "";
  el.selectedInventario.textContent = id
    ? `Inventario selecionado: ${nome || `ID ${id}`}`
    : "Inventario selecionado: nenhum";
}

function activateTab(tabName) {
  el.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.tab === tabName));
  el.panels.forEach((panel) => panel.classList.toggle("active", panel.id === `panel-${tabName}`));
}

function openTab(tabName) {
  activateTab(tabName);
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

// Render de linhas da tabela de ativos.
function addAtivoRow(item, { offlineDateMode = "inactiveOnly" } = {}) {
  const tr = document.createElement("tr");
  tr.appendChild(td(item.tipo));
  tr.appendChild(td(item.nome || item.hostname || "-"));
  tr.appendChild(td(item.ip || "-"));
  tr.appendChild(td(item.numero_serie || "-"));
  const estadoCell = document.createElement("td");
  estadoCell.appendChild(activeStatusChip(item.estado));
  tr.appendChild(estadoCell);

  let ultimaVezAtivo = "-";
  if (offlineDateMode === "inactiveOnly") {
    ultimaVezAtivo = item.estado === "inativo" ? formatDate(item.ultima_vez_ativo_em) : "-";
  } else if (offlineDateMode === "raw") {
    ultimaVezAtivo = item.ultima_vez_ativo_em || "-";
  }
  tr.appendChild(td(ultimaVezAtivo));
  tr.appendChild(td(item.marca || "-"));
  tr.appendChild(td(item.modelo || "-"));
  el.ativosBody.appendChild(tr);
}

// Blocos do dashboard.
function renderDashboardInventarios(inventarios) {
  if (!el.dashInventariosBody) return;
  clear(el.dashInventariosBody);
  const top = inventarios.slice(0, 5);
  if (!top.length) {
    const tr = document.createElement("tr");
    tr.appendChild(td("-"));
    tr.appendChild(td("Sem inventarios"));
    tr.appendChild(td("-"));
    tr.appendChild(td("-"));
    el.dashInventariosBody.appendChild(tr);
    return;
  }
  top.forEach((inv) => {
    const tr = document.createElement("tr");
    tr.appendChild(td(String(inv.id)));
    tr.appendChild(td(inv.nome || "-"));
    tr.appendChild(td(labelTipoInventario(inv.tipo_inventario)));
    tr.appendChild(td(inv.rede || "-"));
    el.dashInventariosBody.appendChild(tr);
  });
}

function renderDashboardActivity() {
  if (!el.dashAtividade) return;
  clear(el.dashAtividade);
  if (!uiActivityLog.length) {
    const li = document.createElement("li");
    li.textContent = "Sem atividade recente.";
    el.dashAtividade.appendChild(li);
    return;
  }
  uiActivityLog.forEach((item) => {
    const li = document.createElement("li");
    const txt = document.createElement("span");
    txt.textContent = item.text;
    const time = document.createElement("span");
    time.className = "activity-time";
    time.textContent = item.time;
    li.appendChild(txt);
    li.appendChild(time);
    el.dashAtividade.appendChild(li);
  });
}

// Recarrega inventarios e sincroniza tabelas/selects relacionados.
async function refreshInventarios() {
  const admin = isAdmin();
  const inventarios = await inventariosApi.list();
  renderDashboardInventarios(inventarios);
  clear(el.inventariosBody);
  clear(el.ativoInventarioSelect);
  el.ativoInventarioSelect.appendChild(option("", "Seleciona inventario"));
  setSelectOptions(
    el.pcInventarioId,
    inventarios,
    (inv) => inv.id,
    (inv) => `${inv.nome} (#${inv.id})`,
    "Seleciona inventario"
  );
  setSelectOptions(
    el.pcCreateInventarioId,
    inventarios,
    (inv) => inv.id,
    (inv) => `${inv.nome} (#${inv.id})`,
    "Seleciona inventario"
  );

  inventarios.forEach((inv) => {
    const tr = document.createElement("tr");
    tr.dataset.clickable = "true";
    tr.appendChild(td(String(inv.id)));
    tr.appendChild(td(inv.nome));
    tr.appendChild(td(labelTipoInventario(inv.tipo_inventario)));
    tr.appendChild(td(inv.rede || "-"));
    tr.appendChild(td(inv.descricao || "-"));
    const tdAcoes = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "table-actions";
    actions.appendChild(
      makeRowActionButton("Selecionar", "btn-inline", async () => {
        store.selectedInventarioId = inv.id;
        selectedEntity.inventarioId = inv.id;
        el.ativoInventarioSelect.value = String(inv.id);
        setSelectedInventarioLabel();
        await refreshAtivos();
      })
    );
    if (admin) {
      actions.appendChild(
        makeRowActionButton("Editar", "btn-inline", () => {
          preencherInventarioForm(inv);
          selectedEntity.inventarioId = inv.id;
          openInventarioModal("edit");
        })
      );
      actions.appendChild(
        makeRowActionButton("Apagar", "btn-inline btn-inline-danger", async () => {
          if (!window.confirm(`Apagar inventario ${inv.id}?`)) return;
          try {
            await inventariosApi.remove(inv.id);
            await refreshInventarios();
            setStatus("Inventario apagado", "ok");
          } catch (err) {
            setStatus(`Erro ao apagar inventario: ${err.message}`, "err");
          }
        })
      );
    }
    tdAcoes.appendChild(actions);
    tr.appendChild(tdAcoes);
    tr.addEventListener("click", () => {
      preencherInventarioForm(inv);
      selectedEntity.inventarioId = inv.id;
      if (isAdmin()) {
        openInventarioModal("edit");
      }
    });
    el.inventariosBody.appendChild(tr);
    el.ativoInventarioSelect.appendChild(option(String(inv.id), `${inv.id} - ${inv.nome}`));
  });

  const selectedExists = inventarios.some((inv) => inv.id === store.selectedInventarioId);
  if (!selectedExists) {
    store.selectedInventarioId = inventarios.length > 0 ? inventarios[0].id : null;
  }
  el.ativoInventarioSelect.value = store.selectedInventarioId ? String(store.selectedInventarioId) : "";
  setSelectedInventarioLabel();
  el.kpiInventarios.textContent = String(inventarios.length);
  el.apiStatus.textContent = `Inventarios carregados: ${inventarios.length}`;
}

function validarInventarioForm() {
  const tipo = el.invTipo.value;
  const ipRede = el.invRede.value.trim();
  if (tipo === "sub_rede" && !ipRede) {
    throw new Error("Para inventario do tipo rede, o campo IP e obrigatorio.");
  }
}

async function refreshComputadores() {
  const admin = isAdmin();
  const pcs = await computadoresApi.list();
  clear(el.computadoresBody);
  pcs.forEach((pc) => {
    const tr = document.createElement("tr");
    tr.dataset.clickable = "true";
    tr.appendChild(td(String(pc.id)));
    tr.appendChild(td(pc.nome));
    tr.appendChild(td(pc.numero_serie));
    tr.appendChild(td(pc.inventario_nome || String(pc.inventario_id)));
    tr.appendChild(td(pc.localizacao_nome || "-"));
    tr.appendChild(td(pc.utilizador_responsavel_nome || "-"));
    const tdAcoes = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "table-actions";
    if (admin) {
      actions.appendChild(
        makeRowActionButton("Editar", "btn-inline", () => preencherComputadorForm(pc))
      );
      actions.appendChild(
        makeRowActionButton("Apagar", "btn-inline btn-inline-danger", async () => {
          try {
            await computadoresApi.remove(pc.id);
            await refreshComputadores();
            setStatus("Computador apagado", "ok");
          } catch (err) {
            setStatus(`Erro ao apagar computador: ${err.message}`, "err");
          }
        })
      );
    } else {
      actions.appendChild(makeRowActionButton("Detalhe", "btn-inline", () => preencherComputadorForm(pc)));
    }
    tdAcoes.appendChild(actions);
    tr.appendChild(tdAcoes);
    tr.addEventListener("click", () => preencherComputadorForm(pc));
    el.computadoresBody.appendChild(tr);
  });
  el.kpiComputadores.textContent = String(pcs.length);
}

async function refreshUtilizadores() {
  const admin = isAdmin();
  const uts = await utilizadoresApi.list();
  const perfis = await perfisApi.list();
  setSelectOptions(
    el.pcUtilizadorId,
    uts,
    (u) => u.id,
    (u) => `${u.nome} (#${u.id})`,
    "Sem responsavel"
  );
  setSelectOptions(
    el.pcCreateUtilizadorId,
    uts,
    (u) => u.id,
    (u) => `${u.nome} (#${u.id})`,
    "Sem responsavel"
  );
  setSelectOptions(
    el.utPerfilId,
    perfis,
    (p) => p.id,
    (p) => `${p.nome} (#${p.id})`,
    "Seleciona perfil"
  );
  setSelectOptions(
    el.utCreatePerfilId,
    perfis,
    (p) => p.id,
    (p) => `${p.nome} (#${p.id})`,
    "Seleciona perfil"
  );
  clear(el.utilizadoresBody);
  uts.forEach((u) => {
    const tr = document.createElement("tr");
    tr.dataset.clickable = "true";
    tr.appendChild(td(String(u.id)));
    tr.appendChild(td(u.nome));
    tr.appendChild(td(u.username));
    tr.appendChild(td(u.email));
    const perfil = perfis.find((p) => p.id === u.perfil_id);
    tr.appendChild(td(perfil ? perfil.nome : String(u.perfil_id)));
    const tdAcoes = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "table-actions";
    if (admin) {
      actions.appendChild(
        makeRowActionButton("Editar", "btn-inline", () => preencherUtilizadorForm(u))
      );
      actions.appendChild(
        makeRowActionButton("Apagar", "btn-inline btn-inline-danger", async () => {
          if (!window.confirm(`Apagar utilizador ${u.id}?`)) return;
          try {
            await utilizadoresApi.remove(u.id);
            await refreshUtilizadores();
            setStatus("Utilizador apagado", "ok");
          } catch (err) {
            setStatus(`Erro ao apagar utilizador: ${err.message}`, "err");
          }
        })
      );
    } else {
      actions.appendChild(makeRowActionButton("Detalhe", "btn-inline", () => preencherUtilizadorForm(u)));
    }
    tdAcoes.appendChild(actions);
    tr.appendChild(tdAcoes);
    tr.addEventListener("click", () => preencherUtilizadorForm(u));
    el.utilizadoresBody.appendChild(tr);
  });
  el.kpiUtilizadores.textContent = String(uts.length);
}

async function refreshPerfis() {
  const admin = isAdmin();
  const perfis = await perfisApi.list();
  setSelectOptions(
    el.utPerfilId,
    perfis,
    (p) => p.id,
    (p) => `${p.nome} (#${p.id})`,
    "Seleciona perfil"
  );
  setSelectOptions(
    el.utCreatePerfilId,
    perfis,
    (p) => p.id,
    (p) => `${p.nome} (#${p.id})`,
    "Seleciona perfil"
  );
  clear(el.perfisBody);
  perfis.forEach((p) => {
    const tr = document.createElement("tr");
    tr.dataset.clickable = "true";
    tr.appendChild(td(String(p.id)));
    tr.appendChild(td(p.nome));
    const tdAcoes = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "table-actions";
    if (admin) {
      actions.appendChild(
        makeRowActionButton("Editar", "btn-inline", () => preencherPerfilForm(p))
      );
      actions.appendChild(
        makeRowActionButton("Apagar", "btn-inline btn-inline-danger", async () => {
          try {
            await perfisApi.remove(p.id);
            await refreshPerfis();
            setStatus("Perfil apagado", "ok");
          } catch (err) {
            setStatus(`Erro ao apagar perfil: ${err.message}`, "err");
          }
        })
      );
    } else {
      actions.appendChild(makeRowActionButton("Detalhe", "btn-inline", () => preencherPerfilForm(p)));
    }
    tdAcoes.appendChild(actions);
    tr.appendChild(tdAcoes);
    tr.addEventListener("click", () => preencherPerfilForm(p));
    el.perfisBody.appendChild(tr);
  });
}

async function refreshLocalizacoes() {
  const admin = isAdmin();
  const locs = await localizacoesApi.list();
  setSelectOptions(
    el.pcLocalizacaoId,
    locs,
    (l) => l.id,
    (l) => `${l.nome} (#${l.id})`,
    "Sem localizacao"
  );
  setSelectOptions(
    el.pcCreateLocalizacaoId,
    locs,
    (l) => l.id,
    (l) => `${l.nome} (#${l.id})`,
    "Sem localizacao"
  );
  clear(el.localizacoesBody);
  locs.forEach((l) => {
    const tr = document.createElement("tr");
    tr.dataset.clickable = "true";
    tr.appendChild(td(String(l.id)));
    tr.appendChild(td(l.nome));
    tr.appendChild(td(l.descricao || "-"));
    const tdAcoes = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "table-actions";
    if (admin) {
      actions.appendChild(
        makeRowActionButton("Editar", "btn-inline", () => preencherLocalizacaoForm(l))
      );
      actions.appendChild(
        makeRowActionButton("Apagar", "btn-inline btn-inline-danger", async () => {
          try {
            await localizacoesApi.remove(l.id);
            await refreshLocalizacoes();
            setStatus("Localizacao apagada", "ok");
          } catch (err) {
            setStatus(`Erro ao apagar localizacao: ${err.message}`, "err");
          }
        })
      );
    } else {
      actions.appendChild(
        makeRowActionButton("Detalhe", "btn-inline", () => preencherLocalizacaoForm(l))
      );
    }
    tdAcoes.appendChild(actions);
    tr.appendChild(tdAcoes);
    tr.addEventListener("click", () => preencherLocalizacaoForm(l));
    el.localizacoesBody.appendChild(tr);
  });
  el.kpiLocalizacoes.textContent = String(locs.length);
}

async function refreshAtivos() {
  const invId = selectedInventarioId();
  if (!invId) return;
  const ativos = await inventariosApi.listAtivos(invId);
  clear(el.ativosBody);
  ativos.forEach((a) => addAtivoRow(a, { offlineDateMode: "inactiveOnly" }));
}

// Handlers de inventario.
async function handleInventarioCreate(ev) {
  ev.preventDefault();
  try {
    validarInventarioForm();
    await inventariosApi.create({
      nome: el.invNome.value.trim(),
      descricao: el.invDesc.value.trim() || null,
      tipo_inventario: el.invTipo.value,
      rede: el.invRede.value.trim() || null,
    });
    await refreshInventarios();
    setStatus("Inventario criado", "ok");
    closeInventarioModal();
  } catch (err) {
    setStatus(`Erro inventario: ${err.message}`, "err");
  }
}

async function handleInventarioUpdate() {
  const id = selectedEntity.inventarioId || toNullableInt(el.invId.value);
  if (!id) return setStatus("Seleciona um inventario na tabela para atualizar", "warn");
  try {
    validarInventarioForm();
    await inventariosApi.update(id, {
      nome: el.invNome.value.trim(),
      descricao: el.invDesc.value.trim() || null,
      tipo_inventario: el.invTipo.value,
      rede: el.invRede.value.trim() || null,
    });
    await refreshInventarios();
    setStatus("Inventario atualizado", "ok");
    closeInventarioModal();
  } catch (err) {
    setStatus(`Erro update inventario: ${err.message}`, "err");
  }
}

async function handleInventarioDelete() {
  const id = selectedEntity.inventarioId || toNullableInt(el.invId.value);
  if (!id) return setStatus("Seleciona um inventario na tabela para apagar", "warn");
  if (!window.confirm(`Apagar inventario ${id}?`)) return;
  try {
    await inventariosApi.remove(id);
    await refreshInventarios();
    setStatus("Inventario apagado", "ok");
    closeInventarioModal();
  } catch (err) {
    setStatus(`Erro apagar inventario: ${err.message}`, "err");
  }
}

async function handleScan() {
  const id = selectedInventarioId();
  if (!id) return setStatus("Seleciona inventario para scan", "warn");
  const utilizadorRede = el.scanUser.value.trim();
  const passwordRede = el.scanPass.value;
  if (!utilizadorRede || !passwordRede.trim()) {
    return setStatus("Credenciais de rede obrigatorias para executar scan", "warn");
  }
  try {
    el.btnScan.disabled = true;
    setStatus("Scan em execucao...", "warn");
    const out = await inventariosApi.scan(id, {
      rede: el.scanRede.value.trim() || null,
      utilizador: utilizadorRede,
      password: passwordRede,
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
    todos.forEach((a) => addAtivoRow(a, { offlineDateMode: "raw" }));
    setStatus("Pesquisa no inventario concluida", "ok");
  } catch (err) {
    setStatus(`Erro pesquisa inventario: ${err.message}`, "err");
  }
}

// Construtor do payload de computador (completo ou parcial).
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

function clearComputadorForm() {
  el.pcId.value = "";
  selectedEntity.computadorId = null;
  el.pcNome.value = "";
  el.pcMarca.value = "";
  el.pcModelo.value = "";
  el.pcSerie.value = "";
  el.pcEstado.value = "ativo";
  el.pcInventarioId.value = "";
  el.pcLocalizacaoId.value = "";
  el.pcUtilizadorId.value = "";
}

function preencherComputadorForm(pc) {
  selectedEntity.computadorId = pc.id;
  el.pcId.value = String(pc.id);
  el.pcNome.value = pc.nome || "";
  el.pcMarca.value = pc.marca || "";
  el.pcModelo.value = pc.modelo || "";
  el.pcSerie.value = pc.numero_serie || "";
  el.pcEstado.value = pc.estado || "ativo";
  el.pcInventarioId.value = pc.inventario_id ? String(pc.inventario_id) : "";
  el.pcLocalizacaoId.value = pc.localizacao_id ? String(pc.localizacao_id) : "";
  el.pcUtilizadorId.value = pc.utilizador_responsavel_id
    ? String(pc.utilizador_responsavel_id)
    : "";
}

function clearUtilizadorForm() {
  el.utId.value = "";
  selectedEntity.utilizadorId = null;
  el.utNome.value = "";
  el.utUsername.value = "";
  el.utEmail.value = "";
  el.utPerfilId.value = "";
  el.utPassword.value = "";
}

function preencherUtilizadorForm(u) {
  selectedEntity.utilizadorId = u.id;
  el.utId.value = String(u.id);
  el.utNome.value = u.nome || "";
  el.utUsername.value = u.username || "";
  el.utEmail.value = u.email || "";
  el.utPerfilId.value = u.perfil_id ? String(u.perfil_id) : "";
  el.utPassword.value = "";
}

function clearPerfilForm() {
  el.pfId.value = "";
  selectedEntity.perfilId = null;
  el.pfNome.value = "";
}

function preencherPerfilForm(p) {
  selectedEntity.perfilId = p.id;
  el.pfId.value = String(p.id);
  el.pfNome.value = p.nome || "";
}

function clearLocalizacaoForm() {
  el.lcId.value = "";
  selectedEntity.localizacaoId = null;
  el.lcNome.value = "";
  el.lcDesc.value = "";
}

function preencherLocalizacaoForm(l) {
  selectedEntity.localizacaoId = l.id;
  el.lcId.value = String(l.id);
  el.lcNome.value = l.nome || "";
  el.lcDesc.value = l.descricao || "";
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
  const id = selectedEntity.computadorId || toNullableInt(el.pcId.value);
  if (!id) return setStatus("Seleciona um computador na tabela para atualizar", "warn");
  try {
    await computadoresApi.replace(id, buildComputadorPayload(true));
    await refreshComputadores();
    setStatus("Computador atualizado (PUT)", "ok");
  } catch (err) {
    setStatus(`Erro PUT computador: ${err.message}`, "err");
  }
}

async function handlePcPatch() {
  const id = selectedEntity.computadorId || toNullableInt(el.pcId.value);
  if (!id) return setStatus("Seleciona um computador na tabela para atualizar", "warn");
  try {
    await computadoresApi.patch(id, buildComputadorPayload(false));
    await refreshComputadores();
    setStatus("Computador atualizado (PATCH)", "ok");
  } catch (err) {
    setStatus(`Erro PATCH computador: ${err.message}`, "err");
  }
}

async function handlePcDelete() {
  const id = selectedEntity.computadorId || toNullableInt(el.pcId.value);
  if (!id) return setStatus("Seleciona um computador na tabela para apagar", "warn");
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
  const id = selectedEntity.utilizadorId || toNullableInt(el.utId.value);
  if (!id) return setStatus("Seleciona um utilizador na tabela para atualizar", "warn");
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
  const id = selectedEntity.utilizadorId || toNullableInt(el.utId.value);
  if (!id) return setStatus("Seleciona um utilizador na tabela para apagar", "warn");
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
    await perfisApi.create({ nome: el.pfNome.value.trim() });
    await refreshPerfis();
    setStatus("Perfil criado", "ok");
  } catch (err) {
    setStatus(`Erro criar perfil: ${err.message}`, "err");
  }
}

async function handlePerfilUpdate() {
  const id = selectedEntity.perfilId || toNullableInt(el.pfId.value);
  if (!id) return setStatus("Seleciona um perfil na tabela para atualizar", "warn");
  try {
    await perfisApi.update(id, { nome: el.pfNome.value.trim() });
    await refreshPerfis();
    setStatus("Perfil atualizado", "ok");
  } catch (err) {
    setStatus(`Erro atualizar perfil: ${err.message}`, "err");
  }
}

async function handlePerfilDelete() {
  const id = selectedEntity.perfilId || toNullableInt(el.pfId.value);
  if (!id) return setStatus("Seleciona um perfil na tabela para apagar", "warn");
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
  const id = selectedEntity.localizacaoId || toNullableInt(el.lcId.value);
  if (!id) return setStatus("Seleciona uma localizacao na tabela para atualizar", "warn");
  try {
    await localizacoesApi.update(id, { nome: el.lcNome.value.trim(), descricao: el.lcDesc.value.trim() || null });
    await refreshLocalizacoes();
    setStatus("Localizacao atualizada", "ok");
  } catch (err) {
    setStatus(`Erro atualizar localizacao: ${err.message}`, "err");
  }
}

async function handleLocalizacaoDelete() {
  const id = selectedEntity.localizacaoId || toNullableInt(el.lcId.value);
  if (!id) return setStatus("Seleciona uma localizacao na tabela para apagar", "warn");
  try {
    await localizacoesApi.remove(id);
    await refreshLocalizacoes();
    setStatus("Localizacao apagada", "ok");
  } catch (err) {
    setStatus(`Erro apagar localizacao: ${err.message}`, "err");
  }
}

async function handlePcCreateModal(ev) {
  ev.preventDefault();
  try {
    await computadoresApi.create({
      nome: el.pcCreateNome.value.trim(),
      marca: el.pcCreateMarca.value.trim(),
      modelo: el.pcCreateModelo.value.trim(),
      numero_serie: el.pcCreateSerie.value.trim(),
      estado: el.pcCreateEstado.value.trim(),
      inventario_id: toNullableInt(el.pcCreateInventarioId.value),
      localizacao_id: toNullableInt(el.pcCreateLocalizacaoId.value),
      utilizador_responsavel_id: toNullableInt(el.pcCreateUtilizadorId.value),
    });
    await refreshComputadores();
    setStatus("Computador criado", "ok");
    closeModal(el.computadorCreateModal);
  } catch (err) {
    setStatus(`Erro criar computador: ${err.message}`, "err");
  }
}

async function handleUtCreateModal(ev) {
  ev.preventDefault();
  try {
    await utilizadoresApi.create({
      nome: el.utCreateNome.value.trim(),
      username: el.utCreateUsername.value.trim(),
      email: el.utCreateEmail.value.trim(),
      perfil_id: toNullableInt(el.utCreatePerfilId.value),
      palavra_passe: el.utCreatePassword.value || "123456",
    });
    await refreshUtilizadores();
    setStatus("Utilizador criado", "ok");
    closeModal(el.utilizadorCreateModal);
  } catch (err) {
    setStatus(`Erro criar utilizador: ${err.message}`, "err");
  }
}

async function handlePfCreateModal(ev) {
  ev.preventDefault();
  try {
    await perfisApi.create({ nome: el.pfCreateNome.value.trim() });
    await refreshPerfis();
    setStatus("Perfil criado", "ok");
    closeModal(el.perfilCreateModal);
  } catch (err) {
    setStatus(`Erro criar perfil: ${err.message}`, "err");
  }
}

async function handleLcCreateModal(ev) {
  ev.preventDefault();
  try {
    await localizacoesApi.create({
      nome: el.lcCreateNome.value.trim(),
      descricao: el.lcCreateDesc.value.trim() || null,
    });
    await refreshLocalizacoes();
    setStatus("Localizacao criada", "ok");
    closeModal(el.localizacaoCreateModal);
  } catch (err) {
    setStatus(`Erro criar localizacao: ${err.message}`, "err");
  }
}

// Handler da pesquisa global.
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

// Ciclo de vida da aplicacao e autenticacao.
async function init() {
  try {
    setStatus("A carregar...", "warn");
    syncInventarioConditionalUI();
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

async function bootstrapAuth() {
  if (!isAuthenticated()) {
    clearSession();
    showApp(false);
    return;
  }
  try {
    const me = await authApi.me();
    saveSession(store.authToken, me);
    setAuthUi();
    applyRoleUi();
    showApp(true);
    await init();
  } catch {
    clearSession();
    showApp(false);
  }
}

async function handleLogin(ev) {
  ev.preventDefault();
  setLoginError("");
  try {
    const loginOut = await authApi.login(
      el.loginIdentificador.value.trim(),
      el.loginPassword.value
    );
    const token = loginOut.access_token;
    saveSession(token, null);
    const me = await authApi.me();
    saveSession(token, me);
    setAuthUi();
    applyRoleUi();
    showApp(true);
    await init();
  } catch (err) {
    clearSession();
    showApp(false);
    setLoginError(err.message || "Falha no login.");
  }
}

function handleLogout() {
  clearSession();
  showApp(false);
  setStatus("Sessao terminada", "warn");
}

function handleAuthError(ev) {
  if (!isAuthenticated()) return;
  clearSession();
  showApp(false);
  setLoginError(ev?.detail?.message || "Sessao expirada. Inicia sessao novamente.");
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

el.btnQuickInventario.addEventListener("click", () => {
  if (!isAdmin()) return;
  openTab("inventarios");
  openInventarioModal("create");
});
el.btnGoAtivos.addEventListener("click", () => openTab("ativos"));
el.btnGoInventarios.addEventListener("click", () => openTab("inventarios"));
el.btnGoLogs.addEventListener("click", () => openTab("logs"));
el.btnGoComputadores.addEventListener("click", () => openTab("computadores"));
el.btnGoUtilizadores.addEventListener("click", () => openTab("utilizadores"));
el.btnGoPesquisa.addEventListener("click", () => openTab("pesquisa"));
el.btnGoLogs2.addEventListener("click", () => openTab("logs"));

el.loginForm.addEventListener("submit", handleLogin);
el.btnLogout.addEventListener("click", handleLogout);

el.inventarioForm.addEventListener("submit", handleInventarioCreate);
el.btnInvUpdate.addEventListener("click", handleInventarioUpdate);
el.btnInvDelete.addEventListener("click", handleInventarioDelete);
el.btnInvCancel.addEventListener("click", closeInventarioModal);
el.btnOpenInventarioModal.addEventListener("click", () => openInventarioModal("create"));
el.btnCloseInventarioModal.addEventListener("click", closeInventarioModal);
el.invTipo.addEventListener("change", syncInventarioConditionalUI);
el.reloadInventarios.addEventListener("click", refreshInventarios);
el.ativoInventarioSelect.addEventListener("change", async () => {
  setSelectedInventarioLabel();
  await refreshAtivos();
});
el.btnAtivoReload.addEventListener("click", refreshAtivos);
el.btnAtivoPesquisar.addEventListener("click", handleAtivoPesquisar);
el.btnScan.addEventListener("click", handleScan);

el.btnPcCreate.addEventListener("click", openPcCreateModal);
el.btnPcPut.addEventListener("click", handlePcPut);
el.btnPcPatch.addEventListener("click", handlePcPatch);
el.btnPcDelete.addEventListener("click", handlePcDelete);
el.btnPcCancel.addEventListener("click", clearComputadorForm);
el.btnClosePcCreateModal.addEventListener("click", () => closeModal(el.computadorCreateModal));
el.btnCancelPcCreateModal.addEventListener("click", () => closeModal(el.computadorCreateModal));
el.computadorCreateForm.addEventListener("submit", handlePcCreateModal);

el.btnUtCreate.addEventListener("click", openUtCreateModal);
el.btnUtUpdate.addEventListener("click", handleUtilizadorUpdate);
el.btnUtDelete.addEventListener("click", handleUtilizadorDelete);
el.btnUtCancel.addEventListener("click", clearUtilizadorForm);
el.btnCloseUtCreateModal.addEventListener("click", () => closeModal(el.utilizadorCreateModal));
el.btnCancelUtCreateModal.addEventListener("click", () => closeModal(el.utilizadorCreateModal));
el.utilizadorCreateForm.addEventListener("submit", handleUtCreateModal);

el.btnPfCreate.addEventListener("click", openPfCreateModal);
el.btnPfUpdate.addEventListener("click", handlePerfilUpdate);
el.btnPfDelete.addEventListener("click", handlePerfilDelete);
el.btnPfCancel.addEventListener("click", clearPerfilForm);
el.btnClosePfCreateModal.addEventListener("click", () => closeModal(el.perfilCreateModal));
el.btnCancelPfCreateModal.addEventListener("click", () => closeModal(el.perfilCreateModal));
el.perfilCreateForm.addEventListener("submit", handlePfCreateModal);

el.btnLcCreate.addEventListener("click", openLcCreateModal);
el.btnLcUpdate.addEventListener("click", handleLocalizacaoUpdate);
el.btnLcDelete.addEventListener("click", handleLocalizacaoDelete);
el.btnLcCancel.addEventListener("click", clearLocalizacaoForm);
el.btnCloseLcCreateModal.addEventListener("click", () => closeModal(el.localizacaoCreateModal));
el.btnCancelLcCreateModal.addEventListener("click", () => closeModal(el.localizacaoCreateModal));
el.localizacaoCreateForm.addEventListener("submit", handleLcCreateModal);

el.btnGlobalSearch.addEventListener("click", handlePesquisaGlobal);
el.btnLogsComputador.addEventListener("click", handleLogsComputador);
el.btnLogsInventario.addEventListener("click", handleLogsInventario);
window.addEventListener("auth-error", handleAuthError);

bootstrapAuth();
