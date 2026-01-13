import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { SubjectContextProvider } from "./context/SubjectContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SubjectContextProvider>
      <App />
    </SubjectContextProvider>
  </StrictMode>
);
