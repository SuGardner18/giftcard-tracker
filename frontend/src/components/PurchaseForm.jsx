// src/components/PurchaseForm.jsx
import { useState } from "react"
import { Link as RouterLink } from "react-router-dom"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import InputAdornment from "@mui/material/InputAdornment"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"

const EMPTY = { amount: "", date: "", note: "" }

// title: the heading; subtitle: a line about the card; initial: starting values
// submitLabel: the save button text; cancelTo: where Cancel goes
// onSubmit: called with the data to send to the API
export default function PurchaseForm({ title, subtitle, initial = EMPTY, submitLabel, cancelTo, onSubmit }) {
  const [amount, setAmount] = useState(initial.amount)
  const [date, setDate] = useState(initial.date)
  const [note, setNote] = useState(initial.note)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      await onSubmit({ amount, date, note })
    } catch (err) {
      // DRF sends errors by field, like { amount: ["This is more than the card's balance of $30.00."] }
      setErrors(err.body && Object.keys(err.body).length ? err.body : { form: [err.message] })
      setSaving(false)
    }
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 640, mx: "auto" }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {subtitle}
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
            <Button component={RouterLink} to={cancelTo}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {submitLabel}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Paper>
  )
}
