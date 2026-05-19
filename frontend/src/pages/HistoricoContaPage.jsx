/*
 * Histórico da conta — auditoria das ações do utilizador autenticado (/auth/me/historico).
 */

import { useEffect, useState } from "react";
import { Button, Paper } from "@mui/material";
import { api } from "../api";
import EmptyState from "../components/EmptyState";
import { formatarDataPtCurta } from "../domain/equipamento/index.js";
import SectionCard from "../components/SectionCard";

export default function HistoricoContaPage({ token, active, user }) {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  // --- Carregamento ao ativar a aba ---

  useEffect(() => {
    if (!token || !active) return undefined;
    let cancel = false;

    (async () => {
      setLoading(true);
      setErro(null);
      try {
        const data = await api.historicoMeu();
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
      .historicoMeu()
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
        <Button type="button" variant="outlined" size="small" onClick={recarregar} disabled={loading || !token}>
          Atualizar
        </Button>
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
        <Paper variant="outlined" sx={{ borderColor: "#dbe5f2", p: 0.75 }}>
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
                    <time dateTime={ev.data_evento}>{formatarDataPtCurta(ev.data_evento)}</time>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Paper>
      )}
    </SectionCard>
  );
}
