import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function AuthCallbackPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get("token")

    if (token) {
      login(token)
    } else {
      navigate("/login")
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard")
    }
  }, [isAuthenticated])

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <p className="text-white">Iniciando sesión...</p>
    </div>
  )
}