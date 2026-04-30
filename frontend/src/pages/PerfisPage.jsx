/* Comentario geral deste ficheiro: pagina CRUD para perfis de utilizador. */

import DataTable from "../components/DataTable";
import SectionCard from "../components/SectionCard";

export default function PerfisPage({
  isAdmin,
  perfilForm,
  setPerfilForm,
  onCreate,
  onUpdate,
  onDeleteByForm,
  onCancel,
  perfis,
  loading,
  onPick,
  onDeleteRow,
}) {
  return (
    <SectionCard title="Perfis" subtitle="Perfis de permissao aplicados aos utilizadores.">
      {isAdmin && (
        <>
          <div className="grid grid-inline">
            <input
              placeholder="ID (editar/apagar)"
              value={perfilForm.id}
              onChange={(e) => setPerfilForm((p) => ({ ...p, id: e.target.value }))}
            />
            <input
              placeholder="Nome do perfil"
              value={perfilForm.nome}
              onChange={(e) => setPerfilForm((p) => ({ ...p, nome: e.target.value }))}
            />
          </div>
          <div className="actions">
            <button onClick={onCreate}>Criar</button>
            <button onClick={onUpdate}>Atualizar</button>
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
        columns={["ID", "Nome", "Acoes"]}
        rows={perfis}
        loading={loading}
        emptyTitle="Sem perfis criados"
        emptyDescription="Cria perfis para organizar permissões no sistema."
        renderRow={(p) => (
          <tr key={p.id}>
            <td>{p.id}</td>
            <td>{p.nome}</td>
            <td>
              {isAdmin ? (
                <>
                  <button className="ghost table-btn" onClick={() => onPick(p)}>
                    Editar
                  </button>
                  <button className="danger table-btn" onClick={() => onDeleteRow(p)}>
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

