/*
 * Menu lateral: drawer temporário em mobile e permanente em desktop.
 */
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";

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
    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
      {NAV_ICONS[tabId] || "dashboard"}
    </span>
  );
}

/** Conteúdo partilhado do drawer (logo + lista de abas). */
function MenuContent({ tabs, activeTab, onSelect, mobile = false, onClose }) {
  return (
    <>
      <Box
        sx={{
          px: 2,
          py: 2.25,
          borderBottom: "1px solid",
          borderColor: "divider",
          mb: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              display: "grid",
              placeItems: "center",
              bgcolor: "primary.main",
              color: "primary.contrastText",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              hub
            </span>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={700} fontSize={14} lineHeight={1.2} noWrap>
              Inventário IT
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Gestão e monitorização
            </Typography>
          </Box>
        </Box>
      </Box>

      <List dense sx={{ px: 1.25, py: 0.5 }}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <ListItemButton
              key={tab.id}
              selected={selected}
              onClick={() => {
                onSelect(tab.id);
                if (mobile) onClose?.();
              }}
              sx={{
                mb: 0.25,
                minHeight: 40,
                borderRadius: 1,
                color: selected ? "primary.main" : "text.secondary",
                "&.Mui-selected": {
                  bgcolor: "#eff6ff",
                  color: "primary.main",
                  "&:hover": { bgcolor: "#dbeafe" },
                  "& .MuiListItemIcon-root": { color: "primary.main" },
                },
                "&:hover": {
                  bgcolor: "#f9fafb",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: "inherit",
                }}
              >
                {iconForTab(tab.id)}
              </ListItemIcon>
              <ListItemText
                primary={tab.label}
                primaryTypographyProps={{
                  fontSize: "0.875rem",
                  fontWeight: selected ? 600 : 500,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </>
  );
}

export default function SidebarNav({ tabs, activeTab, onSelect, mobile = false, open = true, onClose }) {
  const paperSx = {
    width: 260,
    boxSizing: "border-box",
    bgcolor: "#ffffff",
    borderRight: "1px solid #e5e7eb",
    borderRadius: 0,
    boxShadow: "none",
  };

  if (mobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": paperSx,
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
        width: 260,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          ...paperSx,
          position: "relative",
          height: "100%",
        },
      }}
    >
      <MenuContent tabs={tabs} activeTab={activeTab} onSelect={onSelect} />
    </Drawer>
  );
}
