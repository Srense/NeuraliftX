import React, { createContext, useState, useEffect } from "react";

// Default theme
const defaultTheme = {
  name: "default",
  primary: "#6366f1",
  secondary: "#4f46e5",
  background: "#f5f6fa",
  surface: "#fff",
  text: "#222e3a",
  sidebarBg: "linear-gradient(160deg, #1e1e2f 70%, #353772 150%)",
  // ...others as needed
};

const themes = {
  default: defaultTheme,
  darkgreen: {
    name: "darkgreen",
    primary: "#32a852",         // from screenshot
    secondary: "#227e3a",
    background: "#101915",
    surface: "#1b2b21",
    text: "#e2fff2",
    sidebarBg: "linear-gradient(160deg, #227e3a 70%, #32a852 150%)",
  },
  night: {
    name: "night",
    primary: "#23253f",
    secondary: "#424264",
    background: "#141521",
    surface: "#222337",
    text: "#dde0f0",
    sidebarBg: "linear-gradient(160deg, #23253f 70%, #464a78 150%)",
  },
  // Add more custom themes here!
};

const ThemeContext = createContext({
  theme: defaultTheme,
  setThemeName: () => {},
  allThemes: themes,
});

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState(
    localStorage.getItem("themeName") || "default"
  );
  const theme = themes[themeName] || defaultTheme;

  useEffect(() => {
    localStorage.setItem("themeName", themeName);
    // Set CSS vars for easy theming
    for (const [key, value] of Object.entries(theme)) {
      document.documentElement.style.setProperty(`--${key}`, value);
    }
  }, [theme, themeName]);

  return (
    <ThemeContext.Provider value={{ theme, setThemeName, allThemes: themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
