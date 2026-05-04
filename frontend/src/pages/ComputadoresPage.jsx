/* CRUD de computadores + vista agregada com equipamentos descobertos por inventário (scan). */

import { useCallback, useMemo, useState } from "react";
import { api } from "../api";
import FormModal from "../components/FormModal";
import SectionCard from "../components/SectionCard";

function tipoInvLabel(t) {
  if (t === "sub_rede") return "Sub-rede";
  return "Normal";
}

function dash(v) {
  if (v == null || v === "") return "—";
  const s = String(v).trim();
  return s || "—";
}

function labelAtivo(a) {
  if (a.tipo === "computador") return a.nome || a.hostname || "—";
  return a.hostname || a.ip || `Scan #${a.id}`;
}

function sortByIdentificacao(list) {
  return [...(list || [])].sort((a, b) =>
    labelAtivo(a).localeCompare(labelAtivo(b), "pt", { sensitivity: "base" }),
  );
}

function fmtUltimaSinc(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function emptyScanForm() {
  return {
    id: "",
    inventario_id: "",
    ip: "",
    hostname: "",
    mac_address: "",
    marca: "",
    modelo: "",
    numero_serie: "",
    sistema_operativo: "",
    estado: "ativo",
  };
}

function payloadScanDispositivo(form) {
  return {
    ip: form.ip.trim(),
    estado: (form.estado && form.estado.trim()) || "ativo",
    hostname: form.hostname?.trim() || null,
    mac_address: form.mac_address?.trim() || null,
    marca: form.marca?.trim() || null,
    modelo: form.modelo?.trim() || null,
    numero_serie: form.numero_serie?.trim() || null,
    sistema_operativo: form.sistema_operativo?.trim() || null,
  };
}

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
  ativosPorInventario,
  loading,
  onPick,
  onDeleteRow,
  token,
  withPanelAction,
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("create");
  const [scanEditorOpen, setScanEditorOpen] = useState(false);
  const [scanForm, setScanForm] = useState(emptyScanForm);

  /** Inventários com mais equipamentos primeiro; depois nome A–Z. */
  const gruposOrdenados = useMemo(() => {
    const raw = ativosPorInventario || [];
    return [...raw].sort((gA, gB) => {
      const tA = (gA.ativos || []).length;
      const tB = (gB.ativos || []).length;
      if (tA !== tB) return tB - tA;
      return String(gA.inventario_nome || "").localeCompare(String(gB.inventario_nome || ""), "pt", {
        sensitivity: "base",
      });
    });
  }, [ativosPorInventario]);

  const totaisGlobais = useMemo(() => {
    let registos = 0;
    let scan = 0;
    let inventariosComDados = 0;
    for (const g of gruposOrdenados) {
      const at = g.ativos || [];
      const r = at.filter((x) => x.tipo === "computador").length;
      const s = at.filter((x) => x.tipo === "dispositivo_descoberto").length;
      registos += r;
      scan += s;
      if (r + s > 0) inventariosComDados += 1;
    }
    return {
      registos,
      scan,
      inventariosComDados,
      total: registos + scan,
      inventariosVisiveis: gruposOrdenados.length,
    };
  }, [gruposOrdenados]);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    onCancel?.();
  }, [onCancel]);

  function openCreate() {
    setEditorMode("create");
    onCancel?.();
    setEditorOpen(true);
  }

  function openEditDeRegisto(pc) {
    setEditorMode("edit");
    onPick(pc);
    setEditorOpen(true);
  }

  function handleRowEdit(ativo) {
    if (ativo.tipo !== "computador") return;
    const full = (computadores || []).find((c) => c.id === ativo.id);
    openEditDeRegisto(full || ativo);
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

  function openScanEdit(ativo, inventarioId) {
    setScanForm({
      id: String(ativo.id),
      inventario_id: String(inventarioId),
      ip: ativo.ip || "",
      hostname: ativo.hostname || "",
      mac_address: ativo.mac_address || "",
      marca: ativo.marca || "",
      modelo: ativo.modelo || "",
      numero_serie: ativo.numero_serie || "",
      sistema_operativo: ativo.sistema_operativo || "",
      estado: ativo.estado || "ativo",
    });
    setScanEditorOpen(true);
  }

  function closeScanEditor() {
    setScanEditorOpen(false);
    setScanForm(emptyScanForm());
  }

  async function handleScanSave() {
    if (!withPanelAction || !token) return;
    const ok = await withPanelAction(
      () =>
        api.inventarios.atualizarDispositivo(
          Number(scanForm.inventario_id),
          Number(scanForm.id),
          payloadScanDispositivo(scanForm),
          token,
        ),
      "Equipamento do scan atualizado",
    );
    if (ok) closeScanEditor();
  }

  async function handleScanDeleteRow(ativo, inventarioId) {
    if (!withPanelAction || !token) return;
    if (
      !window.confirm(
        `Remover o equipamento descoberto "${labelAtivo(ativo)}" (${ativo.ip || "sem IP"}) deste inventário?`,
      )
    ) {
      return;
    }
    await withPanelAction(
      () => api.inventarios.apagarDispositivo(inventarioId, ativo.id, token),
      "Equipamento do scan removido",
    );
  }

  const temAlgumAtivo = gruposOrdenados.some((g) => (g.ativos || []).length > 0);

  return (
    <SectionCard
      title="Computadores"
      subtitle="Por inventário: registos manuais (nome, rede, MAC, marca, modelo, série, SO…) e descobertos pelo scan com os mesmos tipos de detalhe quando existirem."
      rightAction={
        isAdmin ? (
          <button type="button" className="btn-chip-primary" onClick={openCreate}>
            Novo computador
          </button>
        ) : null
      }
    >
      {loading ? (
        <div className="loading-box">A carregar equipamentos…</div>
      ) : gruposOrdenados.length === 0 ? (
        <div className="empty-state">
          <h3>Sem inventários visíveis</h3>
          <p>Não há inventários associados à tua conta.</p>
        </div>
      ) : (
        <>
          <div className="computadores-resumo-bar" aria-label="Resumo global">
            <div className="computadores-resumo-item">
              <span className="computadores-resumo-value">{totaisGlobais.total}</span>
              <span className="computadores-resumo-label">Equipamentos listados</span>
            </div>
            <div className="computadores-resumo-item">
              <span className="computadores-resumo-value">{totaisGlobais.registos}</span>
              <span className="computadores-resumo-label">Registos manuais</span>
            </div>
            <div className="computadores-resumo-item">
              <span className="computadores-resumo-value">{totaisGlobais.scan}</span>
              <span className="computadores-resumo-label">Descobertos (scan)</span>
            </div>
            <div className="computadores-resumo-item computadores-resumo-item--muted">
              <span className="computadores-resumo-value">
                {totaisGlobais.inventariosComDados}/{totaisGlobais.inventariosVisiveis}
              </span>
              <span className="computadores-resumo-label">Inventários com dados</span>
            </div>
          </div>

          <div className="computadores-por-inv-stack">
            {gruposOrdenados.map((grupo) => {
              const todos = grupo.ativos || [];
              const registos = sortByIdentificacao(todos.filter((a) => a.tipo === "computador"));
              const scans = sortByIdentificacao(
                todos.filter((a) => a.tipo === "dispositivo_descoberto"),
              );
              const nReg = registos.length;
              const nScan = scans.length;
              const nTot = nReg + nScan;

              return (
                <article key={grupo.inventario_id} className="computadores-inv-block">
                  <header className="computadores-inv-head">
                    <div className="computadores-inv-head-main">
                      <h3 className="computadores-inv-title">{grupo.inventario_nome}</h3>
                      <span className="pill badge-info">{tipoInvLabel(grupo.tipo_inventario)}</span>
                    </div>
                    <dl className="computadores-inv-kpis">
                      <div className="computadores-inv-kpi">
                        <dt>Total</dt>
                        <dd>{nTot}</dd>
                      </div>
                      <div className="computadores-inv-kpi">
                        <dt>Manuais</dt>
                        <dd>{nReg}</dd>
                      </div>
                      <div className="computadores-inv-kpi">
                        <dt>Scan</dt>
                        <dd>{nScan}</dd>
                      </div>
                    </dl>
                  </header>

                  {nTot === 0 ? (
                    <p className="cell-muted computadores-inv-empty">Nenhum equipamento neste inventário.</p>
                  ) : (
                    <div className="computadores-inv-sections">
                      <section className="computadores-subsection">
                        <h4 className="computadores-subsection-title">
                          <span className="material-symbols-outlined" aria-hidden>
                            inventory_2
                          </span>
                          Registos manuais
                          <span className="computadores-subsection-count">{nReg}</span>
                        </h4>
                        {nReg === 0 ? (
                          <p className="computadores-subsection-empty">Sem registos manuais neste inventário.</p>
                        ) : (
                          <div className="table-shell computadores-table-wrap computadores-detalhe-table">
                            <table>
                              <thead>
                                <tr>
                                  <th>Nome</th>
                                  <th>Hostname</th>
                                  <th>IP</th>
                                  <th>MAC</th>
                                  <th>Marca</th>
                                  <th>Modelo</th>
                                  <th>N.º série</th>
                                  <th>Sistema</th>
                                  <th>Estado</th>
                                  <th>Localiz.</th>
                                  <th>Resp.</th>
                                  <th className="th-actions">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {registos.map((a) => (
                                  <tr key={`pc-${a.id}`}>
                                    <td>
                                      <span className="cell-title">{dash(a.nome)}</span>
                                    </td>
                                    <td className="cell-mono">{dash(a.hostname)}</td>
                                    <td className="cell-mono">{dash(a.ip)}</td>
                                    <td className="cell-mono">{dash(a.mac_address)}</td>
                                    <td>{dash(a.marca)}</td>
                                    <td>{dash(a.modelo)}</td>
                                    <td className="cell-mono">{dash(a.numero_serie)}</td>
                                    <td>{dash(a.sistema_operativo)}</td>
                                    <td>{dash(a.estado)}</td>
                                    <td>{dash(a.localizacao_nome)}</td>
                                    <td>{dash(a.utilizador_responsavel_nome)}</td>
                                    <td>
                                      {isAdmin ? (
                                        <>
                                          <button
                                            type="button"
                                            className="ghost table-btn"
                                            onClick={() => handleRowEdit(a)}
                                          >
                                            Editar
                                          </button>
                                          <button
                                            type="button"
                                            className="danger table-btn"
                                            onClick={() => onDeleteRow?.(a)}
                                          >
                                            Apagar
                                          </button>
                                        </>
                                      ) : (
                                        <span className="cell-muted">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>

                      <section className="computadores-subsection computadores-subsection--scan">
                        <h4 className="computadores-subsection-title">
                          <span className="material-symbols-outlined" aria-hidden>
                            radar
                          </span>
                          Descobertos pelo scan
                          <span className="computadores-subsection-count">{nScan}</span>
                        </h4>
                        {nScan === 0 ? (
                          <p className="computadores-subsection-empty">
                            Ainda não há equipamentos descobertos por scan neste inventário.
                          </p>
                        ) : (
                          <div className="table-shell computadores-table-wrap computadores-detalhe-table">
                            <table>
                              <thead>
                                <tr>
                                  <th>Identif.</th>
                                  <th>Hostname</th>
                                  <th>IP</th>
                                  <th>MAC</th>
                                  <th>Marca</th>
                                  <th>Modelo</th>
                                  <th>N.º série</th>
                                  <th>Sistema</th>
                                  <th>Estado</th>
                                  <th>Última atividade</th>
                                  <th className="th-actions">Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {scans.map((a) => (
                                  <tr key={`scan-${a.id}`}>
                                    <td>
                                      <span className="cell-title">{labelAtivo(a)}</span>
                                    </td>
                                    <td className="cell-mono">{dash(a.hostname)}</td>
                                    <td className="cell-mono">{dash(a.ip)}</td>
                                    <td className="cell-mono">{dash(a.mac_address)}</td>
                                    <td>{dash(a.marca)}</td>
                                    <td>{dash(a.modelo)}</td>
                                    <td className="cell-mono">{dash(a.numero_serie)}</td>
                                    <td>{dash(a.sistema_operativo)}</td>
                                    <td>{dash(a.estado)}</td>
                                    <td className="cell-muted cell-nowrap">{fmtUltimaSinc(a.ultima_vez_ativo_em)}</td>
                                    <td>
                                      {isAdmin ? (
                                        <>
                                          <button
                                            type="button"
                                            className="ghost table-btn"
                                            onClick={() => openScanEdit(a, grupo.inventario_id)}
                                          >
                                            Editar
                                          </button>
                                          <button
                                            type="button"
                                            className="danger table-btn"
                                            onClick={() => handleScanDeleteRow(a, grupo.inventario_id)}
                                          >
                                            Apagar
                                          </button>
                                        </>
                                      ) : (
                                        <span className="cell-muted">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </section>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}

      {!loading && gruposOrdenados.length > 0 && !temAlgumAtivo ? (
        <p className="section-subtitle computadores-footnote">
          Todos os inventários visíveis estão vazios. Usa a aba Scan para descobrir equipamentos na rede ou cria
          registos manuais.
        </p>
      ) : null}

      {isAdmin ? (
        <>
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
              Hostname (rede)
              <input
                placeholder="Ex.: PC-LAB-03"
                value={computadorForm.hostname}
                onChange={(e) => setComputadorForm((p) => ({ ...p, hostname: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Endereço IP
              <input
                placeholder="Ex.: 192.168.1.10"
                value={computadorForm.endereco_ip}
                onChange={(e) => setComputadorForm((p) => ({ ...p, endereco_ip: e.target.value }))}
              />
            </label>
            <label className="field-label">
              MAC
              <input
                placeholder="Ex.: AA:BB:CC:DD:EE:FF"
                className="input-mono"
                value={computadorForm.mac_address}
                onChange={(e) => setComputadorForm((p) => ({ ...p, mac_address: e.target.value }))}
              />
            </label>
            <label className="field-label field-label--full">
              Sistema operativo
              <input
                placeholder="Ex.: Windows 11 Pro"
                value={computadorForm.sistema_operativo}
                onChange={(e) => setComputadorForm((p) => ({ ...p, sistema_operativo: e.target.value }))}
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
                onChange={(e) =>
                  setComputadorForm((p) => ({ ...p, utilizador_responsavel_id: e.target.value }))
                }
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

        <FormModal
          open={scanEditorOpen}
          onClose={closeScanEditor}
          wide
          titleId="modal-scan-dispositivo-title"
          title="Editar equipamento descoberto (scan)"
          subtitle={
            <>
              Dados detetados na rede neste inventário. O <strong>endereço IP</strong> tem de ser único no
              inventário.
            </>
          }
          footer={
            <>
              <button type="button" className="ghost" onClick={closeScanEditor}>
                Cancelar
              </button>
              <button type="button" onClick={() => void handleScanSave()}>
                Guardar alterações
              </button>
            </>
          }
        >
          <div className="form-stack form-stack--horizontal">
            <label className="field-label">
              Endereço IP *
              <input
                className="input-mono"
                placeholder="192.168.x.x"
                value={scanForm.ip}
                onChange={(e) => setScanForm((p) => ({ ...p, ip: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Estado *
              <input
                placeholder="ativo, inativo…"
                value={scanForm.estado}
                onChange={(e) => setScanForm((p) => ({ ...p, estado: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Hostname
              <input
                value={scanForm.hostname}
                onChange={(e) => setScanForm((p) => ({ ...p, hostname: e.target.value }))}
              />
            </label>
            <label className="field-label">
              MAC
              <input
                className="input-mono"
                placeholder="AA:BB:CC:DD:EE:FF"
                value={scanForm.mac_address}
                onChange={(e) => setScanForm((p) => ({ ...p, mac_address: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Marca
              <input
                value={scanForm.marca}
                onChange={(e) => setScanForm((p) => ({ ...p, marca: e.target.value }))}
              />
            </label>
            <label className="field-label">
              Modelo
              <input
                value={scanForm.modelo}
                onChange={(e) => setScanForm((p) => ({ ...p, modelo: e.target.value }))}
              />
            </label>
            <label className="field-label field-label--full">
              N.º série
              <input
                className="input-mono"
                value={scanForm.numero_serie}
                onChange={(e) => setScanForm((p) => ({ ...p, numero_serie: e.target.value }))}
              />
            </label>
            <label className="field-label field-label--full">
              Sistema operativo
              <input
                value={scanForm.sistema_operativo}
                onChange={(e) => setScanForm((p) => ({ ...p, sistema_operativo: e.target.value }))}
              />
            </label>
          </div>
        </FormModal>
        </>
      ) : null}
    </SectionCard>
  );
}
