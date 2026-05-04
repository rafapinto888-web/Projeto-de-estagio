/* Scan — lista de ativos por inventário; pesquisa e scan de rede em modais. */

import { useState } from "react";
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
          <button type="button" className="btn-chip-primary" onClick={() => setModal("pesquisa")}>
            Pesquisar na lista
          </button>
          {isAdmin ? (
            <button type="button" className="btn-chip-primary" onClick={() => setModal("scan")}>
              Scan de rede
            </button>
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
                {inv.id} — {inv.nome}
              </option>
            ))}
          </select>
        </label>
      </div>

      {scanInfo ? <p className="section-subtitle">{scanInfo}</p> : null}

      <DataTable
        columns={["Tipo", "Nome/Hostname", "IP", "Série", "Estado", "Marca", "Modelo"]}
        rows={ativos}
        loading={loading}
        emptyTitle="Sem ativos para mostrar"
        emptyDescription="Seleciona um inventário e usa «Pesquisar na lista» ou recarrega a lista completa no modal."
        renderRow={(a, idx) => (
          <tr key={`${a.id || a.ip || idx}`}>
            <td>{a.tipo || (a.numero_serie ? "computador" : "descoberto")}</td>
            <td>{a.nome || a.hostname || "-"}</td>
            <td>{a.ip || "-"}</td>
            <td>{a.numero_serie || "-"}</td>
            <td>{a.estado || "-"}</td>
            <td>{a.marca || "-"}</td>
            <td>{a.modelo || "-"}</td>
          </tr>
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
            <button type="button" className="ghost" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button type="button" className="ghost" onClick={handleRecarregarLista}>
              Recarregar lista
            </button>
            <button type="button" onClick={handlePesquisar}>
              Pesquisar
            </button>
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
              <button type="button" className="ghost" onClick={() => setModal(null)}>
                Cancelar
              </button>
              <button type="button" onClick={handleScan}>
                Executar scan
              </button>
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
