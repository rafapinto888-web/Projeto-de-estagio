import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  spacing: 8,
  palette: {
    mode: "light",
    primary: {
      main: "#1d4ed8",
      light: "#3b82f6",
      dark: "#1e40af",
    },
    secondary: {
      main: "#7c3aed",
      light: "#8b5cf6",
      dark: "#6d28d9",
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
      default: "#eef3fb",
      paper: "#ffffff",
    },
    text: {
      primary: "#0f172a",
      secondary: "#334155",
    },
    divider: "#dbe5f2",
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "DM Sans", "Segoe UI", sans-serif',
    h1: {
      fontSize: "1.65rem",
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "1.25rem",
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
          borderRadius: 14,
          border: "1px solid #dbe5f2",
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
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
        },
        outlined: {
          borderWidth: 1,
          borderColor: "#cfdced",
          color: "#1e3a8a",
          backgroundColor: "#f8fbff",
        },
        text: {
          color: "#1d4ed8",
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
          borderRadius: 11,
          backgroundColor: "#fff",
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
          backgroundColor: "#f8fbff",
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
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 700,
          borderRadius: 8,
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
