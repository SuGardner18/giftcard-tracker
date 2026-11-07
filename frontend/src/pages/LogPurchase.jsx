// src/pages/LogPurchase.jsx
import { useEffect, useState } from "react"
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import InputAdornment from "@mui/material/InputAdornment"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { api } from "../api/client"
import { useAuth } from "../contexts/AuthContext"
import { formatMoney } from "../utilities/cards"

export default function LogPurchase() {
  const { id } = useParams()
  const [card, setCard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [note, setNote] = useState("")
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
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

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      await api.post(`/api/v1/cards/${id}/transactions/`, { amount, date, note })
      navigate(`/cards/${id}`)
    } catch (err) {
      // DRF sends errors by field, like { amount: ["This is more than the card's balance of $30.00."] }
      setErrors(err.body && Object.keys(err.body).length ? err.body : { form: [err.message] })
      setSaving(false)
    }
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
    <Paper sx={{ p: 4, maxWidth: 640, mx: "auto" }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        Log a Purchase
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {card.store_name} ****{card.card_last_four} · Available balance {formatMoney(card.current_balance)}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Amount"
            required
            autoFocus
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={Boolean(errors.amount)}
            helperText={errors.amount?.[0]}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
              htmlInput: { min: 0.01, step: "0.01" },
            }}
          />

          <TextField
            label="Date"
            required
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={Boolean(errors.date)}
            helperText={errors.date?.[0]}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            error={Boolean(errors.note)}
            helperText={errors.note?.[0]}
          />

          {errors.error && <Alert severity="error">{errors.error}</Alert>}
          {errors.form && <Alert severity="error">{errors.form[0]}</Alert>}

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button component={RouterLink} to={`/cards/${id}`}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              Save Purchase
            </Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  )
}
