/* Comentario geral deste ficheiro: pagina de consulta de logs por filtros. */

import SectionCard from "../components/SectionCard";

export default function LogsPage({
  logComputadorParams,
  setLogComputadorParams,
  onLogsComputador,
  logInventarioParams,
  setLogInventarioParams,
  onLogsInventario,
  logsOutput,
  loading,
}) {
  return (
    <SectionCard title="Logs" subtitle="Consulta de logs de seguranca e RDP.">
      <h3>Computadores</h3>
      <div className="grid">
        <input
          placeholder="computador_id"
          value={logComputadorParams.computador_id}
          onChange={(e) => setLogComputadorParams((p) => ({ ...p, computador_id: e.target.value }))}
        />
        <input
          placeholder="nome"
          value={logComputadorParams.nome}
          onChange={(e) => setLogComputadorParams((p) => ({ ...p, nome: e.target.value }))}
        />
        <input
          placeholder="numero_serie"
          value={logComputadorParams.numero_serie}
          onChange={(e) => setLogComputadorParams((p) => ({ ...p, numero_serie: e.target.value }))}
        />
        <input
          placeholder="hostname"
          value={logComputadorParams.hostname}
          onChange={(e) => setLogComputadorParams((p) => ({ ...p, hostname: e.target.value }))}
        />
        <select
          value={logComputadorParams.tipo_log}
          onChange={(e) => setLogComputadorParams((p) => ({ ...p, tipo_log: e.target.value }))}
        >
          <option value="">tipo_log (todos)</option>
          <option value="seguranca">seguranca</option>
          <option value="rdp">rdp</option>
        </select>
        <button onClick={onLogsComputador}>Buscar logs computadores</button>
      </div>

      <h3>Inventario / Descobertos</h3>
      <div className="grid">
        <input
          placeholder="inventario_id"
          value={logInventarioParams.inventario_id}
          onChange={(e) => setLogInventarioParams((p) => ({ ...p, inventario_id: e.target.value }))}
        />
        <input
          placeholder="dispositivo_id"
          value={logInventarioParams.dispositivo_id}
          onChange={(e) => setLogInventarioParams((p) => ({ ...p, dispositivo_id: e.target.value }))}
        />
        <select
          value={logInventarioParams.tipo_log}
          onChange={(e) => setLogInventarioParams((p) => ({ ...p, tipo_log: e.target.value }))}
        >
          <option value="">tipo_log (todos)</option>
          <option value="seguranca">seguranca</option>
          <option value="rdp">rdp</option>
        </select>
        <select
          value={logInventarioParams.coletar_agora}
          onChange={(e) => setLogInventarioParams((p) => ({ ...p, coletar_agora: e.target.value }))}
        >
          <option value="false">coletar_agora=false</option>
          <option value="true">coletar_agora=true</option>
        </select>
        <button onClick={onLogsInventario}>Buscar logs inventario</button>
      </div>

      {loading ? <div className="loading-box">A consultar logs...</div> : <pre>{logsOutput}</pre>}
    </SectionCard>
  );
}

