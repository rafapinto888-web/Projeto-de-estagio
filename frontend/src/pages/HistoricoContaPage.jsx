/*
 * Histórico de auditoria — apenas administradores; escolha de utilizador (GET /utilizadores/{id}/historico).
 */

import { useEffect, useMemo, useState } from "react";
import { Button, FormControl, InputLabel, MenuItem, Paper, Select } from "@mui/material";
import { api } from "../api";
import EmptyState from "../components/EmptyState";
import { formatarDataPtCurta } from "../domain/equipamento/index.js";
import SectionCard from "../components/SectionCard";

export default function HistoricoContaPage({ token, active, isAdmin, utilizadores = [] }) {
  const [utilizadorId, setUtilizadorId] = useState("");
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);

  const listaOrdenada = useMemo(
    () =>
      [...(utilizadores || [])].sort((a, b) =>
        String(a.nome || a.username || "").localeCompare(String(b.nome || b.username || ""), "pt"),
      ),
    [utilizadores],
  );

  useEffect(() => {
    if (!listaOrdenada.length) {
      setUtilizadorId("");
      return;
    }
    setUtilizadorId((prev) => {
      if (prev && listaOrdenada.some((u) => String(u.id) === String(prev))) return prev;
      return String(listaOrdenada[0].id);
    });
  }, [listaOrdenada]);

  useEffect(() => {
    if (!token || !active || !isAdmin || !utilizadorId) return undefined;
    let cancel = false;

    (async () => {
      setLoading(true);
      setErro(null);
      try {
        const data = await api.utilizadores.historico(utilizadorId);
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
  }, [token, active, isAdmin, utilizadorId]);

  function recarregar() {
    if (!token || !active || !isAdmin || !utilizadorId) return;
    setLoading(true);
    setErro(null);
    api
      .utilizadores.historico(utilizadorId)
      .then((data) => setItens(Array.isArray(data?.itens) ? data.itens : []))
      .catch((e) => {
        setItens([]);
        setErro(e?.message || "Não foi possível carregar o histórico.");
      })
      .finally(() => setLoading(false));
  }

  if (!isAdmin) {
    return (
      <SectionCard title="Histórico" subtitle="Auditoria de ações no painel.">
        <EmptyState
          title="Acesso reservado a administradores"
          description="Utilizadores com perfil normal não consultam histórico de auditoria. Inicia sessão com uma conta de administrador se precisares desta informação."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Histórico de auditoria"
      subtitle="Escolhe um utilizador: cada lista mostra apenas os eventos dessa conta (login, navegação no painel, etc.)."
      rightAction={
        <Button type="button" variant="outlined" size="small" onClick={recarregar} disabled={loading || !token || !utilizadorId}>
          Atualizar
        </Button>
      }
    >
      <FormControl fullWidth size="small" sx={{ maxWidth: 420, mb: 2 }}>
        <InputLabel id="historico-utilizador-label">Utilizador</InputLabel>
        <Select
          labelId="historico-utilizador-label"
          label="Utilizador"
          value={utilizadorId}
          onChange={(e) => setUtilizadorId(String(e.target.value))}
          disabled={!listaOrdenada.length}
        >
          {listaOrdenada.map((u) => (
            <MenuItem key={u.id} value={String(u.id)}>
              {u.nome || u.username}
              {u.username && u.nome ? ` (${u.username})` : ""}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {!listaOrdenada.length ? (
        <EmptyState title="Sem utilizadores" description="Não há contas para listar histórico." />
      ) : loading ? (
        <div className="loading-box">A carregar histórico…</div>
      ) : erro ? (
        <EmptyState title="Erro ao carregar o histórico" description={erro} />
      ) : itens.length === 0 ? (
        <EmptyState
          title="Sem eventos registados"
          description="Ainda não há linhas de auditoria para este utilizador. O histórico técnico da rede (segurança/RDP) está na aba Logs."
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
