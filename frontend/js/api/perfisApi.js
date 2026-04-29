import { http } from "../core/http.js";

export const perfisApi = {
  list: () => http("/perfis/"),
  get: (id) => http(`/perfis/${id}`),
  create: (payload) =>
    http("/perfis/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    http(`/perfis/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  remove: (id) => http(`/perfis/${id}`, { method: "DELETE" }),
};
