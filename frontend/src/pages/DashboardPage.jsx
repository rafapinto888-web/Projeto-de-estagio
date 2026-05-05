/* Dashboard — KPIs, inventários recentes e atividade recente; Histórico abre a tua conta na aba Histórico. */

import MiniSparkline from "../components/MiniSparkline";
import SectionCard from "../components/SectionCard";

function tipoLabel(inv) {
  if (inv.tipo_inventario === "sub_rede") return "Sub-rede";
  return "Normal";
}

/** Badges apenas visuais (sem campo dedicado na API). */
function statusPill(inv, index) {
  if (inv.tipo_inventario === "sub_rede") return { cls: "badge-info", text: "Em andamento" };
  const i = Number(inv?.id ?? index);
  if (i % 3 === 2) return { cls: "badge-scheduled", text: "Agendado" };
  return { cls: "badge-done", text: "Concluído" };
}

export default function DashboardPage({
  inventarios,
  computadores,
  utilizadores,
  localizacoes,
  loading,
  onNavigate,
  onOpenHistorico,
}) {
  const abrirMeuHistorico =
    typeof onOpenHistorico === "function" ? onOpenHistorico : () => onNavigate("historico-conta");

  const recentInventarios = (inventarios || []).slice(0, 5);
  const latestUsers = (utilizadores || []).slice(0, 4);
  const totalAtivos = (computadores || []).length + (inventarios || []).reduce((acc, inv) => acc + (inv.total_dispositivos_scan ?? 0), 0);

  return (
    <SectionCard
      title="Dashboard"
      subtitle="Visão geral da plataforma com estado atual do parque, atividade recente e atalhos de gestão."
      rightAction={
        <button type="button" className="btn-chip-primary" onClick={() => onNavigate("inventarios")}>
          Inventários
        </button>
      }
    >
      <div className="dashboard-inner">
        <article className="dashboard-overview">
          <div className="dashboard-overview-item">
            <span className="material-symbols-outlined" aria-hidden>
              domain
            </span>
            <div>
              <strong>{inventarios.length}</strong>
              <p>Inventários ativos</p>
            </div>
          </div>
          <div className="dashboard-overview-item">
            <span className="material-symbols-outlined" aria-hidden>
              devices
            </span>
            <div>
              <strong>{totalAtivos}</strong>
              <p>Ativos no sistema</p>
            </div>
          </div>
          <div className="dashboard-overview-item">
            <span className="material-symbols-outlined" aria-hidden>
              person
            </span>
            <div>
              <strong>{utilizadores.length}</strong>
              <p>Utilizadores registados</p>
            </div>
          </div>
          <button type="button" className="ghost dashboard-overview-cta" onClick={abrirMeuHistorico}>
            <span className="material-symbols-outlined" aria-hidden>
              history
            </span>
            Abrir histórico pessoal
          </button>
        </article>

        <div className="kpis dash-stat-grid">
          <article className="dash-stat-card dash-stat-card--inventarios">
            <div className="dash-stat-top">
              <span className="dash-stat-label">
                <span className="material-symbols-outlined" aria-hidden>
                  inventory_2
                </span>
                Inventários
              </span>
              <MiniSparkline seed={inventarios.length + 501} accent="#64748b" />
            </div>
            <strong className="dash-stat-value">{inventarios.length}</strong>
            <span className="dash-stat-foot">Base de organização principal</span>
          </article>
          <article className="dash-stat-card dash-stat-card--computadores">
            <div className="dash-stat-top">
              <span className="dash-stat-label">
                <span className="material-symbols-outlined" aria-hidden>
                  computer
                </span>
                Computadores
              </span>
              <MiniSparkline seed={computadores.length + 7} accent="#7c3aed" />
            </div>
            <strong className="dash-stat-value">{computadores.length}</strong>
            <span className="dash-stat-foot">Registos manuais associados</span>
          </article>
          <article className="dash-stat-card dash-stat-card--utilizadores">
            <div className="dash-stat-top">
              <span className="dash-stat-label">
                <span className="material-symbols-outlined" aria-hidden>
                  group
                </span>
                Utilizadores
              </span>
              <MiniSparkline seed={utilizadores.length + 101} accent="#059669" />
            </div>
            <strong className="dash-stat-value">{utilizadores.length}</strong>
            <span className="dash-stat-foot">Contas com acesso à plataforma</span>
          </article>
          <article className="dash-stat-card dash-stat-card--localizacoes">
            <div className="dash-stat-top">
              <span className="dash-stat-label">
                <span className="material-symbols-outlined" aria-hidden>
                  location_on
                </span>
                Localizações
              </span>
              <MiniSparkline seed={localizacoes.length + 503} accent="#0891b2" />
            </div>
            <strong className="dash-stat-value">{localizacoes.length}</strong>
            <span className="dash-stat-foot">Contexto físico dos ativos</span>
          </article>
        </div>

        <div className="dashboard-grid dash-ref-grid">
          <article className="dashboard-card dash-table-card">
            <div className="card-head">
              <h3>Inventários recentes</h3>
              <button type="button" className="ghost ghost-sm" onClick={() => onNavigate("inventarios")}>
                Ver todos
              </button>
            </div>
            {loading ? (
              <div className="loading-box">A carregar inventários…</div>
            ) : recentInventarios.length === 0 ? (
              <div className="empty-state">
                <h3>Sem inventários</h3>
                <p>Cria o primeiro inventário para ver o estado aqui.</p>
              </div>
            ) : (
              <>
                <div className="table-shell dash-table-flat">
                  <table>
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Tipo</th>
                        <th>PCs</th>
                        <th>Estado</th>
                        <th>Atualizado</th>
                        <th className="th-actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {recentInventarios.map((inv, index) => {
                        const pill = statusPill(inv, index);
                        const n =
                          (inv.total_computadores ?? 0) + (inv.total_dispositivos_scan ?? 0);
                        return (
                          <tr key={inv.id}>
                            <td>
                              <span className="cell-title">{inv.nome}</span>
                              {inv.descricao ? (
                                <span className="cell-muted">{inv.descricao}</span>
                              ) : (
                                <span className="cell-muted">Inventário</span>
                              )}
                            </td>
                            <td>{tipoLabel(inv)}</td>
                            <td>{n}</td>
                            <td>
                              <span className={`pill ${pill.cls}`}>{pill.text}</span>
                            </td>
                            <td className="cell-muted">—</td>
                            <td>
                              <button
                                type="button"
                                className="table-icon-btn"
                                title="Gerir inventários"
                                onClick={() => onNavigate("inventarios")}
                                aria-label="Gerir inventários"
                              >
                                <span className="material-symbols-outlined">more_vert</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button type="button" className="link-all" onClick={() => onNavigate("inventarios")}>
                  Ver todos os inventários
                </button>
              </>
            )}
          </article>

          <article className="dashboard-card dash-feed-card">
            <div className="card-head card-head--historico">
              <h3>Atividade recente</h3>
              <button
                type="button"
                className="ghost ghost-sm dash-historico-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  abrirMeuHistorico();
                }}
              >
                Histórico
              </button>
            </div>
            {loading ? (
              <div className="loading-box">A carregar…</div>
            ) : (
              <ul className="activity-timeline">
                {latestUsers.length === 0 && recentInventarios.length === 0 ? (
                  <li className="timeline-item">
                    <span className="timeline-icon muted material-symbols-outlined">hourglass_empty</span>
                    <div>
                      <strong>Sem eventos recentes</strong>
                      <p>Os eventos aparecem quando houver dados no sistema.</p>
                    </div>
                  </li>
                ) : null}
                {recentInventarios.slice(0, 3).map((inv, i) => (
                  <li key={`inv-act-${inv.id}`} className="timeline-item">
                    <span className="timeline-icon info material-symbols-outlined">inventory_2</span>
                    <div>
                      <strong>Inventário {inv.nome || "sem nome"}</strong>
                      <p>
                        Inventário atualizado · {tipoLabel(inv)} · <time>{String(14 + i).padStart(2, "0")}:30</time>
                      </p>
                    </div>
                  </li>
                ))}
                {latestUsers.map((u, i) => (
                  <li key={`u-act-${u.id}`} className="timeline-item">
                    <span className="timeline-icon ok material-symbols-outlined">person_add</span>
                    <div>
                      <strong>{u.nome || u.username}</strong>
                      <p>
                        Conta de utilizador ativa · <time>{String(9 + i).padStart(2, "0")}:15</time>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="dash-feed-footnote">
              O botão <strong>Histórico</strong> mostra as atividades registadas só para <strong>a tua conta</strong>.
              Para registos de rede (segurança/RDP), usa a aba <strong>Logs</strong>.
            </p>
          </article>
        </div>

        <article className="dashboard-card dash-quick-card">
          <div className="card-head">
            <h3>Atalhos</h3>
          </div>
          <div className="quick-tiles">
            <button type="button" className="quick-tile" onClick={() => onNavigate("inventarios")}>
              <span className="material-symbols-outlined">inventory_2</span>
              Inventários
            </button>
            <button type="button" className="quick-tile" onClick={() => onNavigate("ativos")}>
              <span className="material-symbols-outlined">radar</span>
              Scan
            </button>
            <button type="button" className="quick-tile" onClick={() => onNavigate("computadores")}>
              <span className="material-symbols-outlined">computer</span>
              Computadores
            </button>
            <button type="button" className="quick-tile" onClick={() => onNavigate("utilizadores")}>
              <span className="material-symbols-outlined">group</span>
              Utilizadores
            </button>
            <button type="button" className="quick-tile quick-tile--accent" onClick={abrirMeuHistorico}>
              <span className="material-symbols-outlined">history</span>
              Histórico
            </button>
            <button type="button" className="quick-tile" onClick={() => onNavigate("logs")}>
              <span className="material-symbols-outlined">receipt_long</span>
              Logs
            </button>
            <button type="button" className="quick-tile" onClick={() => onNavigate("pesquisa")}>
              <span className="material-symbols-outlined">search</span>
              Pesquisa global
            </button>
          </div>
        </article>
      </div>
    </SectionCard>
  );
}
