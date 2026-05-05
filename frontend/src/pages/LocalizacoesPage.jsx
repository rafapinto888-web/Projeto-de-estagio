/* Localizações físicas — CRUD em modal com grelha horizontal. */

import { useCallback, useState } from "react";
import { Button, TableCell, TableRow } from "@mui/material";
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
          <Button type="button" onClick={openCreate}>
            Nova localização
          </Button>
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
          <TableRow key={l.id}>
            <TableCell>{l.nome}</TableCell>
            <TableCell>{l.descricao || "-"}</TableCell>
            <TableCell>
              {isAdmin ? (
                <>
                  <Button type="button" variant="text" size="small" onClick={() => openEdit(l)}>
                    Editar
                  </Button>
                  <Button type="button" color="error" variant="text" size="small" onClick={() => onDeleteRow(l)}>
                    Apagar
                  </Button>
                </>
              ) : (
                "-"
              )}
            </TableCell>
          </TableRow>
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
              <Button type="button" variant="outlined" onClick={closeEditor}>
                Cancelar
              </Button>
              {editorMode === "edit" ? (
                <Button type="button" color="error" variant="outlined" onClick={handleDeleteInModal}>
                  Apagar localização
                </Button>
              ) : null}
              <Button type="button" onClick={handleSave}>
                {editorMode === "create" ? "Criar localização" : "Guardar alterações"}
              </Button>
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
