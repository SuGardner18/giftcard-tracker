// src/api/client.js
// src/api/client.js
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000"

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("token")

  const config = {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Token ${token}` }),
    },
    ...options,
  }

  let response
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, config)
  } catch (err) {
    // Network error: the server is unreachable, so there is no HTTP status at all
    const networkError = new Error("Unable to connect to server")
    networkError.status = 0
    throw networkError
  }

  if (response.status === 401) {
    // Token expired or invalid. Clear it and let the component decide what to do.
    localStorage.removeItem("token")
    const authError = new Error("Session expired, please log in again")
    authError.status = 401
    throw authError
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const error = new Error(`HTTP ${response.status}`)
    error.status = response.status
    error.body = body
    throw error
  }

  // 204 No Content has no body to parse (DELETE returns this)
  if (response.status === 204) return null
  return response.json()
}

export const api = {
  get: (endpoint) => apiRequest(endpoint),
  post: (endpoint, data) =>
    apiRequest(endpoint, { method: "POST", body: JSON.stringify(data) }),
  put: (endpoint, data) =>
    apiRequest(endpoint, { method: "PUT", body: JSON.stringify(data) }),
  delete: (endpoint) => apiRequest(endpoint, { method: "DELETE" }),
}