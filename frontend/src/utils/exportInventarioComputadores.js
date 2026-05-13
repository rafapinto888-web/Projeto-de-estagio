import { formatarDataPt, ipEquipamento } from "./detalheEquipamento.js";

function q(s) {
  return `"${String(s ?? "").replace(/"/g, '""')}"`;
}

function sanitizeFilename(name) {
  return String(name || "inventario")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 72) || "inventario";
}

function etiquetaOrigemAmigavel(a) {
  if (a?.tipo === "computador") return "Manual";
  const raw = String(a?.origem_registo ?? "scan").trim();
  const low = raw.toLowerCase();
  if (low === "manual" || low === "registo_manual") return "Manual";
  if (low === "scan" || low === "") return "Scan";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function nomeEquipamentoLista(a) {
  if (a?.tipo === "computador") return a.nome || a.hostname || "";
  return a?.hostname || a?.ip || (a?.id != null ? `Scan #${a.id}` : "");
}

/** Valor para célula CSV (vazio real, sem traço decorativo). */
function csvCell(v) {
  if (v == null) return "";
  const s = String(v).trim();
  return s;
}

function dataParaExcel(v) {
  if (v == null || v === "") return "";
  const s = formatarDataPt(v);
  return s === "—" ? "" : s;
}

/**
 * Exporta as linhas visíveis do inventário (após filtros locais do cartão) para ficheiro
 * CSV com UTF-8 BOM — abre diretamente no Excel em Windows (PT), sem dependências extra.
 *
 * @param {{ inventario_id?: number, inventario_nome?: string }} grupo
 * @param {object[]} linhas
 */
export function exportInventarioComputadoresParaExcel(grupo, linhas) {
  const invNome = grupo?.inventario_nome ?? "";
  const invId = grupo?.inventario_id ?? "";
  const headers = [
    "Inventario",
    "Inventario_id",
    "Tipo_linha",
    "ID",
    "Nome_equipamento",
    "Hostname",
    "IP",
    "MAC",
    "Marca",
    "Modelo",
    "Numero_serie",
    "Sistema_operativo",
    "Origem",
    "Origem_registo_bd",
    "Primeira_vista",
    "Estado",
    "Localizacao",
    "Responsavel",
    "Ultima_atualizacao_scan",
  ];
  const delim = ";";
  const list = Array.isArray(linhas) ? linhas : [];
  const lines = [
    headers.join(delim),
    ...list.map((a) => {
      const ip = ipEquipamento(a) ?? "";
      const isPc = a?.tipo === "computador";
      const origemReg = isPc ? "" : csvCell(a?.origem_registo);
      const primeira = isPc ? "" : dataParaExcel(a?.criado_em);
      const ultima = isPc ? "" : dataParaExcel(a?.ultima_vez_ativo_em);
      return [
        q(invNome),
        invId,
        q(csvCell(a?.tipo)),
        a?.id != null ? String(a.id) : "",
        q(nomeEquipamentoLista(a)),
        q(csvCell(a?.hostname)),
        q(csvCell(ip)),
        q(csvCell(a?.mac_address)),
        q(csvCell(a?.marca)),
        q(csvCell(a?.modelo)),
        q(csvCell(a?.numero_serie)),
        q(csvCell(a?.sistema_operativo)),
        q(etiquetaOrigemAmigavel(a)),
        q(origemReg),
        q(primeira),
        q(csvCell(a?.estado)),
        q(isPc ? csvCell(a?.localizacao_nome) : ""),
        q(isPc ? csvCell(a?.utilizador_responsavel_nome) : ""),
        q(ultima),
      ].join(delim);
    }),
  ];
  const base = sanitizeFilename(invNome);
  const filename = `Computadores_${base}_${invId}.csv`;
  const blob = new Blob(["\uFEFF", lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url;
  el.download = filename;
  el.rel = "noopener";
  el.click();
  URL.revokeObjectURL(url);
}