import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed silently
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
