/* Gestão de utilizadores — criar/editar dentro de modal (componente FormModal). */

import { useCallback, useState } from "react";
import { Button, MenuItem, Stack, TableCell, TableRow, TextField, Typography } from "@mui/material";
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
          <Button type="button" variant="outlined" onClick={openCreate}>
            Novo utilizador
          </Button>
        ) : null
      }
    >
      {!isAdmin ? (
        <Typography variant="body2" color="text.secondary" mb={1.2}>
          Contas só podem ser geridas por um administrador.
        </Typography>
      ) : null}

      <DataTable
        columns={["Nome", "Username", "Email", "Perfil", "Ações"]}
        tableClassName="table-shell--responsive"
        rows={utilizadores}
        loading={loading}
        emptyTitle="Sem utilizadores disponíveis"
        emptyDescription="Um administrador pode registar novas contas através de «Novo utilizador»."
        renderRow={(u) => (
          <TableRow key={u.id}>
            <TableCell>{u.nome}</TableCell>
            <TableCell>{u.username}</TableCell>
            <TableCell>{u.email}</TableCell>
            <TableCell>{u.perfil_nome || u.perfil_id}</TableCell>
            <TableCell>
              {isAdmin ? (
                <>
                  <Button type="button" variant="text" size="small" onClick={() => openEdit(u)}>
                    Editar
                  </Button>
                  <Button type="button" color="error" variant="text" size="small" onClick={() => onDeleteRow(u)}>
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
          titleId="modal-utilizador-title"
          title={editorMode === "create" ? "Novo utilizador" : "Editar utilizador"}
          subtitle={
            editorMode === "edit" && utilizadorForm?.id ? (
              <>
                A alterar{" "}
                <strong>{utilizadorForm.nome || utilizadorForm.username || "esta conta"}</strong>
              </>
            ) : (
              <>Preenche os dados da nova conta.</>
            )
          }
          footer={
            <>
              <Button type="button" variant="outlined" onClick={closeEditor}>
                Cancelar
              </Button>
              {editorMode === "edit" ? (
                <Button type="button" color="error" variant="outlined" onClick={handleDeleteInModal}>
                  Apagar conta
                </Button>
              ) : null}
              <Button type="button" onClick={handleSave}>
                {editorMode === "create" ? "Criar utilizador" : "Guardar alterações"}
              </Button>
            </>
          }
        >
          <Stack spacing={1.2}>
            <TextField
              label="Nome completo"
              placeholder="Nome a apresentar na aplicação"
              value={utilizadorForm.nome}
              onChange={(e) => setUtilizadorForm((p) => ({ ...p, nome: e.target.value }))}
              autoComplete="name"
              size="small"
              fullWidth
            />
            <TextField
              label="Username"
              placeholder="Identificador de login"
              value={utilizadorForm.username}
              onChange={(e) => setUtilizadorForm((p) => ({ ...p, username: e.target.value }))}
              autoComplete="username"
              size="small"
              fullWidth
            />
            <TextField
              type="email"
              label="Email"
              placeholder="nome@empresa.pt"
              value={utilizadorForm.email}
              onChange={(e) => setUtilizadorForm((p) => ({ ...p, email: e.target.value }))}
              autoComplete="email"
              size="small"
              fullWidth
            />
            <TextField
              select
              label="Perfil"
              value={utilizadorForm.perfil_id}
              onChange={(e) => setUtilizadorForm((p) => ({ ...p, perfil_id: e.target.value }))}
              size="small"
              fullWidth
            >
              <MenuItem value="">Escolhe um perfil…</MenuItem>
              {perfis.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.nome}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              type="password"
              label={editorMode === "create" ? "Palavra-passe inicial" : "Nova palavra-passe (opcional)"}
              placeholder={editorMode === "create" ? "Obrigatório na criação" : "Vazio = manter a atual"}
              value={utilizadorForm.palavra_passe}
              onChange={(e) => setUtilizadorForm((p) => ({ ...p, palavra_passe: e.target.value }))}
              autoComplete="new-password"
              size="small"
              fullWidth
            />
          </Stack>
        </FormModal>
      ) : null}
    </SectionCard>
  );
}
