/* Navegação lateral com componentes MUI. */
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from "@mui/material";

const NAV_ICONS = {
  dashboard: "dashboard",
  inventarios: "inventory_2",
  ativos: "radar",
  computadores: "computer",
  utilizadores: "group",
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

function MenuContent({ tabs, activeTab, onSelect, mobile = false, onClose }) {
  return (
    <Stack spacing={1.75} sx={{ height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.4, px: 0.75, py: 0.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            color: "#1d4ed8",
            bgcolor: "#eaf2ff",
            border: "1px solid #dbeafe",
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            inventory_2
          </span>
        </Box>
        <Box>
          <Typography fontWeight={800} fontSize={14} color="#0f172a">
            Sistema de Inventário
          </Typography>
          <Typography variant="caption" color="#64748b">
            Painel administrativo
          </Typography>
        </Box>
      </Box>

      <List sx={{ py: 0, px: 0.5 }}>
        {tabs.map((tab) => (
          <ListItemButton
            key={tab.id}
            selected={activeTab === tab.id}
            onClick={() => {
              onSelect(tab.id);
              if (mobile) onClose?.();
            }}
            sx={{
              mb: 0.5,
              borderRadius: 2.5,
              minHeight: 42,
              color: "#334155",
              "&:hover": {
                bgcolor: "#f1f6ff",
              },
              "&.Mui-selected": {
                bgcolor: "#dbeafe",
                color: "#1d4ed8",
                border: "1px solid #bfdbfe",
                boxShadow: "0 6px 14px rgba(59,130,246,0.18)",
              },
              "&.Mui-selected:hover": {
                bgcolor: "#bfdbfe",
              },
              "& .MuiListItemIcon-root": {
                minWidth: 34,
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: "inherit",
                "& .material-symbols-outlined": {
                  fontSize: 19,
                },
              }}
            >
              {iconForTab(tab.id)}
            </ListItemIcon>
            <ListItemText primary={tab.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} />
          </ListItemButton>
        ))}
      </List>
    </Stack>
  );
}

export default function SidebarNav({ tabs, activeTab, onSelect, mobile = false, open = true, onClose }) {
  if (mobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            width: 272,
            boxSizing: "border-box",
            border: "1px solid #dbe5f2",
            p: 1.75,
            background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
            color: "#0f172a",
            boxShadow: "0 14px 28px rgba(15,23,42,0.12)",
          },
        }}
      >
        <MenuContent tabs={tabs} activeTab={activeTab} onSelect={onSelect} mobile onClose={onClose} />
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: "none", lg: "block" },
        width: { xs: 252, xl: 272 },
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          position: "relative",
          width: { xs: 252, xl: 272 },
          boxSizing: "border-box",
          border: "1px solid #dbe5f2",
          p: 1.75,
          background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
          borderRadius: "16px",
          height: "100%",
          color: "#0f172a",
          boxShadow: "0 10px 34px rgba(15,23,42,0.06)",
        },
      }}
    >
      <MenuContent tabs={tabs} activeTab={activeTab} onSelect={onSelect} />
    </Drawer>
  );
}
