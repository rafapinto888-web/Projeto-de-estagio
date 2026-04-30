/* Comentario geral deste ficheiro: cabecalho superior com sessao e contexto. */

export default function Topbar({ user, isAdmin, onLogout }) {
  return (
    <header className="topbar">
      <div>
        <h1>Sistema de Inventario</h1>
        <p>Painel profissional com React e FastAPI</p>
      </div>
      <div className="topbar-actions">
        <span className="badge">{user?.username || user?.email || "utilizador"}</span>
        <span className="badge">{isAdmin ? "Administrador" : "Utilizador"}</span>
        <button className="ghost" onClick={onLogout}>
          Terminar sessao
        </button>
      </div>
    </header>
  );
}

