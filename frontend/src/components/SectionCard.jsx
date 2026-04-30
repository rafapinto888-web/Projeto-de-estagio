/* Comentario geral deste ficheiro: card padrao para secoes principais. */

export default function SectionCard({ title, subtitle, children, rightAction = null }) {
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
        </div>
        {rightAction}
      </div>
      {children}
    </section>
  );
}

