// src/pages/Login.jsx
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api } from "../api/client"
import { useAuth } from "../contexts/AuthContext"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    try {
      const data = await api.post("/api/v1/accounts/get-token", { username, password })
      login(data.token)
      navigate("/")
    } catch (err) {
      // a wrong password comes back as non_field_errors from DRF
      setError(err.body?.non_field_errors?.[0] ?? err.message)
    }
  }

  return (
    <div>
      <h1>Gift Card Tracker</h1>
      <h2>Log In</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Username{" "}
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
        </div>
        <div>
          <label>
            Password{" "}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
        </div>
        <button type="submit">Log In</button>
      </form>
      {error && <p>{error}</p>}
            <p>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  )
}