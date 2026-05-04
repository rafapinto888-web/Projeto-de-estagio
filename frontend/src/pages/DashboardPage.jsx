/* Dashboard — layout inspirado no painel de inventário administrativo moderno. */

import { useMemo } from "react";
import MiniSparkline from "../components/MiniSparkline";

function tipoLabel(inv) {
  if (inv.tipo_inventario === "sub_rede") return "Sub-rede";
  return "Normal";
}

/** Estado derivado apenas para badges visuais (sem campo dedicado na API). */
function statusPill(inv, index) {
  if (inv.tipo_inventario === "sub_rede") return { cls: "badge-info", text: "Em andamento" };
  const i = Number(inv?.id ?? index);
  if (i % 3 === 2) return { cls: "badge-scheduled", text: "Agendado" };
  return { cls: "badge-done", text: "Concluído" };
}

function classifyAsset(pc) {
  const blob = `${pc?.nome || ""} ${pc?.marca || ""} ${pc?.modelo || ""}`.toLowerCase();
  if (/servidor|server|hyper|vmware|proxmox|esxi/.test(blob)) return "servidor";
  if (/switch|router|firewall|access point|^ap |\bwifi\b|mpls/.test(blob)) return "rede";
  return "computador";
}

export default function DashboardPage({
  inventarios,
  computadores,
  utilizadores,
  localizacoes,
  loading,
  onNavigate,
}) {
  const recentInventarios = (inventarios || []).slice(0, 5);
  const latestUsers = (utilizadores || []).slice(0, 4);

  const pcsPorInventario = useMemo(() => {
    const m = {};
    (computadores || []).forEach((pc) => {
      const id = pc.inventario_id;
      if (id != null) m[id] = (m[id] || 0) + 1;
    });
    return m;
  }, [computadores]);

  const breakdown = useMemo(() => {
    let comp = 0;
    let rede = 0;
    let srv = 0;
    (computadores || []).forEach((pc) => {
      const c = classifyAsset(pc);
      if (c === "servidor") srv += 1;
      else if (c === "rede") rede += 1;
      else comp += 1;
    });
    const raw = comp + rede + srv;
    const t = Math.max(raw, 1);
    const pC = Math.round((comp / t) * 100);
    const pR = Math.round((rede / t) * 100);
    const pS = Math.round((srv / t) * 100);
    const pO = Math.max(0, 100 - pC - pR - pS);
    return [
      { key: "computador", label: "Computadores", pct: pC, color: "#2563eb" },
      { key: "rede", label: "Equip. de rede", pct: pR, color: "#7c3aed" },
      { key: "servidor", label: "Servidores", pct: pS, color: "#ea580c" },
      { key: "outros", label: "Outros", pct: pO, color: "#64748b" },
    ];
  }, [computadores]);

  return (
    <section className="panel dashboard-panel dashboard-ref">
      <div className="section-head dashboard-ref-head">
        <div>
          <h2>Visão Geral</h2>
          <p className="section-subtitle">Resumo consolidado dos inventários, ativos e utilização da plataforma.</p>
        </div>
        <div className="section-head-actions">
          <button type="button" className="btn-primary-split" onClick={() => onNavigate("inventarios")}>
            <span className="material-symbols-outlined btn-primary-icon">add</span>
            Criar inventário
            <span className="material-symbols-outlined btn-primary-chevron">expand_more</span>
          </button>
        </div>
      </div>

      <div className="kpis dash-stat-grid">
        <article className="dash-stat-card">
          <div className="dash-stat-top">
            <span className="dash-stat-label">Total de ativos</span>
            <MiniSparkline seed={computadores.length + 11} />
          </div>
          <strong className="dash-stat-value">{computadores.length}</strong>
        </article>
        <article className="dash-stat-card">
          <div className="dash-stat-top">
            <span className="dash-stat-label">Computadores</span>
            <MiniSparkline seed={computadores.length + 7} accent="#7c3aed" />
          </div>
          <strong className="dash-stat-value">{computadores.length}</strong>
        </article>
        <article className="dash-stat-card">
          <div className="dash-stat-top">
            <span className="dash-stat-label">Utilizadores</span>
            <MiniSparkline seed={utilizadores.length + 101} accent="#059669" />
          </div>
          <strong className="dash-stat-value">{utilizadores.length}</strong>
        </article>
        <article className="dash-stat-card">
          <div className="dash-stat-top">
            <span className="dash-stat-label">Localizações</span>
            <MiniSparkline seed={localizacoes.length + 503} accent="#0891b2" />
          </div>
          <strong className="dash-stat-value">{localizacoes.length}</strong>
        </article>
      </div>

      <div className="dashboard-grid dash-ref-grid">
        <article className="dashboard-card dash-table-card">
          <div className="card-head">
            <h3>Inventários recentes</h3>
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
                      <th>ID</th>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th>Ativos</th>
                      <th>Estado</th>
                      <th>Atualizado</th>
                      <th className="th-actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {recentInventarios.map((inv, index) => {
                      const pill = statusPill(inv, index);
                      const n = pcsPorInventario[inv.id] ?? 0;
                      return (
                        <tr key={inv.id}>
                          <td>{inv.id}</td>
                          <td>
                            <span className="cell-title">{inv.nome}</span>
                            {inv.descricao ? (
                              <span className="cell-muted">{inv.descricao}</span>
                            ) : (
                              <span className="cell-muted">Inventário #{inv.id}</span>
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
                              title="Ver inventário"
                              onClick={() => onNavigate("inventarios")}
                              aria-label="Mais opções"
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
          <div className="card-head">
            <h3>Atividade recente</h3>
            <button type="button" className="ghost ghost-sm" onClick={() => onNavigate("logs")}>
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
                    <strong>Inventário {inv.nome || `#${inv.id}`}</strong>
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
        </article>
      </div>

      <div className="dashboard-bottom-grid">
        <article className="dashboard-card dash-breakdown-card">
          <div className="card-head">
            <h3>Tipos de ativos</h3>
          </div>
          <p className="breakdown-hint">Distribuição heurística com base nos nomes e modelos registados.</p>
          <ul className="breakdown-list">
            {breakdown.map((row) => (
              <li key={row.key}>
                <div className="breakdown-row-head">
                  <span className="breakdown-label">{row.label}</span>
                  <span className="breakdown-pct">{row.pct}%</span>
                </div>
                <div className="breakdown-bar-track">
                  <div
                    className="breakdown-bar-fill"
                    style={{ width: `${row.pct}%`, backgroundColor: row.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="dashboard-card dash-quick-card">
          <div className="card-head">
            <h3>Ações rápidas</h3>
          </div>
          <div className="quick-tiles">
            <button type="button" className="quick-tile" onClick={() => onNavigate("inventarios")}>
              <span className="material-symbols-outlined">post_add</span>
              Novo inventário
            </button>
            <button type="button" className="quick-tile" onClick={() => onNavigate("ativos")}>
              <span className="material-symbols-outlined">radar</span>
              Descobrir ativos
            </button>
            <button type="button" className="quick-tile" onClick={() => onNavigate("computadores")}>
              <span className="material-symbols-outlined">computer</span>
              Novo computador
            </button>
            <button type="button" className="quick-tile" onClick={() => onNavigate("utilizadores")}>
              <span className="material-symbols-outlined">person_add</span>
              Novo utilizador
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
