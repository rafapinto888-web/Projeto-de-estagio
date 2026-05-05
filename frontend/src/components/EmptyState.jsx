/* Comentario geral deste ficheiro: estado vazio reutilizavel para tabelas e listas. */
import { Paper, Stack, Typography } from "@mui/material";

export default function EmptyState({ title, description }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        bgcolor: "#f8fafc",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <span className="material-symbols-outlined" style={{ marginTop: 2, color: "#64748b", fontSize: 18 }}>
          info
        </span>
        <div>
          <Typography fontWeight={700} fontSize={15}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </div>
      </Stack>
    </Paper>
  );
}

