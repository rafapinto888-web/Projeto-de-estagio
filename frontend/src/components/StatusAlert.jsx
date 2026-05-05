/* Comentario geral deste ficheiro: componente visual para feedback de estado. */
import { Alert } from "@mui/material";

export default function StatusAlert({ type = "ok", message }) {
  if (!message) return null;
  const severity = type === "err" ? "error" : type === "warn" ? "warning" : "success";
  const bgBySeverity = {
    error: "#fff1f2",
    warning: "#fffbeb",
    success: "#ecfdf3",
  };
  return (
    <Alert
      severity={severity}
      sx={{
        mb: 2,
        borderColor: "#dbe5f2",
        backgroundColor: bgBySeverity[severity],
      }}
    >
      {message}
    </Alert>
  );
}

