// src/components/GiftCardTile.jsx
import { Link as RouterLink } from "react-router-dom"
import Avatar from "@mui/material/Avatar"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardActions from "@mui/material/CardActions"
import CardContent from "@mui/material/CardContent"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import StatusChip from "./StatusChip"
import { cardStatus, formatDate, formatMoney } from "../utilities/cards"

export default function GiftCardTile({ card }) {
  const status = cardStatus(card)
  const dimmed = status === "used" || status === "expired"
  // "From Mom · ****1234", or just "****1234" when there is no nickname
  const details = [card.nickname, `****${card.card_last_four}`].filter(Boolean).join(" · ")

  return (
    <Card elevation={1} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2.5, p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar sx={{ width: 48, height: 48, bgcolor: "#D8F3EE", color: "primary.main", fontWeight: 700 }}>
            {card.store_name.charAt(0).toUpperCase()}
          </Avatar>
          <div>
            <Typography variant="h6" component="h2">
              {card.store_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {details}
            </Typography>
          </div>
        </Stack>

        <div>
          <Typography variant="overline" color="text.secondary">
            Balance
          </Typography>
          <Typography
            variant="h4"
            component="p"
            color={dimmed ? "text.secondary" : "text.primary"}
            sx={{ fontFamily: "inherit", fontWeight: 400, fontSize: 36 }}
          >
            {formatMoney(card.current_balance)}
          </Typography>
        </div>

        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
          <Typography variant="body2" color="text.secondary">
            {card.expiration_date ? `Expires ${formatDate(card.expiration_date)}` : "No expiration"}
          </Typography>
          <StatusChip status={status} />
        </Stack>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button component={RouterLink} to={`/cards/${card.id}`}>
          View details
        </Button>
      </CardActions>
    </Card>
  )
}
