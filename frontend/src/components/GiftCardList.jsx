// src/components/GiftCardList.jsx
import { Link as RouterLink, useNavigate } from "react-router-dom"
import Paper from "@mui/material/Paper"
import Stack from "@mui/material/Stack"
import Table from "@mui/material/Table"
import TableBody from "@mui/material/TableBody"
import TableCell from "@mui/material/TableCell"
import TableContainer from "@mui/material/TableContainer"
import TableHead from "@mui/material/TableHead"
import TableRow from "@mui/material/TableRow"
import Typography from "@mui/material/Typography"
import ChevronRightIcon from "@mui/icons-material/ChevronRight"
import StatusChip from "./StatusChip"
import StoreAvatar from "./StoreAvatar"
import { cardStatus, formatDate, formatMoney } from "../utilities/cards"

// the look of the column titles in the header row
const HEADER_CELL = { fontSize: 12, fontWeight: 500, letterSpacing: 0.4, textTransform: "uppercase", color: "text.secondary" }

// below the md breakpoint (900px) these two columns are hidden, and their details show under the store name instead
const HIDE_ON_SMALL = { display: { xs: "none", md: "table-cell" } }

// the same cards as the tiles, as a compact table with one row per card
export default function GiftCardList({ cards }) {
  const navigate = useNavigate()

  return (
    <TableContainer component={Paper} elevation={1}>
      <Table aria-label="Gift cards" sx={{ "& .MuiTableCell-root": { px: { xs: 1.5, md: 2 } } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={HEADER_CELL}>Store</TableCell>
            <TableCell sx={HEADER_CELL}>Balance</TableCell>
            <TableCell sx={{ ...HEADER_CELL, ...HIDE_ON_SMALL }}>Expires</TableCell>
            <TableCell sx={{ ...HEADER_CELL, ...HIDE_ON_SMALL }}>Status</TableCell>
            <TableCell sx={HIDE_ON_SMALL} />
          </TableRow>
        </TableHead>
        <TableBody>
          {cards.map((card) => {
            const status = cardStatus(card)
            const dimmed = status === "used" || status === "expired"
            // "From Mom · ****1234", or just "****1234" when there is no nickname
            const details = [card.nickname, `****${card.card_last_four}`].filter(Boolean).join(" · ")

            return (
              <TableRow
                key={card.id}
                hover
                onClick={() => navigate(`/cards/${card.id}`)}
                sx={{ cursor: "pointer" }}
              >
                <TableCell>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <StoreAvatar card={card} size={40} />
                    <div>
                      <Typography
                        component={RouterLink}
                        to={`/cards/${card.id}`}
                        // the link already goes to the card, so the row's click must not run too
                        onClick={(e) => e.stopPropagation()}
                        variant="subtitle1"
                        sx={{ display: "block", color: "inherit", textDecoration: "none", fontWeight: 500 }}
                      >
                        {card.store_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {details}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                        sx={{ display: { xs: "flex", md: "none" }, mt: 0.5 }}
                      >
                        <Typography variant="caption" color="text.secondary">
                          {card.expiration_date ? `Expires ${formatDate(card.expiration_date)}` : "No expiration"}
                        </Typography>
                        <StatusChip status={status} />
                      </Stack>
                    </div>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography color={dimmed ? "text.secondary" : "text.primary"} sx={{ fontSize: 18, fontWeight: 500 }}>
                    {formatMoney(card.current_balance)}
                  </Typography>
                </TableCell>
                <TableCell sx={HIDE_ON_SMALL}>
                  <Typography variant="body2" color="text.secondary">
                    {card.expiration_date ? `Expires ${formatDate(card.expiration_date)}` : "No expiration"}
                  </Typography>
                </TableCell>
                <TableCell sx={HIDE_ON_SMALL}>
                  <StatusChip status={status} />
                </TableCell>
                <TableCell align="right" sx={HIDE_ON_SMALL}>
                  <ChevronRightIcon color="action" />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
