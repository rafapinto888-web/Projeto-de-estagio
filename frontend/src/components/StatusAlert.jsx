/*
 * Alerta flutuante (Snackbar) para mensagens de sucesso, aviso ou erro.
 * Reage a mudanças na prop message e fecha automaticamente.
 */
import { useEffect, useState } from "react";
import { Alert, Snackbar } from "@mui/material";

export default function StatusAlert({ type = "ok", message }) {
  const [open, setOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");

  useEffect(() => {
    if (!message) {
      setOpen(false);
      return;
    }
    setCurrentMessage(message);
    setOpen(true);
  }, [message]);

  if (!currentMessage) return null;
  const severity = type === "err" ? "error" : type === "warn" ? "warning" : "success";
  const bgBySeverity = {
    error: "#fff1f2",
    warning: "#fffbeb",
    success: "#ecfdf3",
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={(_, reason) => {
        if (reason === "clickaway") return;
        setOpen(false);
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      sx={{ "&.MuiSnackbar-root": { left: { xs: 8, sm: 16 }, bottom: { xs: 8, sm: 16 } } }}
    >
      <Alert
        severity={severity}
        variant="filled"
        onClose={() => setOpen(false)}
        sx={{
          minWidth: { xs: "min(100%, 260px)", sm: 260 },
          maxWidth: { xs: "calc(100vw - 24px)", sm: 420 },
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          borderColor: "#dbe5f2",
          backgroundColor: bgBySeverity[severity],
          color: "#0f172a",
          "& .MuiAlert-icon": { color: "#0f172a" },
          "& .MuiAlert-action": { color: "#0f172a" },
          "& .MuiAlert-message": { flex: 1, minWidth: 0 },
        }}
      >
        {currentMessage}
      </Alert>
    </Snackbar>
  );
}

