import { http } from "../core/http.js";

export const inventariosApi = {
  list: () => http("/inventarios/"),
  get: (id) => http(`/inventarios/${id}`),
  details: (id) => http(`/inventarios/${id}/detalhes`),
  create: (payload) =>
    http("/inventarios/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  createQuick: (params) => {
    const qs = new URLSearchParams(params);
    return http(`/inventarios/criar-rapido?${qs.toString()}`, { method: "POST" });
  },
  update: (id, payload) =>
    http(`/inventarios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  remove: (id) => http(`/inventarios/${id}`, { method: "DELETE" }),
  listAtivos: (id) => http(`/inventarios/${id}/computadores`),
  searchAtivos: (id, termo) =>
    http(`/inventarios/${id}/computadores/pesquisar?termo=${encodeURIComponent(termo || "")}`),
  listDispositivos: (id) => http(`/inventarios/${id}/dispositivos-descobertos`),
  getDispositivo: (inventarioId, dispositivoId) =>
    http(`/inventarios/${inventarioId}/dispositivos-descobertos/${dispositivoId}`),
  scan: (id, payload) =>
    http(`/inventarios/${id}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  logsDispositivos: (id, query) => {
    const qs = new URLSearchParams(query);
    return http(`/inventarios/${id}/logs/dispositivos-descobertos?${qs.toString()}`);
  },
};
