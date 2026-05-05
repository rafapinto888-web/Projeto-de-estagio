/* Perfis — lista em tabela como as outras abas; membros em modal dedicado. */

import { useCallback, useState } from "react";
import { Button, TableCell, TableRow, Typography } from "@mui/material";
import DataTable from "../components/DataTable";
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
  const [membrosModal, setMembrosModal] = useState(null);

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

  const membrosModalLista = membrosModal ? membrosDoPerfil(membrosModal, utilizadores, true) : [];

  return (
    <SectionCard
      title="Perfis"
      subtitle="Cargos e permissões da aplicação. A lista mostra quantas contas estão atribuídas a cada perfil."
      rightAction={
        isAdmin ? (
          <Button type="button" onClick={openCreate}>
            Novo perfil
          </Button>
        ) : null
      }
    >
      {!isAdmin ? (
        <Typography variant="body2" color="text.secondary" mb={1.2}>
          Apenas administradores podem criar, editar ou apagar perfis.
        </Typography>
      ) : null}

      {loading ? (
        <div className="loading-box">A carregar perfis…</div>
      ) : !perfis?.length ? (
        <EmptyState
          title="Ainda não há perfis"
          description="Um administrador pode criar o primeiro cargo (por exemplo Administrador ou Operador) com «Novo perfil»."
        />
      ) : (
        <DataTable
          columns={["Nome do cargo", "Contas", "Ações"]}
          tableClassName="table-shell--responsive"
          rows={perfis}
          loading={false}
          emptyTitle="Ainda não há perfis"
          emptyDescription="Cria um cargo com «Novo perfil»."
          renderRow={(p) => {
            const members = membrosDoPerfil(p, utilizadores, isAdmin);
            const count = members.length;

            return (
              <TableRow key={p.id}>
                <TableCell>
                  <strong className="perfil-table-name">{p.nome}</strong>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      count > 0 ? "perfil-count-pill perfil-count-pill--fill" : "perfil-count-pill"
                    }
                    title={
                      isAdmin
                        ? "Usa «Membros» para ver a lista completa"
                        : "Número de contas com este perfil na base de dados"
                    }
                  >
                    {count}
                  </span>
                </TableCell>
                <TableCell>
                  {isAdmin ? (
                    <>
                      <Button type="button" variant="text" size="small" onClick={() => setMembrosModal(p)}>
                        Membros
                      </Button>
                      <Button type="button" variant="text" size="small" onClick={() => openEdit(p)}>
                        Editar
                      </Button>
                      <Button type="button" color="error" variant="text" size="small" onClick={() => onDeleteRow(p)}>
                        Apagar
                      </Button>
                    </>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            );
          }}
        />
      )}

      <FormModal
        open={Boolean(membrosModal) && isAdmin}
        onClose={() => setMembrosModal(null)}
        titleId="modal-perfil-membros-title"
        title={membrosModal ? `Membros — ${membrosModal.nome}` : "Membros"}
        subtitle={
          membrosModal ? (
            <>
              {membrosModalLista.length === 0
                ? "Sem contas neste perfil neste momento."
                : `${membrosModalLista.length} conta(s) com este perfil.`}
            </>
          ) : null
        }
        footer={
          <Button type="button" onClick={() => setMembrosModal(null)}>
            Fechar
          </Button>
        }
      >
        <div className="perfil-members-scroll">
          {membrosModalLista.length === 0 ? (
            <p className="perfil-muted-line">Nenhum utilizador está associado a este perfil.</p>
          ) : (
            <div className="user-chip-grid">
              {membrosModalLista.map((u) => (
                <div key={u.id} className="user-chip" title={u.email}>
                  <span className="user-chip-name">{u.nome}</span>
                  <span className="user-chip-login">@{u.username}</span>
                  <span className="user-chip-email">{u.email}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormModal>

      {isAdmin ? (
        <FormModal
          open={editorOpen}
          onClose={closeEditor}
          titleId="modal-perfil-title"
          title={editorMode === "create" ? "Novo perfil" : "Editar perfil"}
          subtitle={
            editorMode === "edit" && perfilForm?.id ? (
              <>
                A alterar <strong>{perfilForm.nome || "este perfil"}</strong>
              </>
            ) : (
              <>Nome interno do cargo (ex.: Administrador, Operador).</>
            )
          }
          footer={
            <>
              <Button type="button" variant="outlined" onClick={closeEditor}>
                Cancelar
              </Button>
              {editorMode === "edit" ? (
                <Button type="button" color="error" variant="outlined" onClick={handleDeleteInModal}>
                  Apagar perfil
                </Button>
              ) : null}
              <Button type="button" onClick={handleSave}>
                {editorMode === "create" ? "Criar perfil" : "Guardar alterações"}
              </Button>
            </>
          }
        >
          <div className="form-stack">
            <label className="field-label">
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
