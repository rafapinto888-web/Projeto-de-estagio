import { setAuthToken, setCurrentUser, store } from "./store.js";

export function saveSession(token, user) {
  setAuthToken(token);
  setCurrentUser(user);
}

export function clearSession() {
  setAuthToken("");
  setCurrentUser(null);
}

export function isAuthenticated() {
  return Boolean(store.authToken);
}

export function isAdmin() {
  const perfil = String(store.currentUser?.perfil_nome || "").toLowerCase();
  return perfil === "admin";
}
