/* Cabeçalho superior: pesquisa global, íconos e utilizador atual. */

import { useEffect, useRef } from "react";
import { AppBar, Avatar, Box, Button, IconButton, InputBase, Paper, Stack, Toolbar, Typography } from "@mui/material";

function initials(user) {
  const base = user?.nome || user?.username || user?.email || "?";
  const parts = String(base).trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] || "";
  return (a + b).toUpperCase().slice(0, 2) || "?";
}

export default function Topbar({ user, isAdmin, onLogout, onSearch, onNavigate }) {
  const inputRef = useRef(null);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function runSearch() {
    const q = inputRef.current?.value?.trim();
    if (q) onSearch?.(q);
  }

  return (
    <AppBar
      position="static"
      color="inherit"
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: 3,
        mb: 2,
      }}
    >
      <Toolbar sx={{ gap: 2, justifyContent: "space-between", minHeight: "68px !important" }}>
        <Paper
          variant="outlined"
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1.25,
            py: 0.5,
            borderRadius: 2.5,
            flex: 1,
            minWidth: 0,
            maxWidth: 780,
          }}
        >
          <span className="material-symbols-outlined" style={{ color: "#64748b", marginRight: 8, fontSize: 18 }}>
            search
          </span>
          <InputBase
            inputRef={inputRef}
            type="search"
            fullWidth
            placeholder="Pesquisa global de ativos, inventários…"
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
            inputProps={{ "aria-label": "Pesquisa global" }}
          />
          <Typography variant="caption" color="text.secondary">
            Ctrl + K
          </Typography>
        </Paper>

        <Stack direction="row" spacing={1.2} alignItems="center">
          <IconButton
            title="Ajuda — abre pesquisa global"
            aria-label="Ajuda"
            onClick={() => onNavigate?.("pesquisa")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              help
            </span>
          </IconButton>

          <Stack direction="row" spacing={1.2} alignItems="center">
            <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 13 }}>{initials(user)}</Avatar>
            <Box sx={{ lineHeight: 1.2 }}>
              <Typography fontSize={13} fontWeight={700}>
                {user?.nome || user?.username || "Utilizador"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isAdmin ? "Administrador" : "Utilizador"}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="text"
            size="small"
            onClick={onLogout}
            startIcon={
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                logout
              </span>
            }
          >
            Sair
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
