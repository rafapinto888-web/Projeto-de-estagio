/*
 * Formatação de valores de equipamento para UI, tabelas e exportação.
 */

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

/**
 * ISO vindo da API sem sufixo de fuso (ex.: naive UTC em PostgreSQL) deve ser lido como UTC;
 * caso contrário o `Date` do JS assume hora local e o relógio do histórico desfase (ex.: Portugal).
 */
export function instanteDataApiParaLocal(v) {
  if (v == null || v === "") return null;
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? null : v;
  }
  const s = String(v).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (
    /^\d{4}-\d{2}-\d{2}T/.test(s) &&
    !/[zZ]$/.test(s) &&
    !/[+-]\d{2}:\d{2}$/.test(s)
  ) {
    const d = new Date(`${s}Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Data/hora completa para ecrã. */
export function formatarDataPt(v) {
  if (v == null || v === "") return "—";
  const d = instanteDataApiParaLocal(v);
  if (!d) return String(v);
  return d.toLocaleString("pt-PT");
}

/** Data/hora curta para tabelas (Computadores, histórico). */
export function formatarDataPtCurta(v) {
  if (v == null || v === "") return "—";
  try {
    const d = instanteDataApiParaLocal(v);
    if (!d) return "—";
    return d.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

/** Data/hora curta para exportação Excel. */
export function formatarDataPtExport(v) {
  if (v == null || v === "") return "";
  try {
    const d = instanteDataApiParaLocal(v);
    if (!d) return "";
    return d.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "";
  }
}

export function ipEquipamento(item) {
  if (!item) return null;
  return item.ip || item.endereco_ip || null;
}
