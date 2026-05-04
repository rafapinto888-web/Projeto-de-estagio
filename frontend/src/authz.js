/** Regra alinhada com backend/app/core/deps.is_admin_user (tokens de perfil). */

const ADMIN_TOKENS = new Set(["admin", "administrador", "administrator"]);

export function isAdminProfileName(raw) {
  if (!raw || !String(raw).trim()) return false;
  const tokens = String(raw)
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  return tokens.some((t) => ADMIN_TOKENS.has(t));
}
