/*
 * Inventários — listagem e editor modal (tipos normal e sub-rede).
 */

import { useCallback, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { api } from "../api";
import { tipoInventarioLabel } from "../domain/inventario/index.js";
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
  // --- Estado do editor modal ---

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");

  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [detalhesTitulo, setDetalhesTitulo] = useState("");
  const [detalhesLoading, setDetalhesLoading] = useState(false);
  const [detalhesError, setDetalhesError] = useState("");
  const [detalhesPayload, setDetalhesPayload] = useState(null);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    onCancel?.();
  }, [onCancel]);

  const closeDetalhes = useCallback(() => {
    // Limpa o estado do modal para nao reutilizar dados antigos na proxima abertura.
    setDetalhesOpen(false);
    setDetalhesPayload(null);
    setDetalhesError("");
    setDetalhesTitulo("");
    setDetalhesLoading(false);
  }, []);

  async function openDetalhes(inv) {
    // Carrega detalhes sob demanda para manter a listagem leve.
    setDetalhesTitulo(String(inv?.nome || "").trim() || `Inventário #${inv?.id}`);
    setDetalhesOpen(true);
    setDetalhesLoading(true);
    setDetalhesError("");
    setDetalhesPayload(null);
    try {
      const data = await api.inventarios.detalhes(inv.id);
      setDetalhesPayload(data);
    } catch (e) {
      setDetalhesError(e?.message || "Não foi possível carregar os detalhes.");
    } finally {
      setDetalhesLoading(false);
    }
  }

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
    // Fecha o editor apenas quando o create/update confirmar sucesso.
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
    <Box sx={{ width: "100%", alignSelf: "start" }}>
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
      {/* A tabela fica sempre no estado base; detalhes completos abrem num modal separado. */}
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
              <Button type="button" variant="text" size="small" onClick={() => openDetalhes(inv)}>
                Detalhes
              </Button>
              {isAdmin ? (
                <>
                  <Button type="button" variant="text" size="small" onClick={() => openEdit(inv)}>
                    Editar
                  </Button>
                  <Button type="button" color="error" variant="text" size="small" onClick={() => onDeleteRow?.(inv)}>
                    Apagar
                  </Button>
                </>
              ) : null}
            </TableCell>
          </TableRow>
        )}
      />

      <FormModal
        open={detalhesOpen}
        onClose={closeDetalhes}
        wide
        titleId="modal-inventario-detalhes-title"
        title="Detalhes do inventário"
        subtitle={detalhesTitulo}
        footer={
          <Button type="button" variant="contained" onClick={closeDetalhes} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
            Fechar
          </Button>
        }
      >
        <Box sx={{ pt: 0.5 }}>
          {detalhesLoading ? (
            <Stack direction="row" alignItems="center" spacing={1.5} py={2}>
              <CircularProgress size={22} />
              <Typography variant="body2" color="text.secondary">
                A carregar…
              </Typography>
            </Stack>
          ) : null}
          {detalhesError ? (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {detalhesError}
            </Alert>
          ) : null}
          {!detalhesLoading && detalhesPayload ? (
            <Stack spacing={2.5}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 1.25,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography variant="body2">
                  <strong>Tipo:</strong> {tipoInventarioLabel(detalhesPayload.tipo_inventario)}
                </Typography>
                <Typography variant="body2">
                  <strong>Rede:</strong>{" "}
                  {detalhesPayload.tipo_inventario === "sub_rede"
                    ? detalhesPayload.rede || "—"
                    : "—"}
                </Typography>
                <Typography variant="body2" sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                  <strong>Descrição:</strong> {detalhesPayload.descricao?.trim() ? detalhesPayload.descricao : "—"}
                </Typography>
                <Typography variant="body2" sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                  <strong>Totais:</strong> {(detalhesPayload.computadores || []).length} computador(es) registado(s)
                  {" · "}
                  {(detalhesPayload.dispositivos_descobertos || []).length} dispositivo(s) do scan
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1, letterSpacing: "0.04em" }}>
                  Computadores (registo manual)
                </Typography>
                <DataTable
                  columns={["Nome", "Marca / modelo", "Estado", "Localização", "Responsável"]}
                  tableClassName="table-shell--responsive"
                  rows={detalhesPayload.computadores || []}
                  loading={false}
                  emptyTitle="Sem computadores neste inventário"
                  emptyDescription="Os equipamentos registados manualmente aparecem aqui."
                  renderRow={(c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.nome || "—"}</TableCell>
                      <TableCell>
                        {[c.marca, c.modelo].filter(Boolean).join(" ") || "—"}
                      </TableCell>
                      <TableCell>{c.estado || "—"}</TableCell>
                      <TableCell>{c.localizacao?.nome || "—"}</TableCell>
                      <TableCell>{c.utilizador_responsavel?.nome || c.utilizador_responsavel?.username || "—"}</TableCell>
                    </TableRow>
                  )}
                />
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1, letterSpacing: "0.04em" }}>
                  Dispositivos descobertos (scan de rede)
                </Typography>
                <DataTable
                  columns={["IP", "Hostname", "Estado", "MAC", "Marca / modelo", "SO"]}
                  tableClassName="table-shell--responsive"
                  rows={detalhesPayload.dispositivos_descobertos || []}
                  loading={false}
                  emptyTitle="Sem dispositivos de scan"
                  emptyDescription="Após um scan de rede neste inventário, os hosts encontrados aparecem aqui."
                  renderRow={(d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.ip || "—"}</TableCell>
                      <TableCell>{d.hostname || "—"}</TableCell>
                      <TableCell>{d.estado || "—"}</TableCell>
                      <TableCell sx={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{d.mac_address || "—"}</TableCell>
                      <TableCell>
                        {[d.marca, d.modelo].filter(Boolean).join(" ") || "—"}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 280 }} title={d.sistema_operativo || ""}>
                        {d.sistema_operativo?.trim() ? d.sistema_operativo.trim() : "—"}
                      </TableCell>
                    </TableRow>
                  )}
                />
              </Box>
            </Stack>
          ) : null}
        </Box>
      </FormModal>

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
              <Button type="button" variant="outlined" onClick={closeEditor} disabled={loading}>
                Cancelar
              </Button>
              {editorMode === "edit" ? (
                <Button type="button" color="error" variant="outlined" onClick={handleDeleteInModal} disabled={loading}>
                  Apagar inventário
                </Button>
              ) : null}
              <Button type="button" onClick={handleSave} disabled={loading}>
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
                label="IP da rede"
                placeholder="Ex.: 192.168.1.0/24"
                value={inventarioForm.ip_rede}
                onChange={(e) => setInventarioForm((p) => ({ ...p, ip_rede: e.target.value }))}
                required
                helperText={!String(inventarioForm.ip_rede || "").trim() ? "Obrigatório para inventário de rede" : " "}
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
    </Box>
  );
}
