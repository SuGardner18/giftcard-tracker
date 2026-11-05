// src/pages/Dashboard.jsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../api/client"
import { useAuth } from "../contexts/AuthContext"

export default function Dashboard() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get("/api/v1/cards/")
      .then((data) => setCards(data))
      .catch((err) => {
        if (err.status === 401) {
          // the client already cleared the token; send the user to log in again
          logout()
          navigate("/login")
        } else {
          setError(err.body?.detail ?? err.message)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading…</p>

  return (
    <div>
      <h1>My Gift Cards</h1>
      {error && <p>Error: {error}</p>}
      {cards.length === 0 && !error && <p>You haven't added any gift cards yet.</p>}
      <ul>
        {cards.map((card) => (
          <li key={card.id}>
            <strong>{card.store_name}</strong> ****{card.card_last_four}
            <br />
            Balance: ${card.current_balance}
            {card.expiration_date && <> | Expires: {card.expiration_date}</>}
          </li>
        ))}
      </ul>
    </div>
  )
}
