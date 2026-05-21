/*
 * Cliente HTTP da API REST (FastAPI).
 * Token JWT: setApiToken no login; pedidos autenticados usam-no automaticamente.
 */

// --- Configuração da URL base ---

const FALLBACK_API_BASE = "http://localhost:8000";
const ENV_BASE =
  typeof import.meta.env?.VITE_API_BASE === "string" ? import.meta.env.VITE_API_BASE.trim() : "";

function normalizeBase(url) {
  return url.replace(/\/$/, "");
}

function apiBaseParaSiteDocker5173() {
  if (!import.meta.env.PROD) return null;
  if (typeof window === "undefined") return null;
  const { hostname, port } = window.location;
  if ((hostname === "localhost" || hostname === "127.0.0.1") && port === "5173") {
    return "http://localhost:8000";
  }
  return null;
}

function localStorageApiBaseUsavel(saved) {
  if (!saved?.trim()) return false;
  const lower = saved.trim().toLowerCase();
  if (lower.includes("://backend:")) return false;
  return true;
}

export function getApiBase() {
  if (ENV_BASE) return normalizeBase(ENV_BASE);
  const dockerHint = apiBaseParaSiteDocker5173();
  if (dockerHint) return normalizeBase(dockerHint);
  const saved = localStorage.getItem("api_base");
  if (saved?.trim() && localStorageApiBaseUsavel(saved)) return normalizeBase(saved);
  return FALLBACK_API_BASE;
}

export function setApiBase(value) {
  localStorage.setItem("api_base", value);
}

// --- Token da sessão (Bearer) ---

let authToken = null;
if (typeof localStorage !== "undefined") {
  const saved = localStorage.getItem("access_token");
  if (saved) authToken = saved;
}

export function setApiToken(token) {
  authToken = token || null;
}

export function clearApiToken() {
  authToken = null;
}

// --- Pedido HTTP genérico (JSON + Bearer) ---

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const base = getApiBase();
  const url = `${base}${path}`;
  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err) {
    const hint =
      "Sem ligacao a API. Abre http://localhost:8000/docs no browser; se nao abrir, na pasta backend corre: " +
      ".venv\\Scripts\\python.exe -m uvicorn app.core.main:app --reload --host 127.0.0.1 --port 8000";
    throw new Error(`${hint} (URL usada: ${base})`);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.detail || "Erro na comunicacao com a API");
  }
  return data;
}

// --- Objeto api: módulos por recurso ---

export const api = {
  login: (identificador, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identificador, palavra_passe: password }),
    }),
  me: () => request("/auth/me"),
  registarHistorico: (payload) =>
    request("/auth/me/historico", { method: "POST", body: JSON.stringify(payload) }),
  health: () => fetch(getApiBase()).then((r) => r.ok),

  inventarios: {
    listar: () => request("/inventarios/"),
    ativosPorInventario: () => request("/inventarios/ativos-por-inventario"),
    criar: (payload) => request("/inventarios", { method: "POST", body: JSON.stringify(payload) }),
    atualizar: (id, payload) =>
      request(`/inventarios/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    apagar: (id) => request(`/inventarios/${id}`, { method: "DELETE" }),
    scan: (id, payload) =>
      request(`/inventarios/${id}/scan`, { method: "POST", body: JSON.stringify(payload) }),
    ativos: (id) => request(`/inventarios/${id}/computadores`),
    pesquisarAtivos: (id, termo) =>
      request(`/inventarios/${id}/computadores/pesquisar?termo=${encodeURIComponent(termo || "")}`),
    logsDispositivos: (id, params) =>
      request(`/inventarios/${id}/logs/dispositivos-descobertos?${new URLSearchParams(params).toString()}`),
    recolherLogsDispositivos: (id, payload) =>
      request(`/inventarios/${id}/logs/dispositivos-descobertos/recolher`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    atualizarDispositivo: (inventarioId, dispositivoId, payload) =>
      request(`/inventarios/${inventarioId}/dispositivos-descobertos/${dispositivoId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    apagarDispositivo: (inventarioId, dispositivoId) =>
      request(`/inventarios/${inventarioId}/dispositivos-descobertos/${dispositivoId}`, {
        method: "DELETE",
      }),
  },

  computadores: {
    listar: () => request("/computadores/"),
    criar: (payload) => request("/computadores", { method: "POST", body: JSON.stringify(payload) }),
    atualizar: (id, payload) =>
      request(`/computadores/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    patch: (id, payload) =>
      request(`/computadores/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    apagar: (id) => request(`/computadores/${id}`, { method: "DELETE" }),
  },

  utilizadores: {
    listar: () => request("/utilizadores"),
    historico: (id) => request(`/utilizadores/${id}/historico`),
    criar: (payload) => request("/utilizadores", { method: "POST", body: JSON.stringify(payload) }),
    atualizar: (id, payload) =>
      request(`/utilizadores/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    apagar: (id) => request(`/utilizadores/${id}`, { method: "DELETE" }),
  },

  perfis: {
    listar: () => request("/perfis"),
    criar: (payload) => request("/perfis", { method: "POST", body: JSON.stringify(payload) }),
    atualizar: (id, payload) =>
      request(`/perfis/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    apagar: (id) => request(`/perfis/${id}`, { method: "DELETE" }),
  },

  localizacoes: {
    listar: () => request("/localizacoes"),
    criar: (payload) => request("/localizacoes", { method: "POST", body: JSON.stringify(payload) }),
    atualizar: (id, payload) =>
      request(`/localizacoes/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    apagar: (id) => request(`/localizacoes/${id}`, { method: "DELETE" }),
  },

  pesquisa: {
    global: (termo) => request(`/pesquisar?pesquisa=${encodeURIComponent(termo)}`),
  },

  logs: {
    porComputador: (params) =>
      request(`/computadores/logs/dispositivo?${new URLSearchParams(params).toString()}`),
  },
};
