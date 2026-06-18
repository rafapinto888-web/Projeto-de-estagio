/*
 * Dashboard — KPIs, gráfico por estado, inventários recentes e atividade do sistema.
 */

import { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Typography,
} from "@mui/material";
import AtivosPorEstadoChart from "../components/AtivosPorEstadoChart";
import SectionCard from "../components/SectionCard";
import MetricCard from "../components/ui/MetricCard";
import Panel from "../components/ui/Panel";
import { ipEquipamento, txtBd } from "../utils/detalheEquipamento";
import { tipoInventarioLabel } from "../domain/inventario/index.js";
import { estadoChipMuiColor } from "../utils/estadoMuiColor";
import { instanteDataApiParaLocal } from "../domain/equipamento/index.js";
import { tableCellEllipsis, tableCellMono, tableCellNowrap, tableSxSemQuebra } from "../utils/tableCellSx";

function horaDoEvento(iso, fallback = "—") {
  // Converte timestamps em etiquetas curtas apropriadas para dashboard: Hoje, Ontem ou data.
  if (!iso) return fallback;
  try {
    const d = instanteDataApiParaLocal(iso);
    if (!d || Number.isNaN(d.getTime())) return fallback;
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime();
    const inicioData = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const hhmm = d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    if (inicioData === inicioHoje) return `Hoje, ${hhmm}`;
    if (inicioData === inicioHoje - 24 * 60 * 60 * 1000) return `Ontem, ${hhmm}`;
    return d.toLocaleDateString("pt-PT");
  } catch {
    return fallback;
  }
}

/** Alterações ou remoções de dados (não login, não navegação genérica). */
function isAlertaEdicaoOuRemocao(ev) {
  const acao = String(ev?.acao || "").toLowerCase();
  const desc = String(ev?.descricao || "").toLowerCase();
  const blob = `${acao} ${desc}`;
  const removeMatch = /apagad|eliminad|removid|\bdelete\b|deletad|apagou/.test(blob);
  const editMatch = /atualizad|editad|alterad|modificad|parcial|patch/.test(blob);
  return removeMatch || editMatch;
}

function mapHistoricoParaItem(ev, idx) {
  // Traduz eventos tecnicos em itens de UI com titulo, detalhe, icone e severidade.
  const acao = String(ev?.acao || "Evento").trim() || "Evento";
  const descricao = String(ev?.descricao || "").trim() || "—";
  const txt = `${acao} ${descricao}`.toLowerCase();
  const tone =
    txt.includes("erro") || txt.includes("falha")
      ? "warning"
      : txt.includes("apag") || txt.includes("delet") || txt.includes("elimin")
        ? "error"
        : "success";
  let icon = "task_alt";
  if (txt.includes("apag") || txt.includes("delet") || txt.includes("elimin") || txt.includes("remov")) icon = "delete";
  else if (txt.includes("atualiz") || txt.includes("edit") || txt.includes("alter") || txt.includes("modific") || txt.includes("parcial"))
    icon = "edit_square";
  else if (txt.includes("scan") || txt.includes("rede")) icon = "radar";
  else if (txt.includes("login") || txt.includes("sessao")) icon = "login";

  const titulo = acao === "painel" && descricao !== "—" ? descricao : acao;
  const detalhe = acao === "painel" && descricao !== "—" ? "Operação no painel" : descricao;
  const autor = ev?.utilizador_nome || ev?.utilizador_username || null;

  return {
    id: ev?.id != null ? `hist-${ev.id}` : `hist-f-${idx}`,
    titulo,
    detalhe,
    autor,
    hora: horaDoEvento(ev?.data_evento),
    icon,
    tone,
  };
}

function inventarioAtivosTotal(inv) {
  return (inv?.total_computadores ?? 0) + (inv?.total_dispositivos_scan ?? 0);
}

