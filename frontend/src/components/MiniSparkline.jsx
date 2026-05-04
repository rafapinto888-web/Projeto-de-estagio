/* Sparkline determinístico (visual) derivado de um número — sem dependências. */

import { useId, useMemo } from "react";

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function MiniSparkline({ seed = 1, accent = "#2563eb" }) {
  const gid = useId().replace(/:/g, "");
  const { points, pathD } = useMemo(() => {
    const rnd = mulberry32(Number(seed) || 1);
    const w = 120;
    const h = 34;
    const n = 14;
    const ys = [];
    for (let i = 0; i < n; i += 1) {
      ys.push(4 + rnd() * (h - 8));
    }
    const pts = ys.map((y, i) => ({
      x: (i / (n - 1)) * w,
      y,
    }));
    const pathD =
      pts.length > 0
        ? `M ${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ")}`
        : "";
    return { points: pts, pathD };
  }, [seed]);

  return (
    <svg className="mini-sparkline" width="120" height="34" viewBox="0 0 120 34" aria-hidden>
      <defs>
        <linearGradient id={`sf-${gid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {points.length > 1 && (
        <path
          fill={`url(#sf-${gid})`}
          d={`${pathD} L ${points[points.length - 1].x},${34} L 0,34 Z`}
          opacity="1"
        />
      )}
      <path
        d={pathD}
        fill="none"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
