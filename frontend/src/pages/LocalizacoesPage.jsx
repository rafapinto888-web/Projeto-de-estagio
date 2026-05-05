/* Localizações físicas — CRUD em modal com grelha horizontal. */

import { useCallback, useState } from "react";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
import SectionCard from "../components/SectionCard";

export default function LocalizacoesPage({
  isAdmin,
  localizacaoForm,
  setLocalizacaoForm,
  onCreate,
  onUpdate,
  onDeleteByForm,
  onCancel,
  localizacoes,
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

  function openEdit(l) {
    setEditorMode("edit");
    onPick(l);
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
      title="Localizações"
      subtitle="Salas, racks e outros pontos físicos. Cria ou edita no editor."
      rightAction={
        isAdmin ? (
          <button type="button" className="btn-chip-primary" onClick={openCreate}>
            Nova localização
          </button>
        ) : null
      }
    >
      <DataTable
        columns={["Nome", "Descrição", "Ações"]}
        tableClassName="table-shell--responsive"
        rows={localizacoes}
        loading={loading}
        emptyTitle="Sem localizações"
        emptyDescription='Adiciona pontos físicos com «Nova localização».'
        renderRow={(l) => (
          <tr key={l.id}>
            <td>{l.nome}</td>
            <td>{l.descricao || "-"}</td>
            <td>
              {isAdmin ? (
                <>
                  <button type="button" className="ghost table-btn" onClick={() => openEdit(l)}>
                    Editar
                  </button>
                  <button type="button" className="danger table-btn" onClick={() => onDeleteRow(l)}>
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
          title={editorMode === "create" ? "Nova localização" : "Editar localização"}
          subtitle={
            editorMode === "edit" && localizacaoForm?.id ? (
              <>
                A alterar <strong>{localizacaoForm.nome || "esta localização"}</strong>
              </>
            ) : (
              <>Nome curto e descrição opcional.</>
            )
          }
          footer={
            <>
              <button type="button" className="ghost" onClick={closeEditor}>
                Cancelar
              </button>
              {editorMode === "edit" ? (
                <button type="button" className="danger" onClick={handleDeleteInModal}>
                  Apagar localização
                </button>
              ) : null}
              <button type="button" onClick={handleSave}>
                {editorMode === "create" ? "Criar localização" : "Guardar alterações"}
              </button>
            </>
          }
        >
          <div className="form-stack form-stack--horizontal">
            <label className="field-label">
              Nome
              <input
                placeholder="Ex.: Sala reuniões A2"
                value={localizacaoForm.nome}
                onChange={(e) => setLocalizacaoForm((p) => ({ ...p, nome: e.target.value }))}
              />
            </label>
            <label className="field-label field-label--full">
              Descrição (opcional)
              <input
                placeholder="Piso, edifício, notas…"
                value={localizacaoForm.descricao}
                onChange={(e) => setLocalizacaoForm((p) => ({ ...p, descricao: e.target.value }))}
              />
            </label>
          </div>
        </FormModal>
      ) : null}
    </SectionCard>
  );
}
