import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ClerkRoot from "./components/auth/ClerkRoot.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ClerkRoot>
    <App />
  </ClerkRoot>,
);
