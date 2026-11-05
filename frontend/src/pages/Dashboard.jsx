// src/pages/Dashboard.jsx
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import Alert from "@mui/material/Alert"
import CircularProgress from "@mui/material/CircularProgress"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import { api } from "../api/client"
import { useAuth } from "../contexts/AuthContext"
import GiftCardTile from "../components/GiftCardTile"

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

  if (loading) return <CircularProgress aria-label="Loading your gift cards" />

  return (
    <>
      <Typography variant="h4" component="h1" sx={{ mb: 4 }}>
        My Gift Cards
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error: {error}
        </Alert>
      )}

      {cards.length === 0 && !error && (
        <Typography color="text.secondary">You haven't added any gift cards yet.</Typography>
      )}

      <Grid container spacing={3}>
        {cards.map((card) => (
          <Grid key={card.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <GiftCardTile card={card} />
          </Grid>
        ))}
      </Grid>
    </>
  )
}
