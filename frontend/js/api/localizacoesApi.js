import { http } from "../core/http.js";

export const localizacoesApi = {
  list: () => http("/localizacoes/"),
  get: (id) => http(`/localizacoes/${id}`),
  create: (payload) =>
    http("/localizacoes/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    http(`/localizacoes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  remove: (id) => http(`/localizacoes/${id}`, { method: "DELETE" }),
};
