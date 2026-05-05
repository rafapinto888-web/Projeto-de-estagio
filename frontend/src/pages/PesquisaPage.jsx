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

const EXEMPLOS = ["10.65.0.49", "DESKTOP", "biometrics", "teste", "inventário"];

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
  const parsedOutput = useMemo(() => parseOutput(globalOutput), [globalOutput]);
  const secoes = useMemo(() => toSections(parsedOutput), [parsedOutput]);
  const resumo = useMemo(() => resumoResultados(parsedOutput, globalOutput), [parsedOutput, globalOutput]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!termoLimpo || loading) return;
    await onPesquisar?.();
  }

  function aplicarExemplo(ex) {
    setGlobalTermo(ex);
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

        <div className="pesquisa-global-suggest">
          <span className="pesquisa-global-suggest-label">Exemplos rápidos:</span>
          <div className="pesquisa-global-suggest-chips">
            {EXEMPLOS.map((ex) => (
              <button
                key={ex}
                type="button"
                className="ghost ghost-sm pesquisa-global-chip"
                onClick={() => aplicarExemplo(ex)}
                disabled={loading}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pesquisa-global-meta">
        <span className="pill badge-info">Resultado</span>
        <span>{resumo}</span>
        <button
          type="button"
          className="ghost ghost-sm"
          onClick={() => setMostrarRaw((v) => !v)}
          disabled={!parsedOutput}
        >
          {mostrarRaw ? "Vista legível" : "Ver JSON bruto"}
        </button>
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
        <div className="pesquisa-global-sections">
          {secoes.map(({ key, value }) => {
            const lista = Array.isArray(value) ? value : [value];
            const vazia = !value || (Array.isArray(value) && value.length === 0);
            return (
              <section key={key} className="pesquisa-global-card">
                <header className="pesquisa-global-card-head">
                  <h3>{tituloSecao(key)}</h3>
                  <span className="pill badge-info">
                    {Array.isArray(value) ? `${value.length} resultado(s)` : "1 resultado"}
                  </span>
                </header>
                {vazia ? (
                  <p className="pesquisa-global-empty">Sem resultados nesta secção.</p>
                ) : (
                  <ul className="pesquisa-global-list">
                    {lista.map((item, idx) => {
                      const campos = previewCampos(item);
                      return (
                        <li key={`${key}-${idx}`} className="pesquisa-global-item">
                          {campos.length === 0 ? (
                            <pre>{JSON.stringify(item, null, 2)}</pre>
                          ) : (
                            <div className="pesquisa-global-kv-grid">
                              {campos.map(({ k, v }) => (
                                <div key={`${key}-${idx}-${k}`} className="pesquisa-global-kv">
                                  <dt>{tituloSecao(k)}</dt>
                                  <dd>{valorHumano(v)}</dd>
                                </div>
                              ))}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

