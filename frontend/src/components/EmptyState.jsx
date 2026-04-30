/* Comentario geral deste ficheiro: estado vazio reutilizavel para tabelas e listas. */

export default function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

