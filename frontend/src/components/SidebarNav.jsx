/*
 * Menu lateral em drawer (sempre sobreposto): fechado por defeito — não reserva espaço no layout.
 */
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";

/** Largura do painel ao abrir o menu. */
export const SIDEBAR_DRAWER_PX = 288;

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

/** @deprecated mantido por compatibilidade; usa SIDEBAR_DRAWER_PX */
export const SIDEBAR_DESKTOP_PX = SIDEBAR_DRAWER_PX;

function iconForTab(tabId) {
  return (
    <span className="material-symbols-outlined sidebar-nav-ic" aria-hidden>
      {NAV_ICONS[tabId] || "dashboard"}
    </span>
  );
}

const paperLightSx = {
  width: SIDEBAR_DRAWER_PX,
  maxWidth: "min(288px, 92vw)",
  boxSizing: "border-box",
  bgcolor: "#fafafa",
  backgroundImage: "linear-gradient(180deg, #ffffff 0%, #fafafa 48%, #f4f4f5 100%)",
  borderRight: "1px solid rgba(24, 24, 27, 0.08)",
  boxShadow: "12px 0 40px rgba(24, 24, 27, 0.12)",
  color: "#18181b",
};

function MenuContent({ tabs, activeTab, onSelect, onClose }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          px: 2.25,
          py: 2.25,
          borderBottom: "1px solid rgba(24, 24, 27, 0.06)",
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              color: "#fff",
              boxShadow: "0 6px 20px rgba(79, 70, 229, 0.35)",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              hub
            </span>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography fontWeight={800} fontSize={15} lineHeight={1.25} noWrap sx={{ color: "#09090b" }}>
              Inventário IT
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: "#71717a", fontSize: "0.75rem" }}>
              Menu de navegação
            </Typography>
          </Box>
        </Box>
      </Box>

      <Typography
        variant="overline"
        sx={{
          px: 2.5,
          pt: 1.75,
          pb: 0.5,
          fontSize: "0.65rem",
          letterSpacing: "0.12em",
          fontWeight: 700,
          color: "#a1a1aa",
        }}
      >
        Secções
      </Typography>

      <List dense sx={{ px: 1.5, py: 0.5, flex: 1, overflowY: "auto" }}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <ListItemButton
              key={tab.id}
              selected={selected}
              onClick={() => {
                onSelect(tab.id);
                onClose?.();
              }}
              sx={{
                mb: 0.35,
                minHeight: 44,
                borderRadius: 2,
                pl: 1.25,
                color: selected ? "#312e81" : "#3f3f46",
                borderLeft: "3px solid",
                borderColor: selected ? "#6366f1" : "transparent",
                bgcolor: selected ? "rgba(99, 102, 241, 0.12)" : "transparent",
                "&.Mui-selected": {
                  bgcolor: "rgba(99, 102, 241, 0.12)",
                  "&:hover": { bgcolor: "rgba(99, 102, 241, 0.18)" },
                },
                "&:hover": {
                  bgcolor: selected ? "rgba(99, 102, 241, 0.18)" : "rgba(24, 24, 27, 0.04)",
                },
                "& .MuiListItemIcon-root": {
                  color: selected ? "#4f46e5" : "#71717a",
                  minWidth: 40,
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{iconForTab(tab.id)}</ListItemIcon>
              <ListItemText
                primary={tab.label}
                primaryTypographyProps={{
                  fontSize: "0.9rem",
                  fontWeight: selected ? 650 : 500,
                  letterSpacing: "-0.01em",
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Box
        sx={{
          mt: "auto",
          px: 2,
          py: 1.5,
          borderTop: "1px solid rgba(24, 24, 27, 0.06)",
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" sx={{ color: "#a1a1aa", fontSize: "0.7rem" }}>
          Fecha o menu ou escolhe uma secção
        </Typography>
      </Box>
    </Box>
  );
}

/**
 * Drawer lateral: abre por botão na topbar; não empurra o conteúdo (overlay).
 */
export default function SidebarNav({ tabs, activeTab, onSelect, open = false, onClose }) {
  return (
    <Drawer
      variant="temporary"
      anchor="left"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      sx={{
        zIndex: (theme) => theme.zIndex.drawer,
        "& .MuiDrawer-paper": {
          ...paperLightSx,
          borderRadius: 0,
        },
      }}
    >
      <MenuContent tabs={tabs} activeTab={activeTab} onSelect={onSelect} onClose={onClose} />
    </Drawer>
  );
}
