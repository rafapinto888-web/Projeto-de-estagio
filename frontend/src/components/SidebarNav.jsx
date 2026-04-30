/* Comentario geral deste ficheiro: navegacao lateral reutilizavel da aplicacao. */

export default function SidebarNav({ tabs, activeTab, onSelect }) {
  return (
    <aside className="sidebar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={activeTab === tab.id ? "tab active" : "tab"}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </aside>
  );
}

