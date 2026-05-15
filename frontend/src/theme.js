import { createTheme } from "@mui/material/styles";

/** Design system — enterprise IT ops (Linear / Defender / UniFi / Vercel). */
const theme = createTheme({
  spacing: 8,
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
      light: "#3b82f6",
      dark: "#1d4ed8",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#64748b",
      light: "#94a3b8",
      dark: "#475569",
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
      default: "#f4f6f8",
      paper: "#ffffff",
    },
    text: {
      primary: "#111827",
      secondary: "#6b7280",
    },
    divider: "#e5e7eb",
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
      color: "#6b7280",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
    },
    caption: {
      fontSize: "0.75rem",
      color: "#6b7280",
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
          backgroundColor: "#f4f6f8",
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 2px rgba(17, 24, 39, 0.04)",
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
          backgroundColor: "#2563eb",
          "&:hover": {
            backgroundColor: "#1d4ed8",
          },
        },
        outlined: {
          borderColor: "#d1d5db",
          color: "#374151",
          backgroundColor: "#ffffff",
          "&:hover": {
            borderColor: "#9ca3af",
            backgroundColor: "#f9fafb",
          },
        },
        text: {
          color: "#2563eb",
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
            borderColor: "#2563eb",
            borderWidth: 1,
          },
        },
        notchedOutline: {
          borderColor: "#e5e7eb",
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
          backgroundColor: "#f9fafb",
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
          color: "#6b7280",
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
            backgroundColor: "#f9fafb",
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
          border: "1px solid #e5e7eb",
          boxShadow: "0 16px 48px rgba(17, 24, 39, 0.12)",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: "1px solid #e5e7eb",
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
