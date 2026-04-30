/* Comentario geral deste ficheiro: pagina de pesquisa global e visualizacao de resultados. */

import SectionCard from "../components/SectionCard";

export default function PesquisaPage({ globalTermo, setGlobalTermo, onPesquisar, globalOutput, loading }) {
  return (
    <SectionCard title="Pesquisa Global" subtitle="Consulta transversal em inventarios e entidades.">
      <div className="grid grid-inline">
        <input
          value={globalTermo}
          onChange={(e) => setGlobalTermo(e.target.value)}
          placeholder="Termo de pesquisa"
        />
        <button onClick={onPesquisar}>Pesquisar</button>
      </div>
      {loading ? <div className="loading-box">A pesquisar...</div> : <pre>{globalOutput}</pre>}
    </SectionCard>
  );
}

