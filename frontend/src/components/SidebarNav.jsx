/* Navegação lateral com componentes MUI. */
import { Box, Chip, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";

const NAV_ICONS = {
  dashboard: "dashboard",
  inventarios: "inventory_2",
  ativos: "radar",
  computadores: "computer",
  utilizadores: "group",
  perfis: "badge",
  localizacoes: "pin_drop",
  pesquisa: "manage_search",
  "historico-conta": "history",
  logs: "receipt_long",
};

function iconForTab(tabId) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
      {NAV_ICONS[tabId] || "dashboard"}
    </span>
  );
}

export default function SidebarNav({ tabs, activeTab, onSelect }) {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 280,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          position: "relative",
          width: 280,
          boxSizing: "border-box",
          borderRight: "1px solid #e2e8f0",
          p: 2,
          backgroundColor: "#fff",
          borderRadius: "12px",
          height: "100%",
        },
      }}
    >
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: "primary.main",
              bgcolor: "#eaf2ff",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              inventory_2
            </span>
          </Box>
          <Box>
            <Typography fontWeight={700} fontSize={14}>
              Sistema de Inventário
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Painel administrativo
            </Typography>
          </Box>
        </Box>

        <List sx={{ py: 0 }}>
          {tabs.map((tab) => (
            <ListItemButton
              key={tab.id}
              selected={activeTab === tab.id}
              onClick={() => onSelect(tab.id)}
              sx={{
                mb: 0.5,
                borderRadius: 2,
                "&.Mui-selected": {
                  bgcolor: "#eff6ff",
                  color: "primary.main",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>{iconForTab(tab.id)}</ListItemIcon>
              <ListItemText primary={tab.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ mt: "auto", p: 1, border: "1px solid #e2e8f0", borderRadius: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" color="success" label="Online" />
            <Box>
              <Typography fontSize={12} fontWeight={700}>
                Sistema operacional
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Ligação estável ao servidor.
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Drawer>
  );
}
