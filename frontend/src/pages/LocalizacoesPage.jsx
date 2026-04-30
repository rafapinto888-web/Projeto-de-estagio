/* Comentario geral deste ficheiro: pagina CRUD para localizacoes fisicas. */

import DataTable from "../components/DataTable";
import SectionCard from "../components/SectionCard";

export default function LocalizacoesPage({
  isAdmin,
  localizacaoForm,
  setLocalizacaoForm,
  onCreate,
  onUpdate,
  onDeleteByForm,
  onCancel,
  localizacoes,
  loading,
  onPick,
  onDeleteRow,
}) {
  return (
    <SectionCard title="Localizacoes" subtitle="Gestao de salas, racks e outros pontos fisicos.">
      {isAdmin && (
        <>
          <div className="grid">
            <input
              placeholder="ID (editar/apagar)"
              value={localizacaoForm.id}
              onChange={(e) => setLocalizacaoForm((p) => ({ ...p, id: e.target.value }))}
            />
            <input
              placeholder="Nome"
              value={localizacaoForm.nome}
              onChange={(e) => setLocalizacaoForm((p) => ({ ...p, nome: e.target.value }))}
            />
            <input
              placeholder="Descricao (opcional)"
              value={localizacaoForm.descricao}
              onChange={(e) => setLocalizacaoForm((p) => ({ ...p, descricao: e.target.value }))}
            />
          </div>
          <div className="actions">
            <button onClick={onCreate}>Criar</button>
            <button onClick={onUpdate}>Atualizar</button>
            <button className="danger" onClick={onDeleteByForm}>
              Apagar
            </button>
            <button className="ghost" onClick={onCancel}>
              Cancelar
            </button>
          </div>
        </>
      )}

      <DataTable
        columns={["ID", "Nome", "Descricao", "Acoes"]}
        rows={localizacoes}
        loading={loading}
        emptyTitle="Sem localizacoes"
        emptyDescription="Adiciona localizacoes para melhorar a rastreabilidade dos ativos."
        renderRow={(l) => (
          <tr key={l.id}>
            <td>{l.id}</td>
            <td>{l.nome}</td>
            <td>{l.descricao || "-"}</td>
            <td>
              {isAdmin ? (
                <>
                  <button className="ghost table-btn" onClick={() => onPick(l)}>
                    Editar
                  </button>
                  <button className="danger table-btn" onClick={() => onDeleteRow(l)}>
                    Apagar
                  </button>
                </>
              ) : (
                "-"
              )}
            </td>
          </tr>
        )}
      />
    </SectionCard>
  );
}

