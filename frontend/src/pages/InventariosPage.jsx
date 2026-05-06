/* Gestão de inventários — criar/editar em modal com grelha horizontal. */

import { useCallback, useState } from "react";
import { Button, MenuItem, Stack, TableCell, TableRow, TextField } from "@mui/material";

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
          <Button type="button" variant="outlined" onClick={openCreate}>
            Novo inventário
          </Button>
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
          <TableRow key={inv.id}>
            <TableCell>{inv.nome}</TableCell>
            <TableCell>{tipoInventarioLabel(inv.tipo_inventario)}</TableCell>
            <TableCell>{inv.tipo_inventario === "sub_rede" ? inv.rede || inv.ip_rede || "—" : "—"}</TableCell>
            <TableCell>{(inv.total_computadores ?? 0) + (inv.total_dispositivos_scan ?? 0)}</TableCell>
            <TableCell>{inv.descricao || "—"}</TableCell>
            <TableCell>
              {isAdmin ? (
                <>
                  <Button type="button" variant="text" size="small" onClick={() => openEdit(inv)}>
                    Editar
                  </Button>
                  <Button type="button" color="error" variant="text" size="small" onClick={() => onDeleteRow?.(inv)}>
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
              <Button type="button" variant="outlined" onClick={closeEditor}>
                Cancelar
              </Button>
              {editorMode === "edit" ? (
                <Button type="button" color="error" variant="outlined" onClick={handleDeleteInModal}>
                  Apagar inventário
                </Button>
              ) : null}
              <Button type="button" onClick={handleSave}>
                {editorMode === "create" ? "Criar inventário" : "Guardar alterações"}
              </Button>
            </>
          }
        >
          <Stack spacing={1.2}>
            <TextField
              label="Nome"
              placeholder="Nome do inventário"
              value={inventarioForm.nome}
              onChange={(e) => setInventarioForm((p) => ({ ...p, nome: e.target.value }))}
              size="small"
              fullWidth
            />
            <TextField
              select
              label="Tipo"
              value={inventarioForm.tipo_inventario}
              onChange={(e) =>
                setInventarioForm((p) => ({
                  ...p,
                  tipo_inventario: e.target.value,
                  ip_rede: e.target.value === "sub_rede" ? p.ip_rede : "",
                }))
              }
              size="small"
              fullWidth
            >
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="sub_rede">Rede (sub-rede)</MenuItem>
            </TextField>
            {inventarioForm.tipo_inventario === "sub_rede" ? (
              <TextField
                label="IP da rede (opcional)"
                placeholder="Ex.: 192.168.1.0/24"
                value={inventarioForm.ip_rede}
                onChange={(e) => setInventarioForm((p) => ({ ...p, ip_rede: e.target.value }))}
                size="small"
                fullWidth
              />
            ) : null}
            <TextField
              label="Descrição"
              placeholder="Notas ou contexto (opcional)"
              value={inventarioForm.descricao}
              onChange={(e) => setInventarioForm((p) => ({ ...p, descricao: e.target.value }))}
              size="small"
              fullWidth
            />
          </Stack>
        </FormModal>
      ) : null}
    </SectionCard>
  );
}
