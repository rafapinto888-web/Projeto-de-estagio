/* Scan — lista de ativos por inventário; configuração visível sem credenciais (credenciais só no modal). */

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import FormModal from "../components/FormModal";

/** Origem na BD: manual = tabela computadores; scan = tabela dispositivos descobertos (também persistido). */
function origemDispositivo(a) {
  const t = String(a?.tipo || "").toLowerCase();
  if (t === "computador") return "manual";
  if (t === "dispositivo_descoberto") return "scan";
  if (a?.numero_serie) return "manual";
  return "scan";
}

function etiquetaOrigem(a) {
  return origemDispositivo(a) === "manual" ? "Registo manual" : "Via scan";
}

function estadoChipColor(estado) {
  const e = String(estado || "").toLowerCase();
  if (e.includes("ativo") || e.includes("conclu")) return "success";
  if (e.includes("manut") || e.includes("pend")) return "warning";
  if (e.includes("inativ") || e.includes("erro")) return "error";
  return "default";
}

function semDadosCompleto(a) {
  const semNome = !(a?.nome || a?.hostname)?.toString()?.trim();
  const semMac = !(a?.mac_address || "").toString().trim();
  return semNome && semMac;
}

function extrairUltimaMarcacao(scanInfoStr) {
  if (!scanInfoStr) return "—";
  const matches = [...String(scanInfoStr).matchAll(/\[[^\]\n]+\]/g)];
  if (!matches.length) return "—";
  return matches[matches.length - 1][0].replace(/^\[|\]$/g, "").trim();
}

function textoResumoUltimoScan(scanInfo, loading, erro) {
  if (loading) return "Em execução…";
  if (!scanInfo) return "—";
  if (erro) return "Ver log";
  return extrairUltimaMarcacao(scanInfo);
}

function linhaScanKey(a, idx) {
  if (a?.id != null && a.id !== "") return `id:${a.id}`;
  if (a?.ip != null && String(a.ip).trim() !== "") return `ip:${a.ip}`;
  return `idx:${idx}`;
}

