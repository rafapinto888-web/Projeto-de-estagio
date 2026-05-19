/*
 * Logs — consulta por computador ou por inventário (RDP / segurança) com credenciais.
 */

import { useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import FormModal from "../components/FormModal";
import SectionCard from "../components/SectionCard";

export default function LogsPage({
  inventarios = [],
  selectedInventarioId,
  logComputadorParams,
  setLogComputadorParams,
  onLogsComputador,
  logInventarioParams,
  setLogInventarioParams,
  onLogsInventario,
  logsOutput,
  loading,
}) {
  // --- Estado: modais de filtro e credenciais de rede ---

  const [modal, setModal] = useState(null);
  const [pcCampoPesquisa, setPcCampoPesquisa] = useState("nome");
  const [pcValorPesquisa, setPcValorPesquisa] = useState("");
  const [pcTipoLog, setPcTipoLog] = useState(logComputadorParams.tipo_log || "");
  const [tiposLogInventario, setTiposLogInventario] = useState({
    seguranca: true,
    rdp: true,
  });
  const [credenciaisLogs, setCredenciaisLogs] = useState({
    utilizador: "",
    password: "",
  });

  const parsedOutput = useMemo(() => {
    try {
      return logsOutput ? JSON.parse(logsOutput) : null;
    } catch {
      return null;
    }
  }, [logsOutput]);

  const logsTabela = Array.isArray(parsedOutput?.logs) ? parsedOutput.logs : [];

  async function handleComputadorConsultar() {
    const valor = String(pcValorPesquisa || "").trim();
    if (!valor) return;

    const filtros = {
      computador_id: "",
      nome: "",
      numero_serie: "",
      hostname: "",
      tipo_log: pcTipoLog,
    };
    filtros[pcCampoPesquisa] = valor;
    setLogComputadorParams(filtros);

    const ok = Boolean(await onLogsComputador?.(filtros));
    if (ok) setModal(null);
  }

  async function handleInventarioConsultar() {
    const tiposSelecionados = [
      ...(tiposLogInventario.seguranca ? ["seguranca"] : []),
      ...(tiposLogInventario.rdp ? ["rdp"] : []),
    ];
    if (tiposSelecionados.length === 0) return;
    if (!credenciaisLogs.utilizador.trim() || !credenciaisLogs.password) return;
    const ok = Boolean(
      await onLogsInventario?.({
        tiposSelecionados,
        credenciais: credenciaisLogs,
      }),
    );
    if (ok) setModal(null);
  }

  return (
    <SectionCard
      title="Logs"
      subtitle="Consulta de logs de segurança e RDP. Abre um dos editores para definir filtros e executar."
      rightAction={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button type="button" onClick={() => setModal("computador")}>
            Por computador
          </Button>
          <Button type="button" variant="outlined" onClick={() => setModal("inventario")}>
            Por inventário
          </Button>
        </Stack>
      }
    >
      {loading ? (
        <div className="loading-box">A consultar logs…</div>
      ) : logsTabela.length > 0 ? (
        <TableContainer component={Paper} variant="outlined" sx={{ borderColor: "#dbe5f2" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data/hora</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Descrição</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logsTabela.map((item, idx) => (
                <TableRow key={item.id || `${item.data_evento || "sem-data"}-${idx}`}>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {item.data_evento
                      ? new Date(item.data_evento).toLocaleString("pt-PT", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{item.tipo_log || "—"}</TableCell>
                  <TableCell>{item.descricao || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Paper variant="outlined" sx={{ borderColor: "#dbe5f2", bgcolor: "#fff" }}>
          <pre className="logs-output">{logsOutput}</pre>
        </Paper>
      )}

      <FormModal
        open={modal === "computador"}
        onClose={() => setModal(null)}
        wide
        titleId="modal-logs-pc-title"
        title="Logs por computador"
        subtitle={<>Filtra pelo dispositivo e tipo de evento.</>}
        footer={
          <>
            <Button type="button" variant="outlined" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleComputadorConsultar}>
              Consultar
            </Button>
          </>
        }
      >
        <Stack spacing={1.2}>
          <TextField
            select
            label="Procurar por"
            value={pcCampoPesquisa}
            onChange={(e) => setPcCampoPesquisa(e.target.value)}
            size="small"
            fullWidth
          >
            <MenuItem value="nome">Nome do computador</MenuItem>
            <MenuItem value="numero_serie">Número de série</MenuItem>
          </TextField>
          <TextField
            label={pcCampoPesquisa === "numero_serie" ? "Número de série" : "Nome do computador"}
            placeholder={pcCampoPesquisa === "numero_serie" ? "Ex.: SN123456" : "Ex.: desktop-lab-01"}
            value={pcValorPesquisa}
            onChange={(e) => setPcValorPesquisa(e.target.value)}
            size="small"
            fullWidth
            helperText={!String(pcValorPesquisa || "").trim() ? "Preenche este campo para consultar logs." : " "}
          />
          <TextField
            select
            label="Tipo de log"
            value={pcTipoLog}
            onChange={(e) => setPcTipoLog(e.target.value)}
            size="small"
            fullWidth
          >
            <MenuItem value="">Todos os tipos</MenuItem>
            <MenuItem value="seguranca">seguranca</MenuItem>
            <MenuItem value="rdp">rdp</MenuItem>
          </TextField>
        </Stack>
      </FormModal>

      <FormModal
        open={modal === "inventario"}
        onClose={() => setModal(null)}
        wide
        titleId="modal-logs-inv-title"
        title="Logs por inventário"
        subtitle={<>Por omissão usa o inventário selecionado na área Scan, se deixares o campo vazio.</>}
        footer={
          <>
            <Button type="button" variant="outlined" onClick={() => setModal(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleInventarioConsultar}>
              Consultar
            </Button>
          </>
        }
      >
        <Stack spacing={1.2}>
          <TextField
            select
            label="Inventário (opcional)"
            value={logInventarioParams.inventario_id}
            onChange={(e) => setLogInventarioParams((p) => ({ ...p, inventario_id: e.target.value }))}
            size="small"
            fullWidth
            helperText={
              selectedInventarioId
                ? "Se ficares em branco, usa o inventário selecionado na área Scan."
                : "Seleciona um inventário para consultar logs."
            }
          >
            <MenuItem value="">
              {selectedInventarioId
                ? "Usar inventário selecionado na área Scan"
                : "Selecionar inventário..."}
            </MenuItem>
            {inventarios.map((inv) => (
              <MenuItem key={inv.id} value={String(inv.id)}>
                {inv.nome}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Dispositivo (opcional)"
            placeholder="Referência técnica do dispositivo"
            value={logInventarioParams.dispositivo_id}
            onChange={(e) => setLogInventarioParams((p) => ({ ...p, dispositivo_id: e.target.value }))}
            size="small"
            fullWidth
          />
          <Paper variant="outlined" sx={{ p: 1, borderRadius: 2, borderColor: "#dbe5f2", bgcolor: "#f8fbff" }}>
            <Typography fontSize={12} fontWeight={700} mb={0.35}>
              Tipos de log
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tiposLogInventario.seguranca}
                    onChange={(e) =>
                      setTiposLogInventario((p) => ({
                        ...p,
                        seguranca: e.target.checked,
                      }))
                    }
                  />
                }
                label="Segurança"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={tiposLogInventario.rdp}
                    onChange={(e) =>
                      setTiposLogInventario((p) => ({
                        ...p,
                        rdp: e.target.checked,
                      }))
                    }
                  />
                }
                label="RDP"
              />
            </Stack>
            {!tiposLogInventario.seguranca && !tiposLogInventario.rdp ? (
              <Typography variant="caption" color="error.main">
                Seleciona pelo menos um tipo de log.
              </Typography>
            ) : null}
          </Paper>
          <TextField
            label="Credenciais da rede (utilizador)"
            value={credenciaisLogs.utilizador}
            onChange={(e) =>
              setCredenciaisLogs((p) => ({
                ...p,
                utilizador: e.target.value,
              }))
            }
            placeholder="Obrigatório para recolher logs"
            size="small"
            fullWidth
            required
          />
          <TextField
            label="Credenciais da rede (palavra-passe)"
            value={credenciaisLogs.password}
            onChange={(e) =>
              setCredenciaisLogs((p) => ({
                ...p,
                password: e.target.value,
              }))
            }
            type="password"
            placeholder="Obrigatória para recolher logs"
            size="small"
            fullWidth
            required
          />
          {!credenciaisLogs.utilizador.trim() || !credenciaisLogs.password ? (
            <Typography variant="caption" color="warning.main">
              Introduz credenciais da rede para executar a recolha de logs.
            </Typography>
          ) : null}
        </Stack>
      </FormModal>
    </SectionCard>
  );
}
