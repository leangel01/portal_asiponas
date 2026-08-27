import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ColorModeContextProvider } from "./contexts/color-mode";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ColorModeContextProvider>
      <App />
    </ColorModeContextProvider>
  </React.StrictMode>
);