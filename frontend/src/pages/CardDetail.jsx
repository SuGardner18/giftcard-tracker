// src/pages/CardDetail.jsx
import { useEffect, useState } from "react"
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom"
import Alert from "@mui/material/Alert"
import Avatar from "@mui/material/Avatar"
import Button from "@mui/material/Button"
import CircularProgress from "@mui/material/CircularProgress"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Typography from "@mui/material/Typography"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { api } from "../api/client"
import { useAuth } from "../contexts/AuthContext"
import StatusChip from "../components/StatusChip"
import { cardStatus, formatDate, formatMoney } from "../utilities/cards"

// a small label with a value under it
function Stat({ label, children }) {
  return (
    <div>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <div>{children}</div>
    </div>
  )
}

export default function CardDetail() {
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

  const status = cardStatus(card)
  const spent = Number(card.starting_balance) - Number(card.current_balance)
  // newest purchase first (ISO dates sort correctly as plain text)
  const transactions = [...card.transactions].sort((a, b) => b.date.localeCompare(a.date))
  const details = [card.nickname, `****${card.card_last_four}`].filter(Boolean).join(" · ")

  return (
    <>
      <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to Dashboard
      </Button>

      <Paper sx={{ p: 4, mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: "#D8F3EE", color: "primary.main", fontWeight: 700 }}>
            {card.store_name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Typography variant="h4" component="h1">
              {card.store_name}
            </Typography>
            <Typography color="text.secondary">{details}</Typography>
          </div>
        </Stack>

        <Stack direction="row" spacing={6} flexWrap="wrap" useFlexGap>
          <Stat label="Current balance">
            <Typography variant="h4" component="p" sx={{ fontFamily: "inherit", fontWeight: 400, fontSize: 36 }}>
              {formatMoney(card.current_balance)}
            </Typography>
          </Stat>
          <Stat label="Started with">
            <Typography variant="h6" component="p">
              {formatMoney(card.starting_balance)}
            </Typography>
          </Stat>
          <Stat label="Spent">
            <Typography variant="h6" component="p">
              {formatMoney(spent)}
            </Typography>
          </Stat>
          <Stat label="Expires">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h6" component="p">
                {card.expiration_date ? formatDate(card.expiration_date) : "No expiration"}
              </Typography>
              <StatusChip status={status} />
            </Stack>
          </Stat>
        </Stack>
      </Paper>

      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Purchase history
      </Typography>

      {transactions.length === 0 ? (
        <Typography color="text.secondary">No purchases logged yet.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Note</TableCell>
                <TableCell>Added by</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{formatDate(t.date)}</TableCell>
                  <TableCell>{t.note || "—"}</TableCell>
                  <TableCell>{t.entered_by === "scan" ? "Scan" : "Typed"}</TableCell>
                  <TableCell align="right">{formatMoney(t.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  )
}
