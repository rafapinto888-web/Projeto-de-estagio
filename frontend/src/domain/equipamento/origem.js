/*
 * Regras de origem do registo: manual (CRUD) vs descoberta em scan de rede.
 */

export function origemRegistoVisual(a) {
  if (a?.tipo === "computador") return "manual";
  const raw = String(a?.origem_registo ?? "scan")
    .trim()
    .toLowerCase();
  if (raw === "manual" || raw === "registo_manual") return "manual";
  return "scan";
}

/** Texto da coluna Origem (Manual / Scan). */
export function etiquetaOrigemAmigavel(a) {
  if (a?.tipo === "computador") return "Manual";
  const raw = String(a?.origem_registo ?? "scan").trim();
  const low = raw.toLowerCase();
  if (low === "manual" || low === "registo_manual") return "Manual";
  if (low === "scan" || low === "") return "Scan";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function origemDispositivo(a) {
  const t = String(a?.tipo || "").toLowerCase();
  if (t === "computador") return "manual";
  if (t === "dispositivo_descoberto") return "scan";
  return "scan";
}
