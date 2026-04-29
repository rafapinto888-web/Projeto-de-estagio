export const store = {
  apiBase: localStorage.getItem("apiBase") || "http://127.0.0.1:8000",
  selectedInventarioId: null,
};

export function setApiBase(nextBase) {
  store.apiBase = nextBase.replace(/\/$/, "");
  localStorage.setItem("apiBase", store.apiBase);
}
