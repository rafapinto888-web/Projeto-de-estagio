/* Comentario geral deste ficheiro: card padrao para secoes principais. */
import { Box, Paper, Stack, Typography } from "@mui/material";

export default function SectionCard({ title, subtitle, children, rightAction = null }) {
  return (
    <Paper
      component="section"
      elevation={0}
      sx={{
        border: "1px solid #dbe5f2",
        p: { xs: 1.5, md: 2 },
        borderRadius: 2.5,
        background: "linear-gradient(180deg, #ffffff 0%, #fdfefe 100%)",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        gap={1.2}
        mb={2}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h2" sx={{ mb: 0.25 }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {rightAction ? <Box sx={{ width: { xs: "100%", md: "auto" } }}>{rightAction}</Box> : null}
      </Stack>
      {children}
    </Paper>
  );
}

