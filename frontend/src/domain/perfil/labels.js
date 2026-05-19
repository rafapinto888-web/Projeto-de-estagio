/*
 * Nomes de perfil legíveis em português (valor na BD pode ser admin, user, etc.).
 */

const PERFIL_PT = {
  admin: "Administrador",
  administrator: "Administrador",
  administrador: "Administrador",
  user: "Utilizador",
  utilizador: "Utilizador",
  operator: "Operador",
  operador: "Operador",
  guest: "Convidado",
  convidado: "Convidado",
};

/** Texto a mostrar na UI; mantém nomes personalizados se não estiver no mapa. */
export function perfilNomeExibicao(raw) {
  if (raw == null || !String(raw).trim()) return "—";
  const original = String(raw).trim();
  const chave = original.toLowerCase();
  return PERFIL_PT[chave] ?? original;
}
