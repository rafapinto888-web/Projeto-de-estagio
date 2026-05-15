/** Valor vazio na UI (traço). */
export function txtBd(v) {
  if (v == null || v === "") return "—";
  const s = String(v).trim();
  return s || "—";
}

/** Valor vazio na exportação (célula em branco). */
export function textoExport(v) {
  if (v == null || v === "") return "";
  const s = String(v).trim();
  return s === "—" ? "" : s;
}

/** Data/hora completa para ecrã. */
export function formatarDataPt(v) {
  if (v == null || v === "") return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("pt-PT");
}

/** Data/hora curta para tabelas (Computadores, histórico). */
export function formatarDataPtCurta(v) {
  if (v == null || v === "") return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

/** Data/hora curta para exportação Excel. */
export function formatarDataPtExport(v) {
  if (v == null || v === "") return "";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "";
  }
}

export function ipEquipamento(item) {
  if (!item) return null;
  return item.ip || item.endereco_ip || null;
}
