// src/pages/AddCard.jsx
import { useNavigate } from "react-router-dom"
import CardForm from "../components/CardForm"
import { api } from "../api/client"

export default function AddCard() {
  const navigate = useNavigate()

  async function handleSave(payload) {
    await api.post("/api/v1/cards/", payload)
    navigate("/")
  }

  return <CardForm title="Add a Gift Card" submitLabel="Save Card" cancelTo="/" onSubmit={handleSave} />
}
