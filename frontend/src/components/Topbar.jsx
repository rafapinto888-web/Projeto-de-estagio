/*
 * Barra superior: pesquisa global (Ctrl+K), utilizador autenticado e logout.
 */

import { useEffect, useRef } from "react";
import { Avatar, Box, Button, InputBase, Stack, Typography } from "@mui/material";

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
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ minHeight: 48, flexWrap: { xs: "wrap", md: "nowrap" } }}
      >
        {showNavToggle ? (
          <Button type="button" variant="outlined" size="small" onClick={onToggleNav}>
            Menu
          </Button>
        ) : null}

        <Box
          sx={{
            flex: 1,
            minWidth: { xs: "100%", md: 280 },
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

        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ ml: { md: "auto" } }}>
          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ display: { xs: "none", sm: "flex" } }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 12, fontWeight: 600 }}>
              {initials(user)}
            </Avatar>
            <Box sx={{ lineHeight: 1.2, minWidth: 0 }}>
              <Typography fontSize={13} fontWeight={600} noWrap>
                {user?.nome || user?.username || "Utilizador"}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {isAdmin ? "Administrador" : "Operador"}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="outlined"
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
      </Stack>
    </Box>
  );
}
