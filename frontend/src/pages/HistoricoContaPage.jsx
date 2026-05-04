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
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!token || !active) return undefined;
    let cancel = false;

    (async () => {
      setLoading(true);
      setErro(null);
      try {
        const data = await api.historicoMeu(token);
        if (!cancel) setItens(Array.isArray(data?.itens) ? data.itens : []);
      } catch (e) {
        if (!cancel) {
          setItens([]);
          setErro(e?.message || "Não foi possível carregar o histórico.");
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [token, active, user?.id]);

  function recarregar() {
    if (!token || !active) return;
    setLoading(true);
    setErro(null);
    api
      .historicoMeu(token)
      .then((data) => setItens(Array.isArray(data?.itens) ? data.itens : []))
      .catch((e) => {
        setItens([]);
        setErro(e?.message || "Não foi possível carregar o histórico.");
      })
      .finally(() => setLoading(false));
  }

  return (
    <SectionCard
      title="Histórico da conta"
      subtitle={
        user
          ? `Todas as atividades registadas para ${user.nome || user.username}. Cada sessão só vê o seu próprio histórico.`
          : "Atividades registadas na tua sessão."
      }
      rightAction={
        <button type="button" className="ghost ghost-sm" onClick={recarregar} disabled={loading || !token}>
          Atualizar
        </button>
      }
    >
      {loading ? (
        <div className="loading-box">A carregar histórico…</div>
      ) : erro ? (
        <EmptyState
          title="Erro ao carregar o histórico"
          description={erro}
        />
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
