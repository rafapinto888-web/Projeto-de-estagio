import { store } from "./store.js";

export async function http(path, options = {}, timeoutMs = 20000) {
  const { skipAuth = false, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = {
      ...(fetchOptions.headers || {}),
    };
    if (!skipAuth && store.authToken) {
      headers.Authorization = `Bearer ${store.authToken}`;
    }

    const res = await fetch(`${store.apiBase}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers,
    });

    const raw = await res.text();
    let body = null;
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = raw;
      }
    }

    if (!res.ok) {
      const detail =
        (body && typeof body === "object" && body.detail) ||
        (typeof body === "string" ? body : `${res.status} ${res.statusText}`);
      if (res.status === 401 || res.status === 403) {
        window.dispatchEvent(
          new CustomEvent("auth-error", { detail: { status: res.status, message: detail } })
        );
      }
      const err = new Error(detail);
      err.status = res.status;
      throw err;
    }

    if (res.status === 204) return null;
    return body;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Timeout: pedido demorou demasiado");
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
