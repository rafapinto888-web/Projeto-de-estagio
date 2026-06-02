/*
 * Tema Material UI partilhado pela aplicação.
 * Paleta, tipografia e overrides de componentes (botões, tabelas, diálogos).
 */

import { createTheme } from "@mui/material/styles";

/** Design system — operações IT (paleta clara, bordas suaves). */
const theme = createTheme({
  spacing: 8,
  palette: {
    mode: "light",
    primary: {
      main: "#4f46e5",
      light: "#6366f1",
      dark: "#4338ca",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#71717a",
      light: "#a1a1aa",
      dark: "#52525b",
    },
    success: {
      main: "#16a34a",
      light: "#22c55e",
      dark: "#15803d",
    },
    warning: {
      main: "#ca8a04",
      light: "#eab308",
      dark: "#a16207",
    },
    error: {
      main: "#dc2626",
      light: "#ef4444",
      dark: "#b91c1c",
    },
    background: {
      default: "#f4f4f5",
      paper: "#ffffff",
    },
    text: {
      primary: "#18181b",
      secondary: "#52525b",
    },
    divider: "#e4e4e7",
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
    h1: {
      fontSize: "1.5rem",
      fontWeight: 700,
      letterSpacing: "-0.025em",
      lineHeight: 1.25,
    },
    h2: {
      fontSize: "1.125rem",
      fontWeight: 600,
      letterSpacing: "-0.02em",
      lineHeight: 1.35,
    },
    h3: {
      fontSize: "0.9375rem",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    subtitle2: {
      fontSize: "0.8125rem",
      fontWeight: 500,
      color: "#71717a",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    caption: {
      fontSize: "0.75rem",
      color: "#71717a",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#f4f4f5",
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 10,
          border: "1px solid #e4e4e7",
          boxShadow: "0 1px 2px rgba(24, 24, 27, 0.04)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 36,
          borderRadius: 8,
          paddingInline: 14,
          fontSize: "0.875rem",
        },
        contained: {
          backgroundColor: "#4f46e5",
          "&:hover": {
            backgroundColor: "#4338ca",
          },
        },
        outlined: {
          borderColor: "#d4d4d8",
          color: "#3f3f46",
          backgroundColor: "#ffffff",
          "&:hover": {
            borderColor: "#a1a1aa",
            backgroundColor: "#fafafa",
          },
        },
        text: {
          color: "#4f46e5",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: "#ffffff",
          fontSize: "0.875rem",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#9ca3af",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6366f1",
            borderWidth: 1,
          },
        },
        notchedOutline: {
          borderColor: "#e4e4e7",
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          fontSize: "0.875rem",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#fafafa",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "#f3f4f6",
          fontSize: "0.875rem",
          padding: "10px 14px",
        },
        head: {
          fontWeight: 600,
          fontSize: "0.75rem",
          color: "#71717a",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          whiteSpace: "nowrap",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-child td": {
            borderBottom: 0,
          },
          "&:hover td": {
            backgroundColor: "#fafafa",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: "0.75rem",
          borderRadius: 6,
        },
        sizeSmall: {
          height: 24,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: "1px solid #e4e4e7",
          boxShadow: "0 16px 48px rgba(24, 24, 27, 0.1)",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: "1px solid #e4e4e7",
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "#f3f4f6",
        },
      },
    },
  },
});

export default theme;
