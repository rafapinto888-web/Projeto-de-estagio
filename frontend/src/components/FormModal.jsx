/* Modal reutilizável para formulários CRUD (overlay, Escape, foco semântico). */

import { useCallback, useEffect } from "react";

export default function FormModal({ open, onClose, title, subtitle, wide, titleId = "form-modal-title", children, footer }) {
  const close = useCallback(() => onClose?.(), [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    function esc(e) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className={`modal-sheet${wide ? " modal-sheet--wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <div>
            <h2 id={titleId} className="modal-title">
              {title}
            </h2>
            {subtitle ? <div className="modal-sub">{subtitle}</div> : null}
          </div>
          <button type="button" className="modal-close ghost table-btn" onClick={close} aria-label="Fechar">
            ✕
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </div>
    </div>
  );
}
