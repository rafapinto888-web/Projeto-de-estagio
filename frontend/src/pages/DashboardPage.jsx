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
  isAdmin = false,
  loading,
  onNavigate,
  onOpenHistorico,
}) {
  const historicoConta = [];
  const abrirMeuHistorico =
    typeof onOpenHistorico === "function" ? onOpenHistorico : () => onNavigate("historico-conta");

  // --- Métricas e listas derivadas dos props ---

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
  const computadoresAtivos = useMemo(
    () =>
      (computadores || []).filter((pc) => String(pc?.estado || "").toLowerCase() === "ativo").length,
    [computadores],
  );

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

  const historicoOrdenado = useMemo(() => {
    return [...(historicoConta || [])].sort((a, b) => {
      const ta = a?.data_evento ? instanteDataApiParaLocal(a.data_evento)?.getTime() ?? 0 : 0;
      const tb = b?.data_evento ? instanteDataApiParaLocal(b.data_evento)?.getTime() ?? 0 : 0;
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

  const dataHoje = useMemo(() => {
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

  const atividadeRede = atividadeTodas;
  const listaScrollSx = {
    maxHeight: { xs: 225, lg: 265 },
    overflowY: "auto",
    pr: 0.5,
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
      <Stack spacing={3}>
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

        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: "block" }}>
            Ações rápidas
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<span className="material-symbols-outlined">radar</span>}
              onClick={() => onNavigate("ativos")}
            >
              Scan de rede
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<span className="material-symbols-outlined">computer</span>}
              onClick={() => onNavigate("computadores")}
            >
              Computadores
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<span className="material-symbols-outlined">manage_search</span>}
              onClick={() => onNavigate("pesquisa")}
            >
              Pesquisa global
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<span className="material-symbols-outlined">inventory_2</span>}
              onClick={() => onNavigate("inventarios")}
            >
              Inventários
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<span className="material-symbols-outlined">receipt_long</span>}
              onClick={() => onNavigate("logs")}
            >
              Logs
            </Button>
            {isAdmin ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<span className="material-symbols-outlined">history</span>}
                onClick={() => onNavigate("historico-conta")}
              >
                Histórico
              </Button>
            ) : null}
          </Stack>
        </Box>

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
                      <ListItem key={inv.id} divider disableGutters>
                        <ListItemText
                          primary={inv.nome}
                          secondary={`${tipoInventarioLabel(inv.tipo_inventario)} · ${(inv.total_computadores ?? 0) + (inv.total_dispositivos_scan ?? 0)} ativos`}
                          primaryTypographyProps={{ fontSize: 14, fontWeight: 700 }}
                          secondaryTypographyProps={{ fontSize: 12 }}
                        />
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
                <Typography variant="body2" color="text.secondary">
                  Escolhe um utilizador na aba <strong>Histórico</strong> para ver a auditoria por conta.
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
              action={
                <Button variant="text" size="small" onClick={() => onNavigate("computadores")}>
                Ver todos
                </Button>
              }
              minHeight={340}
              noPadding
            >
              <Box sx={{ px: 2, pb: 2 }}>
              <TableContainer sx={{ overflowX: "auto", maxWidth: "100%" }}>
                <Table
                  size="small"
                  sx={{
                    minWidth: 1020,
                    ...tableSxSemQuebra,
                    "& .MuiTableCell-root": { fontSize: 13 },
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
                          <TableCell sx={{ ...tableCellNowrap, minWidth: 72 }}>{row.linha === "manual" ? "Manual" : "Scan"}</TableCell>
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
                <Typography variant="body2" color="text.secondary">
                  Escolhe um utilizador na aba <strong>Histórico</strong> para rever edições e remoções por conta.
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
            </Panel>
          </Box>
          ) : null}
        </Box>

        <Panel
          title="Utilizadores recentes"
          action={
            <Button variant="text" size="small" onClick={() => onNavigate("utilizadores")}>
              Ver todos
            </Button>
          }
        >
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
        </Panel>
      </Stack>
    </SectionCard>
  );
}
