import { http } from "../core/http.js";

export const utilizadoresApi = {
  list: () => http("/utilizadores/"),
  get: (id) => http(`/utilizadores/${id}`),
  create: (payload) =>
    http("/utilizadores/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    http(`/utilizadores/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  remove: (id) => http(`/utilizadores/${id}`, { method: "DELETE" }),
};
