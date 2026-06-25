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

const PANEL_SX = {
  borderRadius: 2,
  borderColor: "#dbe5f2",
  bgcolor: "#ffffff",
  boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
};

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

function ontemIso() {
  return dataLocalIso(Date.now() - 24 * 60 * 60 * 1000);
}

function rotuloDia(chave) {
  if (!chave || chave === "sem-data") return "Data desconhecida";
  if (chave === hojeIso()) return "Hoje";
  if (chave === ontemIso()) return "Ontem";
  const data = new Date(`${chave}T12:00:00`);
  if (Number.isNaN(data.getTime())) return "Data desconhecida";
  return new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(data);
}

function horaEvento(dataEvento) {
  const data = dataEvento ? new Date(dataEvento) : null;
  if (!data || Number.isNaN(data.getTime())) return "Hora desconhecida";
  return new Intl.DateTimeFormat("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function rotuloTipoOperacao(acao) {
  const raw = String(acao || "").trim();
  const normalizada = raw.toLowerCase();

  if (!raw) return "Evento";
  if (normalizada === "painel") return "Operacoes no painel";
  if (normalizada === "sessao.login") return "Inicio de sessao";
  if (normalizada === "sessao.logout") return "Fim de sessao";

  const mapaSecoes = {
    inventarios: "Inventarios",
    utilizadores: "Utilizadores",
    computadores: "Computadores",
    perfis: "Perfis",
    localizacoes: "Localizacoes",
    sessao: "Sessao",
  };

  const mapaOperacoes = {
    criar: "Criacao",
    create: "Criacao",
    atualizar: "Atualizacao",
    update: "Atualizacao",
    editar: "Edicao",
    edit: "Edicao",
    apagar: "Remocao",
    delete: "Remocao",
    remover: "Remocao",
    logout: "Fim de sessao",
    login: "Inicio de sessao",
  };

  if (normalizada.includes(".")) {
    const partes = normalizada.split(".").filter(Boolean);
    const secao = mapaSecoes[partes[0]] || partes[0].charAt(0).toUpperCase() + partes[0].slice(1);
    const resto = partes
      .slice(1)
      .map((parte) => mapaOperacoes[parte] || parte.charAt(0).toUpperCase() + parte.slice(1))
      .join(" - ");
    return resto ? `${secao} - ${resto}` : secao;
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1);
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
        rotuloTipoOperacao(a).localeCompare(rotuloTipoOperacao(b), "pt"),
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

  const gruposHistorico = useMemo(() => {
    const mapa = new Map();

    for (const ev of itensFiltrados) {
      const chave = dataLocalIso(eventoTimestamp(ev)) || "sem-data";
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave).push(ev);
    }

    return Array.from(mapa.entries()).map(([chave, eventos]) => ({
      chave,
      titulo: rotuloDia(chave),
      subtitulo:
        chave && chave !== "sem-data" ? formatarDataPtCurta(`${chave}T12:00:00`) : "Sem referencia temporal",
      eventos,
    }));
  }, [itensFiltrados]);

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
      subtitle="Consulta a atividade registada por utilizador com filtros simples e uma leitura mais clara por dia."
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
      <Stack spacing={2}>
        <Paper variant="outlined" sx={{ ...PANEL_SX, p: 2, bgcolor: "#f8fbff" }}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: "column", xl: "row" }} spacing={1.5} alignItems={{ xs: "stretch", xl: "flex-end" }}>
              <Box sx={{ width: "100%", maxWidth: { xl: 340 } }}>
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
                    sx={{ borderRadius: 2, bgcolor: "#fff" }}
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

              <Box sx={{ width: "100%", maxWidth: { xl: 260 } }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5, px: 0.25 }}>
                  Tipo de operacao
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={filtroAcao}
                    onChange={(e) => setFiltroAcao(String(e.target.value))}
                    disabled={!itensOrdenados.length || loading}
                    inputProps={{ "aria-label": "Filtrar por tipo de operacao" }}
                    sx={{ borderRadius: 2, bgcolor: "#fff" }}
                  >
                    <MenuItem value="">Todas as operacoes</MenuItem>
                    {opcoesAcao.map((acao) => (
                      <MenuItem key={acao} value={acao}>
                        {rotuloTipoOperacao(acao)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ width: "100%", maxWidth: { xl: 200 } }}>
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
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "#fff" } }}
                />
              </Box>

              <Button
                type="button"
                variant="outlined"
                size="small"
                onClick={limparFiltros}
                disabled={!temFiltros}
                sx={{ alignSelf: { xs: "stretch", xl: "flex-end" }, minWidth: 132, height: 40 }}
              >
                Limpar filtros
              </Button>
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
              <Chip
                icon={<span className="material-symbols-outlined">schedule</span>}
                label={`Ultima atividade: ${ultimaAtividade}`}
                variant="outlined"
              />
            </Stack>
          </Stack>
        </Paper>

        {!listaOrdenada.length ? (
          <EmptyState title="Sem utilizadores" description="Nao ha contas para listar historico." />
        ) : loading ? (
          <Paper variant="outlined" sx={{ ...PANEL_SX, p: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                A carregar historico...
              </Typography>
            </Stack>
          </Paper>
        ) : erro ? (
          <Paper variant="outlined" sx={{ ...PANEL_SX, p: 2, borderStyle: "dashed", bgcolor: "#fff1f2", borderColor: "#fecdd3" }}>
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
          <Stack spacing={2}>
            {gruposHistorico.map((grupo) => (
              <Box key={grupo.chave}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  sx={{ mb: 1 }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontSize={17} fontWeight={800} sx={{ textTransform: "capitalize", color: "#0f172a" }}>
                      {grupo.titulo}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {grupo.subtitulo}
                    </Typography>
                  </Box>
                  <Chip size="small" variant="outlined" label={`${grupo.eventos.length} evento(s)`} />
                </Stack>

                <Stack spacing={1}>
                  {grupo.eventos.map((ev) => {
                    // Cada linha reaproveita a categorizacao visual para manter iconografia e cor alinhadas.
                    const visual = eventoVisual(ev);
                    return (
                      <Paper
                        key={ev.id}
                        variant="outlined"
                        sx={{
                          ...PANEL_SX,
                          p: 1.35,
                          borderLeft: `4px solid ${visual.color}`,
                          transition: "background-color 140ms ease, box-shadow 140ms ease",
                          "&:hover": {
                            bgcolor: "#fbfdff",
                            boxShadow: "0 6px 20px rgba(15,23,42,0.05)",
                          },
                        }}
                      >
                        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25} justifyContent="space-between">
                          <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ minWidth: 0, flex: 1 }}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 1.75,
                                display: "grid",
                                placeItems: "center",
                                bgcolor: visual.bg,
                                color: visual.color,
                                flexShrink: 0,
                              }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>
                                {visual.icon}
                              </span>
                            </Box>

                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Stack
                                direction={{ xs: "column", lg: "row" }}
                                spacing={0.75}
                                justifyContent="space-between"
                                alignItems={{ xs: "flex-start", lg: "center" }}
                              >
                                <Typography fontSize={14} fontWeight={800} sx={{ wordBreak: "break-word", color: "#0f172a" }}>
                                  {ev.acao || "Evento"}
                                </Typography>
                                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                  <Chip size="small" label={visual.label} sx={{ bgcolor: visual.bg, color: visual.color, fontWeight: 700 }} />
                                  <Chip size="small" variant="outlined" label={horaEvento(ev.data_evento)} />
                                </Stack>
                              </Stack>

                              <Typography fontSize={13} color="text.secondary" sx={{ mt: 0.6, wordBreak: "break-word", lineHeight: 1.6 }}>
                                {ev.descricao || "Sem descricao."}
                              </Typography>
                            </Box>
                          </Stack>

                          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, pl: { md: 1 } }}>
                            <time dateTime={ev.data_evento}>{formatarDataPtCurta(ev.data_evento)}</time>
                          </Typography>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </SectionCard>
  );
}