export default function DashboardPage({
  inventarios,
  computadores,
  ativosPorInventario = [],
  utilizadores,
  localizacoes: _localizacoes,
  atividadeRecente = [],
  isAdmin = false,
  loading,
  onNavigate,
  onOpenHistorico,
}) {
  const abrirMeuHistorico =
    typeof onOpenHistorico === "function" ? onOpenHistorico : () => onNavigate("historico-conta");

  // --- Métricas e listas derivadas dos props ---

  const recentInventarios = (inventarios || []).slice(0, 5);
  const latestUsers = (utilizadores || []).slice(0, 5);
  const dispositivosScan = useMemo(
    // Achata todos os grupos para o dashboard contar scans como uma unica colecao.
    () =>
      (ativosPorInventario || []).flatMap((grupo) =>
        (grupo?.ativos || []).filter((item) => item?.tipo === "dispositivo_descoberto"),
      ),
    [ativosPorInventario],
  );

  /** Amostra recente: manuais + descobertos, com inventário para coluna. */
  const equipamentosRecentesPainel = useMemo(() => {
    const manual = (computadores || []).slice(0, 5).map((pc) => ({
      linha: "manual",
      id: pc.id,
      nome: pc.nome || pc.hostname,
      hostname: pc.hostname,
      ip: ipEquipamento(pc),
      mac_address: pc.mac_address,
      marca: pc.marca,
      modelo: pc.modelo,
      numero_serie: pc.numero_serie,
      sistema_operativo: pc.sistema_operativo,
      estado: pc.estado,
      inventario_nome: pc.inventario_nome,
      tipo: "computador",
      criado_em: null,
      ultima_vez_ativo_em: null,
    }));
    const scan = (ativosPorInventario || []).flatMap((grupo) =>
      (grupo?.ativos || [])
        .filter((item) => item?.tipo === "dispositivo_descoberto")
        .map((item) => ({
          linha: "scan",
          id: item.id,
          nome: item.hostname || item.ip || `Scan #${item.id}`,
          hostname: item.hostname,
          ip: item.ip,
          mac_address: item.mac_address,
          marca: item.marca,
          modelo: item.modelo,
          numero_serie: item.numero_serie,
          sistema_operativo: item.sistema_operativo,
          estado: item.estado,
          inventario_nome: grupo?.inventario_nome,
          tipo: "dispositivo_descoberto",
          criado_em: item.criado_em,
          ultima_vez_ativo_em: item.ultima_vez_ativo_em,
        })),
    );
    return [...manual, ...scan.slice(0, 5)];
  }, [computadores, ativosPorInventario]);
  const totalScan = (inventarios || []).reduce((acc, inv) => acc + (inv.total_dispositivos_scan ?? 0), 0);
  const computadoresAtivos = useMemo(
    () =>
      (computadores || []).filter((pc) => String(pc?.estado || "").toLowerCase() === "ativo").length,
    [computadores],
  );

  const estadoContagens = useMemo(() => {
    // Soma estados de computadores manuais e descobertos para alimentar o grafico agregado.
    const map = new Map();
    (computadores || []).forEach((pc) => {
      const estado = String(pc?.estado || "desconhecido").trim() || "desconhecido";
      map.set(estado, (map.get(estado) || 0) + 1);
    });
    dispositivosScan.forEach((disp) => {
      const estado = String(disp?.estado || "desconhecido").trim() || "desconhecido";
      map.set(estado, (map.get(estado) || 0) + 1);
    });
    const totais = Array.from(map.entries())
      .map(([estado, total]) => ({ estado, total }))
      .sort((a, b) => b.total - a.total);
    const total = totais.reduce((acc, item) => acc + item.total, 0);
    return { totais, total };
  }, [computadores, dispositivosScan]);

  const historicoOrdenado = useMemo(() => {
    // Ordenacao defensiva para lidar com eventos sem data valida.
    return [...(atividadeRecente || [])].sort((a, b) => {
      const ta = a?.data_evento ? instanteDataApiParaLocal(a.data_evento)?.getTime() ?? 0 : 0;
      const tb = b?.data_evento ? instanteDataApiParaLocal(b.data_evento)?.getTime() ?? 0 : 0;
      return tb - ta;
    });
  }, [atividadeRecente]);

  /** Todas as atividades (sessão, painel, operações) — pré-visualização no dashboard. */
  const atividadeTodas = useMemo(() => {
    return historicoOrdenado.slice(0, 20).map((ev, idx) => mapHistoricoParaItem(ev, idx));
  }, [historicoOrdenado]);

  /** Só alterações / remoções de dados para o painel de alertas. */
  const alertasEdicaoRemocao = useMemo(() => {
    return historicoOrdenado.filter(isAlertaEdicaoOuRemocao).slice(0, 12).map((ev, idx) => mapHistoricoParaItem(ev, idx));
  }, [historicoOrdenado]);

  const dataHoje = useMemo(() => {
    // Mantem a data do selo "Atualizado" estavel durante o ciclo de vida desta renderizacao.
    try {
      return new Date().toLocaleDateString("pt-PT");
    } catch {
      return "—";
    }
  }, []);

  const metrics = [
    {
      key: "inventarios",
      label: "Inventários",
      value: inventarios.length,
      icon: "inventory_2",
      tone: "primary",
    },
    {
      key: "computadores-ativos",
      label: "Computadores ativos",
      value: computadoresAtivos,
      icon: "computer",
      tone: "success",
      hint: `${(computadores || []).length} registados no total`,
    },
    {
      key: "scan",
      label: "Dispositivos em scan",
      value: totalScan,
      icon: "radar",
      tone: "primary",
      hint: "Descobertos em inventários de sub-rede",
    },
    {
      key: "alertas",
      label: "Alertas recentes",
      value: isAdmin ? alertasEdicaoRemocao.length : "—",
      icon: "notifications",
      tone: isAdmin && alertasEdicaoRemocao.length > 0 ? "warning" : "neutral",
      hint: isAdmin ? "Edições e remoções de dados" : "Só na aba Histórico (admin)",
    },
  ];

  const quickActions = [
    {
      key: "scan",
      label: "Scan de rede",
      description: "Executar descoberta e atualizar dispositivos da sub-rede.",
      icon: "radar",
      target: "ativos",
    },
    {
      key: "computadores",
      label: "Computadores",
      description: "Consultar registos manuais e equipamentos encontrados por scan.",
      icon: "computer",
      target: "computadores",
    },
    {
      key: "pesquisa",
      label: "Pesquisa global",
      description: "Procurar rapidamente ativos, inventários e utilizadores.",
      icon: "manage_search",
      target: "pesquisa",
    },
    {
      key: "inventarios",
      label: "Inventários",
      description: "Ver o catálogo de inventários e respetivos ativos associados.",
      icon: "inventory_2",
      target: "inventarios",
    },
    {
      key: "logs",
      label: "Logs",
      description: "Rever eventos técnicos e registos operacionais do sistema.",
      icon: "receipt_long",
      target: "logs",
    },
    ...(isAdmin
      ? [
          {
            key: "historico",
            label: "Histórico",
            description: "Aceder à auditoria por conta e acompanhar alterações recentes.",
            icon: "history",
            target: "historico-conta",
          },
        ]
      : []),
  ];

  const atividadeRede = atividadeTodas;
  const listaScrollSx = {
    maxHeight: { xs: 225, lg: 265 },
    overflowY: "auto",
    pr: 0.25,
  };

  // --- Render: grelha de KPIs, gráficos e tabelas resumo ---

  return (
    <SectionCard
      title="Dashboard"
      subtitle="Visão operacional do inventário, scans de rede e atividade do sistema."
      rightAction={
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          Atualizado · {dataHoje}
        </Typography>
      }
    >
      <Stack spacing={2.5}>
        <Box
          sx={{
            p: { xs: 2.25, md: 2.75 },
            border: "1px solid #e5e7eb",
            borderRadius: 3,
            background:
              "radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 28%), linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)",
            boxShadow: "0 14px 32px rgba(15, 23, 42, 0.05)",
          }}
        >
          <Stack spacing={1.75}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", lg: "center" }}
              spacing={1.5}
            >
              <Box>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1,
                    py: 0.5,
                    width: "fit-content",
                    borderRadius: 999,
                    bgcolor: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    color: "#475569",
                    mb: 1.1,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    dashboard
                  </span>
                  <Typography variant="caption" fontWeight={700}>
                    Vista geral
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontSize: { xs: "1.35rem", md: "1.7rem" },
                    fontWeight: 800,
                    letterSpacing: "-0.045em",
                    lineHeight: 1.06,
                    maxWidth: 760,
                  }}
                >
                  O estado atual do inventário, da rede e da atividade recente num só painel.
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mt: 1, maxWidth: 760, fontSize: "0.95rem", lineHeight: 1.6 }}
                >
                  Acompanha rapidamente o volume de ativos, os resultados do scan, os inventários com mais contexto
                  e os sinais recentes de atividade administrativa.
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent={{ lg: "flex-end" }}>
                <Chip
                  size="small"
                  label={`${inventarios.length} inventários`}
                  sx={{ bgcolor: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe", fontWeight: 700 }}
                />
                <Chip
                  size="small"
                  label={`${computadoresAtivos} computadores ativos`}
                  sx={{ bgcolor: "#ecfdf5", color: "#166534", border: "1px solid #bbf7d0", fontWeight: 700 }}
                />
                <Chip
                  size="small"
                  label={`${totalScan} dispositivos de scan`}
                  sx={{ bgcolor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", fontWeight: 700 }}
                />
              </Stack>
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {metrics.map((m) => (
            <MetricCard
              key={m.key}
              label={m.label}
              value={loading ? "—" : m.value}
              icon={m.icon}
              tone={m.tone}
              hint={m.hint}
            />
          ))}
        </Box>

        <Panel
          title="Ações rápidas"
          subtitle="Atalhos para as áreas e operações mais usadas no dia a dia"
        >
          <Box
            sx={{
              display: "grid",
              gap: 1.1,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(3, minmax(0, 1fr))",
              },
            }}
          >
            {quickActions.map((action) => (
              <Button
                key={action.key}
                variant="outlined"
                onClick={() => onNavigate(action.target)}
                sx={{
                  justifyContent: "flex-start",
                  alignItems: "stretch",
                  textAlign: "left",
                  px: 1.5,
                  py: 1.25,
                  minHeight: 86,
                  borderRadius: 2.25,
                  borderColor: "#e5e7eb",
                  color: "text.primary",
                  backgroundColor: "#fff",
                  "&:hover": {
                    borderColor: "#cbd5e1",
                    backgroundColor: "#fafafa",
                  },
                }}
              >
                <Stack direction="row" spacing={1.25} sx={{ width: "100%", minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 1.5,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "#f8fafc",
                      border: "1px solid #e5e7eb",
                      color: "#475569",
                      flexShrink: 0,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {action.icon}
                    </span>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.9rem", fontWeight: 700, color: "text.primary" }}>
                      {action.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mt: 0.35, lineHeight: 1.45, whiteSpace: "normal" }}
                    >
                      {action.description}
                    </Typography>
                  </Box>
                </Stack>
              </Button>
            ))}
          </Box>
        </Panel>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              lg: isAdmin ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))",
            },
          }}
        >
          <Box>
            <Panel
              title="Ativos por estado"
              subtitle="Computadores registados e dispositivos de scan"
              minHeight={320}
            >
              <AtivosPorEstadoChart totais={estadoContagens.totais} total={estadoContagens.total} />
            </Panel>
          </Box>

          <Box>
            <Panel
              title="Inventários recentes"
              subtitle="Os registos mais recentes com contexto e volume de ativos"
              action={
                <Button variant="text" size="small" onClick={() => onNavigate("inventarios")}>
                Ver todos
                </Button>
              }
              minHeight={320}
            >
            {loading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2">A carregar inventários…</Typography>
                </Stack>
            ) : recentInventarios.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Não existem inventários para mostrar.
                </Typography>
              ) : (
                <Box sx={listaScrollSx}>
                  <List disablePadding>
                    {recentInventarios.map((inv) => (
                      <ListItem
                        key={inv.id}
                        divider
                        disableGutters
                        sx={{ py: 1.2, gap: 1.25, alignItems: "flex-start" }}
                      >
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 1.5,
                            display: "grid",
                            placeItems: "center",
                            border: "1px solid #e5e7eb",
                            bgcolor: "#f8fafc",
                            color: "#475569",
                            flexShrink: 0,
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                            inventory_2
                          </span>
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontSize={14} fontWeight={700} noWrap>
                            {inv.nome}
                          </Typography>
                          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 0.7 }}>
                            <Chip
                              size="small"
                              label={tipoInventarioLabel(inv.tipo_inventario)}
                              sx={{
                                bgcolor: "#f4f4f5",
                                color: "#52525b",
                                border: "1px solid #e4e4e7",
                              }}
                            />
                            <Chip
                              size="small"
                              label={`${inventarioAtivosTotal(inv)} ativos`}
                              sx={{
                                bgcolor: "#eff6ff",
                                color: "#1d4ed8",
                                border: "1px solid #bfdbfe",
                              }}
                            />
                          </Stack>
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Panel>
          </Box>

          {isAdmin ? (
            <Box>
            <Panel
              title="Atividade recente"
              subtitle="Pré-visualização da auditoria disponível por conta"
              action={
                <Button variant="text" size="small" onClick={abrirMeuHistorico}>
                  Histórico
                </Button>
              }
              minHeight={320}
            >
            {loading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2">A carregar…</Typography>
                </Stack>
              ) : atividadeRede.length === 0 ? (
                <Box
                  sx={{
                    minHeight: 216,
                    border: "1px dashed #d4d4d8",
                    borderRadius: 2,
                    bgcolor: "#fafafa",
                    display: "grid",
                    placeItems: "center",
                    p: 2.5,
                    textAlign: "center",
                  }}
                >
                  <Stack spacing={1} alignItems="center" maxWidth={320}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        color: "#64748b",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        history
                      </span>
                    </Box>
                    <Typography fontSize={14} fontWeight={700}>
                      Sem atividade selecionada
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Escolhe um utilizador na aba <strong>Histórico</strong> para consultar a auditoria por conta.
                    </Typography>
                  </Stack>
                </Box>
              ) : (
                <Box sx={listaScrollSx}>
                  <List disablePadding>
                {atividadeRede.map((ev) => (
                      <ListItem
                        key={ev.id}
                        disableGutters
                        divider
                        secondaryAction={
                          <Typography
                            variant="caption"
                            sx={{
                              px: 0.9,
                              py: 0.4,
                              borderRadius: 999,
                              bgcolor: "#f8fafc",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            {ev.hora}
                          </Typography>
                        }
                        sx={{ py: 1.15, pr: 7.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, mt: 0.15 }}>
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: 1.25,
                              display: "grid",
                              placeItems: "center",
                              bgcolor:
                                ev.tone === "warning"
                                  ? "#fffbeb"
                                  : ev.tone === "error"
                                    ? "#fef2f2"
                                    : "#f0fdf4",
                              color:
                                ev.tone === "warning"
                                  ? "#ca8a04"
                                  : ev.tone === "error"
                                    ? "#dc2626"
                                    : "#16a34a",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                              {ev.icon}
                            </span>
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={ev.titulo}
                          secondary={ev.autor ? `${ev.autor} · ${ev.detalhe || "Sem descrição"}` : ev.detalhe}
                          primaryTypographyProps={{ fontSize: 13.5, fontWeight: 700 }}
                          secondaryTypographyProps={{ fontSize: 12, color: "#64748b" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Panel>
          </Box>
          ) : null}
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              lg: isAdmin ? "minmax(0, 2fr) minmax(0, 1fr)" : "1fr",
            },
          }}
        >
          <Box>
            <Panel
              title="Equipamentos recentes"
              subtitle="Amostra rápida dos registos manuais e dos dispositivos encontrados"
              action={
                <Button variant="text" size="small" onClick={() => onNavigate("computadores")}>
                Ver todos
                </Button>
              }
              minHeight={340}
              noPadding
            >
              <Box sx={{ px: 2.25, pb: 2.25 }}>
              <TableContainer sx={{ overflowX: "auto", maxWidth: "100%" }}>
                <Table
                  size="small"
                  sx={{
                    minWidth: 1020,
                    ...tableSxSemQuebra,
                    "& .MuiTableCell-root": { fontSize: 13 },
                    "& .MuiTableHead-root .MuiTableCell-root": {
                      bgcolor: "#fafafa",
                      borderBottomColor: "#eceff3",
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Hostname</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>IP</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>MAC</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Marca</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Modelo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Série</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>SO</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Inventário</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {equipamentosRecentesPainel.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11}>
                          <Typography variant="body2" color="text.secondary">
                            Sem equipamentos para mostrar.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      equipamentosRecentesPainel.map((row) => (
                        <TableRow key={`${row.linha}-${row.id}`} hover>
                          <TableCell sx={{ ...tableCellNowrap, minWidth: 96 }}>
                            <Chip
                              size="small"
                              label={row.linha === "manual" ? "Manual" : "Scan"}
                              sx={{
                                bgcolor: row.linha === "manual" ? "#f4f4f5" : "#eff6ff",
                                color: row.linha === "manual" ? "#3f3f46" : "#1d4ed8",
                                border: "1px solid",
                                borderColor: row.linha === "manual" ? "#e4e4e7" : "#bfdbfe",
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ ...tableCellEllipsis(120, 220), fontWeight: 600 }}>{txtBd(row.nome)}</TableCell>
                          <TableCell sx={tableCellMono(110)}>{txtBd(row.hostname)}</TableCell>
                          <TableCell sx={tableCellMono(118)}>{txtBd(row.ip)}</TableCell>
                          <TableCell sx={tableCellMono(132)}>{txtBd(row.mac_address)}</TableCell>
                          <TableCell sx={tableCellEllipsis(88, 140)}>{txtBd(row.marca)}</TableCell>
                          <TableCell sx={tableCellEllipsis(88, 140)}>{txtBd(row.modelo)}</TableCell>
                          <TableCell sx={tableCellMono(100)}>{txtBd(row.numero_serie)}</TableCell>
                          <TableCell sx={tableCellEllipsis(100, 180)}>{txtBd(row.sistema_operativo)}</TableCell>
                          <TableCell sx={tableCellEllipsis(120, 200)}>{txtBd(row.inventario_nome)}</TableCell>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            <Chip size="small" label={txtBd(row.estado)} color={estadoChipMuiColor(row.estado)} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              </Box>
            </Panel>
          </Box>
          {isAdmin ? (
          <Box>
            <Panel
              title="Alertas"
              subtitle="Edições e remoções recentes"
              action={
                <Button variant="text" size="small" onClick={() => onNavigate("historico-conta")}>
                  Ver histórico
                </Button>
              }
              minHeight={340}
            >
              {alertasEdicaoRemocao.length === 0 ? (
                <Box
                  sx={{
                    minHeight: 230,
                    border: "1px dashed #d4d4d8",
                    borderRadius: 2,
                    bgcolor: "#fafafa",
                    display: "grid",
                    placeItems: "center",
                    p: 2.5,
                    textAlign: "center",
                  }}
                >
                  <Stack spacing={1} alignItems="center" maxWidth={320}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        color: "#64748b",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        notifications
                      </span>
                    </Box>
                    <Typography fontSize={14} fontWeight={700}>
                      Sem alertas disponíveis
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Escolhe um utilizador na aba <strong>Histórico</strong> para rever edições e remoções por conta.
                    </Typography>
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ ...listaScrollSx, maxHeight: { xs: 210, lg: 235 } }}>
                  <List disablePadding>
                    {alertasEdicaoRemocao.map((alerta, idx) => (
                      <ListItem
                        key={alerta.id}
                        divider={idx < alertasEdicaoRemocao.length - 1}
                        disableGutters
                        secondaryAction={
                          <Typography
                            variant="caption"
                            sx={{
                              px: 0.9,
                              py: 0.4,
                              borderRadius: 999,
                              bgcolor: "#f8fafc",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            {alerta.hora}
                          </Typography>
                        }
                        sx={{ py: 1.05, pr: 7.5 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36, mt: 0.15 }}>
                          <Box
                            sx={{
                              width: 28,
                              height: 28,
                              borderRadius: 1.25,
                              display: "grid",
                              placeItems: "center",
                              bgcolor:
                                alerta.tone === "warning"
                                  ? "#fffbeb"
                                  : alerta.tone === "error"
                                    ? "#fef2f2"
                                    : alerta.icon === "edit_square"
                                      ? "#eff6ff"
                                      : "#f0fdf4",
                              color:
                                alerta.tone === "warning"
                                  ? "#ca8a04"
                                  : alerta.tone === "error"
                                    ? "#dc2626"
                                    : alerta.icon === "edit_square"
                                      ? "#2563eb"
                                      : "#16a34a",
                              border: "1px solid #e5e7eb",
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                              {alerta.icon}
                            </span>
                          </Box>
                        </ListItemIcon>
                        <ListItemText
                          primary={alerta.titulo}
                          secondary={alerta.detalhe}
                          primaryTypographyProps={{ fontSize: 13.5, fontWeight: 700 }}
                          secondaryTypographyProps={{ fontSize: 12, color: "#64748b" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Panel>
          </Box>
          ) : null}
        </Box>

        <Panel
          title="Utilizadores recentes"
          subtitle="Contas adicionadas ou atualizadas recentemente"
          action={
            <Button variant="text" size="small" onClick={() => onNavigate("utilizadores")}>
              Ver todos
            </Button>
          }
        >
          <Box sx={{ ...listaScrollSx, maxHeight: { xs: 165, lg: 175 } }}>
            <List disablePadding>
              {latestUsers.map((u) => (
                <ListItem key={u.id} divider disableGutters sx={{ py: 1.1, gap: 1.2 }}>
                  <ListItemIcon sx={{ minWidth: 38 }}>
                    <Box
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        bgcolor: "#f8fafc",
                        border: "1px solid #e5e7eb",
                        color: "#475569",
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>
                        person
                      </span>
                    </Box>
                  </ListItemIcon>
                  <ListItemText
                    primary={u.nome || u.username}
                    secondary={u.email || u.username || "Sem email"}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: 700 }}
                    secondaryTypographyProps={{ fontSize: 12, color: "#64748b" }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Panel>
      </Stack>
    </SectionCard>
  );
}
