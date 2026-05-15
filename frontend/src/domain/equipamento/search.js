import { ipEquipamento } from "./formatters.js";

/** Nome de exibição para ordenação e títulos. */
export function labelAtivo(a) {
  if (a?.tipo === "computador") return a.nome || a.hostname || "—";
  return a.hostname || a.ip || ipEquipamento(a) || `Scan #${a?.id ?? "?"}`;
}

/** Texto usado em filtros de pesquisa local (Computadores, etc.). */
export function textoAtivoBusca(a) {
  const partes = [
    a?.id,
    a?.nome,
    a?.hostname,
    a?.ip,
    a?.endereco_ip,
    a?.mac_address,
    a?.numero_serie,
    a?.marca,
    a?.modelo,
    a?.sistema_operativo,
    a?.estado,
    a?.localizacao_nome,
    a?.utilizador_responsavel_nome,
    a?.origem_registo,
    a?.criado_em,
  ];
  return partes
    .filter((x) => x != null && String(x).trim() !== "")
    .join(" ")
    .toLowerCase();
}

export function normalizarTermoBusca(termo) {
  return String(termo || "")
    .trim()
    .toLowerCase();
}
