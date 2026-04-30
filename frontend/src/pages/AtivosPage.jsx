/* Comentario geral deste ficheiro: pagina de ativos e scan de rede por inventario. */

import DataTable from "../components/DataTable";
import SectionCard from "../components/SectionCard";

export default function AtivosPage({
  inventarios,
  selectedInventarioId,
  setSelectedInventarioId,
  ativoPesquisa,
  setAtivoPesquisa,
  onPesquisar,
  onRecarregar,
  isAdmin,
  scanRede,
  setScanRede,
  scanUser,
  setScanUser,
  scanPass,
  setScanPass,
  onScan,
  scanInfo,
  ativos,
  loading,
}) {
  return (
    <SectionCard title="Ativos + Scan" subtitle="Pesquisa de ativos e descoberta de rede.">
      <div className="grid grid-inline">
        <select value={selectedInventarioId} onChange={(e) => setSelectedInventarioId(e.target.value)}>
          <option value="">Seleciona inventario</option>
          {inventarios.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.id} - {inv.nome}
            </option>
          ))}
        </select>
        <input
          value={ativoPesquisa}
          onChange={(e) => setAtivoPesquisa(e.target.value)}
          placeholder="Pesquisar no inventario"
        />
        <button onClick={onPesquisar}>Pesquisar</button>
        <button className="ghost" onClick={onRecarregar}>
          Recarregar
        </button>
      </div>

      {isAdmin && (
        <div className="grid grid-inline">
          <input value={scanRede} onChange={(e) => setScanRede(e.target.value)} placeholder="Rede para scan (opcional)" />
          <input
            value={scanUser}
            onChange={(e) => setScanUser(e.target.value)}
            placeholder="Utilizador de rede (obrigatorio)"
          />
          <input
            value={scanPass}
            onChange={(e) => setScanPass(e.target.value)}
            type="password"
            placeholder="Password de rede (obrigatoria)"
          />
          <button onClick={onScan}>Executar Scan</button>
        </div>
      )}

      <p className="section-subtitle">{scanInfo}</p>

      <DataTable
        columns={["Tipo", "Nome/Hostname", "IP", "Serie", "Estado", "Marca", "Modelo"]}
        rows={ativos}
        loading={loading}
        emptyTitle="Sem ativos para mostrar"
        emptyDescription="Seleciona um inventario e executa pesquisa ou scan."
        renderRow={(a, idx) => (
          <tr key={`${a.id || a.ip || idx}`}>
            <td>{a.tipo || (a.numero_serie ? "computador" : "descoberto")}</td>
            <td>{a.nome || a.hostname || "-"}</td>
            <td>{a.ip || "-"}</td>
            <td>{a.numero_serie || "-"}</td>
            <td>{a.estado || "-"}</td>
            <td>{a.marca || "-"}</td>
            <td>{a.modelo || "-"}</td>
          </tr>
        )}
      />
    </SectionCard>
  );
}

