/*
 * Estilos sx reutilizáveis para células de tabela (nowrap, mono, ellipsis).
 */

export const tableCellNowrap = {
  whiteSpace: "nowrap",
  wordBreak: "normal",
  overflowWrap: "normal",
};

export function tableCellMono(minWidth) {
  // Fonte mono e numeros tabulares ajudam a alinhar IPs, IDs e series.
  return {
    ...tableCellNowrap,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "0.6875rem",
    minWidth,
    fontVariantNumeric: "tabular-nums",
  };
}

export function tableCellEllipsis(minWidth = 100, maxWidth = 220) {
  // O corte visual evita quebrar o layout quando a tabela precisa caber sem scroll excessivo.
  return {
    ...tableCellNowrap,
    minWidth,
    maxWidth,
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
}

/** Regras ao nível da `<Table>` para anular `break-word` global em tbody. */
export const tableSxSemQuebra = {
  "& .MuiTableCell-root": {
    wordBreak: "normal",
    overflowWrap: "normal",
    verticalAlign: "middle",
  },
  "& .MuiTableCell-head": {
    whiteSpace: "nowrap",
  },
};
