// src/components/StoreAvatar.jsx
import Avatar from "@mui/material/Avatar"

// the store's logo when there is one, otherwise the first letter of its name
// (Avatar also shows the letter if the logo image fails to load)
export default function StoreAvatar({ card, size = 48 }) {
  return (
    <Avatar
      src={card.logo_url ?? undefined}
      alt=""
      // Brandfetch requires the page's origin as the referrer for logo images
      slotProps={{ img: { referrerPolicy: "origin", style: { objectFit: "contain" } } }}
      sx={{
        width: size,
        height: size,
        bgcolor: card.logo_url ? "background.paper" : "#D8F3EE",
        border: card.logo_url ? "1px solid #EADFCF" : "none",
        color: "primary.main",
        fontWeight: 700,
      }}
    >
      {card.store_name.charAt(0).toUpperCase()}
    </Avatar>
  )
}
