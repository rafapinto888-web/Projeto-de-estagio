/*
 * Exportação Excel (.xlsx) dos ativos de um inventário (manuais + scan).
 */

import * as XLSX from "xlsx";
import {
  formatarDataPtExport,
  ipEquipamento,
  textoExport,
} from "../domain/equipamento/index.js";
import { tipoInventarioLabel } from "../domain/inventario/index.js";

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
  "Primeira vista",
  "Estado",
  "Localização",
  "Responsável",
  "Última atualização",
];

/** Nome de ficheiro seguro para o sistema de ficheiros. */
function sanitizeFilename(name) {
  return String(name || "inventario")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 72) || "inventario";
}

function stampFicheiro() {
  // Gera um sufixo legivel e seguro para evitar colisoes entre exportacoes.
  return new Date()
    .toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "medium" })
    .replace(/[/:,\s]+/g, "-");
}

function linhaAtivo(grupo, a) {
  // Mantem a mesma ordem de colunas para registos manuais e itens de scan.
  const invNome = grupo?.inventario_nome ?? "";
  const tipoInv = tipoInventarioLabel(grupo?.tipo_inventario);
  const ip = ipEquipamento(a) ?? "";
  const isPc = a?.tipo === "computador";
  const isScan = a?.tipo === "dispositivo_descoberto";

  return [
    invNome,
    tipoInv,
    textoExport(a?.hostname),
    textoExport(ip),
    textoExport(a?.mac_address),
    textoExport(a?.marca),
    textoExport(a?.modelo),
    textoExport(a?.numero_serie),
    textoExport(a?.sistema_operativo),
    isScan ? formatarDataPtExport(a?.criado_em) : "",
    textoExport(a?.estado),
    isPc ? textoExport(a?.localizacao_nome) : "",
    isPc ? textoExport(a?.utilizador_responsavel_nome) : "",
    isScan ? formatarDataPtExport(a?.ultima_vez_ativo_em) : "",
  ];
}

function largurasColunas(rows) {
  // Ajusta largura por conteudo com limites para evitar folhas impraticaveis.
  return HEADERS.map((header, col) => {
    let max = header.length;
    for (const row of rows) {
      const len = String(row[col] ?? "").length;
      if (len > max) max = len;
    }
    return { wch: Math.min(Math.max(max + 2, 10), 42) };
  });
}

/** Gera e descarrega o Excel com as linhas do inventário indicado. */
export function exportInventarioComputadoresParaExcel(grupo, linhas) {
  // A exportacao falha em silencio quando nao ha linhas, espelhando o estado da vista atual.
  const list = Array.isArray(linhas) ? linhas : [];
  if (list.length === 0) return;

  const dataRows = list.map((a) => linhaAtivo(grupo, a));
  const base = sanitizeFilename(grupo?.inventario_nome);
  const stamp = stampFicheiro();

  const sheetData = [HEADERS, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!cols"] = largurasColunas(dataRows);

  const wb = XLSX.utils.book_new();
  const sheetName = sanitizeFilename(grupo?.inventario_nome).slice(0, 31) || "Computadores";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, `Computadores_${base}_${stamp}.xlsx`, { bookType: "xlsx", compression: true });
}
