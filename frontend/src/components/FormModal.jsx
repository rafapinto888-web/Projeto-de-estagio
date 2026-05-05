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
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          border: "1px solid #dbe5f2",
          boxShadow: "0 18px 48px rgba(15, 23, 42, 0.12)",
        },
      }}
    >
      <DialogTitle id={titleId} sx={{ pr: 6 }}>
        {title}
        <IconButton
          aria-label="Fechar"
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            close
          </span>
        </IconButton>
        {subtitle ? (
          <Typography component="div" variant="body2" color="text.secondary" mt={0.75}>
            {subtitle}
          </Typography>
        ) : null}
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: "#e2e8f0", p: 2.2 }}>
        {children}
      </DialogContent>
      {footer ? <DialogActions sx={{ px: 2.2, py: 1.6 }}>{footer}</DialogActions> : null}
    </Dialog>
  );
}
