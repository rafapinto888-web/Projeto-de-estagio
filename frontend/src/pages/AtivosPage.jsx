/* Scan — lista de ativos por inventário; pesquisa e scan de rede em modais. */

import { useState } from "react";
import { Button, TableCell, TableRow } from "@mui/material";
import DataTable from "../components/DataTable";
import FormModal from "../components/FormModal";
import SectionCard from "../components/SectionCard";

export default function AtivosPage({
  inventarios,
  selectedInventarioId,
  setSelectedInventarioId,
  ativoPesquisa,
  setAtivoPesquisa,
  onPesquisar,
  onRecarregarLista,
  isAdmin,
  scanRede,
  setScanRede,
  scanUser,
  setScanUser,
  scanPass,
  setScanPass,
  onScan,
  scanInfo,
  ativos,
  loading,
}) {
  const [modal, setModal] = useState(null);

  async function handlePesquisar() {
    const ok = Boolean(await onPesquisar?.());
    if (ok) setModal(null);
  }

  async function handleRecarregarLista() {
    const ok = Boolean(await onRecarregarLista?.());
    if (ok) setModal(null);
  }

  async function handleScan() {
    const ok = Boolean(await onScan?.());
    if (ok) setModal(null);
  }

  return (
    <SectionCard
      title="Scan"
      subtitle="Escolhe o inventário para ver ativos. Pesquisa na lista ou (admin) executa descoberta na rede a partir dos modais."
      rightAction={
        <div className="section-head-actions">
          <Button type="button" onClick={() => setModal("pesquisa")}>
            Pesquisar na lista
          </Button>
          {isAdmin ? (
            <Button type="button" onClick={() => setModal("scan")}>
              Scan de rede
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="form-stack form-stack--horizontal scan-context-bar">
        <label className="field-label field-label--full">
          Inventário ativo
          <select value={selectedInventarioId} onChange={(e) => setSelectedInventarioId(e.target.value)}>
            <option value="">Seleciona inventário</option>
            {inventarios.map((inv) => (
            <option key={inv.id} value={inv.id}>
              {inv.nome}
            </option>
            ))}
          </select>
        </label>
      </div>

      {scanInfo ? <p className="section-subtitle">{scanInfo}</p> : null}

      <DataTable
        columns={["Tipo", "Nome / host", "IP", "MAC", "Série", "Marca", "Modelo", "SO", "Estado"]}
        tableClassName="table-shell--responsive"
        rows={ativos}
        loading={loading}
        emptyTitle="Sem ativos para mostrar"
        emptyDescription="Seleciona um inventário e usa «Pesquisar na lista» ou recarrega a lista completa no modal."
        renderRow={(a, idx) => (
          <TableRow key={`${a.id || a.ip || idx}`}>
            <TableCell>{a.tipo === "computador" ? "Registo" : a.tipo === "dispositivo_descoberto" ? "Scan" : (a.numero_serie ? "Registo" : "Scan")}</TableCell>
            <TableCell>{a.nome || a.hostname || "—"}</TableCell>
            <TableCell sx={{ fontFamily: "monospace" }}>{a.ip || "—"}</TableCell>
            <TableCell sx={{ fontFamily: "monospace" }}>{a.mac_address || "—"}</TableCell>
            <TableCell sx={{ fontFamily: "monospace" }}>{a.numero_serie || "—"}</TableCell>
            <TableCell>{a.marca || "—"}</TableCell>
            <TableCell>{a.modelo || "—"}</TableCell>
            <TableCell>{a.sistema_operativo || "—"}</TableCell>
            <TableCell>{a.estado || "—"}</TableCell>
          </TableRow>
        )}
      />

      <FormModal
        open={modal === "pesquisa"}
        onClose={() => setModal(null)}
        wide
        titleId="modal-scan-pesquisa-title"
        title="Pesquisar na lista"
        subtitle={<>Filtra os ativos do inventário selecionado. «Recarregar lista» limpa o filtro e volta a carregar tudo.</>}
        footer={
          <>
              <Button type="button" variant="outlined" onClick={() => setModal(null)}>
              Cancelar
              </Button>
            <Button type="button" variant="outlined" onClick={handleRecarregarLista}>
              Recarregar lista
            </Button>
            <Button type="button" onClick={handlePesquisar}>
              Pesquisar
            </Button>
          </>
        }
      >
        <div className="form-stack form-stack--horizontal">
          <label className="field-label field-label--full">
            Termo na lista
            <input
              value={ativoPesquisa}
              onChange={(e) => setAtivoPesquisa(e.target.value)}
              placeholder="Nome, IP, série…"
            />
          </label>
        </div>
      </FormModal>

      {isAdmin ? (
        <FormModal
          open={modal === "scan"}
          onClose={() => setModal(null)}
          wide
          titleId="modal-scan-rede-title"
          title="Scan de rede"
          subtitle={<>Credenciais para WMI/descoberta no inventário selecionado. A rede é opcional.</>}
          footer={
            <>
              <Button type="button" variant="outlined" onClick={() => setModal(null)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleScan}>
                Executar scan
              </Button>
            </>
          }
        >
          <div className="form-stack form-stack--horizontal">
            <label className="field-label field-label--full">
              Rede (opcional)
              <input
                value={scanRede}
                onChange={(e) => setScanRede(e.target.value)}
                placeholder="Ex.: 192.168.1.0/24"
              />
            </label>
            <label className="field-label">
              Utilizador de rede
              <input
                value={scanUser}
                onChange={(e) => setScanUser(e.target.value)}
                placeholder="Obrigatório"
                autoComplete="username"
              />
            </label>
            <label className="field-label">
              Palavra-passe
              <input
                value={scanPass}
                onChange={(e) => setScanPass(e.target.value)}
                type="password"
                placeholder="Obrigatória"
                autoComplete="current-password"
              />
            </label>
          </div>
        </FormModal>
      ) : null}
    </SectionCard>
  );
}
