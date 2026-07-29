import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeAnonymousAuth } from "./lib/firebase";

async function initApp() {
  try {
    await initializeAnonymousAuth();
  } catch (error) {
    console.error("Firebase auth initialization failed:", error);
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

initApp();
