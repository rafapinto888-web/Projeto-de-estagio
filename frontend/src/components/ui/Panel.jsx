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
      }}
    >
      {title ? (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "flex-start" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ px: 2, pt: 2, pb: subtitle ? 0.5 : 1.25, gap: 1 }}
        >
          <Box sx={{ minWidth: 0, width: { xs: "100%", sm: "auto" } }}>
            <Typography variant="h3" color="text.primary">
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: "block" }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          {action ? (
            <Box sx={{ flexShrink: 0, alignSelf: { xs: "flex-start", sm: "auto" } }}>{action}</Box>
          ) : null}
        </Stack>
      ) : null}
      {title ? <Divider sx={{ mx: 2 }} /> : null}
      <Box sx={{ p: noPadding ? 0 : 2, flex: 1, minWidth: 0 }}>{children}</Box>
    </Paper>
  );
}
