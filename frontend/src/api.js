/* Comentario geral deste ficheiro: contem partes importantes da interface e comportamento. */

const DEFAULT_API_BASE = "http://127.0.0.1:8000";

export function getApiBase() {
  return localStorage.getItem("api_base") || DEFAULT_API_BASE;
}

export function setApiBase(value) {
  localStorage.setItem("api_base", value);
}

async function request(path, options = {}, token) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.detail || "Erro na comunicacao com a API";
    throw new Error(message);
  }
  return data;
}

export const api = {
  login: (identificador, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identificador, palavra_passe: password }),
    }),
  me: (token) => request("/auth/me", {}, token),
  health: () => fetch(getApiBase()).then((r) => r.ok),

  inventarios: {
    listar: (token) => request("/inventarios/", {}, token),
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
  },
  computadores: {
    listar: (token) => request("/computadores/", {}, token),
    criar: (payload, token) => request("/computadores", { method: "POST", body: JSON.stringify(payload) }, token),
    atualizar: (id, payload, token) =>
      request(`/computadores/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
    patch: (id, payload, token) =>
      request(`/computadores/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, token),
    apagar: (id, token) => request(`/computadores/${id}`, { method: "DELETE" }, token),
  },
  utilizadores: {
    listar: (token) => request("/utilizadores", {}, token),
    criar: (payload, token) => request("/utilizadores", { method: "POST", body: JSON.stringify(payload) }, token),
    atualizar: (id, payload, token) =>
      request(`/utilizadores/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
    apagar: (id, token) => request(`/utilizadores/${id}`, { method: "DELETE" }, token),
  },
  perfis: {
    listar: (token) => request("/perfis", {}, token),
    criar: (payload, token) => request("/perfis", { method: "POST", body: JSON.stringify(payload) }, token),
    atualizar: (id, payload, token) =>
      request(`/perfis/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
    apagar: (id, token) => request(`/perfis/${id}`, { method: "DELETE" }, token),
  },
  localizacoes: {
    listar: (token) => request("/localizacoes", {}, token),
    criar: (payload, token) => request("/localizacoes", { method: "POST", body: JSON.stringify(payload) }, token),
    atualizar: (id, payload, token) =>
      request(`/localizacoes/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
    apagar: (id, token) => request(`/localizacoes/${id}`, { method: "DELETE" }, token),
  },
  pesquisa: {
    global: (termo, token) => request(`/pesquisar?pesquisa=${encodeURIComponent(termo)}`, {}, token),
  },
  logs: {
    porComputador: (params, token) =>
      request(`/computadores/logs/dispositivo?${new URLSearchParams(params).toString()}`, {}, token),
  },
};

