/** Estilos partilhados para células de tabela (evita quebra vertical agressiva). */

export const tableCellNowrap = {
  whiteSpace: "nowrap",
  wordBreak: "normal",
  overflowWrap: "normal",
};

export function tableCellMono(minWidth) {
  return {
    ...tableCellNowrap,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "0.6875rem",
    minWidth,
    fontVariantNumeric: "tabular-nums",
  };
}

export function tableCellEllipsis(minWidth = 100, maxWidth = 220) {
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
