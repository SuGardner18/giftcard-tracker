// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import theme from "./theme"
import { AuthProvider } from "./contexts/AuthContext"
import RequireAuth from "./components/RequireAuth"
import AppLayout from "./components/AppLayout"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Dashboard from "./pages/Dashboard"
import AddCard from "./pages/AddCard"
import CardDetail from "./pages/CardDetail"
import EditCard from "./pages/EditCard"
import LogPurchase from "./pages/LogPurchase"
import EditPurchase from "./pages/EditPurchase"

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/cards/new" element={<AddCard />} />
              <Route path="/cards/:id" element={<CardDetail />} />
              <Route path="/cards/:id/edit" element={<EditCard />} />
              <Route path="/cards/:id/purchases/new" element={<LogPurchase />} />
              <Route path="/cards/:id/purchases/:purchaseId/edit" element={<EditPurchase />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
