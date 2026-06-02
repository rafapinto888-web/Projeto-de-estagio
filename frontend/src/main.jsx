/*
 * Ponto de entrada da SPA React.
 * Monta a árvore com tema MUI, reset CSS global e o componente App.
 */

import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, GlobalStyles, ThemeProvider } from "@mui/material";
import App from "./App.jsx";
import "./styles-remake.css";
import theme from "./theme";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          ":root": {
            colorScheme: "light",
          },
          body: {
            backgroundColor: "#f4f6f8",
          },
          "#root": {
            minHeight: "100vh",
            maxWidth: "100%",
            overflowX: "clip",
          },
        }}
      />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

