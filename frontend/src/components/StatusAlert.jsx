/* Comentario geral deste ficheiro: componente visual para feedback de estado. */
import { Alert } from "@mui/material";

export default function StatusAlert({ type = "ok", message }) {
  if (!message) return null;
  const severity = type === "err" ? "error" : type === "warn" ? "warning" : "success";
  return (
    <Alert severity={severity} sx={{ mb: 2 }}>
      {message}
    </Alert>
  );
}

