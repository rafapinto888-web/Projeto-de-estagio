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
            backgroundColor: "#eef3fb",
            backgroundImage:
              "radial-gradient(900px 420px at 10% -8%, rgba(59,130,246,0.14), transparent 56%), radial-gradient(700px 380px at 92% -5%, rgba(124,58,237,0.10), transparent 52%)",
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

