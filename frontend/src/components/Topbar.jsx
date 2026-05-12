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

export default function Topbar({ user, isAdmin, onLogout, onSearch, onNavigate, showNavToggle = false, onToggleNav }) {
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
        border: "1px solid #dbe5f2",
        borderRadius: 4,
        mb: 2,
        background: "linear-gradient(90deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.98) 100%)",
        boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
      }}
    >
      <Toolbar
        sx={{
          gap: 1.1,
          minHeight: "70px !important",
          px: { xs: 1.2, md: 1.8 },
          py: 1.1,
          alignItems: "stretch",
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            display: "flex",
            alignItems: "center",
            px: 1.25,
            py: 0.6,
            borderRadius: 3,
            width: "100%",
            bgcolor: "#ffffff",
            borderColor: "#dbe5f2",
            boxShadow: "inset 0 0 0 1px rgba(219,229,242,0.55)",
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

        <Stack
          direction="row"
          spacing={0.6}
          alignItems="center"
          sx={{ flexShrink: 0, justifyContent: "space-between", width: "100%" }}
        >
          {showNavToggle ? (
            <IconButton
              title="Abrir menu"
              aria-label="Abrir menu"
              onClick={onToggleNav}
              sx={{ border: "1px solid #dbe5f2", bgcolor: "#fff", color: "#334155" }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                menu
              </span>
            </IconButton>
          ) : null}
          <IconButton
            title="Ajuda — abre pesquisa global"
            aria-label="Ajuda"
            onClick={() => onNavigate?.("pesquisa")}
            sx={{ border: "1px solid #dbe5f2", bgcolor: "#fff" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              help
            </span>
          </IconButton>

          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ px: 0.6 }}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 13, fontWeight: 700 }}>
              {initials(user)}
            </Avatar>
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
            variant="outlined"
            size="small"
            onClick={onLogout}
            sx={{ display: { xs: "none", sm: "inline-flex" } }}
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
