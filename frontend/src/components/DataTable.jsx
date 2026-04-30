/* Comentario geral deste ficheiro: tabela padronizada com estado vazio e loading. */

import EmptyState from "./EmptyState";

export default function DataTable({ columns, rows, renderRow, loading, emptyTitle, emptyDescription }) {
  if (loading) {
    return <div className="loading-box">A carregar dados...</div>;
  }

  if (!rows?.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <table>
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>{rows.map(renderRow)}</tbody>
    </table>
  );
}

