import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeAnonymousAuth } from "./lib/firebase";

initializeAnonymousAuth().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);
