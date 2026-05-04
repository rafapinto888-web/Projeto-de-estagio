/* Gestão de utilizadores — criar/editar dentro de modal (componente FormModal). */

import { useCallback, useState } from "react";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
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
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    onCancel?.();
  }, [onCancel]);

  function openCreate() {
    setEditorMode("create");
    onCancel?.();
    setEditorOpen(true);
  }

  function openEdit(u) {
    setEditorMode("edit");
    onPick(u);
    setEditorOpen(true);
  }

  async function handleSave() {
    let ok = false;
    if (editorMode === "create") ok = Boolean(await onCreate?.());
    else ok = Boolean(await onUpdate?.());
    if (ok) closeEditor();
  }

  async function handleDeleteInModal() {
    const ok = Boolean(await onDeleteByForm?.());
    if (ok) closeEditor();
  }

  return (
    <SectionCard
      title="Utilizadores"
      subtitle="Contas de acesso e respetivos perfis. Para criar ou alterar dados usa o editor."
      rightAction={
        isAdmin ? (
          <button type="button" className="btn-chip-primary" onClick={openCreate}>
            Novo utilizador
          </button>
        ) : null
      }
    >
      {!isAdmin ? (
        <p className="muted-inline">Contas só podem ser geridas por um administrador.</p>
      ) : null}

      <DataTable
        columns={["ID", "Nome", "Username", "Email", "Perfil", "Ações"]}
        rows={utilizadores}
        loading={loading}
        emptyTitle="Sem utilizadores disponíveis"
        emptyDescription="Um administrador pode registar novas contas através de «Novo utilizador»."
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
                  <button type="button" className="ghost table-btn" onClick={() => openEdit(u)}>
                    Editar
                  </button>
                  <button type="button" className="danger table-btn" onClick={() => onDeleteRow(u)}>
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

      {isAdmin ? (
        <FormModal
          open={editorOpen}
          onClose={closeEditor}
          wide
          titleId="modal-utilizador-title"
          title={editorMode === "create" ? "Novo utilizador" : "Editar utilizador"}
          subtitle={
            editorMode === "edit" && utilizadorForm?.id ? (
              <>ID #{utilizadorForm.id}</>
            ) : (
              <>Preenche os dados da nova conta.</>
            )
          }
          footer={
            <>
              <button type="button" className="ghost" onClick={closeEditor}>
                Cancelar
              </button>
              {editorMode === "edit" ? (
                <button type="button" className="danger" onClick={handleDeleteInModal}>
                  Apagar conta
                </button>
              ) : null}
              <button type="button" onClick={handleSave}>
                {editorMode === "create" ? "Criar utilizador" : "Guardar alterações"}
              </button>
            </>
          }
        >
          <div className="form-stack form-stack--horizontal">
            <label className="field-label">
              Nome completo
              <input
                placeholder="Nome a apresentar na aplicação"
                value={utilizadorForm.nome}
                onChange={(e) => setUtilizadorForm((p) => ({ ...p, nome: e.target.value }))}
                autoComplete="name"
              />
            </label>
            <label className="field-label">
              Username
              <input
                placeholder="Identificador de login"
                value={utilizadorForm.username}
                onChange={(e) => setUtilizadorForm((p) => ({ ...p, username: e.target.value }))}
                autoComplete="username"
              />
            </label>
            <label className="field-label">
              Email
              <input
                type="email"
                placeholder="nome@empresa.pt"
                value={utilizadorForm.email}
                onChange={(e) => setUtilizadorForm((p) => ({ ...p, email: e.target.value }))}
                autoComplete="email"
              />
            </label>
            <label className="field-label">
              Perfil
              <select
                value={utilizadorForm.perfil_id}
                onChange={(e) => setUtilizadorForm((p) => ({ ...p, perfil_id: e.target.value }))}
              >
                <option value="">Escolhe um perfil…</option>
                {perfis.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label field-label--full">
              {editorMode === "create" ? "Palavra-passe inicial" : "Nova palavra-passe (opcional)"}
              <input
                type="password"
                placeholder={editorMode === "create" ? "Obrigatório na criação" : "Vazio = manter a atual"}
                value={utilizadorForm.palavra_passe}
                onChange={(e) => setUtilizadorForm((p) => ({ ...p, palavra_passe: e.target.value }))}
                autoComplete="new-password"
              />
            </label>
          </div>
        </FormModal>
      ) : null}
    </SectionCard>
  );
}
