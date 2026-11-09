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

// how a card ranks when sorting by "expiring soonest": dated cards by days left,
// then cards with no expiration, then cards that are expired or used up
function expiringRank(card) {
  const status = cardStatus(card)
  if (status === "expired" || status === "used") return 2000000000
  if (!card.expiration_date) return 1000000000
  return daysUntil(card.expiration_date)
}

// apply the search box, the filter chip, and the sort menu to the list of cards
// filter is "all", "soon", or "inactive" (used up or expired)
// sort is "expiring", "balance", or "name"
export function filterAndSortCards(cards, { search, filter, sort }) {
  const term = search.trim().toLowerCase()

  const result = cards.filter((card) => {
    const status = cardStatus(card)
    if (filter === "soon" && status !== "soon") return false
    if (filter === "inactive" && status !== "used" && status !== "expired") return false
    if (term) {
      // the search checks the store, the nickname, and the last 4 digits (typed as 1234 or ****1234)
      const text = `${card.store_name} ${card.nickname ?? ""} ${card.card_last_four} ****${card.card_last_four}`.toLowerCase()
      if (!text.includes(term)) return false
    }
    return true
  })

  result.sort((a, b) => {
    if (sort === "balance") return Number(b.current_balance) - Number(a.current_balance)
    if (sort === "name") return a.store_name.localeCompare(b.store_name)
    return expiringRank(a) - expiringRank(b) || a.store_name.localeCompare(b.store_name)
  })

  return result
}

// the numbers shown on the filter chips
export function countByFilter(cards) {
  let soon = 0
  let inactive = 0
  cards.forEach((card) => {
    const status = cardStatus(card)
    if (status === "soon") soon += 1
    if (status === "used" || status === "expired") inactive += 1
  })
  return { all: cards.length, soon, inactive }
}
