import { Box, Chip, Stack, Typography } from "@mui/material";
import { estadoChipMuiColor } from "../utils/estadoMuiColor";

function corBarraEstado(estado) {
  const chip = estadoChipMuiColor(estado);
  if (chip === "success") return { main: "#16a34a", light: "#4ade80" };
  if (chip === "warning") return { main: "#d97706", light: "#fbbf24" };
  if (chip === "error") return { main: "#dc2626", light: "#f87171" };
  return { main: "#475569", light: "#94a3b8" };
}

function rotuloEstado(estado) {
  const s = String(estado || "—").trim();
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Escala superior “redonda” para o eixo Y (ex.: 129 → 150). */
function escalaMaxima(valor) {
  const n = Math.max(0, Number(valor) || 0);
  if (n <= 5) return 5;
  if (n <= 10) return 10;
  const pot = 10 ** Math.floor(Math.log10(n));
  const norm = n / pot;
  const passo = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return passo * pot;
}

function ticksEixoY(max) {
  const m = escalaMaxima(max);
  const passos = 4;
  const out = [];
  for (let i = 0; i <= passos; i += 1) {
    out.push(Math.round((m * i) / passos));
  }
  return [...new Set(out)];
}

const CHART_H = 200;
const PAD_LEFT = 40;
const PAD_RIGHT = 12;
const PAD_TOP = 8;
const PAD_BOTTOM = 4;

export default function AtivosPorEstadoChart({ totais = [], total = 0 }) {
  if (!totais.length) {
    return (
      <Box
        sx={{
          py: 4,
          px: 2,
          textAlign: "center",
          borderRadius: 2,
          bgcolor: "#f8fafc",
          border: "1px dashed #cbd5e1",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Sem dados de estado para mostrar.
        </Typography>
      </Box>
    );
  }

  const maxEixo = escalaMaxima(Math.max(...totais.map((t) => t.total), 1));
  const ticks = ticksEixoY(maxEixo);
  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;

  return (
    <Stack spacing={1.75}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing="0.02em">
          Distribuição por estado operacional
        </Typography>
        <Chip
          size="small"
          label={`Total: ${total}`}
          sx={{
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            bgcolor: "#eff6ff",
            color: "#1e40af",
            border: "1px solid #bfdbfe",
          }}
        />
      </Stack>

      <Box
        sx={{
          position: "relative",
          borderRadius: 2,
          border: "1px solid #e2e8f0",
          bgcolor: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
          overflow: "hidden",
        }}
        role="img"
        aria-label="Gráfico de barras: ativos por estado"
      >
        <Box sx={{ display: "flex", height: CHART_H, pl: `${PAD_LEFT}px`, pr: `${PAD_RIGHT}px`, pt: `${PAD_TOP}px` }}>
          {/* Eixo Y + grelha */}
          <Box
            sx={{
              position: "absolute",
              left: 0,
              top: PAD_TOP,
              bottom: PAD_BOTTOM,
              width: PAD_LEFT,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "flex-end",
              pr: 0.75,
            }}
          >
            {[...ticks].reverse().map((tick) => (
              <Typography
                key={tick}
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: 10, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}
              >
                {tick}
              </Typography>
            ))}
          </Box>

          <Box sx={{ position: "absolute", left: PAD_LEFT, right: PAD_RIGHT, top: PAD_TOP, bottom: PAD_BOTTOM }}>
            {ticks.map((tick) => {
              const pct = maxEixo > 0 ? (tick / maxEixo) * 100 : 0;
              return (
                <Box
                  key={`grid-${tick}`}
                  sx={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: `${pct}%`,
                    borderTop: tick === 0 ? "1px solid #cbd5e1" : "1px dashed #e2e8f0",
                    pointerEvents: "none",
                  }}
                />
              );
            })}
          </Box>

          {/* Barras */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-evenly",
              gap: 1,
              height: plotH,
              zIndex: 1,
            }}
          >
            {totais.map((item) => {
              const cores = corBarraEstado(item.estado);
              const alturaPx = maxEixo > 0 ? Math.max((item.total / maxEixo) * plotH, item.total > 0 ? 8 : 0) : 0;
              const percent = total > 0 ? Math.round((item.total / total) * 100) : 0;
              return (
                <Box
                  key={item.estado}
                  sx={{
                    flex: "1 1 0",
                    minWidth: 0,
                    maxWidth: 80,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <Stack alignItems="center" spacing={0.25} sx={{ mb: 0.5, minHeight: 28 }}>
                    <Typography
                      variant="caption"
                      fontWeight={800}
                      sx={{ fontSize: 13, fontVariantNumeric: "tabular-nums", color: "#0f172a" }}
                    >
                      {item.total}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontSize: 10, color: "#64748b", fontVariantNumeric: "tabular-nums" }}
                    >
                      {percent}%
                    </Typography>
                  </Stack>
                  <Box
                    title={`${rotuloEstado(item.estado)}: ${item.total} (${percent}%)`}
                    sx={{
                      width: "min(48px, 72%)",
                      height: alturaPx,
                      borderRadius: "8px 8px 4px 4px",
                      background: `linear-gradient(180deg, ${cores.light} 0%, ${cores.main} 100%)`,
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.12)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.16)",
                      },
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Rótulos do eixo X */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-evenly",
            gap: 1,
            pl: `${PAD_LEFT}px`,
            pr: `${PAD_RIGHT}px`,
            pb: 1.25,
            pt: 0.5,
          }}
        >
          {totais.map((item) => (
            <Typography
              key={`lbl-${item.estado}`}
              variant="caption"
              fontWeight={600}
              color="text.secondary"
              sx={{
                flex: "1 1 0",
                minWidth: 0,
                maxWidth: 80,
                textAlign: "center",
                fontSize: 11,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={rotuloEstado(item.estado)}
            >
              {rotuloEstado(item.estado)}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* Legenda */}
      <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
        {totais.map((item) => {
          const cores = corBarraEstado(item.estado);
          const percent = total > 0 ? Math.round((item.total / total) * 100) : 0;
          return (
            <Box
              key={`leg-${item.estado}`}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 1,
                py: 0.5,
                borderRadius: 1.5,
                bgcolor: "#fff",
                border: "1px solid #e2e8f0",
              }}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: 0.75,
                  background: `linear-gradient(180deg, ${cores.light}, ${cores.main})`,
                  flexShrink: 0,
                }}
              />
              <Typography variant="caption" fontWeight={600} sx={{ fontSize: 11 }}>
                {rotuloEstado(item.estado)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
                {item.total} · {percent}%
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
