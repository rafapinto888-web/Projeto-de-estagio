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
          body: {
            backgroundColor: "#f3f6fb",
          },
        }}
      />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);

