/* Pesquisa global - layout aproximado da referencia visual. */

import { useEffect, useMemo, useState } from "react";
import { Button } from "@mui/material";
import SectionCard from "../components/SectionCard";

function tituloSecao(chave) {
  return String(chave || "")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (s) => s.toUpperCase());
}

function parseOutput(raw) {
  if (!raw || !String(raw).trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function toSections(parsed) {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return [{ key: "resultados", value: parsed }];
  if (typeof parsed === "object") return Object.entries(parsed).map(([key, value]) => ({ key, value }));
  return [{ key: "resultado", value: parsed }];
}

function secaoVisual(secao) {
  const key = String(secao || "").toLowerCase();
  if (key.includes("invent")) return { icon: "inventory_2", label: "Inventários" };
  if (key.includes("utiliz") || key.includes("user")) return { icon: "group", label: "Utilizadores" };
  if (key.includes("local")) return { icon: "location_on", label: "Localizações" };
  if (key.includes("comput") || key.includes("ativo") || key.includes("dispositivo")) {
    return { icon: "computer", label: "Ativos encontrados" };
  }
  return { icon: "list_alt", label: tituloSecao(secao) };
}

function valorHumano(v) {
  if (v == null || String(v).trim() === "") return "—";
  return String(v);
}

function normalizarLinha(row) {
  const item = row.item || {};
  const nome = item.nome || item.hostname || item.email || item.descricao || "—";
  const desc = item.descricao || item.sistema_operativo || "";
  const detalhes = [
    item.numero_serie ? `SN: ${item.numero_serie}` : null,
    item.ip || item.endereco_ip ? `IP: ${item.ip || item.endereco_ip}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
  return {
    ...row,
    nome,
    desc,
    detalhes,
    localizacao: item.localizacao_nome || item.localizacao || "",
    utilizador: item.utilizador_nome || item.username || item.email || "",
    estado: item.estado || "",
  };
}

export default function PesquisaPage({
  globalTermo,
  setGlobalTermo,
  onPesquisar,
  globalOutput,
  loading,
  searchRequestId,
}) {
  const [filtroSecao, setFiltroSecao] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroLocalizacao, setFiltroLocalizacao] = useState("todas");
  const [filtroData, setFiltroData] = useState("qualquer");
  const [aba, setAba] = useState("resultados");
  const [ordem, setOrdem] = useState("relevancia");
  const [mostrarRaw, setMostrarRaw] = useState(false);
  const [mostrarAvancados, setMostrarAvancados] = useState(false);
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  const parsed = useMemo(() => parseOutput(globalOutput), [globalOutput]);
  const secoes = useMemo(() => toSections(parsed), [parsed]);

  const rowsBase = useMemo(() => {
    return secoes.flatMap(({ key, value }) => {
      const lista = Array.isArray(value) ? value : [value];
      return lista.map((item, idx) => normalizarLinha({ key: `${key}-${idx}`, secao: key, item }));
    });
  }, [secoes]);

  const opcoesTipo = useMemo(() => secoes.map((s) => s.key), [secoes]);
  const opcoesLocalizacao = useMemo(() => {
    const set = new Set(rowsBase.map((r) => r.localizacao).filter((x) => x && x.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt"));
  }, [rowsBase]);
  const opcoesEstado = useMemo(() => {
    const set = new Set(rowsBase.map((r) => r.estado).filter((x) => x && x.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt"));
  }, [rowsBase]);

  const rowsFiltradas = useMemo(() => {
    const agora = new Date();
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate()).getTime();
    const seteDias = agora.getTime() - 7 * 24 * 60 * 60 * 1000;
    const trintaDias = agora.getTime() - 30 * 24 * 60 * 60 * 1000;

    return rowsBase.filter((r) => {
      if (filtroSecao !== "todas" && r.secao !== filtroSecao) return false;
      if (filtroEstado !== "todos" && r.estado !== filtroEstado) return false;
      if (filtroLocalizacao !== "todas" && r.localizacao !== filtroLocalizacao) return false;
      if (filtroData !== "qualquer") {
        const bruto =
          r.item?.data_registo ||
          r.item?.created_at ||
          r.item?.data_criacao ||
          r.item?.createdAt ||
          r.item?.updated_at ||
          "";
        if (!bruto) return false;
        const ts = new Date(bruto).getTime();
        if (!Number.isFinite(ts)) return false;
        if (filtroData === "hoje" && ts < inicioHoje) return false;
        if (filtroData === "7dias" && ts < seteDias) return false;
        if (filtroData === "30dias" && ts < trintaDias) return false;
      }
      return true;
    });
  }, [rowsBase, filtroSecao, filtroEstado, filtroLocalizacao, filtroData]);

  const rowsOrdenadas = useMemo(() => {
    if (ordem === "relevancia") return rowsFiltradas;
    return [...rowsFiltradas].sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  }, [rowsFiltradas, ordem]);

  const totalPaginas = Math.max(1, Math.ceil(rowsOrdenadas.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const rowsPaginadas = rowsOrdenadas.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);

  useEffect(() => {
    setPagina(1);
  }, [filtroSecao, filtroEstado, filtroLocalizacao, ordem, globalOutput]);

  useEffect(() => {
    if (!searchRequestId) return;
    const termo = String(globalTermo || "").trim();
    if (!termo) return;
    onPesquisar?.();
  }, [searchRequestId, globalTermo, onPesquisar]);

  const cardsResumo = useMemo(() => {
    const by = new Map();
    rowsFiltradas.forEach((r) => by.set(r.secao, (by.get(r.secao) || 0) + 1));
    return Array.from(by.entries()).map(([secao, total]) => ({ secao, total }));
  }, [rowsFiltradas]);

  const semResultado = !loading && rowsBase.length === 0;

  async function handleSubmit(e) {
    e.preventDefault();
    const termo = String(globalTermo || "").trim();
    if (!termo || loading) return;
    await onPesquisar?.();
  }

  return (
    <SectionCard title="Pesquisa Global" subtitle="Encontra rapidamente ativos, inventários e utilizadores em todo o sistema.">
      <div className="pesq-ref-wrap">
        <div className="pesq-ref-top">
          <form className="pesq-ref-search" onSubmit={handleSubmit}>
            <span className="material-symbols-outlined" aria-hidden>
              search
            </span>
            <input
              value={globalTermo}
              onChange={(e) => setGlobalTermo(e.target.value)}
              placeholder="Ex.: dell latitude 5420"
              aria-label="Termo da pesquisa global"
            />
            <Button type="submit" size="small" disabled={loading || !String(globalTermo || "").trim()}>
              {loading ? "A pesquisar..." : "Pesquisar"}
            </Button>
            <Button type="button" variant="outlined" size="small" onClick={() => setGlobalTermo("")} disabled={loading}>
              Limpar
            </Button>
          </form>
          <aside className="pesq-ref-tip">
            <span className="material-symbols-outlined">tips_and_updates</span>
            <div>
              <strong>Dicas de pesquisa</strong>
              <p>Pesquisar por nome do ativo, IP, número de série, utilizador, inventário ou localização.</p>
            </div>
          </aside>
        </div>

        <div className="pesq-ref-filters">
          <label>
            Tipo de resultado
            <select value={filtroSecao} onChange={(e) => setFiltroSecao(e.target.value)}>
              <option value="todas">Todos os tipos</option>
              {opcoesTipo.map((k) => (
                <option key={k} value={k}>
                  {tituloSecao(k)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Localização
            <select value={filtroLocalizacao} onChange={(e) => setFiltroLocalizacao(e.target.value)}>
              <option value="todas">Todas as localizações</option>
              {opcoesLocalizacao.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estado
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
              <option value="todos">Todos os estados</option>
              {opcoesEstado.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
          <label>
            Data de registo
            <select value={filtroData} onChange={(e) => setFiltroData(e.target.value)}>
              <option value="qualquer">Qualquer data</option>
              <option value="hoje">Hoje</option>
              <option value="7dias">Últimos 7 dias</option>
              <option value="30dias">Últimos 30 dias</option>
            </select>
          </label>
          <Button
            type="button"
            variant="outlined"
            size="small"
            onClick={() => setMostrarAvancados((v) => !v)}
          >
            {mostrarAvancados ? "Ocultar avançados" : "Filtros avançados"}
          </Button>
        </div>

        {mostrarAvancados ? (
          <div className="pesq-ref-advanced">
            <Button type="button" variant="outlined" size="small" onClick={() => setMostrarRaw((v) => !v)}>
              {mostrarRaw ? "Vista normal" : "Ver JSON bruto"}
            </Button>
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={() => {
                setFiltroSecao("todas");
                setFiltroEstado("todos");
                setFiltroLocalizacao("todas");
                setFiltroData("qualquer");
                setOrdem("relevancia");
              }}
            >
              Limpar filtros
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="loading-box">A pesquisar…</div>
        ) : semResultado ? (
          <div className="pesq-ref-empty">
            <span className="material-symbols-outlined">travel_explore</span>
            <div>
              <strong>Pronto para pesquisar</strong>
              <p>Introduz um termo e carrega em Pesquisar para ver resultados organizados por secção.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="pesq-ref-cards">
              {cardsResumo.map((c) => (
                <article key={c.secao} className="pesq-ref-card">
                  <span className="material-symbols-outlined">{secaoVisual(c.secao).icon}</span>
                  <div>
                    <strong>{c.total}</strong>
                    <p>{secaoVisual(c.secao).label}</p>
                    <small>Ver detalhes</small>
                  </div>
                </article>
              ))}
            </div>

            <div className="pesq-ref-results-head">
              <div className="pesq-ref-tabs">
                <Button type="button" variant={aba === "resultados" ? "contained" : "text"} size="small" onClick={() => setAba("resultados")}>
                  Resultados
                </Button>
                <Button type="button" variant={aba === "agrupado" ? "contained" : "text"} size="small" onClick={() => setAba("agrupado")}>
                  Agrupado por tipo
                </Button>
                <Button type="button" variant={aba === "tendencias" ? "contained" : "text"} size="small" onClick={() => setAba("tendencias")}>
                  Tendências
                </Button>
              </div>
              <div className="pesq-ref-head-actions">
                <label>
                  Ordenar por
                  <select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
                    <option value="relevancia">Relevância</option>
                    <option value="nome">Nome (A-Z)</option>
                  </select>
                </label>
                <Button type="button" variant="outlined" size="small" onClick={() => setMostrarRaw((v) => !v)}>
                  Ver JSON bruto
                </Button>
              </div>
            </div>

            {mostrarRaw ? (
              <pre className="pesq-ref-raw">{globalOutput || "Sem dados para mostrar."}</pre>
            ) : aba === "resultados" ? (
              <>
                <p className="pesq-ref-count">{rowsOrdenadas.length} resultado(s) encontrado(s)</p>
                <div className="table-shell table-shell--responsive">
                  <table className="pesq-ref-table">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Nome / Descrição</th>
                        <th>Detalhes</th>
                        <th>Localização</th>
                        <th>Utilizador</th>
                        <th>Estado</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowsPaginadas.map((r) => (
                        <tr key={r.key}>
                          <td>
                            <span className="material-symbols-outlined">{secaoVisual(r.secao).icon}</span>
                          </td>
                          <td>
                            <strong>{r.nome}</strong>
                            <small>{r.desc || "—"}</small>
                          </td>
                          <td>{r.detalhes || "—"}</td>
                          <td>{valorHumano(r.localizacao)}</td>
                          <td>{valorHumano(r.utilizador)}</td>
                          <td>
                            <span className="pill badge-info">{valorHumano(r.estado)}</span>
                          </td>
                          <td>
                            <button type="button" className="table-icon-btn" aria-label="ver">
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pesq-ref-pagination">
                  <span>
                    Mostrando {rowsPaginadas.length === 0 ? 0 : (paginaAtual - 1) * porPagina + 1} a{" "}
                    {(paginaAtual - 1) * porPagina + rowsPaginadas.length} de {rowsOrdenadas.length} resultado(s)
                  </span>
                  <div>
                    <Button type="button" variant="outlined" size="small" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={paginaAtual <= 1}>
                      Anterior
                    </Button>
                    <Button type="button" variant="outlined" size="small" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={paginaAtual >= totalPaginas}>
                      Seguinte
                    </Button>
                  </div>
                </div>
              </>
            ) : aba === "agrupado" ? (
              <ul className="pesq-ref-grouped">
                {cardsResumo.map((c) => (
                  <li key={c.secao}>
                    <strong>{tituloSecao(c.secao)}</strong>
                    <span>{c.total}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="pesq-ref-empty">
                <span className="material-symbols-outlined">query_stats</span>
                <div>
                  <strong>Tendências</strong>
                  <p>Vista reservada para evolução temporal numa próxima versão.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </SectionCard>
  );
}
