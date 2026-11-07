// src/pages/LogPurchase.jsx
import { useEffect, useState } from "react"
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { api } from "../api/client"
import { useAuth } from "../contexts/AuthContext"
import PurchaseForm from "../components/PurchaseForm"
import { formatMoney } from "../utilities/cards"

export default function LogPurchase() {
  const { id } = useParams()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
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
          setLoadError("We couldn't find that card.")
        } else {
          setLoadError(err.body?.detail ?? err.message)
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave(payload) {
    await api.post(`/api/v1/cards/${id}/transactions/`, payload)
    navigate(`/cards/${id}`)
  }

  if (loading) return <CircularProgress aria-label="Loading this card" />

  if (loadError) {
    return (
      <>
        <Alert severity="error" sx={{ mb: 3 }}>
          {loadError}
        </Alert>
        <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />}>
          Back to Dashboard
        </Button>
      </>
    )
  }

  return (
    <PurchaseForm
      title="Log a Purchase"
      subtitle={`${card.store_name} ****${card.card_last_four} · Available balance ${formatMoney(card.current_balance)}`}
      submitLabel="Save Purchase"
      cancelTo={`/cards/${id}`}
      onSubmit={handleSave}
    />
  )
}
