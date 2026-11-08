// src/components/GiftCardTile.jsx
import { Link as RouterLink } from "react-router-dom"
import Button from "@mui/material/Button"
import Card from "@mui/material/Card"
import CardActions from "@mui/material/CardActions"
import CardContent from "@mui/material/CardContent"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"
import StatusChip from "./StatusChip"
import StoreAvatar from "./StoreAvatar"
import { cardStatus, formatDate, formatMoney } from "../utilities/cards"

export default function GiftCardTile({ card }) {
  const status = cardStatus(card)
  const dimmed = status === "used" || status === "expired"
  // "From Mom · ****1234", or just "****1234" when there is no nickname
  const details = [card.nickname, `****${card.card_last_four}`].filter(Boolean).join(" · ")

  return (
    <Card elevation={1} sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5, p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <StoreAvatar card={card} size={40} />
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
          <Typography variant="overline" color="text.secondary" sx={{ display: "block", lineHeight: 1.5 }}>
            Balance
          </Typography>
          <Typography
            variant="h4"
            component="p"
            color={dimmed ? "text.secondary" : "text.primary"}
            sx={{ fontFamily: "inherit", fontWeight: 400, fontSize: 28 }}
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

      <CardActions sx={{ px: 1, pb: 1 }}>
        <Button component={RouterLink} to={`/cards/${card.id}`} size="small">
          View details
        </Button>
      </CardActions>
    </Card>
  )
}
