/* Navegação lateral com componentes MUI. */
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";

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
        width: { xs: 252, xl: 272 },
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          position: "relative",
          width: { xs: 252, xl: 272 },
          boxSizing: "border-box",
          border: "1px solid #dbe5f2",
          p: 1.75,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.96) 100%)",
          borderRadius: "16px",
          height: "100%",
          boxShadow: "0 10px 34px rgba(15,23,42,0.05)",
        },
      }}
    >
      <Stack spacing={1.75} sx={{ height: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.4, px: 0.75, py: 0.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: "primary.main",
              bgcolor: "#eaf2ff",
              border: "1px solid #dbeafe",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              inventory_2
            </span>
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize={14}>
              Sistema de Inventário
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Painel administrativo
            </Typography>
          </Box>
        </Box>

        <List sx={{ py: 0, px: 0.5 }}>
          {tabs.map((tab) => (
            <ListItemButton
              key={tab.id}
              selected={activeTab === tab.id}
              onClick={() => onSelect(tab.id)}
              sx={{
                mb: 0.5,
                borderRadius: 2.5,
                minHeight: 40,
                color: "#334155",
                "&:hover": {
                  bgcolor: "#f1f6ff",
                },
                "&.Mui-selected": {
                  bgcolor: "#eaf1ff",
                  color: "primary.main",
                  border: "1px solid #dbeafe",
                },
                "& .MuiListItemIcon-root": {
                  minWidth: 34,
                },
              }}
            >
              <ListItemIcon sx={{ color: "inherit" }}>{iconForTab(tab.id)}</ListItemIcon>
              <ListItemText primary={tab.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
            </ListItemButton>
          ))}
        </List>
      </Stack>
    </Drawer>
  );
}
