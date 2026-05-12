/* Modal reutilizável para formulários CRUD (overlay, Escape, foco semântico). */

import { Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from "@mui/material";

export default function FormModal({ open, onClose, title, subtitle, wide, titleId = "form-modal-title", children, footer }) {
  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      fullWidth
      maxWidth={wide ? "lg" : "md"}
      aria-labelledby={titleId}
      BackdropProps={{
        sx: {
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(5px)",
        },
      }}
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: "1px solid #dbe5f2",
          boxShadow: "0 24px 56px rgba(15, 23, 42, 0.16)",
          overflow: "hidden",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
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
      <DialogContent sx={{ p: { xs: 1.8, sm: 2.4 }, bgcolor: "transparent" }}>
        {children}
      </DialogContent>
      {footer ? (
        <DialogActions
          sx={{
            px: { xs: 1.8, sm: 2.4 },
            py: 1.7,
            borderTop: "1px solid #e2e8f0",
            bgcolor: "rgba(248,250,252,0.9)",
            justifyContent: "flex-end",
          }}
        >
          {footer}
        </DialogActions>
      ) : null}
    </Dialog>
  );
}
