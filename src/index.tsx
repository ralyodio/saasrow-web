import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Home } from "./screens/Home";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);
