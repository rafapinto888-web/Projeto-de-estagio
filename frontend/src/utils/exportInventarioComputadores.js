import { ipEquipamento } from "./detalheEquipamento.js";

const SEP = ";";
const EOL = "\r\n";

function q(v) {
  let t = String(v ?? "");
  t = t.replace(/"/g, '""');
  if (/^[=+\-@\t]/.test(t)) t = `'${t}`;
  return `"${t}"`;
}

function sanitizeFilename(name) {
  return String(name || "inventario")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 72) || "inventario";
}

function csvCell(v) {
  if (v == null || v === "") return "";
  const s = String(v).trim();
  return s === "—" ? "" : s;
}

function dataExportacaoPt(v) {
  if (v == null || v === "") return "";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "";
  }
}

function tipoInventarioLegivel(v) {
  const s = String(v || "").trim().toLowerCase();
  if (s === "sub_rede") return "Sub-rede";
  if (s === "normal") return "Normal";
  return csvCell(v);
}

function etiquetaOrigemAmigavel(a) {
  if (a?.tipo === "computador") return "Manual";
  const raw = String(a?.origem_registo ?? "scan").trim();
  const low = raw.toLowerCase();
  if (low === "manual" || low === "registo_manual") return "Manual";
  if (low === "scan" || low === "") return "Scan";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/** Colunas alinhadas à tabela da página Computadores (+ inventário no início). */
const HEADERS = [
  "Inventário",
  "Tipo inventário",
  "Hostname",
  "IP",
  "MAC",
  "Marca",
  "Modelo",
  "N.º série",
  "Sistema",
  "Origem",
  "Origem registo",
  "Primeira vista",
  "Estado",
  "Localização",
  "Responsável",
  "Última atualização",
];

function linhaCsvAtivo(grupo, a) {
  const invNome = grupo?.inventario_nome ?? "";
  const tipoInv = tipoInventarioLegivel(grupo?.tipo_inventario);
  const ip = ipEquipamento(a) ?? "";
  const isPc = a?.tipo === "computador";
  const isScan = a?.tipo === "dispositivo_descoberto";

  return [
    q(invNome),
    q(tipoInv),
    q(csvCell(a?.hostname)),
    q(csvCell(ip)),
    q(csvCell(a?.mac_address)),
    q(csvCell(a?.marca)),
    q(csvCell(a?.modelo)),
    q(csvCell(a?.numero_serie)),
    q(csvCell(a?.sistema_operativo)),
    q(etiquetaOrigemAmigavel(a)),
    q(isScan ? csvCell(a?.origem_registo) : ""),
    q(isScan ? dataExportacaoPt(a?.criado_em) : ""),
    q(csvCell(a?.estado)),
    q(isPc ? csvCell(a?.localizacao_nome) : ""),
    q(isPc ? csvCell(a?.utilizador_responsavel_nome) : ""),
    q(isScan ? dataExportacaoPt(a?.ultima_vez_ativo_em) : ""),
  ].join(SEP);
}

/**
 * Exporta linhas filtradas do cartão para CSV (Excel PT: UTF-8 BOM, separador ;).
 */
export function exportInventarioComputadoresParaExcel(grupo, linhas) {
  const list = Array.isArray(linhas) ? linhas : [];
  if (list.length === 0) return;

  const linhasCsv = list.map((a) => linhaCsvAtivo(grupo, a));
  const headerLine = HEADERS.map((h) => q(h)).join(SEP);
  const bloco = [`sep=${SEP}`, headerLine, ...linhasCsv].join(EOL);

  const base = sanitizeFilename(grupo?.inventario_nome);
  const stamp = new Date()
    .toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "medium" })
    .replace(/[/:,\s]+/g, "-");
  const filename = `Computadores_${base}_${stamp}.csv`;

  const blob = new Blob(["\uFEFF", bloco], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url;
  el.download = filename;
  el.rel = "noopener";
  document.body.appendChild(el);
  el.click();
  document.body.removeChild(el);
  window.setTimeout(() => URL.revokeObjectURL(url), 200);
}
