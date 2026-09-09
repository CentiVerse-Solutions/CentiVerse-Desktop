import React, { createContext, useState, useEffect, useMemo } from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Create the context
export const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
  isDarkMode: false,
});

// Define theme colors
const lightPalette = {
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
  background: {
    default: "#f8f9fa",
    paper: "#ffffff",
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
};

const darkPalette = {
  primary: {
    main: "#84b59f", // tealLight
    light: "#a3c9a8", // sage
    dark: "#50808e", // tealDark
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#a3c9a8", // sage
    light: "#ddd8c4", // cream
    dark: "#1a242f", // darkened darkAccent
    contrastText: "#ffffff",
  },
  text: {
    primary: "#ecf0f1", // light text for dark mode
    secondary: "#b0bec5", // lighter secondary text
  },
  background: {
    default: "#1a242f", // dark background
    paper: "#2c3e50", // dark paper
  },
  action: {
    active: "#84b59f", // tealLight
    hover: "rgba(132, 181, 159, 0.08)", // tealLight with opacity
    selected: "rgba(132, 181, 159, 0.16)", // tealLight with opacity
  },
  expense: {
    main: "#6fa0ae", // lighter tealDark
    background: "rgba(111, 160, 174, 0.1)", // lighter tealDark with opacity
  },
  payment: {
    main: "#ce93d8", // lighter purple
    background: "rgba(206, 147, 216, 0.1)",
  },
  settlement: {
    main: "#81c784", // lighter green
    background: "rgba(129, 199, 132, 0.1)",
  },
  youOwe: {
    main: "#ffb74d", // lighter orange
    background: "rgba(255, 183, 77, 0.1)",
  },
  youAreOwed: {
    main: "#64b5f6", // lighter blue
    background: "rgba(100, 181, 246, 0.1)",
  },
};

// Common theme settings
const commonThemeSettings = {
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
};

// Create the provider component
export const ThemeProvider = ({ children }) => {
  // Check localStorage for theme preference or default to light
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem("theme-mode");
    return savedMode || "light";
  });

  // Create the MUI theme
  const theme = useMemo(() => {
    const currentPalette = mode === "dark" ? darkPalette : lightPalette;

    return createTheme({
      palette: {
        mode: mode,
        ...currentPalette,
      },
      ...commonThemeSettings,
      components: {
        MuiCard: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              boxShadow:
                mode === "light"
                  ? "0 3px 10px rgba(0, 0, 0, 0.04)"
                  : "0 3px 10px rgba(0, 0, 0, 0.2)",
              transition: "box-shadow 0.3s ease, transform 0.3s ease",
              "&:hover": {
                boxShadow:
                  mode === "light"
                    ? "0 5px 15px rgba(0, 0, 0, 0.08)"
                    : "0 5px 15px rgba(0, 0, 0, 0.4)",
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
              backgroundColor:
                mode === "light"
                  ? "rgba(0, 0, 0, 0.12)"
                  : "rgba(255, 255, 255, 0.12)",
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: "none",
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
              },
            },
            containedPrimary: {
              "&:hover": {
                backgroundColor: mode === "light" ? "#50808e" : "#84b59f",
              },
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: {
              boxShadow:
                mode === "light"
                  ? "0 1px 3px rgba(0, 0, 0, 0.05)"
                  : "0 1px 3px rgba(0, 0, 0, 0.2)",
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor:
                  mode === "light"
                    ? lightPalette.primary.main
                    : darkPalette.primary.main,
              },
            },
          },
        },
      },
    });
  }, [mode]);

  // Toggle between light and dark mode
  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("theme-mode", newMode);

    // Also update CSS variables for non-MUI components
    updateCssVariables(newMode);
  };

  // Set up CSS variables for non-MUI components
  const updateCssVariables = (currentMode) => {
    const root = document.documentElement;
    const palette = currentMode === "dark" ? darkPalette : lightPalette;

    // Set CSS variables
    root.style.setProperty("--teal", palette.primary.main);
    root.style.setProperty("--teal-light", palette.primary.light);
    root.style.setProperty("--teal-dark", palette.primary.dark);
    root.style.setProperty("--sage", palette.secondary.main);
    root.style.setProperty("--cream", palette.secondary.light);
    root.style.setProperty("--dark-accent", palette.secondary.dark);
    root.style.setProperty("--text-primary", palette.text.primary);
    root.style.setProperty("--text-secondary", palette.text.secondary);
    root.style.setProperty("--background", palette.background.default);
    root.style.setProperty("--paper", palette.background.paper);
  };

  // Initialize CSS variables
  useEffect(() => {
    updateCssVariables(mode);

    // Apply some global styles
    document.body.style.backgroundColor =
      mode === "light" ? "#f8f9fa" : "#1a242f";
    document.body.style.color = mode === "light" ? "#2c3e50" : "#ecf0f1";

    // Optional: Add a class to the body for additional CSS targeting
    if (mode === "dark") {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [mode]);

  // Context value
  const contextValue = {
    theme: mode,
    toggleTheme,
    isDarkMode: mode === "dark",
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook for accessing theme context
export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
