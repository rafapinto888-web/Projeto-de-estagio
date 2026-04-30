/* Comentario geral deste ficheiro: pagina de CRUD de computadores. */

import DataTable from "../components/DataTable";
import SectionCard from "../components/SectionCard";

export default function ComputadoresPage({
  isAdmin,
  computadorForm,
  setComputadorForm,
  inventarios,
  localizacoes,
  utilizadores,
  onCreate,
  onUpdate,
  onPatch,
  onDeleteByForm,
  onCancel,
  computadores,
  loading,
  onPick,
  onDeleteRow,
}) {
  return (
    <SectionCard title="Computadores" subtitle="Registo e manutencao de equipamentos.">
      {isAdmin && (
        <>
          <div className="grid">
            <input
              placeholder="ID (editar/apagar)"
              value={computadorForm.id}
              onChange={(e) => setComputadorForm((p) => ({ ...p, id: e.target.value }))}
            />
            <input
              placeholder="Nome"
              value={computadorForm.nome}
              onChange={(e) => setComputadorForm((p) => ({ ...p, nome: e.target.value }))}
            />
            <input
              placeholder="Marca"
              value={computadorForm.marca}
              onChange={(e) => setComputadorForm((p) => ({ ...p, marca: e.target.value }))}
            />
            <input
              placeholder="Modelo"
              value={computadorForm.modelo}
              onChange={(e) => setComputadorForm((p) => ({ ...p, modelo: e.target.value }))}
            />
            <input
              placeholder="Numero de serie"
              value={computadorForm.numero_serie}
              onChange={(e) => setComputadorForm((p) => ({ ...p, numero_serie: e.target.value }))}
            />
            <input
              placeholder="Estado"
              value={computadorForm.estado}
              onChange={(e) => setComputadorForm((p) => ({ ...p, estado: e.target.value }))}
            />
            <select
              value={computadorForm.inventario_id}
              onChange={(e) => setComputadorForm((p) => ({ ...p, inventario_id: e.target.value }))}
            >
              <option value="">Inventario</option>
              {inventarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
            <select
              value={computadorForm.localizacao_id}
              onChange={(e) => setComputadorForm((p) => ({ ...p, localizacao_id: e.target.value }))}
            >
              <option value="">Localizacao (opcional)</option>
              {localizacoes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
            <select
              value={computadorForm.utilizador_responsavel_id}
              onChange={(e) =>
                setComputadorForm((p) => ({ ...p, utilizador_responsavel_id: e.target.value }))
              }
            >
              <option value="">Responsavel (opcional)</option>
              {utilizadores.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="actions">
            <button onClick={onCreate}>Criar</button>
            <button onClick={onUpdate}>Atualizar (PUT)</button>
            <button onClick={onPatch}>Atualizar (PATCH)</button>
            <button className="danger" onClick={onDeleteByForm}>
              Apagar
            </button>
            <button className="ghost" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </>
      )}

      <DataTable
        columns={["ID", "Nome", "Serie", "Inventario", "Localizacao", "Responsavel", "Acoes"]}
        rows={computadores}
        loading={loading}
        emptyTitle="Sem computadores registados"
        emptyDescription="Cria um computador para iniciar o inventario de ativos."
        renderRow={(pc) => (
          <tr key={pc.id}>
            <td>{pc.id}</td>
            <td>{pc.nome}</td>
            <td>{pc.numero_serie}</td>
            <td>{pc.inventario_nome || pc.inventario_id}</td>
            <td>{pc.localizacao_nome || "-"}</td>
            <td>{pc.utilizador_responsavel_nome || "-"}</td>
            <td>
              {isAdmin ? (
                <>
                  <button className="ghost table-btn" onClick={() => onPick(pc)}>
                    Editar
                  </button>
                  <button className="danger table-btn" onClick={() => onDeleteRow(pc)}>
                    Apagar
                  </button>
                </>
              ) : (
                "-"
              )}
            </td>
          </tr>
        )}
      />
    </SectionCard>
  );
}

