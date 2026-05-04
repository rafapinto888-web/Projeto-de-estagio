/* Histórico pessoal — entradas gravadas na API por utilizador autenticado (logs_sistema). */

import { useEffect, useState } from "react";
import { api } from "../api";
import EmptyState from "../components/EmptyState";
import SectionCard from "../components/SectionCard";

function formatarData(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString("pt-PT", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  } catch {
    return String(iso);
  }
}

export default function HistoricoContaPage({ token, active, user }) {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !active) return undefined;
    let cancel = false;

    (async () => {
      setLoading(true);
      try {
        const data = await api.auth.historicoMeu(token);
        if (!cancel) setItens(Array.isArray(data?.itens) ? data.itens : []);
      } catch {
        if (!cancel) setItens([]);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [token, active]);

  return (
    <SectionCard
      title="Histórico da conta"
      subtitle={
        user
          ? `Todas as atividades registadas para ${user.nome || user.username}. Cada sessão só vê o seu próprio histórico.`
          : "Atividades registadas na tua sessão."
      }
    >
      {loading ? (
        <div className="loading-box">A carregar histórico…</div>
      ) : itens.length === 0 ? (
        <EmptyState
          title="Sem eventos registados"
          description="Após iniciar sessão ou concluir operações no painel, as entradas aparecem aqui. O histórico técnico da rede (segurança/RDP) está na aba Logs."
        />
      ) : (
        <ul className="activity-timeline historico-conta-list">
          {itens.map((ev) => (
            <li key={ev.id} className="timeline-item historico-conta-item">
              <span className="timeline-icon info material-symbols-outlined" aria-hidden>
                history
              </span>
              <div>
                <strong className="historico-conta-acao">{ev.acao}</strong>
                <p className="historico-conta-desc">{ev.descricao || "—"}</p>
                <p className="historico-conta-when">
                  <time dateTime={ev.data_evento}>{formatarData(ev.data_evento)}</time>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
