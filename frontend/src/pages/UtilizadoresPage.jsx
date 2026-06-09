/*
 * Utilizadores — listagem e editor modal (perfil e credenciais).
 */

import { useCallback, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
import SectionCard from "../components/SectionCard";
import { perfilNomeExibicao } from "../domain/perfil/index.js";

/** Domínio institucional fixo: o utilizador escreve só a parte local à esquerda. */
const DOMINIO_EMAIL = "@irn.mj.pt";

const campoSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    bgcolor: "#fff",
    transition: "box-shadow 0.15s ease, border-color 0.15s ease",
    "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#94a3b8" },
    "&.Mui-focused": { boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.12)" },
  },
};

const grelhaFormularioSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
  gap: 2,
  columnGap: 2.5,
  rowGap: 2,
};

function TituloSecaoForm({ children }) {
  return (
    <Typography
      variant="overline"
      sx={{
        gridColumn: "1 / -1",
        color: "#64748b",
        fontWeight: 700,
        letterSpacing: "0.08em",
        fontSize: "0.68rem",
        mt: 0.5,
      }}
    >
      {children}
    </Typography>
  );
}

function emailLocalDeCompleto(email) {
  // Extrai so a parte local para o formulario, mesmo que a API ja tenha email completo.
  const valor = String(email || "").trim();
  if (!valor) return "";
  const dominio = DOMINIO_EMAIL.toLowerCase();
  if (valor.toLowerCase().endsWith(dominio)) return valor.slice(0, -DOMINIO_EMAIL.length);
  const arroba = valor.indexOf("@");
  if (arroba > 0) return valor.slice(0, arroba);
  return valor.replace(/@/g, "");
}

function emailCompletoDeLocal(local) {
  const parte = String(local || "")
    .trim()
    .replace(/@/g, "");
  if (!parte) return "";
  return `${parte}${DOMINIO_EMAIL}`;
}

function validarUtilizadorForm(form, modo) {
  // Validacao local basica para evitar round-trips desnecessarios antes de criar/editar.
  if (!String(form.nome || "").trim()) return "Indica o nome completo.";
  if (!String(form.username || "").trim()) return "Indica o nome de utilizador para login.";
  const emailLocal = emailLocalDeCompleto(form.email);
  if (!emailLocal) return `Indica a parte do email antes de ${DOMINIO_EMAIL}.`;
  if (!/^[a-zA-Z0-9._-]+$/.test(emailLocal)) {
    return "O email só pode ter letras, números, pontos, hífens e underscores antes do domínio.";
  }
  if (!form.perfil_id) return "Escolhe um perfil.";
  if (modo === "create" && !String(form.palavra_passe || "").trim()) {
    return "Indica a palavra-passe inicial.";
  }
  return null;
}

/** Nome do perfil na tabela: a lista de utilizadores só traz `perfil_id`; cruza com `perfis`. */
function nomePerfilParaExibir(utilizador, perfis) {
  const direto = utilizador?.perfil_nome;
  if (direto && String(direto).trim()) return perfilNomeExibicao(direto);
  const id = utilizador?.perfil_id;
  if (id == null || id === "") return "—";
  const p = (perfis || []).find((x) => String(x.id) === String(id));
  return p?.nome && String(p.nome).trim() ? perfilNomeExibicao(p.nome) : "—";
}

/** Uma linha à largura do formulário: escreves só a parte local; o domínio fica fixo à direita. */
function LinhaEmailInstitucional({ localPart, onLocalChange }) {
  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        display: "flex",
        alignItems: "stretch",
        width: "100%",
        minWidth: 0,
      }}
    >
      <TextField
        label="Email institucional"
        placeholder="nome.apelido"
        value={localPart}
        onChange={(e) => onLocalChange(e.target.value)}
        autoComplete="email"
        fullWidth
        sx={{
          ...campoSx,
          flex: 1,
          minWidth: 0,
          "& .MuiOutlinedInput-root": {
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          },
        }}
      />
      <Box
        aria-hidden
        sx={{
          display: "flex",
          alignItems: "center",
          alignSelf: "stretch",
          px: { xs: 1.25, sm: 1.75 },
          border: "1px solid rgba(0, 0, 0, 0.23)",
          borderLeft: "none",
          borderTopRightRadius: 8,
          borderBottomRightRadius: 8,
          bgcolor: "#f1f5f9",
          color: "#334155",
          fontWeight: 600,
          fontSize: { xs: "0.8rem", sm: "0.9rem" },
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {DOMINIO_EMAIL}
      </Box>
    </Box>
  );
}

