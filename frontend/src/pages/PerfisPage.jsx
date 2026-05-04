/* Perfis — cartões por cargo; criar/editar em modal horizontal. */

import { useCallback, useState } from "react";
import EmptyState from "../components/EmptyState";
import FormModal from "../components/FormModal";
import SectionCard from "../components/SectionCard";

function membrosDoPerfil(perfil, listaUtilizadores, isAdmin) {
  const id = Number(perfil?.id);
  if (Number.isNaN(id)) return [];

  const fromLista = isAdmin ? (listaUtilizadores || []).filter((u) => Number(u?.perfil_id) === id) : [];

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

  function openEdit(p) {
    setEditorMode("edit");
    onPick(p);
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
      title="Perfis"
      subtitle="Define cargos no sistema. Cada perfil agrupa utilizadores que partilham as mesmas permissões."
      rightAction={
        isAdmin ? (
          <button type="button" className="btn-chip-primary" onClick={openCreate}>
            Novo perfil
          </button>
        ) : null
      }
    >
      {!isAdmin ? (
        <p className="perfil-muted-line">Apenas administradores criam ou editam perfis.</p>
      ) : null}

      {loading ? (
        <div className="loading-box">A carregar perfis…</div>
      ) : !perfis?.length ? (
        <EmptyState
          title="Ainda não há perfis"
          description="Um administrador pode criar o primeiro cargo (por exemplo Administrador ou Operador)."
        />
      ) : (
        <div className="perfil-cards">
          {perfis.map((p) => {
            const members = membrosDoPerfil(p, utilizadores, isAdmin);
            const count = members.length;

            return (
              <article key={p.id} className="perfil-card">
                <header className="perfil-card-head">
                  <div className="perfil-card-heading">
                    <span className="perfil-id-pill">#{p.id}</span>
                    <h3 className="perfil-card-name">{p.nome}</h3>
                  </div>
                  {isAdmin ? (
                    <div className="perfil-card-actions">
                      <button type="button" className="ghost table-btn" onClick={() => openEdit(p)}>
                        Editar
                      </button>
                      <button type="button" className="danger table-btn" onClick={() => onDeleteRow(p)}>
                        Apagar
                      </button>
                    </div>
                  ) : null}
                </header>
                <div className="perfil-card-body">
                  {!isAdmin ? (
                    <p className="perfil-muted-line">Lista de utilizadores deste cargo visível apenas para administradores.</p>
                  ) : count === 0 ? (
                    <p className="perfil-muted-line">Ninguém está associado a este perfil neste momento.</p>
                  ) : (
                    <>
                      <p className="perfil-members-intro">
                        <strong>{count}</strong>
                        {count === 1
                          ? " pessoa usa este cargo — "
                          : " pessoas usam este cargo — "}
                        não reflete sessões ligadas ao site, apenas a atribuição na base de dados.
                      </p>
                      <div className="user-chip-grid" aria-label={`Utilizadores no perfil ${p.nome}`}>
                        {members.map((u) => (
                          <div key={u.id} className="user-chip" title={u.email}>
                            <span className="user-chip-name">{u.nome}</span>
                            <span className="user-chip-login">@{u.username}</span>
                            <span className="user-chip-email">{u.email}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isAdmin ? (
        <FormModal
          open={editorOpen}
          onClose={closeEditor}
          wide
          titleId="modal-perfil-title"
          title={editorMode === "create" ? "Novo perfil" : "Editar perfil"}
          subtitle={
            editorMode === "edit" && perfilForm?.id ? <>ID #{perfilForm.id}</> : <>Nome do cargo como aparece nas permissões (ex.: Administrador).</>
          }
          footer={
            <>
              <button type="button" className="ghost" onClick={closeEditor}>
                Cancelar
              </button>
              {editorMode === "edit" ? (
                <button type="button" className="danger" onClick={handleDeleteInModal}>
                  Apagar perfil
                </button>
              ) : null}
              <button type="button" onClick={handleSave}>
                {editorMode === "create" ? "Criar perfil" : "Guardar alterações"}
              </button>
            </>
          }
        >
          <div className="form-stack form-stack--horizontal">
            <label className="field-label field-label--full">
              Nome do cargo
              <input
                placeholder="Ex.: Administrador, Operador, Leitura"
                value={perfilForm.nome}
                onChange={(e) => setPerfilForm((p) => ({ ...p, nome: e.target.value }))}
              />
            </label>
          </div>
        </FormModal>
      ) : null}
    </SectionCard>
  );
}
