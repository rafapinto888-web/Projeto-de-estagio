export const store = {
  apiBase: localStorage.getItem("apiBase") || "http://127.0.0.1:8000",
  selectedInventarioId: null,
  authToken: localStorage.getItem("authToken") || "",
  currentUser: null,
};

export function setApiBase(nextBase) {
  store.apiBase = nextBase.replace(/\/$/, "");
  localStorage.setItem("apiBase", store.apiBase);
}

export function setAuthToken(token) {
  store.authToken = token || "";
  if (store.authToken) {
    localStorage.setItem("authToken", store.authToken);
  } else {
    localStorage.removeItem("authToken");
  }
}

export function setCurrentUser(user) {
  store.currentUser = user || null;
}
