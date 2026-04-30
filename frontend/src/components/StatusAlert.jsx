/* Comentario geral deste ficheiro: componente visual para feedback de estado. */

export default function StatusAlert({ type = "ok", message }) {
  if (!message) return null;
  return <p className={`status ${type}`}>{message}</p>;
}

