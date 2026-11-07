// src/components/StatusChip.jsx
import Chip from "@mui/material/Chip"

// the label and colors for each status that cardStatus() can return
const STATUS_CHIPS = {
  soon: { label: "Expiring soon", bg: "#FFE3DD", color: "#8F2A1A" },
  expired: { label: "Expired", bg: "#ECE8F3", color: "#4A3D6B" },
  used: { label: "Used up", bg: "#ECE8F3", color: "#4A3D6B" },
}

export default function StatusChip({ status }) {
  const chip = STATUS_CHIPS[status]
  if (!chip) return null
  return (
    <Chip
      size="small"
      label={chip.label}
      sx={{ bgcolor: chip.bg, color: chip.color, fontWeight: 700, textTransform: "uppercase" }}
    />
  )
}
