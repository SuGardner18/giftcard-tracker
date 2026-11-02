// src/contexts/AuthContext.jsx
import { createContext, useState, useContext } from "react"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Read once on mount: the initial value comes from localStorage if present.
  const [token, setToken] = useState(() => localStorage.getItem("token"))

  function login(newToken) {
    localStorage.setItem("token", newToken)
    setToken(newToken)
  }

  function logout() {
    localStorage.removeItem("token")
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Tiny custom hook so consumers don't have to import both useContext and AuthContext.
export const useAuth = () => useContext(AuthContext)