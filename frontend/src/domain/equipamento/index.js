/*
 * Barrel: exporta formatters, origem e funções de pesquisa de equipamento.
 */

export {
  txtBd,
  textoExport,
  formatarDataPt,
  formatarDataPtCurta,
  formatarDataPtExport,
  ipEquipamento,
} from "./formatters.js";
export { origemRegistoVisual, etiquetaOrigemAmigavel, origemDispositivo } from "./origem.js";
export { labelAtivo, textoAtivoBusca, normalizarTermoBusca } from "./search.js";