function LinhaConfirmacao({ rotulo, valor }) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 1.5,
        bgcolor: "#fff",
        border: "1px solid #e8eef5",
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.35, fontWeight: 500 }}>
        {rotulo}
      </Typography>
      <Typography variant="body2" fontWeight={600} color="#0f172a" sx={{ wordBreak: "break-word" }}>
        {valor || "—"}
      </Typography>
    </Box>
  );
}

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
  // O fluxo de criacao tem confirmacao separada; edicao e remocao continuam no mesmo modal.
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [formError, setFormError] = useState("");
  const [confirmacao, setConfirmacao] = useState(null);
  const [aGuardar, setAGuardar] = useState(false);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setFormError("");
    onCancel?.();
  }, [onCancel]);

  function openCreate() {
    setEditorMode("create");
    setFormError("");
    setConfirmacao(null);
    onCancel?.();
    setEditorOpen(true);
  }

  function openEdit(u) {
    setEditorMode("edit");
    setFormError("");
    setConfirmacao(null);
    onPick(u);
    setEditorOpen(true);
  }

  function pedirConfirmacaoCriacao() {
    // Normaliza o email antes da confirmacao final para mostrar exatamente o valor que sera gravado.
    const erroValidacao = validarUtilizadorForm(utilizadorForm, "create");
    if (erroValidacao) {
      setFormError(erroValidacao);
      return;
    }

    const emailFinal = emailCompletoDeLocal(emailLocalDeCompleto(utilizadorForm.email));
    setUtilizadorForm((p) => ({ ...p, email: emailFinal }));
    setFormError("");
    setEditorOpen(false);
    setConfirmacao({
      nome: utilizadorForm.nome.trim(),
      username: utilizadorForm.username.trim(),
      email: emailFinal,
      perfil: nomePerfilParaExibir({ perfil_id: utilizadorForm.perfil_id }, perfis),
    });
  }

  function cancelarConfirmacao() {
    setConfirmacao(null);
    setEditorOpen(true);
  }

  async function confirmarCriacao() {
    // A segunda etapa reduz criacoes acidentais de contas com dados sensiveis incorretos.
    if (!confirmacao) return;
    setAGuardar(true);
    setFormError("");
    const ok = Boolean(await onCreate?.({ email: confirmacao.email }));
    setAGuardar(false);
    if (ok) {
      setConfirmacao(null);
      closeEditor();
      return;
    }
    setConfirmacao(null);
    setFormError(
      "Não foi possível criar. Verifica se o email ou o utilizador já existem e tenta outra vez.",
    );
    setEditorOpen(true);
  }

  async function handleSaveEdit() {
    // Reaproveita a mesma normalizacao de email do fluxo de criacao para manter consistencia.
    const erroValidacao = validarUtilizadorForm(utilizadorForm, "edit");
    if (erroValidacao) {
      setFormError(erroValidacao);
      return;
    }

    const emailFinal = emailCompletoDeLocal(emailLocalDeCompleto(utilizadorForm.email));
    setUtilizadorForm((p) => ({ ...p, email: emailFinal }));
    setFormError("");

    const ok = Boolean(await onUpdate?.({ email: emailFinal }));
    if (ok) closeEditor();
    else {
      setFormError(
        "Não foi possível guardar. Verifica se o email ou o utilizador já existem e se todos os campos estão corretos.",
      );
    }
  }

  async function handleDeleteInModal() {
    const ok = Boolean(await onDeleteByForm?.());
    if (ok) closeEditor();
  }

  const emailLocal = emailLocalDeCompleto(utilizadorForm.email);

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
      {confirmacao ? (
        <Paper
          elevation={0}
          role="dialog"
          aria-labelledby="confirmar-utilizador-titulo"
          sx={{
            position: "fixed",
            top: { xs: 72, sm: 80 },
            right: { xs: 12, sm: 24 },
            zIndex: 1400,
            width: { xs: "calc(100% - 24px)", sm: 400 },
            maxWidth: 420,
            p: 0,
            borderRadius: 3,
            border: "1px solid #dbe5f2",
            bgcolor: "#fff",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.18)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.75,
              borderBottom: "1px solid #e8eef5",
              background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: "#fff",
                  border: "1px solid #dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                  person_add
                </span>
              </Box>
              <Box>
                <Typography id="confirmar-utilizador-titulo" variant="subtitle1" fontWeight={700} lineHeight={1.25}>
                  Confirmar dados
                </Typography>
                <Typography variant="body2" color="text.secondary" fontSize={13}>
                  Revê antes de criar a conta
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ p: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.25,
                mb: 2,
              }}
            >
              <LinhaConfirmacao rotulo="Nome completo" valor={confirmacao.nome} />
              <LinhaConfirmacao rotulo="Utilizador (login)" valor={confirmacao.username} />
              <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                <LinhaConfirmacao rotulo="Email" valor={confirmacao.email} />
              </Box>
              <LinhaConfirmacao rotulo="Perfil" valor={confirmacao.perfil} />
              <LinhaConfirmacao rotulo="Palavra-passe" valor="•••••••• (definida no formulário)" />
            </Box>

            <Stack direction="row" spacing={1.25} justifyContent="flex-end">
              <Button
                type="button"
                variant="outlined"
                onClick={cancelarConfirmacao}
                disabled={aGuardar}
                sx={{ borderRadius: 2, px: 2.5, textTransform: "none", fontWeight: 600 }}
              >
                Não, voltar
              </Button>
              <Button
                type="button"
                variant="contained"
                onClick={confirmarCriacao}
                disabled={aGuardar}
                sx={{
                  borderRadius: 2,
                  px: 2.5,
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                }}
              >
                {aGuardar ? "A criar…" : "Sim, criar"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      ) : null}

      {!isAdmin ? (
        <Typography variant="body2" color="text.secondary" mb={1.2}>
          Estás com perfil de utilizador normal: só vês a tua conta. Para gerir todas as contas,
          inicia sessão com um administrador (ex.: utilizador <strong>admin</strong>).
        </Typography>
      ) : null}

      <DataTable
        columns={["Nome", "Utilizador", "Email", "Perfil", "Ações"]}
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
            <TableCell>{nomePerfilParaExibir(u, perfis)}</TableCell>
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
            <Stack direction="row" spacing={1.25} flexWrap="wrap" justifyContent="flex-end" width="100%">
              <Button
                type="button"
                variant="outlined"
                onClick={closeEditor}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
              >
                Cancelar
              </Button>
              {editorMode === "edit" ? (
                <Button
                  type="button"
                  color="error"
                  variant="outlined"
                  onClick={handleDeleteInModal}
                  sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                >
                  Apagar conta
                </Button>
              ) : null}
              <Button
                type="button"
                variant="contained"
                onClick={editorMode === "create" ? pedirConfirmacaoCriacao : handleSaveEdit}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  textTransform: "none",
                  fontWeight: 600,
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
                }}
              >
                {editorMode === "create" ? "Continuar" : "Guardar alterações"}
              </Button>
            </Stack>
          }
        >
          <Box sx={{ pt: 0.5 }}>
            {formError ? (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                {formError}
              </Alert>
            ) : null}

            <Box sx={grelhaFormularioSx}>
              <TituloSecaoForm>Identificação</TituloSecaoForm>
              <TextField
                label="Nome completo"
                placeholder="Ex.: Maria Silva"
                value={utilizadorForm.nome}
                onChange={(e) => setUtilizadorForm((p) => ({ ...p, nome: e.target.value }))}
                autoComplete="name"
                fullWidth
                sx={campoSx}
              />
              <TextField
                label="Utilizador (login)"
                placeholder="Ex.: maria.silva"
                value={utilizadorForm.username}
                onChange={(e) => setUtilizadorForm((p) => ({ ...p, username: e.target.value }))}
                autoComplete="username"
                fullWidth
                sx={campoSx}
              />

              <LinhaEmailInstitucional
                localPart={emailLocal}
                onLocalChange={(texto) =>
                  setUtilizadorForm((p) => ({
                    ...p,
                    email: emailCompletoDeLocal(texto),
                  }))
                }
              />

              <Divider sx={{ gridColumn: "1 / -1", borderColor: "#e8eef5" }} />

              <TituloSecaoForm>Acesso</TituloSecaoForm>
              <TextField
                select
                label="Perfil"
                value={utilizadorForm.perfil_id}
                onChange={(e) => setUtilizadorForm((p) => ({ ...p, perfil_id: e.target.value }))}
                fullWidth
                sx={campoSx}
              >
                <MenuItem value="">Escolhe um perfil…</MenuItem>
                {perfis.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {perfilNomeExibicao(item.nome)}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                type="password"
                label={editorMode === "create" ? "Palavra-passe inicial" : "Nova palavra-passe (opcional)"}
                placeholder={editorMode === "create" ? "Mínimo 1 carácter" : "Vazio = manter a atual"}
                value={utilizadorForm.palavra_passe}
                onChange={(e) => setUtilizadorForm((p) => ({ ...p, palavra_passe: e.target.value }))}
                autoComplete="new-password"
                fullWidth
                sx={campoSx}
              />
            </Box>
          </Box>
        </FormModal>
      ) : null}
    </SectionCard>
  );
}
