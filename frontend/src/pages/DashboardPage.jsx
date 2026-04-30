/* Comentario geral deste ficheiro: pagina principal com visao geral e indicadores. */

import DataTable from "../components/DataTable";
import SectionCard from "../components/SectionCard";

export default function DashboardPage({ inventarios, computadores, utilizadores, localizacoes, loading }) {
  const recent = (inventarios || []).slice(0, 5);

  return (
    <SectionCard title="Visao Geral" subtitle="Resumo rapido do sistema e das entidades principais.">
      <div className="kpis">
        <article>
          <span>Inventarios</span>
          <strong>{inventarios.length}</strong>
        </article>
        <article>
          <span>Computadores</span>
          <strong>{computadores.length}</strong>
        </article>
        <article>
          <span>Utilizadores</span>
          <strong>{utilizadores.length}</strong>
        </article>
        <article>
          <span>Localizacoes</span>
          <strong>{localizacoes.length}</strong>
        </article>
      </div>

      <DataTable
        columns={["ID", "Nome", "Tipo", "IP Rede"]}
        rows={recent}
        loading={loading}
        emptyTitle="Sem inventarios ainda"
        emptyDescription="Cria o primeiro inventario para iniciar o trabalho."
        renderRow={(inv) => (
          <tr key={inv.id}>
            <td>{inv.id}</td>
            <td>{inv.nome}</td>
            <td>{inv.tipo_inventario}</td>
            <td>{inv.ip_rede || "-"}</td>
          </tr>
        )}
      />
    </SectionCard>
  );
}

