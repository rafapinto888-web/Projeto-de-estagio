import { http } from "../core/http.js";

export const authApi = {
  login: (identificador, palavraPasse) =>
    http("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identificador, palavra_passe: palavraPasse }),
      skipAuth: true,
    }),
  me: () => http("/auth/me"),
};
