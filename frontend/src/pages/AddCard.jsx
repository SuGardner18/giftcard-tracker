// src/pages/AddCard.jsx
import { useState } from "react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import InputAdornment from "@mui/material/InputAdornment"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { api } from "../api/client"

export default function AddCard() {
  const [storeName, setStoreName] = useState("")
  const [lastFour, setLastFour] = useState("")
  const [balance, setBalance] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [nickname, setNickname] = useState("")
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      await api.post("/api/v1/cards/", {
        store_name: storeName,
        card_last_four: lastFour,
        starting_balance: balance,
        expiration_date: expirationDate || null,
        nickname: nickname || null,
      })
      navigate("/")
    } catch (err) {
      setErrors(err.body && Object.keys(err.body).length ? err.body : { form: [err.message] })
      setSaving(false)
    }
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 640, mx: "auto" }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Add a Gift Card
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Store"
            required
            autoFocus
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            error={Boolean(errors.store_name)}
            helperText={errors.store_name?.[0]}
          />

          <TextField
            label="Last 4 digits"
            required
            value={lastFour}
            onChange={(e) => setLastFour(e.target.value)}
            error={Boolean(errors.card_last_four)}
            helperText={errors.card_last_four?.[0]}
            slotProps={{ htmlInput: { maxLength: 4, inputMode: "numeric" } }}
          />

          <TextField
            label="Starting balance"
            required
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            error={Boolean(errors.starting_balance)}
            helperText={errors.starting_balance?.[0]}
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
              htmlInput: { min: 0.01, step: "0.01" },
            }}
          />

          <TextField
            label="Expiration date"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
            error={Boolean(errors.expiration_date)}
            helperText={errors.expiration_date?.[0] ?? "Leave blank if the card doesn't expire."}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <TextField
            label="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            error={Boolean(errors.nickname)}
            helperText={errors.nickname?.[0]}
          />

          <Alert severity="info">
            We only store the last 4 digits. Never enter your full card number or PIN.
          </Alert>

          {errors.form && <Alert severity="error">{errors.form[0]}</Alert>}

          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button component={RouterLink} to="/">
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              Save Card
            </Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  )
}
