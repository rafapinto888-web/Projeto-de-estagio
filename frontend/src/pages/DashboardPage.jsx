/* Dashboard — visão executiva no estilo painel operacional. */

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
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
  Typography,
} from "@mui/material";
import SectionCard from "../components/SectionCard";

function tipoLabel(inv) {
  if (inv.tipo_inventario === "sub_rede") return "Sub-rede";
  return "Normal";
}

function statusPill(inv, index) {
  if (inv.tipo_inventario === "sub_rede") return { cls: "badge-info", text: "Em andamento" };
  const i = Number(inv?.id ?? index);
  if (i % 3 === 2) return { cls: "badge-scheduled", text: "Agendado" };
  return { cls: "badge-done", text: "Concluído" };
}

export default function DashboardPage({
  inventarios,
  computadores,
  utilizadores,
  localizacoes,
  loading,
  onNavigate,
  onOpenHistorico,
}) {
  const abrirMeuHistorico =
    typeof onOpenHistorico === "function" ? onOpenHistorico : () => onNavigate("historico-conta");

  const recentInventarios = (inventarios || []).slice(0, 5);
  const latestUsers = (utilizadores || []).slice(0, 4);
  const recentComputadores = (computadores || []).slice(0, 6);
  const totalScan = (inventarios || []).reduce((acc, inv) => acc + (inv.total_dispositivos_scan ?? 0), 0);
  const totalAtivos = (computadores || []).length + totalScan;
  const cardsResumo = [
    { key: "inventarios", label: "Inventários", value: inventarios.length, icon: "inventory_2" },
    { key: "computadores", label: "Computadores", value: computadores.length, icon: "computer" },
    { key: "ativos", label: "Dispositivos ativos", value: totalAtivos, icon: "devices" },
    { key: "utilizadores", label: "Utilizadores", value: utilizadores.length, icon: "group" },
    { key: "localizacoes", label: "Localizações", value: localizacoes.length, icon: "location_on" },
    { key: "scan", label: "Descobertos por scan", value: totalScan, icon: "radar" },
  ];

  const atividadeRede = recentInventarios.slice(0, 6).map((inv, i) => ({
    id: `inv-${inv.id}`,
    titulo: `Scan em ${inv.nome || "inventário"}`,
    detalhe: `Tipo ${tipoLabel(inv)} · ${inv.total_dispositivos_scan ?? 0} dispositivo(s)`,
    hora: i < 3 ? `Hoje, ${String(9 + i).padStart(2, "0")}:4${i}` : `Ontem, ${String(18 - i).padStart(2, "0")}:2${i}`,
    estado: i % 3 === 0 ? "Sucesso" : i % 3 === 1 ? "Concluído" : "Em análise",
  }));

  return (
    <SectionCard
      title="Dashboard"
      subtitle="Visão rápida do inventário e operação atual."
      rightAction={
        <Button variant="outlined" size="small" onClick={() => onNavigate("inventarios")}>
          Ver inventários
        </Button>
      }
    >
      <Stack spacing={2}>
        <Grid container spacing={1.5}>
          {cardsResumo.map((c) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={c.key}>
              <Paper variant="outlined" sx={{ p: 1.5 }}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {c.icon}
                    </span>
                  </Box>
                  <Box>
                    <Typography fontWeight={800} fontSize={22} lineHeight={1}>
                      {c.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {c.label}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 1.5, height: "100%" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography fontWeight={700}>Inventários recentes</Typography>
                <Button variant="text" size="small" onClick={() => onNavigate("inventarios")}>
                  Ver todos
                </Button>
              </Stack>
              {loading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2">A carregar inventários…</Typography>
                </Stack>
              ) : (
                <List dense disablePadding>
                  {recentInventarios.map((inv, index) => {
                    const pill = statusPill(inv, index);
                    return (
                      <ListItem key={inv.id} divider disableGutters secondaryAction={<Chip label={pill.text} size="small" />}>
                        <ListItemText
                          primary={inv.nome}
                          secondary={`${tipoLabel(inv)} · ${(inv.total_computadores ?? 0) + (inv.total_dispositivos_scan ?? 0)} ativos`}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 1.5, height: "100%" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography fontWeight={700}>Atividade recente (Scan)</Typography>
                <Button variant="text" size="small" onClick={abrirMeuHistorico}>
                  Histórico
                </Button>
              </Stack>
              {loading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={16} />
                  <Typography variant="body2">A carregar…</Typography>
                </Stack>
              ) : (
                <List dense disablePadding>
                  {atividadeRede.map((ev) => (
                    <ListItem
                      key={ev.id}
                      disableGutters
                      divider
                      secondaryAction={<Typography variant="caption">{ev.hora}</Typography>}
                    >
                      <ListItemText primary={ev.titulo} secondary={`${ev.detalhe} · ${ev.estado}`} />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={1.5}>
          <Grid item xs={12} md={7}>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography fontWeight={700}>Computadores recentes</Typography>
                <Button variant="text" size="small" onClick={() => onNavigate("computadores")}>
                  Ver todos
                </Button>
              </Stack>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>IP</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentComputadores.map((pc) => (
                    <TableRow key={pc.id}>
                      <TableCell>{pc.nome || pc.hostname || "—"}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace" }}>{pc.endereco_ip || pc.ip || "—"}</TableCell>
                      <TableCell>{pc.estado || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          <Grid item xs={12} md={5}>
            <Paper variant="outlined" sx={{ p: 1.5 }}>
              <Typography fontWeight={700} mb={1}>
                Ações rápidas
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    onClick={() => onNavigate("inventarios")}
                    startIcon={<span className="material-symbols-outlined">inventory_2</span>}
                  >
                    Inventários
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    onClick={() => onNavigate("ativos")}
                    startIcon={<span className="material-symbols-outlined">radar</span>}
                  >
                    Scan
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    onClick={() => onNavigate("pesquisa")}
                    startIcon={<span className="material-symbols-outlined">search</span>}
                  >
                    Pesquisa
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    onClick={() => onNavigate("logs")}
                    startIcon={<span className="material-symbols-outlined">receipt_long</span>}
                  >
                    Logs
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Paper variant="outlined" sx={{ p: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography fontWeight={700}>Utilizadores recentes</Typography>
            <Button variant="text" size="small" onClick={() => onNavigate("utilizadores")}>
              Ver todos
            </Button>
          </Stack>
          <List dense disablePadding>
            {latestUsers.map((u) => (
              <ListItem key={u.id} divider disableGutters>
                <ListItemIcon sx={{ minWidth: 28 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                    person
                  </span>
                </ListItemIcon>
                <ListItemText primary={u.nome || u.username} secondary={u.email || u.username || "Sem email"} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Stack>
    </SectionCard>
  );
}
