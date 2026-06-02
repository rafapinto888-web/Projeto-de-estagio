/*
 * Diálogo modal para formulários CRUD: título, subtítulo opcional e rodapé de ações.
 */

import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export default function FormModal({ open, onClose, title, subtitle, wide, titleId = "form-modal-title", children, footer }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"), { noSsr: true });

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      fullWidth
      fullScreen={fullScreen}
      maxWidth={wide ? "lg" : "md"}
      aria-labelledby={titleId}
      scroll="paper"
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(5px)",
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 3 },
          border: { xs: "none", sm: "1px solid #dbe5f2" },
          boxShadow: { xs: "none", sm: "0 24px 56px rgba(15, 23, 42, 0.16)" },
          overflow: "hidden",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
          ...(fullScreen
            ? {
                maxHeight: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }
            : {
                maxHeight: "calc(100% - 32px)",
                display: "flex",
                flexDirection: "column",
              }),
        },
      }}
    >
      <DialogTitle
        id={titleId}
        sx={{
          pr: 6.5,
          pb: subtitle ? 1.2 : 1.5,
          borderBottom: "1px solid #e2e8f0",
          bgcolor: "rgba(255,255,255,0.96)",
          flexShrink: 0,
        }}
      >
        <Typography component="div" sx={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "#0f172a" }}>
          {title}
        </Typography>
        <IconButton
          aria-label="Fechar"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 12,
            top: 11,
            border: "1px solid #e2e8f0",
            bgcolor: "#fff",
            color: "#64748b",
            "&:hover": { bgcolor: "#f8fafc", color: "#334155" },
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            close
          </span>
        </IconButton>
        {subtitle ? (
          <Typography component="div" variant="body2" color="text.secondary" mt={0.65} sx={{ fontSize: 13.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent
        sx={{
          p: { xs: 2, sm: 3 },
          bgcolor: "transparent",
          flex: "1 1 auto",
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {children}
      </DialogContent>
      {footer ? (
        <DialogActions
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            gap: 1,
            flexWrap: "wrap",
            flexDirection: { xs: "column-reverse", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            borderTop: "1px solid #e2e8f0",
            bgcolor: "rgba(248,250,252,0.95)",
            justifyContent: { xs: "stretch", sm: "flex-end" },
            flexShrink: 0,
          }}
        >
          {footer}
        </DialogActions>
      ) : null}
    </Dialog>
  );
}
