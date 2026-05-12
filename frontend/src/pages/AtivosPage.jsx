/* Scan — lista de ativos por inventário; pesquisa e scan de rede em modais. */

import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  TableCell,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
import SectionCard from "../components/SectionCard";

function tipoAtivoLabel(a) {
  if (a?.tipo === "computador") return "Registo";
  if (a?.tipo === "dispositivo_descoberto") return "Scan";
  return a?.numero_serie ? "Registo" : "Scan";
}

function tipoAtivoChipColor(a) {
  return tipoAtivoLabel(a) === "Scan" ? "info" : "primary";
}

function estadoChipColor(estado) {
  const e = String(estado || "").toLowerCase();
  if (e.includes("ativo") || e.includes("conclu")) return "success";
  if (e.includes("manut") || e.includes("pend")) return "warning";
  if (e.includes("inativ") || e.includes("erro")) return "error";
  return "default";
}

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
  const [novoInventario, setNovoInventario] = useState({
    nome: "",
    tipo_inventario: "sub_rede",
    rede: "",
    descricao: "",
  });

  async function handleScan() {
    if (!selectedInventarioId) {
      return;
    }
    if (!scanUser?.trim() || !scanPass) {
      return;
    }
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

  const totalAtivos = (ativos || []).length;
  const totalRegistos = (ativos || []).filter((a) => tipoAtivoLabel(a) === "Registo").length;
  const totalScan = totalAtivos - totalRegistos;
  const inventariosSubRede = (inventarios || []).filter((inv) => String(inv?.tipo_inventario || "").toLowerCase() === "sub_rede");
  const inventarioScanValido = inventariosSubRede.some((inv) => String(inv.id) === String(selectedInventarioId || ""));
  const temTipoLogSelecionado = Boolean(scanLogsRdp || scanLogsSeguranca);
  const scanPodeExecutar = Boolean(
    inventarioScanValido && scanUser?.trim() && scanPass && temTipoLogSelecionado && scanTab === "existente",
  );

  const cardsResumo = [
    { key: "total", label: "Total de ativos", value: totalAtivos, icon: "devices" },
    { key: "registos", label: "Registos manuais", value: totalRegistos, icon: "computer" },
    { key: "scan", label: "Encontrados por scan", value: totalScan, icon: "radar" },
  ];

  return (
    <SectionCard
      title="Scan"
      subtitle="Seleciona o inventário e executa descoberta de rede com credenciais reais."
      rightAction={
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          useFlexGap
          sx={{ width: { xs: "100%", md: "auto" }, justifyContent: "flex-end" }}
        >
          {isAdmin ? (
            <Button
              type="button"
              variant="outlined"
              onClick={() => {
                setScanUser("");
                setScanPass("");
                setScanLogsRdp?.(true);
                setScanLogsSeguranca?.(true);
                setScanTab("existente");
                setModal("scan");
              }}
              sx={{ minWidth: 170 }}
            >
              Scan de rede
            </Button>
          ) : null}
        </Stack>
      }
    >
      <Stack spacing={1.1}>
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1, md: 1.2 },
            borderRadius: 3,
            borderColor: "#dbe5f2",
            background: "#fff",
          }}
        >
          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.2} alignItems={{ lg: "center" }} useFlexGap>
            <TextField
              select
              label="Inventário ativo"
              value={selectedInventarioId}
              onChange={(e) => setSelectedInventarioId(e.target.value)}
              size="small"
              fullWidth
              sx={{ maxWidth: { lg: 380 } }}
            >
              <MenuItem value="">Seleciona inventário</MenuItem>
              {inventarios.map((inv) => (
                <MenuItem key={inv.id} value={inv.id}>
                  {inv.nome}
                </MenuItem>
              ))}
            </TextField>

            <Typography variant="body2" color="text.secondary" sx={{ px: 0.5 }}>
              O inventário selecionado define onde os dispositivos encontrados serão associados.
            </Typography>
          </Stack>
        </Paper>

        {scanInfo ? (
          <Paper
            variant="outlined"
            sx={{
              p: 1.1,
              borderRadius: 3,
              bgcolor: "#0f172a",
              borderColor: "#1e293b",
              color: "#e2e8f0",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" mb={0.8}>
              <Chip
                size="small"
                label={scanInfo.toLowerCase().includes("erro") ? "Scan com erro" : "Log do scan"}
                color={scanInfo.toLowerCase().includes("erro") ? "error" : "success"}
              />
              {loading ? <Chip size="small" label="Em execução" color="warning" /> : null}
            </Stack>
            <Typography
              component="pre"
              sx={{
                m: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: '"JetBrains Mono", "Cascadia Code", "Consolas", monospace',
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {scanInfo}
            </Typography>
          </Paper>
        ) : null}

        <Box sx={{ display: "grid", gap: 1.1, gridTemplateColumns: { xs: "1fr", sm: "repeat(3,minmax(0,1fr))" } }}>
          {cardsResumo.map((c) => (
            <Paper
              key={c.key}
              variant="outlined"
              sx={{
                p: 1.1,
                borderRadius: 3,
                borderColor: "#dbe5f2",
                backgroundColor: "#fff",
              }}
            >
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Avatar sx={{ width: 32, height: 32, bgcolor: "#eaf2ff", color: "primary.main" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {c.icon}
                  </span>
                </Avatar>
                <Box>
                  <Typography fontSize={11.5} color="text.secondary">
                    {c.label}
                  </Typography>
                  <Typography fontWeight={800} fontSize={22} lineHeight={1.05}>
                    {c.value}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Box>

        <Paper
          variant="outlined"
          sx={{
            p: { xs: 1, md: 1.1 },
            borderRadius: 3,
            borderColor: "#dbe5f2",
            bgcolor: "#fff",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ md: "center" }}>
            <TextField
              label="Filtro dos ativos"
              value={ativoPesquisa}
              onChange={(e) => setAtivoPesquisa(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onPesquisar?.();
              }}
              placeholder="Pesquisar por nome, host, IP, MAC ou série"
              size="small"
              fullWidth
            />
            <Stack direction="row" spacing={0.8} justifyContent="flex-end">
              <Button type="button" variant="contained" onClick={() => onPesquisar?.()} disabled={loading}>
                Pesquisar
              </Button>
              <Button type="button" variant="outlined" onClick={() => onRecarregarLista?.()} disabled={loading}>
                Limpar
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Stack>

      <Paper variant="outlined" sx={{ p: 0.8, borderRadius: 3, borderColor: "#dbe5f2" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} px={0.4} pb={0.5}>
          <Typography variant="h3" fontSize={16}>
            Dispositivos encontrados
          </Typography>
          <Chip size="small" label={`${totalAtivos} itens`} color="primary" variant="outlined" />
        </Stack>
        <DataTable
          columns={["Tipo", "Nome / host", "IP", "MAC", "Série", "Marca", "Modelo", "SO", "Estado"]}
          tableClassName="table-shell--responsive"
          rows={ativos}
          loading={loading}
          emptyTitle="Sem ativos para mostrar"
          emptyDescription="Seleciona um inventário e executa o scan para carregar dispositivos."
          renderRow={(a, idx) => (
            <TableRow key={`${a.id || a.ip || idx}`}>
              <TableCell>
                <Chip size="small" label={tipoAtivoLabel(a)} color={tipoAtivoChipColor(a)} />
              </TableCell>
              <TableCell>{a.nome || a.hostname || "—"}</TableCell>
              <TableCell sx={{ fontFamily: "monospace" }}>{a.ip || "—"}</TableCell>
              <TableCell sx={{ fontFamily: "monospace" }}>{a.mac_address || "—"}</TableCell>
              <TableCell sx={{ fontFamily: "monospace" }}>{a.numero_serie || "—"}</TableCell>
              <TableCell>{a.marca || "—"}</TableCell>
              <TableCell>{a.modelo || "—"}</TableCell>
              <TableCell>{a.sistema_operativo || "—"}</TableCell>
              <TableCell>
                <Chip size="small" label={a.estado || "—"} color={estadoChipColor(a.estado)} />
              </TableCell>
            </TableRow>
          )}
        />
      </Paper>

      {isAdmin ? (
        <FormModal
          open={modal === "scan"}
          onClose={() => setModal(null)}
          wide
          titleId="modal-scan-rede-title"
          title="Scan de rede"
          subtitle={<>Este fluxo usa credenciais de rede (não as credenciais da aplicação).</>}
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
                  Para executar, tens de escolher inventário de rede, indicar utilizador de rede e password de rede.
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
                    placeholder="Ex.: 192.168.1.0/24 ou 192.168.1.1-192.168.1.254"
                    helperText="Formatos aceites: CIDR, IP único ou intervalo /24 completo."
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
                        <Checkbox
                          checked={Boolean(scanLogsSeguranca)}
                          onChange={(e) => setScanLogsSeguranca?.(e.target.checked)}
                        />
                      }
                      label="Segurança"
                    />
                  </Paper>

                  <Stack spacing={0.9}>
                    <TextField
                      label="Credenciais (utilizador)"
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
                      label="Credenciais (palavra-passe)"
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
                    Introduz as credenciais da rede para executar o scan.
                  </Typography>
                ) : null}
                {selectedInventarioId && !temTipoLogSelecionado ? (
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
    </SectionCard>
  );
}
