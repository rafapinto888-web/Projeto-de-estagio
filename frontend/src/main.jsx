/* Comentario geral deste ficheiro: contem partes importantes da interface e comportamento. */

import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, GlobalStyles, ThemeProvider } from "@mui/material";
import App from "./App.jsx";
import "./styles.css";
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
          },
        }}
      />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

