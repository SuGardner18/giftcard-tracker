// src/pages/Dashboard.jsx
import { useEffect, useState } from "react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import Alert from "@mui/material/Alert"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Grid from "@mui/material/Grid"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import AddIcon from "@mui/icons-material/Add"
import EmailIcon from "@mui/icons-material/Email"
import { api } from "../api/client"
import { useAuth } from "../contexts/AuthContext"
import GiftCardList from "../components/GiftCardList"
import GiftCardTile from "../components/GiftCardTile"
import DashboardToolbar from "../components/DashboardToolbar"
import { countByFilter, filterAndSortCards, formatMoney } from "../utilities/cards"

export default function Dashboard() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [sort, setSort] = useState("expiring")
  const [view, setView] = useState("grid")
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

  // ask the API to email me the cards that expire within 30 days
  async function handleReminders() {
    setNotice(null)
    try {
      const data = await api.post("/api/v1/cards/reminders/")
      setNotice({ severity: "success", text: data.message })
    } catch (err) {
      setNotice({ severity: "error", text: err.body?.error ?? err.message })
    }
  }

  if (loading) return <CircularProgress aria-label="Loading your gift cards" />

  const visibleCards = filterAndSortCards(cards, { search, filter, sort })
  const counts = countByFilter(cards)
  const totalBalance = cards.reduce((sum, card) => sum + Number(card.current_balance), 0)

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        useFlexGap
        spacing={2}
        sx={{ mb: 3 }}
      >
        <div>
          <Typography variant="h4" component="h1">
            My Gift Cards
          </Typography>
          {cards.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {cards.length} {cards.length === 1 ? "card" : "cards"} · {formatMoney(totalBalance)} total balance
            </Typography>
          )}
        </div>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" startIcon={<EmailIcon />} onClick={handleReminders}>
            Email me expiring cards
          </Button>
          <Button component={RouterLink} to="/cards/new" variant="contained" startIcon={<AddIcon />}>
            Add Card
          </Button>
        </Stack>
      </Stack>

      {notice && (
        <Alert severity={notice.severity} sx={{ mb: 3 }} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error: {error}
        </Alert>
      )}

      {cards.length === 0 && !error && (
        <Typography color="text.secondary">You haven't added any gift cards yet.</Typography>
      )}

      {cards.length > 0 && (
        <>
          <DashboardToolbar
            search={search}
            onSearchChange={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            sort={sort}
            onSortChange={setSort}
            view={view}
            onViewChange={setView}
            counts={counts}
          />

          {visibleCards.length === 0 && (
            <Typography color="text.secondary">No cards match your search.</Typography>
          )}

          {view === "grid" && (
            <Grid container spacing={3}>
              {visibleCards.map((card) => (
                <Grid key={card.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <GiftCardTile card={card} />
                </Grid>
              ))}
            </Grid>
          )}

          {view === "list" && visibleCards.length > 0 && <GiftCardList cards={visibleCards} />}
        </>
      )}
    </>
  )
}
