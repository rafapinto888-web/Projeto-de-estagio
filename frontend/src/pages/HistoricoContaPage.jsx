/*
 * Historico de auditoria: apenas administradores; escolha de utilizador (GET /utilizadores/{id}/historico).
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
  TextField,
  Typography,
} from "@mui/material";
import { api } from "../api";
import EmptyState from "../components/EmptyState";
import { formatarDataPtCurta } from "../domain/equipamento/index.js";
import SectionCard from "../components/SectionCard";

function eventoVisual(ev) {
  // Converte acao + descricao numa categoria visual consistente para a timeline.
  const texto = `${ev?.acao || ""} ${ev?.descricao || ""}`.toLowerCase();
  if (/apag|delete|elimin|remov/.test(texto)) {
    return { icon: "delete", color: "#dc2626", bg: "#fef2f2", label: "Remocao" };
  }
  if (/edit|alter|atualiz|modific|patch|put/.test(texto)) {
    return { icon: "edit_square", color: "#ca8a04", bg: "#fffbeb", label: "Alteracao" };
  }
  if (/login|sess/.test(texto)) {
    return { icon: "login", color: "#2563eb", bg: "#eff6ff", label: "Sessao" };
  }
  if (/scan|rede|log/.test(texto)) {
    return { icon: "radar", color: "#16a34a", bg: "#ecfdf5", label: "Operacao" };
  }
  return { icon: "history", color: "#64748b", bg: "#f8fafc", label: "Evento" };
}

function eventoTimestamp(ev) {
  // Normaliza datas invalidas para 0 para manter a ordenacao previsivel.
  const data = ev?.data_evento ? new Date(ev.data_evento) : null;
  return data && !Number.isNaN(data.getTime()) ? data.getTime() : 0;
}

function mesmoDia(timestamp, ref = new Date()) {
  // Comparacao por dia civil para o resumo "hoje", ignorando hora/minutos.
  if (!timestamp) return false;
  const data = new Date(timestamp);
  return data.getFullYear() === ref.getFullYear() && data.getMonth() === ref.getMonth() && data.getDate() === ref.getDate();
}

function dataLocalIso(timestamp) {
  if (!timestamp) return "";
  const data = new Date(timestamp);
  if (Number.isNaN(data.getTime())) return "";
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function hojeIso() {
  return dataLocalIso(Date.now());
}

export default function HistoricoContaPage({ token, active, isAdmin, utilizadores = [] }) {
  const [utilizadorId, setUtilizadorId] = useState("");
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [filtroAcao, setFiltroAcao] = useState("");
  const [filtroData, setFiltroData] = useState("");

  const listaOrdenada = useMemo(
    // A lista e clonada antes do sort para nao mutar as props recebidas.
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

  const opcoesAcao = useMemo(
    () =>
      Array.from(new Set(itensOrdenados.map((ev) => String(ev?.acao || "").trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "pt"),
      ),
    [itensOrdenados],
  );

  const itensFiltrados = useMemo(
    () =>
      itensOrdenados.filter((ev) => {
        if (filtroAcao && String(ev?.acao || "").trim() !== filtroAcao) return false;
        if (filtroData && dataLocalIso(eventoTimestamp(ev)) !== filtroData) return false;
        return true;
      }),
    [filtroAcao, filtroData, itensOrdenados],
  );

  const temFiltros = Boolean(filtroAcao || filtroData);
  const dataMaxFiltro = hojeIso();

  const dataMinFiltro = useMemo(() => {
    // Se um dia o backend expuser a data de criacao do utilizador, ela passa a ser o limite real.
    const criadoEmConta =
      utilizadorSelecionado?.criado_em ||
      utilizadorSelecionado?.data_criacao ||
      utilizadorSelecionado?.created_at ||
      null;
    const dataConta = dataLocalIso(criadoEmConta);
    if (dataConta) return dataConta;

    // Fallback: usamos a primeira atividade conhecida para evitar datas sem qualquer historico.
    const maisAntigo = itensOrdenados[itensOrdenados.length - 1];
    return dataLocalIso(eventoTimestamp(maisAntigo));
  }, [itensOrdenados, utilizadorSelecionado]);

  const totalHoje = useMemo(
    () => itensFiltrados.filter((ev) => mesmoDia(eventoTimestamp(ev))).length,
    [itensFiltrados],
  );

  const ultimaAtividade = itensFiltrados[0]?.data_evento
    ? formatarDataPtCurta(itensFiltrados[0].data_evento)
    : "Sem registo";

  useEffect(() => {
    // Mantem sempre um utilizador valido selecionado quando a lista muda.
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
      // Evita atualizar estado depois do unmount ou de uma troca rapida de utilizador.
      setLoading(true);
      setErro(null);
      try {
        const data = await api.utilizadores.historico(utilizadorId);
        if (!cancel) setItens(Array.isArray(data?.itens) ? data.itens : []);
      } catch (e) {
        if (!cancel) {
          setItens([]);
          setErro(e?.message || "Nao foi possivel carregar o historico.");
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    })();

    return () => {
      cancel = true;
    };
  }, [token, active, isAdmin, utilizadorId]);

  useEffect(() => {
    if (!filtroData) return;
    if (dataMinFiltro && filtroData < dataMinFiltro) {
      setFiltroData("");
      return;
    }
    if (dataMaxFiltro && filtroData > dataMaxFiltro) {
      setFiltroData("");
    }
  }, [dataMaxFiltro, dataMinFiltro, filtroData]);

  function recarregar() {
    // Reutiliza o mesmo endpoint do carregamento inicial para refresh manual.
    if (!token || !active || !isAdmin || !utilizadorId) return;
    setLoading(true);
    setErro(null);
    api
      .utilizadores.historico(utilizadorId)
      .then((data) => setItens(Array.isArray(data?.itens) ? data.itens : []))
      .catch((e) => {
        setItens([]);
        setErro(e?.message || "Nao foi possivel carregar o historico.");
      })
      .finally(() => setLoading(false));
  }

  function limparFiltros() {
    setFiltroAcao("");
    setFiltroData("");
  }

  if (!isAdmin) {
    return (
      <SectionCard title="Historico" subtitle="Auditoria de acoes no painel.">
        <EmptyState
          title="Acesso reservado a administradores"
          description="Utilizadores com perfil normal nao consultam historico de auditoria. Inicia sessao com uma conta de administrador se precisares desta informacao."
        />
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Historico de auditoria"
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
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", xl: "row" }} spacing={1.5} alignItems={{ xs: "stretch", xl: "flex-end" }}>
              <Box sx={{ width: "100%", maxWidth: { xl: 360 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, px: 0.25 }}>
                  Utilizador
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={utilizadorId}
                    onChange={(e) => {
                      setUtilizadorId(String(e.target.value));
                      limparFiltros();
                    }}
                    disabled={!listaOrdenada.length || loading}
                    inputProps={{ "aria-label": "Selecionar utilizador" }}
                  >
                    {listaOrdenada.map((u) => (
                      <MenuItem key={u.id} value={String(u.id)}>
                        {u.nome || u.username}
                        {u.username && u.nome ? ` (${u.username})` : ""}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ width: "100%", maxWidth: { xl: 300 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, px: 0.25 }}>
                  Tipo de operacao
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={filtroAcao}
                    onChange={(e) => setFiltroAcao(String(e.target.value))}
                    disabled={!itensOrdenados.length || loading}
                    inputProps={{ "aria-label": "Filtrar por tipo de operacao" }}
                  >
                    <MenuItem value="">Todas as operacoes</MenuItem>
                    {opcoesAcao.map((acao) => (
                      <MenuItem key={acao} value={acao}>
                        {acao}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ width: "100%", maxWidth: { xl: 220 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, px: 0.25 }}>
                  Data
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={filtroData}
                  onChange={(e) => setFiltroData(e.target.value)}
                  disabled={!itensOrdenados.length || loading}
                  inputProps={{
                    "aria-label": "Filtrar por data",
                    min: dataMinFiltro || undefined,
                    max: dataMaxFiltro || undefined,
                  }}
                />
              </Box>

              <Button
                type="button"
                variant="outlined"
                size="small"
                onClick={limparFiltros}
                disabled={!temFiltros}
                sx={{ alignSelf: { xs: "stretch", xl: "flex-end" }, minWidth: 138, height: 40 }}
              >
                Limpar filtros
              </Button>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
              <Chip
                icon={<span className="material-symbols-outlined">person</span>}
                label={utilizadorSelecionado?.username ? `@${utilizadorSelecionado.username}` : "Sem utilizador"}
                variant="outlined"
              />
              <Chip
                icon={<span className="material-symbols-outlined">event_list</span>}
                label={
                  temFiltros
                    ? `${itensFiltrados.length} de ${itensOrdenados.length} evento(s)`
                    : `${itensOrdenados.length} evento(s)`
                }
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
          <EmptyState title="Sem utilizadores" description="Nao ha contas para listar historico." />
        ) : loading ? (
          <Paper variant="outlined" sx={{ p: 2.5, borderColor: "#dbe5f2" }}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                A carregar historico...
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
                  Erro ao carregar o historico
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
            description="Ainda nao ha linhas de auditoria para este utilizador. O historico tecnico da rede esta na aba Logs."
          />
        ) : itensFiltrados.length === 0 ? (
          <EmptyState
            title="Sem resultados para os filtros"
            description="Nao existem eventos com esse tipo de operacao ou nessa data. Ajusta os filtros para voltares a ver atividade."
          />
        ) : (
          <Stack spacing={1.25}>
            <Paper variant="outlined" sx={{ p: 1.5, borderColor: "#dbe5f2", bgcolor: "#fff" }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                <Typography variant="body2" fontWeight={700}>
                  Atividade de {utilizadorSelecionado?.nome || utilizadorSelecionado?.username || "utilizador"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ultima atividade: {ultimaAtividade}
                </Typography>
              </Stack>
            </Paper>

            {itensFiltrados.map((ev) => {
              // Cada linha reaproveita a categorizacao visual para manter iconografia e cor alinhadas.
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
                        {ev.descricao || "Sem descricao."}
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
