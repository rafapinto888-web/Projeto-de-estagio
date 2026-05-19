/*
 * Placeholder quando uma lista ou tabela não tem registos.
 */
import { Paper, Stack, Typography } from "@mui/material";

export default function EmptyState({ title, description }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.2,
        bgcolor: "#f8fbff",
        borderColor: "#dbe5f2",
        borderStyle: "dashed",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <span className="material-symbols-outlined" style={{ marginTop: 2, color: "#64748b", fontSize: 18 }}>
          info
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <Typography fontWeight={700} fontSize={15} sx={{ wordBreak: "break-word" }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word", mt: 0.35 }}>
            {description}
          </Typography>
        </div>
      </Stack>
    </Paper>
  );
}

