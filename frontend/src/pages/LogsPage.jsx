/* Consulta de logs — filtros em modais horizontais; resultado mantém-se na página. */

import { useState } from "react";
import FormModal from "../components/FormModal";
import SectionCard from "../components/SectionCard";

export default function LogsPage({
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
        <div className="section-head-actions">
          <button type="button" className="btn-chip-primary" onClick={() => setModal("computador")}>
            Por computador
          </button>
          <button type="button" className="btn-chip-primary" onClick={() => setModal("inventario")}>
            Por inventário
          </button>
        </div>
      }
    >
      {loading ? <div className="loading-box">A consultar logs…</div> : <pre>{logsOutput}</pre>}

      <FormModal
        open={modal === "computador"}
        onClose={() => setModal(null)}
        wide
        titleId="modal-logs-pc-title"
        title="Logs por computador"
        subtitle={<>Filtra pelo dispositivo e tipo de evento.</>}
        footer={
          <>
            <button type="button" className="ghost" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button type="button" onClick={handleComputadorConsultar}>
              Consultar
            </button>
          </>
        }
      >
        <div className="form-stack form-stack--horizontal">
          <label className="field-label">
            Referência do PC (opcional)
            <input
              placeholder="Só se souberes o valor técnico do sistema"
              value={logComputadorParams.computador_id}
              onChange={(e) => setLogComputadorParams((p) => ({ ...p, computador_id: e.target.value }))}
            />
          </label>
          <label className="field-label">
            Nome
            <input
              placeholder="nome"
              value={logComputadorParams.nome}
              onChange={(e) => setLogComputadorParams((p) => ({ ...p, nome: e.target.value }))}
            />
          </label>
          <label className="field-label">
            N.º série
            <input
              placeholder="numero_serie"
              value={logComputadorParams.numero_serie}
              onChange={(e) => setLogComputadorParams((p) => ({ ...p, numero_serie: e.target.value }))}
            />
          </label>
          <label className="field-label">
            Hostname
            <input
              placeholder="hostname"
              value={logComputadorParams.hostname}
              onChange={(e) => setLogComputadorParams((p) => ({ ...p, hostname: e.target.value }))}
            />
          </label>
          <label className="field-label field-label--full">
            Tipo de log
            <select
              value={logComputadorParams.tipo_log}
              onChange={(e) => setLogComputadorParams((p) => ({ ...p, tipo_log: e.target.value }))}
            >
              <option value="">Todos os tipos</option>
              <option value="seguranca">seguranca</option>
              <option value="rdp">rdp</option>
            </select>
          </label>
        </div>
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
            <button type="button" className="ghost" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button type="button" onClick={handleInventarioConsultar}>
              Consultar
            </button>
          </>
        }
      >
        <div className="form-stack form-stack--horizontal">
          <label className="field-label">
            Inventário (opcional)
            <input
              placeholder={
                selectedInventarioId
                  ? "Vazio = inventário já escolhido na área Scan"
                  : "Referência técnica, se necessário"
              }
              value={logInventarioParams.inventario_id}
              onChange={(e) => setLogInventarioParams((p) => ({ ...p, inventario_id: e.target.value }))}
            />
          </label>
          <label className="field-label">
            Dispositivo (opcional)
            <input
              placeholder="Referência técnica do dispositivo"
              value={logInventarioParams.dispositivo_id}
              onChange={(e) => setLogInventarioParams((p) => ({ ...p, dispositivo_id: e.target.value }))}
            />
          </label>
          <label className="field-label">
            Tipo de log
            <select
              value={logInventarioParams.tipo_log}
              onChange={(e) => setLogInventarioParams((p) => ({ ...p, tipo_log: e.target.value }))}
            >
              <option value="">Todos os tipos</option>
              <option value="seguranca">seguranca</option>
              <option value="rdp">rdp</option>
            </select>
          </label>
          <label className="field-label field-label--full">
            Recolher agora
            <select
              value={logInventarioParams.coletar_agora}
              onChange={(e) => setLogInventarioParams((p) => ({ ...p, coletar_agora: e.target.value }))}
            >
              <option value="false">coletar_agora=false</option>
              <option value="true">coletar_agora=true</option>
            </select>
          </label>
        </div>
      </FormModal>
    </SectionCard>
  );
}
