/*
 * Apresentação de equipamentos: detalhe, pesquisa global e reexport do domínio.
 */

export {
  txtBd,
  formatarDataPt,
  ipEquipamento,
  origemDispositivo,
} from "../domain/equipamento/index.js";

import { txtBd, formatarDataPt, ipEquipamento } from "../domain/equipamento/index.js";

/**
 * Linhas [rótulo, valor] para painel de detalhe — alinha inventário manual e dispositivo do scan.
 */
export function linhasDetalheEquipamento(item, opts = {}) {
  // Uniformiza o painel de detalhe para computadores manuais e dispositivos descobertos por scan.
  const nomeInv = opts.nomeInventario ?? item?.inventario_nome ?? "—";
  const tipo = String(item?.tipo || "").toLowerCase();
  const isDesc = tipo === "dispositivo_descoberto";

  const linhas = [
    ["ID (BD)", item?.id != null ? String(item.id) : "—"],
    ["Inventário (ID)", item?.inventario_id != null ? String(item.inventario_id) : "—"],
    ["Inventário (nome)", txtBd(nomeInv)],
    ["IP", txtBd(ipEquipamento(item))],
    ["MAC", txtBd(item?.mac_address)],
    ["Hostname", txtBd(item?.hostname)],
    ["Nome", txtBd(item?.nome)],
    ["Sistema operativo", txtBd(item?.sistema_operativo)],
    ["Marca", txtBd(item?.marca)],
    ["Modelo", txtBd(item?.modelo)],
    ["Número de série", txtBd(item?.numero_serie)],
    ["Estado", txtBd(item?.estado)],
  ];

  if (isDesc) {
    linhas.push(
      ["Primeira vista (BD)", formatarDataPt(item?.criado_em)],
      ["Última vista (scan)", formatarDataPt(item?.ultima_vez_ativo_em)],
      ["Localização (inventário)", txtBd(item?.localizacao_nome)],
      ["Responsável (inventário)", txtBd(item?.utilizador_responsavel_nome)],
    );
  } else {
    linhas.push(
      ["Localização", txtBd(item?.localizacao_nome)],
      ["Responsável", txtBd(item?.utilizador_responsavel_nome)],
    );
  }

  return linhas;
}

export function secaoPesquisaEhEquipamento(secaoRaw) {
  // A pesquisa global agrega varios nomes de secao que no UI representam equipamentos.
  const s = String(secaoRaw || "").toLowerCase();
  return s === "computadores" || s.includes("dispositivo") || s.includes("ativo");
}

/**
 * Células alinhadas à grelha da pesquisa global.
 */
export function celulasGrelhaPesquisaGlobal(r) {
  // Converte cada tipo de resultado num shape fixo para a tabela partilhada da pesquisa.
  const item = r.item || {};
  const sec = String(r.secao || "").toLowerCase();
  const z = txtBd;

  if (secaoPesquisaEhEquipamento(r.secao)) {
    // Equipamentos usam o conjunto mais completo de colunas tecnicas.
    const ip = ipEquipamento(item);
    return {
      kind: "equipamento",
      id: item.id != null ? String(item.id) : "—",
      nome: z(item.nome || item.hostname || r.nome),
      hostname: z(item.hostname),
      ip: z(ip),
      mac: z(item.mac_address),
      marca: z(item.marca),
      modelo: z(item.modelo),
      serie: z(item.numero_serie),
      so: z(item.sistema_operativo),
      inventario: z(item.inventario_nome),
      localizacao: z(item.localizacao_nome),
      responsavel: z(item.utilizador_responsavel_nome || item.utilizador_nome),
      estado: z(item.estado),
      extra: "—",
    };
  }

  if (sec === "inventarios") {
    // Inventarios ocupam as mesmas colunas, preenchendo so os campos relevantes.
    const tipo = String(item.tipo_inventario || "").replace("_", " ");
    return {
      kind: "outro",
      id: item.id != null ? String(item.id) : "—",
      nome: z(item.nome),
      hostname: "—",
      ip: z(item.rede),
      mac: "—",
      marca: "—",
      modelo: z(tipo || item.descricao),
      serie: "—",
      so: "—",
      inventario: "—",
      localizacao: "—",
      responsavel: "—",
      estado: "—",
      extra: z(item.descricao),
    };
  }

  if (sec === "utilizadores") {
    // Utilizadores reutilizam a grelha sem criar uma tabela alternativa so para pessoas.
    return {
      kind: "outro",
      id: item.id != null ? String(item.id) : "—",
      nome: z(item.nome || item.username),
      hostname: z(item.username),
      ip: "—",
      mac: "—",
      marca: "—",
      modelo: "—",
      serie: "—",
      so: "—",
      inventario: "—",
      localizacao: "—",
      responsavel: z(item.nome),
      estado: "—",
      extra: z(item.email),
    };
  }

  if (sec === "localizacoes") {
    // Localizacoes reaproveitam o campo "localizacao" como coluna principal da secao.
    return {
      kind: "outro",
      id: item.id != null ? String(item.id) : "—",
      nome: z(item.nome),
      hostname: "—",
      ip: "—",
      mac: "—",
      marca: "—",
      modelo: "—",
      serie: "—",
      so: "—",
      inventario: "—",
      localizacao: z(item.nome),
      responsavel: "—",
      estado: "—",
      extra: z(item.descricao),
    };
  }

  return {
    kind: "outro",
    id: "—",
    nome: z(r.nome),
    hostname: "—",
    ip: "—",
    mac: "—",
    marca: "—",
    modelo: "—",
    serie: "—",
    so: "—",
    inventario: "—",
    localizacao: z(r.localizacao),
    responsavel: z(r.utilizador),
    estado: z(r.estado),
    extra: z(r.desc || r.detalhes),
  };
}
