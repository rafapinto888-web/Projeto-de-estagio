/*
 * Cliente HTTP da API REST (FastAPI).
 * Autenticacao por cookie HttpOnly: o browser envia a sessao automaticamente.
 */

// --- Configuracao da URL base ---

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

/**
 * Se abrires o site pelo IP/hostname da rede (ex.: http://192.168.1.10:5173) mas a API estiver
 * configurada como localhost (ou vazio), o browser chamaria o localhost da MAQUINA DO
 * UTILIZADOR, nao o PC onde o Vite/API correm. Usa o mesmo hostname da pagina na porta 8000.
 * Corre em dev e em build de producao — se VITE_API_BASE ja for um host real (ex.: api.empresa.pt),
 * nao altera nada.
 */
function apiBaseMesmoHostQuePaginaQuandoEnvELoopback(explicitEnv) {
  if (typeof window === "undefined") return null;
  const pageHost = window.location.hostname;
  if (!pageHost) return null;

  let envHost = null;
  const raw = (explicitEnv || "").trim();
  if (raw) {
    try {
      envHost = new URL(raw).hostname;
    } catch {
      envHost = null;
    }
  }
  const envApontaLoopback = !raw || envHost === "localhost" || envHost === "127.0.0.1";
  if (!envApontaLoopback) return null;

  const proto = window.location.protocol === "https:" ? "https" : "http";
  return `${proto}://${pageHost}:8000`;
}

export function getApiBase() {
  const savedRaw = localStorage.getItem("api_base");
  const savedOk = savedRaw?.trim() && localStorageApiBaseUsavel(savedRaw);
  const savedNorm = savedOk ? normalizeBase(savedRaw.trim()) : null;
  let savedHost = null;
  if (savedNorm) {
    try {
      savedHost = new URL(savedNorm).hostname;
    } catch {
      savedHost = null;
    }
  }
  const semOverrideManual =
    !savedNorm || savedHost === "localhost" || savedHost === "127.0.0.1";

  const lanDev = semOverrideManual ? apiBaseMesmoHostQuePaginaQuandoEnvELoopback(ENV_BASE) : null;
  if (lanDev) return normalizeBase(lanDev);

  if (ENV_BASE) return normalizeBase(ENV_BASE);
  const dockerHint = apiBaseParaSiteDocker5173();
  if (dockerHint) return normalizeBase(dockerHint);
  if (savedNorm) return savedNorm;
  return FALLBACK_API_BASE;
}

export function setApiBase(value) {
  localStorage.setItem("api_base", value);
}

// --- Pedido HTTP generico (JSON + cookie de sessao) ---

/** Extrai mensagem legivel de `detail` (string, lista de erros Pydantic, etc.). */
function mensagemApiDetail(data) {
  const d = data?.detail;
  if (d == null) return "Erro na comunicacao com a API";
  if (typeof d === "string") return d;
  if (Array.isArray(d)) {
    return d
      .map((x) => (typeof x === "object" && x != null ? x.msg || x.message || JSON.stringify(x) : String(x)))
      .filter(Boolean)
      .join("; ");
  }
  return String(d);
}

async function request(path, options = {}) {
  const { signal, headers: optHeaders, ...fetchRest } = options;
  const headers = { "Content-Type": "application/json", ...(optHeaders || {}), ...(fetchRest.headers || {}) };

  const base = getApiBase();
  const url = `${base}${path}`;
  let response;
  try {
    response = await fetch(url, {
      ...fetchRest,
      credentials: "include",
      headers,
      signal,
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      const e = new Error("Pedido cancelado");
      e.name = "AbortError";
      throw e;
    }
    const hint =
      "Sem ligacao a API. Abre http://localhost:8000/docs no browser; se nao abrir, na pasta backend corre: " +
      ".venv\\Scripts\\python.exe -m uvicorn app.core.main:app --reload --host 127.0.0.1 --port 8000";
    throw new Error(`${hint} (URL usada: ${base})`);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (
      response.status === 401 &&
      typeof window !== "undefined" &&
      path !== "/auth/login" &&
      path !== "/auth/me"
    ) {
      window.dispatchEvent(new CustomEvent("inventario-session-expired"));
    }
    throw new Error(mensagemApiDetail(data));
  }
  return data;
}

// --- Objeto api: modulos por recurso ---

export const api = {
  login: (identificador, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identificador, palavra_passe: password }),
    }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  registarHistorico: (payload) =>
    request("/auth/me/historico", { method: "POST", body: JSON.stringify(payload) }),
  historicoRecente: (limit = 20) => request(`/auth/historico/recente?limit=${encodeURIComponent(String(limit))}`),
  health: () => fetch(getApiBase(), { credentials: "include" }).then((r) => r.ok),

  inventarios: {
    listar: () => request("/inventarios/"),
    detalhes: (id) => request(`/inventarios/${id}/detalhes`),
    ativosPorInventario: () => request("/inventarios/ativos-por-inventario"),
    criar: (payload) => request("/inventarios", { method: "POST", body: JSON.stringify(payload) }),
    atualizar: (id, payload) =>
      request(`/inventarios/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
    apagar: (id) => request(`/inventarios/${id}`, { method: "DELETE" }),
    scan: (id, payload, opts = {}) =>
      request(`/inventarios/${id}/scan`, {
        method: "POST",
        body: JSON.stringify(payload),
        signal: opts.signal,
      }),
    ativos: (id) => request(`/inventarios/${id}/computadores`),
    pesquisarAtivos: (id, termo) =>
      request(`/inventarios/${id}/computadores/pesquisar?termo=${encodeURIComponent(termo || "")}`),
    logsDispositivos: (id, params, opts = {}) =>
      request(`/inventarios/${id}/logs/dispositivos-descobertos?${new URLSearchParams(params).toString()}`, {
        signal: opts.signal,
      }),
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
    listar: (opts = {}) => {
      const q = opts.comScan ? "?com_scan=true" : "";
      return request(`/computadores/${q}`);
    },
    /** Manuais + dispositivos do scan (mesmas regras de permissao que o painel). */
    vistaUnificada: () => request("/computadores/vista-unificada"),
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
