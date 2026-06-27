import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom" // ✅ Agregar import
import { AuthProvider } from "./context/AuthContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import "./index.css"
import App from "./App.jsx"

const queryClient = new QueryClient()

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* ✅ Envolver TODO con BrowserRouter para que useLocation funcione */}
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {/* ✅ Fondo oscuro explícito para evitar destellos blancos en transiciones */}
          <div className="min-h-screen bg-[#0f0f0f] text-white">
            <App />
          </div>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
)