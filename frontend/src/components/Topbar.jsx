/* Cabeçalho superior: pesquisa global, íconos e utilizador atual. */

import { useEffect, useRef } from "react";

function initials(user) {
  const base = user?.nome || user?.username || user?.email || "?";
  const parts = String(base).trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] || "";
  return (a + b).toUpperCase().slice(0, 2) || "?";
}

export default function Topbar({ user, isAdmin, onLogout, onSearch, onNavigate }) {
  const inputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function runSearch() {
    const q = inputRef.current?.value?.trim();
    if (q) onSearch?.(q);
  }

  return (
    <header className="topbar">
      <div className="topbar-search-wrap">
        <span className="topbar-search-icon material-symbols-outlined" aria-hidden>
          search
        </span>
        <input
          ref={inputRef}
          type="search"
          className="topbar-search-input"
          placeholder="Pesquisa global de ativos, inventários…"
          aria-label="Pesquisa global"
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
        />
        <div className="topbar-search-kbd" aria-hidden>
          <kbd>Ctrl</kbd>
          <kbd>K</kbd>
        </div>
      </div>

      <div className="topbar-actions">
        <button
          type="button"
          className="icon-btn"
          title="Notificações"
          aria-label="Notificações"
          onClick={() => onNavigate?.("logs")}
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="icon-btn-badge">3</span>
        </button>
        <button
          type="button"
          className="icon-btn"
          title="Ajuda"
          aria-label="Ajuda"
          onClick={() => onNavigate?.("pesquisa")}
        >
          <span className="material-symbols-outlined">help</span>
        </button>

        <div className="topbar-user">
          <div className="topbar-avatar" aria-hidden>
            {initials(user)}
          </div>
          <div className="topbar-user-meta">
            <span className="topbar-user-name">{user?.nome || user?.username || "Utilizador"}</span>
            <span className="topbar-user-role">{isAdmin ? "Administrador" : "Utilizador"}</span>
          </div>
          <button type="button" className="ghost topbar-logout" onClick={onLogout}>
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
