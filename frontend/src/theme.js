import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  spacing: 8,
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
      light: "#3b82f6",
      dark: "#1d4ed8",
    },
    secondary: {
      main: "#6d28d9",
      light: "#8b5cf6",
      dark: "#5b21b6",
    },
    success: {
      main: "#16a34a",
    },
    warning: {
      main: "#d97706",
    },
    error: {
      main: "#dc2626",
    },
    background: {
      default: "#f3f6fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#334155",
    },
    divider: "#dbe5f2",
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "DM Sans", "Segoe UI", sans-serif',
    h1: {
      fontSize: "1.75rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "1.3rem",
      fontWeight: 800,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontSize: "1.04rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    body2: {
      fontSize: "0.86rem",
    },
    button: {
      textTransform: "none",
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
  },
  components: {
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid #dbe5f2",
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        variant: "contained",
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 36,
          borderRadius: 10,
          paddingInline: 14,
          lineHeight: 1.15,
          whiteSpace: "nowrap",
        },
        contained: {
          background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
        },
        outlined: {
          borderWidth: 1,
          borderColor: "#cfdced",
          color: "#1e3a8a",
          backgroundColor: "#ffffff",
          "&:hover": {
            borderColor: "#93b4f0",
            backgroundColor: "#eef5ff",
          },
        },
        text: {
          color: "#1d4ed8",
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
        fullWidth: true,
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "#fff",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#94a3b8",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          color: "#475569",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#f1f5f9",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: "#e2e8f0",
        },
        head: {
          fontWeight: 700,
          color: "#1e293b",
          fontSize: "0.76rem",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(even) td": {
            backgroundColor: "#fbfdff",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 9,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: 99,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: "1px solid #dbe5f2",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          border: "1px solid #dbe5f2",
        },
      },
    },
  },
});

export default theme;
