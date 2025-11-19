// theme.js - Custom MUI theme to match your color palette

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#69a297", // teal
      light: "#84b59f", // tealLight
      dark: "#50808e", // tealDark
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#a3c9a8", // sage
      light: "#ddd8c4", // cream
      dark: "#2c3e50", // darkAccent
      contrastText: "#ffffff",
    },
    text: {
      primary: "#2c3e50", // darkAccent
      secondary: "#607d8b",
    },
    action: {
      active: "#69a297", // teal
      hover: "rgba(105, 162, 151, 0.08)", // teal with opacity
      selected: "rgba(105, 162, 151, 0.16)", // teal with opacity
    },
    expense: {
      main: "#50808e", // tealDark
      background: "rgba(80, 128, 142, 0.1)", // tealDark with opacity
    },
    payment: {
      main: "#9c27b0",
      background: "rgba(156, 39, 176, 0.1)",
    },
    settlement: {
      main: "#4caf50", // settled color
      background: "rgba(76, 175, 80, 0.1)", // settled background
    },
    youOwe: {
      main: "#ff9800",
      background: "rgba(255, 152, 0, 0.1)",
    },
    youAreOwed: {
      main: "#2196f3",
      background: "rgba(33, 150, 243, 0.1)",
    },
  },
  typography: {
    fontFamily: [
      "Inter",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
    ].join(","),
    h6: {
      fontSize: "1.1rem",
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 500,
    },
    body1: {
      fontSize: "0.9rem",
    },
    body2: {
      fontSize: "0.85rem",
    },
    caption: {
      fontSize: "0.8rem",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 3px 10px rgba(0, 0, 0, 0.04)",
          transition: "box-shadow 0.3s ease, transform 0.3s ease",
          "&:hover": {
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.08)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 12,
        },
        sizeSmall: {
          height: 20,
          fontSize: "0.7rem",
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          "&:last-child": {
            paddingBottom: 20,
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          margin: "16px 0",
        },
      },
    },
  },
});

export default theme;
