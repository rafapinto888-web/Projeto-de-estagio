/* Dashboard — visão executiva no estilo painel operacional. */

import { useMemo } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
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

function horaRelativa(index) {
  if (index < 3) return `Hoje, 09:4${index}`;
  return `Ontem, 17:${String(3 + index)}`;
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

export default function DashboardPage({
  inventarios,
  computadores,
  ativosPorInventario = [],
  utilizadores,
  localizacoes,
  historicoConta = [],
  loading,
  onNavigate,
  onOpenHistorico,
}) {
  const abrirMeuHistorico =
    typeof onOpenHistorico === "function" ? onOpenHistorico : () => onNavigate("historico-conta");

  const recentInventarios = (inventarios || []).slice(0, 5);
  const latestUsers = (utilizadores || []).slice(0, 5);
  const recentComputadores = (computadores || []).slice(0, 6);
  const dispositivosScan = useMemo(
    () =>
      (ativosPorInventario || []).flatMap((grupo) =>
        (grupo?.ativos || []).filter((item) => item?.tipo === "dispositivo_descoberto"),
      ),
    [ativosPorInventario],
  );
  const totalScan = (inventarios || []).reduce((acc, inv) => acc + (inv.total_dispositivos_scan ?? 0), 0);
  const totalAtivos = (computadores || []).length + totalScan;
  const totalInventarios = inventarios.length;

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

  const atividadeHistorico = useMemo(() => {
    const lista = [];
    (historicoConta || [])
      .slice(0, 20)
      .forEach((ev, idx) => {
        const acao = String(ev?.acao || "Evento");
        const descricao = String(ev?.descricao || "Sem descrição");
        const txt = `${acao} ${descricao}`.toLowerCase();
        const tone = txt.includes("erro") || txt.includes("falha") ? "warning" : "success";
        const icon =
          txt.includes("scan") || txt.includes("rede")
            ? "radar"
            : txt.includes("login") || txt.includes("sessao")
              ? "login"
              : txt.includes("apagar") || txt.includes("delete")
                ? "delete"
                : "task_alt";
        lista.push({
          id: ev?.id ? `hist-${ev.id}` : `hist-${idx}`,
          titulo: acao,
          detalhe: descricao,
          hora: horaDoEvento(ev?.data_evento, horaRelativa(idx)),
          icon,
          tone,
        });
      });

    if (lista.length === 0) {
      lista.push({
        id: "no-alert",
        titulo: "Sem histórico recente",
        detalhe: "Ainda não existem eventos da conta para mostrar.",
        hora: "Agora",
        icon: "check_circle",
        tone: "success",
      });
    }

    return lista.slice(0, 6);
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
    { key: "scan", label: "Scans realizados", value: totalScan, icon: "radar" },
    { key: "logs", label: "Eventos hoje", value: atividadeHistorico.length, icon: "receipt_long" },
  ];

  const atividadeRede = atividadeHistorico;
  const painelSx = {
    p: { xs: 1.5, md: 2 },
    height: "100%",
  };

  return (
    <SectionCard
      title="Dashboard"
      subtitle="Visão geral do inventário e atividade do sistema."
      rightAction={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
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
        <Grid container spacing={2}>
          {cardsResumo.map((c) => (
            <Grid item xs={12} sm={6} md={4} lg={4} xl={2} key={c.key}>
              <Paper
                variant="outlined"
                sx={{
                  p: { xs: 1.5, md: 2 },
                  minHeight: { xs: 102, md: 112 },
                }}
              >
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1.2} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={1.1} alignItems="center">
                      <Avatar
                        variant="rounded"
                        sx={{ bgcolor: "#eff6ff", color: "primary.main", width: 30, height: 30 }}
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
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.2 }}>
                      Atualizado com dados reais
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={4}>
            <Paper variant="outlined" sx={painelSx}>
              <Typography fontWeight={800} fontSize={17} mb={1.25}>
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
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Paper variant="outlined" sx={painelSx}>
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
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <Paper variant="outlined" sx={painelSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
                <Typography fontWeight={800} fontSize={17}>
                  Atividade recente (Scan)
                </Typography>
                <Button variant="text" size="small" onClick={abrirMeuHistorico}>
                  Histórico
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
              )}
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Paper variant="outlined" sx={painelSx}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
                <Typography fontWeight={800} fontSize={17}>
                  Computadores recentes
                </Typography>
                <Button variant="text" size="small" onClick={() => onNavigate("computadores")}>
                  Ver todos
                </Button>
              </Stack>
              <Divider sx={{ mb: 1 }} />
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Nome</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>IP</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentComputadores.map((pc) => (
                      <TableRow key={pc.id}>
                        <TableCell sx={{ fontWeight: 600 }}>{pc.nome || pc.hostname || "—"}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace" }}>{pc.endereco_ip || pc.ip || "—"}</TableCell>
                        <TableCell>
                          <Chip size="small" label={pc.estado || "—"} color={estadoPcColor(pc.estado)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Button variant="text" size="small" sx={{ mt: 1 }} onClick={() => onNavigate("computadores")}>
                Ver todos os computadores
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper variant="outlined" sx={painelSx}>
              <Typography fontWeight={800} fontSize={17} mb={1.25}>
                Logs e alertas recentes
              </Typography>
              <Divider sx={{ mb: 1.25 }} />
              <List disablePadding>
                {atividadeHistorico.map((alerta, idx) => (
                  <ListItem
                    key={alerta.id}
                    divider={idx < atividadeHistorico.length - 1}
                    disableGutters
                    secondaryAction={<Typography variant="caption">{alerta.hora}</Typography>}
                  >
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 18,
                          color: alerta.tone === "warning" ? "#f59e0b" : alerta.tone === "success" ? "#22c55e" : "#3b82f6",
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
              <Button variant="text" size="small" sx={{ mt: 1 }} onClick={() => onNavigate("logs")}>
                Ver todos os logs
              </Button>
            </Paper>
          </Grid>
        </Grid>

        <Paper variant="outlined" sx={painelSx}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.25}>
            <Typography fontWeight={800} fontSize={17}>
              Utilizadores recentes
            </Typography>
            <Button variant="text" size="small" onClick={() => onNavigate("utilizadores")}>
              Ver todos
            </Button>
          </Stack>
          <Divider sx={{ mb: 1 }} />
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
        </Paper>
      </Stack>
    </SectionCard>
  );
}
