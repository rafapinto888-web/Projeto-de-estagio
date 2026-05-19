/*
 * Cliente HTTP da API REST (FastAPI).
 * Resolve URL base, pedidos autenticados e agrupamentos por domínio (auth, inventários, …).
 */

// --- Configuração da URL base ---

const FALLBACK_API_BASE = "http://localhost:8000";
const ENV_BASE =
  typeof import.meta.env?.VITE_API_BASE === "string" ? import.meta.env.VITE_API_BASE.trim() : "";

function normalizeBase(url) {
  return url.replace(/\/$/, "");
}

/** Build de producao (Docker): browser em :5173 → API no host :8000. Em `npm run dev` nao forca. */
function apiBaseParaSiteDocker5173() {
  if (!import.meta.env.PROD) return null;
  if (typeof window === "undefined") return null;
  const { hostname, port } = window.location;
  if ((hostname === "localhost" || hostname === "127.0.0.1") && port === "5173") {
    return "http://localhost:8000";
  }
  return null;
}

/** localStorage antigo pode apontar para hostnames que o browser nao resolve (ex.: API só em Docker). */
function localStorageApiBaseUsavel(saved) {
  if (!saved?.trim()) return false;
  const lower = saved.trim().toLowerCase();
  if (lower.includes("://backend:")) return false;
  return true;
}

/** URL base efetiva (env, Docker, localStorage ou fallback localhost:8000). */
export function getApiBase() {
  if (ENV_BASE) return normalizeBase(ENV_BASE);
  const dockerHint = apiBaseParaSiteDocker5173();
  if (dockerHint) return normalizeBase(dockerHint);
  const saved = localStorage.getItem("api_base");
  if (saved?.trim() && localStorageApiBaseUsavel(saved)) return normalizeBase(saved);
  return FALLBACK_API_BASE;
}

/** Persiste URL base escolhida pelo utilizador. */
export function setApiBase(value) {
  localStorage.setItem("api_base", value);
}

// --- Pedido HTTP genérico (JSON + Bearer) ---

async function request(path, options = {}, token) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
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
    const message = data?.detail || "Erro na comunicacao com a API";
    throw new Error(message);
  }
  return data;
}

// --- Objeto api: módulos por recurso ---

export const api = {
  // Autenticação e sessão
  login: (identificador, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identificador, palavra_passe: password }),
    }),
  me: (token) => request("/auth/me", {}, token),
  historicoMeu: (token) => request("/auth/me/historico", {}, token),
  registarHistorico: (payload, token) =>
    request("/auth/me/historico", { method: "POST", body: JSON.stringify(payload) }, token),
  health: () => fetch(getApiBase()).then((r) => r.ok),

  // Inventários, scan de rede e dispositivos descobertos
  inventarios: {
    listar: (token) => request("/inventarios/", {}, token),
    ativosPorInventario: (token) => request("/inventarios/ativos-por-inventario", {}, token),
    criar: (payload, token) => request("/inventarios", { method: "POST", body: JSON.stringify(payload) }, token),
    atualizar: (id, payload, token) =>
      request(`/inventarios/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
    apagar: (id, token) => request(`/inventarios/${id}`, { method: "DELETE" }, token),
    scan: (id, payload, token) =>
      request(`/inventarios/${id}/scan`, { method: "POST", body: JSON.stringify(payload) }, token),
    ativos: (id, token) => request(`/inventarios/${id}/computadores`, {}, token),
    pesquisarAtivos: (id, termo, token) =>
      request(`/inventarios/${id}/computadores/pesquisar?termo=${encodeURIComponent(termo || "")}`, {}, token),
    logsDispositivos: (id, params, token) =>
      request(`/inventarios/${id}/logs/dispositivos-descobertos?${new URLSearchParams(params).toString()}`, {}, token),
    atualizarDispositivo: (inventarioId, dispositivoId, payload, token) =>
      request(
        `/inventarios/${inventarioId}/dispositivos-descobertos/${dispositivoId}`,
        { method: "PATCH", body: JSON.stringify(payload) },
        token,
      ),
    apagarDispositivo: (inventarioId, dispositivoId, token) =>
      request(`/inventarios/${inventarioId}/dispositivos-descobertos/${dispositivoId}`, { method: "DELETE" }, token),
  },
  // Computadores registados manualmente
  computadores: {
    listar: (token) => request("/computadores/", {}, token),
    criar: (payload, token) => request("/computadores", { method: "POST", body: JSON.stringify(payload) }, token),
    atualizar: (id, payload, token) =>
      request(`/computadores/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
    patch: (id, payload, token) =>
      request(`/computadores/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, token),
    apagar: (id, token) => request(`/computadores/${id}`, { method: "DELETE" }, token),
  },
  // Utilizadores do sistema
  utilizadores: {
    listar: (token) => request("/utilizadores", {}, token),
    criar: (payload, token) => request("/utilizadores", { method: "POST", body: JSON.stringify(payload) }, token),
    atualizar: (id, payload, token) =>
      request(`/utilizadores/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
    apagar: (id, token) => request(`/utilizadores/${id}`, { method: "DELETE" }, token),
  },
  // Perfis de acesso (roles)
  perfis: {
    listar: (token) => request("/perfis", {}, token),
    criar: (payload, token) => request("/perfis", { method: "POST", body: JSON.stringify(payload) }, token),
    atualizar: (id, payload, token) =>
      request(`/perfis/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
    apagar: (id, token) => request(`/perfis/${id}`, { method: "DELETE" }, token),
  },
  // Localizações físicas
  localizacoes: {
    listar: (token) => request("/localizacoes", {}, token),
    criar: (payload, token) => request("/localizacoes", { method: "POST", body: JSON.stringify(payload) }, token),
    atualizar: (id, payload, token) =>
      request(`/localizacoes/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
    apagar: (id, token) => request(`/localizacoes/${id}`, { method: "DELETE" }, token),
  },
  // Pesquisa global multi-entidade
  pesquisa: {
    global: (termo, token) => request(`/pesquisar?pesquisa=${encodeURIComponent(termo)}`, {}, token),
  },
  // Logs de dispositivos / computadores
  logs: {
    porComputador: (params, token) =>
      request(`/computadores/logs/dispositivo?${new URLSearchParams(params).toString()}`, {}, token),
  },
};

