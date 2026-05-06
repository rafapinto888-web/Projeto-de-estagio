/* Consulta de logs — filtros em modais horizontais; resultado mantém-se na página. */

import { useState } from "react";
import { Button, MenuItem, Paper, Stack, TextField } from "@mui/material";
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
  const [modal, setModal] = useState(null);

  async function handleComputadorConsultar() {
    const ok = Boolean(await onLogsComputador?.());
    if (ok) setModal(null);
  }

  async function handleInventarioConsultar() {
    const ok = Boolean(await onLogsInventario?.());
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
            label="Referência do PC (opcional)"
            placeholder="Só se souberes o valor técnico do sistema"
            value={logComputadorParams.computador_id}
            onChange={(e) => setLogComputadorParams((p) => ({ ...p, computador_id: e.target.value }))}
            size="small"
            fullWidth
          />
          <TextField
            label="Nome"
            placeholder="nome"
            value={logComputadorParams.nome}
            onChange={(e) => setLogComputadorParams((p) => ({ ...p, nome: e.target.value }))}
            size="small"
            fullWidth
          />
          <TextField
            label="N.º série"
            placeholder="numero_serie"
            value={logComputadorParams.numero_serie}
            onChange={(e) => setLogComputadorParams((p) => ({ ...p, numero_serie: e.target.value }))}
            size="small"
            fullWidth
          />
          <TextField
            label="Hostname"
            placeholder="hostname"
            value={logComputadorParams.hostname}
            onChange={(e) => setLogComputadorParams((p) => ({ ...p, hostname: e.target.value }))}
            size="small"
            fullWidth
          />
          <TextField
            select
            label="Tipo de log"
            value={logComputadorParams.tipo_log}
            onChange={(e) => setLogComputadorParams((p) => ({ ...p, tipo_log: e.target.value }))}
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
          <TextField
            select
            label="Tipo de log"
            value={logInventarioParams.tipo_log}
            onChange={(e) => setLogInventarioParams((p) => ({ ...p, tipo_log: e.target.value }))}
            size="small"
            fullWidth
          >
            <MenuItem value="">Todos os tipos</MenuItem>
            <MenuItem value="seguranca">seguranca</MenuItem>
            <MenuItem value="rdp">rdp</MenuItem>
          </TextField>
          <TextField
            select
            label="Recolher agora"
            value={logInventarioParams.coletar_agora}
            onChange={(e) => setLogInventarioParams((p) => ({ ...p, coletar_agora: e.target.value }))}
            size="small"
            fullWidth
          >
            <MenuItem value="false">coletar_agora=false</MenuItem>
            <MenuItem value="true">coletar_agora=true</MenuItem>
          </TextField>
        </Stack>
      </FormModal>
    </SectionCard>
  );
}
