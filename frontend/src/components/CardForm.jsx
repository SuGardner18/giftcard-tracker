// src/components/CardForm.jsx
import { useEffect, useState } from "react"
import { Link as RouterLink } from "react-router-dom"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import InputAdornment from "@mui/material/InputAdornment"
import List from "@mui/material/List"
import ListItemAvatar from "@mui/material/ListItemAvatar"
import ListItemButton from "@mui/material/ListItemButton"
import ListItemText from "@mui/material/ListItemText"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import TextField from "@mui/material/TextField"
import Typography from "@mui/material/Typography"
import { api } from "../api/client"
import StoreAvatar from "./StoreAvatar"

const EMPTY = { storeName: "", storeDomain: "", lastFour: "", balance: "", expirationDate: "", nickname: "" }


export default function CardForm({ title, initial = EMPTY, submitLabel, cancelTo, onSubmit }) {
  const [storeName, setStoreName] = useState(initial.storeName)
  const [storeDomain, setStoreDomain] = useState(initial.storeDomain)
  const [lastFour, setLastFour] = useState(initial.lastFour)
  const [balance, setBalance] = useState(initial.balance)
  const [expirationDate, setExpirationDate] = useState(initial.expirationDate)
  const [nickname, setNickname] = useState(initial.nickname)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  // true only once the user has typed in the Store field (not when Edit loads a saved name)
  const [typed, setTyped] = useState(false)

  // after a short pause in typing, ask our backend for matching brands
  useEffect(() => {
    if (!typed || storeDomain || storeName.trim().length < 2) return

    let cancelled = false
    const timer = setTimeout(() => {
      api.get(`/api/v1/cards/brand-search/?name=${encodeURIComponent(storeName.trim())}`)
        .then((data) => {
          if (!cancelled) setSuggestions(data.results)
        })
        .catch(() => {
          // no suggestions is fine, the store name still works as free text
          if (!cancelled) setSuggestions([])
        })
    }, 350)

    // runs before the next effect: drop the old timer and ignore the old response
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [typed, storeName, storeDomain])

  function pickBrand(brand) {
    setStoreName(brand.name ?? brand.domain)
    setStoreDomain(brand.domain)
    setSuggestions([])
  }

  const showSuggestions =
    typed && !storeDomain && storeName.trim().length >= 2 && suggestions.length > 0

  async function handleSubmit(e) {
    e.preventDefault()
    setErrors({})
    setSaving(true)
    try {
      await onSubmit({
        store_name: storeName,
        store_domain: storeDomain || null,
        card_last_four: lastFour,
        starting_balance: balance,
        expiration_date: expirationDate || null,
        nickname: nickname || null,
      })
    } catch (err) {
      setErrors(err.body && Object.keys(err.body).length ? err.body : { form: [err.message] })
      setSaving(false)
    }
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 640, mx: "auto" }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        {title}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <Stack sx={{ position: "relative" }}>
            <TextField
              label="Store"
              required
              autoFocus
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value)
                setStoreDomain("") // typing again clears the chosen brand
                setTyped(true)
              }}
              error={Boolean(errors.store_name)}
              helperText={errors.store_name?.[0]}
              onBlur={() => setSuggestions([])}
            />

            {showSuggestions && (
              <Paper
                elevation={8}
                onMouseDown={(e) => e.preventDefault()}
                sx={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, mt: 0.5 }}
              >
                <List dense disablePadding>
                  {suggestions.map((brand) => (
                    <ListItemButton key={brand.domain} onClick={() => pickBrand(brand)}>
                      <ListItemAvatar>
                        <StoreAvatar
                          card={{ store_name: brand.name ?? brand.domain, logo_url: brand.icon }}
                          size={32}
                        />
                      </ListItemAvatar>
                      <ListItemText primary={brand.name ?? brand.domain} secondary={brand.domain} />
                    </ListItemButton>
                  ))}
                  <ListItemButton onClick={() => setSuggestions([])}>
                    <ListItemText primary={`Use "${storeName.trim()}" without a logo`} />
                  </ListItemButton>
                </List>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", px: 2, py: 1, borderTop: "1px solid #EADFCF" }}
                >
                  {"Not here? Keep typing your store's name. We will use a letter instead of a logo."}
                </Typography>
              </Paper>
            )}
          </Stack>

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
