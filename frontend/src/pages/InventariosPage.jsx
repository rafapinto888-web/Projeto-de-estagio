/* Comentario geral deste ficheiro: pagina de gestao de inventarios com CRUD. */

import DataTable from "../components/DataTable";
import SectionCard from "../components/SectionCard";

export default function InventariosPage({
  isAdmin,
  inventarioForm,
  setInventarioForm,
  inventarios,
  loading,
  onCreate,
  onUpdate,
  onDelete,
  onSelectInventario,
}) {
  return (
    <SectionCard title="Inventarios" subtitle="Gerir inventarios normais e de sub-rede.">
      {isAdmin && (
        <>
          <div className="grid">
            <input
              placeholder="ID (editar/apagar)"
              value={inventarioForm.id}
              onChange={(e) => setInventarioForm((p) => ({ ...p, id: e.target.value }))}
            />
            <input
              placeholder="Nome"
              value={inventarioForm.nome}
              onChange={(e) => setInventarioForm((p) => ({ ...p, nome: e.target.value }))}
            />
            <select
              value={inventarioForm.tipo_inventario}
              onChange={(e) => setInventarioForm((p) => ({ ...p, tipo_inventario: e.target.value }))}
            >
              <option value="normal">normal</option>
              <option value="sub_rede">sub_rede</option>
            </select>
            <input
              placeholder="IP rede (opcional)"
              value={inventarioForm.ip_rede}
              onChange={(e) => setInventarioForm((p) => ({ ...p, ip_rede: e.target.value }))}
            />
            <input
              placeholder="Descricao"
              value={inventarioForm.descricao}
              onChange={(e) => setInventarioForm((p) => ({ ...p, descricao: e.target.value }))}
            />
          </div>
          <div className="actions">
            <button onClick={onCreate}>Criar</button>
            <button onClick={onUpdate}>Atualizar</button>
            <button className="danger" onClick={onDelete}>
              Apagar
            </button>
          </div>
        </>
      )}

      <DataTable
        columns={["ID", "Nome", "Tipo", "IP Rede", "Descricao", "Acoes"]}
        rows={inventarios}
        loading={loading}
        emptyTitle="Nenhum inventario encontrado"
        emptyDescription="Quando criares inventarios eles vao aparecer aqui."
        renderRow={(inv) => (
          <tr key={inv.id}>
            <td>{inv.id}</td>
            <td>{inv.nome}</td>
            <td>{inv.tipo_inventario}</td>
            <td>{inv.ip_rede || "-"}</td>
            <td>{inv.descricao || "-"}</td>
            <td>
              {isAdmin ? (
                <>
                  <button className="ghost table-btn" onClick={() => onSelectInventario(inv)}>
                    Editar
                  </button>
                  <button className="danger table-btn" onClick={() => onDelete(inv)}>
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

