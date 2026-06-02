/*
 * Barra superior: pesquisa global (Ctrl+K), utilizador autenticado e logout.
 */

import { useEffect, useRef } from "react";
import { Avatar, Box, Button, IconButton, InputBase, Stack, Tooltip, Typography } from "@mui/material";

/** Iniciais para o avatar a partir do nome ou username. */
function initials(user) {
  const base = user?.nome || user?.username || user?.email || "?";
  const parts = String(base).trim().split(/\s+/);
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] || "";
  return (a + b).toUpperCase().slice(0, 2) || "?";
}

export default function Topbar({ user, isAdmin, onLogout, onSearch, showNavToggle = false, onToggleNav }) {
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

  const searchField = (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 0.75,
        borderRadius: 1,
        border: "1px solid #e5e7eb",
        bgcolor: "#f9fafb",
        "&:focus-within": {
          borderColor: "#2563eb",
          bgcolor: "#ffffff",
          boxShadow: "0 0 0 3px rgba(37, 99, 235, 0.12)",
        },
      }}
    >
      <span className="material-symbols-outlined" style={{ color: "#9ca3af", fontSize: 20 }}>
        search
      </span>
      <InputBase
        inputRef={inputRef}
        type="search"
        fullWidth
        placeholder="Pesquisar ativos, inventários, utilizadores…"
        onKeyDown={(e) => {
          if (e.key === "Enter") runSearch();
        }}
        inputProps={{ "aria-label": "Pesquisa global" }}
        sx={{ fontSize: "0.875rem" }}
      />
      <Typography
        variant="caption"
        sx={{
          display: { xs: "none", sm: "block" },
          flexShrink: 0,
          color: "text.secondary",
          px: 0.75,
          py: 0.25,
          borderRadius: 0.5,
          bgcolor: "#f3f4f6",
          fontFamily: "ui-monospace, monospace",
          fontSize: "0.7rem",
        }}
      >
        ⌘K
      </Typography>
    </Box>
  );

  const userBlock = (compact) => (
    <Tooltip title={`${user?.nome || user?.username || "Utilizador"} · ${isAdmin ? "Administrador" : "Operador"}`}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
        <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 12, fontWeight: 600 }}>
          {initials(user)}
        </Avatar>
        <Box
          sx={{
            lineHeight: 1.2,
            minWidth: 0,
            display: compact ? { xs: "none", sm: "block" } : "block",
          }}
        >
          <Typography fontSize={13} fontWeight={600} noWrap>
            {user?.nome || user?.username || "Utilizador"}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {isAdmin ? "Administrador" : "Operador"}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );

  const logoutButton = (
    <Button
      variant="outlined"
      size="small"
      onClick={onLogout}
      sx={{ flexShrink: 0 }}
      startIcon={
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          logout
        </span>
      }
    >
      Sair
    </Button>
  );

  return (
    <Box
      component="header"
      sx={{
        bgcolor: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        px: { xs: 2, md: 3 },
        py: 1.5,
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}
    >
      {showNavToggle ? (
        <Stack spacing={1.5} sx={{ minHeight: 48 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%", minWidth: 0 }}>
            <Tooltip title="Abrir menu">
              <IconButton
                type="button"
                color="inherit"
                onClick={onToggleNav}
                aria-label="Abrir menu de navegação"
                sx={{ display: { xs: "inline-flex", sm: "none" }, flexShrink: 0, border: "1px solid #e5e7eb" }}
              >
                <span className="material-symbols-outlined">menu</span>
              </IconButton>
            </Tooltip>
            <Button
              type="button"
              variant="outlined"
              size="small"
              onClick={onToggleNav}
              sx={{ display: { xs: "none", sm: "inline-flex" }, flexShrink: 0 }}
            >
              Menu
            </Button>
            <Box sx={{ flex: 1, minWidth: 0 }}>{searchField}</Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%", justifyContent: "space-between", minWidth: 0 }}>
            {userBlock(true)}
            {logoutButton}
          </Stack>
        </Stack>
      ) : (
        <Stack direction="row" alignItems="center" spacing={2} sx={{ minHeight: 48, width: "100%", minWidth: 0 }}>
          <Box sx={{ flex: 1, minWidth: { xs: 0, md: 280 } }}>{searchField}</Box>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0, ml: "auto" }}>
            {userBlock(false)}
            {logoutButton}
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
