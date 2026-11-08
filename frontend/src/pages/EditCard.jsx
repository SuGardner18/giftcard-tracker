// src/pages/EditCard.jsx
import { useEffect, useState } from "react"
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { api } from "../api/client"
import { useAuth } from "../contexts/AuthContext"
import CardForm from "../components/CardForm"

export default function EditCard() {
  const { id } = useParams()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/api/v1/cards/${id}/`)
      .then((data) => setCard(data))
      .catch((err) => {
        if (err.status === 401) {
          // the client already cleared the token; send the user to log in again
          logout()
          navigate("/login")
        } else if (err.status === 404) {
          setError("We couldn't find that card.")
        } else {
          setError(err.body?.detail ?? err.message)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave(payload) {
    await api.put(`/api/v1/cards/${id}/`, payload)
    navigate(`/cards/${id}`)
  }

  if (loading) return <CircularProgress aria-label="Loading this card" />

  if (error) {
    return (
      <>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />}>
          Back to Dashboard
        </Button>
      </>
    )
  }

  return (
    <CardForm
      title="Edit Gift Card"
      submitLabel="Save Changes"
      cancelTo={`/cards/${id}`}
      onSubmit={handleSave}
      initial={{
        storeName: card.store_name,
        storeDomain: card.store_domain ?? "",
        lastFour: card.card_last_four,
        balance: card.starting_balance,
        expirationDate: card.expiration_date ?? "",
        nickname: card.nickname ?? "",
      }}
    />
  )
}
