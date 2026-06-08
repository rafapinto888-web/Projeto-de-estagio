/*
 * Histórico de auditoria: apenas administradores; escolha de utilizador (GET /utilizadores/{id}/historico).
 */

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { api } from "../api";
import EmptyState from "../components/EmptyState";
import { formatarDataPtCurta } from "../domain/equipamento/index.js";
import SectionCard from "../components/SectionCard";

function eventoVisual(ev) {
  const texto = `${ev?.acao || ""} ${ev?.descricao || ""}`.toLowerCase();
  if (/apag|delete|elimin|remov/.test(texto)) {
    return { icon: "delete", color: "#dc2626", bg: "#fef2f2", label: "Remoção" };
  }
  if (/edit|alter|atualiz|modific|patch|put/.test(texto)) {
    return { icon: "edit_square", color: "#ca8a04", bg: "#fffbeb", label: "Alteração" };
  }
  if (/login|sess/.test(texto)) {
    return { icon: "login", color: "#2563eb", bg: "#eff6ff", label: "Sessão" };
  }
  if (/scan|rede|log/.test(texto)) {
    return { icon: "radar", color: "#16a34a", bg: "#ecfdf5", label: "Operação" };
  }
  return { icon: "history", color: "#64748b", bg: "#f8fafc", label: "Evento" };
}

function eventoTimestamp(ev) {
  const data = ev?.data_evento ? new Date(ev.data_evento) : null;
  return data && !Number.isNaN(data.getTime()) ? data.getTime() : 0;
}

function mesmoDia(timestamp, ref = new Date()) {
  if (!timestamp) return false;
  const data = new Date(timestamp);
  return data.getFullYear() === ref.getFullYear() && data.getMonth() === ref.getMonth() && data.getDate() === ref.getDate();
}

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

  const utilizadorSelecionado = useMemo(
    () => listaOrdenada.find((u) => String(u.id) === String(utilizadorId)) || null,
    [listaOrdenada, utilizadorId],
  );

  const itensOrdenados = useMemo(
    () => [...(itens || [])].sort((a, b) => eventoTimestamp(b) - eventoTimestamp(a)),
    [itens],
  );

  const totalHoje = useMemo(
    () => itensOrdenados.filter((ev) => mesmoDia(eventoTimestamp(ev))).length,
    [itensOrdenados],
  );

  const ultimaAtividade = itensOrdenados[0]?.data_evento
    ? formatarDataPtCurta(itensOrdenados[0].data_evento)
    : "Sem registo";

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
      subtitle="Escolhe um utilizador para consultar os eventos registados dessa conta."
      rightAction={
        <Button
          type="button"
          variant="outlined"
          size="small"
          onClick={recarregar}
          disabled={loading || !token || !utilizadorId}
          startIcon={
            <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>
              refresh
            </span>
          }
        >
          {loading ? "A atualizar..." : "Atualizar"}
        </Button>
      }
    >
      <Stack spacing={2.25}>
        <Paper variant="outlined" sx={{ p: 2, borderColor: "#dbe5f2", bgcolor: "#f8fbff" }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems={{ xs: "stretch", lg: "center" }}>
            <FormControl fullWidth size="small" sx={{ maxWidth: { lg: 440 } }}>
              <InputLabel id="historico-utilizador-label">Utilizador</InputLabel>
              <Select
                labelId="historico-utilizador-label"
                label="Utilizador"
                value={utilizadorId}
                onChange={(e) => setUtilizadorId(String(e.target.value))}
                disabled={!listaOrdenada.length || loading}
              >
                {listaOrdenada.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    {u.nome || u.username}
                    {u.username && u.nome ? ` (${u.username})` : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              flex={1}
              justifyContent="flex-end"
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Chip
                icon={<span className="material-symbols-outlined">person</span>}
                label={utilizadorSelecionado?.username ? `@${utilizadorSelecionado.username}` : "Sem utilizador"}
                variant="outlined"
              />
              <Chip
                icon={<span className="material-symbols-outlined">event_list</span>}
                label={`${itensOrdenados.length} evento(s)`}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<span className="material-symbols-outlined">today</span>}
                label={`${totalHoje} hoje`}
                color={totalHoje > 0 ? "success" : "default"}
                variant="outlined"
              />
            </Stack>
          </Stack>
        </Paper>

        {!listaOrdenada.length ? (
          <EmptyState title="Sem utilizadores" description="Não há contas para listar histórico." />
        ) : loading ? (
          <Paper variant="outlined" sx={{ p: 2.5, borderColor: "#dbe5f2" }}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                A carregar histórico...
              </Typography>
            </Stack>
          </Paper>
        ) : erro ? (
          <Paper variant="outlined" sx={{ p: 2, borderStyle: "dashed", bgcolor: "#fff1f2", borderColor: "#fecdd3" }}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
              <span className="material-symbols-outlined" style={{ color: "#e11d48", fontSize: 22 }} aria-hidden>
                error
              </span>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography fontSize={14} fontWeight={700}>
                  Erro ao carregar o histórico
                </Typography>
                <Typography fontSize={12} color="text.secondary" sx={{ wordBreak: "break-word", mt: 0.35 }}>
                  {erro}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ) : itensOrdenados.length === 0 ? (
          <EmptyState
            title="Sem eventos registados"
            description="Ainda não há linhas de auditoria para este utilizador. O histórico técnico da rede está na aba Logs."
          />
        ) : (
          <Stack spacing={1.25}>
            <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#dbe5f2", bgcolor: "#fff" }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                <Typography variant="body2" fontWeight={700}>
                  Atividade de {utilizadorSelecionado?.nome || utilizadorSelecionado?.username || "utilizador"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Última atividade: {ultimaAtividade}
                </Typography>
              </Stack>
            </Paper>

            {itensOrdenados.map((ev) => {
              const visual = eventoVisual(ev);
              return (
                <Paper key={ev.id} variant="outlined" sx={{ p: 1.5, borderColor: "#dbe5f2", bgcolor: "#fff" }}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 1.25,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: visual.bg,
                        color: visual.color,
                        flexShrink: 0,
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden>
                        {visual.icon}
                      </span>
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                        <Typography fontSize={14} fontWeight={700} sx={{ wordBreak: "break-word" }}>
                          {ev.acao || "Evento"}
                        </Typography>
                        <Chip size="small" label={visual.label} sx={{ alignSelf: { xs: "flex-start", sm: "center" } }} />
                      </Stack>
                      <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.5, wordBreak: "break-word" }}>
                        {ev.descricao || "Sem descrição."}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        <time dateTime={ev.data_evento}>{formatarDataPtCurta(ev.data_evento)}</time>
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>
    </SectionCard>
  );
}
