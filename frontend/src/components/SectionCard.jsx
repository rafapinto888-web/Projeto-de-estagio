/* Comentario geral deste ficheiro: card padrao para secoes principais. */
import { Box, Paper, Stack, Typography } from "@mui/material";

export default function SectionCard({ title, subtitle, children, rightAction = null }) {
  return (
    <Paper
      component="section"
      elevation={0}
      sx={{
        width: "100%",
        border: "1px solid #dbe5f2",
        p: { xs: 1.5, md: 2 },
        borderRadius: 2.5,
        background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "radial-gradient(500px 100px at 0% 0%, rgba(37,99,235,0.09), transparent 70%), radial-gradient(300px 90px at 100% 0%, rgba(109,40,217,0.07), transparent 65%)",
        }}
      />
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems="flex-start"
        gap={1.2}
        mb={2}
        sx={{ position: "relative", width: "100%" }}
      >
        <Box sx={{ minWidth: 0, flex: "1 1 auto", width: { xs: "100%", md: "auto" } }}>
          <Typography variant="h2" sx={{ mb: 0.25, wordBreak: "break-word", overflowWrap: "anywhere" }}>
            {title}
          </Typography>
          {subtitle ? (
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        {rightAction ? (
          <Box
            sx={{
              width: { xs: "100%", md: "auto" },
              flexShrink: 0,
              display: "flex",
              justifyContent: { xs: "flex-end", md: "flex-end" },
              alignSelf: { xs: "stretch", md: "flex-start" },
              ml: { md: "auto" },
            }}
          >
            {rightAction}
          </Box>
        ) : null}
      </Stack>
      <Box sx={{ position: "relative", minWidth: 0, width: "100%" }}>{children}</Box>
    </Paper>
  );
}

