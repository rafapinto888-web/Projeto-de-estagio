/* Comentario geral deste ficheiro: pagina principal com visao geral e indicadores. */

function statusInventario(inv) {
  if (inv.tipo_inventario === "sub_rede") return "Rede";
  return "Normal";
}

export default function DashboardPage({
  inventarios,
  computadores,
  utilizadores,
  localizacoes,
  loading,
  onNavigate,
}) {
  const recentInventarios = (inventarios || []).slice(0, 6);
  const latestUsers = (utilizadores || []).slice(0, 4);

  return (
    <section className="panel dashboard-panel">
      <div className="section-head">
        <div>
          <h2>Visao Geral</h2>
          <p className="section-subtitle">Resumo do sistema e atividades recentes.</p>
        </div>
        <button onClick={() => onNavigate("inventarios")}>+ Criar inventario</button>
      </div>

      <div className="kpis dashboard-kpis">
        <article>
          <span>Total de Ativos</span>
          <strong>{computadores.length}</strong>
          <small>{inventarios.length} inventarios ativos</small>
        </article>
        <article>
          <span>Computadores</span>
          <strong>{computadores.length}</strong>
          <small>Registos no sistema</small>
        </article>
        <article>
          <span>Utilizadores</span>
          <strong>{utilizadores.length}</strong>
          <small>Contas de acesso</small>
        </article>
        <article>
          <span>Localizacoes</span>
          <strong>{localizacoes.length}</strong>
          <small>Pontos catalogados</small>
        </article>
      </div>

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <div className="card-head">
            <h3>Inventarios recentes</h3>
            <button className="ghost" onClick={() => onNavigate("inventarios")}>
              Ver todos
            </button>
          </div>
          {loading ? (
            <div className="loading-box">A carregar inventarios...</div>
          ) : recentInventarios.length === 0 ? (
            <div className="empty-state">
              <h3>Sem inventarios ainda</h3>
              <p>Cria o primeiro inventario para iniciar o dashboard.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>IP Rede</th>
                </tr>
              </thead>
              <tbody>
                {recentInventarios.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.id}</td>
                    <td>{inv.nome}</td>
                    <td>{statusInventario(inv)}</td>
                    <td>{inv.ip_rede || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>

        <article className="dashboard-card">
          <div className="card-head">
            <h3>Atividades recentes</h3>
            <button className="ghost" onClick={() => onNavigate("logs")}>
              Ver logs
            </button>
          </div>
          {loading ? (
            <div className="loading-box">A carregar atividade...</div>
          ) : (
            <ul className="activity-list">
              {latestUsers.length > 0 ? (
                latestUsers.map((u) => (
                  <li key={u.id}>
                    <strong>{u.username}</strong>
                    <span>Utilizador registado/atualizado no sistema</span>
                  </li>
                ))
              ) : (
                <li>
                  <strong>Sem atividade recente</strong>
                  <span>As atividades vao aparecer aqui automaticamente.</span>
                </li>
              )}
            </ul>
          )}
        </article>
      </div>

      <div className="dashboard-actions">
        <h3>Acoes rapidas</h3>
        <div className="quick-grid">
          <button className="ghost" onClick={() => onNavigate("inventarios")}>
            Novo inventario
          </button>
          <button className="ghost" onClick={() => onNavigate("ativos")}>
            Descobrir ativos
          </button>
          <button className="ghost" onClick={() => onNavigate("computadores")}>
            Adicionar computador
          </button>
          <button className="ghost" onClick={() => onNavigate("utilizadores")}>
            Adicionar utilizador
          </button>
        </div>
      </div>
    </section>
  );
}

