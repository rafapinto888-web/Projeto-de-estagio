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
        borderLeft: `3px solid ${t.accent}`,
        transition: "border-color 0.15s ease",
        "&:hover": {
          borderColor: "#d1d5db",
        },
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1.25}>
            {icon ? (
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: t.iconBg,
                  color: t.iconColor,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {icon}
                </span>
              </Box>
            ) : null}
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {label}
            </Typography>
          </Stack>
        </Stack>
        <Typography
          component="p"
          sx={{
            fontWeight: 700,
            fontSize: "1.75rem",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            fontVariantNumeric: "tabular-nums",
            color: "text.primary",
          }}
        >
          {value}
        </Typography>
        {hint ? (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
