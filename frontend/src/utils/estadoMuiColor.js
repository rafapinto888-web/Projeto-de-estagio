/*
 * Mapeamento de estados de equipamento para cores de Chip MUI.
 */

/**
 * Cor do `Chip` MUI para estado de equipamento / computador.
 * Nota: a string "inativo" contém "ativo" — inativo/offline/erro têm de vir antes de ativo.
 */
export function estadoChipMuiColor(estado) {
  const e = String(estado || "").toLowerCase();
  if (e.includes("inativ") || e.includes("offline") || e.includes("erro")) return "error";
  if (e.includes("ativo") || e.includes("conclu")) return "success";
  if (e.includes("manut") || e.includes("pend")) return "warning";
  return "default";
}
