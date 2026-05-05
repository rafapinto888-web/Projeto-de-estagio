/* Gestão de inventários — criar/editar em modal com grelha horizontal. */

import { useCallback, useState } from "react";

function tipoInventarioLabel(t) {
  if (t === "sub_rede") return "Sub-rede";
  return "Normal";
}
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
import SectionCard from "../components/SectionCard";

export default function InventariosPage({
  isAdmin,
  inventarioForm,
  setInventarioForm,
  inventarios,
  loading,
  onCreate,
  onUpdate,
  onDeleteByForm,
  onDeleteRow,
  onSelectInventario,
  onCancel,
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

  function openEdit(inv) {
    setEditorMode("edit");
    onSelectInventario(inv);
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
      title="Inventários"
      subtitle="Gerir inventários normais e de sub-rede. Usa o editor para criar ou alterar."
      rightAction={
        isAdmin ? (
          <button type="button" className="btn-chip-primary" onClick={openCreate}>
            Novo inventário
          </button>
        ) : null
      }
    >
      <DataTable
        columns={["Nome", "Tipo", "Rede", "Equipamentos", "Descrição", "Ações"]}
        tableClassName="table-shell--responsive"
        rows={inventarios}
        loading={loading}
        emptyTitle="Nenhum inventário encontrado"
        emptyDescription='Cria inventários através de «Novo inventário».'
        renderRow={(inv) => (
          <tr key={inv.id}>
            <td>{inv.nome}</td>
            <td>{tipoInventarioLabel(inv.tipo_inventario)}</td>
            <td>{inv.rede || inv.ip_rede || "—"}</td>
            <td>{(inv.total_computadores ?? 0) + (inv.total_dispositivos_scan ?? 0)}</td>
            <td>{inv.descricao || "—"}</td>
            <td>
              {isAdmin ? (
                <>
                  <button type="button" className="ghost table-btn" onClick={() => openEdit(inv)}>
                    Editar
                  </button>
                  <button type="button" className="danger table-btn" onClick={() => onDeleteRow?.(inv)}>
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
          title={editorMode === "create" ? "Novo inventário" : "Editar inventário"}
          subtitle={
            editorMode === "edit" && inventarioForm?.id ? (
              <>
                A alterar <strong>{inventarioForm.nome || "este inventário"}</strong>
              </>
            ) : (
              <>Define nome, tipo e rede associada.</>
            )
          }
          footer={
            <>
              <button type="button" className="ghost" onClick={closeEditor}>
                Cancelar
              </button>
              {editorMode === "edit" ? (
                <button type="button" className="danger" onClick={handleDeleteInModal}>
                  Apagar inventário
                </button>
              ) : null}
              <button type="button" onClick={handleSave}>
                {editorMode === "create" ? "Criar inventário" : "Guardar alterações"}
              </button>
            </>
          }
        >
          <div className="form-stack form-stack--horizontal">
            <label className="field-label">
              Nome
              <input
                placeholder="Nome do inventário"
                value={inventarioForm.nome}
                onChange={(e) => setInventarioForm((p) => ({ ...p, nome: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Tipo
              <select
                value={inventarioForm.tipo_inventario}
                onChange={(e) => setInventarioForm((p) => ({ ...p, tipo_inventario: e.target.value }))}
              >
                <option value="normal">normal</option>
                <option value="sub_rede">sub_rede</option>
              </select>
            </label>
            <label className="field-label">
              IP da rede (opcional)
              <input
                placeholder="Ex.: 192.168.1.0/24"
                value={inventarioForm.ip_rede}
                onChange={(e) => setInventarioForm((p) => ({ ...p, ip_rede: e.target.value }))}
              />
            </label>
            <label className="field-label field-label--full">
              Descrição
              <input
                placeholder="Notas ou contexto (opcional)"
                value={inventarioForm.descricao}
                onChange={(e) => setInventarioForm((p) => ({ ...p, descricao: e.target.value }))}
              />
            </label>
          </div>
        </FormModal>
      ) : null}
    </SectionCard>
  );
}
