/** Texto vindo da API/BD para células e painéis (vazio → traço). */
export function txtBd(v) {
  if (v == null) return "—";
  const s = String(v).trim();
  return s || "—";
}

export function formatarDataPt(v) {
  if (v == null || v === "") return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("pt-PT");
}

export function ipEquipamento(item) {
  if (!item) return null;
  return item.ip || item.endereco_ip || null;
}

/** Origem na lista unificada: manual vs scan (usa sempre o campo `tipo` da API). */
export function origemDispositivo(a) {
  const t = String(a?.tipo || "").toLowerCase();
  if (t === "computador") return "manual";
  if (t === "dispositivo_descoberto") return "scan";
  return "scan";
}

export function situacaoScan(a) {
  const c = a?.criado_em;
  const u = a?.ultima_vez_ativo_em;
  if (!c && !u) return "desconhecido";
  const tc = c ? new Date(c).getTime() : NaN;
  const tu = u ? new Date(u).getTime() : NaN;
  if (!Number.isFinite(tc) || !Number.isFinite(tu)) return "desconhecido";
  if (tu > tc + 3000) return "atualizado";
  return "primeira_vez";
}

export function etiquetaSituacaoScan(a) {
  const s = situacaoScan(a);
  if (s === "atualizado") return "Actualizado no scan";
  if (s === "primeira_vez") return "Primeira deteção";
  return "Desconhecido";
}

/**
 * Linhas [rótulo, valor] para painel de detalhe — alinha inventário manual e dispositivo do scan.
 * @param {object} item
 * @param {{ nomeInventario?: string }} [opts]
 * @returns {Array<[string, string]>}
 */
export function linhasDetalheEquipamento(item, opts = {}) {
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
      ["Deteção (scan)", etiquetaSituacaoScan(item)],
      ["Primeira vista (BD)", formatarDataPt(item?.criado_em)],
      ["Última vista (scan)", formatarDataPt(item?.ultima_vez_ativo_em)],
      ["Origem registo (BD)", txtBd(item?.origem_registo)],
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
  const s = String(secaoRaw || "").toLowerCase();
  return s === "computadores" || s.includes("dispositivo") || s.includes("ativo");
}

/**
 * Células alinhadas à grelha “completa” da pesquisa global (uma linha = um tipo de entidade).
 * @param {{ secao: string, item?: object, nome?: string }} r
 */
export function celulasGrelhaPesquisaGlobal(r) {
  const item = r.item || {};
  const sec = String(r.secao || "").toLowerCase();
  const z = txtBd;

  if (secaoPesquisaEhEquipamento(r.secao)) {
    const ip = ipEquipamento(item);
    const det = item.tipo === "dispositivo_descoberto" ? etiquetaSituacaoScan(item) : "—";
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
      deteccao: det,
      extra: item.tipo === "dispositivo_descoberto" ? z(item.origem_registo) : "—",
    };
  }

  if (sec === "inventarios") {
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
      deteccao: "—",
      extra: z(item.descricao),
    };
  }

  if (sec === "utilizadores") {
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
      deteccao: "—",
      extra: z(item.email),
    };
  }

  if (sec === "localizacoes") {
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
      deteccao: "—",
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
    deteccao: "—",
    extra: z(r.desc || r.detalhes),
  };
}
