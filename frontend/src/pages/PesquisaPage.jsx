/* Pesquisa global — UX limpa com secções e cartões de resultado. */

import { useMemo, useState } from "react";
import SectionCard from "../components/SectionCard";

const CAMPOS_PRIORITARIOS = [
  "nome",
  "hostname",
  "ip",
  "endereco_ip",
  "numero_serie",
  "marca",
  "modelo",
  "estado",
  "inventario_nome",
  "utilizador_nome",
  "email",
];

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

function resumoResultados(parsed, globalOutput) {
  if (!globalOutput || !String(globalOutput).trim()) return "Sem resultados ainda";
  if (!parsed) return "Resposta em texto simples";
  const sections = toSections(parsed);
  const total = sections.reduce((acc, sec) => {
    if (Array.isArray(sec.value)) return acc + sec.value.length;
    if (sec.value && typeof sec.value === "object") return acc + 1;
    return acc;
  }, 0);
  return `${sections.length} secção(ões), ${total} item(ns)`;
}

function valorHumano(v) {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  return String(v);
}

function previewCampos(item) {
  if (!item || typeof item !== "object") return [];
  const usados = new Set();
  const primarios = CAMPOS_PRIORITARIOS.filter((k) => Object.prototype.hasOwnProperty.call(item, k))
    .map((k) => ({ k, v: item[k] }))
    .filter(({ v }) => v != null && String(v).trim() !== "");
  primarios.forEach(({ k }) => usados.add(k));
  const extras = Object.entries(item)
    .filter(([k, v]) => !usados.has(k) && v != null && String(v).trim() !== "")
    .slice(0, 3)
    .map(([k, v]) => ({ k, v }));
  return [...primarios, ...extras].slice(0, 6);
}

export default function PesquisaPage({ globalTermo, setGlobalTermo, onPesquisar, globalOutput, loading }) {
  const termoLimpo = globalTermo.trim();
  const [mostrarRaw, setMostrarRaw] = useState(false);
  const [filtroSecao, setFiltroSecao] = useState("todas");
  const parsedOutput = useMemo(() => parseOutput(globalOutput), [globalOutput]);
  const secoes = useMemo(() => toSections(parsedOutput), [parsedOutput]);
  const secoesFiltradas = useMemo(() => {
    if (filtroSecao === "todas") return secoes;
    return secoes.filter(({ key }) => key === filtroSecao);
  }, [secoes, filtroSecao]);
  const resumo = useMemo(() => resumoResultados(parsedOutput, globalOutput), [parsedOutput, globalOutput]);
  const resultadosFlat = useMemo(() => {
    return secoesFiltradas.flatMap(({ key, value }) => {
      const lista = Array.isArray(value) ? value : [value];
      return lista.map((item, idx) => ({ key: `${key}-${idx}`, secao: key, item }));
    });
  }, [secoesFiltradas]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!termoLimpo || loading) return;
    await onPesquisar?.();
  }

  const semResultado =
    !loading &&
    (!globalOutput || !String(globalOutput).trim() || globalOutput === "Escreve um termo para pesquisar.");

  return (
    <SectionCard title="Pesquisa Global" subtitle="Encontra rapidamente ativos, inventários e utilizadores.">
      <div className="pesquisa-global-hero">
        <form className="pesquisa-global-box" onSubmit={handleSubmit}>
          <div className="pesquisa-global-input-wrap">
            <span className="material-symbols-outlined pesquisa-global-input-icon" aria-hidden>
              search
            </span>
            <input
              value={globalTermo}
              onChange={(e) => setGlobalTermo(e.target.value)}
              placeholder="Ex.: host, IP, número de série, utilizador, inventário…"
              className="pesquisa-global-input"
              aria-label="Termo da pesquisa global"
            />
          </div>

          <div className="pesquisa-global-actions">
            <button type="submit" disabled={!termoLimpo || loading}>
              {loading ? "A pesquisar..." : "Pesquisar"}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => setGlobalTermo("")}
              disabled={!globalTermo || loading}
            >
              Limpar
            </button>
          </div>
        </form>
        <div className="pesquisa-global-toolbar">
          <label className="pesquisa-global-filter">
            Tipo
            <select
              value={filtroSecao}
              onChange={(e) => setFiltroSecao(e.target.value)}
              disabled={!secoes.length || loading}
            >
              <option value="todas">Todos os tipos</option>
              {secoes.map(({ key }) => (
                <option key={key} value={key}>
                  {tituloSecao(key)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="ghost ghost-sm"
            onClick={() => setMostrarRaw((v) => !v)}
            disabled={!parsedOutput}
          >
            {mostrarRaw ? "Vista legível" : "Ver JSON bruto"}
          </button>
        </div>
      </div>

      <div className="pesquisa-global-meta">
        <span className="pill badge-info">Resultado</span>
        <span>{resumo}</span>
      </div>

      {loading ? (
        <div className="loading-box">A pesquisar…</div>
      ) : semResultado ? (
        <div className="pesquisa-global-empty-state">
          <span className="material-symbols-outlined" aria-hidden>
            travel_explore
          </span>
          <div>
            <h3>Pronto para pesquisar</h3>
            <p>Introduz um termo e carrega em Pesquisar para ver resultados organizados por secção.</p>
          </div>
        </div>
      ) : !parsedOutput || mostrarRaw ? (
        <pre className="pesquisa-global-output">{globalOutput || "Sem dados para mostrar."}</pre>
      ) : (
        <div className="table-shell table-shell--responsive pesquisa-global-table-shell">
          <table className="pesquisa-global-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nome / descrição</th>
                <th>Detalhes</th>
                <th>Localização</th>
                <th>Utilizador</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {resultadosFlat.map((row) => {
                const campos = previewCampos(row.item);
                const nome =
                  row.item?.nome || row.item?.hostname || row.item?.email || row.item?.descricao || "—";
                const detalhe = campos
                  .filter(({ k }) => !["nome", "hostname", "email", "descricao"].includes(k))
                  .slice(0, 2)
                  .map(({ k, v }) => `${tituloSecao(k)}: ${valorHumano(v)}`)
                  .join(" · ");
                return (
                  <tr key={row.key}>
                    <td>
                      <span className="pill badge-info">{tituloSecao(row.secao)}</span>
                    </td>
                    <td>{nome}</td>
                    <td>{detalhe || "—"}</td>
                    <td>{valorHumano(row.item?.localizacao_nome || row.item?.localizacao)}</td>
                    <td>{valorHumano(row.item?.utilizador_nome || row.item?.username || row.item?.email)}</td>
                    <td>{valorHumano(row.item?.estado)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

