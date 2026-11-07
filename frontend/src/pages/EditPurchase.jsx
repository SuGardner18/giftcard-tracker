// src/pages/EditPurchase.jsx
import { useEffect, useState } from "react"
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { api } from "../api/client"
import { useAuth } from "../contexts/AuthContext"
import PurchaseForm from "../components/PurchaseForm"

export default function EditPurchase() {
  const { id, purchaseId } = useParams()
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
    await api.put(`/api/v1/cards/${id}/transactions/${purchaseId}/`, payload)
    navigate(`/cards/${id}`)
  }

  if (loading) return <CircularProgress aria-label="Loading this purchase" />

  // the card comes with its purchases; pick out the one in the address
  const purchase = card ? card.transactions.filter((t) => t.id === Number(purchaseId))[0] : null

  if (loadError || !purchase) {
    return (
      <>
        <Alert severity="error" sx={{ mb: 3 }}>
          {loadError ?? "We couldn't find that purchase."}
        </Alert>
        <Button component={RouterLink} to={`/cards/${id}`} startIcon={<ArrowBackIcon />}>
          Back to the card
        </Button>
      </>
    )
  }

  return (
    <PurchaseForm
      title="Edit Purchase"
      subtitle={`${card.store_name} ****${card.card_last_four}`}
      submitLabel="Save Changes"
      cancelTo={`/cards/${id}`}
      onSubmit={handleSave}
      initial={{
        amount: purchase.amount,
        date: purchase.date,
        note: purchase.note ?? "",
      }}
    />
  )
}
