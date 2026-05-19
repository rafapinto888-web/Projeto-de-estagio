/*
 * Etiquetas legíveis para tipos de inventário (normal, sub-rede).
 */

export function tipoInventarioLabel(tipo) {
  const s = String(tipo || "").trim().toLowerCase();
  if (s === "sub_rede") return "Sub-rede";
  if (s === "normal") return "Normal";
  return tipo ? String(tipo) : "Normal";
}
