import { http } from "../core/http.js";

export const computadoresApi = {
  list: () => http("/computadores/"),
  get: (id) => http(`/computadores/${id}`),
  create: (payload) =>
    http("/computadores/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  replace: (id, payload) =>
    http(`/computadores/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  patch: (id, payload) =>
    http(`/computadores/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  remove: (id) => http(`/computadores/${id}`, { method: "DELETE" }),
  logsByComputer: (id, tipoLog = "") =>
    http(`/computadores/${id}/logs${tipoLog ? `?tipo_log=${encodeURIComponent(tipoLog)}` : ""}`),
  logsByFilter: (query) => {
    const qs = new URLSearchParams(query);
    return http(`/computadores/logs/dispositivo?${qs.toString()}`);
  },
};
