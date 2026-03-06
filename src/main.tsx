import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"

// Apply saved theme before first render to prevent flash of wrong theme
;(function () {
  const stored = localStorage.getItem("theme")
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  if (stored === "dark" || (!stored && prefersDark)) {
    document.documentElement.classList.add("dark")
  }
})()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
