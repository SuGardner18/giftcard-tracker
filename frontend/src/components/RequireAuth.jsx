// src/components/RequireAuth.jsx
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

export default function RequireAuth({ children }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}