function exportCsvRows(rows, filename = "ativos-scan.csv") {
  const headers = ["Nome", "IP", "MAC", "Origem", "Estado", "SO", "Série"];
  const lines = [
    headers.join(";"),
    ...rows.map((a) =>
      [
        `"${String(a?.nome || a?.hostname || "").replace(/"/g, '""')}"`,
        a?.ip || "",
        a?.mac_address || "",
        etiquetaOrigem(a),
        a?.estado || "",
        `"${String(a?.sistema_operativo || "").replace(/"/g, '""')}"`,
        a?.numero_serie || "",
      ].join(";"),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CARD_SX = {
  borderRadius: 2,
  border: "1px solid #e2e8f0",
  bgcolor: "#fff",
  boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
};

export default function AtivosPage({
  inventarios,
  selectedInventarioId,
  setSelectedInventarioId,
  ativoPesquisa,
  setAtivoPesquisa,
  onPesquisar,
  onRecarregarLista,
  isAdmin,
  scanRede,
  setScanRede,
  scanUser,
  setScanUser,
  scanPass,
  setScanPass,
  scanLogsRdp,
  setScanLogsRdp,
  scanLogsSeguranca,
  setScanLogsSeguranca,
  onScan,
  onCreateInventarioFromScan,
  scanInfo,
  ativos,
  loading,
}) {
  const [modal, setModal] = useState(null);
  const [scanTab, setScanTab] = useState("existente");
  const [tabLista, setTabLista] = useState("todos");
  const [selectedAtivo, setSelectedAtivo] = useState(null);
  const [selectedRowKey, setSelectedRowKey] = useState(null);
  const [logExpanded, setLogExpanded] = useState(false);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [novoInventario, setNovoInventario] = useState({
    nome: "",
    tipo_inventario: "sub_rede",
    rede: "",
    descricao: "",
  });

  async function handleScan() {
    if (!selectedInventarioId) return;
    if (!scanUser?.trim() || !scanPass) return;
    const ok = Boolean(await onScan?.());
    if (ok) setModal(null);
  }

  async function handleCriarInventarioNoScan() {
    const nome = String(novoInventario.nome || "").trim();
    if (!nome) return;
    const createdId = await onCreateInventarioFromScan?.({
      nome,
      tipo_inventario: novoInventario.tipo_inventario || "sub_rede",
      rede: String(novoInventario.rede || "").trim() || null,
      descricao: String(novoInventario.descricao || "").trim() || null,
    });
    if (createdId) {
      setSelectedInventarioId(String(createdId));
      setScanTab("existente");
      setNovoInventario({ nome: "", tipo_inventario: "sub_rede", rede: "", descricao: "" });
    }
  }

  const lista = ativos || [];
  const inventariosSubRede = (inventarios || []).filter(
    (inv) => String(inv?.tipo_inventario || "").toLowerCase() === "sub_rede",
  );
  const inventarioScanValido = inventariosSubRede.some((inv) => String(inv.id) === String(selectedInventarioId || ""));
  const temTipoLogSelecionado = Boolean(scanLogsRdp || scanLogsSeguranca);
  const scanPodeExecutar = Boolean(
    inventarioScanValido && scanUser?.trim() && scanPass && temTipoLogSelecionado && scanTab === "existente",
  );

  useEffect(() => {
    setSelectedAtivo(null);
    setSelectedRowKey(null);
  }, [selectedInventarioId]);

  const contagens = useMemo(() => {
    const totalAtivos = lista.length;
    const totalRegistosManual = lista.filter((a) => origemDispositivo(a) === "manual").length;
    const totalDescobertosScan = lista.filter((a) => origemDispositivo(a) === "scan").length;
    const comMac = lista.filter((a) => String(a?.mac_address || "").trim()).length;
    const semHost = lista.filter((a) => !(a?.nome || a?.hostname)?.toString()?.trim()).length;
    const inativos = lista.filter((a) =>
      String(a?.estado || "")
        .toLowerCase()
        .includes("inativ"),
    ).length;
    const semInfo = lista.filter(semDadosCompleto).length;

    return { totalAtivos, totalRegistosManual, totalDescobertosScan, comMac, semHost, inativos, semInfo };
  }, [lista]);

  const listaFiltrada = useMemo(() => {
    let out = [...lista];

    switch (tabLista) {
      case "por_scan":
        out = out.filter((a) => origemDispositivo(a) === "scan");
        break;
      case "manual":
        out = out.filter((a) => origemDispositivo(a) === "manual");
        break;
      case "sem_dados":
        out = out.filter(semDadosCompleto);
        break;
      case "inativos":
        out = out.filter((a) =>
          String(a?.estado || "")
            .toLowerCase()
            .includes("inativ"),
        );
        break;
      default:
        break;
    }

    const q = String(ativoPesquisa || "")
      .trim()
      .toLowerCase();
    if (q) {
      out = out.filter((a) => {
        const blob = `${a?.nome || ""} ${a?.hostname || ""} ${a?.ip || ""} ${a?.mac_address || ""} ${a?.numero_serie || ""}`.toLowerCase();
        return blob.includes(q);
      });
    }

    return out;
  }, [lista, tabLista, ativoPesquisa]);

  const nomeInventario = useMemo(() => {
    const inv = (inventarios || []).find((x) => String(x.id) === String(selectedInventarioId || ""));
    return inv?.nome || "—";
  }, [inventarios, selectedInventarioId]);

  const scanInfoErro =
    typeof scanInfo === "string" && (scanInfo.toLowerCase().includes("erro") || scanInfo.toLowerCase().includes("error"));

  const estadoResumo = loading ? "a_correr" : scanInfoErro ? "erro" : scanInfo?.includes?.("concluíd") ? "ok" : scanInfo ? "ok" : "neutro";

  const ultimoScanLinha = textoResumoUltimoScan(scanInfo, loading, scanInfoErro);

  return (
    <Box sx={{ width: "100%", minWidth: 0 }}>
      {/* Cabeçalho da página */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "flex-start" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.02em", fontSize: { xs: "1.35rem", md: "1.5rem" } }}>
            Scan de rede
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 620 }}>
            Descobre dispositivos e associa-os ao inventário selecionado.
          </Typography>
        </Box>
        {isAdmin ? (
          <Button
            type="button"
            variant="contained"
            startIcon={
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>
                play_circle
              </span>
            }
            onClick={() => {
              setScanUser("");
              setScanPass("");
              setScanLogsRdp?.(true);
              setScanLogsSeguranca?.(true);
              setScanTab("existente");
              setModal("scan");
            }}
            sx={{
              py: 1,
              px: 2,
              borderRadius: 2,
              flexShrink: 0,
              alignSelf: { xs: "stretch", sm: "flex-start" },
            }}
          >
            Iniciar scan
          </Button>
        ) : null}
      </Stack>

      {isAdmin === false ? (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Apenas administradores podem iniciar um scan de rede.
        </Typography>
      ) : null}

      {/* Linha superior: config + resumo */}
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        sx={{ mb: 2, alignItems: "stretch" }}
      >
        <Paper sx={{ ...CARD_SX, p: 2.5, flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#475569" }} aria-hidden>
              settings
            </span>
            <Typography fontWeight={700} fontSize={17}>
              Configuração do scan
            </Typography>
          </Stack>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="ativos-inv-label">Inventário</InputLabel>
              <Select
                labelId="ativos-inv-label"
                label="Inventário"
                value={selectedInventarioId || ""}
                onChange={(e) => setSelectedInventarioId(e.target.value)}
              >
                <MenuItem value="">Selecionar…</MenuItem>
                {(inventarios || []).map((inv) => (
                  <MenuItem key={inv.id} value={String(inv.id)}>
                    {inv.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Intervalo IP / rede"
              value={scanRede}
              onChange={(e) => setScanRede(e.target.value)}
              placeholder="Ex.: 192.168.1.0/24 ou intervalo definido pela rede"
              size="small"
              helperText={nomeInventario !== "—" ? `Inventário: ${nomeInventario}` : "Escolhe o inventário primeiro."}
            />
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#64748b", marginTop: 2 }}>
                info
              </span>
              <Typography variant="body2" color="text.secondary">
                Os dispositivos encontrados serão associados ao inventário selecionado. As credenciais de rede só são pedidas ao premir «Iniciar scan».
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ ...CARD_SX, p: 2.5, flex: 1, minWidth: 0, maxWidth: { lg: 520 } }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: "#475569" }} aria-hidden>
              timeline
            </span>
            <Typography fontWeight={700} fontSize={17}>
              Resumo do último scan
            </Typography>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0,1fr))",
              gap: 1.5,
              mb: 2,
            }}
          >
            {[
              { k: "encontrados", label: "Total no inventário", v: contagens.totalAtivos, icon: "devices" },
              {
                k: "scanBd",
                label: "Via scan de rede",
                v: contagens.totalDescobertosScan,
                icon: "radar",
              },
              { k: "reg", label: "Registo manual", v: contagens.totalRegistosManual, icon: "computer" },
              { k: "mac", label: "Com MAC", v: contagens.comMac, icon: "fingerprint" },
              { k: "sh", label: "Sem hostname", v: contagens.semHost, icon: "help" },
              { k: "ult", label: "Último scan", v: ultimoScanLinha, icon: "schedule" },
            ].map((c) => (
              <Stack key={c.k} direction="row" spacing={1.2} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    bgcolor: "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#334155" }} aria-hidden>
                    {c.icon}
                  </span>
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {c.label}
                  </Typography>
                  <Typography fontWeight={800} sx={{ wordBreak: "break-word", fontSize: c.k === "ult" ? "0.9rem" : "1rem" }}>
                    {typeof c.v === "number" ? c.v : c.v || "—"}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Box>

          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={loading ? "Em execução" : estadoResumo === "erro" ? "Erro" : scanInfo ? "Concluído" : "Aguardando scan"}
              color={loading ? "warning" : estadoResumo === "erro" ? "error" : scanInfo ? "success" : "default"}
              variant={scanInfo || loading ? "filled" : "outlined"}
            />
            <Button size="small" variant="text" onClick={() => setLogExpanded((x) => !x)}>
              {logExpanded ? "Ocultar log" : "Ver log"}
            </Button>
          </Stack>

          <Collapse in={logExpanded}>
            <Divider sx={{ my: 1.5 }} />
            {scanInfo ? (
              <Typography
                component="pre"
                sx={{
                  m: 0,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: "#0f172a",
                  color: "#e2e8f0",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  fontFamily: '"JetBrains Mono", "Consolas", monospace',
                  fontSize: 11,
                  maxHeight: 220,
                  overflow: "auto",
                }}
              >
                {scanInfo}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Ainda não há log de execução.
              </Typography>
            )}
          </Collapse>
        </Paper>
      </Stack>

      {/* Tabela + detalhes */}
      <Stack direction={{ xs: "column", lg: "row" }} spacing={2} sx={{ alignItems: "stretch" }}>
        <Paper sx={{ ...CARD_SX, p: { xs: 1.25, md: 2 }, flex: { lg: 2 }, minWidth: 0, overflow: "hidden" }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
            <Typography fontWeight={800} fontSize={17}>
              Dispositivos encontrados
            </Typography>
            <Chip label={`${listaFiltrada.length} ${listaFiltrada.length === 1 ? "item" : "itens"}`} size="small" variant="outlined" />
          </Stack>

          <Tabs
            value={tabLista}
            onChange={(_, v) => setTabLista(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 2,
              minHeight: 40,
              "& .MuiTab-root": { minHeight: 40, py: 0.5, textTransform: "none", fontWeight: 600, fontSize: 13 },
            }}
          >
            <Tab value="todos" label={`Todos (${contagens.totalAtivos})`} />
            <Tab value="por_scan" label={`Via scan (${contagens.totalDescobertosScan})`} />
            <Tab value="manual" label={`Registo manual (${contagens.totalRegistosManual})`} />
            <Tab value="sem_dados" label={`Sem dados (${contagens.semInfo})`} />
            <Tab value="inativos" label={`Inativos (${contagens.inativos})`} />
          </Tabs>

          <Collapse in={filtrosOpen}>
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, bgcolor: "#f8fafc" }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1 }}>
                Pesquisar na lista (filtro rápido)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Corre na lista já carregada. Usa Limpar para repor texto e volta a sincronizar com o servidor quando precisares.
              </Typography>
            </Paper>
          </Collapse>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 2 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Pesquisar dispositivo..."
              value={ativoPesquisa}
              onChange={(e) => setAtivoPesquisa(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onPesquisar?.()}
              InputProps={{
                startAdornment: (
                  <span className="material-symbols-outlined" style={{ marginRight: 8, fontSize: 20, color: "#94a3b8" }} aria-hidden>
                    search
                  </span>
                ),
              }}
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ justifyContent: { xs: "stretch", sm: "flex-end" } }}>
              <Button variant="outlined" size="small" onClick={() => setFiltrosOpen((x) => !x)}>
                Filtros
              </Button>
              <Button variant="contained" size="small" onClick={() => onPesquisar?.()} disabled={loading}>
                Pesquisar
              </Button>
              <Button variant="outlined" size="small" onClick={() => onRecarregarLista?.()} disabled={loading}>
                Limpar
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>
                    upload_file
                  </span>
                }
                disabled={!listaFiltrada.length}
                onClick={() => exportCsvRows(listaFiltrada)}
              >
                Exportar
              </Button>
            </Stack>
          </Stack>

          <TableContainer sx={{ borderRadius: 2, border: "1px solid #e2e8f0", maxHeight: { xs: 480, lg: "min(560px, 55vh)" } }}>
            <Table size="small" stickyHeader sx={{ "& .MuiTableCell-root": { fontSize: 13 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Dispositivo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>IP</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>MAC</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Origem</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                        A carregar…
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : listaFiltrada.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                        Sem dispositivos para mostrar nesta vista.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  listaFiltrada.map((a, idx) => {
                    const id = linhaScanKey(a, idx);
                    const selected = selectedRowKey === id;
                    return (
                      <TableRow
                        key={id}
                        hover
                        selected={selected}
                        onClick={() => {
                          setSelectedAtivo(a);
                          setSelectedRowKey(id);
                        }}
                        sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
                      >
                        <TableCell sx={{ verticalAlign: "middle" }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#64748b" }}>
                              computer
                            </span>
                            <Typography fontWeight={600}>{a.nome || a.hostname || "—"}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8125rem" }}>{a.ip || "—"}</TableCell>
                        <TableCell sx={{ fontFamily: "monospace", fontSize: "0.8125rem" }}>{a.mac_address || "—"}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={etiquetaOrigem(a)}
                            color={origemDispositivo(a) === "scan" ? "info" : "primary"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={a.estado || "—"} color={estadoChipColor(a.estado)} />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ ...CARD_SX, p: 2.5, flex: { lg: 1 }, minWidth: { lg: 260 }, alignSelf: { lg: "flex-start" } }}>
          {!selectedAtivo ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              Seleciona um dispositivo na lista para ver detalhes.
            </Typography>
          ) : (
            <>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1} sx={{ mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#334155" }} aria-hidden>
                    computer
                  </span>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={800} fontSize={16} sx={{ wordBreak: "break-word" }}>
                      {selectedAtivo.nome || selectedAtivo.hostname || "Dispositivo"}
                    </Typography>
                  </Box>
                </Stack>
                <Chip size="small" label={selectedAtivo.estado || "—"} color={estadoChipColor(selectedAtivo.estado)} />
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.25}>
                {[
                  ["IP", selectedAtivo.ip || "—"],
                  ["MAC", selectedAtivo.mac_address || "—"],
                  ["Origem", etiquetaOrigem(selectedAtivo)],
                  ["Hostname", selectedAtivo.hostname || "—"],
                  ["SO", selectedAtivo.sistema_operativo || "—"],
                  ["Série", selectedAtivo.numero_serie || "—"],
                  ["Marca", selectedAtivo.marca || "—"],
                  ["Modelo", selectedAtivo.modelo || "—"],
                  ["Estado", selectedAtivo.estado || "—"],
                  ["Inventário", nomeInventario],
                ].map(([label, val]) => (
                  <Stack key={label} direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, width: 90 }}>
                      {label}
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: "right", wordBreak: "break-word", minWidth: 0 }}>
                      {val}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                sx={{ mt: 2 }}
                startIcon={
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden>
                    history
                  </span>
                }
              >
                Ver histórico
              </Button>
            </>
          )}
        </Paper>
      </Stack>

      {isAdmin ? (
        <FormModal
          open={modal === "scan"}
          onClose={() => setModal(null)}
          wide
          titleId="modal-scan-rede-title"
          title="Scan de rede"
          subtitle={<>Credenciais de rede (pedidas só ao executar).</>}
          footer={
            <>
              <Button type="button" variant="outlined" onClick={() => setModal(null)}>
                Cancelar
              </Button>
              {scanTab === "criar" ? (
                <Button type="button" onClick={handleCriarInventarioNoScan} disabled={!novoInventario.nome.trim()}>
                  Criar inventário
                </Button>
              ) : (
                <Button type="button" onClick={handleScan} disabled={!scanPodeExecutar}>
                  Executar scan
                </Button>
              )}
            </>
          }
        >
          <Stack spacing={1}>
            <Tabs
              value={scanTab}
              onChange={(_, v) => setScanTab(v)}
              sx={{ "& .MuiTab-root": { fontWeight: 700 }, "& .MuiTabs-indicator": { bgcolor: "primary.main" } }}
            >
              <Tab value="existente" label="Inventário existente" />
              <Tab value="criar" label="Criar inventário" />
            </Tabs>

            {scanTab === "existente" ? (
              <Stack spacing={1}>
                <Alert severity="info" variant="outlined">
                  Indica inventário de rede, intervalo/IP, utilizador de rede e palavra-passe. Escolhe os logs a recolher.
                </Alert>

                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" },
                    alignItems: "start",
                  }}
                >
                  <FormControl fullWidth size="small" sx={{ gridColumn: { md: "1 / -1" } }}>
                    <InputLabel id="scan-inv-label">Inventário para scan</InputLabel>
                    <Select
                      labelId="scan-inv-label"
                      label="Inventário para scan"
                      value={selectedInventarioId || ""}
                      onChange={(e) => setSelectedInventarioId(e.target.value)}
                    >
                      <MenuItem value="">Seleciona inventário</MenuItem>
                      {inventariosSubRede.map((inv) => (
                        <MenuItem key={inv.id} value={String(inv.id)}>
                          {inv.nome}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    label="IP/rede para scan"
                    value={scanRede}
                    onChange={(e) => setScanRede(e.target.value)}
                    placeholder="Ex.: 192.168.1.0/24 ou intervalo"
                    helperText="Formatos: CIDR, IP único ou intervalo definido pela app."
                    size="small"
                    fullWidth
                    sx={{ gridColumn: { md: "1 / -1" } }}
                  />

                  <Paper variant="outlined" sx={{ p: 0.8, borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={700} mb={0.4}>
                      Logs após scan
                    </Typography>
                    <FormControlLabel
                      control={<Checkbox checked={Boolean(scanLogsRdp)} onChange={(e) => setScanLogsRdp?.(e.target.checked)} />}
                      label="RDP"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox checked={Boolean(scanLogsSeguranca)} onChange={(e) => setScanLogsSeguranca?.(e.target.checked)} />
                      }
                      label="Segurança"
                    />
                  </Paper>

                  <Stack spacing={0.9}>
                    <TextField
                      label="Utilizador (rede)"
                      value={scanUser}
                      onChange={(e) => setScanUser(e.target.value)}
                      placeholder="Obrigatório"
                      autoComplete="username"
                      required
                      helperText={!scanUser?.trim() ? "Obrigatório para iniciar scan" : " "}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label="Palavra-passe (rede)"
                      value={scanPass}
                      onChange={(e) => setScanPass(e.target.value)}
                      type="password"
                      placeholder="Obrigatória"
                      autoComplete="current-password"
                      required
                      helperText={!scanPass ? "Obrigatória para iniciar scan" : " "}
                      size="small"
                      fullWidth
                    />
                  </Stack>
                </Box>

                {inventariosSubRede.length === 0 ? (
                  <Typography variant="caption" color="error.main">
                    Não existem inventários do tipo Rede (sub-rede). Cria um na tab ao lado.
                  </Typography>
                ) : null}
                {!selectedInventarioId ? (
                  <Typography variant="caption" color="error.main">
                    Seleciona ou cria um inventário para começar o scan.
                  </Typography>
                ) : null}
                {selectedInventarioId && !inventarioScanValido ? (
                  <Typography variant="caption" color="error.main">
                    O inventário selecionado não é do tipo Rede (sub-rede).
                  </Typography>
                ) : null}
                {selectedInventarioId && (!scanUser?.trim() || !scanPass) ? (
                  <Typography variant="caption" color="warning.main">
                    Preenche as credenciais da rede para executar o scan.
                  </Typography>
                ) : null}
                {!temTipoLogSelecionado ? (
                  <Typography variant="caption" color="warning.main">
                    Seleciona pelo menos um tipo de log (RDP ou Segurança).
                  </Typography>
                ) : null}
              </Stack>
            ) : (
              <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(2,minmax(0,1fr))" } }}>
                <TextField
                  label="Nome do inventário"
                  value={novoInventario.nome}
                  onChange={(e) => setNovoInventario((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex.: Rede Porto Piso 1"
                  required
                  size="small"
                  fullWidth
                  sx={{ gridColumn: { md: "1 / -1" } }}
                />
                <TextField
                  select
                  label="Tipo"
                  value={novoInventario.tipo_inventario}
                  onChange={(e) => setNovoInventario((p) => ({ ...p, tipo_inventario: e.target.value }))}
                  size="small"
                  fullWidth
                >
                  <MenuItem value="sub_rede">Rede (sub-rede)</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                </TextField>
                <TextField
                  label="IP/rede base"
                  value={novoInventario.rede}
                  onChange={(e) => setNovoInventario((p) => ({ ...p, rede: e.target.value }))}
                  placeholder="Ex.: 192.168.1.0/24"
                  size="small"
                  fullWidth
                />
                <TextField
                  label="Descrição"
                  value={novoInventario.descricao}
                  onChange={(e) => setNovoInventario((p) => ({ ...p, descricao: e.target.value }))}
                  placeholder="Opcional"
                  size="small"
                  fullWidth
                  sx={{ gridColumn: { md: "1 / -1" } }}
                />
              </Box>
            )}
          </Stack>
        </FormModal>
      ) : null}
    </Box>
  );
}
