/*
 * Contentor de página: título, subtítulo e área de conteúdo com ação opcional à direita.
 */
import { Box, Paper, Stack, Typography } from "@mui/material";

export default function SectionCard({ title, subtitle, children, rightAction = null }) {
  return (
    <Paper
      component="section"
      elevation={0}
      sx={{
        width: "100%",
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        bgcolor: "#ffffff",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "flex-start" }}
        justifyContent="space-between"
        gap={1.5}
        mb={2.5}
      >
        <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
          <Typography variant="h1" sx={{ mb: subtitle ? 0.5 : 0 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="subtitle2" sx={{ maxWidth: 720 }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {rightAction ? (
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-start",
            }}
          >
            {rightAction}
          </Box>
        ) : null}
      </Stack>
      <Box sx={{ minWidth: 0, width: "100%" }}>{children}</Box>
    </Paper>
  );
}
