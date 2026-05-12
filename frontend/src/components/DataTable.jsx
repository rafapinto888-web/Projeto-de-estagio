/* Comentario geral deste ficheiro: tabela padronizada com estado vazio e loading. */

import { CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import EmptyState from "./EmptyState";

export default function DataTable({
  columns,
  rows,
  renderRow,
  loading,
  emptyTitle,
  emptyDescription,
  tableClassName = "",
}) {
  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 2.25, display: "flex", alignItems: "center", gap: 1.2 }}>
        <CircularProgress size={18} />
        <Typography fontSize={14}>A carregar dados...</Typography>
      </Paper>
    );
  }

  if (!rows?.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      className={tableClassName}
      sx={{
        borderRadius: 2,
        borderColor: "#dbe5f2",
        bgcolor: "#fff",
        maxWidth: "100%",
        overflowX: "auto",
      }}
    >
      <Table size="small" sx={{ width: "100%" }}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col} sx={{ fontWeight: 700, fontSize: 12, color: "#334155" }}>
                {col}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody
          sx={{
            "& .MuiTableRow-root:hover": {
              backgroundColor: "#f8fbff",
            },
          }}
        >
          {rows.map((row, idx) => renderRow(row, idx, columns))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

