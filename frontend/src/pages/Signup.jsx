// src/pages/Signup.jsx
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api } from "../api/client"
import { useAuth } from "../contexts/AuthContext"

export default function Signup() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState({})
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})

    // checked here in React; Django never sees the confirm box
    if (password !== confirmPassword) {
      setErrors({ confirm: ["Passwords do not match."] })
      return
    }

    try {
      await api.post("/api/v1/accounts/signup", { username, email, password })
      // auto-login: get a token with the same credentials, then go to the dashboard
      const data = await api.post("/api/v1/accounts/get-token", { username, password })
      login(data.token)
      navigate("/")
    } catch (err) {
      // DRF sends errors by field, like { email: ["This field is required."] }
      setErrors(err.body && Object.keys(err.body).length ? err.body : { form: [err.message] })
    }
  }

  return (
    <div>
      <h1>Gift Card Tracker</h1>
      <h2>Create Account</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Username{" "}
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          {errors.username && <p>{errors.username[0]}</p>}
        </div>
        <div>
          <label>
            Email{" "}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {errors.email && <p>{errors.email[0]}</p>}
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
          {errors.password && <p>{errors.password[0]}</p>}
        </div>
        <div>
          <label>
            Confirm password{" "}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>
          {errors.confirm && <p>{errors.confirm[0]}</p>}
        </div>
        <button type="submit">Create Account</button>
      </form>
      {errors.form && <p>{errors.form[0]}</p>}
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  )
}