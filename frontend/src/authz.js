/*
 * Autorização no cliente: deteta perfis administrativos pelo nome.
 * Espelha a lógica do backend (deps.is_admin_user).
 */

/** Tokens reconhecidos como administrador (palavras inteiras no nome do perfil). */
const ADMIN_TOKENS = new Set(["admin", "administrador", "administrator"]);

/** Indica se o nome do perfil contém algum token de administrador. */
export function isAdminProfileName(raw) {
  if (!raw || !String(raw).trim()) return false;
  const tokens = String(raw)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  return tokens.some((t) => ADMIN_TOKENS.has(t));
}
