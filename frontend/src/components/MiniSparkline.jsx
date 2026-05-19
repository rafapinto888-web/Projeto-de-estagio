/*
 * Mini gráfico decorativo (sparkline SVG) nos cartões KPI do dashboard.
 */

export default function MiniSparkline({ seed = 1, accent = "#2563eb" }) {
  const pts = [0, 1, 2, 3, 4].map((i) => {
    const v = (((Number(seed) || 1) * (i + 7)) % 23) / 23;
    const x = 3 + i * 12;
    const y = 24 - v * 16;
    return `${x},${y}`;
  });

  return (
    <svg className="mini-sparkline" width="60" height="28" viewBox="0 0 60 28" aria-hidden>
      <polyline fill="none" stroke={accent} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" points={pts.join(" ")} />
    </svg>
  );
}
