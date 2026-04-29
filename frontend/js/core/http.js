import { store } from "./store.js";

export async function http(path, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${store.apiBase}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.headers || {}),
      },
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
