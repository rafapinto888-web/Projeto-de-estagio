import { ipEquipamento } from "./detalheEquipamento.js";

/** Separador listas (PT) — linha `sep=;` no início ajuda o Excel a abrir bem o ficheiro. */
const SEP = ";";
const EOL = "\r\n";

/**
 * Escapa texto para CSV e evita que o Excel interprete `=`, `+`, `-`, `@` como fórmula.
 * @param {unknown} v
 */
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

function csvCell(v) {
  if (v == null) return "";
  return String(v).trim();
}

/** Data/hora em formato ISO local (YYYY-MM-DD HH:mm:ss) — o Excel trata bem como data/hora. */
function dataParaExcel(v) {
  if (v == null || v === "") return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function tipoLegivel(a) {
  const t = String(a?.tipo || "").toLowerCase();
  if (t === "computador") return "Computador";
  if (t === "dispositivo_descoberto") return "Dispositivo (scan)";
  return csvCell(a?.tipo);
}

function tipoInventarioLegivel(v) {
  const s = String(v || "").trim().toLowerCase();
  if (s === "sub_rede") return "Sub-rede";
  if (s === "normal") return "Normal";
  return csvCell(v);
}

/**
 * Exporta as linhas do inventário (após filtros locais do cartão) para CSV otimizado para Excel:
 * - UTF-8 com BOM
 * - Primeira linha `sep=;` (separador em PT)
 * - Fim de linha Windows (`\r\n`)
 * - Cabeçalhos em português
 * - Datas em ISO local para reconhecimento como data no Excel
 *
 * @param {{ inventario_id?: number, inventario_nome?: string, tipo_inventario?: string }} grupo
 * @param {object[]} linhas
 */
export function exportInventarioComputadoresParaExcel(grupo, linhas) {
  const invNome = grupo?.inventario_nome ?? "";
  const invId = grupo?.inventario_id ?? "";
  const tipoInv = tipoInventarioLegivel(grupo?.tipo_inventario);
  const exportadoEm = dataParaExcel(new Date());

  const headers = [
    "Inventário",
    "ID inventário",
    "Tipo inventário",
    "Tipo de linha",
    "ID (BD)",
    "Nome / identificação",
    "Hostname",
    "IP",
    "MAC",
    "Marca",
    "Modelo",
    "N.º série",
    "Sistema operativo",
    "Origem (Manual/Scan)",
    "Origem registo (BD)",
    "Primeira vista",
    "Estado",
    "Localização",
    "Responsável",
    "Última atualização (scan)",
    "Exportado em",
  ];

  const list = Array.isArray(linhas) ? linhas : [];
  const linhasCsv = list.map((a) => {
    const ip = ipEquipamento(a) ?? "";
    const isPc = a?.tipo === "computador";
    const origemReg = isPc ? "" : csvCell(a?.origem_registo);
    const primeira = isPc ? "" : dataParaExcel(a?.criado_em);
    const ultima = isPc ? "" : dataParaExcel(a?.ultima_vez_ativo_em);
    return [
      q(invNome),
      q(invId),
      q(tipoInv),
      q(tipoLegivel(a)),
      q(a?.id != null ? String(a.id) : ""),
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
      q(exportadoEm),
    ].join(SEP);
  });

  const bloco = [
    `sep=${SEP}`,
    headers.join(SEP),
    ...linhasCsv,
  ].join(EOL);

  const base = sanitizeFilename(invNome);
  const filename = `Computadores_${base}_${invId}.csv`;
  const blob = new Blob(["\uFEFF", bloco], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const el = document.createElement("a");
  el.href = url;
  el.download = filename;
  el.rel = "noopener";
  el.click();
  URL.revokeObjectURL(url);
}
