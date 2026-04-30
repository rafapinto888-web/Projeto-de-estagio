/* Comentario geral deste ficheiro: pagina de gestao de utilizadores e perfis. */

import DataTable from "../components/DataTable";
import SectionCard from "../components/SectionCard";

export default function UtilizadoresPage({
  isAdmin,
  utilizadorForm,
  setUtilizadorForm,
  perfis,
  onCreate,
  onUpdate,
  onDeleteByForm,
  onCancel,
  utilizadores,
  loading,
  onPick,
  onDeleteRow,
}) {
  return (
    <SectionCard title="Utilizadores" subtitle="Contas de acesso e respetivos perfis.">
      {isAdmin && (
        <>
          <div className="grid">
            <input
              placeholder="ID (editar/apagar)"
              value={utilizadorForm.id}
              onChange={(e) => setUtilizadorForm((p) => ({ ...p, id: e.target.value }))}
            />
            <input
              placeholder="Nome"
              value={utilizadorForm.nome}
              onChange={(e) => setUtilizadorForm((p) => ({ ...p, nome: e.target.value }))}
            />
            <input
              placeholder="Username"
              value={utilizadorForm.username}
              onChange={(e) => setUtilizadorForm((p) => ({ ...p, username: e.target.value }))}
            />
            <input
              placeholder="Email"
              value={utilizadorForm.email}
              onChange={(e) => setUtilizadorForm((p) => ({ ...p, email: e.target.value }))}
            />
            <select
              value={utilizadorForm.perfil_id}
              onChange={(e) => setUtilizadorForm((p) => ({ ...p, perfil_id: e.target.value }))}
            >
              <option value="">Perfil</option>
              {perfis.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
            <input
              type="password"
              placeholder="Palavra-passe"
              value={utilizadorForm.palavra_passe}
              onChange={(e) => setUtilizadorForm((p) => ({ ...p, palavra_passe: e.target.value }))}
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
        columns={["ID", "Nome", "Username", "Email", "Perfil", "Acoes"]}
        rows={utilizadores}
        loading={loading}
        emptyTitle="Sem utilizadores disponiveis"
        emptyDescription="Cria utilizadores para atribuir responsabilidade nos computadores."
        renderRow={(u) => (
          <tr key={u.id}>
            <td>{u.id}</td>
            <td>{u.nome}</td>
            <td>{u.username}</td>
            <td>{u.email}</td>
            <td>{u.perfil_nome || u.perfil_id}</td>
            <td>
              {isAdmin ? (
                <>
                  <button className="ghost table-btn" onClick={() => onPick(u)}>
                    Editar
                  </button>
                  <button className="danger table-btn" onClick={() => onDeleteRow(u)}>
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

