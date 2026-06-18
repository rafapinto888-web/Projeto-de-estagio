/*
 * Cartão de métrica (KPI) com ícone, valor e dica opcional.
 */

import { Box, Paper, Stack, Typography } from "@mui/material";

const TONE_STYLES = {
  primary: { iconBg: "#eff6ff", iconColor: "#2563eb", accent: "#2563eb" },
  success: { iconBg: "#ecfdf5", iconColor: "#16a34a", accent: "#16a34a" },
  warning: { iconBg: "#fffbeb", iconColor: "#ca8a04", accent: "#ca8a04" },
  error: { iconBg: "#fef2f2", iconColor: "#dc2626", accent: "#dc2626" },
  neutral: { iconBg: "#f3f4f6", iconColor: "#6b7280", accent: "#9ca3af" },
};

/** Cartão de métrica para dashboard e resumos de página. */
export default function MetricCard({ label, value, icon, tone = "primary", hint }) {
  const t = TONE_STYLES[tone] || TONE_STYLES.primary;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.25,
        height: "100%",
        borderRadius: 2.5,
        borderColor: "#e5e7eb",
        background: "linear-gradient(180deg, #ffffff 0%, #fbfcfe 100%)",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
        "&::before": {
          content: "\"\"",
          position: "absolute",
          inset: 0,
          top: 0,
          height: 3,
          background: t.accent,
        },
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 14px 28px rgba(15, 23, 42, 0.06)",
          borderColor: "#d1d5db",
        },
      }}
    >
      <Stack spacing={1.65}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            {icon ? (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: t.iconBg,
                  color: t.iconColor,
                  border: "1px solid rgba(255,255,255,0.8)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {icon}
                </span>
              </Box>
            ) : null}
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ fontSize: "0.76rem", letterSpacing: "0.01em" }}
            >
              {label}
            </Typography>
          </Stack>
        </Stack>
        <Typography
          component="p"
          sx={{
            fontWeight: 800,
            fontSize: "1.9rem",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            fontVariantNumeric: "tabular-nums",
            color: "text.primary",
          }}
        >
          {value}
        </Typography>
        {hint ? (
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
            {hint}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
