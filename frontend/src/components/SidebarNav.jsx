/* Navegação lateral — visual alinhado ao painel «Sistema de Inventário». */

const NAV_ICONS = {
  dashboard: "dashboard",
  inventarios: "inventory_2",
  ativos: "radar",
  computadores: "computer",
  utilizadores: "group",
  perfis: "badge",
  localizacoes: "pin_drop",
  pesquisa: "manage_search",
  "historico-conta": "history",
  logs: "receipt_long",
};

export default function SidebarNav({ tabs, activeTab, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark" aria-hidden>
          <span className="material-symbols-outlined">inventory_2</span>
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-title">Sistema de Inventário</span>
          <span className="sidebar-brand-tag">Painel administrativo</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Módulos">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "tab active" : "tab"}
            onClick={() => onSelect(tab.id)}
          >
            <span className="material-symbols-outlined nav-icon" aria-hidden>
              {NAV_ICONS[tab.id] || "widgets"}
            </span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status-dot" aria-hidden />
        <div>
          <strong>Sistema operacional</strong>
          <span>Ligação estável ao servidor.</span>
        </div>
      </div>
    </aside>
  );
}
