/* CRUD de computadores — editor em modal com grelha horizontal. */

import { useCallback, useState } from "react";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
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

  function openEdit(pc) {
    setEditorMode("edit");
    onPick(pc);
    setEditorOpen(true);
  }

  async function handleCreate() {
    const ok = Boolean(await onCreate?.());
    if (ok) closeEditor();
  }

  async function handleUpdatePut() {
    const ok = Boolean(await onUpdate?.());
    if (ok) closeEditor();
  }

  async function handleUpdatePatch() {
    const ok = Boolean(await onPatch?.());
    if (ok) closeEditor();
  }

  async function handleDeleteInModal() {
    const ok = Boolean(await onDeleteByForm?.());
    if (ok) closeEditor();
  }

  return (
    <SectionCard
      title="Computadores"
      subtitle="Registo e manutenção de equipamentos. Cria ou edita registos no editor."
      rightAction={
        isAdmin ? (
          <button type="button" className="btn-chip-primary" onClick={openCreate}>
            Novo computador
          </button>
        ) : null
      }
    >
      <DataTable
        columns={["Nome", "Série", "Inventário", "Localização", "Responsável", "Ações"]}
        rows={computadores}
        loading={loading}
        emptyTitle="Sem computadores registados"
        emptyDescription='Adiciona um computador com «Novo computador».'
        renderRow={(pc) => (
          <tr key={pc.id}>
            <td>{pc.nome}</td>
            <td>{pc.numero_serie}</td>
            <td>{pc.inventario_nome || pc.inventario_id}</td>
            <td>{pc.localizacao_nome || "-"}</td>
            <td>{pc.utilizador_responsavel_nome || "-"}</td>
            <td>
              {isAdmin ? (
                <>
                  <button type="button" className="ghost table-btn" onClick={() => openEdit(pc)}>
                    Editar
                  </button>
                  <button type="button" className="danger table-btn" onClick={() => onDeleteRow(pc)}>
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
          titleId="modal-computador-title"
          title={editorMode === "create" ? "Novo computador" : "Editar computador"}
          subtitle={
            editorMode === "edit" && computadorForm?.id ? (
              <>
                A alterar <strong>{computadorForm.nome || "este equipamento"}</strong>
              </>
            ) : (
              <>Liga o PC a um inventário e opcionalmente a localização e responsável.</>
            )
          }
          footer={
            <>
              <button type="button" className="ghost" onClick={closeEditor}>
                Cancelar
              </button>
              {editorMode === "edit" ? (
                <>
                  <button type="button" className="danger" onClick={handleDeleteInModal}>
                    Apagar
                  </button>
                  <button type="button" className="ghost" onClick={handleUpdatePatch}>
                    Guardar apenas alterações (PATCH)
                  </button>
                  <button type="button" onClick={handleUpdatePut}>
                    Substituir registo (PUT)
                  </button>
                </>
              ) : (
                <button type="button" onClick={handleCreate}>
                  Criar computador
                </button>
              )}
            </>
          }
        >
          <div className="form-stack form-stack--horizontal">
            <label className="field-label">
              Nome
              <input
                placeholder="Identificação do equipamento"
                value={computadorForm.nome}
                onChange={(e) => setComputadorForm((p) => ({ ...p, nome: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Estado
              <input
                placeholder="ativo, manutenção, …"
                value={computadorForm.estado}
                onChange={(e) => setComputadorForm((p) => ({ ...p, estado: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Marca
              <input
                placeholder="Marca"
                value={computadorForm.marca}
                onChange={(e) => setComputadorForm((p) => ({ ...p, marca: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Modelo
              <input
                placeholder="Modelo"
                value={computadorForm.modelo}
                onChange={(e) => setComputadorForm((p) => ({ ...p, modelo: e.target.value }))}
              />
            </label>
            <label className="field-label field-label--full">
              Número de série
              <input
                placeholder="S/N ou etiqueta"
                value={computadorForm.numero_serie}
                onChange={(e) => setComputadorForm((p) => ({ ...p, numero_serie: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Inventário
              <select
                value={computadorForm.inventario_id}
                onChange={(e) => setComputadorForm((p) => ({ ...p, inventario_id: e.target.value }))}
              >
                <option value="">Escolhe inventário…</option>
                {inventarios.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Localização (opcional)
              <select
                value={computadorForm.localizacao_id}
                onChange={(e) => setComputadorForm((p) => ({ ...p, localizacao_id: e.target.value }))}
              >
                <option value="">—</option>
                {localizacoes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="field-label field-label--full">
              Responsável (opcional)
              <select
                value={computadorForm.utilizador_responsavel_id}
                onChange={(e) => setComputadorForm((p) => ({ ...p, utilizador_responsavel_id: e.target.value }))}
              >
                <option value="">—</option>
                {utilizadores.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </FormModal>
      ) : null}
    </SectionCard>
  );
}
