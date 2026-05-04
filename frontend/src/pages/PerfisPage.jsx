/* Comentario geral deste ficheiro: pagina CRUD para perfis de utilizador. */

import DataTable from "../components/DataTable";
import SectionCard from "../components/SectionCard";

/** Utilizadores com este perfil: admin usa lista completa do painel; API em fallback. */
function membrosDoPerfil(perfil, listaUtilizadores, isAdmin) {
  const id = Number(perfil?.id);
  if (Number.isNaN(id)) return [];

  const fromLista = isAdmin
    ? (listaUtilizadores || []).filter((u) => Number(u?.perfil_id) === id)
    : [];

  if (fromLista.length > 0) {
    return [...fromLista].sort((a, b) =>
      String(a.nome || a.username || "").localeCompare(String(b.nome || b.username || ""), "pt"),
    );
  }

  const fromApi = Array.isArray(perfil?.utilizadores) ? perfil.utilizadores : [];
  if (fromApi.length > 0) {
    return [...fromApi].sort((a, b) =>
      String(a.nome || a.username || "").localeCompare(String(b.nome || b.username || ""), "pt"),
    );
  }

  return [];
}

export default function PerfisPage({
  isAdmin,
  utilizadores,
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
    <SectionCard
      title="Perfis"
      subtitle="Perfis de permissão (cargo). Administradores vêem quantos utilizadores têm cada perfil e quem são."
    >
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
            <button type="button" onClick={onCreate}>
              Criar
            </button>
            <button type="button" onClick={onUpdate}>
              Atualizar
            </button>
            <button type="button" className="danger" onClick={onDeleteByForm}>
              Apagar
            </button>
            <button type="button" className="ghost" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </>
      )}

      <DataTable
        columns={["ID", "Nome", "Quem tem este perfil", "Acoes"]}
        rows={perfis}
        loading={loading}
        emptyTitle="Sem perfis criados"
        emptyDescription="Cria perfis para organizar permissões no sistema."
        renderRow={(p) => {
          const members = membrosDoPerfil(p, utilizadores, isAdmin);
          const count = members.length;

          return (
            <tr key={p.id}>
              <td>{p.id}</td>
              <td>{p.nome}</td>
              <td className="perfil-users-cell">
                {!isAdmin ? (
                  <span className="cell-muted">Apenas administradores vêem a lista completa por perfil.</span>
                ) : count === 0 ? (
                  <span className="cell-muted">Ninguém com este perfil (0 utilizadores)</span>
                ) : (
                  <>
                    <div className="perfil-user-count">
                      <strong>{count}</strong>{" "}
                      {count === 1 ? "utilizador com este perfil" : "utilizadores com este perfil"}
                    </div>
                    <ul className="perfil-user-list">
                      {members.map((u) => (
                        <li key={u.id}>
                          <span className="perfil-user-nome">{u.nome}</span>
                          <span className="perfil-user-meta">
                            {u.username} · {u.email}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </td>
              <td>
                {isAdmin ? (
                  <>
                    <button type="button" className="ghost table-btn" onClick={() => onPick(p)}>
                      Editar
                    </button>
                    <button type="button" className="danger table-btn" onClick={() => onDeleteRow(p)}>
                      Apagar
                    </button>
                  </>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          );
        }}
      />
    </SectionCard>
  );
}
