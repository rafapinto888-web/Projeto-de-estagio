/*
 * Painel com borda (subsecção dentro de páginas, sobretudo dashboard).
 */

import { Box, Divider, Paper, Stack, Typography } from "@mui/material";

/** Painel interno: título, subtítulo opcional e slot de ação. */
export default function Panel({
  title,
  subtitle,
  action,
  children,
  noPadding = false,
  minHeight,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        height: minHeight ? "100%" : undefined,
        minHeight: minHeight || undefined,
        display: "flex",
        flexDirection: "column",
        borderRadius: 2.25,
        borderColor: "#e5e7eb",
        background: "linear-gradient(180deg, #ffffff 0%, #fcfcfd 100%)",
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.04)",
        overflow: "hidden",
      }}
    >
      {title ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "flex-start" }}
          justifyContent="space-between"
          spacing={1}
          sx={{
            px: 2.25,
            pt: 2,
            pb: subtitle ? 0.75 : 1.4,
            gap: 1,
            background: "linear-gradient(180deg, #ffffff 0%, #fafafa 100%)",
          }}
        >
          <Box sx={{ minWidth: 0, width: { xs: "100%", sm: "auto" } }}>
            <Typography variant="h3" color="text.primary" sx={{ letterSpacing: "-0.015em" }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.35, display: "block", fontSize: "0.75rem", lineHeight: 1.45 }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {action ? (
            <Box
              sx={{
                flexShrink: 0,
                alignSelf: { xs: "flex-start", sm: "auto" },
                "& .MuiButton-root": {
                  minHeight: 30,
                  px: 0.75,
                  borderRadius: 999,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                },
              }}
            >
              {action}
            </Box>
          ) : null}
        </Stack>
      ) : null}
      {title ? <Divider sx={{ mx: 2.25, borderColor: "#eceff3" }} /> : null}
      <Box sx={{ p: noPadding ? 0 : 2.25, flex: 1, minWidth: 0 }}>{children}</Box>
    </Paper>
  );
}
