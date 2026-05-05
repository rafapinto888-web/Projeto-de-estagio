/* Comentario geral deste ficheiro: card padrao para secoes principais. */
import { Box, Paper, Stack, Typography } from "@mui/material";

export default function SectionCard({ title, subtitle, children, rightAction = null }) {
  return (
    <Paper
      component="section"
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        p: 2,
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.2} mb={2}>
        <Box>
          <Typography variant="h2">{title}</Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" mt={0.4}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {rightAction}
      </Stack>
      {children}
    </Paper>
  );
}

