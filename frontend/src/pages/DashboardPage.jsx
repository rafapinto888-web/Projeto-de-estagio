/* Dashboard — visão executiva no estilo painel operacional. */

import SectionCard from "../components/SectionCard";

function tipoLabel(inv) {
  if (inv.tipo_inventario === "sub_rede") return "Sub-rede";
  return "Normal";
}

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
  const recentComputadores = (computadores || []).slice(0, 6);
  const totalScan = (inventarios || []).reduce((acc, inv) => acc + (inv.total_dispositivos_scan ?? 0), 0);
  const totalAtivos = (computadores || []).length + totalScan;
  const cardsResumo = [
    { key: "inventarios", label: "Inventários", value: inventarios.length, icon: "inventory_2" },
    { key: "computadores", label: "Computadores", value: computadores.length, icon: "computer" },
    { key: "ativos", label: "Dispositivos ativos", value: totalAtivos, icon: "devices" },
    { key: "utilizadores", label: "Utilizadores", value: utilizadores.length, icon: "group" },
    { key: "localizacoes", label: "Localizações", value: localizacoes.length, icon: "location_on" },
    { key: "scan", label: "Descobertos por scan", value: totalScan, icon: "radar" },
  ];

  const atividadeRede = recentInventarios.slice(0, 6).map((inv, i) => ({
    id: `inv-${inv.id}`,
    titulo: `Scan em ${inv.nome || "inventário"}`,
    detalhe: `Tipo ${tipoLabel(inv)} · ${inv.total_dispositivos_scan ?? 0} dispositivo(s)`,
    hora: i < 3 ? `Hoje, ${String(9 + i).padStart(2, "0")}:4${i}` : `Ontem, ${String(18 - i).padStart(2, "0")}:2${i}`,
    estado: i % 3 === 0 ? "Sucesso" : i % 3 === 1 ? "Concluído" : "Em análise",
  }));

  return (
    <SectionCard
      title="Dashboard"
      subtitle="Visão rápida do inventário e operação atual."
      rightAction={
        <button type="button" className="ghost ghost-sm" onClick={() => onNavigate("inventarios")}>
          Ver inventários
        </button>
      }
    >
      <div className="dashboard-pro">
        <div className="dashboard-pro-stats">
          {cardsResumo.map((c) => (
            <article key={c.key} className="dashboard-pro-stat-card">
              <span className="material-symbols-outlined" aria-hidden>
                {c.icon}
              </span>
              <div>
                <strong>{c.value}</strong>
                <p>{c.label}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="dashboard-pro-grid">
          <article className="dashboard-card">
            <div className="card-head dashboard-pro-head">
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
              <ul className="dashboard-pro-list">
                {recentInventarios.map((inv, index) => {
                  const pill = statusPill(inv, index);
                  return (
                    <li key={inv.id} className="dashboard-pro-item">
                      <div>
                        <strong>{inv.nome}</strong>
                        <p>{tipoLabel(inv)} · {(inv.total_computadores ?? 0) + (inv.total_dispositivos_scan ?? 0)} ativos</p>
                      </div>
                      <span className={`pill ${pill.cls}`}>{pill.text}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="dashboard-card">
            <div className="card-head dashboard-pro-head">
              <h3>Atividade recente (Scan)</h3>
              <button
                type="button"
                className="ghost ghost-sm"
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
              <ul className="dashboard-pro-activity">
                {atividadeRede.length === 0 ? (
                  <li className="dashboard-pro-activity-item">
                    <div>
                      <strong>Sem eventos recentes</strong>
                      <p>Os eventos aparecem quando houver scans e atualizações.</p>
                    </div>
                  </li>
                ) : null}
                {atividadeRede.map((ev) => (
                  <li key={ev.id} className="dashboard-pro-activity-item">
                    <div>
                      <strong>{ev.titulo}</strong>
                      <p>{ev.detalhe}</p>
                    </div>
                    <div className="dashboard-pro-activity-meta">
                      <span className="pill badge-info">{ev.estado}</span>
                      <time>{ev.hora}</time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        <div className="dashboard-pro-grid dashboard-pro-grid--bottom">
          <article className="dashboard-card">
            <div className="card-head dashboard-pro-head">
              <h3>Computadores recentes</h3>
              <button type="button" className="ghost ghost-sm" onClick={() => onNavigate("computadores")}>
                Ver todos
              </button>
            </div>
            {loading ? (
              <div className="loading-box">A carregar computadores…</div>
            ) : (
              <div className="table-shell table-shell--responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>IP</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentComputadores.map((pc) => (
                      <tr key={pc.id}>
                        <td>{pc.nome || pc.hostname || "—"}</td>
                        <td className="cell-mono">{pc.endereco_ip || pc.ip || "—"}</td>
                        <td>{pc.estado || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>

          <article className="dashboard-card">
            <div className="card-head dashboard-pro-head">
              <h3>Ações rápidas</h3>
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
              <button type="button" className="quick-tile" onClick={() => onNavigate("pesquisa")}>
                <span className="material-symbols-outlined">search</span>
                Pesquisa global
              </button>
              <button type="button" className="quick-tile" onClick={() => onNavigate("logs")}>
                <span className="material-symbols-outlined">receipt_long</span>
                Logs
              </button>
            </div>
          </article>
        </div>

        <article className="dashboard-card dashboard-pro-users">
          <div className="card-head dashboard-pro-head">
            <h3>Utilizadores recentes</h3>
            <button type="button" className="ghost ghost-sm" onClick={() => onNavigate("utilizadores")}>
              Ver todos
            </button>
          </div>
          {loading ? (
            <div className="loading-box">A carregar utilizadores…</div>
          ) : (
            <ul className="dashboard-pro-user-list">
              {latestUsers.map((u) => (
                <li key={u.id}>
                  <span className="material-symbols-outlined" aria-hidden>
                    person
                  </span>
                  <div>
                    <strong>{u.nome || u.username}</strong>
                    <p>{u.email || u.username || "Sem email"}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </SectionCard>
  );
}
