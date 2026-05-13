/* Dashboard — visão executiva no estilo painel operacional. */

import { useMemo } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Typography,
} from "@mui/material";
import MiniSparkline from "../components/MiniSparkline";
import SectionCard from "../components/SectionCard";
import { etiquetaSituacaoScan, ipEquipamento, txtBd } from "../utils/detalheEquipamento";

function tipoLabel(inv) {
  if (inv.tipo_inventario === "sub_rede") return "Sub-rede";
  return "Normal";
}

function estadoPcColor(estado) {
  const e = String(estado || "").toLowerCase();
  if (e.includes("ativo") || e.includes("conclu")) return "success";
  if (e.includes("manut") || e.includes("pend")) return "warning";
  if (e.includes("inativ") || e.includes("erro")) return "error";
  return "default";
}

function horaDoEvento(iso, fallback = "—") {
  if (!iso) return fallback;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return fallback;
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

  return {
    id: ev?.id != null ? `hist-${ev.id}` : `hist-f-${idx}`,
    titulo,
    detalhe,
    hora: horaDoEvento(ev?.data_evento),
    icon,
    tone,
  };
}

export default function DashboardPage({
  inventarios,
  computadores,
  ativosPorInventario = [],
  utilizadores,
  localizacoes: _localizacoes,
  historicoConta = [],
  loading,
  onNavigate,
  onOpenHistorico,
}) {
  const abrirMeuHistorico =
    typeof onOpenHistorico === "function" ? onOpenHistorico : () => onNavigate("historico-conta");

  const recentInventarios = (inventarios || []).slice(0, 5);
  const latestUsers = (utilizadores || []).slice(0, 5);
  const dispositivosScan = useMemo(
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
  const totalAtivos = (computadores || []).length + totalScan;

  const estadoContagens = useMemo(() => {
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

  const estadoCores = ["#22c55e", "#facc15", "#ef4444", "#8b5cf6", "#06b6d4", "#94a3b8"];
  const gradienteAtivos = useMemo(() => {
    const total = Math.max(estadoContagens.total, 1);
    let acumulado = 0;
    const stops = estadoContagens.totais.map((item, idx) => {
      const inicio = acumulado;
      acumulado += (item.total / total) * 100;
      const fim = acumulado;
      const cor = estadoCores[idx % estadoCores.length];
      return `${cor} ${inicio.toFixed(2)}% ${fim.toFixed(2)}%`;
    });
    if (stops.length === 0) return "#e2e8f0 0% 100%";
    return stops.join(", ");
  }, [estadoContagens]);

  const historicoOrdenado = useMemo(() => {
    return [...(historicoConta || [])].sort((a, b) => {
      const ta = a?.data_evento ? new Date(a.data_evento).getTime() : 0;
      const tb = b?.data_evento ? new Date(b.data_evento).getTime() : 0;
      return tb - ta;
    });
  }, [historicoConta]);

  /** Todas as atividades (sessão, painel, operações) — pré-visualização no dashboard. */
  const atividadeTodas = useMemo(() => {
    return historicoOrdenado.slice(0, 20).map((ev, idx) => mapHistoricoParaItem(ev, idx));
  }, [historicoOrdenado]);

  /** Só alterações / remoções de dados para o painel de alertas. */
  const alertasEdicaoRemocao = useMemo(() => {
    return historicoOrdenado.filter(isAlertaEdicaoOuRemocao).slice(0, 12).map((ev, idx) => mapHistoricoParaItem(ev, idx));
  }, [historicoOrdenado]);

  const eventosHoje = useMemo(() => {
    const hoje = new Date().toLocaleDateString("pt-PT");
    return (historicoConta || []).filter((ev) => {
      if (!ev?.data_evento) return false;
      try {
        return new Date(ev.data_evento).toLocaleDateString("pt-PT") === hoje;
      } catch {
        return false;
      }
    }).length;
  }, [historicoConta]);

  const dataHoje = useMemo(() => {
    try {
      return new Date().toLocaleDateString("pt-PT");
    } catch {
      return "—";
    }
  }, []);

  const cardsResumo = [
    { key: "inventarios", label: "Inventários", value: inventarios.length, icon: "inventory_2" },
    { key: "computadores", label: "Computadores", value: computadores.length, icon: "computer" },
    { key: "ativos", label: "Dispositivos ativos", value: totalAtivos, icon: "devices" },
    { key: "utilizadores", label: "Utilizadores", value: utilizadores.length, icon: "group" },
    { key: "logs", label: "Eventos hoje", value: eventosHoje, icon: "receipt_long" },
  ];

  const atividadeRede = atividadeTodas;
  const painelSx = {
    p: { xs: 1.5, md: 2 },
    height: "100%",
  };
  const painelMedioSx = {
    ...painelSx,
    minHeight: { xs: 260, lg: 345 },
  };
  const listaScrollSx = {
    maxHeight: { xs: 225, lg: 265 },
    overflowY: "auto",
    pr: 0.5,
  };

  return (
    <SectionCard
      title="Dashboard"
      subtitle="Visão geral do inventário e atividade do sistema."
      rightAction={
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ width: { xs: "100%", md: "auto" }, justifyContent: "flex-end", ml: { md: "auto" } }}
        >
          <Button variant="outlined" size="small" onClick={() => onNavigate("inventarios")}>
          Ver inventários
          </Button>
          <Button variant="outlined" size="small" startIcon={<span className="material-symbols-outlined">today</span>}>
            Hoje: {dataHoje}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={2.5}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
              xl: "repeat(6, minmax(0, 1fr))",
            },
          }}
        >
          {cardsResumo.map((c, idx) => (
            <Box key={c.key}>
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 1.5, md: 2 },
                  minHeight: { xs: 106, md: 118 },
                  background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
                  borderTop: `4px solid ${["#2563eb", "#6d28d9", "#0ea5e9", "#16a34a", "#d97706", "#1d4ed8"][idx % 6]}`,
                  boxShadow: "0 10px 22px rgba(15,23,42,0.08)",
                }}
              >
                <Stack spacing={1} sx={{ height: "100%", justifyContent: "space-between" }}>
                  <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.1} alignItems="center">
                      <Avatar
                        variant="rounded"
                        sx={{
                          bgcolor: "#eaf2ff",
                          color: "primary.main",
                          width: 32,
                          height: 32,
                          border: "1px solid #dbeafe",
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {c.icon}
              </span>
                      </Avatar>
                      <Typography variant="caption" color="text.secondary">
                        {c.label}
                      </Typography>
                    </Stack>
                    <MiniSparkline seed={c.value} />
                  </Stack>
                  <Box>
                    <Typography fontWeight={800} fontSize={26} lineHeight={1.05}>
                      {c.value}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Box>
          ))}
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          <Box>
            <Paper variant="outlined" sx={painelMedioSx}>
              <Typography fontWeight={800} fontSize={17} mb={1.25} color="#0f172a">
                Ativos por estado
              </Typography>
              <Divider sx={{ mb: 1.25 }} />
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", md: "center" }}
              >
                <Box
                  sx={{
                    width: { xs: 136, md: 150 },
                    height: { xs: 136, md: 150 },
                    borderRadius: "50%",
                    background: `conic-gradient(${gradienteAtivos})`,
                    position: "relative",
                    flexShrink: 0,
                    mx: { xs: "auto", md: 0 },
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 18,
                      borderRadius: "50%",
                      bgcolor: "#fff",
                      display: "grid",
                      placeItems: "center",
                      textAlign: "center",
                      p: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Total
                    </Typography>
                    <Typography fontWeight={800} fontSize={22} lineHeight={1}>
                      {estadoContagens.total}
                    </Typography>
                  </Box>
                </Box>
                <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                  {estadoContagens.totais.slice(0, 4).map((item, idx) => {
                    const percent = estadoContagens.total ? Math.round((item.total / estadoContagens.total) * 100) : 0;
                  return (
                      <Box key={item.estado}>
                        <Stack direction="row" justifyContent="space-between" mb={0.35}>
                          <Typography fontSize={12}>{item.estado}</Typography>
                          <Typography fontSize={12} color="text.secondary">
                            {item.total}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={percent}
                          sx={{
                            height: 6,
                            borderRadius: 999,
                            bgcolor: "#edf2f7",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: estadoCores[idx % estadoCores.length],
                            },
                          }}
                        />
                      </Box>
                  );
                })}
                </Stack>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                Inclui computadores registados e dispositivos encontrados em scan.
              </Typography>
            </Paper>
          </Box>

          <Box>
            <Paper variant="outlined" sx={painelMedioSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
                <Typography fontWeight={800} fontSize={17}>
                  Inventários mais recentes
                </Typography>
                <Button variant="text" size="small" onClick={() => onNavigate("inventarios")}>
                  Ver todos
                </Button>
              </Stack>
              <Divider sx={{ mb: 1 }} />
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
                      <ListItem key={inv.id} divider disableGutters>
                        <ListItemText
                          primary={inv.nome}
                          secondary={`${tipoLabel(inv)} · ${(inv.total_computadores ?? 0) + (inv.total_dispositivos_scan ?? 0)} ativos`}
                          primaryTypographyProps={{ fontSize: 14, fontWeight: 700 }}
                          secondaryTypographyProps={{ fontSize: 12 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
          </Box>

          <Box>
            <Paper variant="outlined" sx={painelMedioSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
                <Typography fontWeight={800} fontSize={17}>
                  Atividade recente
                </Typography>
                <Button variant="text" size="small" onClick={abrirMeuHistorico}>
                  Histórico completo
                </Button>
              </Stack>
              <Divider sx={{ mb: 1 }} />
            {loading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2">A carregar…</Typography>
                </Stack>
              ) : atividadeRede.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Sem atividade recente.
                </Typography>
              ) : (
                <Box sx={listaScrollSx}>
                  <List disablePadding>
                {atividadeRede.map((ev) => (
                      <ListItem
                        key={ev.id}
                        disableGutters
                        divider
                        secondaryAction={<Typography variant="caption">{ev.hora}</Typography>}
                      >
                        <ListItemText
                          primary={ev.titulo}
                          secondary={ev.detalhe}
                          primaryTypographyProps={{ fontSize: 14, fontWeight: 700 }}
                          secondaryTypographyProps={{ fontSize: 12 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 2fr) minmax(0, 1fr)",
            },
          }}
        >
          <Box>
            <Paper variant="outlined" sx={{ ...painelSx, minHeight: { xs: 250, lg: 340 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
                <Typography fontWeight={800} fontSize={17}>
                  Equipamentos recentes
                </Typography>
                <Button variant="text" size="small" onClick={() => onNavigate("computadores")}>
                  Ver todos
                </Button>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              <TableContainer sx={{ overflowX: "auto", maxWidth: "100%" }}>
                <Table size="small" sx={{ minWidth: 980 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
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
                      <TableCell sx={{ fontWeight: 700 }}>Deteção</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {equipamentosRecentesPainel.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={13}>
                          <Typography variant="body2" color="text.secondary">
                            Sem equipamentos para mostrar.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      equipamentosRecentesPainel.map((row) => (
                        <TableRow key={`${row.linha}-${row.id}`}>
                          <TableCell>{row.linha === "manual" ? "Manual" : "Scan"}</TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{row.id}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{txtBd(row.nome)}</TableCell>
                          <TableCell>{txtBd(row.hostname)}</TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>{txtBd(row.ip)}</TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>{txtBd(row.mac_address)}</TableCell>
                          <TableCell>{txtBd(row.marca)}</TableCell>
                          <TableCell>{txtBd(row.modelo)}</TableCell>
                          <TableCell sx={{ fontFamily: "monospace", fontSize: 11 }}>{txtBd(row.numero_serie)}</TableCell>
                          <TableCell>{txtBd(row.sistema_operativo)}</TableCell>
                          <TableCell>{txtBd(row.inventario_nome)}</TableCell>
                          <TableCell>
                            <Chip size="small" label={txtBd(row.estado)} color={estadoPcColor(row.estado)} />
                          </TableCell>
                          <TableCell sx={{ fontSize: 11 }}>
                            {row.tipo === "dispositivo_descoberto" ? etiquetaSituacaoScan(row) : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button variant="text" size="small" sx={{ mt: 1 }} onClick={() => onNavigate("computadores")}>
                Ver todos os computadores
              </Button>
            </Paper>
          </Box>
          <Box>
            <Paper variant="outlined" sx={{ ...painelSx, minHeight: { xs: 250, lg: 315 } }}>
              <Typography fontWeight={800} fontSize={17} mb={0.5}>
                Alertas de alterações
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1.25}>
                Edições, atualizações e remoções de dados (inventários, equipamentos, contas…).
              </Typography>
              <Divider sx={{ mb: 1.25 }} />
              {alertasEdicaoRemocao.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  Sem alterações ou remoções recentes.
                </Typography>
              ) : (
                <Box sx={{ ...listaScrollSx, maxHeight: { xs: 210, lg: 235 } }}>
                  <List disablePadding>
                    {alertasEdicaoRemocao.map((alerta, idx) => (
                      <ListItem
                        key={alerta.id}
                        divider={idx < alertasEdicaoRemocao.length - 1}
                        disableGutters
                        secondaryAction={<Typography variant="caption">{alerta.hora}</Typography>}
                      >
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: 18,
                              color:
                                alerta.tone === "warning"
                                  ? "#f59e0b"
                                  : alerta.tone === "error"
                                    ? "#dc2626"
                                    : alerta.icon === "edit_square"
                                      ? "#2563eb"
                                      : "#22c55e",
                            }}
                          >
                            {alerta.icon}
                          </span>
                        </ListItemIcon>
                        <ListItemText
                          primary={alerta.titulo}
                          secondary={alerta.detalhe}
                          primaryTypographyProps={{ fontSize: 13, fontWeight: 700 }}
                          secondaryTypographyProps={{ fontSize: 12 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
              <Button variant="text" size="small" sx={{ mt: 1 }} onClick={() => onNavigate("historico-conta")}>
                Ver histórico de alterações
              </Button>
            </Paper>
          </Box>
        </Box>

        <Paper variant="outlined" sx={{ ...painelSx, minHeight: { xs: 230, lg: 260 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
            <Typography fontWeight={800} fontSize={17}>
              Utilizadores recentes
            </Typography>
            <Button variant="text" size="small" onClick={() => onNavigate("utilizadores")}>
              Ver todos
            </Button>
          </Stack>
          <Divider sx={{ mb: 1 }} />
          <Box sx={{ ...listaScrollSx, maxHeight: { xs: 165, lg: 175 } }}>
            <List disablePadding>
              {latestUsers.map((u) => (
                <ListItem key={u.id} divider disableGutters>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    person
                  </span>
                  </ListItemIcon>
                  <ListItemText
                    primary={u.nome || u.username}
                    secondary={u.email || u.username || "Sem email"}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: 700 }}
                    secondaryTypographyProps={{ fontSize: 12 }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Paper>
      </Stack>
    </SectionCard>
  );
}
