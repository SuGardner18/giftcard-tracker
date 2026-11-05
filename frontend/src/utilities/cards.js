// src/utilities/cards.js
// Small helpers for showing gift cards. Dates from the API look like "2026-11-25".

// "2026-11-25" becomes "11/25/2026"
export function formatDate(isoDate) {
  if (!isoDate) return ""
  const [year, month, day] = isoDate.split("-")
  return `${month}/${day}/${year}`
}

// "32.5" becomes "$32.50"
export function formatMoney(amount) {
  return Number(amount).toLocaleString("en-US", { style: "currency", currency: "USD" })
}

// days from today until the date (negative if it already passed)
export function daysUntil(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expires = new Date(year, month - 1, day)
  return Math.round((expires - today) / 86400000)
}

// "expired", "soon" (within 30 days), "used" (balance is 0), or "" for a normal card
export function cardStatus(card) {
  if (card.expiration_date) {
    const days = daysUntil(card.expiration_date)
    if (days < 0) return "expired"
    if (Number(card.current_balance) > 0 && days <= 30) return "soon"
  }
  if (Number(card.current_balance) === 0) return "used"
  return ""
}
